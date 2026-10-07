/** Rendering clock only. Combat damage, mana and timings stay in the simulation. */
export type MotionClip = 'idle' | 'walk' | 'attack' | 'cast' | 'hurt' | 'death' | 'victory';
export interface MotionState {
  clip: MotionClip;
  elapsed: number;
  locked: number;
  hit: number;
  facing: number;
  seed: number;
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
  idle: 1.35, walk: .64, attack: .48, cast: .72, hurt: .23, death: .85, victory: 1.2,
};
export function createMotion(seed = 0): MotionState { return { clip: 'idle', elapsed: seed % 1, locked: 0, hit: 0, facing: 1, seed }; }
export function triggerMotion(state: MotionState, clip: MotionClip, direction = state.facing): void {
  if (state.clip === 'death') return;
  // A new hit only restarts the recoil once the previous one is mostly over, so crowded fights still read.
  if (clip === 'hurt') { if (state.hit < CLIP_DURATION.hurt * .35) state.hit = CLIP_DURATION.hurt; return; }
  state.clip = clip;
  state.elapsed = 0;
  state.locked = clip === 'attack' || clip === 'cast' || clip === 'death' ? CLIP_DURATION[clip] : 0;
  if (Math.abs(direction) > .01) state.facing = Math.sign(direction);
}
export function advanceMotion(state: MotionState, desired: MotionClip, seconds: number, direction = 0): void {
  const dt = Number.isFinite(seconds) ? Math.max(0, Math.min(.1, seconds)) : 0;
  if (!dt) return;
  if (desired === 'death' && state.clip !== 'death') triggerMotion(state, 'death');
  state.elapsed += dt;
  state.locked = Math.max(0, state.locked - dt);
  state.hit = Math.max(0, state.hit - dt);
  if (state.clip === 'death') return;
  if (state.locked > 0) return;
  if (state.clip !== desired) { state.clip = desired; state.elapsed = 0; }
  if (Math.abs(direction) > .1) state.facing = Math.sign(direction);
}
export function frameForMotion(state: MotionState, sheet: SheetDefinition, reducedMotion = false): number {
  const clip = state.clip === 'walk' ? 'walk' : state.clip === 'attack' || state.clip === 'cast' ? 'attack' : 'idle';
  const frames = sheet.clips[clip];
  if (state.clip === 'death' || (reducedMotion && state.clip === 'idle')) return sheet.clips.idle[0];
  const duration = CLIP_DURATION[state.clip];
  const phase = state.clip === 'attack' || state.clip === 'cast'
    ? Math.min(.999, state.elapsed / duration)
    : (state.elapsed % duration) / duration;
  return frames[Math.min(frames.length - 1, Math.floor(phase * frames.length))];
}
export function poseForMotion(state: MotionState, hasSheet: boolean, reducedMotion = false) {
  const t = state.elapsed, phase = Math.min(1, t / CLIP_DURATION[state.clip]);
  let x = 0, y = 0, angle = 0, scaleX = 1, scaleY = 1, alpha = 1;
  if (state.clip === 'idle' && !reducedMotion) {
    scaleY = 1 + Math.sin(t * 3.2 + state.seed) * (hasSheet ? .004 : .014);
    angle = Math.sin(t * 1.7 + state.seed) * .4;
  } else if (state.clip === 'walk') {
    const step = Math.sin(t / CLIP_DURATION.walk * Math.PI * 4);
    y = reducedMotion ? 0 : -Math.abs(step) * (hasSheet ? 1.2 : 3.5);
    angle = hasSheet || reducedMotion ? 0 : step * 2.4;
    if (!hasSheet) { scaleX = 1 + step * .015; scaleY = 1 - Math.abs(step) * .018; }
  } else if (state.clip === 'attack' || state.clip === 'cast') {
    const thrust = Math.sin(Math.PI * phase);
    x = state.facing * thrust * (state.clip === 'attack' ? 9 : 2);
    if (!hasSheet) { angle = state.facing * (phase < .3 ? -phase * 16 : thrust * 10); scaleY = 1 - thrust * .035; }
    if (state.clip === 'cast') y = reducedMotion ? 0 : -thrust * 5;
  } else if (state.clip === 'death') {
    angle = state.facing * phase * 76; y = phase * 12; alpha = 1 - phase * .94;
    scaleY = 1 - phase * .3;
  } else if (state.clip === 'victory' && !reducedMotion) {
    y = -Math.max(0, Math.sin(t * 5.2)) * 8; angle = Math.sin(t * 5.2) * 3;
  }
  if (state.hit > 0 && state.clip !== 'death') {
    const recoil = Math.sin(state.hit / CLIP_DURATION.hurt * Math.PI);
    x -= state.facing * recoil * 5; angle -= state.facing * recoil * 5;
  }
  return { x, y, angle, scaleX, scaleY, alpha };
}
