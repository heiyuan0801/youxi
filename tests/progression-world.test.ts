import test from 'node:test';
import assert from 'node:assert/strict';
import {newFarm,parseSave,serialize,plant,harvest,expand,buyAnimal,sell,makeOrder} from '../assets/scripts/FarmModel';
import {claimLevelReward,levelReward,unclaimedLevels,openRegion,worldWidth,collectOrchard,animalCapacity} from '../assets/scripts/FarmProgression';
import {enqueueCraft,collectCraft} from '../assets/scripts/FarmFeatures';
import {PLOTS,freeGrass} from '../assets/scripts/SceneLayout';
import {FarmMotion} from '../assets/scripts/FarmMotion';
const NOW=Date.parse('2026-11-06T10:00:00Z');
const funded=()=>{const s=newFarm(NOW);s.xp=2000;s.coins=1000000;s.stars=1000;return s;};
test('level rewards are gated, paid exactly once and survive save/load',()=>{
 const s=newFarm(NOW),raw=serialize(s,NOW);assert.equal(claimLevelReward(s,2).ok,false);assert.equal(serialize(s,NOW),raw);s.xp=260;const coins=s.coins,stars=s.stars;
 assert.equal(claimLevelReward(s,5).ok,true);assert.equal(s.coins,coins+levelReward(5).coins);assert.equal(s.stars,stars+2);const loaded=parseSave(serialize(s,NOW),NOW)!;assert.equal(claimLevelReward(loaded,5).ok,false);assert.deepEqual(unclaimedLevels(loaded),[2,3,4]);
});
test('all earned levels may be claimed once, including skipped levels and bait milestones',()=>{
 const s=funded();s.xp=200000;const bait=s.features.fishing.bait;assert.equal(unclaimedLevels(s).length,99);for(const level of unclaimedLevels(s))assert.equal(claimLevelReward(s,level).ok,true);assert.equal(unclaimedLevels(s).length,0);assert.ok(s.features.fishing.bait>bait);assert.equal(claimLevelReward(s,101).ok,false);assert.equal(claimLevelReward(s,1).ok,false);assert.ok(parseSave(serialize(s,NOW),NOW));
});
test('region expansion requires level, funds and order without spending on failure',()=>{
 const s=newFarm(NOW),raw=serialize(s,NOW);assert.equal(openRegion(s,'meadow',NOW).ok,false);assert.equal(openRegion(s,'orchard',NOW).ok,false);assert.equal(serialize(s,NOW),raw);s.xp=2000;assert.equal(openRegion(s,'meadow',NOW).ok,false);assert.equal(s.coins,120);
 s.coins=300;s.stars=3;assert.equal(openRegion(s,'meadow',NOW).ok,true);assert.equal(s.coins,0);assert.equal(s.stars,0);assert.equal(openRegion(s,'meadow',NOW).ok,false);
});
test('land truly grows from 22 to 46 tiles wide and appends 54 fields without reordering old crops',()=>{
 const s=funded(),old=structuredClone(s.plots);for(const [i,id]of(['meadow','orchard','pasture'] as const).entries()){assert.equal(openRegion(s,id,NOW).ok,true);assert.equal(worldWidth(s),30+i*8);assert.equal(s.plots.length,48+i*18);assert.equal(s.plots.slice(30+i*18,48+i*18).filter(p=>p.unlocked).length,6);}
 assert.deepEqual(s.plots.slice(0,30),old);assert.equal(s.coins,1000000-3400);assert.equal(s.stars,979);assert.equal(parseSave(serialize(s,NOW),NOW)!.plots.length,84);assert.equal(PLOTS[30].x,23);assert.equal(PLOTS[66].x,39);
});
test('new fields support the same plant/grow/harvest loop, and all 84 fields can be cultivated',()=>{
 const s=funded();for(const id of ['meadow','orchard','pasture'] as const)openRegion(s,id,NOW);assert.equal(plant(s,30,'wheat',NOW).ok,true);assert.equal(harvest(s,30,NOW+20000).ok,true);assert.equal(s.inventory.wheat,3);
 while(s.plots.some(p=>!p.unlocked))assert.equal(expand(s).ok,true);assert.equal(s.plots.filter(p=>p.unlocked).length,84);const coins=s.coins;assert.equal(expand(s).ok,false);assert.equal(s.coins,coins);
});
test('a new area can cultivate its own next field before finishing the original field',()=>{
 const s=funded();openRegion(s,'meadow',NOW);assert.equal(s.plots[9].unlocked,false);assert.equal(s.plots[36].unlocked,false);const coins=s.coins;assert.equal(expand(s,36).ok,true);assert.equal(s.plots[36].unlocked,true);assert.equal(s.plots[9].unlocked,false);assert.equal(s.coins,coins-300);assert.equal(expand(s,36).ok,false);assert.equal(expand(s,999).ok,false);
});
test('orchard and beehives produce once per cooldown and mature offline',()=>{
 const s=funded();assert.equal(collectOrchard(s,'apple',0,NOW).ok,false);openRegion(s,'meadow',NOW);openRegion(s,'orchard',NOW);assert.equal(collectOrchard(s,'apple',0,NOW).ok,true);assert.equal(collectOrchard(s,'apple',0,NOW+1).ok,false);assert.equal(collectOrchard(s,'honey',0,NOW).ok,true);assert.equal(s.inventory.apple,1);assert.equal(s.inventory.honey,1);
 const loaded=parseSave(serialize(s,NOW),NOW+3600000)!;assert.equal(collectOrchard(loaded,'apple',0,NOW+3600000).ok,true);assert.equal(loaded.inventory.apple,2);assert.equal(loaded.progression.appleAt.length,4);assert.equal(collectOrchard(loaded,'honey',2,NOW+3600000).ok,false);
});
test('orchard goods enter crafting, selling, discovery and high-level orders',()=>{
 const s=funded();s.inventory.apple=2;s.inventory.honey=1;s.inventory.bread=1;assert.equal(enqueueCraft(s,'orchardBasket',NOW).ok,true);assert.equal(s.inventory.apple,0);assert.equal(collectCraft(s,1,NOW+120000).ok,true);assert.equal(s.inventory.orchardBasket,1);assert.equal(s.features.album.counts.orchardBasket,1);const coins=s.coins;sell(s,'orchardBasket',1);assert.equal(s.coins,coins+330);assert.ok(Array.from({length:40},(_,i)=>makeOrder(i,6)).some(o=>o.needs.orchardBasket));
});
test('pasture grants real animal capacity and new animals stay inside the new pen',()=>{
 const s=funded();for(const id of ['meadow','orchard','pasture'] as const)openRegion(s,id,NOW);assert.equal(animalCapacity(s,'hen'),10);assert.equal(animalCapacity(s,'cow'),5);assert.equal(buyAnimal(s,'hen',NOW).ok,true);
 let seed=431;const m=new FarmMotion(()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;});m.sync(s.animals,true,46);
 for(let i=0;i<6000;i++){m.update(.05,new Set());const a=m.animals.get(5)!;assert.ok(a.x>=39.35&&a.x<=43.65&&a.y>=10.35&&a.y<=17.65);assert.ok(!(a.x<41.3&&a.y<12.5));}
 assert.ok(m.animals.get(1)!.x<6);m.vehicles[0].x=40;m.update(.1,new Set());assert.ok(m.vehicles[0].x>40);m.vehicles[0].x=48.49;m.update(.1,new Set());assert.equal(m.vehicles[0].x,-3);
});
test('expanded decoration space excludes production plots, trees, pens and unowned land',()=>{
 assert.equal(freeGrass(24,13,30),true);assert.equal(freeGrass(24,6,30),false);assert.equal(freeGrass(32,12,38),false);assert.equal(freeGrass(42,13,46),false);assert.equal(freeGrass(31,13,30),false);
});
test('v0.3 migration retains field timers and feature progress while adding empty world state',()=>{
 const old:any=funded();delete old.progression;for(const id of ['apple','honey','orchardBasket'])delete old.inventory[id];old.features.daily.claimed=['harvest'];old.features.album.claimed=[4,8,14];old.coins=672;enqueueCraft(old,'bread',NOW);const raw=JSON.stringify(old),loaded=parseSave(raw,NOW)!;assert.ok(loaded);assert.equal(loaded.coins,672);assert.equal(loaded.xp,old.xp);assert.deepEqual(loaded.plots,old.plots);assert.deepEqual(loaded.features,old.features);assert.equal(loaded.inventory.apple,0);assert.equal(worldWidth(loaded),22);assert.deepEqual(loaded.progression.claimedLevels,[1]);assert.equal(JSON.stringify(old),raw);
});
test('malformed world ownership, field counts and repeated reward flags are rejected',()=>{
 const s=funded();for(const mutate of [(v:any)=>v.progression.regions=['orchard'],(v:any)=>v.progression.claimedLevels=[1,2,2],(v:any)=>v.progression.schema=2,(v:any)=>v.progression.appleAt=[NOW],(v:any)=>v.plots.push(v.plots[0]),(v:any)=>v.progression.claimedLevels=[101]]){const v=JSON.parse(serialize(s,NOW));mutate(v);assert.equal(parseSave(JSON.stringify(v),NOW),null);}
});
