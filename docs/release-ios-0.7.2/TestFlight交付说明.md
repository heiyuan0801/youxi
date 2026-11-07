# 晴野物语 0.7.2 · TestFlight 测试交付

目标是先进行 TestFlight 内部测试，再决定是否开放外部测试。本次不自动上传、不添加测试人员、不提交 App Store 正式审核。

## 包信息

| 项目 | 内容 |
| --- | --- |
| 游戏名 | 晴野物语 / Qingye Tales |
| 版本 / Build | 0.7.2 / 702 |
| Bundle ID | com.qingyetales.farm，尚未核实 Apple 账号中的注册归属 |
| 引擎 | Cocos Creator 3.8.7 |
| 架构 / 渲染 | 真机 ARM64 / Metal |
| 最低系统 | iOS / iPadOS 15.0（兼容目标，最低版本真机未验收） |
| 设备 / 方向 | iPhone、iPad，左右横屏，全屏游戏 |
| 玩法 | 单机离线；不要求注册、联网或内购 |

## 已完成的工程适配

- UI 依据 UIKit 安全区域调整，避开刘海、灵动岛和底部手势区；保留 Android 旧布局。
- 接入 UIScene 启动和前后台生命周期；恢复游戏时保留原有存档与离线结算逻辑。
- iOS 触感反馈、系统“文件”存档导出；不申请相册、联系人、定位、麦克风等权限。
- 游戏内“设置 → 隐私与存档说明”可直接阅读，无需网络。
- 品牌启动图、iPhone / iPad 图标和 1024 像素商店图标；关闭 Cocos 启动标志。
- 隐私清单声明不跟踪、不收集数据，以及容器内文件元数据和游戏计时所需 API 的使用理由。
- 去掉默认的任意 HTTP 放行；关闭 V8 调试服务、Socket/WebSocket 服务、WebView 与 Video 模块。
- Cocos 旧语言读取改为 NSLocale，方向与初始窗口大小改为当前 UIWindowScene / UIWindow；改动仅存在于该工程的生成文件，不修改共享引擎安装。

## 签名和上传

