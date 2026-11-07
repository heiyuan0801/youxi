# 0.3.0 新物品美术

使用本会话内置 `image_gen` 生成，未使用 CLI，也未标记为可选择的特定模型版本。原站胡萝卜图标作为风格参考；原站已有美术保持原样。

生成的主图已复制到工程 `docs/expansion/v03/items-atlas.png`，以 4 列 × 2 行切分、按 alpha 边界裁切、等比缩小、增加透明边距，得到以下实际运行文件：

- `assets/resources/expansion/bread.png`
- `assets/resources/expansion/cheese.png`
- `assets/resources/expansion/jam.png`
- `assets/resources/expansion/pie.png`
- `assets/resources/expansion/fish.png`
- `assets/resources/expansion/goldenFish.png`
- `assets/resources/expansion/bait.png`
- `assets/resources/expansion/watering.png`

8 张均为 RGBA，透明通道范围 0—255，原始比例保留。`art-manifest.json` 记录切分位置和尺寸；`tools/prepare-expansion-art.py` 可复现导入处理。制作过一次外缘清理候选，最终使用首版主图；检查确认预览中的极淡红色残留主要是 alpha=1 的像素，在游戏合成中不可见。

主图生成提示词：

> Use case: stylized-concept. Asset type: one game item sprite atlas for a cozy hand-painted 2D isometric farming game. Produce ONE square transparent PNG atlas with a STRICT invisible 4-column by 2-row grid of 8 equally sized cells. One isolated item per cell centered with generous fully transparent margins and no item crossing a cell boundary. Exact cell order, left to right: TOP ROW: (1) a plump golden scored loaf of wheat bread with one cut slice, (2) a yellow cheese wedge with round holes, (3) a small glass jar of red strawberry jam with a red gingham lid and a strawberry beside it, (4) a delicious golden pumpkin pie with a triangular slice and a small pumpkin beside it. BOTTOM ROW: (5) one friendly plump silvery blue freshwater fish viewed from the side, (6) one rare golden orange carp with a few tiny golden sparkles, (7) a small wooden bait pot with two curved earthworms, (8) a charming blue metal watering can with water droplets. Match the reference's delicate warm brown outlines, rounded volumes, soft painted shading, bright farm-game palette, light from upper left, lightly elevated 3/4 view, polished compact readable silhouette. Every cell is an isolated icon, no ground, no dirt mound, no UI frame, no text, no numbers, no logo, no cast shadow beyond the object, no checkerboard. Fully transparent alpha outside each object. This is a new atlas; the carrot image is style reference only.
