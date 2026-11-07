// Expansion data has no engine or save dependencies. IDs are stable save keys.
export const EXTRA_CROPS=[
 {id:'rice',name:'水稻',seconds:55,cost:12,sell:27,xp:5,level:2},
 {id:'potato',name:'土豆',seconds:75,cost:16,sell:36,xp:6,level:3},
 {id:'cabbage',name:'卷心菜',seconds:100,cost:22,sell:50,xp:8,level:4},
 {id:'cucumber',name:'黄瓜',seconds:120,cost:26,sell:60,xp:9,level:5},
 {id:'soybean',name:'大豆',seconds:140,cost:28,sell:64,xp:10,level:7},
 {id:'cotton',name:'棉花',seconds:180,cost:38,sell:89,xp:13,level:9},
 {id:'sugarcane',name:'甘蔗',seconds:210,cost:42,sell:98,xp:15,level:11},
 {id:'watermelon',name:'西瓜',seconds:280,cost:58,sell:138,xp:20,level:13},
 {id:'grape',name:'葡萄',seconds:320,cost:65,sell:155,xp:23,level:16},
 {id:'orange',name:'橙子',seconds:340,cost:72,sell:175,xp:25,level:19},
 {id:'sunflowerCrop',name:'油葵',seconds:360,cost:80,sell:195,xp:28,level:22},
 {id:'cocoa',name:'可可',seconds:420,cost:98,sell:240,xp:33,level:26},
 {id:'coffee',name:'咖啡',seconds:480,cost:110,sell:275,xp:38,level:30},
 {id:'lavender',name:'薰衣草',seconds:540,cost:125,sell:315,xp:44,level:35},
 {id:'auroraBerry',name:'极光莓',seconds:660,cost:160,sell:410,xp:55,level:45},
 {id:'goldenPumpkin',name:'黄金南瓜',seconds:900,cost:240,sell:630,xp:80,level:60}
] as const;
export type ExtraCropId=typeof EXTRA_CROPS[number]['id'];
export const LIFE_ITEMS={carp:{name:'鲤鱼',sell:65},crucian:{name:'鲫鱼',sell:80},bass:{name:'鲈鱼',sell:140},lobster:{name:'龙虾',sell:260},crab:{name:'螃蟹',sell:210},flour:{name:'面粉',sell:28},feed:{name:'饲料',sell:18},wool:{name:'羊毛',sell:86},truffle:{name:'松露',sell:160},goatMilk:{name:'羊奶',sell:98},duckEgg:{name:'鸭蛋',sell:45},fur:{name:'兔绒',sell:94},feather:{name:'孔雀羽',sell:200},butter:{name:'黄油',sell:156},yogurt:{name:'酸奶',sell:210},appleJuice:{name:'苹果汁',sell:118},orangeJuice:{name:'橙汁',sell:440},grapeJuice:{name:'葡萄汁',sell:390},cloth:{name:'棉布',sell:225},clothes:{name:'衣服',sell:700},sugar:{name:'蔗糖',sell:240},chocolate:{name:'巧克力',sell:860},candy:{name:'糖果',sell:720},vinegar:{name:'果醋',sell:420},coffeeBrew:{name:'手冲咖啡',sell:520},floralTea:{name:'薰衣草花茶',sell:640},sunTea:{name:'葵花凉茶',sell:380},berryTea:{name:'极光莓茶',sell:860},estateBox:{name:'庄园礼盒',sell:2400},planks:{name:'木板',sell:55},fruitCan:{name:'水果罐头',sell:920},vegCan:{name:'蔬菜罐头',sell:190},cake:{name:'浆果蛋糕',sell:700},cookies:{name:'曲奇',sell:520},wood:{name:'木材',sell:20},ore:{name:'铜矿',sell:35},coal:{name:'煤炭',sell:28},gem:{name:'蓝宝石',sell:180},herb:{name:'香草',sell:40},ice:{name:'冰晶',sell:85},rainbowMilk:{name:'彩虹奶',sell:420},goldenWool:{name:'黄金羊毛',sell:360}} as const;
export type LifeProductId=keyof typeof LIFE_ITEMS;
export const ANIMALS=[
 {id:'hen',name:'母鸡',sprite:'chicken',product:'egg',seconds:40,xp:5,level:2,cost:120,rarity:0,size:58,role:'下蛋的小院好伙伴',group:'养殖'},
 {id:'cow',name:'奶牛',sprite:'cow',product:'milk',seconds:80,xp:9,level:5,cost:380,rarity:0,size:111,role:'产出新鲜牛奶',group:'养殖'},
 {id:'duck',name:'鸭子',sprite:'duck',product:'duckEgg',seconds:65,xp:7,level:3,cost:220,rarity:0,size:64,role:'产出鸭蛋',group:'养殖'},
 {id:'sheep',name:'绵羊',sprite:'sheep',product:'wool',seconds:110,xp:12,level:7,cost:560,rarity:0,size:84,role:'羊毛可织成衣服',group:'养殖'},
 {id:'pig',name:'小猪',sprite:'pig',product:'truffle',seconds:170,xp:18,level:10,cost:850,rarity:0,size:85,role:'帮你寻找地下松露',group:'养殖'},
 {id:'goat',name:'山羊',sprite:'goat',product:'goatMilk',seconds:120,xp:13,level:12,cost:980,rarity:0,size:83,role:'产出醇香羊奶',group:'养殖'},
 {id:'rabbit',name:'兔子',sprite:'rabbit',product:'fur',seconds:140,xp:14,level:6,cost:420,rarity:0,size:56,role:'产出柔软兔绒',group:'宠物'},
 {id:'cat',name:'猫咪',sprite:'cat',product:'herb',seconds:160,xp:12,level:4,cost:280,rarity:0,size:62,role:'巡逻抓鼠，每轮带回香草',group:'宠物'},
 {id:'dog',name:'小狗',sprite:'dog',product:'wood',seconds:160,xp:12,level:4,cost:300,rarity:0,size:66,role:'守护探险队，探索奖励+1',group:'宠物'},
 {id:'horse',name:'马',sprite:'horse',product:'herb',seconds:150,xp:16,level:15,cost:1500,rarity:0,size:105,role:'探险等待缩短25%',group:'宠物'},
 {id:'peacock',name:'孔雀',sprite:'peacock',product:'feather',seconds:220,xp:24,level:20,cost:2200,rarity:1,size:82,role:'产出华美羽毛',group:'养殖'},
 {id:'goldenSheep',name:'黄金羊',sprite:'goldenSheep',product:'goldenWool',seconds:240,xp:32,level:32,cost:4200,rarity:2,size:87,role:'绵羊繁殖也有机会获得',group:'稀有'},
 {id:'rainbowCow',name:'彩虹牛',sprite:'rainbowCow',product:'rainbowMilk',seconds:260,xp:36,level:40,cost:5400,rarity:2,size:115,role:'奶牛繁殖也有机会获得',group:'稀有'},
 {id:'unicorn',name:'独角兽',sprite:'unicorn',product:'gem',seconds:300,xp:45,level:50,cost:8000,rarity:3,size:110,role:'探险等待缩短40%，产出宝石',group:'稀有'},
 {id:'goose',name:'鹅',sprite:'goose',product:'egg',seconds:90,xp:10,level:8,cost:480,rarity:0,size:76,role:'看家护院，产出鲜蛋',group:'养殖'},
 {id:'turkey',name:'火鸡',sprite:'turkey',product:'feather',seconds:150,xp:15,level:14,cost:1100,rarity:0,size:82,role:'产出温暖羽毛',group:'养殖'},
 {id:'quail',name:'鹌鹑',sprite:'quail',product:'egg',seconds:36,xp:5,level:6,cost:300,rarity:0,size:48,role:'小巧勤快的产蛋伙伴',group:'养殖'},
 {id:'pigeon',name:'鸽子',sprite:'pigeon',product:'feather',seconds:120,xp:12,level:9,cost:640,rarity:0,size:55,role:'收集漂亮羽毛',group:'养殖'},
 {id:'buffalo',name:'水牛',sprite:'buffalo',product:'milk',seconds:110,xp:15,level:24,cost:2500,rarity:0,size:114,role:'产出醇厚牛奶',group:'养殖'},
 {id:'hamster',name:'仓鼠',sprite:'hamster',product:'herb',seconds:90,xp:10,level:8,cost:480,rarity:0,size:46,role:'搜寻小小香草',group:'宠物'},
 {id:'donkey',name:'驴',sprite:'donkey',product:'wood',seconds:130,xp:15,level:18,cost:1800,rarity:0,size:96,role:'驮回森林木材',group:'宠物'},
 {id:'camel',name:'骆驼',sprite:'camel',product:'milk',seconds:150,xp:26,level:65,cost:6400,rarity:1,size:118,role:'沙漠来客，产出鲜奶',group:'养殖'},
 {id:'yak',name:'牦牛',sprite:'yak',product:'wool',seconds:140,xp:25,level:61,cost:6000,rarity:1,size:112,role:'雪域来客，厚绒纺织',group:'养殖'},
 {id:'ostrich',name:'鸵鸟',sprite:'ostrich',product:'egg',seconds:80,xp:20,level:28,cost:3000,rarity:1,size:100,role:'草原长腿伙伴',group:'养殖'},
 {id:'alpaca',name:'羊驼',sprite:'alpaca',product:'wool',seconds:100,xp:22,level:36,cost:3800,rarity:1,size:96,role:'柔软羊毛用于纺织',group:'养殖'},
 {id:'deer',name:'梅花鹿',sprite:'deer',product:'herb',seconds:110,xp:22,level:42,cost:4600,rarity:1,size:95,role:'森林伙伴，寻找香草',group:'养殖'},
 {id:'whitePeacock',name:'白色孔雀',sprite:'whitePeacock',product:'feather',seconds:150,xp:40,level:75,cost:9000,rarity:3,size:100,role:'极光可提前解锁领养',group:'稀有'}
] as const;
export type AnimalId=typeof ANIMALS[number]['id'];
export const animalSpec=(id:AnimalId)=>ANIMALS.find(a=>a.id===id)!;
export const FACTORIES=[
 {id:'bakery',name:'面包房',level:1,cost:0,description:'面包、曲奇、蛋糕'},
 {id:'mill',name:'磨坊',level:1,cost:0,description:'小麦→面粉，大豆→饲料'},
 {id:'dairy',name:'奶制品厂',level:5,cost:300,description:'牛奶→黄油、酸奶、奶酪'},
 {id:'juice',name:'果汁工厂',level:6,cost:450,description:'苹果、橙子、葡萄→果汁'},
 {id:'textile',name:'纺织厂',level:9,cost:650,description:'棉花→棉布→衣服'},
 {id:'candy',name:'糖果工厂',level:11,cost:800,description:'甘蔗→糖，可可→巧克力'},
 {id:'brewing',name:'酿造工坊',level:16,cost:1000,description:'葡萄→果醋，咖啡与花草→茶饮'},
 {id:'lumber',name:'木材工厂',level:3,cost:250,description:'木材→木板→家具，50级可做庄园礼盒'},
 {id:'cannery',name:'罐头工厂',level:19,cost:1400,description:'果蔬→罐头'}
] as const;
export type FactoryId=typeof FACTORIES[number]['id'];
export const TRAVEL_MAPS=[
 {id:'village',name:'工匠小镇',level:1,cost:0,icon:'factory_bakery',description:'九类工厂 · 独立生产队列',loot:['wood']},
 {id:'forest',name:'青杉森林',level:3,cost:180,icon:'forestCamp',description:'采木、香草与松露 · 远行探险',loot:['wood','herb','truffle']},
 {id:'mine',name:'蓝晶矿山',level:8,cost:650,icon:'mineEntrance',description:'铜矿、煤炭与宝石 · 建设自动化',loot:['ore','coal','gem']},
 {id:'beach',name:'贝壳海滩',level:15,cost:1200,icon:'beachPier',description:'海边钓鱼 · 收集漂流物资',loot:['fish','wood','gem']},
 {id:'snow',name:'极光雪原',level:30,cost:2600,icon:'snowCabin',description:'冰晶、宝石与稀有种子',loot:['ice','gem','auroraBerry']}
] as const;
export type TravelId=typeof TRAVEL_MAPS[number]['id'];
export type MapId='home'|TravelId;
export const FURNITURE=[{id:'bed',name:'绿叶小床',cost:180,planks:2,cloth:1},{id:'sofa',name:'暖橙沙发',cost:260,planks:2,cloth:2},{id:'desk',name:'木质书桌',cost:160,planks:3,cloth:0},{id:'rug',name:'蓝色地毯',cost:120,planks:0,cloth:2},{id:'housePlant',name:'绿叶盆栽',cost:80,planks:1,cloth:0},{id:'lamp',name:'暖光落地灯',cost:140,planks:1,cloth:0},{id:'bookshelf',name:'小书柜',cost:220,planks:4,cloth:0},{id:'cabinet',name:'宝石陈列柜',cost:640,planks:4,cloth:1,gems:1,level:40},{id:'teaTable',name:'花茶几',cost:560,planks:3,cloth:2,gems:1,level:36}] as const;
export type FurnitureId=typeof FURNITURE[number]['id'];
export const SEASONS=['春','夏','秋','冬'] as const;
export const WEATHER_NAMES={sunny:'晴天',rain:'细雨',storm:'暴雨',thunder:'雷电',snow:'大雪',rainbow:'彩虹',aurora:'极光'} as const;
export type WeatherId=keyof typeof WEATHER_NAMES;
// Dedicated sprites can replace these aliases. Keys are product ids; values are existing crop art.
export const ART_PLACEHOLDERS:Record<string,string>={coffeeBrew:'coffee',floralTea:'lavender',sunTea:'sunflowerCrop',berryTea:'auroraBerry',estateBox:'cake',cabinet:'bookshelf',teaTable:'desk'};
export const furnitureGems=(f:{gems?:number})=>f.gems??0;
export const furnitureLevel=(f:{level?:number})=>f.level??3;

export const AQUATIC=[
 {id:'carp',name:'鲤鱼',level:4,cost:180,seconds:90,output:2},
 {id:'crucian',name:'鲫鱼',level:10,cost:380,seconds:110,output:2},
 {id:'bass',name:'鲈鱼',level:22,cost:900,seconds:150,output:2},
 {id:'crab',name:'螃蟹',level:45,cost:1800,seconds:200,output:2},
 {id:'lobster',name:'龙虾',level:70,cost:3600,seconds:240,output:2}
] as const;
export type AquaticId=typeof AQUATIC[number]['id'];
