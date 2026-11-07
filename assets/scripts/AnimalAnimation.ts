import type { AnimalId, AquaticId } from './FarmCatalog';

export interface AnimalPose {
  x: number;
  lift: number;
  width: number;
  height: number;
  tilt: number;
}

// Time (fraction of the clip), then displacement and lift (in sprite widths),
// scale and rotation. The first and last poses blend back to a neutral stance.
type Key = readonly [number, number, number, number, number, number];
type Gait = 'waddle' | 'pecking' | 'hop' | 'stalk' | 'trot' | 'heavy' | 'prance' | 'stride';
export type GestureAccent = 'feathers' | 'plume' | 'dust' | 'warm' | 'prism' | 'magic' | 'wag';
interface AnimalClip {
  name: string;
  duration: number;
  gait: Gait;
  keys: readonly Key[];
  accent?: GestureAccent;
}

const REST: Key = [0, 0, 0, 1, 1, 0];
const END: Key = [1, 0, 0, 1, 1, 0];
const clip = (name: string, duration: number, gait: Gait, keys: Key[], accent?: GestureAccent): AnimalClip =>
  ({ name, duration, gait, keys: [REST, ...keys, END], accent });

export const ANIMAL_CLIPS = {
  duck: clip('抖翅摇身', 1.04, 'waddle', [
    [.17, 0, 0, 1.15, .88, -7], [.32, .04, .09, 1.15, 1.02, 12],
    [.47, -.04, .13, 1.18, .95, -12], [.64, .04, .06, 1.12, .96, 10],
    [.83, 0, 0, 1.06, .92, -3],
  ], 'feathers'),
  sheep: clip('抖抖羊毛', 1.2, 'heavy', [
    [.18, 0, 0, 1.12, .9, 0], [.34, -.02, .05, .94, 1.14, -7],
    [.49, .024, .04, 1.13, .96, 7], [.66, -.018, .02, .99, 1.07, -5],
    [.86, 0, 0, 1.04, .98, 0],
  ]),
  pig: clip('低头拱土', 1.28, 'heavy', [
    [.25, -.14, 0, 1.1, .91, 14], [.44, -.20, 0, 1.18, .87, 18],
    [.56, -.13, .02, 1.01, .94, 6], [.71, -.19, 0, 1.12, .9, 16],
    [.88, 0, .04, .95, 1.06, -5],
  ], 'dust'),
  goat: clip('后仰顶角', 1.12, 'prance', [
    [.18, .09, 0, 1.09, .89, -10], [.37, .08, .18, .87, 1.13, -23],
    [.55, -.21, .06, 1.17, .91, 15], [.72, -.15, 0, 1.11, .91, 12],
  ]),
  rabbit: clip('伏低连跳', 1.09, 'hop', [
    [.15, .035, 0, 1.19, .76, 5], [.31, -.10, .35, .87, 1.18, -11],
    [.45, -.18, 0, 1.19, .8, 11], [.63, -.07, .24, .94, 1.12, -9],
    [.78, -.03, 0, 1.13, .85, 4],
  ]),
  cat: clip('弓背伸懒腰', 1.52, 'stalk', [
    [.23, -.08, 0, 1.17, .77, 13], [.5, -.11, 0, 1.31, .69, 17],
    [.68, .03, .10, .89, 1.18, -13], [.86, 0, .01, 1.02, 1.02, 4],
  ]),
  dog: clip('前伏摇尾', 1.31, 'trot', [
    [.18, -.08, 0, 1.12, .78, 15], [.32, -.08, 0, 1.19, .79, 21],
    [.43, -.04, .05, .99, .91, 9], [.54, -.08, 0, 1.12, .79, 17],
    [.72, 0, .22, .91, 1.13, -12], [.86, 0, 0, 1.12, .88, 4],
  ], 'wag'),
  horse: clip('扬前蹄', 1.45, 'stride', [
    [.18, .06, 0, 1.08, .95, 6], [.43, .12, .13, .92, 1.1, -28],
    [.57, .11, .16, .91, 1.12, -26], [.76, -.04, 0, 1.1, .91, 8],
  ], 'dust'),
  peacock: clip('舒展尾屏', 1.85, 'pecking', [
    [.2, .05, 0, .86, 1.06, -12], [.44, 0, .04, 1.13, 1.03, 1],
    [.68, -.03, .03, 1.16, 1.01, 6], [.88, .02, 0, 1.02, 1.02, -4],
  ], 'plume'),
  goldenSheep: clip('金绒轻颤', 1.36, 'heavy', [
    [.23, 0, 0, 1.12, .9, -6], [.43, -.04, .15, .94, 1.11, 7],
    [.62, .025, .06, 1.12, 1.03, -8], [.82, 0, 0, 1.09, .94, 4],
  ], 'warm'),
  rainbowCow: clip('彩虹昂首', 1.63, 'heavy', [
    [.23, -.08, 0, 1.10, .91, 10], [.51, .055, .09, .96, 1.13, -16],
    [.73, .035, .06, 1.04, 1.07, -9], [.89, 0, 0, 1.08, .92, 5],
  ], 'prism'),
  unicorn: clip('星跃落地', 1.64, 'prance', [
    [.16, .08, 0, 1.14, .86, 7], [.40, -.06, .41, .93, 1.16, -19],
    [.56, -.14, .46, 1.03, 1.04, -6], [.78, -.18, 0, 1.21, .82, 15],
    [.9, -.04, .03, .96, 1.06, -4],
  ], 'magic'),
  goose: clip('伸颈鸣叫', 1.25, 'waddle', [
    [.18, .08, 0, .96, .95, -7], [.36, -.13, .02, 1.07, 1.26, 17],
    [.51, -.08, .01, 1.09, 1.13, 13], [.68, -.16, .045, 1.07, 1.2, 15],
    [.87, .02, 0, .98, .97, -4],
  ]),
  turkey: clip('撑羽踱步', 1.42, 'stride', [
    [.22, .055, 0, 1.18, 1.04, -9], [.42, -.04, .14, 1.22, .94, 14],
    [.65, -.12, .07, 1.22, 1.02, -12], [.82, -.05, .03, 1.08, 1.03, 8],
  ], 'feathers'),
  quail: clip('连啄找籽', 1.02, 'pecking', [
    [.16, -.055, 0, 1.1, .85, 18], [.28, 0, .045, .98, 1.02, -7],
    [.43, -.09, 0, 1.1, .83, 20], [.56, -.015, .05, .98, 1.02, -7],
    [.7, -.10, 0, 1.1, .83, 22], [.86, 0, .065, .98, 1.05, -5],
  ]),
  pigeon: clip('点头扑翅', 1.19, 'pecking', [
    [.16, -.08, 0, 1.1, .9, 12], [.32, .015, .04, .99, 1.06, -8],
    [.48, -.075, 0, 1.11, .87, 13], [.68, -.055, .28, 1.17, .96, -9],
    [.88, 0, 0, 1.09, .88, 3],
  ], 'feathers'),
  buffalo: clip('跺脚甩头', 1.43, 'heavy', [
    [.2, .05, .095, .97, 1.08, -10], [.37, -.13, 0, 1.16, .84, 14],
    [.51, .025, .025, .96, 1.07, -13], [.66, -.045, 0, 1.1, .94, 12],
    [.82, .016, 0, .99, 1, -6],
  ], 'dust'),
  hamster: clip('鼓腮抱籽', 1.27, 'hop', [
    [.2, -.03, .13, .89, 1.16, -10], [.43, -.02, .06, 1.17, 1.06, -5],
    [.61, .025, .075, 1.23, 1.02, 5], [.82, 0, 0, 1.13, .88, -4],
  ]),
  donkey: clip('转身踢蹄', 1.29, 'trot', [
    [.2, -.13, 0, 1.09, .91, 14], [.38, -.18, .1, 1.11, .96, 26],
    [.59, .07, .04, .93, 1.13, -16], [.77, -.04, 0, 1.09, .92, 8],
  ], 'dust'),
  camel: clip('屈膝伏地', 1.95, 'stride', [
    [.22, -.03, 0, 1.07, .86, 7], [.44, -.04, 0, 1.19, .67, 13],
    [.64, -.03, 0, 1.18, .67, 6], [.82, .04, 0, 1.06, .9, -10],
  ]),
  yak: clip('甩长毛', 1.37, 'heavy', [
    [.19, -.05, 0, 1.13, .9, 16], [.35, .06, .05, .96, 1.12, -14],
    [.53, -.07, 0, 1.13, .93, 13], [.71, .05, .035, 1.01, 1.02, -10],
    [.86, -.02, 0, 1.04, .96, 4],
  ]),
  ostrich: clip('探头快步', 1.22, 'stride', [
    [.19, -.13, 0, 1.08, .79, 18], [.34, -.17, .11, .96, 1.1, -11],
    [.50, -.24, .06, 1.02, 1.12, 11], [.67, -.1, .22, .95, 1.12, -13],
    [.83, 0, 0, 1.1, .89, 8],
  ]),
  alpaca: clip('踮脚轻哼', 1.44, 'prance', [
    [.19, 0, 0, 1.09, .87, 4], [.39, -.05, .19, .9, 1.15, -13],
    [.57, -.025, .12, 1.06, 1.04, 9], [.76, .04, .06, .99, 1.02, -7],
    [.89, 0, 0, 1.05, .93, 3],
  ]),
  deer: clip('警觉转身跳', 1.39, 'prance', [
    [.2, .06, 0, .9, 1.12, -16], [.38, -.025, 0, 1.18, .8, 13],
    [.6, -.19, .35, .92, 1.16, -12], [.78, -.11, 0, 1.14, .83, 10],
  ]),
  whitePeacock: clip('银羽转屏', 1.95, 'pecking', [
    [.19, .065, 0, .77, 1.08, -12], [.4, 0, .07, 1.13, 1.04, -2],
    [.64, -.07, .075, 1.18, 1.05, 10], [.83, .035, 0, .91, 1.05, -8],
  ], 'plume'),
} satisfies Record<Exclude<AnimalId, 'hen' | 'cow'>, AnimalClip>;

