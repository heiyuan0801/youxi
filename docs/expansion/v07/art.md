# 晴野物语 · 封面与启动页

本版使用内置 imagegen 生成新的品牌封面；没有指定或声称未经工具支持的模型版本。完整原始提示词与生成方式见 [cover-prompt.json](cover-prompt.json)。

- 原图：[qingye-cover.png](qingye-cover.png)，1672×941，不透明横版。
- 运行副本：`assets/resources/branding/cover.png`，Cocos资源自动导入；总图片资源202张。
- H5首屏：构建脚本复制同图到根目录作为加载背景，显示“晴野物语 · 正在准备农场…”。
- Cocos默认启动标识关闭；引擎资源就绪后移除加载层，显示原生开始页和“开始游戏”按钮。
- 标签标题、开始页、加载文字、存档导出名称均使用《晴野物语》。存档键和内部工程标识保留，避免丢旧进度。

图中标题已生成在图片内；按钮与副标题是游戏实际界面。封面是宣传插画，实际运行玩法截图见 `artifacts/v07-title-desktop.png`、`v07-free-room.png`、`v07-deep-mine-scene.png`、`v07-offline-report.png`。
