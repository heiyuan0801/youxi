# 0.4.0 音效来源

鸡叫、牛叫来自 Joseph SARDIN 的作者原站 LaSonothèque／BigSoundBank，页面标明 CC0，可下载、剪辑并在游戏中使用。

- 母鸡：[Poule et ponte #2](https://lasonotheque.org/poule-et-ponte-2-s0976.html)，原始 MP3 为 `chicken-original.mp3`，官方英文站音频地址为 `https://bigsoundbank.com/UPLOAD/mp3/0976.mp3`。
- 奶牛：[Vache qui meugle #5](https://lasonotheque.org/vache-qui-meugle-5-s2385.html)，原始 MP3 为 `cow-original.mp3`，官方英文站音频地址为 `https://bigsoundbank.com/UPLOAD/mp3/2385.mp3`。

游戏样本裁取响亮的短片段，淡入淡出、峰值归一，转换为单声道22050Hz、16bit WAV。收获音效由短噪声、拨弦与低频轻弹合成；升级音效由四个上行音符合成，均在本工程内生成。

可用 `python3 tools/prepare-audio.py` 复现。`manifest.json` 记录截取位置、长度、文件尺寸和 SHA-256。实际运行资源在 `assets/resources/audio/`。

## 0.7.1 Android 原生音频

`theme.wav` 为本工程生成的16音符轻音乐循环，`ui.wav` 为双音符点击提示，均为数学波形合成，单声道22050Hz、16bit WAV，无外部录音样本。`tools/prepare-native-assets.py` 可复现。原鸡叫、牛叫、收获和升级音效继续使用上述素材；音量与音乐／音效开关分别控制。模拟器运行使用静音参数，实际扬声器与振动手感需手机验证。

## 0.8.0 动物音效补全

27 种陆地动物各有单独的点击音效。鸡、牛保留原录音。兔子、仓鼠、孔雀等使用原创拟音。黄金羊和彩虹牛分别以 CC0 绵羊和牛录音变调并加铃音，独角兽使用原创拟音和铃音。猫抓鼠、小狗找到货袋和点击水产分别有独立反馈。

下列来源页标明 CC0。下载原始 MP3 保存于 `animals-cc0/`，游戏内使用经过截取、滤波、淡入淡出和统一响度处理的单声道 WAV。

| 用途 | 录音 | 作者 |
|---|---|---|
| 鸭子 | [Ducks #0276](https://bigsoundbank.com/ducks-s0276.html) | DenisChardonnet |
| 绵羊 | [Sheep #2343](https://bigsoundbank.com/sheep-1-s2343.html) | Joseph SARDIN |
| 山羊 | [Bleating Goat #0279](https://bigsoundbank.com/bleating-goat-1-s0279.html) | DenisChardonnet |
| 猫咪 | [Little meow of a cat #1473](https://bigsoundbank.com/little-meow-of-a-cat-3-s1473.html) | Joseph SARDIN |
| 小狗 | [Barking Dog Inside #0112](https://bigsoundbank.com/barking-dog-inside-s0112.html) | Joseph SARDIN |
| 马 | [Horse neighing #1542](https://bigsoundbank.com/horse-neighing-5-s1542.html) | Joseph SARDIN |
| 驴 | [Donkey, Braying #1551](https://bigsoundbank.com/donkey-braying-3-s1551.html) | Joseph SARDIN |
| 水产 | [Splash, small #1531](https://bigsoundbank.com/splash-small-3-s1531.html) | Joseph SARDIN |

使用 `python3 tools/prepare-animal-audio.py` 可重新生成新增及替换的 WAV。需本机安装 FFmpeg。游戏运行时从内置资源加载。

鲤鱼、鲫鱼、鲈鱼、螃蟹、龙虾使用同一段溅水录音再处理，不另引外部素材。`python3 tools/prepare-animal-audio.py --aquatic` 只重写这五个文件。`bird.wav` 仍未接到任何动物。
