import {spawn} from 'node:child_process';
import {mkdirSync,cpSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import './init-project.mjs';
const editor=process.env.COCOS_CREATOR||'/Volumes/mac/tools/cocos/3.8.7/CocosCreator.app/Contents/MacOS/CocosCreator';
const sdk=process.env.ANDROID_SDK_ROOT||'/Volumes/mac/developer/android-sdk';
const java=process.env.JAVA_HOME||'/Volumes/mac/developer/jdk/jdk-17.0.20.1+1/Contents/Home';
const ndk=process.env.ANDROID_NDK_ROOT||join(sdk,'ndk/27.2.12479018');
const project=process.cwd(),version=JSON.parse(readFileSync('package.json')).version;
for(let attempt=0;attempt<3;attempt++){
 const staging=resolve('/Volumes/mac/cache/sunny-farm',`android-${Date.now()}-${attempt}`);
 mkdirSync(staging,{recursive:true});
 for(const entry of ['assets','settings','package.json','tsconfig.json'])cpSync(entry,join(staging,entry),{recursive:true});
 const pkg=JSON.parse(readFileSync(join(staging,'package.json')));pkg.uuid=randomUUID();writeFileSync(join(staging,'package.json'),JSON.stringify(pkg,null,2));
 const config={...JSON.parse(readFileSync('build-config.json')),name:'QingyeTales',platform:'android',debug:false,packages:{android:{packageName:'com.qingyetales.farm',apiLevel:35,appABIs:['arm64-v8a'],sdkPath:sdk,ndkPath:ndk,javaHome:java,useDebugKeystore:true,appBundle:false,androidInstant:false,inputSDK:false,swappy:false,orientation:{landscapeLeft:true,landscapeRight:true,portrait:false,upsideDown:false},renderBackEnd:{gles3:true,gles2:false,vulkan:false}}}};
 const configPath=join(staging,'build-config-android.json');writeFileSync(configPath,JSON.stringify(config,null,2));
 writeFileSync('artifacts/last-build-android.json',JSON.stringify({staging,editor,version,sdk,java,ndk},null,2));
 const env={...process.env,JAVA_HOME:java,ANDROID_SDK_ROOT:sdk,ANDROID_HOME:sdk,ANDROID_NDK_ROOT:ndk};
 const file=join(staging,'build/android/data/assets/main/cc.config.json');
 let hasScene=false;
 for(let pass=0;pass<2&&!hasScene;pass++){
  // An initial CLI export may finish before its cold asset database imports Farm.scene.
  const code=await new Promise((done,reject)=>{const p=spawn(editor,['--project',staging,'--build',`configPath=${configPath}`],{env,stdio:'inherit'});p.on('error',reject);p.on('close',done);});
  if(code!==36)throw Error(`Creator exited ${code}`);
  hasScene=existsSync(file)&&Object.keys(JSON.parse(readFileSync(file)).scenes||{}).length===1;
 }
 if(hasScene){
  const app=join(staging,'native/engine/android/app'),javaDir=join(app,'src/com/cocos/game');
  cpSync('platforms/android/QingyeFrameRate.java',join(javaDir,'QingyeFrameRate.java'));
  const activity=join(javaDir,'AppActivity.java'),source=readFileSync(activity,'utf8');
  const onCreate='super.onCreate(savedInstanceState);';
  if(!source.includes(onCreate))throw Error('Cocos Android Activity template changed');
  if(!source.includes('QingyeFrameRate.install'))writeFileSync(activity,source.replace(onCreate,onCreate+'\n        QingyeFrameRate.install(this, getSurfaceView());'));
  const proguard=join(app,'proguard-rules.pro'),rules=readFileSync(proguard,'utf8');
  const keep='-keep class com.cocos.game.QingyeFrameRate { public static void setTarget(int); }';
  if(!rules.includes(keep))writeFileSync(proguard,rules+'\n'+keep+'\n');
  console.log('Android project exported:',staging);break;
 }
 if(attempt===2)throw Error('Android scene import validation failed');
}
