import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import model from '../assets/scripts/FarmModel.ts';
const {newFarm,levelFloor,parseSave,CROPS}=model;
const out='artifacts/video-0.7.1';mkdirSync(out,{recursive:true});
const now=Date.now(),save=newFarm(now);
save.xp=levelFloor(12)+50;save.coins=1280;save.stars=38;
save.progression.claimedLevels=Array.from({length:12},(_,i)=>i+1);
Object.assign(save.inventory,{wheat:20,carrot:16,egg:8,milk:5,feed:20,wood:30,ore:15,planks:10,cloth:8,apple:3,flour:8});
save.life.maps=['village','forest','mine','beach','snow'];save.ecology.roaming=true;
save.life.home.owned=['bed','sofa','rug','housePlant','lamp','bookshelf'];
save.advanced.room={size:8,wall:1,floor:0,serial:6,items:[
 {id:1,type:'bed',x:.23,y:.23,rotation:0},{id:2,type:'sofa',x:.7,y:.65,rotation:0},
 {id:3,type:'rug',x:.58,y:.6,rotation:0},{id:4,type:'housePlant',x:.12,y:.63,rotation:0},
 {id:5,type:'lamp',x:.7,y:.17,rotation:0},{id:6,type:'bookshelf',x:.42,y:.1,rotation:0} ]};
