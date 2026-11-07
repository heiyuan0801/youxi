import test from 'node:test';
import assert from 'node:assert/strict';
import {newFarm,parseSave,serialize,plant,harvest,water,readyPlot,secondsLeft,collectAnimal,PRODUCTS,sell,makeOrder,deliver} from '../assets/scripts/FarmModel';
import {enqueueCraft,collectCraft,buyUpgrade,queueCapacity,recipeSeconds,RECIPES,dayKey,rollDaily,dailyProgress,claimDaily,claimDailyBonus,castLine,reelLine,buyBait,fishingPhase,refreshFeatures,discover,claimAlbum,discoveredCount} from '../assets/scripts/FarmFeatures';
const NOW=Date.parse('2026-11-06T04:00:00Z');
function stocked(){const s=newFarm(NOW);s.coins=5000;s.xp=2000;s.stars=100;for(const id of PRODUCTS)s.inventory[id]=20;return s;}
test('recipes prepay ingredients atomically and enforce serial queue capacity',()=>{
 const s=newFarm(NOW),before=serialize(s,NOW);assert.equal(enqueueCraft(s,'bread',NOW).ok,false);assert.equal(serialize(s,NOW),before);
 s.inventory.egg=2;assert.equal(enqueueCraft(s,'bread',NOW).ok,true);assert.equal(s.inventory.wheat,0);assert.equal(s.inventory.egg,1);
 s.inventory.wheat=4;assert.equal(enqueueCraft(s,'bread',NOW).ok,true);assert.equal(s.features.jobs[1].startedAt,s.features.jobs[0].readyAt);
 const full=serialize(s,NOW);assert.equal(enqueueCraft(s,'bread',NOW).ok,false);assert.equal(serialize(s,NOW),full);assert.equal(s.features.jobs.length,2);
});
test('crafting finishes offline, credits inventory/discovery/XP once, and preserves queued deadlines',()=>{
 const s=stocked();enqueueCraft(s,'bread',NOW);enqueueCraft(s,'cheese',NOW);assert.equal(collectCraft(s,1,NOW+29999).ok,false);
 const loaded=parseSave(serialize(s,NOW),NOW+3600000)!;assert.ok(loaded);const xp=loaded.xp;assert.equal(collectCraft(loaded,1,NOW+3600000).ok,true);assert.equal(loaded.inventory.bread,21);assert.equal(loaded.xp,xp+8);
 assert.equal(collectCraft(loaded,1,NOW+3600000).ok,false);assert.equal(collectCraft(loaded,2,NOW+3600000).ok,true);assert.equal(loaded.features.stats.crafted,2);assert.equal(loaded.features.album.counts.bread,1);
});
test('recipe level gates prevent spending and permanent upgrades have a strict level/funds/max gate',()=>{
 const s=newFarm(NOW);s.inventory.milk=10;assert.equal(enqueueCraft(s,'cheese',NOW).ok,false);assert.equal(s.inventory.milk,10);
 assert.equal(buyUpgrade(s,'irrigation').ok,false);s.xp=2000;s.coins=5000;s.stars=100;
 for(let i=0;i<3;i++)assert.equal(buyUpgrade(s,'irrigation').ok,true);const raw=serialize(s,NOW);assert.equal(buyUpgrade(s,'irrigation').ok,false);assert.equal(serialize(s,NOW),raw);
 assert.equal(s.features.upgrades.irrigation,3);assert.equal(s.coins,3470);assert.equal(s.stars,88);
});
test('water channels affect only new crops and watering still shortens the upgraded duration once',()=>{
 const s=stocked();plant(s,4,'carrot',NOW);assert.equal(secondsLeft(s.plots[4],NOW),45);buyUpgrade(s,'irrigation');assert.equal(secondsLeft(s.plots[4],NOW),45);
 plant(s,5,'wheat',NOW);assert.equal(secondsLeft(s.plots[5],NOW),18);water(s,5,NOW);assert.equal(readyPlot(s.plots[5],NOW+14399),false);assert.equal(readyPlot(s.plots[5],NOW+14400),true);
 assert.equal(water(s,5,NOW).ok,false);assert.ok(parseSave(serialize(s,NOW)));
});
test('workshop and animal upgrades shorten the next production without altering an active job',()=>{
 const s=stocked();enqueueCraft(s,'bread',NOW);const deadline=s.features.jobs[0].readyAt;buyUpgrade(s,'workshop');assert.equal(queueCapacity(s),3);assert.equal(s.features.jobs[0].readyAt,deadline);assert.equal(recipeSeconds(s,RECIPES[0]),25.5);
 enqueueCraft(s,'bread',NOW);assert.equal(s.features.jobs[1].readyAt-s.features.jobs[1].startedAt,25500);
 const animalDeadline=s.animals[0].readyAt;buyUpgrade(s,'animalCare');assert.equal(s.animals[0].readyAt,animalDeadline);collectAnimal(s,3,NOW);assert.equal(s.animals[2].readyAt,NOW+36000);
});
test('daily counters are scoped to Beijing dates and roll over before the first action of a new day',()=>{
 assert.equal(dayKey(Date.parse('2026-11-06T15:59:59Z')),'2026-11-06');assert.equal(dayKey(Date.parse('2026-11-06T16:00:00Z')),'2026-11-07');
 const s=newFarm(NOW);harvest(s,0,NOW);assert.equal(dailyProgress(s,'harvest'),1);const tomorrow=NOW+86400000;harvest(s,1,tomorrow);assert.equal(dailyProgress(s,'harvest'),1);assert.equal(s.features.daily.day,'2026-11-07');
 assert.equal(rollDaily(s,NOW),false);assert.equal(dailyProgress(s,'harvest'),1);
});
test('daily claims and any-three bonus pay once and cannot turn old lifetime progress into a new reward',()=>{
 const s=newFarm(NOW);s.stats.harvests=6;s.stats.products=3;s.stats.deliveries=1;const coins=s.coins;
 for(const id of ['harvest','animals','delivery'])assert.equal(claimDaily(s,id,NOW).ok,true);assert.equal(s.coins,coins+155);assert.equal(claimDaily(s,'harvest',NOW).ok,false);
 assert.equal(claimDailyBonus(s,NOW).ok,true);assert.equal(s.features.fishing.bait,7);assert.equal(s.stars,6);const paid=s.coins;assert.equal(claimDailyBonus(s,NOW).ok,false);assert.equal(s.coins,paid);
 assert.equal(claimDaily(s,'harvest',NOW+86400000).ok,false);assert.equal(dailyProgress(s,'harvest'),0);assert.equal(s.features.daily.bonusClaimed,false);
});
test('fishing stores the outcome at casting and accepts a single reel only inside the bite window',()=>{
 const s=newFarm(NOW);assert.equal(castLine(s,NOW).ok,true);assert.equal(s.features.fishing.bait,4);const cast={...s.features.fishing.cast!};assert.equal(castLine(s,NOW+500).ok,false);assert.equal(reelLine(s,NOW+1000).ok,false);
 const loaded=parseSave(serialize(s,NOW),cast.biteAt)!;assert.deepEqual(loaded.features.fishing.cast,cast);assert.equal(fishingPhase(loaded,cast.biteAt),'bite');assert.equal(reelLine(loaded,cast.biteAt).ok,true);assert.equal(loaded.inventory[cast.reward],1);assert.equal(loaded.features.stats.catches,1);assert.equal(reelLine(loaded,cast.biteAt+1).ok,false);
});
test('missed fish cannot be claimed after refresh and a new cast spends another bait',()=>{
 const s=newFarm(NOW);castLine(s,NOW);const end=s.features.fishing.cast!.escapeAt;assert.equal(reelLine(s,end+1).ok,false);assert.equal(s.features.stats.catches,0);
 const loaded=parseSave(serialize(s,NOW),end+1)!;assert.equal(fishingPhase(loaded,end+1),'escaped');assert.equal(reelLine(loaded,end+1).ok,false);assert.equal(castLine(loaded,end+1).ok,true);assert.equal(loaded.features.fishing.bait,3);
});
test('bait regenerates offline to five, purchases are atomic, and extra reward bait is not discarded',()=>{
 const s=newFarm(NOW);castLine(s,NOW);refreshFeatures(s,NOW+299999);assert.equal(s.features.fishing.bait,4);refreshFeatures(s,NOW+300000);assert.equal(s.features.fishing.bait,5);
 s.features.fishing.bait=0;refreshFeatures(s,NOW+3600000);assert.equal(s.features.fishing.bait,5);assert.equal(buyBait(s,NOW).ok,true);assert.equal(s.features.fishing.bait,10);refreshFeatures(s,NOW+86400000);assert.equal(s.features.fishing.bait,10);
 s.coins=0;assert.equal(buyBait(s,NOW).ok,false);assert.equal(s.features.fishing.bait,10);
});
test('album keeps discoveries after selling and milestone rewards cannot repeat',()=>{
 const s=stocked();for(const id of ['wheat','carrot','egg','fish'] as const)discover(s,id);assert.equal(discoveredCount(s),4);assert.equal(claimAlbum(s,8).ok,false);const coins=s.coins;
 assert.equal(claimAlbum(s,4).ok,true);assert.equal(s.coins,coins+80);assert.equal(claimAlbum(s,4).ok,false);sell(s,'fish',20);assert.equal(discoveredCount(s),4);assert.equal(parseSave(serialize(s,NOW))!.features.album.counts.fish,1);
});
test('legacy v0.2 saves retain resources and timers while receiving extension defaults',()=>{
 const old:any=newFarm(NOW);delete old.features;for(const id of ['bread','cheese','jam','pie','fish','goldenFish'])delete old.inventory[id];old.coins=791;old.inventory.wheat=9;old.inventory.egg=7;
 const raw=JSON.stringify(old),loaded=parseSave(raw,NOW)!;assert.ok(loaded);assert.equal(loaded.coins,791);assert.equal(loaded.inventory.wheat,9);assert.equal(loaded.inventory.egg,7);assert.equal(loaded.inventory.bread,0);assert.deepEqual(loaded.plots,old.plots);assert.deepEqual(loaded.animals,old.animals);assert.equal(loaded.features.fishing.bait,5);assert.equal(loaded.features.album.counts.egg,7);assert.equal(JSON.stringify(old),raw);
});
test('unsafe or unknown feature state is rejected rather than silently erasing progress',()=>{
 const base=stocked();for(const mutate of [(s:any)=>s.features.schema=2,(s:any)=>s.features.upgrades.workshop=4,(s:any)=>s.features.fishing.bait=-1,(s:any)=>s.features.album.counts.fake=1,(s:any)=>s.features.daily.claimed=['harvest','harvest'],(s:any)=>s.inventory.bread=-1,(s:any)=>s.plots[0].growSeconds=0]){const s=JSON.parse(serialize(base,NOW));mutate(s);assert.equal(parseSave(JSON.stringify(s),NOW),null);}
});
test('artisan orders unlock by level and can be completed with crafted and caught products',()=>{
 const low=Array.from({length:50},(_,i)=>makeOrder(i,1));assert.ok(low.some(o=>o.needs.fish));assert.ok(low.every(o=>!o.needs.pie&&!o.needs.cheese&&!o.needs.jam&&!o.needs.bread));
 const all=Array.from({length:50},(_,i)=>makeOrder(i,8));assert.ok(all.some(o=>o.needs.pie&&o.needs.goldenFish));const s=stocked();const order=all.find(o=>o.needs.bread)!;s.orders[0]=order;s.orderSequence=100;assert.equal(deliver(s,order.id,NOW).ok,true);assert.equal(s.inventory.bread,19);
});