发布者已确认目前没有付费 Apple Developer 账号，当前机器也没有可用的 Apple 代码签名身份。`UNSIGNED.xcarchive.zip` 仅用于检查编译结果，不能直接安装，也不能上传为可用 TestFlight 构建。TestFlight 需先加入 [Apple Developer Program](https://developer.apple.com/programs/)。如仅在自己的 iPhone 测试，可用免费 Apple 账号通过 Xcode 连接设备调试；这不是 TestFlight 分发，仍需实际登录、配对设备并完成开发签名。

1. 在 Xcode → Settings → Accounts 登录具有 Apple Developer Program 资格的账号；在账号与 App Store Connect 中确认协议、角色和创建 App 的权限。
2. 注册属于你的 Bundle ID，在 App Store Connect 创建《晴野物语》App 记录。若现有标识已被占用，先同步修改 `Info.plist`、`Qingye.cmake`、`game/proj/cfg.cmake` 后重新配置。
3. 解压工程，运行 `configure.command`，打开 `game/proj/QingyeTales.xcodeproj`，选择 `QingyeTales-mobile`，配置 Signing Team 和 Automatic Signing。
4. 选择 Any iOS Device，执行 Product → Archive。也可在终端设置 `APPLE_TEAM_ID` 后执行 `sign-testflight.command`。脚本只生成签名归档和导出文件，不上传。
5. 在 Xcode Organizer 验证归档，确认应用图标、Bundle ID、版本、签名和隐私清单后，通过 Organizer 或 Transporter 上传。
6. 等待 Apple 处理构建并处理加密出口合规问题。此版本未配置非豁免加密结论；须依据最终链接内容和实际功能填写，不要直接套用别的项目答案。
7. 填入 `TestFlight测试文案.md`，配置有效反馈邮箱。内部组的人员须具有适当 App Store Connect 访问资格；邀请普通外部用户需要外部测试流程和 Beta App Review。
8. 先按下方清单完成真机验收。后续上传同一版本时必须提高 Build 号，不能重复使用 702。

`configure.command` 默认使用本机 Cocos 3.8.7 路径；换机器时可设置 `COCOS_CREATOR` 为编辑器可执行文件路径。迁移目录后重新运行配置脚本即可重建路径。不要将证书、私钥、描述文件或 Apple 密码提交进源码。

## TestFlight 真机验收清单

- 首次安装、冷启动、连续游玩、强退重开，名称和启动图正确，无黑屏与闪退。
- 至少一台带刘海/灵动岛的 iPhone、一台 iPad；左右横屏，检查等级、货币、底栏、弹窗、滚动列表和触摸坐标。
- 采收 → 购买 → 种植 → 动物产物 → 加工 → 订单 → 升级奖励，库存和金币没有重复增加或丢失。
- 进入旅行场景后能看到返回主农场入口；基因育种、小屋拖拽装修、深度探索、自动农场均可操作。
- 切后台、锁屏、来电/音频中断后返回；音乐恢复合理，静音开关与游戏内开关正常，触感可关闭。
- 等待或后台放置后结算离线收益，重复开关应用不重复领奖，最长按当前规则结算 8 小时。
- 开飞行模式重新启动并游玩；游戏资源无需下载。TestFlight 安装、更新、验证与反馈本身仍依赖 Apple 服务。
- 导出 JSON 到“我的 iPhone/iPad”或用户选定位置；取消导出不影响存档，磁盘不足时给出提示。当前没有游戏内导入按钮，不能宣传一键跨设备迁移。
- 使用旧版本存档升级验证；卸载会丢失本机数据，不用真实进度进行重置测试。
- 20 分钟以上游玩，检查温度、内存、流畅度和系统崩溃报告。

## 发布前仍需补齐

| 项目 | 当前状态 / 处理 |
| --- | --- |
| Apple Developer 账号、Team、签名证书、描述文件 | 需账号持有人在 Xcode 完成；本次未取得签名身份 |
| App Store Connect App 记录与 Bundle ID 归属 | 未确认 |
| 原生真机体验 | 未验收；编译通过不代表真机启动或审核通过 |
| 反馈邮箱、隐私政策公开 URL、开发者主体信息 | 尚未提供；随包隐私网页是待补齐的草稿，不是已上线网址 |
| 素材商业使用授权 | `docs/reference/v02/art-manifest.json` 记录了 90 个参考网站素材，项目内未发现授权证明；对外分发前取得许可或替换 |
| Apple 加密出口、年龄分级、内容版权声明 | 由账号持有人依据最终内容如实填写；不预设审核结论 |
| 外部测试 | 如需邀请外部玩家，补齐 Beta App Review 信息并等待 Apple 审核 |
| 正式上架 | 另需实际设备截图、商店元数据、发布地区适用资质等；1920×1080 宣传图不等于 App Store 设备截图 |

## 官方依据（核对日期：2026-11-07）

- [Apple SDK 上传要求](https://developer.apple.com/news/upcoming-requirements/?id=04282026a)：2026-04-28 起要求 Xcode 26 / iOS 26 SDK 或更高。本次使用本机 Xcode 27 / iOS 27 SDK。
- [UIScene 生命周期迁移](https://developer.apple.com/documentation/uikit/transitioning-to-the-uikit-scene-based-life-cycle)：本工程已接入场景生命周期。
- [TestFlight 概览](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)：内部与外部测试的角色和审核流程不同。
- [隐私清单所需 API 理由](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype)：容器文件元数据 C617.1；应用计时 35F9.1。
- [App 隐私信息](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/) 与 [审核指南](https://developer.apple.com/app-store/review/guidelines/)：提交前须如实披露数据处理并具备内容权利。
