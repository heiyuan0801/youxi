import {readFileSync,writeFileSync,mkdirSync,existsSync,chmodSync,rmSync,readdirSync,cpSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {randomBytes,createHash} from 'node:crypto';
const meta=JSON.parse(readFileSync('artifacts/last-build-android.json')),version=JSON.parse(readFileSync('package.json')).version;
if(meta.version!==version)throw Error('Exported Android version differs from project');
const {staging,java,sdk}=meta,root=join(staging,'build/android'),source=join(staging,'native/engine'),app=join(source,'android/app');
const env={...process.env,JAVA_HOME:java,ANDROID_SDK_ROOT:sdk,ANDROID_HOME:sdk,GRADLE_USER_HOME:'/Volumes/mac/developer/gradle-cache',PATH:join(java,'bin')+':'+process.env.PATH};
const edit=(path,fn)=>writeFileSync(path,fn(readFileSync(path,'utf8')));
const run=(command,args,options={})=>new Promise((done,reject)=>{const p=spawn(command,args,{stdio:'inherit',env,...options});p.on('error',reject);p.on('close',code=>code===0?done():reject(Error(`${command} exited ${code}`)));});
edit(join(source,'common/Classes/Game.cpp'),s=>s.replaceAll('_debuggerInfo.enabled = true;','_debuggerInfo.enabled = false;').replaceAll('"0.0.0.0"','"127.0.0.1"'));
writeFileSync(join(source,'common/localCfg.cmake'),'set(USE_V8_DEBUGGER OFF)\nset(USE_V8_DEBUGGER_FORCE OFF)\nset(USE_SOCKET OFF)\nset(USE_WEBSOCKET_SERVER OFF)\nset(USE_WEBVIEW OFF)\nset(USE_VIDEO OFF)\n');
edit(join(root,'proj/build.gradle'),s=>s.replace('com.android.tools.build:gradle:8.0.2','com.android.tools.build:gradle:8.6.1'));
edit(join(root,'proj/gradle/wrapper/gradle-wrapper.properties'),s=>s.replace('gradle-8.0.2-bin.zip','gradle-8.7-bin.zip'));
edit(join(root,'proj/gradle.properties'),s=>s.replace(/^(?:RELEASE_.*|android.suppressUnsupportedCompileSdk=.*|org.gradle.workers.max=.*)\n?/gm,'').replace(/PROP_BUILD_TOOLS_VERSION=.*/,'PROP_BUILD_TOOLS_VERSION=36.0.0').replace(/PROP_APP_NAME=.*/,'PROP_APP_NAME=晴野物语')+'\nandroid.suppressUnsupportedCompileSdk=35\norg.gradle.workers.max=4\n');
edit(join(app,'build.gradle'),s=>s.replace(/^\s*ndkVersion "[^"]+"\n/gm,'\n').replaceAll(', "-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON"','').replace('ndkPath PROP_NDK_PATH','ndkPath PROP_NDK_PATH\n    ndkVersion "27.2.12479018"').replace(/versionCode \d+/,`versionCode ${version.split('.').reduce((n,x)=>n*100+Number(x),0)}`).replace(/versionName "[^"]+"/,`versionName "${version}"`).replace('"-DANDROID_ARM_NEON=TRUE"','"-DANDROID_ARM_NEON=TRUE", "-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON"'));
edit(join(app,'AndroidManifest.xml'),s=>s.replace(/^\s*<uses-permission[^\n]+\n/gm,'\n').replace('xmlns:android="http://schemas.android.com/apk/res/android"','xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools"').replaceAll(' xmlns:tools="http://schemas.android.com/tools" xmlns:tools="http://schemas.android.com/tools"',' xmlns:tools="http://schemas.android.com/tools"').replace('<application','<uses-permission android:name="android.permission.INTERNET" tools:node="remove"/>\n  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" tools:node="remove"/>\n  <uses-permission android:name="com.android.vending.BILLING" tools:node="remove"/>\n  <application').replaceAll('android:label="@string/app_name"','android:label="晴野物语"').replace('android:usesCleartextTraffic="true"','android:usesCleartextTraffic="false"').replace('android:screenOrientation="landscape"','android:screenOrientation="sensorLandscape"'));
const activity=join(app,'src/com/cocos/game/AppActivity.java');
edit(activity,s=>{
 if(s.includes('QINGYE_EXPORT'))return s;
 s=s.replace('public class AppActivity extends CocosActivity {',`public class AppActivity extends CocosActivity {
    private static final int QINGYE_EXPORT = 701;
    private static AppActivity current;
    private static String pendingSave;
    public static void exportSave(String json) {
        final AppActivity activity = current;
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            pendingSave = json;
            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("application/json");
            intent.putExtra(Intent.EXTRA_TITLE, "晴野物语-存档.json");
            activity.startActivityForResult(intent, QINGYE_EXPORT);
        });
    }`);
 s=s.replace('super.onCreate(savedInstanceState);','super.onCreate(savedInstanceState);\n        current = this;');
 s=s.replace('super.onActivityResult(requestCode, resultCode, data);',`super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == QINGYE_EXPORT) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null && pendingSave != null) {
                try (java.io.OutputStream stream = getContentResolver().openOutputStream(data.getData())) {
                    if (stream == null) throw new java.io.IOException("No destination");
                    stream.write(pendingSave.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    android.widget.Toast.makeText(this, "存档已导出", android.widget.Toast.LENGTH_SHORT).show();
                } catch (java.io.IOException error) {
                    android.widget.Toast.makeText(this, "导出失败，请重试", android.widget.Toast.LENGTH_SHORT).show();
                }
            }
            pendingSave = null;
            return;
        }`);
 return s;
});
edit(activity,s=>s.includes('qingyeHaptic')?s:s.replace('private static final int QINGYE_EXPORT = 701;',`private static final int QINGYE_EXPORT = 701;
    public static void qingyeHaptic() {
        final AppActivity activity = current;
        if (activity != null) activity.runOnUiThread(() -> activity.getSurfaceView().performHapticFeedback(android.view.HapticFeedbackConstants.KEYBOARD_TAP));
    }`));
edit(activity,s=>{
 if(s.includes('QINGYE_IMPORT'))return s;
 s=s.replace('private static final int QINGYE_EXPORT = 701;',`private static final int QINGYE_EXPORT = 701;
    private static final int QINGYE_IMPORT = 702;
    private static boolean importOpen;
    private static String importResult = "";

    public static synchronized boolean beginSaveImport() {
        final AppActivity activity = current;
        if (importOpen || activity == null || activity.isFinishing()) return false;
        importOpen = true;
        importResult = "";
        activity.runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                activity.startActivityForResult(intent, QINGYE_IMPORT);
            } catch (RuntimeException error) {
                finishSaveImport("!error");
            }
        });
        return true;
    }

    private static synchronized void finishSaveImport(String value) {
        importResult = value;
    }

    public static synchronized String takeSaveImport() {
        String result = importResult;
        if (!result.isEmpty()) {
            importResult = "";
            importOpen = false;
        }
        return result;
    }

    private void readSaveDocument(android.net.Uri uri) {
        new Thread(() -> {
            try (java.io.InputStream stream = getContentResolver().openInputStream(uri);
                 java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream()) {
                if (stream == null) throw new java.io.IOException("Missing file stream");
                byte[] buffer = new byte[8192];
                int count;
                while ((count = stream.read(buffer)) != -1) {
                    if (bytes.size() + count > 8 * 1024 * 1024) throw new java.io.IOException("File too large");
                    bytes.write(buffer, 0, count);
                }
                String value = bytes.toString("UTF-8");
                finishSaveImport(value.isEmpty() ? "!error" : value);
            } catch (java.io.IOException | RuntimeException error) {
                finishSaveImport("!error");
            }
        }, "QingyeSaveImport").start();
    }`);
 return s.replace('super.onActivityResult(requestCode, resultCode, data);',`super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == QINGYE_IMPORT) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null) readSaveDocument(data.getData());
            else finishSaveImport("!cancel");
            return;
        }`);
});
const icon=resolve('docs/release-android-0.7.1/media/qingye-icon-1024.png'),res=join(source,'android/res');
for(const [density,size]of [['mdpi',48],['hdpi',72],['xhdpi',96],['xxhdpi',144],['xxxhdpi',192]]){
 rmSync(join(root,'proj/res','mipmap-'+density,'ic_launcher.png'),{force:true});const dir=join(res,'mipmap-'+density);mkdirSync(dir,{recursive:true});execFileSync('sips',['-z',String(size),String(size),icon,'--out',join(dir,'ic_launcher.png')],{stdio:'ignore'});
}
await run('./gradlew',['assembleRelease','--no-daemon','--console=plain'],{cwd:join(root,'proj')});
const apks=[];function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('release-unsigned.apk'))apks.push(p);}}walk(join(root,'proj/build'));
if(apks.length!==1)throw Error('Expected exactly one unsigned release APK');
const privateRoot='/Volumes/mac/developer/private/qingye-tales/android-release',keystore=join(privateRoot,'release.p12'),credentials=join(privateRoot,'signing.json');mkdirSync(privateRoot,{recursive:true,mode:0o700});chmodSync(privateRoot,0o700);
if(!existsSync(keystore)&&!existsSync(credentials)){
 const password=randomBytes(36).toString('base64url'),alias='qingye-tales';writeFileSync(credentials,JSON.stringify({alias,password,keystore}),{mode:0o600});
 await run(join(java,'bin/keytool'),['-genkeypair','-keystore',keystore,'-storetype','PKCS12','-alias',alias,'-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Qingye Tales, OU=Android Release','-storepass:env','QINGYE_SIGN_PASSWORD','-keypass:env','QINGYE_SIGN_PASSWORD'],{env:{...env,QINGYE_SIGN_PASSWORD:password}});chmodSync(keystore,0o600);
}
if(!existsSync(keystore)||!existsSync(credentials))throw Error('Existing signing material incomplete; will not replace it');
const signing=JSON.parse(readFileSync(credentials)),bin=join(sdk,'build-tools/36.0.0'),output=resolve(`releases/QingyeTales-${version}-android-arm64.apk`),aligned=join(root,'release-aligned.apk');mkdirSync('releases',{recursive:true});
await run(join(bin,'zipalign'),['-f','-P','16','4',apks[0],aligned]);
await run(join(bin,'apksigner'),['sign','--ks',keystore,'--ks-key-alias',signing.alias,'--ks-pass','env:QINGYE_SIGN_PASSWORD','--key-pass','env:QINGYE_SIGN_PASSWORD','--out',output,aligned],{env:{...env,QINGYE_SIGN_PASSWORD:signing.password}});
await run(join(bin,'apksigner'),['verify','--verbose',output]);await run(join(bin,'zipalign'),['-c','-P','16','4',output]);
writeFileSync(output+'.sha256',createHash('sha256').update(readFileSync(output)).digest('hex')+'  '+output.split('/').at(-1)+'\n');
mkdirSync('build/android',{recursive:true});cpSync(join(root,'data'),resolve('build/android/data'),{recursive:true});
console.log('Signed native Cocos APK:',output);
