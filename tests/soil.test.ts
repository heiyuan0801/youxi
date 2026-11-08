import test from 'node:test';
import assert from 'node:assert/strict';
import {newFarm,plant,harvest,water,readyPlot,secondsLeft,serialize,parseSave,plantAll,waterAll} from '../assets/scripts/FarmModel';
import {cropGrowSeconds,soilTier,upgradeSoil,waterCutMs,SOIL_COST,SOIL_GROWTH} from '../assets/scripts/FarmSoil';
import {LOCALES,SOIL_TEXT,t} from '../assets/scripts/SoilText';
import {refreshLife,weatherAt} from '../assets/scripts/FarmLife';
import {buyUpgrade} from '../assets/scripts/FarmFeatures';
const NOW=1800000000000;

test('soil tiers multiply growth on top of irrigation and keep exact wheat times',()=>{
  assert.equal(cropGrowSeconds(20,0,0),20);
  assert.equal(cropGrowSeconds(20,0,1),16);
  assert.equal(cropGrowSeconds(20,0,2),13);
  assert.equal(cropGrowSeconds(45,0,1),36);
  assert.equal(cropGrowSeconds(20,1,1),14.4);
  assert.deepEqual(SOIL_GROWTH[1],{num:4,den:5});
  assert.deepEqual(SOIL_GROWTH[2],{num:13,den:20});
  const black=newFarm(NOW);black.coins=500;assert.equal(upgradeSoil(black,4).ok,true);
  assert.equal(plant(black,4,'wheat',NOW).ok,true);assert.equal(black.plots[4].growSeconds,16);
  assert.equal(readyPlot(black.plots[4],NOW+15999),false);assert.equal(readyPlot(black.plots[4],NOW+16000),true);
  const red=newFarm(NOW);red.coins=500;red.inventory.feed=2;upgradeSoil(red,4);upgradeSoil(red,4);
  assert.equal(plant(red,4,'carrot',NOW).ok,true);assert.equal(red.plots[4].growSeconds,29.25);
  assert.equal(readyPlot(red.plots[4],NOW+29249),false);assert.equal(readyPlot(red.plots[4],NOW+29250),true);
  const both=newFarm(NOW);both.coins=1000;both.stars=5;both.xp=100;assert.equal(buyUpgrade(both,'irrigation').ok,true);assert.equal(upgradeSoil(both,4).ok,true);
  assert.equal(plant(both,4,'wheat',NOW).ok,true);assert.equal(both.plots[4].growSeconds,14.4);
  const plain=newFarm(NOW);plant(plain,5,'wheat',NOW);assert.equal(plain.plots[5].growSeconds,20);
});

test('black and red soil keep more water, and rain uses the same cut once',()=>{
  assert.equal(waterCutMs(45,0),9000);
  assert.equal(waterCutMs(36,1),10800);
  assert.equal(waterCutMs(13,2),5200);
  const s=newFarm(NOW);s.coins=200;upgradeSoil(s,4);plant(s,4,'carrot',NOW);
  assert.equal(water(s,4,NOW).ok,true);assert.equal(secondsLeft(s.plots[4],NOW),26);
  assert.equal(water(s,4,NOW).ok,false);assert.equal(readyPlot(s.plots[4],NOW+25199),false);assert.equal(readyPlot(s.plots[4],NOW+25200),true);
  const rain=newFarm(NOW);rain.life.epoch=NOW-240000;assert.equal(weatherAt(rain,NOW),'rain');
  Object.assign(rain.plots[4],{unlocked:true,soil:1,crop:'wheat',plantedAt:NOW,watered:false,growSeconds:16});
  refreshLife(rain,NOW);assert.equal(rain.plots[4].plantedAt,NOW-waterCutMs(16,1));assert.equal(rain.plots[4].watered,true);
  refreshLife(rain,NOW+100);assert.equal(rain.plots[4].plantedAt,NOW-waterCutMs(16,1));
});

test('upgrades charge the next tier only and never retimed a crop already planted',()=>{
  const s=newFarm(NOW),raw=serialize(s,NOW);
  assert.equal(upgradeSoil(s,29).ok,false);assert.equal(serialize(s,NOW),raw);
  s.coins=99;assert.equal(upgradeSoil(s,4).ok,false);assert.equal(s.coins,99);assert.equal(s.plots[4].soil,undefined);
  s.coins=105;assert.equal(upgradeSoil(s,4).ok,true);assert.equal(s.coins,5);assert.equal(s.plots[4].soil,1);assert.equal(SOIL_COST[1].coins,100);
  assert.equal(plant(s,4,'wheat',NOW).ok,true);assert.equal(s.plots[4].growSeconds,16);
  s.coins=240;const coins=s.coins,feed=s.inventory.feed;
  assert.equal(upgradeSoil(s,4).ok,false);assert.equal(s.coins,coins);assert.equal(s.inventory.feed,feed);assert.equal(s.plots[4].soil,1);assert.equal(s.plots[4].growSeconds,16);
  s.inventory.feed=2;assert.equal(upgradeSoil(s,4).ok,true);assert.equal(s.coins,0);assert.equal(s.inventory.feed,0);assert.equal(s.plots[4].soil,2);assert.equal(s.plots[4].growSeconds,16);
  assert.equal(upgradeSoil(s,4).ok,false);assert.equal(harvest(s,4,NOW+16000).ok,true);assert.equal(s.plots[4].soil,2);assert.equal(s.plots[4].crop,null);
  s.coins=5;assert.equal(plant(s,4,'wheat',NOW+16000).ok,true);assert.equal(s.plots[4].growSeconds,13);
});