for(const a of save.animals){a.readyAt=now-1000;Object.assign(save.life.care[a.id],{hunger:85,mood:90,bond:40,lastAt:now});}
for(let i=0;i<4;i++){const crop=['wheat','wheat','carrot','wheat'][i];Object.assign(save.plots[i],{crop,plantedAt:now-600000,growSeconds:CROPS.find(c=>c.id===crop).seconds});}
assert.ok(parseSave(JSON.stringify(save),now),'valid separate demo save');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Volumes/mac/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await browser.newContext({viewport:{width:1600,height:900},acceptDownloads:true}),page=await ctx.newPage(),errors=[],events=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(s=>{
 localStorage.setItem('sunny-meadow-farm-v1',JSON.stringify(s));
 const original=AudioNode.prototype.connect,taps=new Map();globalThis.__recordTaps=taps;
 AudioNode.prototype.connect=function(target,...args){const result=original.call(this,target,...args);if(target===this.context.destination&&!this.context.__recordMaster){let tap=taps.get(this.context);if(!tap){tap=this.context.createMediaStreamDestination();taps.set(this.context,tap);globalThis.__recordAttach?.(tap);}original.call(this,tap,...args);}return result;};
},save);
const sleep=ms=>page.waitForTimeout(ms),state=()=>page.evaluate(()=>window.__SUNNY_FARM__.snapshot());
async function tap(x,y){await page.mouse.move(x,y,{steps:8});await page.mouse.click(x,y);await sleep(130);}
async function button(label){for(let i=0;i<10;i++){const bs=await page.evaluate(()=>window.__SUNNY_FARM__.buttons()),b=bs.find(b=>b.label===label||b.label.startsWith(label+' ·'));assert.ok(b,`Button ${label}`);const panel=await page.evaluate(()=>window.__SUNNY_FARM__.panel());if(!panel||b.y>=145&&b.y<810||label==='开始游戏'||label==='返回主农场'){await tap(b.x,b.y);return;}await page.mouse.move(1000,600);await page.mouse.wheel(0,b.y>810?b.y-600:b.y-300);await sleep(350);}throw Error('Could not reach '+label);}
async function plot(i){const p=await page.evaluate(i=>window.__SUNNY_FARM__.plot(i),i);await tap(p.x,p.y);}
async function close(){await page.keyboard.press('Escape');await sleep(120);}
async function animal(type){const q=await page.evaluate(type=>{const api=window.__SUNNY_FARM__,a=api.motion().animals.find(a=>a.species===type);return a?api.point(a.x,a.y,-25):null;},type);assert.ok(q);await tap(q.x,q.y);}
let started=0;
async function at(seconds,label,action){const remaining=started+seconds*1000-Date.now();if(remaining>0)await sleep(remaining);await action();events.push({time:(Date.now()-started)/1000,label});console.log(label);}
try{
 await page.goto('http://localhost:7526/?video=0.7.1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__SUNNY_FARM__?.ready);await sleep(1500);
 await page.evaluate(async()=>{
  const canvas=document.querySelector('canvas#GameCanvas')||document.querySelector('canvas'),master=new AudioContext();master.__recordMaster=true;await master.resume();const audio=master.createMediaStreamDestination(),attached=new Set();globalThis.__recordAttach=tap=>{if(attached.has(tap))return;attached.add(tap);master.createMediaStreamSource(tap.stream).connect(audio);};for(const tap of globalThis.__recordTaps.values())globalThis.__recordAttach(tap);
  const video=canvas.captureStream(30),stream=new MediaStream([...video.getVideoTracks(),...audio.stream.getAudioTracks()]),mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')?'video/webm;codecs=vp9,opus':'video/webm;codecs=vp8,opus';
  const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:7000000,audioBitsPerSecond:128000}),chunks=[];
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};globalThis.__recordDone=new Promise(resolve=>recorder.onstop=()=>{const blob=new Blob(chunks,{type:mime}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='qingye-gameplay-raw.webm';a.click();resolve({bytes:blob.size,mime,width:canvas.width,height:canvas.height,audioContexts:attached.size});});globalThis.__recorder=recorder;recorder.start(500);
 });
 started=Date.now();
 await at(1.3,'开始游戏',()=>button('开始游戏'));
 await at(2.8,'收获小麦',()=>plot(0));
 await at(3.6,'再次收获',()=>plot(1));
 await at(4.4,'收获胡萝卜',()=>plot(2));
 await at(5.1,'打开种子选择',()=>plot(4));
 await at(5.8,'种植胡萝卜',()=>button('种子-胡萝卜'));
 await at(6.5,'回到田间',close);
 await at(7.0,'奶牛互动',()=>animal('cow'));
 await at(8.0,'小鸡互动',()=>animal('hen'));
 await at(9.0,'打开仓库',()=>button('仓库'));
 await at(11.4,'关闭仓库',close);
 await at(11.8,'打开旅行手册',()=>button('旅行手册'));
 await at(12.8,'前往森林',()=>button('前往青杉森林'));
 await at(15.4,'森林采集',async()=>{const p=await page.evaluate(()=>window.__SUNNY_FARM__.point(10,6,-25));await tap(p.x,p.y);});
 await at(17.5,'返回主农场',()=>button('返回主农场'));
 await at(18.5,'自由装修',()=>button('我的小屋'));
 await at(20.0,'拖动小床',async()=>{const q=await page.evaluate(async()=>{const cc=await System.import('cc'),n=cc.director.getScene().getComponentsInChildren(cc.Sprite).map(s=>s.node).find(n=>n.name==='RoomPiece-1');return{x:n.worldPosition.x,y:900-n.worldPosition.y};});await page.mouse.move(q.x,q.y);await page.mouse.down();await page.mouse.move(q.x+40,q.y+18,{steps:22});await page.mouse.up();});
 await at(22.0,'选择家具',async()=>{const q=await page.evaluate(async()=>{const cc=await System.import('cc'),n=cc.director.getScene().getComponentsInChildren(cc.Sprite).map(s=>s.node).find(n=>n.name==='RoomPiece-1');return{x:n.worldPosition.x,y:900-n.worldPosition.y};});await tap(q.x,q.y);});
 await at(23.2,'旋转家具',()=>button('旋转90°'));
 await at(24.7,'更换地板',()=>button('更换地板'));
 await at(26.8,'回到农场',close);
 await at(30,'完成录制',async()=>{});
 const downloadPromise=page.waitForEvent('download');const metadata=await page.evaluate(async()=>{globalThis.__recorder.stop();return await globalThis.__recordDone;});const download=await downloadPromise;await download.saveAs(out+'/gameplay-raw.webm');
 const result=await state(),audio=await page.evaluate(()=>window.__SUNNY_FARM__.audio());
 assert.equal(result.stats.harvests,3);assert.equal(result.plots[4].crop,'carrot');assert.equal(result.life.activeMap,'home');assert.notEqual(result.advanced.room.items[0].x,.23);assert.equal(result.advanced.room.items[0].rotation,1);assert.equal(result.advanced.room.floor,1);assert.deepEqual(errors,[]);
 writeFileSync(out+'/recording.json',JSON.stringify({version:'0.7.1',source:'actual Cocos H5 runtime, isolated prepared demo save, real mouse input, normal speed, live game audio capture',metadata,events,audio,errors,passed:true},null,2));
 console.log(JSON.stringify({metadata,audioEvents:audio.events.map(e=>e.key),seconds:(Date.now()-started)/1000}));
}catch(error){await page.screenshot({path:out+'/failed.png'});writeFileSync(out+'/failure.json',JSON.stringify({error:String(error),events,errors},null,2));throw error;}finally{await browser.close();}
