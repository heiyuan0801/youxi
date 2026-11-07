# 0.6.0 新增素材

内置imagegen生成两张3×3透明图集，覆盖13种陆地动物和5种水产；已查看图集和实际Cocos场景。当前运行素材总数201张。

- animals-a：鹅、火鸡、鹌鹑、鸽子、水牛、仓鼠、驴、骆驼、牦牛。
- animals-b：鸵鸟、羊驼、梅花鹿、白孔雀、鲤鱼、鲫鱼、鲈鱼、龙虾、螃蟹。

提示词和生成来源见atlas-prompts.json；原图集保留于本目录。art-manifest.json记录切片、尺寸和SHA-256。assets/resources/nextart保存18个实际运行PNG，NextArt.ts保存32×32透明点击蒙版。

tools/normalize-next-art.py只做图集切分、透明噪点过滤、等比缩放与8像素边距，不绘制替代图片。运行图最长边不超过256px，均保留透明通道。

新动物使用精灵位移、转向、步伐起伏和呼吸，水产沿池塘轨迹游动；原鸡牛多帧动画继续保留。v06-animals-outing.gif来自真实Cocos连续截图，展示已实现的运动。
