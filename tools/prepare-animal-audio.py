"""Prepare offline animal voices from CC0 recordings and original synthesis."""

from array import array
from concurrent.futures import ThreadPoolExecutor
import math
from pathlib import Path
import random
import subprocess
import urllib.request
import wave

ROOT = Path(__file__).resolve().parents[1]
RATE = 22050
DESTINATION = ROOT / 'assets/resources/audio'
RECORDINGS = ROOT / 'docs/audio/animals-cc0'

# BigSoundBank sound number and target excerpt length in seconds.
SAMPLES = {
    'duck': ('0276', 1.10),
    'sheep': ('2343', 1.20),
    'goat': ('0279', 1.40),
    'cat': ('1473', 1.00),
    'dog': ('0112', 1.10),
    'horse': ('1542', 1.75),
    'donkey': ('1551', 1.95),
    'pondSplash': ('1531', .70),
}

# Resonant frequencies, roughness, tremolo rate, then syllables as
# (start, duration, starting pitch, ending pitch).
CALLS = {
    'pig': ((430, 1150), .35, 19, [(0, .16, 145, 85), (.19, .17, 161, 93), (.40, .23, 192, 123)]),
    'rabbit': ((970, 2200), .20, 7, [(0, .11, 710, 415), (.16, .13, 575, 322)]),
    'peacock': ((1350, 2400), .10, 9, [(0, .45, 840, 490), (.49, .31, 731, 391)]),
    'goose': ((1050, 1760), .21, 11, [(0, .26, 320, 186), (.32, .25, 307, 182)]),
    'turkey': ((680, 1490), .28, 24, [(i * .068, .095, 290 - i * 13, 163 - i * 6) for i in range(7)]),
    'quail': ((2120, 3450), .025, 11, [(0, .080, 1400, 1940), (.105, .085, 1630, 2230), (.22, .23, 2220, 1750)]),
    'pigeon': ((425, 890), .05, 5, [(0, .36, 335, 265), (.40, .15, 310, 272), (.59, .24, 294, 230)]),
    'buffalo': ((335, 720), .20, 7, [(0, .38, 104, 143), (.33, .60, 148, 79)]),
    'hamster': ((2570, 4050), .11, 18, [(0, .067, 1830, 2350), (.106, .081, 2260, 1660), (.226, .105, 1810, 1360)]),
    'camel': ((440, 905), .28, 14, [(0, .29, 149, 107), (.26, .48, 112, 179), (.69, .33, 158, 84)]),
    'yak': ((295, 655), .39, 17, [(0, .28, 101, 63), (.37, .36, 92, 54)]),
    'ostrich': ((233, 580), .23, 10, [(0, .16, 73, 102), (.25, .20, 114, 75), (.53, .30, 87, 51)]),
    'alpaca': ((460, 1020), .055, 4, [(0, .44, 235, 205), (.52, .33, 252, 183)]),
    'deer': ((1710, 2530), .042, 7, [(0, .24, 640, 1140), (.24, .51, 1140, 601)]),
    'whitePeacock': ((1550, 2660), .08, 12, [(0, .28, 945, 680), (.34, .33, 1020, 535), (.67, .19, 770, 499)]),
    'unicorn': ((960, 1850), .09, 8, [(0, .25, 428, 730), (.20, .39, 730, 560), (.55, .36, 560, 321)]),
    'catChase': ((2300, 3500), .15, 19, [(0, .072, 1780, 2370), (.107, .09, 2030, 1640), (.235, .08, 1900, 1250)]),
}


def read_pcm(path, highpass=65):
    data = subprocess.check_output([
        'ffmpeg', '-nostdin', '-v', 'error', '-i', str(path), '-ac', '1',
        '-ar', str(RATE), '-af', f'highpass=f={highpass},lowpass=f=6800', '-f', 's16le', '-',
    ])
    return [sample / 32768 for sample in array('h', data)]


