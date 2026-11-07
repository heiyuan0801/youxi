import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const dir='artifacts/v08';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Volumes/mac/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const checks=[],errors=[];
try{
 for(const [name,width,height] of [['iphone-small',667,375],['iphone-notch',852,393],['iphone-large',932,430],['ipad',1024,768]]){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true}),page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:7526/?ios-layout=0.8.0');
  await page.waitForFunction(()=>window.__SUNNY_FARM__?.ready);
  const panel=()=>page.evaluate(()=>window.__SUNNY_FARM__.panel());
  async function button(label){
   for(let n=0;n<20;n++){
    const b=await page.evaluate(label=>window.__SUNNY_FARM__.buttons().find(b=>b.label===label),label);assert.ok(b,`Missing ${label}`);
    const scale=Math.min(width/1600,height/900),x=(width-1600*scale)/2+b.x*scale,y=(height-900*scale)/2+b.y*scale;
    const bounds=await page.evaluate(async()=>{const cc=await System.import('cc'),s=cc.director.getScene().getComponentsInChildren(cc.ScrollView)[0];if(!s)return null;const h=s.node.getComponent(cc.UITransform).height*s.node.worldScale.y,y=s.node.worldPosition.y;return{top:900-y-h/2,bottom:900-y+h/2};});
    const minY=bounds?(height-900*scale)/2+bounds.top*scale+24:0,maxY=bounds?(height-900*scale)/2+bounds.bottom*scale-24:height;
    if(!await panel()||y>minY&&y<maxY){
      if(label==='返回设置')await page.screenshot({path:`${dir}/${name}-privacy-scrolled.png`});
      await page.touchscreen.tap(x,y);await page.waitForTimeout(200);return;
    }
    await page.mouse.move(width/2+80,height/2);await page.mouse.wheel(0,y>maxY?180:-180);await page.waitForTimeout(350);
    await page.waitForFunction(async()=>{const cc=await System.import('cc');return cc.director.getScene().getComponentsInChildren(cc.ScrollView).every(s=>!s.isAutoScrolling()&&!s.isScrolling());});
    await page.waitForTimeout(500);
   }throw Error(`Button not reachable: ${label}`);
  }
  await button('开始游戏');await button('设置');await button('隐私与存档说明');assert.equal(await panel(),'privacy');
  const text=await page.evaluate(async()=>{const cc=await System.import('cc');return cc.director.getScene().getComponentsInChildren(cc.Label).map(l=>l.string).join('\n');});assert.match(text,/不主动收集或上传个人信息/);assert.match(text,/在设置中可导入备份文件或恢复本机备份/);
  await page.screenshot({path:`${dir}/${name}-privacy.png`});await button('返回设置');assert.equal(await panel(),'settings');
  const download=page.waitForEvent('download');await button('导出存档');const d=await download;assert.equal(d.suggestedFilename(),'晴野物语-存档.json');
  const state=await page.evaluate(()=>window.__SUNNY_FARM__.snapshot());await button('重新开始');assert.equal(await panel(),'confirm-reset');await button('继续经营');
  assert.equal((await page.evaluate(()=>window.__SUNNY_FARM__.snapshot())).coins,state.coins);
  await page.screenshot({path:`${dir}/${name}-settings.png`});checks.push(`${name}: privacy, back, export, reset cancellation reachable by touch/scroll`);await ctx.close();
 }
 assert.deepEqual(errors,[]);writeFileSync(`${dir}/ui-checks.json`,JSON.stringify({passed:true,checks,errors,scope:'Chromium landscape viewports; not native iOS runtime validation'},null,2));console.log(checks.join('\n'));
}finally{await browser.close();}
