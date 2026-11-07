# 晴野农场 · 0.2.0

Cocos Creator 3.8.7 + TypeScript 横屏农场，依据 [Cozy Farm 原站](https://cozy-farm-2d.rork.app/) 的公开前端代码、图片、布局和交互重建。0.2.0 使用原站美术与动作帧，替换了 0.1.0 的生成素材和简化界面。经营内容为种植、养殖、订单、花圃与农场任务。

## 试玩与编辑

本机试玩：<http://localhost:7526/?v=0.2.0>。

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
- 底部“农场／仓库／订单／商店”打开对应界面；谷仓、集市、农舍、鸡舍也有点击入口。
- 商店分土地、动物、装饰、农场星四页。装饰选中后点空草地放置；Esc 可取消。
- 左侧花圃可花 5 金币种花，一分钟后收获金币与农场星。
- 设置包含音乐、音效、振动、导出 JSON 和重新开始确认。进度自动保存，离线时间计入作物及动物产出计时。

## 已重建内容

- 原站 22×22 斜视地图、建筑、道路、池塘、栅栏、绿篱、树木及地块位置；初始 9 块田，可扩至 30 块。
- 6 种作物、鸡和牛、8 种农产品、循环订单、6 个普通农场任务、18 格花圃、7 种金币装饰和 4 种特别装饰。
- 母鸡、奶牛的四帧走路及啄食、刨地、扇翅、吃草、甩尾、睡觉等动作；3 位村民沿道路行走、坐凳、聊天；汽车和货车循环行驶，交货触发货车出发。
- 左侧等级／经验、右侧货币和计数器、四个底部入口、种子栏、仓库出售卡片、可滚动订单、商店四页及设置弹窗；包含原站图标、圆角渐变按钮、阴影与弹窗背景虚化。
- 语言学习入口改为农场手记，学习积分改为通过经营获取的农场星。

## 下载资料与工程结构

- `reference-site/`：原站公开静态快照，99 个文件，包括 HTML、9 个 JS 包、CSS、86 张 WebP 和 2 张 PNG；下载清单记录 URL、字节数与 SHA-256。另保存界面 SVG 图标、字体及字体许可文件。
- `assets/resources/refart/`：原图转换的 86 张 PNG 和 4 张界面图标，保留长宽比例和透明通道；`fonts/` 为原站字体。
- `assets/scripts/`：可编辑的 Cocos TypeScript。`FarmModel` 管经营和存档，`SceneLayout` 管地图数据，`FarmMotion` 管移动与动作，`FarmScene` 管画面，`FarmUI` 管原生界面，`FarmApp` 管交互与持久化。
- `docs/reference/v02/`：原站对照截图与转换清单。`artifacts/v02-*.png`、`v02-farm-motion.gif` 为本版实际 Cocos 运行截图和录像。
- `docs/history/v01/` 和旧生成素材保留作历史资料，本版运行画面使用 `refart`。

原站归档是浏览器公开发布的打包前端，并非其未发布的原始工程或服务端源码。本 Cocos 工程使用自己的 TypeScript 实现，运行时无需连接原站。

## 检查与复现

```sh
npm run typecheck
npm test
# 先启动 npm run serve，再执行：
npm run smoke
# 图片工具需要 Pillow，可用 uv 隔离运行：
uv run --with pillow python tools/verify-reference-art.py
uv run --with pillow python tools/prepare-reference-art.py
```

浏览器检查默认使用本机 `/Volumes/mac/ms-playwright/...` 的 Chromium；其他机器可设置 `CHROME_PATH`。`tools/scan-reference.py` 校验并保留已归档资料，加 `--refresh` 可重新抓取已知公开资源。

22 项逻辑测试、19 项真实界面试玩检查和资源哈希检查通过，详见 `docs/verification.md`。存档键仍为 `sunny-meadow-farm-v1`，旧版迁移前会备份，不清空既有进度。此版为本地 H5／Cocos 工程，尚未做真机或 TapTap／微信容器验收，也未接入云存档、多人和支付。
