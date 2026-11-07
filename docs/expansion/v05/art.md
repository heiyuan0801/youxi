# 0.5.0 素材记录

内置imagegen生成6张透明图集、81个运行精灵。参考现有奶牛、胡萝卜、农舍，保持暖棕轮廓、手绘阴影和斜视农场风格，已查看原图集和实际Cocos画面。

| 图集 | 格式 | 精灵数 |
|---|---|---:|
| animals-atlas.png | 4×3 | 12动物 |
| crops-atlas.png | 4×4 | 16作物 |
| goods-a-atlas.png | 4×4 | 16产物 |
| goods-b-atlas.png | 4×4 | 16产物／资源 |
| buildings-atlas.png | 3×3 | 9工厂 |
| places-atlas.png | 4×3 | 4地标、7家具、1木牌 |

原图集在本目录；完整提示词与来源为 `atlas-prompts.json`。运行PNG在 `assets/resources/lifeart`，`art-manifest.json`记录格位、尺寸和SHA-256。

`tools/normalize-life-art.py`用Pillow切分、归一化：过滤alpha<32的不可见噪点，按可见边界裁切，图标最长边≤256、建筑／地标≤384，保留8像素透明边距，不拉伸比例。`LifeArt.ts`记录尺寸及32×32 alpha点击蒙版。

```sh
uv run --with pillow python tools/normalize-life-art.py
```

原始生成文件仍保留，工程使用副本，不依赖临时生成路径。动物通过位移、翻转、步伐和呼吸运动，新动物没有单独多帧图集。原图集属于素材记录，实际效果以 `artifacts/v05-*.png` Cocos截图为准。
