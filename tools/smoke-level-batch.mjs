import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Volumes/mac/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
try{
 const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
 await page.addInitScript(()=>{const raw=sessionStorage.getItem('__qingye_test_fixture');if(raw){localStorage.setItem('sunny-meadow-farm-v1',raw);sessionStorage.removeItem('__qingye_test_fixture');}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:7526/?v=0.7.2',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__SUNNY_FARM__?.ready);await page.waitForTimeout(2300);let b=await page.evaluate(()=>window.__SUNNY_FARM__.buttons().find(b=>b.label==='开始游戏'));await page.mouse.click(b.x,b.y);
 const s=await page.evaluate(()=>window.__SUNNY_FARM__.snapshot());s.xp=19;for(const i of [0,1,3])s.plots[i]={unlocked:true,crop:'pumpkin',plantedAt:Date.now()-400000,watered:false};await page.evaluate(s=>sessionStorage.setItem('__qingye_test_fixture',JSON.stringify(s)),s);await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.__SUNNY_FARM__?.ready);await page.waitForTimeout(400);
 const points=await page.evaluate(()=>[0,1,3].map(i=>window.__SUNNY_FARM__.plot(i)));await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();for(const p of points.slice(1))await page.mouse.move(p.x,p.y,{steps:14});await page.mouse.up();await page.waitForTimeout(150);
 assert.equal(await page.evaluate(()=>window.__SUNNY_FARM__.levelPopup()),2);const coins=(await page.evaluate(()=>window.__SUNNY_FARM__.snapshot())).coins;
 b=await page.evaluate(()=>window.__SUNNY_FARM__.buttons().find(b=>b.label==='太棒了！'));await page.mouse.click(b.x,b.y);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__SUNNY_FARM__.levelPopup()),3);
 b=await page.evaluate(()=>window.__SUNNY_FARM__.buttons().find(b=>b.label==='太棒了！'));await page.mouse.click(b.x,b.y);await page.waitForTimeout(100);const after=await page.evaluate(()=>window.__SUNNY_FARM__.snapshot());assert.equal(after.coins,coins+180);assert.equal(after.xp,94);assert.ok(after.progression.claimedLevels.includes(2)&&after.progression.claimedLevels.includes(3));assert.equal(await page.evaluate(()=>window.__SUNNY_FARM__.levelPopup()),null);assert.ok((await page.evaluate(()=>window.__SUNNY_FARM__.audio())).events.some(e=>e.key==='levelup'));assert.deepEqual(errors,[]);
 writeFileSync('artifacts/smoke-level-batch-v07.json',JSON.stringify({passed:true,checks:['one continuous harvest can cross two levels, show both reward cards in order and pay each once'],errors,fixture:'isolated browser; three mature high-yield crops exercise the drag-harvest level threshold path'},null,2));console.log('PASS sequential level cards and rewards after a continuous harvest');
}finally{await browser.close();}
