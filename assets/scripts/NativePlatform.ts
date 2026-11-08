import {sys,native} from 'cc';
import type {Insets} from './HudLayout';
import type {FrameRate} from './FarmModel';
// Creator's declaration describes Android's signature argument; Objective-C selectors omit it.
const objc=(selector:string,...args:string[])=>(native.reflection.callStaticMethod as any)('QingyeBridge',selector,...args);
export function requestAndroidFrameRate(rate:FrameRate){
 if(!sys.isNative||sys.os!==sys.OS.ANDROID)return;
 try{native.reflection.callStaticMethod('com/cocos/game/QingyeFrameRate','setTarget','(I)V',rate);}catch{}
}
export function nativeInsets():Partial<Insets>{
 if(!sys.isNative||sys.os!==sys.OS.IOS)return{};
 try{return JSON.parse(objc('safeAreaJSON') as string);}catch{return{};}
}
export function nativeHaptic(){
 if(!sys.isNative)return;
 try{if(sys.os===sys.OS.IOS)objc('haptic');
 else if(sys.os===sys.OS.ANDROID)native.reflection.callStaticMethod('com/cocos/game/AppActivity','qingyeHaptic','()V');}catch{}
}
export function exportNativeSave(json:string){
 if(sys.os===sys.OS.IOS){if(!objc('exportSave:',json))throw Error('Save export unavailable');}
 else if(sys.os===sys.OS.ANDROID)native.reflection.callStaticMethod('com/cocos/game/AppActivity','exportSave','(Ljava/lang/String;)V',json);
 else throw Error('Unsupported native save export platform');
}
export function beginNativeSaveImport():boolean{
 if(sys.os===sys.OS.IOS)return !!objc('beginSaveImport');
 if(sys.os===sys.OS.ANDROID)return !!native.reflection.callStaticMethod('com/cocos/game/AppActivity','beginSaveImport','()Z');
 return false;
}
export function shareNative(text:string,svg:string):boolean{
 if(!sys.isNative||sys.os!==sys.OS.IOS)return false;
 try{return !!objc('shareText:imageSVG:',text,svg);}catch{return false;}
}
export function beginInvitePrompt():boolean{
 if(!sys.isNative||sys.os!==sys.OS.IOS)return false;
 try{return !!objc('beginInvitePrompt');}catch{return false;}
}
export function takeInvitePrompt():string{
 if(!sys.isNative||sys.os!==sys.OS.IOS)return '!error';
 try{return String(objc('takeInvitePrompt')||'');}catch{return '!error';}
}
export function takeNativeSaveImport():string{
 if(sys.os===sys.OS.IOS)return String(objc('takeSaveImport')||'');
 if(sys.os===sys.OS.ANDROID)return String(native.reflection.callStaticMethod('com/cocos/game/AppActivity','takeSaveImport','()Ljava/lang/String;')||'');
 return '!error';
}
