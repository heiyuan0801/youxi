import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {existsSync,readFileSync,mkdirSync,cpSync,writeFileSync,renameSync,rmSync} from 'node:fs';
import './init-project.mjs';
const editor=process.env.COCOS_CREATOR||'/Volumes/mac/tools/cocos/3.8.7/CocosCreator.app/Contents/MacOS/CocosCreator';
const project=process.cwd();
// A fresh import avoids Creator's cached CLI importer classifying scenes as '*'.
let output='';
for(let attempt=0;attempt<3;attempt++){
 const staging=resolve('/Volumes/mac/cache/sunny-farm',`build-${Date.now()}-${attempt}`);
 mkdirSync(staging,{recursive:true});
 for(const entry of ['assets','settings','package.json','tsconfig.json','build-config.json'])cpSync(entry,resolve(staging,entry),{recursive:true});
 const pkg=JSON.parse(readFileSync(resolve(staging,'package.json'),'utf8'));pkg.uuid=randomUUID();writeFileSync(resolve(staging,'package.json'),JSON.stringify(pkg,null,2));
 writeFileSync('artifacts/last-build.json',JSON.stringify({staging,editor},null,2));
 const code=await new Promise((done,reject)=>{const p=spawn(editor,['--project',staging,'--build',`configPath=${resolve(staging,'build-config.json')}`],{stdio:'inherit'});p.on('error',reject);p.on('close',done);});
 if(code!==36)throw Error(`Creator build exit ${code}`);
 const candidate=resolve(staging,'build/web-desktop'),config=resolve(candidate,'assets/main/config.json');
 if(existsSync(config)&&Object.keys(JSON.parse(readFileSync(config,'utf8')).scenes||{}).length===1&&readFileSync(resolve(candidate,'assets/main/index.js'),'utf8').includes('FarmApp')){output=candidate;break;}
 console.warn(`Creator asset import incomplete; retrying fresh staging (${attempt+1}/3)`);
}
if(!output)throw Error('Creator did not import the Farm scene/scripts. Previous playable build retained.');
// Use a fullscreen landscape shell; gameplay and all panels remain Cocos-native.
let html=readFileSync(resolve(output,'index.html'),'utf8');
html=html.replace('<html>','<html lang="zh-CN">').replace(/<title>.*?<\/title>/,'<title>晴野物语 · Qingye Tales</title>').replace('content="portrait"','content="landscape"').replace(/<h1 class="header">.*?<\/h1>/s,'').replace(/<p class="footer">.*?<\/p>/s,'').replace('cc_exact_fit_screen="false"','cc_exact_fit_screen="true"').replace('style="width: 1600px; height: 900px;"','style="width: 100%; height: 100%;"');
html=html.replace('</head>','<style>html,body{width:100%;height:100%;overflow:hidden;background:#c5e8eb!important}#GameDiv{position:fixed!important;inset:0!important;margin:0!important;width:100%!important;height:100%!important;border:0!important;border-radius:0!important;box-shadow:none!important}#Cocos3dGameContainer{width:100%;height:100%}#rotate-hint{display:none;position:fixed;inset:0;z-index:99;background:#f5f0dc;color:#456c42;align-items:center;justify-content:center;text-align:center;font:600 22px/1.8 sans-serif}@media(orientation:portrait) and (max-width:700px){#rotate-hint{display:flex}}</style></head>');
html=html.replace('<!-- Polyfills bundle. -->','<div id="rotate-hint">转动屏幕，逛逛你的小农场<br>请横屏游玩</div><!-- Polyfills bundle. -->');
html=html.replace('</head>','<style>'+readFileSync(resolve(project,'tools/landscape.css'),'utf8')+'</style></head>');
// Branded HTML loader appears before engine boot; FarmApp removes it when assets are ready.
cpSync(resolve(project,'assets/resources/branding/cover.png'),resolve(output,'qingye-cover.png'));
html=html.replace('</head>','<link rel="icon" href="qingye-cover.png"><meta name="application-name" content="晴野物语"><style>#qingye-loader{position:fixed;inset:0;z-index:90;background:#c6e2c0 url(qingye-cover.png) center top/cover no-repeat;display:flex;align-items:flex-end;justify-content:center}#qingye-loader span{margin-bottom:5vh;background:#fff9e9ed;color:#725332;border:2px solid white;border-radius:25px;padding:12px 30px;font:700 18px sans-serif}</style></head>');
html=html.replace('<body>', '<body><div id="qingye-loader" aria-label="晴野物语加载页"><span>晴野物语 · 正在准备农场…</span></div>');
writeFileSync(resolve(output,'index.html'),html);
const settingsPath=resolve(output,'src/settings.json'),runtimeSettings=JSON.parse(readFileSync(settingsPath,'utf8'));
// The runtime screen adapter reads settings.json, not the legacy HTML attribute.
// This keeps Cocos input coordinates synchronized with a fullscreen/resized canvas.
runtimeSettings.screen.exactFitScreen=true;runtimeSettings.splashScreen={totalTime:0,logo:{type:'none'},background:{type:'default'},autoFit:true};
writeFileSync(settingsPath,JSON.stringify(runtimeSettings,null,2));
mkdirSync('build',{recursive:true});
const next=resolve('build/web-desktop-next'),destination=resolve('build/web-desktop');
rmSync(next,{recursive:true,force:true});cpSync(output,next,{recursive:true});
rmSync(destination,{recursive:true,force:true});renameSync(next,destination);
console.log('Cocos Creator build verified: build/web-desktop');
