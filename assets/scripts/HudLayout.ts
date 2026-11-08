export interface Insets {left:number;right:number;top:number;bottom:number;}
export const MIN_TOUCH=44;
/** Landscape farm. iPad is near 4:3; phones stay under ~21:9; wider than that is a fold or dual screen. */
export function deviceClass(width:number,height:number):'phone'|'tablet'|'wide'{
 const aspect=width/Math.max(height,1);
 if(aspect>=1&&aspect<1.5)return 'tablet';
 if(aspect>2.4)return 'wide';
 return 'phone';
}
/** Insets are fractions of the native view, so UIKit points and render pixels agree. */
export function hudLayout(width:number,height:number,isNative:boolean,insets:Partial<Insets>={}){
 const edge=(n:number|undefined)=>Number.isFinite(n)?Math.max(0,Math.min(.2,n!)):0;
 const left=edge(insets.left)*width,right=edge(insets.right)*width,top=edge(insets.top)*height,bottom=edge(insets.bottom)*height;
 const innerW=Math.max(1,width-left-right),innerH=Math.max(1,height-top-bottom),aspect=innerW/innerH;
 let boxW=innerW,boxH=innerH;
 if(aspect>=1&&aspect<1.5)boxH=Math.min(innerH,innerW*9/16);
 else if(aspect>2.4)boxW=Math.min(innerW,innerH*2.2);
 const boxLeft=left+(innerW-boxW)/2,boxRight=right+(innerW-boxW)/2,boxTop=top+(innerH-boxH)/2,boxBottom=bottom+(innerH-boxH)/2;
 const viewScale=Math.max(.25,Math.min(width/1600,height/900));
 const density=isNative?Math.max(1,Math.min(boxW/960,boxH/540)):1;
 return{width:boxW/density,height:boxH/density,scale:density/viewScale,x:(boxLeft-boxRight)/(2*viewScale),y:(boxBottom-boxTop)/(2*viewScale)};
}
