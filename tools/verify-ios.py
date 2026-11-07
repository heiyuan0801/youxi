"""Validate the exported device archive, not just source templates."""
import json
import plistlib
import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
meta = json.loads((root/'artifacts/ios-0.7.2/build-result.json').read_text())
archive = Path(meta['archive'])
app = archive/'Products/Applications/QingyeTales-mobile.app'
binary = app/'QingyeTales-mobile'
info = plistlib.loads((app/'Info.plist').read_bytes())
privacy = plistlib.loads((app/'PrivacyInfo.xcprivacy').read_bytes())
checks = []

def check(value, description):
    assert value, description
    checks.append(description)

def command(*args):
    return subprocess.check_output(args, text=True)

check(info['CFBundleIdentifier']=='com.qingyetales.farm', 'expected bundle identifier')
check(info['CFBundleShortVersionString']=='0.7.2' and info['CFBundleVersion']=='702', 'version 0.7.2 build 702')
check(info['CFBundleDisplayName']=='晴野物语', 'Chinese display name')
check(info['MinimumOSVersion']=='15.0' and info['DTSDKName']=='iphoneos27.0', 'iOS 15 deployment target and iOS 27 build SDK')
check(info['UIDeviceFamily']==[1,2], 'iPhone and iPad families')
for suffix in ['', '~ipad']:
    check(set(info['UISupportedInterfaceOrientations'+suffix])=={'UIInterfaceOrientationLandscapeLeft','UIInterfaceOrientationLandscapeRight'}, f'landscape orientations {suffix or "iPhone"}')
scene=info['UIApplicationSceneManifest']
check(scene['UIApplicationSupportsMultipleScenes'] is False and scene['UISceneConfigurations']['UIWindowSceneSessionRoleApplication'][0]['UISceneDelegateClassName']=='QingyeSceneDelegate', 'single UIScene lifecycle configured')
check('NSAppTransportSecurity' not in info and not any(k.endswith('UsageDescription') for k in info), 'no blanket ATS bypass or protected-data permission prompts')
check(not (app/'_CodeSignature').exists() and not (app/'embedded.mobileprovision').exists(), 'explicitly unsigned archive')
check('arm64' in command('xcrun','lipo','-info',str(binary)), 'device ARM64 executable')
strings=command('strings',str(binary))
check(all(x in strings for x in ['QingyeBridge','QingyeSceneDelegate','safeAreaJSON','exportSave:']), 'native scene and reflection bridges retained in binary')
symbols=command('xcrun','nm','-u',str(binary))
check('_mach_absolute_time' in symbols and '_fstat' in symbols, 'actual required-reason timer and file APIs inspected')
check('NSUserDefaults' not in symbols, 'legacy system UserDefaults language access removed')
check(privacy['NSPrivacyTracking'] is False and privacy['NSPrivacyCollectedDataTypes']==[] and privacy['NSPrivacyTrackingDomains']==[], 'no tracking or collected-data declarations')
reasons={x['NSPrivacyAccessedAPIType']:x['NSPrivacyAccessedAPITypeReasons'] for x in privacy['NSPrivacyAccessedAPITypes']}
check(reasons=={'NSPrivacyAccessedAPICategoryFileTimestamp':['C617.1'],'NSPrivacyAccessedAPICategorySystemBootTime':['35F9.1']}, 'file-container and in-app timer reasons bundled')
check((app/'ThirdPartyNotices.txt').exists(), 'font licenses and sound credits bundled')
dsym=archive/'dSYMs/QingyeTales-mobile.app.dSYM'
uuids=re.findall(r'UUID: ([A-F0-9-]+)',command('xcrun','dwarfdump','--uuid',str(binary),str(dsym)))
check(len(uuids)==2 and uuids[0]==uuids[1], 'dSYM UUID matches executable')
check((app/'Assets.car').is_file() and (app/'Base.lproj/LaunchScreen.storyboardc').is_dir(), 'compiled app icons and launch storyboard bundled')
icon_meta=json.loads((Path(meta['project'])/'native/engine/ios/Images.xcassets/AppIcon.appiconset/Contents.json').read_text())
check({'iphone','ipad','ios-marketing'}=={x['idiom'] for x in icon_meta['images']}, 'iPhone, iPad and 1024 marketing icon catalog entries')
result={'passed':True,'checks':checks,'uuid':uuids[0],'version':'0.7.2','build':'702','signed':False,'uploaded':False,'nativeDeviceTested':False,'archive':str(archive)}
(root/'artifacts/ios-0.7.2/native-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False,indent=2))
