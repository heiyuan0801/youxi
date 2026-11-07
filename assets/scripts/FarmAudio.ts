import { Node, AudioSource, AudioClip } from 'cc';
import { ANIMAL_VOICES, AQUATIC_VOICES, SOUND_KEYS, SoundKey, animalVoice, aquaticVoice } from './AnimalVoices';

export type { SoundKey };
export { SOUND_KEYS, animalVoice, aquaticVoice };

const animalSounds = new Set<SoundKey>([...Object.values(ANIMAL_VOICES), ...Object.values(AQUATIC_VOICES), 'catChase', 'dogFind']);

const volumes: Partial<Record<SoundKey, number>> = {
  cow: .62, chicken: .58, harvest: .45, levelup: .6, pondSplash: .36,
  carp: .4, crucian: .38, bass: .42, crab: .4, lobster: .42,
};

export class FarmAudio {
  private music: AudioSource | null = null;
  private ui: AudioSource | null = null;
  private sources = new Map<SoundKey, AudioSource>();
  private last = new Map<SoundKey, number>();
  private events: { key: SoundKey; time: number }[] = [];
  private activeAnimalSound: SoundKey | null = null;
  private enabled = true;

  constructor(parent: Node, clips: Map<SoundKey, AudioClip>, extra = new Map<string, AudioClip>()) {
    for (const key of ['theme', 'ui']) {
      const clip = extra.get(key);
      if (!clip) continue;
      const source = this.makeSource(parent, 'Audio-' + key, clip);
      source.loop = key === 'theme';
      if (key === 'theme') this.music = source;
      else this.ui = source;
    }
    for (const key of SOUND_KEYS) {
      const source = this.makeSource(parent, 'SFX-' + key, clips.get(key) || null);
      source.volume = volumes[key] ?? .46;
      this.sources.set(key, source);
    }
  }

  private makeSource(parent: Node, name: string, clip: AudioClip | null) {
    const node = new Node(name);
    node.parent = parent;
    const source = node.addComponent(AudioSource);
    source.clip = clip;
    source.playOnAwake = false;
    source.volume = 1;
    return source;
  }

  setMusic(enabled: boolean) {
    if (!this.music) return;
    if (enabled && !this.music.playing) this.music.play();
    else if (!enabled) this.music.stop();
  }

  playUi() {
    if (this.enabled && this.ui?.clip) this.ui.playOneShot(this.ui.clip, .5);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled) return;
    for (const source of this.sources.values()) source.stop();
    this.activeAnimalSound = null;
  }

  play(key: SoundKey) {
    if (!this.enabled) return;
    const source = this.sources.get(key);
    if (!source?.clip) return;
    const now = Date.now();
    const cooldown = key === 'cow' ? 700 : key === 'chicken' ? 350 : key === 'harvest' ? 85 : 320;
    if (now - (this.last.get(key) || 0) < cooldown) return;
    if (animalSounds.has(key)) {
      if (this.activeAnimalSound && this.activeAnimalSound !== key) {
        this.sources.get(this.activeAnimalSound)?.stop();
      }
      this.activeAnimalSound = key;
    }
    this.last.set(key, now);
    source.stop();
    source.play();
    this.events.push({ key, time: now });
    if (this.events.length > 60) this.events.shift();
  }

  snapshot() {
    return {
      enabled: this.enabled,
      loaded: Array.from(this.sources.keys()),
      playing: Array.from(this.sources.entries()).filter(([, source]) => source.playing).map(([key]) => key),
      events: this.events.map(event => ({ ...event })),
    };
  }
}
