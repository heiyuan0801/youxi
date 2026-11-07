"""Render the Android player guide. Needs ReportLab and tmp/pdfs/QingyeGuide.ttf."""
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/release-android-0.7.1/晴野物语-玩法指南.pdf'
MEDIA = OUT.parent / 'media'
pdfmetrics.registerFont(TTFont('QingyeGuide', str(ROOT/'tmp/pdfs/QingyeGuide.ttf')))
W, H = 595.28, 841.89
INK, GREEN, SOFT = '#354c3c', '#4b8c61', '#748473'
c = canvas.Canvas(str(OUT), pagesize=(W, H))
c.setTitle('晴野物语 · 玩法指南 0.7.1')
c.setAuthor('晴野物语')
styles = {
 'body': ParagraphStyle('body',fontName='QingyeGuide',fontSize=10.5,leading=18,textColor=colors.HexColor(INK),wordWrap='CJK'),
 'small': ParagraphStyle('small',fontName='QingyeGuide',fontSize=9,leading=15,textColor=colors.HexColor(SOFT),wordWrap='CJK'),
 'head': ParagraphStyle('head',fontName='QingyeGuide',fontSize=16,leading=24,textColor=colors.HexColor(GREEN),wordWrap='CJK'),
 'title': ParagraphStyle('title',fontName='QingyeGuide',fontSize=35,leading=45,textColor=colors.HexColor(INK),wordWrap='CJK'),
}
def text(t,y,style='body',x=42,width=511):
 p=Paragraph(escape(t).replace('\n','<br/>'),styles[style]); _,h=p.wrap(width,H);p.drawOn(c,x,y-h);return y-h
def rule(y):
 c.setStrokeColor(colors.HexColor('#dce5d3'));c.setLineWidth(.7);c.line(42,y,W-42,y)
def page(n,title,tag):
 c.setFillColor(colors.HexColor('#fffdf7'));c.rect(0,0,W,H,fill=1,stroke=0)
 text('晴野物语  /  QINGYE TALES',H-29,'small')
 text(tag,H-29,'small',420,133)
 text(title,H-73,'head');rule(H-111)
 text('0.7.1 单机版 · 横屏农场经营',33,'small')
 text(f'{n:02d} / 05',33,'small',510,50)
def section(title,body,y):
 y=text(title,y,'head')-7;y=text(body,y)-20;return y
def photo(name,x,y,width):
 from reportlab.lib.utils import ImageReader
 im=ImageReader(str(MEDIA/name));iw,ih=im.getSize();height=width*ih/iw
 c.drawImage(im,x,y-height,width,height,mask='auto');return y-height

page(1,'把日子过成喜欢的模样','玩家指南')
y=photo('qingye-cover.png',42,710,511)
y=text('晴野物语',y-23,'title')-8
y=text('种一片田，养一群小伙伴。',y,'head')-13
y=text('播种、收获、照顾动物，把原材料加工成美味商品。用订单赚来的金币扩建农场，装扮自己的小屋，再带上伙伴去森林、矿山、海滩和雪原旅行。',y)-23
c.drawImage(str(MEDIA/'qingye-icon-512.png'),42,y-88,88,88,mask='auto')
text('22种作物  ·  27种陆地动物 + 5种水产\n100级成长  ·  9类工厂 / 26份配方\n主农场 + 5处旅行地图',y-6,'body',150,400)
text('封面为宣传插画。实际游戏画面见下一页；所有内容以当前单机版本为准。',112,'small')
c.showPage()

page(2,'从第一块田开始','01  新手入门')
y=710
steps=[('1  收菜与播种','点成熟作物收获，产物进仓库并获得经验。点空地选种，选好后可划过空地连续播种。'),('2  浇水与养殖','再次点生长中的作物浇水，每轮一次。点鸡、牛互动或收取成熟产物；在“动物伙伴”里喂食、治疗。'),('3  订单与升级','底部“订单”交货赚金币和经验，仓库可出售余货。升级后点星星奖励卡的“太棒了！”领取。'),('4  扩建与加工','“开拓地图”开放草甸、果林、牧场，新区还需逐块开垦。“工坊”加工能提升原材料价值。')]
for a,b in steps:
 y=text(a,y,'head')-4;y=text(b,y)-13
y=photo('gameplay-farm.png',42,y-3,511)-13
text('常用操作：双指缩放，拖动空白处移动地图；长面板上下滑动，右上角“×”关闭。底部为农场、仓库、订单和商店，右上齿轮打开设置。',y)
c.showPage()

