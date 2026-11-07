import {spawn,execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,cpSync,rmSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const meta=JSON.parse(readFileSync('artifacts/last-build-ios.json'));
const version=JSON.parse(readFileSync('package.json')).version;
if(meta.version!==version)throw Error('Run npm run build:ios for the current version first.');
const source=join(meta.staging,'native/engine'),root=join(meta.staging,'build/ios');
const cmake=resolve(meta.editor,'../../Resources/tools/cmake/bin/cmake');
const artifacts=resolve(`artifacts/ios-${version}`),releases=resolve('releases');
mkdirSync(artifacts,{recursive:true});mkdirSync(releases,{recursive:true});
const run=(cmd,args)=>new Promise((done,reject)=>{const p=spawn(cmd,args,{stdio:'inherit'});p.on('error',reject);p.on('exit',code=>code===0?done():reject(Error(`${cmd} exited ${code}`)));});
for(const file of readdirSync('platforms/ios'))cpSync(join('platforms/ios',file),join(source,'ios',file));
// Do not ship the engine's permissive ATS policy, network/debugger features or old branding.
writeFileSync(join(source,'common/localCfg.cmake'),`set(TARGET_IOS_VERSION "15.0" CACHE STRING "Minimum iOS" FORCE)
set(USE_V8_DEBUGGER OFF)
set(USE_V8_DEBUGGER_FORCE OFF)
set(USE_SOCKET OFF)
set(USE_WEBSOCKET_SERVER OFF)
set(USE_WEBVIEW OFF)
set(USE_VIDEO OFF)
set(CMAKE_CXX_FLAGS_RELEASE "-O2 -DNDEBUG -g" CACHE STRING "Release C++ flags" FORCE)
set(CMAKE_C_FLAGS_RELEASE "-O2 -DNDEBUG -g" CACHE STRING "Release C flags" FORCE)
add_compile_options(-Wno-invalid-specialization)
`);
const cmakePath=join(source,'ios/CMakeLists.txt');
// Always regenerate this tiny template so repeated packaging stays idempotent.
const project=`cmake_minimum_required(VERSION 3.20)
set(CMAKE_SYSTEM_NAME iOS)
set(APP_NAME "QingyeTales" CACHE STRING "Project Name")
project(\${APP_NAME} CXX)
set(CC_PROJECT_DIR \${CMAKE_CURRENT_LIST_DIR})
set(CC_UI_RESOURCES "\${CC_PROJECT_DIR}/PrivacyInfo.xcprivacy" "\${CC_PROJECT_DIR}/ThirdPartyNotices.txt")
set(CC_PROJ_SOURCES "\${CC_PROJECT_DIR}/QingyeBridge.mm" "\${CC_PROJECT_DIR}/QingyeSceneDelegate.mm" "\${CC_PROJECT_DIR}/QingyeSceneDelegate.h")
set(CC_ASSET_FILES)
set(CC_COMMON_SOURCES)
set(CC_ALL_SOURCES)
include(\${CC_PROJECT_DIR}/../common/CMakeLists.txt)
set(EXECUTABLE_NAME \${APP_NAME}-mobile)
cc_ios_before_target(\${EXECUTABLE_NAME})
add_executable(\${EXECUTABLE_NAME} \${CC_ALL_SOURCES})
cc_ios_after_target(\${EXECUTABLE_NAME})
include(\${CC_PROJECT_DIR}/Qingye.cmake)
`;
writeFileSync(cmakePath,project);
let plist=readFileSync(join(source,'ios/Info.plist'),'utf8').replace('<string>0.7.2</string>',`<string>${version}</string>`);
plist=plist.replace('<string>702</string>',`<string>${version.split('.').reduce((n,x)=>n*100+Number(x),0)}</string>`);
writeFileSync(join(source,'ios/Info.plist'),plist);
cpSync('assets/resources/branding/cover.png',join(source,'ios/LaunchScreenBackground.png'));
for(const file of ['LaunchScreenBackgroundLandscape.png','LaunchScreenBackgroundPortrait.png'])rmSync(join(source,'ios',file),{force:true});
const icons=join(source,'ios/Images.xcassets/AppIcon.appiconset');
rmSync(icons,{recursive:true,force:true});mkdirSync(icons,{recursive:true});
const images=[];
for(const [idiom,items] of [['iphone',[[20,2],[20,3],[29,2],[29,3],[40,2],[40,3],[60,2],[60,3]]],['ipad',[[20,1],[20,2],[29,1],[29,2],[40,1],[40,2],[76,1],[76,2],[83.5,2]]],['ios-marketing',[[1024,1]]]]){
 for(const [points,scale] of items){const size=points*scale,filename=`icon-${size}.png`;images.push({idiom,size:`${points}x${points}`,scale:`${scale}x`,filename});if(!existsSync(join(icons,filename)))execFileSync('sips',['-z',String(size),String(size),'docs/release-android-0.7.1/media/qingye-icon-1024.png','--out',join(icons,filename)],{stdio:'ignore'});}
}
writeFileSync(join(icons,'Contents.json'),JSON.stringify({images,info:{version:1,author:'xcode'}},null,2));
const settings=join(root,'data/src/settings.json');
if(existsSync(settings)){const json=JSON.parse(readFileSync(settings));json.splashScreen={totalTime:0,logo:{type:'none'},background:{type:'default'},autoFit:true};writeFileSync(settings,JSON.stringify(json));}
await run(cmake,['-S',join(source,'ios'),'-B',join(root,'proj'),'-G','Xcode','-DCMAKE_SYSTEM_NAME=iOS',`-DRES_DIR=${root}`,'-DAPP_NAME=QingyeTales','-DLAUNCH_TYPE=Release','-DCMAKE_OSX_ARCHITECTURES=arm64','-DCMAKE_XCODE_ATTRIBUTE_CODE_SIGNING_ALLOWED=NO']);
const archive=join(artifacts,`QingyeTales-${version}-UNSIGNED.xcarchive`);
await run('xcodebuild',['-project',join(root,'proj/QingyeTales.xcodeproj'),'-scheme','QingyeTales-mobile','-configuration','Release','-sdk','iphoneos','-destination','generic/platform=iOS','-archivePath',archive,'-derivedDataPath',`/Volumes/mac/cache/sunny-farm/xcode-ios-${version}`,'-jobs','6','CODE_SIGNING_ALLOWED=NO','CODE_SIGNING_REQUIRED=NO','CODE_SIGN_IDENTITY=','IPHONEOS_DEPLOYMENT_TARGET=15.0','ENABLE_BITCODE=NO','archive']);
if(!existsSync(join(archive,'Products/Applications/QingyeTales-mobile.app/Info.plist')))throw Error('Native archive missing application.');
if(!existsSync(join(archive,'dSYMs/QingyeTales-mobile.app.dSYM/Contents/Resources/DWARF/QingyeTales-mobile')))throw Error('Crash symbol bundle missing.');
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const pack=async(folder,file)=>{
 await run('python3',['-c',`from pathlib import Path
import sys,zipfile
folder=Path(sys.argv[1])
with zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(folder.rglob('*')):
  if p.is_file() and not p.name.startswith('._') and p.name!='.DS_Store':z.write(p,p.relative_to(folder.parent))
`,folder,file]);
 writeFileSync(file+'.sha256',`${sha(file)}  ${file.split('/').at(-1)}\n`);
};
await pack(archive,join(releases,`QingyeTales-${version}-iOS-UNSIGNED.xcarchive.zip`));
const exported=join(releases,`QingyeTales-${version}-iOS-TestFlight`);
// This is a generated delivery directory; keep path caches and previous signing state out of it.
rmSync(exported,{recursive:true,force:true});
mkdirSync(join(exported,'native/engine'),{recursive:true});
for(const folder of ['ios','common'])cpSync(join(source,folder),join(exported,'native/engine',folder),{recursive:true});
cpSync(join(root,'data'),join(exported,'game/data'),{recursive:true});mkdirSync(join(exported,'game/proj'),{recursive:true});
writeFileSync(join(exported,'game/proj/cfg.cmake'),readFileSync(join(root,'proj/cfg.cmake'),'utf8').replace(/^set\(COCOS_X_PATH.*\n/m,''));
const configure=String.raw`#!/bin/bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
COCOS_EDITOR="${'${COCOS_CREATOR:-'+meta.editor+'}'}"
RESOURCE_DIR="$(cd "$(dirname "$COCOS_EDITOR")/../Resources" && pwd)"
rm -f "$PROJECT_DIR/game/proj/CMakeCache.txt"
rm -rf "$PROJECT_DIR/game/proj/CMakeFiles"
"$RESOURCE_DIR/tools/cmake/bin/cmake" -S "$PROJECT_DIR/native/engine/ios" -B "$PROJECT_DIR/game/proj" -G Xcode -DCMAKE_SYSTEM_NAME=iOS -DAPP_NAME=QingyeTales -DLAUNCH_TYPE=Release -DRES_DIR="$PROJECT_DIR/game" -DCOCOS_X_PATH="$RESOURCE_DIR/resources/3d/engine/native" -DCMAKE_OSX_ARCHITECTURES=arm64 -DCMAKE_XCODE_ATTRIBUTE_CODE_SIGNING_ALLOWED=YES -DDEVELOPMENT_TEAM="${'${APPLE_TEAM_ID:-}'}"
`;
writeFileSync(join(exported,'configure.command'),configure,{mode:0o755});
const sign=String.raw`#!/bin/bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
: "${'${APPLE_TEAM_ID:?Set APPLE_TEAM_ID to your Apple Developer Team ID first}'}"
if [[ ! "$APPLE_TEAM_ID" =~ ^[A-Z0-9]{10}$ ]]; then echo "Invalid APPLE_TEAM_ID"; exit 1; fi
"$PROJECT_DIR/configure.command"
xcodebuild -project "$PROJECT_DIR/game/proj/QingyeTales.xcodeproj" -scheme QingyeTales-mobile -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' -archivePath "$PROJECT_DIR/signed/QingyeTales.xcarchive" -derivedDataPath "$PROJECT_DIR/signed/DerivedData" -allowProvisioningUpdates DEVELOPMENT_TEAM="$APPLE_TEAM_ID" CODE_SIGNING_ALLOWED=YES CODE_SIGN_STYLE=Automatic archive
cat > "$PROJECT_DIR/signed/ExportOptions.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>method</key><string>app-store-connect</string><key>teamID</key><string>$APPLE_TEAM_ID</string><key>signingStyle</key><string>automatic</string><key>destination</key><string>export</string><key>uploadSymbols</key><true/></dict></plist>
EOF
xcodebuild -exportArchive -archivePath "$PROJECT_DIR/signed/QingyeTales.xcarchive" -exportOptionsPlist "$PROJECT_DIR/signed/ExportOptions.plist" -exportPath "$PROJECT_DIR/signed/export" -allowProvisioningUpdates
echo "Signed export is in signed/export. Upload with Xcode Organizer or Transporter when ready."
`;
writeFileSync(join(exported,'sign-testflight.command'),sign,{mode:0o755});
const releaseDocs=`docs/release-ios-${version}`;
if(existsSync(releaseDocs))cpSync(releaseDocs,join(exported,'docs'),{recursive:true});
writeFileSync(join(exported,'README.md'),`# 晴野物语 ${version} · TestFlight 工程\n\n先阅读 docs/TestFlight交付说明.md。本工程还未签名、上传或通过 Apple 审核。\n\n安装 Xcode 26+ 和 Cocos Creator 3.8.7，运行 configure.command 后打开 game/proj/QingyeTales.xcodeproj，选择 QingyeTales-mobile。\n\n在 Xcode 登录有付费开发者资格的账号并选择 Team；或设置 APPLE_TEAM_ID 后运行 sign-testflight.command（只归档和导出，不上传）。Bundle ID 为 com.qingyetales.farm，如未注册或已被占用，需使用你有权注册的标识并同步修改 Info.plist / Qingye.cmake / cfg.cmake。\n\n本机工具路径可通过 COCOS_CREATOR 环境变量覆盖。共享 Cocos 引擎不随包分发，必须安装 3.8.7。源资源已随包内置，游戏无需联网。\n`);
await pack(exported,exported+'.zip');
writeFileSync(join(artifacts,'build-result.json'),JSON.stringify({version,bundleId:meta.bundleId,minimumIOS:'15.0',staging:meta.staging,archive,project:exported,signed:false,uploaded:false},null,2));
console.log('Unsigned device archive and TestFlight signing project created. No upload performed.');
