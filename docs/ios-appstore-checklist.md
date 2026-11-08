# 晴野物语 · App Store 上架缺口

核对日期：2026-11-07。引擎 Cocos Creator 3.8.7。本文只记录仓库里能核对的事实。没有 Apple 开发者账号，也没有把安装包提交到 App Store Connect。

## 当前工程

| 项 | 仓库里的状态 |
| --- | --- |
| 平台 | Web 预览是默认构建。iOS 用 `npm run build:ios` 调本机 Cocos 3.8.7 导出，再用 `npm run package:ios` 打未签名归档。Android 另有脚本，不是这次上架路径。 |
| 原生工程 | 源文件在 `platforms/ios/`：Info.plist、UIScene、安全区桥、存档导入导出、隐私清单。Xcode 工程要在 Mac 上现生成，不进这个仓库。 |
| 显示名 | 晴野物语（`CFBundleDisplayName`） |
| Bundle ID 占位 | `com.qingyetales.farm`（`Qingye.cmake` 与 `tools/build-ios.mjs`）。还没在 Apple 账号里核实是否属于你。 |
| 版本 / Build | `package.json` 与 Info.plist 都是 0.8.0 / 800。打包脚本会按 `package.json` 再写一次短版本和 Build。 |
| 最低系统 | iOS 15.0，真机 ARM64，Metal。`TARGETED_DEVICE_FAMILY` 是 iPhone + iPad。 |
| 方向 | 只允许左右横屏，iPhone 和 iPad 相同。竖屏网页会提示转过来。没有做竖屏布局。 |
| 全屏 | `UIRequiresFullScreen` 为真。iPad 分屏和台前调度不会把游戏裁成小窗。 |

## 图标、启动图、商店截图

图标母图是 `docs/release-android-0.7.1/media/qingye-icon-1024.png`。`package:ios` 用它生成 iPhone、iPad 和 1024 商店图标，不把全套尺寸提交进 git。

启动图用 `assets/resources/branding/cover.png` 覆盖 Cocos 默认横屏背景，并关掉引擎标志。没有单独的竖屏启动图，因为方向锁是横屏。

App Store 截图必须用真机或模拟器按 Apple 要求的尺寸另拍，不能拿 1920×1080 宣传图代替。至少准备：

- iPhone 6.7 英寸（1290×2796 或当前要求的等价尺寸）横屏 3 张以上
- iPhone 6.5 英寸，若该尺寸仍被要求
- iPad 13 英寸（2064×2752 或当前要求的等价尺寸）横屏 3 张以上

截图建议：主农场、种植与一键操作、旅行或探索、小屋。不要出现未实现的联机、内购或登录。

## 隐私

`platforms/ios/PrivacyInfo.xcprivacy`：不跟踪、不收集数据。声明了文件时间戳（C617.1）和系统启动时间（35F9.1），对应本地存档和游戏计时。

Info.plist 没有相册、相机、麦克风、定位、通讯录、跟踪（ATT）的用途说明。游戏也不使用这些能力。不要为了“齐全”补上用不到的权限字符串。

没有 `NSUserTrackingUsageDescription`，也没有广告 SDK。若以后加统计或广告，才需要 ATT 和营养标签更新。

App Store Connect 的隐私营养标签要账号持有人按实际行为填写：目前是本地存档，不上传账号数据。仓库里的游戏内说明在「设置 → 隐私与存档说明」。公开隐私政策网址还没有，审核表格不能空着。

加密出口合规没有在 plist 里写死。只使用系统 HTTPS 时，很多人会声明豁免，但这要按最终链接的库由账号持有人确认，不要抄别的项目。

## 账号、登录、内购、Game Center、云存档

都没有实现，也不要在商店文案里写成已有。

- 没有 Sign in with Apple，也没有第三方登录
- 没有内购、订阅或付费点
- 没有 Game Center、排行榜或成就
- 没有 iCloud 或服务器云存档。进度在本机，设置里可以导出 JSON

## 安全区、刘海、灵动岛、横条

`QingyeBridge.safeAreaJSON` 读取当前窗口的 `safeAreaInsets`，按屏幕宽高换算成比例。`hudLayout` 把界面缩进这个区域，所以刘海、灵动岛和底部横条在左右横屏时会让开等级、金币和底栏。

iPad 接近 4:3，界面按 16:9 居中，不再把手机界面拉高铺满。宽高比超过 2.4 的折叠屏外屏或双屏展开时，界面最宽约 2.2，按钮留在中间，不贴到两端。常见 20:9 手机仍用整块安全区。

## iPad 与折叠屏

- iPad 横屏可用，布局不再拉成 4:3。分屏和台前调度未开启。
- 竖屏不是支持方向。
- 折叠屏、双屏没有单独的原生工程。只要系统给出横屏尺寸，同一套 `hudLayout` 会按上面的比例处理。铰链挡在正中时，关键按钮在中间带，不靠外沿。
- 放大、缩小、设置和一键农事按钮的点击高度至少 44。没有 VoiceOver 标签，没有动态字号。

## 仍要你在 Apple 侧完成

这些不能写进仓库，也不能由这次修改代替：

1. 加入 Apple Developer Program，在 Xcode 登录，同意协议。
2. 注册 Bundle ID。若 `com.qingyetales.farm` 已被占用，同时改 `Qingye.cmake` 和 `tools/build-ios.mjs`。
3. 在 App Store Connect 创建 App，填写名称、副标题、描述、关键词、支持网址、版权、年龄分级和联系邮箱。
4. 用付费团队签名。`package:ios` 默认打的是未签名归档，不能安装，也不能上传。
5. 在真机上看 iPhone（带刘海或灵动岛）和 iPad：左右横屏、安全区、一键种植/浇水/收获、存档导出。
6. 按当年要求的尺寸上传截图和 1024 图标，填写隐私营养标签、加密问答和审核备注。
7. 确认素材可以商用。参考图清单在 `docs/reference/v02/art-manifest.json`，仓库里没有授权证明。
8. 上传后等处理。同一版本再次上传必须提高 Build，不能重复用 800。

构建命令（需要本机已安装 Cocos Creator 3.8.7，可用 `COCOS_CREATOR` 改路径）：

```
npm run build:ios
npm run package:ios
```

上传用 Xcode Organizer 或 Transporter。这次没有提交二进制。
