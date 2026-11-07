export interface Insets {left:number;right:number;top:number;bottom:number;}
/** Insets are fractions of the native view, so UIKit points and render pixels agree. */
export function hudLayout(width:number,height:number,isNative:boolean,insets:Partial<Insets>={}){
 const edge=(n:number|undefined)=>Number.isFinite(n)?Math.max(0,Math.min(.2,n!)):0;
 const left=edge(insets.left)*width,right=edge(insets.right)*width,top=edge(insets.top)*height,bottom=edge(insets.bottom)*height;
 const innerW=width-left-right,innerH=height-top-bottom,viewScale=Math.max(.25,Math.min(width/1600,height/900));
 const density=isNative?Math.max(1,Math.min(innerW/960,innerH/540)):1;
 return{width:innerW/density,height:innerH/density,scale:density/viewScale,x:(left-right)/(2*viewScale),y:(bottom-top)/(2*viewScale)};
}
