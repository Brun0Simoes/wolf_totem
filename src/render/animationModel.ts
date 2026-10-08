/** Rendering clock only. Combat damage, mana and timings stay in the simulation. */
export type MotionClip = 'idle' | 'walk' | 'windup' | 'attack' | 'cast' | 'hurt' | 'death' | 'victory';
export interface MotionState {
  clip: MotionClip;
  elapsed: number;
  locked: number;
  hit: number;
  facing: number;
  seed: number;
  duration?:number;
  weight?:number;
  stride?:number;
  reach?:number;
  freeze?:number;
  preparingCast?:boolean;
}
export interface SheetDefinition {
  characterId: number;
  summonId?: string;
  stars?: number;
  name: string;
  image: string;
  columns: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
  bodyHeight: number;
  anchorX: number;
  anchorY: number;
  frameAnchors?: { x: number; y: number }[];
  frameRects?: { x: number; y: number; width: number; height: number }[];
  imageWidth?: number;
  imageHeight?: number;
  portrait?: { x: number; y: number; width: number; height: number };
  clips: { idle: number[]; walk: number[]; attack: number[] };
  notes?: string;
}
export const CLIP_DURATION: Record<MotionClip, number> = {
  idle: 1.35, walk: .64, windup:.2, attack: .34, cast: .48, hurt: .23, death: .95, victory: 1.2,
};
export function createMotion(seed = 0): MotionState { return { clip: 'idle', elapsed: seed % 1, locked: 0, hit: 0, facing: 1, seed }; }
export function triggerMotion(state: MotionState, clip: MotionClip, direction = state.facing,duration=CLIP_DURATION[clip]): void {
  if (state.clip === 'death') return;
  // A new hit only restarts the recoil once the previous one is mostly over, so crowded fights still read.
  if (clip === 'hurt') { if (state.hit < CLIP_DURATION.hurt * .35) state.hit = CLIP_DURATION.hurt; return; }
  state.clip = clip;
  state.elapsed = 0;
  state.duration=duration;
  state.locked = clip === 'windup'||clip === 'attack' || clip === 'cast' || clip === 'death' ? duration : 0;
  if (Math.abs(direction) > .01) state.facing = Math.sign(direction);
}
export function advanceMotion(state: MotionState, desired: MotionClip, seconds: number, direction = 0): void {
  const dt = Number.isFinite(seconds) ? Math.max(0, Math.min(.3, seconds)) : 0;
  if (!dt) return;
  if((state.freeze??0)>0){state.freeze=Math.max(0,state.freeze!-dt);return;}
  if (desired === 'death' && state.clip !== 'death') triggerMotion(state, 'death');
  state.elapsed += dt;
  state.locked = Math.max(0, state.locked - dt);
  state.hit = Math.max(0, state.hit - dt);
  if (state.clip === 'death') return;
  if (state.locked > 0) return;
  if (state.clip !== desired) { state.clip = desired; state.elapsed = 0;state.duration=CLIP_DURATION[desired]; }
  if (Math.abs(direction) > .8) state.facing = Math.sign(direction);
}
export function frameForMotion(state: MotionState, sheet: SheetDefinition, reducedMotion = false): number {
  const clip = state.clip === 'walk' ? 'walk' : state.clip === 'windup'||state.clip === 'attack' || state.clip === 'cast' ? 'attack' : 'idle';
  const frames = sheet.clips[clip];
  if (state.clip === 'death' || (reducedMotion && state.clip === 'idle')) return sheet.clips.idle[0];
  const duration = state.duration??CLIP_DURATION[state.clip];
  if(state.clip==='windup')return frames[Math.min(1,Math.floor(Math.min(.99,state.elapsed/duration)*2))];
  const phase = state.clip === 'attack' || state.clip === 'cast'
    ? Math.min(.999, state.elapsed / duration)
    : (state.elapsed % duration) / duration;
  return frames[Math.min(frames.length - 1, Math.floor(phase * frames.length))];
}
export function poseForMotion(state: MotionState, hasSheet: boolean, reducedMotion = false) {
  const t = state.elapsed, phase = Math.min(1, t / (state.duration??CLIP_DURATION[state.clip]));
  const weight=state.weight??1,stride=state.stride??1;
  let x = 0, y = 0, angle = 0, scaleX = 1, scaleY = 1, alpha = 1;
  if (state.clip === 'idle' && !reducedMotion) {
    scaleY = 1 + Math.sin(t * 3.2 + state.seed) * (hasSheet ? .004 : .014);
    angle = Math.sin(t * 1.7 + state.seed) * .4;
  } else if (state.clip === 'walk') {
    const step = Math.sin(t*stride / CLIP_DURATION.walk * Math.PI * 4);
    y = reducedMotion ? 0 : -Math.abs(step) * (hasSheet ? 2.4 : 3.5)/weight;
    angle = reducedMotion ? 0 : step * (hasSheet?1.2:2.4)*weight;
    if (!hasSheet) { scaleX = 1 + step * .015; scaleY = 1 - Math.abs(step) * .018; }
  } else if(state.clip==='windup'){
    const ready=Math.sin(phase*Math.PI/2);
    x=-state.facing*ready*(state.preparingCast?2:5)*weight;
    y=reducedMotion?0:ready*3*weight;angle=reducedMotion?0:-state.facing*ready*4*weight;
    scaleX=1+ready*.025;scaleY=1-ready*.035;
  } else if (state.clip === 'attack' || state.clip === 'cast') {
    const thrust=phase<.24?1-Math.pow(1-phase/.24,3):Math.pow(1-(phase-.24)/.76,2);
    x = state.facing * thrust * (state.clip === 'attack' ? state.reach??11 : 3);
    angle=reducedMotion?0:state.facing*thrust*(state.clip==='attack'?7:2)*weight;
    scaleX=1+thrust*.035;scaleY=1-thrust*.025;
    if (state.clip === 'cast') y = reducedMotion ? 0 : -thrust * 7;
  } else if (state.clip === 'death') {
    angle = reducedMotion?0:state.facing * Math.pow(phase,.7) * 82; y = phase * 17; alpha = 1 - Math.max(0,(phase-.35)/.65);
    scaleY = 1 - phase * .28;
  } else if (state.clip === 'victory' && !reducedMotion) {
    y = -Math.max(0, Math.sin(t * 3.4)) * 4/weight; angle = Math.sin(t * 2.6) * 1.5;
  }
  if (state.hit > 0 && state.clip !== 'death') {
    const recoil = Math.sin(state.hit / CLIP_DURATION.hurt * Math.PI);
    x -= state.facing * recoil * 5; angle -= state.facing * recoil * 5;
  }
  return { x, y, angle, scaleX, scaleY, alpha };
}
