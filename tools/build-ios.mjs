import {spawn} from 'node:child_process';
import {mkdirSync,cpSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import './init-project.mjs';
const editor=process.env.COCOS_CREATOR||'/Volumes/mac/tools/cocos/3.8.7/CocosCreator.app/Contents/MacOS/CocosCreator',version=JSON.parse(readFileSync('package.json')).version;
mkdirSync('artifacts',{recursive:true});
for(let attempt=0;attempt<3;attempt++){
 const staging=resolve('/Volumes/mac/cache/sunny-farm',`ios-${Date.now()}-${attempt}`);mkdirSync(staging,{recursive:true});
 for(const entry of ['assets','settings','package.json','tsconfig.json'])cpSync(entry,join(staging,entry),{recursive:true});
 const pkg=JSON.parse(readFileSync(join(staging,'package.json')));pkg.uuid=randomUUID();writeFileSync(join(staging,'package.json'),JSON.stringify(pkg,null,2));
 const config={...JSON.parse(readFileSync('build-config.json')),name:'QingyeTales',platform:'ios',debug:false,autoCompile:false,packages:{ios:{packageName:'com.qingyetales.farm',targetVersion:'15.0',skipUpdateXcodeProject:false,osTarget:{iphoneos:true,simulator:true},orientation:{landscapeLeft:true,landscapeRight:true,portrait:false,upsideDown:false},renderBackEnd:{metal:true}}}};
 const configPath=join(staging,'build-config-ios.json');writeFileSync(configPath,JSON.stringify(config,null,2));
 writeFileSync('artifacts/last-build-ios.json',JSON.stringify({staging,editor,version,bundleId:config.packages.ios.packageName,minimumIOS:'15.0'},null,2));
 const file=join(staging,'build/ios/data/assets/main/cc.config.json');
 let hasScene=false;
 for(let pass=0;pass<2&&!hasScene;pass++){
  const code=await new Promise((done,reject)=>{const p=spawn(editor,['--project',staging,'--build',`configPath=${configPath}`],{stdio:'inherit'});p.on('error',reject);p.on('close',done);});
  if(code!==36)throw Error(`Creator exited ${code}`);
  hasScene=existsSync(file)&&Object.keys(JSON.parse(readFileSync(file)).scenes||{}).length===1;
 }
 if(hasScene){console.log('iOS project exported:',staging);break;}
 if(attempt===2)throw Error('iOS scene import validation failed');
}
