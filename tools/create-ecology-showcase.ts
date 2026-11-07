// Isolated visual fixture. Never writes to a user's browser save.
import {writeFileSync} from 'node:fs';
import {newFarm,CROPS,PRODUCTS,buyAnimal,serialize} from '../assets/scripts/FarmModel';
import {AQUATIC,ANIMALS,FACTORIES,TRAVEL_MAPS,FURNITURE} from '../assets/scripts/FarmCatalog';
import {openRegion} from '../assets/scripts/FarmProgression';
const now=Date.now(),s=newFarm(now);s.xp=200000;s.coins=100000;s.stars=1000;s.sound=false;s.music=false;

for(const id of PRODUCTS){s.inventory[id]=20;s.features.album.counts[id]=20;}
s.plots.forEach((p,i)=>Object.assign(p,{unlocked:true,crop:CROPS[i%CROPS.length].id,plantedAt:now-3600000,watered:true,growSeconds:CROPS[i%CROPS.length].seconds}));
for(const a of ANIMALS.slice(2))buyAnimal(s,a.id,now);
s.animals.forEach((a,i)=>{a.readyAt=now+(i%3===0?-1000:120000);s.life.care[a.id].bond=30;});
s.life.factories=FACTORIES.map(f=>f.id);s.life.maps=TRAVEL_MAPS.map(m=>m.id);s.life.home.owned=FURNITURE.map(f=>f.id);s.life.home.slots=['bed','desk','sofa','rug','housePlant','lamp'];
s.progression.claimedLevels=Array.from({length:100},(_,i)=>i+1);
for(const f of AQUATIC)s.ecology.ponds[f.id]={fed:true,readyAt:now+120000,cycles:0};
writeFileSync('artifacts/v06-showcase-save.json',serialize(s,now));
