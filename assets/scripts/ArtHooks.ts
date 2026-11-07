// Drop a PNG at assets/resources/hooks/<id>.png and the next web build
// uses it in place of the fallback. Missing files keep the fallback.
export const ART_HOOKS = [
  'coffeeBrew', 'floralTea', 'sunTea', 'berryTea', 'estateBox',
  'cabinet', 'teaTable', 'fox', 'machineHarvester', 'machineFeeder',
  ...['forest', 'mine', 'beach', 'snow'].flatMap(map =>
    Array.from({ length: 12 }, (_, i) => `${map}-layer-${String(i + 1).padStart(2, '0')}`)),
] as const;

export type ArtHook = typeof ART_HOOKS[number];
