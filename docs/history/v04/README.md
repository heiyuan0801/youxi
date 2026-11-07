# 晴野农场 · 0.4.0

Cocos Creator 3.8.7 + TypeScript 横屏农场，依据 [Cozy Farm 原站](https://cozy-farm-2d.rork.app/) 的公开前端代码、图片、布局和交互重建基础画面，扩展本地种植、养殖、加工、钓鱼和区域经营。

**0.4.0 新增：鸡叫／牛叫／收菜／升级音效、参考图样式的升级奖励卡、等级册补领奖励、三个真实扩张区域、苹果树／蜂箱、果园礼篮和新牧场。** 规划与后续方向见 `docs/expansion/v04/plan.md`。

## 试玩与编辑

本机试玩：<http://localhost:7526/?v=0.4.0>。

```sh
npm ci
npm run build
npm run serve
```

在 Cocos Dashboard 添加本目录，用 **Creator 3.8.7** 打开 `assets/scenes/Farm.scene`。H5 产物在 `build/web-desktop`，需通过 HTTP 服务访问。

构建脚本默认使用外置盘 `/Volumes/mac/tools/cocos/3.8.7/CocosCreator.app/Contents/MacOS/CocosCreator`，可通过 `COCOS_CREATOR` 指定其他位置。其他机器还需调整 `tsconfig.check.json` 中的引擎声明文件路径。3.8.8 在本机命令行导入场景时不稳定，本版固定使用已验证的 3.8.7。

## 操作

- 点成熟作物收获，点空田打开底部六种种子选择；选种会立即播种，继续滑过空田可连续播种。
- 再点同一块生长中的作物可浇水一次，缩短 20% 生长时间；成熟作物也支持划动收获。
- 拖动地图移动视角；滚轮、双指或右上角加减按钮缩放。
- 点动物产物气泡收鸡蛋和牛奶；点未产出的动物会触发动作反馈。
- 点鸡、牛都会播放对应叫声；收菜有采摘音效，升级有庆祝音效，音效开关立即生效。
- 升级展示大星星、等级、新解锁图标和奖励，点“太棒了！”领取。点击左上等级星或等级册可补领旧等级奖励；Esc跳过弹窗不会丢失奖励。
- 左上“开拓地图”在3／6／10级开放草甸、果林、牧场，支付金币和农场星后扩展地图，并赠送6块已开垦田地。新区有各自的田地价格牌，可以独立继续开垦；地图页可返回主农场。
- 果林里点苹果／蜂蜜气泡或对应树和蜂箱收获。苹果120秒、蜂蜜180秒各产一份，离线计时；可制作果园礼篮、出售或交新订单。
- 底部“农场／仓库／订单／商店”打开对应界面；谷仓、集市、农舍、鸡舍也有点击入口。
- 商店分土地、动物、装饰、农场星四页。装饰选中后点空草地放置；Esc 可取消。
- 左侧花圃可花 5 金币种花，一分钟后收获金币与农场星。
- 点风车或左上工坊，消耗原料制作面包、奶酪、果酱和南瓜派。基础队列有两个位置，按顺序加工，完成后手动领取；离线继续制作。
- 点池塘或左上钓鱼，消耗鱼饵抛竿，等“咬钩啦”后在 4.5 秒内收杆。溪流鱼和稀有锦鲤都能出售、交订单、点亮图鉴。初始 5 份鱼饵，每 5 分钟自然恢复一份至 5 份，可花 30 金币购买 5 份。
- 农场手记“今日”有 5 个可选目标，每日完成并领取任意 3 个，再领额外金币、农场星和鱼饵；北京时间零点更新。
- “建设”有三级水渠、工坊和照料升级，作用于下一轮生产；“图鉴”记录累计发现，集齐4／8／12／14／17种有奖励。
- 设置包含音乐、音效、振动、导出 JSON 和重新开始确认。进度自动保存，离线时间计入作物及动物产出计时。

## 已重建内容

- 原站 22×22 斜视地图、建筑、道路、池塘、栅栏、绿篱、树木及地块位置；初始 9 块田，可扩至 30 块。
- 原地图22×22，初始9块已开垦田地、30个田位；开拓三个区域后达到46×22、84个田位。新牧场增加鸡／牛容量，新伙伴可在新区活动。
- 6种作物、鸡和牛、5种加工商品、2种鱼、苹果和蜂蜜，共17种产品；12类按等级开放的循环订单、6个成长任务、每日目标、18格花圃、7种金币装饰和4种特别装饰。
- 母鸡、奶牛的四帧走路及啄食、刨地、扇翅、吃草、甩尾、睡觉等动作；3 位村民沿道路行走、坐凳、聊天；汽车和货车循环行驶，交货触发货车出发。
- 左侧等级／经验、右侧货币和计数器、四个底部入口、种子栏、仓库出售卡片、可滚动订单、商店四页及设置弹窗；包含原站图标、圆角渐变按钮、阴影与弹窗背景虚化。
- 语言学习入口改为农场手记，学习积分改为通过经营获取的农场星。

## 下载资料与工程结构

- `reference-site/`：原站公开静态快照，99 个文件，包括 HTML、9 个 JS 包、CSS、86 张 WebP 和 2 张 PNG；下载清单记录 URL、字节数与 SHA-256。另保存界面 SVG 图标、字体及字体许可文件。
- `assets/resources/refart/`：原图转换的 86 张 PNG 和 4 张界面图标，保留长宽比例和透明通道；`fonts/` 为原站字体。
- `assets/resources/expansion/`：内置 image_gen 生成的8张加工与钓鱼图标；`worldart/`：4张果林图标／蜂箱。图集、提示词和清单在 `docs/expansion/v03/` 和 `v04/`。
- `assets/resources/audio/`：4个WAV音效。鸡牛录音来源、处理方式和清单在 `docs/audio/`，收获和升级音效在工程内合成。
- `assets/scripts/`：可编辑的 Cocos TypeScript。`FarmModel` 管基础经营和存档，`FarmFeatures` 管加工／钓鱼／每日／设施／图鉴，`FarmProgression` 管等级奖励与区域生产，`WorldData` 管新地图，`FarmAudio` 管音效，`FeaturePanels` 和 `ProgressionPanels` 管玩法界面，其余场景、动作、交互模块继续保留。
- `docs/reference/v02/`：原站对照截图与转换清单。`artifacts/v04-*.png` 为本版实际 Cocos 运行截图；`docs/expansion/v04/levelup-reference.png` 为用户提供的升级弹窗参考。
- `docs/history/` 保留旧版文档；本版使用 `refart`、`expansion`、`worldart` 中的图片及 `audio` 音效。

原站归档是浏览器公开发布的打包前端，并非其未发布的原始工程或服务端源码。本 Cocos 工程使用自己的 TypeScript 实现，运行时无需连接原站。

## 检查与复现

```sh
npm run typecheck
npm test
# 先启动 npm run serve，再执行：
npm run smoke
npm run smoke:features
npm run smoke:progression
node tools/smoke-level-batch.mjs
# 图片工具需要 Pillow，可用 uv 隔离运行：
uv run --with pillow python tools/verify-reference-art.py
uv run --with pillow python tools/prepare-reference-art.py
```

浏览器检查默认使用本机 `/Volumes/mac/ms-playwright/...` 的 Chromium；其他机器可设置 `CHROME_PATH`。`tools/scan-reference.py` 校验并保留已归档资料，加 `--refresh` 可重新抓取已知公开资源。

48项逻辑测试、50项真实界面试玩检查通过，包含实际音频PCM输出检查，详见 `docs/verification.md`。存档键仍为 `sunny-meadow-farm-v1`；旧版先备份原始JSON，再补充新功能字段，保留既有进度。此版为本地H5／Cocos工程，尚未做真机或TapTap／微信容器验收，也未接入云存档、多人和支付。