page(3,'伙伴与农场的成长','02  动物 / 经营')
y=710
y=section('养好每一位小伙伴','饱食、心情、健康、亲密度、成长等级和基因影响动物表现。普通动物、稀有动物各有产物；猪找松露、猫带回香草，狗和马等伙伴能帮助探索。陆地动物可以一起出去玩，也可召回小院。',y)
y=section('基因育种','入口：动物伙伴 → 基因育种。选择同族双亲，再选产能、温顺或体质方向。双亲需成年、亲密≥20、心情≥60，且不在冷却。消耗150金币和6饲料；2分钟后接回幼崽，再过5分钟长大，双亲冷却1小时。自身、亲子和共享父母的兄弟姐妹不能配对。',y)
y=text('产能基因提高下一轮生产效率；温顺有利于互动亲密；体质减缓饥饿。基因、双亲和代数会保存，刷新不能重抽。普通与稀有同族可配对，例如奶牛和彩虹牛。',y)-22
y=section('从原料到商品','工厂各有独立队列，同厂顺序加工，基础2格可升级到5格。投入实际原料，完成后领取；订单交货与仓库出售是主要收入来源。',y)
rows=[['生产链','加工过程'],['主食','小麦 → 面粉 → 面包'],['纺织','棉花 → 棉布 → 衣服'],['木工','木材 → 木板 → 家具'],['甜品','甘蔗 → 糖 → 糖果 / 巧克力']]
table=Table([[Paragraph(escape(v),styles['body']) for v in row] for row in rows],colWidths=[110,401])
table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e5eddc')),('BACKGROUND',(0,1),(-1,-1),colors.HexColor('#f4f5e9')),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('LINEBELOW',(0,0),(-1,-1),.5,colors.white)]));_,th=table.wrap(511,500);table.drawOn(c,42,y-th)
text('每20分钟换季、每4分钟换天气。雨天自动浇水，部分作物遇大雪暂停生长；四季面板可参与当季交货活动。',y-th-21)
c.showPage()

page(4,'出门冒险，回家装修','03  旅行 / 家园')
y=710
y=section('旅行与明确的回家入口','打开左侧“旅行手册”，前往工匠小镇、青杉森林、蓝晶矿山、贝壳海滩或极光雪原。旅行场景顶部常驻“返回主农场”按钮，随时可回家；仍在进行的分层探索可继续。',y)
y=section('深入12层资源区域','进入森林、矿山、海滩或雪原，再从旅行手册打开“分层探索”。出发花4农场体力，探索有独立体力，每层推进3次。可采集、扎营或处理修桥、照顾幼鸟等事件，成年动物能同行。等级与体力决定能否深入。',y)
y=text('点击“安全返程 · 物资入库”才结算探索背包；每层首次完成另得80金币和2农场星。海滩码头可钓鱼，雪原探索可冰湖垂钓。',y)-22
y=section('自由装修小屋','入口：右侧“我的小屋”。先选家具再点地板摆放，或直接拖动家具；可旋转、收回，支持同款多件，最多40件。地毯能与家具搭配，其他家具需要留出距离。',y)
y=text('墙面与地板各4种配色。房间从6×6扩到8×8需800金币、3木板；从8×8扩到10×10需1600金币、5木板。摆放与配色自动保存。',y)-23
y=photo('gameplay-travel.png',42,y,511)-10
text('Android模拟器内实际画面；旅行画面使用独立测试存档解锁地图展示。',y,'small')
c.showPage()

page(5,'让农场在离开后继续运转','04  自动化 / 安装')
y=710
y=section('离线自动化','10级在“自动农场”花800金币、10木材、5铜矿建管理站。收菜器和喂养器需另建并开启，再选择补种、动物产物、水产与加工循环等任务。每厂可选一种自动配方。',y)
y=text('自动补种扣种子费；喂养与水产循环扣饲料；加工扣实际配方原料。缺料暂停对应任务。最多结算8小时，回来可查看收获、支出和库存净变化；报告中的产物已入库，确认不会再次发货。',y)-23
y=section('安装与开始游戏','将交付包中的 .apk 文件发送到安卓手机，用文件管理器打开。按系统提示允许当前文件来源安装后完成安装。桌面名称为“晴野物语”，牛和小鸡图标；点击开始游戏，横屏游玩。此包为ARM64版本，适用于支持64位ARM应用的Android 5.0及以上设备。',y)
y=section('进度与备份','右上齿轮 → 导出存档，会打开Android系统文件选择器，选位置保存JSON。进度保存在本机；APK与网页版分别保存。卸载或清除数据前请先导出。本版尚无游戏内导入按钮，恢复备份需后续导入功能或开发者协助。',y)
y=section('当前版本范围','0.7.1为本地单机版，安装后核心玩法不依赖联网。好友互访、玩家交易、合作社和线上排行榜尚未接入。Android 15 ARM64模拟器已验证安装、启动、触控、存档与导出；手机真机兼容性、扬声器及振动反馈仍需真机检查。',y)
text('一起慢慢种，慢慢收，慢慢把这里变成你的家。',y-5,'head')
c.save()
print(OUT)
