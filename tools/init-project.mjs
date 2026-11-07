import {writeFileSync,mkdirSync,existsSync,readdirSync,readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
const uid='8c60c5e4-9d06-4bca-a5c1-e68ce36fc67b';
// Cocos script class IDs retain five hex characters, then encode groups of 12 bits.
const hex=uid.replaceAll('-',''),alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
let compressed=hex.slice(0,5);
for(let i=5;i<hex.length;i+=3){const value=parseInt(hex.slice(i,i+3),16);compressed+=alphabet[value>>6]+alphabet[value&63];}
const sceneUid='a926d98d-e0eb-413a-a0de-0a0b9b951ed1';
const ref=id=>({__id__:id});
const vec=(x,y,z=0)=>({__type__:'cc.Vec3',x,y,z});
const node=(name,parent,children,components,x=0,y=0,z=0)=>({__type__:'cc.Node',_name:name,_objFlags:0,_parent:ref(parent),_children:children.map(ref),_active:true,_components:components.map(ref),_prefab:null,_lpos:vec(x,y,z),_lrot:{__type__:'cc.Quat',x:0,y:0,z:0,w:1},_lscale:vec(1,1,1),_layer:33554432,_euler:vec(0,0),_id:randomUUID()});
const comp=(type,node,extras={})=>({__type__:type,_name:'',_objFlags:0,node:ref(node),_enabled:true,__prefab:null,...extras});
const scene=[
  {__type__:'cc.SceneAsset',_name:'Farm',_objFlags:0,_native:'',scene:ref(1)},
  {__type__:'cc.Scene',_name:'Farm',_objFlags:0,_parent:null,_children:[ref(2)],_active:true,_components:[],_prefab:null,autoReleaseAssets:false,_id:sceneUid},
  node('Canvas',1,[3],[5,6,7],800,450),node('Camera',2,[],[4],0,0,1000),
  comp('cc.Camera',3,{_projection:0,_priority:0,_fov:45,_fovAxis:0,_orthoHeight:450,_near:0,_far:2000,_color:{__type__:'cc.Color',r:187,g:224,b:230,a:255},_depth:1,_stencil:0,_clearFlags:7,_rect:{__type__:'cc.Rect',x:0,y:0,width:1,height:1},_visibility:33554432,_targetTexture:null}),
  comp('cc.UITransform',2,{_contentSize:{__type__:'cc.Size',width:1600,height:900},_anchorPoint:{__type__:'cc.Vec2',x:.5,y:.5}}),
  comp('cc.Canvas',2,{_cameraComponent:ref(4),_alignCanvasWithScreen:true}),
  comp(compressed,2)
];
writeFileSync('assets/scenes/Farm.scene',JSON.stringify(scene,null,2));
function meta(path,importer,uuid,ver,files=[],userData={}){const previous=existsSync(path+'.meta')?JSON.parse(readFileSync(path+'.meta','utf8')):null;writeFileSync(path+'.meta',JSON.stringify({ver,importer,imported:false,uuid:uuid||previous?.uuid||randomUUID(),files,subMetas:{},userData},null,2));}
meta('assets/scenes/Farm.scene','scene',sceneUid,'1.1.27',['.json']);
meta('assets/scripts/FarmApp.ts','typescript',uid,'4.0.23');
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.name.endsWith('.meta'))continue;if(e.isDirectory()){meta(p,'directory',null,'1.1.0');walk(p);}else if(p.endsWith('.ts'))meta(p,'typescript',null,'4.0.23');else if(p.endsWith('.png'))meta(p,'image',null,'1.0.22',['.png','.json'],{type:'texture',fixAlphaTransparencyArtifacts:false});}}
walk('assets');
mkdirSync('settings/v2/packages',{recursive:true});
writeFileSync('settings/v2/packages/project.json',JSON.stringify({__version__:'1.0.6',splashScreen:{totalTime:0,logo:{type:'none'},background:{type:'default'}},general:{designResolution:{width:1600,height:900,fitWidth:true,fitHeight:true}}},null,2));
writeFileSync('build-config.json',JSON.stringify({name:'SunnyFarm',platform:'web-desktop',buildPath:'project://build',debug:true,startScene:sceneUid,scenes:[{url:'db://assets/scenes/Farm.scene',uuid:sceneUid}],packages:{'web-desktop':{resolution:{designWidth:1600,designHeight:900}}}},null,2));
