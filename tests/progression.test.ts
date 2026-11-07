import test from 'node:test';
import assert from 'node:assert/strict';
import {newFarm,parseSave,serialize,tendFlower,unlockWithStars,expandWithStars,expandPen,buyAnimal,buyDecoration,plant} from '../assets/scripts/FarmModel';
const NOW=1800000000000;
test('v0.1 saves migrate to the reference field order without losing owned crops or resources',()=>{
 const old:any=newFarm(NOW);delete old.layoutVersion;delete old.stars;delete old.beds;delete old.penBonus;delete old.cropUnlocks;
 old.plots[4].unlocked=false;old.plots[18]={unlocked:true,crop:'carrot',plantedAt:NOW-23000,watered:true};
 old.coins=472;old.inventory.milk=7;old.decorations.push({type:'cherry',x:880,y:612});
 const raw=JSON.stringify(old),loaded=parseSave(raw,NOW)!;assert.ok(loaded);assert.equal(loaded.layoutVersion,2);
 assert.equal(loaded.coins,472);assert.equal(loaded.inventory.milk,7);assert.equal(loaded.plots.filter(p=>p.unlocked).length,9);
 assert.ok(loaded.plots.slice(0,9).every(p=>p.unlocked));assert.deepEqual(loaded.plots[8],old.plots[18]);
 assert.deepEqual(loaded.decorations,old.decorations);assert.deepEqual(loaded.penBonus,{hen:0,cow:0});assert.equal(loaded.beds.length,18);
 assert.deepEqual(JSON.parse(raw),old);
});
test('flowers charge once, mature offline, and award one star per harvest',()=>{
 const s=newFarm(NOW),coins=s.coins;assert.equal(tendFlower(s,0,NOW).ok,true);assert.equal(s.coins,coins-5);
 assert.equal(tendFlower(s,0,NOW+59999).ok,false);assert.equal(s.coins,coins-5);
 const loaded=parseSave(serialize(s,NOW),NOW+60000)!;assert.equal(tendFlower(loaded,0,NOW+60000).ok,true);
 assert.equal(loaded.coins,coins+7);assert.equal(loaded.stars,1);assert.equal(loaded.beds[0],0);
 assert.equal(tendFlower(loaded,-1,NOW).ok,false);assert.equal(tendFlower(loaded,18,NOW).ok,false);
});
test('star crop unlocks and new land persist and cannot charge twice',()=>{
 const s=newFarm(NOW);s.stars=30;assert.equal(unlockWithStars(s,'tomato').ok,true);assert.equal(s.stars,15);
 assert.equal(unlockWithStars(s,'tomato').ok,false);assert.equal(s.stars,15);assert.equal(plant(s,4,'tomato',NOW).ok,true);
 assert.equal(expandWithStars(s).ok,true);assert.equal(s.stars,0);assert.equal(s.plots.filter(p=>p.unlocked).length,10);
 assert.equal(expandWithStars(s).ok,false);assert.deepEqual(parseSave(serialize(s,NOW))?.cropUnlocks,['tomato']);
});
test('pen upgrades extend purchase capacity with a strict maximum',()=>{
 const s=newFarm(NOW);s.stars=500;s.coins=100000;s.xp=2000;
 for(let i=0;i<3;i++)assert.equal(expandPen(s,'hen').ok,true);const stars=s.stars;assert.equal(expandPen(s,'hen').ok,false);assert.equal(s.stars,stars);
 for(let i=3;i<14;i++)assert.equal(buyAnimal(s,'hen',NOW).ok,true);assert.equal(buyAnimal(s,'hen',NOW).ok,false);
 for(let i=0;i<2;i++)assert.equal(expandPen(s,'cow').ok,true);assert.equal(expandPen(s,'cow').ok,false);
 for(let i=1;i<6;i++)assert.equal(buyAnimal(s,'cow',NOW).ok,true);assert.equal(buyAnimal(s,'cow',NOW).ok,false);
 assert.equal(parseSave(serialize(s,NOW))?.animals.length,20);
});
test('special decorations require a completed task and spend stars atomically',()=>{
 const s=newFarm(NOW);s.stars=20;const coins=s.coins;assert.equal(buyDecoration(s,'sunflower',10,17).ok,false);assert.equal(s.stars,20);
 s.claimed.push('first-harvest');assert.equal(buyDecoration(s,'sunflower',10,17).ok,true);assert.equal(s.stars,12);assert.equal(s.coins,coins);
 assert.deepEqual(parseSave(serialize(s,NOW))?.decorations,[{type:'sunflower',x:10,y:17}]);
 s.stars=0;assert.equal(buyDecoration(s,'sunflower',11,17).ok,false);assert.equal(s.decorations.length,1);
});
