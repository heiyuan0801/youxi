import test from 'node:test';
import assert from 'node:assert/strict';
import {FarmMotion} from '../assets/scripts/FarmMotion';
import {newFarm} from '../assets/scripts/FarmModel';
import {pathTo,walkable,project,unproject,PLOTS} from '../assets/scripts/SceneLayout';
function seeded(){let n=9137;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};}
test('animal movement remains in the pen and avoids the coop and hay over ten simulated minutes',()=>{
 const m=new FarmMotion(seeded());m.sync(newFarm().animals);const actions=new Set<string>(),frames=new Set<string>();
 for(let i=0;i<12000;i++){m.update(.05,new Set([1,3]));for(const a of m.animals.values()){
  assert.ok(Number.isFinite(a.x+a.y));assert.ok(a.x>=1.35&&a.x<=5.65&&a.y>=6.35&&a.y<=13.65);
  assert.ok(!(a.x<3.3&&a.y<8.5));assert.ok(!(a.x>4.7&&a.y>11.6&&a.y<13.4));actions.add(a.action);frames.add(m.frame(a));
 }}
 assert.ok(actions.has('peck')&&actions.has('sleep')&&actions.has('graze'));for(let i=0;i<4;i++)assert.ok(frames.has(`walk${i}`));
});
test('scenery refresh preserves animal positions, and petting produces a transient reaction',()=>{
 const m=new FarmMotion(seeded()),s=newFarm();m.sync(s.animals);m.update(1,new Set());const before=m.snapshot().animals;m.sync(s.animals);
 assert.deepEqual(m.snapshot().animals,before);m.pet(1,false);assert.equal(m.animals.get(1)?.action,'startle');m.update(.5,new Set());assert.equal(m.animals.get(1)?.action,'run');
 m.pet(4,false);assert.equal(m.animals.get(4)?.action,'happy');
});
test('cars travel, loop with a delay, and a delivery dispatches the truck',()=>{
 const m=new FarmMotion(seeded());m.update(1,new Set());assert.ok(m.vehicles[0].x>13);assert.ok(m.vehicles[1].x>8);
 m.vehicles[1].x=24.49;m.update(.1,new Set());assert.equal(m.vehicles[1].x,-3);assert.ok(m.vehicles[1].delay>=1);
 m.sendTruck();assert.equal(m.vehicles[0].x,5);assert.equal(m.vehicles[0].delay,0);assert.equal(m.vehicles[0].deliveryUntil,m.time+7);
});
test('villagers follow connected path cells, and projection roundtrips every farm plot',()=>{
 const path=pathTo({x:8.5,y:4.5},{x:14.5,y:18.5});assert.ok(path.length>10);let previous={x:8.5,y:4.5};
 for(const p of path){assert.ok(walkable(Math.floor(p.x),Math.floor(p.y)));assert.equal(Math.abs(p.x-previous.x)+Math.abs(p.y-previous.y),1);previous=p;}
 assert.deepEqual(previous,{x:14.5,y:18.5});assert.equal(PLOTS.length,84);assert.equal(new Set(PLOTS.map(p=>`${p.x},${p.y}`)).size,84);
 for(const p of PLOTS){const q=unproject(...project(p.x+.5,p.y+.5));assert.ok(Math.abs(q.x-p.x-.5)<1e-10&&Math.abs(q.y-p.y-.5)<1e-10);}
});
