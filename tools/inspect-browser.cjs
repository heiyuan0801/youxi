// Local-only browser inspection endpoint, never included in the game build.
const {chromium}=require('playwright');const http=require('node:http');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Volumes/mac/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
 const context=await browser.newContext({viewport:{width:1600,height:900},acceptDownloads:true});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://localhost:7526',{waitUntil:'networkidle',timeout:60000});
 http.createServer(async(req,res)=>{let s='';for await(const c of req)s+=c;try{const r=await eval(`(async()=>{${s}\n})()`);res.end(JSON.stringify(r??null));}catch(e){res.statusCode=500;res.end(String(e));}}).listen(18767,'127.0.0.1',()=>console.log('READY'));
})();
