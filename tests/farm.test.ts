import test from 'node:test';
import assert from 'node:assert/strict';
import {newFarm,plant,harvest,water,sell,deliver,expand,collectAnimal,buyAnimal,claimTask,buyDecoration,readyPlot,secondsLeft,serialize,parseSave,levelFor,expansionCost} from '../assets/scripts/FarmModel';
const NOW=1800000000000;
test('a planted crop costs money once and cannot be harvested early',()=>{
 const s=newFarm(NOW),before=s.coins;assert.equal(plant(s,4,'wheat',NOW).ok,true);assert.equal(s.coins,before-5);
 assert.equal(plant(s,4,'wheat',NOW).ok,false);assert.equal(harvest(s,4,NOW+19999).ok,false);
 assert.equal(harvest(s,4,NOW+20000).ok,true);assert.equal(harvest(s,4,NOW+20001).ok,false);assert.equal(s.inventory.wheat,3);
});
test('one watering shortens growth by 20% without allowing repeat speedups',()=>{
 const s=newFarm(NOW);plant(s,4,'carrot',NOW);assert.equal(water(s,4,NOW).ok,true);assert.equal(secondsLeft(s.plots[4],NOW),36);
 assert.equal(water(s,4,NOW).ok,false);assert.equal(readyPlot(s.plots[4],NOW+35999),false);assert.equal(readyPlot(s.plots[4],NOW+36000),true);
});
test('locked crops, locked plots and insufficient coins cannot mutate state',()=>{
 const s=newFarm(NOW);const raw=serialize(s,NOW);assert.equal(plant(s,4,'pumpkin',NOW).ok,false);assert.equal(plant(s,29,'wheat',NOW).ok,false);assert.equal(serialize(s,NOW),raw);
 s.coins=4;assert.equal(plant(s,4,'wheat',NOW).ok,false);assert.equal(s.coins,4);
});
test('selling rejects negative and excessive quantities',()=>{
 const s=newFarm(NOW),coins=s.coins;assert.equal(sell(s,'wheat',-1).ok,false);assert.equal(sell(s,'wheat',3).ok,false);
 assert.equal(sell(s,'wheat',2).ok,true);assert.equal(s.coins,coins+20);assert.equal(s.inventory.wheat,0);
});
test('order delivery is atomic, pays correctly and cannot be replayed',()=>{
 const s=newFarm(NOW),o=s.orders[0],before=serialize(s,NOW);assert.equal(deliver(s,o.id).ok,false);assert.equal(serialize(s,NOW),before);
 s.inventory.wheat=3;s.inventory.carrot=1;const coins=s.coins;assert.equal(deliver(s,o.id).ok,true);assert.equal(s.inventory.wheat,0);assert.equal(s.inventory.carrot,0);assert.equal(s.coins,coins+o.coins);assert.equal(s.xp,o.xp);
 assert.equal(deliver(s,o.id).ok,false);assert.equal(s.stats.deliveries,1);assert.notEqual(s.orders[0].id,o.id);
});
test('expansion charges increasing prices and stops at 30 plots',()=>{
 const s=newFarm(NOW);assert.equal(expansionCost(s),60);assert.equal(expand(s).ok,true);assert.equal(s.coins,60);assert.equal(expansionCost(s),100);
 s.coins=100000;while(s.plots.some(p=>!p.unlocked))assert.equal(expand(s).ok,true);const coins=s.coins;assert.equal(expand(s).ok,false);assert.equal(s.coins,coins);assert.equal(s.stats.expansions,21);
});
test('animal products cannot be collected twice in a cooldown',()=>{
 const s=newFarm(NOW);assert.equal(collectAnimal(s,3,NOW).ok,true);assert.equal(collectAnimal(s,3,NOW).ok,false);assert.equal(s.inventory.egg,1);
 assert.equal(collectAnimal(s,3,NOW+40000).ok,true);assert.equal(s.inventory.egg,2);assert.equal(collectAnimal(s,4,NOW+80000).ok,true);assert.equal(s.inventory.milk,1);
});
test('animal purchases enforce level, funds and capacity',()=>{
 const s=newFarm(NOW);assert.equal(buyAnimal(s,'hen',NOW).ok,false);s.xp=100;s.coins=10000;
 for(let i=0;i<5;i++)assert.equal(buyAnimal(s,'hen',NOW).ok,true);const coins=s.coins;
 assert.equal(buyAnimal(s,'hen',NOW).ok,false);assert.equal(s.coins,coins);assert.equal(s.animals.filter(a=>a.type==='hen').length,8);
});
test('task rewards have progress gates and pay only once',()=>{
 const s=newFarm(NOW);assert.equal(claimTask(s,'first-harvest').ok,false);s.stats.harvests=5;
 const coins=s.coins;assert.equal(claimTask(s,'first-harvest').ok,true);assert.equal(s.coins,coins+50);assert.equal(claimTask(s,'first-harvest').ok,false);assert.equal(s.coins,coins+50);
});
test('offline growth and animal deadlines survive serialization',()=>{
 const s=newFarm(NOW);plant(s,4,'carrot',NOW);collectAnimal(s,3,NOW);
 const loaded=parseSave(serialize(s,NOW),NOW+3600000)!;assert.ok(loaded);assert.equal(readyPlot(loaded.plots[4],NOW+3600000),true);
 assert.equal(collectAnimal(loaded,1,NOW+3600000).ok,true);assert.deepEqual(loaded.claimed,s.claimed);
});
test('corrupt or unsafe saves are rejected, not partially loaded',()=>{
 assert.equal(parseSave('{'),null);assert.equal(parseSave('{}'),null);
 const s=newFarm(NOW);assert.ok(parseSave(serialize(s,NOW)));
 for(const mutate of [(v:any)=>v.coins=-1,(v:any)=>v.inventory.wheat='3',(v:any)=>v.plots.pop(),(v:any)=>v.plots[0].crop='unknown',(v:any)=>v.orders[0].needs={fake:1},(v:any)=>v.animals.push(v.animals[0]),(v:any)=>v.orders[1].id=v.orders[0].id]){
   const v=JSON.parse(serialize(s,NOW));mutate(v);assert.equal(parseSave(JSON.stringify(v)),null);
 }
});
test('decorations debit money and remain in the restored farm',()=>{
 const s=newFarm(NOW);s.xp=80;s.coins=500;const coins=s.coins;assert.equal(buyDecoration(s,'cherry',10,17).ok,true);assert.equal(s.coins,coins-120);
 assert.deepEqual(parseSave(serialize(s,NOW))?.decorations,[{type:'cherry',x:10,y:17}]);
});
test('level boundaries unlock progressively',()=>{assert.equal(levelFor(0),1);assert.equal(levelFor(19),1);assert.equal(levelFor(20),2);assert.equal(levelFor(80),3);});
