import type {FarmState,CropId,ProductId} from './FarmModel';
import type {FurnitureId,TravelId} from './FarmCatalog';
import type {RecipeId} from './FarmFeatures';
export type Trait='production'|'temper'|'vitality';
export interface Genome {production:[number,number];temper:[number,number];vitality:[number,number];parents:[number,number]|null;generation:number;mutated:boolean;}
export interface RoomItem {id:number;type:FurnitureId;x:number|null;y:number|null;rotation:number;}
export const EXPLORE_EVENTS=['bridge','nest','spring','fox','vein','shell','flare','puzzle'] as const;
export type ExploreEvent=typeof EXPLORE_EVENTS[number];
export interface ExploreRun {map:TravelId;seed:number;depth:number;step:number;stamina:number;bag:Partial<Record<ProductId,number>>;event:null|ExploreEvent;companion:number|null;}
export interface AutoReport {seconds:number;limited:boolean;harvests:number;plants:number;products:number;crafts:number;feeds:number;coinsSpent:number;xp:number;items:Partial<Record<ProductId,number>>;unread:boolean;}
export interface Advanced {
 schema:1;genes:Record<number,Genome>;offspring:Record<number,Genome>;
 room:{size:number;wall:number;floor:number;serial:number;items:RoomItem[]};
 explore:{serial:number;run:ExploreRun|null;best:Partial<Record<TravelId,number>>;claimed:Partial<Record<TravelId,number>>;seen:Partial<Record<TravelId,ExploreEvent[]>>};
 auto:{built:boolean;enabled:boolean;cursor:number;replant:boolean;animals:boolean;ponds:boolean;craft:boolean;seed:CropId;recipes:RecipeId[];report:AutoReport|null};
}
export const newAdvanced=(now=Date.now()):Advanced=>({schema:1,genes:{},offspring:{},room:{size:6,wall:0,floor:0,serial:0,items:[]},explore:{serial:0,run:null,best:{},claimed:{},seen:{}},auto:{built:false,enabled:false,cursor:now,replant:false,animals:true,ponds:false,craft:false,seed:'wheat',recipes:[],report:null}});
export function migrateAdvanced(s:FarmState,now:number){const a=newAdvanced(now),positions=[[.23,.23],[.53,.2],[.78,.23],[.25,.65],[.55,.55],[.78,.76]];for(const type of s.life.home.owned){const index=s.life.home.slots.indexOf(type),pos=positions[index];a.room.items.push({id:++a.room.serial,type,x:pos?pos[0]:null,y:pos?pos[1]:null,rotation:0});}return a;}
