from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
import math, wave, struct

root = Path(__file__).resolve().parents[1]
source = Path('/Volumes/mac/codex/taptap/XianTu/client/assets/fonts/NotoSansSC.ttf')
text = ''.join(p.read_text() for p in (root/'assets/scripts').glob('*.ts'))
chars = ''.join(sorted(set(text + ''.join(chr(i) for i in range(32, 127)))))
font = instantiateVariableFont(TTFont(source), {'wght': 600}, inplace=True)
options = subset.Options(); options.name_IDs = ['*']; options.name_legacy = True
subsetter = subset.Subsetter(options=options); subsetter.populate(text=chars); subsetter.subset(font)
for record in font['name'].names:
    if record.nameID in (1, 4, 6):
        record.string = ('Qingye SC' if record.nameID != 6 else 'QingyeSC').encode(record.getEncoding(), errors='replace')
font.save(root/'assets/resources/fonts/QingyeSC.ttf')

rate = 22050
def make(name, notes, step, duration, amplitude):
    values = [0.0] * round(duration * rate)
    for index, frequency in enumerate(notes):
        start = round(index * step * rate)
        length = min(round(.32 * rate), len(values)-start)
        for i in range(length):
            t = i / rate; env = min(1, t/.015) * max(0, 1-t/.32)**2
            values[start+i] += amplitude * env * math.sin(2*math.pi*frequency*t)
    with wave.open(str(root/'assets/resources/audio'/name), 'wb') as out:
        out.setparams((1, 2, rate, len(values), 'NONE', 'not compressed'))
        out.writeframes(b''.join(struct.pack('<h', round(max(-1,min(1,v))*32767)) for v in values))
make('theme.wav', [523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,523.25,659.25,783.99,1046.5,880,783.99,659.25,587.33], .42, 6.72, .055)
make('ui.wav', [660,880], .07, .4, .09)
print('Prepared licensed Chinese font subset and original synthesized native audio.')
