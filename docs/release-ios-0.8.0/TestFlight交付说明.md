# 晴野物语 0.8.0 · iOS 工程

版本 0.8.0（Build 800），Bundle ID `com.qingyetales.farm`，iPhone 与 iPad 横屏，最低部署目标 iOS 15.0。由 Cocos Creator 3.8.7 导出，使用 Xcode 编译真机 ARM64。游戏资源与存档都在本地。

运行 `configure.command` 生成 Xcode 工程，选取 `QingyeTales-mobile` scheme。付费开发者团队可通过 Xcode 签名，或设置 `APPLE_TEAM_ID` 运行 `sign-testflight.command`，再用 Organizer 或 Transporter 上传。当前交付是未签名归档和工程文件，真机与 TestFlight 验收仍待完成。

测试时请重点确认「设置 → 导入存档」能选取旧版 JSON，预览并确认后可继续经营。「恢复本机备份」可以恢复替换前的进度。核对取消选择、无效文件、前后台切换和断网运行。签名、素材权利和隐私政策公开地址沿用 0.7.2 交付说明中的待办。
