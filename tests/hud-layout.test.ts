import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deviceClass,hudLayout,MIN_TOUCH} from '../assets/scripts/HudLayout';
test('iPhone safe-area HUD stays inside the notch and home indicator in both landscapes',()=>{
 for(const [w,h,insets] of [[2556,1179,{left:59/852,right:59/852,bottom:21/393}],[2796,1290,{left:0,right:62/932,bottom:21/430}],[2796,1290,{left:62/932,right:0,bottom:21/430}]] as const){
  const l=hudLayout(w,h,true,insets),s=Math.min(w/1600,h/900),left=w/2+l.x*s-l.width*l.scale*s/2,right=w/2+l.x*s+l.width*l.scale*s/2;
  assert.ok(left+1e-6>=w*(insets.left||0));assert.ok(right-1e-6<=w*(1-insets.right));
  assert.ok(l.width>=960&&l.height>=500);assert.ok(l.y>0);
 }
});
test('iPad letterboxes to 16:9 and very wide screens keep controls in reach',()=>{
 const tablet=hudLayout(2732,2048,true,{top:24/2048,bottom:20/2048});
 assert.equal(deviceClass(2732,2048),'tablet');
 assert.ok(tablet.width/tablet.height>1.7&&tablet.width/tablet.height<1.8);
 assert.ok(tablet.width>=960&&tablet.height>=540);
 const fold=hudLayout(2208,1840,true);assert.ok(fold.width/fold.height>1.7&&fold.width/fold.height<1.8);
 const duo=hudLayout(3200,1000,true);assert.equal(deviceClass(3200,1000),'wide');
 assert.ok(duo.width/duo.height<=2.21);assert.ok(Math.abs(duo.x)<1);
 assert.deepEqual(hudLayout(2400,1080,true),{width:1200,height:540,scale:2/(1080/900),x:0,y:0});
 assert.deepEqual(hudLayout(1600,900,false),{width:1600,height:900,scale:1,x:0,y:0});
 const bad=hudLayout(1600,900,true,{left:NaN,right:-4,bottom:Infinity});assert.ok(Object.values(bad).every(Number.isFinite));
 assert.ok(MIN_TOUCH>=44);
});
