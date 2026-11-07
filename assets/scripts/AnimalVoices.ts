import type { AnimalId, AquaticId } from './FarmCatalog';

// Land voices keep the names already shipped in the web build.
// hen uses chicken.wav; every other land animal uses a file of the same id.
export const ANIMAL_VOICES = {
  hen: 'chicken',
  cow: 'cow',
  duck: 'duck',
  sheep: 'sheep',
  pig: 'pig',
  goat: 'goat',
  rabbit: 'rabbit',
  cat: 'cat',
  dog: 'dog',
  horse: 'horse',
  peacock: 'peacock',
  goldenSheep: 'goldenSheep',
  rainbowCow: 'rainbowCow',
  unicorn: 'unicorn',
  goose: 'goose',
  turkey: 'turkey',
  quail: 'quail',
  pigeon: 'pigeon',
  buffalo: 'buffalo',
  hamster: 'hamster',
  donkey: 'donkey',
  camel: 'camel',
  yak: 'yak',
  ostrich: 'ostrich',
  alpaca: 'alpaca',
  deer: 'deer',
  whitePeacock: 'whitePeacock',
} as const satisfies Record<AnimalId, string>;

// Aquatic animals previously all shared pondSplash. These keys are separate
// clips derived from that splash so each species has its own click.
// Swap the wav later; keep the key.
export const AQUATIC_VOICES = {
  carp: 'carp',
  crucian: 'crucian',
  bass: 'bass',
  crab: 'crab',
  lobster: 'lobster',
} as const satisfies Record<AquaticId, string>;

export const ACTIVITY_SOUNDS = ['harvest', 'levelup', 'catChase', 'dogFind', 'pondSplash'] as const;

export type SoundKey = typeof ANIMAL_VOICES[AnimalId] | typeof AQUATIC_VOICES[AquaticId] | typeof ACTIVITY_SOUNDS[number];

export const SOUND_KEYS: readonly SoundKey[] = [
  ...Object.values(ANIMAL_VOICES),
  ...Object.values(AQUATIC_VOICES),
  ...ACTIVITY_SOUNDS,
];

export const animalVoice = (type: AnimalId): SoundKey => ANIMAL_VOICES[type];
export const aquaticVoice = (type: AquaticId): SoundKey => AQUATIC_VOICES[type];