export function animalClip(id: AnimalId): AnimalClip | null {
  return id === 'hen' || id === 'cow' ? null : ANIMAL_CLIPS[id];
}

export function sampleKeys(keys: readonly Key[], progress: number): AnimalPose {
  const t = Math.min(1, Math.max(0, progress));
  const end = Math.max(1, keys.findIndex(key => key[0] >= t));
  const a = keys[end - 1], b = keys[end];
  const phase = (t - a[0]) / (b[0] - a[0]);
  const ease = phase * phase * (3 - 2 * phase);
  const blend = (index: 1 | 2 | 3 | 4 | 5) => a[index] + (b[index] - a[index]) * ease;
  return { x: blend(1), lift: blend(2), width: blend(3), height: blend(4), tilt: blend(5) };
}

const GAITS: Record<Gait, { step: number; lift: number; sway: number; stretch: number }> = {
  waddle: { step: 1.04, lift: .065, sway: 8, stretch: .045 },
  pecking: { step: 1.44, lift: .07, sway: 7, stretch: .056 },
  hop: { step: .88, lift: .24, sway: 13, stretch: .13 },
  stalk: { step: .85, lift: .045, sway: 5, stretch: .07 },
  trot: { step: 1.11, lift: .115, sway: 8, stretch: .085 },
  heavy: { step: .62, lift: .035, sway: 5, stretch: .052 },
  prance: { step: .94, lift: .16, sway: 9, stretch: .1 },
  stride: { step: .76, lift: .115, sway: 11, stretch: .065 },
};