test('flooded and locked plots block upgrades, and batch planting keeps each plot tier',()=>{
  const blocked=newFarm(NOW);blocked.coins=500;blocked.activities.stormPlot=4;const coins=blocked.coins;
  assert.equal(upgradeSoil(blocked,4).ok,false);assert.equal(blocked.coins,coins);assert.equal(blocked.plots[4].soil,undefined);
  assert.equal(plant(blocked,4,'wheat',NOW).ok,false);assert.equal(plantAll(blocked,'wheat',NOW).ok,true);assert.equal(blocked.plots[4].crop,null);
  const s=newFarm(NOW);s.coins=1000;assert.equal(upgradeSoil(s,4).ok,true);s.activities.stormPlot=5;s.plots[6].unlocked=false;
  assert.equal(plantAll(s,'wheat',NOW).ok,true);
  assert.equal(s.plots[4].crop,'wheat');assert.equal(s.plots[4].growSeconds,16);
  assert.equal(s.plots[5].crop,null);assert.equal(s.plots[6].crop,null);
  assert.equal(s.plots[7].crop,'wheat');assert.equal(s.plots[7].growSeconds,20);
  assert.equal(s.plots[8].crop,'wheat');assert.equal(s.plots[8].growSeconds,20);
  assert.equal(s.coins,1000-SOIL_COST[1].coins-5*3);
  const poor=newFarm(NOW);poor.coins=4;assert.equal(plantAll(poor,'wheat',NOW).ok,false);assert.equal(poor.coins,4);
  const locked=newFarm(NOW);assert.equal(plantAll(locked,'pumpkin',NOW).ok,false);assert.equal(locked.coins,120);
  s.coins=0;assert.equal(waterAll(s,NOW).ok,true);assert.equal(s.plots[4].watered,true);assert.equal(secondsLeft(s.plots[4],NOW),12);
});

test('soil tier and locale survive save and load, and bad soil is rejected',()=>{
  const s=newFarm(NOW);s.locale='ja';s.coins=500;s.inventory.feed=2;upgradeSoil(s,4);upgradeSoil(s,4);
  const loaded=parseSave(serialize(s,NOW),NOW)!;assert.ok(loaded);assert.equal(loaded.locale,'ja');assert.equal(loaded.plots[4].soil,2);assert.equal(loaded.inventory.feed,0);
  assert.equal(plant(loaded,4,'wheat',NOW).ok,true);assert.equal(loaded.plots[4].growSeconds,13);
  const old=JSON.parse(serialize(newFarm(NOW),NOW));delete old.locale;for(const plot of old.plots)delete plot.soil;const raw=JSON.stringify(old);
  const migrated=parseSave(raw,NOW)!;assert.equal(migrated.locale,'zh-CN');assert.equal(soilTier(migrated.plots[4]),0);assert.equal(migrated.plots[4].soil,undefined);assert.equal(JSON.stringify(old),raw);
  plant(migrated,4,'wheat',NOW);assert.equal(migrated.plots[4].growSeconds,20);
  for(const soil of [3,-1,1.5,'red',true]){const v=JSON.parse(serialize(newFarm(NOW),NOW));v.plots[0].soil=soil;assert.equal(parseSave(JSON.stringify(v),NOW),null);}
  const odd=JSON.parse(serialize(newFarm(NOW),NOW));odd.locale='fr';assert.equal(parseSave(JSON.stringify(odd),NOW)!.locale,'zh-CN');
});

test('soil and batch strings exist in every locale and unknown keys fall back',()=>{
  const keys=Object.keys(SOIL_TEXT['zh-CN']).sort();
  for(const locale of LOCALES){
    assert.deepEqual(Object.keys(SOIL_TEXT[locale]).sort(),keys);
    for(const key of keys)assert.equal(typeof SOIL_TEXT[locale][key as keyof typeof SOIL_TEXT['zh-CN']],'string');
  }
  assert.equal(t('soil.black',{},'zh-CN'),'黑土地');
  assert.equal(t('soil.red',{},'zh-TW'),'紅土地');
  assert.equal(t('soil.black',{},'en'),'Black soil');
  assert.equal(t('soil.black',{},'ja'),'黒土');
  assert.equal(t('soil.black',{},'ko'),'흑토');
  assert.equal(t('hud.plant',{},'en'),'Plant all');
  assert.equal(t('soil.upgrade',{name:'黑土地'},'nope'),'升级为黑土地');
  assert.equal(t('soil.missing',{},'ja'),'soil.missing');
  assert.equal(t('soil.coins',{name:'Black soil',coins:100},'en'),'Not enough coins · Black soil costs 100');
});