def prepare_sample(entry):
    name, (number, seconds) = entry
    source = RECORDINGS / f'{name}-{number}.mp3'
    if not source.exists():
        url = f'https://bigsoundbank.com/UPLOAD/mp3/{number}.mp3'
        with urllib.request.urlopen(url, timeout=30) as response:
            source.write_bytes(response.read())
    samples = read_pcm(source)
    # Keep the most audible phrase, with padding before the attack.
    frame = round(RATE * .025)
    levels = [sum(x * x for x in samples[i:i + frame]) for i in range(0, len(samples), frame)]
    width = max(1, round(seconds * RATE / frame))
    starts = range(max(1, len(levels) - width + 1))
    start = max(starts, key=lambda i: sum(levels[i:i + width]))
    phrase = levels[start:start + width]
    threshold = max(phrase) * .036
    first = next((i for i, energy in enumerate(phrase) if energy > threshold), 0)
    last = next((i for i in range(len(phrase) - 1, -1, -1) if phrase[i] > threshold), len(phrase) - 1)
    left = max(0, (start + first - 2) * frame)
    right = min(len(samples), (start + last + 4) * frame)
    return name, samples[left:right]


def synthesize(name, parameters):
    (low, high), roughness, tremolo, notes = parameters
    rng = random.Random(name)
    track = [0.0] * (round(RATE * max(at + length for at, length, *_ in notes)) + 2)
    for start, duration, first, last in notes:
        length = round(duration * RATE)
        offset = round(start * RATE)
        center_pitch = (first + last) / 2
        count = max(1, min(12, int(7000 / max(first, last))))
        weights = []
        for h in range(1, count + 1):
            frequency = h * center_pitch
            resonance = .9 / (1 + ((frequency - low) / 255) ** 2)
            resonance += .5 / (1 + ((frequency - high) / 460) ** 2)
            weights.append((.42 + resonance) / h ** .74)
        total = sum(weights)
        phase = noise = 0.0
        for i in range(length):
            t, progress = i / RATE, i / length
            frequency = first + (last - first) * progress + first * .024 * math.sin(t * math.tau * tremolo)
            phase += math.tau * frequency / RATE
            signal = sum(gain * math.sin(phase * h) for h, gain in enumerate(weights, 1)) / total
            noise = .58 * noise + .42 * rng.uniform(-1, 1)
            envelope = min(1, t / .018) * (1 - progress) ** .65
            pulse = .82 + .18 * math.cos(t * tremolo * math.tau)
            track[offset + i] += envelope * pulse * (signal + roughness * noise)
    return track


def repitch(samples, ratio):
    output = []
    for index in range(int((len(samples) - 1) / ratio)):
        at = index * ratio
        left = int(at)
        output.append(samples[left] + (samples[left + 1] - samples[left]) * (at - left))
    return output


def add_bells(samples, frequencies):
    result = list(samples)
    offset = round(len(samples) * .64)
    for j, hz in enumerate(frequencies):
        start = offset + round(j * .077 * RATE)
        count = round(.24 * RATE)
        if len(result) < start + count:
            result.extend([0.0] * (start + count - len(result)))
        for i in range(count):
            t = i / RATE
            envelope = min(1, t / .013) * math.exp(-t * 19) * (1 - i / count)
            result[start + i] += .23 * envelope * (math.sin(math.tau * t * hz) + .22 * math.sin(math.tau * t * hz * 2.01))
    return result


def write_wav(name, samples):
    peak = max(map(abs, samples), default=0)
    rms = math.sqrt(sum(x * x for x in samples) / len(samples)) if samples else 0
    gain = min(.74 / max(peak, .001), .16 / max(rms, .001))
    fade_in, fade_out = round(.014 * RATE), round(.052 * RATE)
    pcm = array('h', (
        round(sample * gain * min(1, i / fade_in, (len(samples) - 1 - i) / fade_out) * 32767)
        for i, sample in enumerate(samples)
    ))
    with wave.open(str(DESTINATION / f'{name}.wav'), 'wb') as output:
        output.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        output.writeframes(pcm.tobytes())


def main():
    RECORDINGS.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        clips = dict(pool.map(prepare_sample, SAMPLES.items()))
    for name, parameters in CALLS.items():
        clips[name] = synthesize(name, parameters)
    clips['goldenSheep'] = add_bells(repitch(clips['sheep'], 1.095), (659, 880))
    clips['rainbowCow'] = add_bells(repitch(read_pcm(DESTINATION / 'cow.wav')[:RATE * 2], 1.19), (523, 659, 784))
    clips['unicorn'] = add_bells(clips['unicorn'], (784, 988, 1175))
    clips['dogFind'] = add_bells(repitch(clips['dog'][:round(.58 * RATE)], 1.065), (523, 659))
    for name, samples in clips.items():
        write_wav(name, samples)
    print(f'Prepared {len(clips)} offline WAV files in {DESTINATION}')


if __name__ == '__main__':
    main()
