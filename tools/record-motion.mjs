import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const folder=process.env.FRAME_DIR||'/Volumes/mac/tmp/sunny-farm-motion-v02';mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Volumes/mac/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
try{const page=await browser.newPage({viewport:{width:1600,height:900}});await page.goto('http://localhost:7526?v=0.2.0',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__SUNNY_FARM__?.ready);await page.waitForTimeout(2200);const b=await page.evaluate(()=>window.__SUNNY_FARM__.buttons().find(b=>b.label==='开始游戏'));await page.mouse.click(b.x,b.y);await page.waitForTimeout(500);
 const frames=[];for(let i=0;i<36;i++){const time=Date.now();await page.screenshot({path:`${folder}/frame-${String(i).padStart(3,'0')}.jpg`,type:'jpeg',quality:92});await page.waitForTimeout(100);frames.push({i,time});}writeFileSync(`${folder}/timing.json`,JSON.stringify(frames));console.log(`Recorded ${frames.length} real Cocos frames in ${folder}`);
}finally{await browser.close();}
