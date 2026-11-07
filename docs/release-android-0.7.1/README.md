# 晴野物语 0.7.1 · Android交付

种一片田，养一群小伙伴，把日子过成喜欢的模样。

## 文件清单

- `QingyeTales-0.7.1-android-arm64.apk`：已签名的原生Cocos游戏安装包。
- `QingyeTales-0.7.1-android-arm64.apk.sha256`：安装包SHA-256校验值。
- `游戏介绍与玩法.md`：可编辑的完整玩法说明。
- `商店简介.txt`：一句话简介、短介绍和完整介绍。
- `media/qingye-cover.png`：1672×941横版游戏封面。
- `media/qingye-icon-1024.png`、`qingye-icon-512.png`：方形游戏图标。
- `media/qingye-icon-original.png`：1254×1254生成原图。
- `media/gameplay-*.png`：Android模拟器内真实游戏截图，2400×1080。
- `media/*prompt.json`：封面和图标的生成记录。

## 安装

1. 把APK文件传到安卓手机，用文件管理器打开。
2. 如果系统询问，允许当前文件管理器安装应用，再继续安装。
3. 打开桌面上的“晴野物语”，点击开始游戏，横屏游玩。

安装包ABI为ARM64，最低Android 5.0（API 21）、目标Android 15（API 35）；需要设备支持64位ARM应用和OpenGL ES 3。已在Android 15 ARM64模拟器安装运行，未做手机真机兼容性或性能验收。它不是iOS安装文件。

这是单机版，核心玩法无需联网。普通安装从1级开始，测试用高等级存档没有打入APK。已有同签名安装可覆盖升级；卸载或清除数据会失去本机进度。右上齿轮可导出JSON备份，当前尚无游戏内导入按钮。网页和APK的存档分别保存。

## 素材说明

封面延续0.7.0生成插画，本次新增图标使用内置图像生成工具直接生成，保留完整提示词。图标已写入Android各密度启动器资源，启动页使用“晴野物语”封面。

`gameplay-farm.png` 为正常新档收菜后的画面；旅行与房间图使用独立测试档解锁内容来展示实际运行界面。截图未将测试存档写入发行包。

Android中文字体来自Noto Sans SC，遵循SIL Open Font License 1.1，子集更名为Qingye SC；许可证在 `licenses/OFL-NotoSansSC.txt`。音乐和提示音由工程合成；鸡牛叫声来源说明在 `licenses/音效来源.md`。游戏截图与运行素材沿用当前工程；原站公开前端素材的来源记录仍保留在工程的 `reference-site`，本交付不作第三方素材独占权声明。

在线社交、互访、交易、合作社和排行榜尚未接入。详见同目录玩法和验证说明。