export function gaitPose(clip: AnimalClip, frame: number, running: boolean): AnimalPose {
  const gait = GAITS[clip.gait], swing = frame * gait.step;
  const cycle = swing * Math.PI / 2, lift = (1 - Math.cos(swing * Math.PI)) / 2;
  const stride = running ? 1.35 : 1;
  return {
    x: Math.sin(cycle) * .028,
    lift: lift * gait.lift * stride,
    width: 1 + gait.stretch * (.65 - lift),
    height: 1 + gait.stretch * (lift - .55),
    tilt: Math.sin(cycle) * gait.sway * stride,
  };
}

export const SNIFF_POSE: readonly Key[] = [
  REST, [.27, -.10, 0, 1.15, .8, 18], [.54, -.15, 0, 1.17, .77, 22],
  [.69, -.08, .02, 1.04, .89, 12], [.82, -.12, 0, 1.12, .81, 17], END,
];

export const CAT_CHASE_POSE: readonly Key[] = [
  REST, [.18, .055, 0, 1.19, .71, 15], [.34, -.15, .21, 1.15, .91, -8],
  [.48, -.42, .30, 1.22, .84, 6], [.64, -.64, 0, 1.20, .74, 20],
  [.76, -.44, .05, .94, 1.1, -9], [.92, -.04, 0, 1.06, .95, 3], END,
];

export const DOG_FIND_POSE: readonly Key[] = [
  REST, [.18, -.10, 0, 1.13, .79, 18], [.39, -.22, 0, 1.18, .77, 24],
  [.54, -.20, .07, .99, 1.04, -12], [.7, -.08, .16, .96, 1.13, -13],
  [.83, 0, 0, 1.12, .91, 7], END,
];

export function aquaticMotion(id:AquaticId,time:number,phase:number){
  const t=time+phase;
  if(id==='crab'){
    const stride=t*.93;
    return {x:12+Math.sin(stride)*1.45,y:15.82,flip:Math.cos(stride)<0,
      tilt:Math.sin(stride*5)*8,width:1+Math.sin(stride*4)*.055,height:1};
  }
  if(id==='lobster'){
    const step=(t*.55)%1,dart=Math.sin(Math.PI*Math.min(1,step*2.4));
    return {x:11.85+Math.sin(t*.48)*1.02-dart*.46,y:15.56+Math.cos(t*.48)*.38,
      flip:Math.cos(t*.48)<0,tilt:-13*dart,width:1+dart*.13,height:1-dart*.14};
  }
  const fast=id==='bass',slow=id==='carp';
  const angle=t*(fast?.54:slow?.26:.36),pulse=Math.sin(t*(fast?5:slow?2.8:3.6));
  return {
    x:12+Math.sin(angle)*(fast?1.94:slow?1.55:1.17),
    y:15.38+Math.cos(angle)*(fast?.69:slow?.73:.54)+(fast?Math.sin(t*2.3)*.11:0),
    flip:Math.cos(angle)>0,tilt:pulse*(fast?11:slow?4:7),
    width:1+pulse*(fast?.12:.055),height:1-pulse*(slow?.045:.065),
  };
}
