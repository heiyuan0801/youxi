# 0.4.0 果林美术

本会话使用内置 `image_gen`，以原站胡萝卜素材作风格参考，生成一张2×2透明图集。最终主图保存为 `docs/expansion/v04/world-items-atlas.png`，经过按格裁切、alpha边界裁切和等比缩放后，接入以下运行文件：

- `assets/resources/worldart/apple.png`
- `assets/resources/worldart/honey.png`
- `assets/resources/worldart/orchardBasket.png`
- `assets/resources/worldart/beehive.png`

四张均为真实RGBA透明图片；尺寸和alpha范围见 `art-manifest.json`，可用 `uv run --with pillow python tools/prepare-world-art.py` 复现。升级弹窗的大星星、动物、石井使用已有原站图片，卡片、光芒、文字和按钮由Cocos原生界面绘制，未用一张静态截图代替交互。

生成提示词：

> Use case stylized-concept. Create ONE transparent game sprite atlas, a strict invisible 2 columns x 2 rows grid, four equally sized square cells with generous transparent gaps. Cozy hand-painted 2D isometric farming game style matching the reference's warm brown outlines, bright soft colors and rounded shaded volumes. Exact order: top-left: two shiny red apples with a green leaf; top-right: a small glass jar of amber golden honey, wooden lid and honey dipper resting beside it; bottom-left: a charming wicker gift basket holding two red apples, one honey jar and a small golden loaf of bread; bottom-right: a small freestanding wooden beehive box with an orange pitched roof, little landing board and one tiny bee, elevated 3/4 game view. One centered isolated object per cell, no crossing cell boundaries. True alpha transparent background, no ground, no dirt, no background painting, no panels, no text, no watermark. Crisp readable small-icon silhouettes, soft light from upper left. Reference image is style only; do not include carrots.
