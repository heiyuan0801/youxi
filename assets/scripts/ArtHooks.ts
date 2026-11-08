// Drop a PNG at assets/resources/hooks/<id>.png and the next web build
// uses it in place of the fallback. Missing files keep the fallback.
export const FARM_ART_HOOKS = [
  'coffeeBrew', 'floralTea', 'sunTea', 'berryTea', 'estateBox',
  'cabinet', 'teaTable', 'fox', 'machineHarvester', 'machineFeeder',
  ...['forest', 'mine', 'beach', 'snow'].flatMap(map =>
    Array.from({ length: 12 }, (_, i) => `${map}-layer-${String(i + 1).padStart(2, '0')}`)),
] as const;

export type FarmArtHook = typeof FARM_ART_HOOKS[number];

/** PNG stand-ins. Drop a file at `assets/resources/hooks/<file>` and load it under `id` to replace the fallback. */
export interface ArtHook {
  id: string;
  file: string;
  fallback: string;
}

export const ART_HOOKS: readonly ArtHook[] = [
  {id: 'hook-rod', file: 'hooks/rod.png', fallback: 'fish'},
  {id: 'hook-pond', file: 'hooks/pond.png', fallback: 'fish'},
  {id: 'hook-fish-fish', file: 'hooks/fish-stream.png', fallback: 'fish'},
  {id: 'hook-fish-goldenFish', file: 'hooks/fish-golden.png', fallback: 'goldenFish'},
  {id: 'hook-fish-carp', file: 'hooks/fish-carp.png', fallback: 'carp'},
  {id: 'hook-fish-crucian', file: 'hooks/fish-crucian.png', fallback: 'crucian'},
  {id: 'hook-fish-bass', file: 'hooks/fish-bass.png', fallback: 'bass'},
  {id: 'hook-fish-crab', file: 'hooks/fish-crab.png', fallback: 'crab'},
  {id: 'hook-bait-worm', file: 'hooks/bait-worm.png', fallback: 'bait'},
  {id: 'hook-bait-dough', file: 'hooks/bait-dough.png', fallback: 'bread'},
  {id: 'hook-bait-lure', file: 'hooks/bait-lure.png', fallback: 'gem'},
  {id: 'hook-pond-empty', file: 'hooks/pond-empty.png', fallback: 'fish'},
  {id: 'hook-fish-koi', file: 'hooks/fish-koi.png', fallback: 'goldenFish'},
  {id: 'hook-fish-bucket', file: 'hooks/fish-bucket.png', fallback: 'barn'},
];

export function hookStem(file: string): string {
  return file.replace(/^hooks\//, '').replace(/\.png$/, '');
}

export function artHook(id: string, has: (key: string) => boolean): string {
  const hook = ART_HOOKS.find(entry => entry.id === id);
  if (!hook) return id;
  return has(hook.id) ? hook.id : hook.fallback;
}

export function fishArtHook(species: string, raised = false): string {
  if (raised && species === 'goldenFish') return 'hook-fish-koi';
  return `hook-fish-${species}`;
}
