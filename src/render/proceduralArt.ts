import { characters } from '../data/characters';
import type { SheetDefinition } from './animationModel';
import { CHARACTER_ANIMAL, paintGlyph, type AnimalId } from './spiritGlyphs';

/**
 * Code-drawn stand-in figures for characters whose painted sheets are still in production.
 * They follow the Set 1 rule: 1★ tribal human, 2★ evident spirit bond, 3★ primal avatar.
 * A painted sheet always takes precedence; these sheets use the same frame layout.
 */
type Build = 'slim' | 'normal' | 'heavy' | 'giant' | 'elder';
type Weapon = 'spear' | 'bow' | 'staff' | 'blades' | 'club' | 'hammer' | 'shield' | 'harpoon' | 'claws' | 'needles' | 'none';
type Head = 'none' | 'mask-long' | 'blindfold' | 'horn-single' | 'horns' | 'flowers' | 'collar' | 'feathers' | 'beard';
type Hair = 'short' | 'long' | 'shaved' | 'braids' | 'mane' | 'topknot';
export interface FigureSpec {
  build: Build; skin: string; hair: string; hairStyle: Hair; cloth: string; clothAlt: string; paint: string;
  top: 'bare' | 'robe' | 'mantle' | 'armor' | 'cape'; weapon: Weapon; head: Head; accent: string; feminine?: boolean; masks?: boolean; scales?: boolean; spots?: boolean;
}

const SPEC: Record<number, FigureSpec> = {
  22: { build: 'slim', skin: '#9a6a4a', hair: '#1e1714', hairStyle: 'long', cloth: '#9c3a33', clothAlt: '#d06a4e', paint: '#e8c35a', top: 'robe', weapon: 'staff', head: 'collar', accent: '#e06a6a', feminine: true, scales: true },
  23: { build: 'slim', skin: '#8b5e3f', hair: '#2b2420', hairStyle: 'topknot', cloth: '#4d5a45', clothAlt: '#8a8b70', paint: '#c9c0a4', top: 'bare', weapon: 'claws', head: 'none', accent: '#d8d0b8', spots: true },
  24: { build: 'heavy', skin: '#7a5238', hair: '#1a1714', hairStyle: 'shaved', cloth: '#2c2c33', clothAlt: '#4a4b57', paint: '#8f94aa', top: 'armor', weapon: 'club', head: 'none', accent: '#a7acc4' },
  25: { build: 'slim', skin: '#a8775a', hair: '#5c3b26', hairStyle: 'braids', cloth: '#d8d2b8', clothAlt: '#a9c48a', paint: '#f2f0d8', top: 'robe', weapon: 'staff', head: 'flowers', accent: '#bfe6a8', feminine: true },
  26: { build: 'slim', skin: '#86593a', hair: '#2e2620', hairStyle: 'short', cloth: '#6d5b43', clothAlt: '#b09c78', paint: '#e8dcc0', top: 'bare', weapon: 'blades', head: 'mask-long', accent: '#e0d2b0' },
  27: { build: 'normal', skin: '#7d5236', hair: '#15110f', hairStyle: 'long', cloth: '#2f3442', clothAlt: '#6e7590', paint: '#d8e0ee', top: 'bare', weapon: 'blades', head: 'none', accent: '#cfd8ec', feminine: true, spots: true },
  31: { build: 'slim', skin: '#93653f', hair: '#1c1714', hairStyle: 'shaved', cloth: '#5a4a2a', clothAlt: '#d9c25a', paint: '#e9d78a', top: 'robe', weapon: 'staff', head: 'collar', accent: '#d9c25a', scales: true },
  32: { build: 'giant', skin: '#6c5a49', hair: '#2a231d', hairStyle: 'shaved', cloth: '#4e5d4c', clothAlt: '#7c8a6e', paint: '#9fb8a8', top: 'bare', weapon: 'hammer', head: 'none', accent: '#7fb8c8' },
  33: { build: 'slim', skin: '#9c6d4c', hair: '#a7a4a0', hairStyle: 'long', cloth: '#25222a', clothAlt: '#55506a', paint: '#d8d4e4', top: 'cape', weapon: 'bow', head: 'feathers', accent: '#a5a0b8', feminine: true },
  34: { build: 'heavy', skin: '#7e5639', hair: '#211b17', hairStyle: 'shaved', cloth: '#5d5143', clothAlt: '#9d8d72', paint: '#d9ccb0', top: 'armor', weapon: 'hammer', head: 'horn-single', accent: '#b8a88f' },
  43: { build: 'giant', skin: '#8a5f43', hair: '#e8e4dc', hairStyle: 'short', cloth: '#6b5a44', clothAlt: '#e3d6b8', paint: '#f4ecd8', top: 'mantle', weapon: 'shield', head: 'beard', accent: '#eadfc6' },
  44: { build: 'slim', skin: '#a77c5f', hair: '#ecebe6', hairStyle: 'long', cloth: '#3d4a44', clothAlt: '#d8f0e4', paint: '#e8f6ee', top: 'robe', weapon: 'needles', head: 'none', accent: '#d8f0e4', feminine: true },
  45: { build: 'normal', skin: '#8f6143', hair: '#2a1f18', hairStyle: 'braids', cloth: '#7a4f2b', clothAlt: '#e2b46a', paint: '#f0d08a', top: 'mantle', weapon: 'staff', head: 'none', accent: '#e2b46a', masks: true },
  46: { build: 'slim', skin: '#86603f', hair: '#1d1915', hairStyle: 'long', cloth: '#2f7a64', clothAlt: '#e2b14f', paint: '#9ff0cf', top: 'robe', weapon: 'staff', head: 'feathers', accent: '#6fd0a8', scales: true },
  47: { build: 'normal', skin: '#8a5d3d', hair: '#2a2420', hairStyle: 'topknot', cloth: '#2f5d86', clothAlt: '#6fb4e8', paint: '#d8ecf8', top: 'cape', weapon: 'harpoon', head: 'feathers', accent: '#6fb4e8' },
  48: { build: 'giant', skin: '#6f4b33', hair: '#1c1612', hairStyle: 'mane', cloth: '#5a4430', clothAlt: '#b08d62', paint: '#e6d4b0', top: 'mantle', weapon: 'hammer', head: 'horns', accent: '#c09d72' },
  49: { build: 'giant', skin: '#a07a62', hair: '#f2f0ea', hairStyle: 'mane', cloth: '#d8d4cc', clothAlt: '#8fa8b8', paint: '#cfe9f7', top: 'mantle', weapon: 'claws', head: 'beard', accent: '#cfe9f7' },
  50: { build: 'normal', skin: '#7c5030', hair: '#181210', hairStyle: 'topknot', cloth: '#7a3b1f', clothAlt: '#ffcf5a', paint: '#ffcf5a', top: 'bare', weapon: 'blades', head: 'none', accent: '#ffcf5a', spots: true },
  51: { build: 'elder', skin: '#7a5a46', hair: '#f0eee8', hairStyle: 'braids', cloth: '#7b6a50', clothAlt: '#efe6cc', paint: '#f6f2e4', top: 'mantle', weapon: 'staff', head: 'none', accent: '#f0e6cc', feminine: true },
  52: { build: 'slim', skin: '#9a7058', hair: '#1d1a24', hairStyle: 'long', cloth: '#e9e7f0', clothAlt: '#2b2638', paint: '#9d8ad8', top: 'robe', weapon: 'none', head: 'blindfold', accent: '#9d8ad8', feminine: true },
  53: { build: 'slim', skin: '#c9a184', hair: '#2b3a24', hairStyle: 'long', cloth: '#5b6a3a', clothAlt: '#e6e0a8', paint: '#e6e0a8', top: 'robe', weapon: 'staff', head: 'none', accent: '#e6e0a8', feminine: true, scales: true },
  54: { build: 'elder', skin: '#6e4f3c', hair: '#dcd8d0', hairStyle: 'short', cloth: '#5c4b3a', clothAlt: '#f4dfa0', paint: '#f4dfa0', top: 'mantle', weapon: 'staff', head: 'beard', accent: '#f4dfa0' },
  55: { build: 'giant', skin: '#5d6a48', hair: '#1e2218', hairStyle: 'shaved', cloth: '#3e4a34', clothAlt: '#7faa7a', paint: '#b9d8a8', top: 'mantle', weapon: 'club', head: 'none', accent: '#7faa7a', scales: true },
};

/** A neutral tribal figure for anything without a dedicated description. */
function fallbackSpec(id: number): FigureSpec {
  const c = characters.find(entry => entry.id === id);
  const ranged = (c?.range ?? 1) > 1;
  return { build: 'normal', skin: '#8a5d3d', hair: '#241d18', hairStyle: 'short', cloth: '#5a4a36', clothAlt: '#a08a62', paint: '#e8dcc0', top: 'bare', weapon: ranged ? 'staff' : 'spear', head: 'none', accent: '#d6c08a' };
}
export const figureSpec = (id: number): FigureSpec => SPEC[id] ?? fallbackSpec(id);
export const hasFigureSpec = (id: number): boolean => !!SPEC[id];

const FRAME_W = 200, FRAME_H = 230, FOOT_Y = 212, CENTER_X = 92;
const OUTLINE = '#17120e';
type Pose = { bob: number; lean: number; armF: number; armB: number; elbowF: number; elbowB: number; legF: number; legB: number; kneeF: number; kneeB: number; weapon: number; cast: number };
const POSES = {
  idle: [0, 1, 2, 1].map(i => ({ bob: [0, 1, 2, 1][i], lean: 0.02, armF: 0.25 + i * 0.02, armB: -0.15, elbowF: -0.5, elbowB: 0.3, legF: 0.08, legB: -0.08, kneeF: 0.02, kneeB: 0.06, weapon: 0, cast: 0 })),
  walk: [0, 1, 2, 3].map(i => { const s = Math.sin(i / 4 * Math.PI * 2); return { bob: Math.abs(s) * -3, lean: 0.08, armF: -s * 0.55, armB: s * 0.55, elbowF: -0.45, elbowB: -0.3, legF: s * 0.5, legB: -s * 0.5, kneeF: Math.max(0, -s) * 0.6, kneeB: Math.max(0, s) * 0.6, weapon: 0, cast: 0 }; }),
  attack: [
    { bob: 1, lean: -0.1, armF: -1.9, armB: -0.6, elbowF: -0.6, elbowB: 0.4, legF: 0.3, legB: -0.25, kneeF: 0.2, kneeB: 0.1, weapon: -1, cast: 0.3 },
    { bob: 0, lean: 0.18, armF: 1.25, armB: -0.9, elbowF: 0.1, elbowB: 0.3, legF: 0.55, legB: -0.45, kneeF: 0.1, kneeB: 0.3, weapon: 1, cast: 1 },
    { bob: 1, lean: 0.22, armF: 1.0, armB: -0.6, elbowF: 0.2, elbowB: 0.2, legF: 0.5, legB: -0.4, kneeF: 0.15, kneeB: 0.25, weapon: 0.7, cast: 0.6 },
    { bob: 1, lean: 0.06, armF: 0.4, armB: -0.25, elbowF: -0.35, elbowB: 0.2, legF: 0.2, legB: -0.15, kneeF: 0.05, kneeB: 0.1, weapon: 0.2, cast: 0.15 },
  ] as Pose[],
};

const DIMENSIONS: Record<Build, { height: number; shoulder: number; hip: number; limb: number; head: number; hunch: number }> = {
  slim: { height: 1.0, shoulder: 21, hip: 15, limb: 10.5, head: 15, hunch: 0 },
  normal: { height: 1.03, shoulder: 26, hip: 17, limb: 12.5, head: 15.5, hunch: 0 },
  heavy: { height: 1.06, shoulder: 33, hip: 22, limb: 15.5, head: 16, hunch: 0.03 },
  giant: { height: 1.24, shoulder: 35, hip: 24, limb: 17, head: 16.5, hunch: 0.05 },
  elder: { height: 0.97, shoulder: 21, hip: 15, limb: 10.5, head: 15, hunch: 0.16 },
};

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) * (1 + amount))));
  return `#${[16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('')}`;
}
function stroke(c: CanvasRenderingContext2D, points: [number, number][], width: number, color: string, outline = true): void {
  c.lineCap = 'round'; c.lineJoin = 'round';
  const path = () => { c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); };
  if (outline) { path(); c.strokeStyle = OUTLINE; c.lineWidth = width + 3.2; c.stroke(); }
  path(); c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
function shape(c: CanvasRenderingContext2D, points: [number, number][], fill: string, outline = true): void {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
  c.fillStyle = fill; c.fill();
  if (outline) { c.strokeStyle = OUTLINE; c.lineWidth = 2.2; c.lineJoin = 'round'; c.stroke(); }
}
function oval(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, outline = true): void {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
  if (outline) { c.strokeStyle = OUTLINE; c.lineWidth = 2.2; c.stroke(); }
}
const at = (x: number, y: number, angle: number, length: number): [number, number] => [x + Math.sin(angle) * length, y + Math.cos(angle) * length];

function animalFeatures(animal: AnimalId) {
  return {
    ears: ['wolf', 'jackal', 'jaguar', 'bear', 'monkey', 'hippo', 'otter'].includes(animal),
    pointed: ['wolf', 'jackal', 'jaguar'].includes(animal),
    horns: ['buffalo', 'rhino', 'boar', 'beetle', 'deer'].includes(animal),
    tail: ['wolf', 'jackal', 'jaguar', 'monkey', 'serpent', 'scorpion', 'crocodile', 'otter'].includes(animal),
    wings: ['bat', 'raven', 'owl', 'eagle'].includes(animal),
    arms: ['spider', 'mantis'].includes(animal),
    shell: ['turtle', 'beetle', 'scorpion'].includes(animal),
  };
}

/** Paints one frame. x/y are the feet; the figure faces right. */
function paintFigure(c: CanvasRenderingContext2D, id: number, stars: number, pose: Pose, clip: 'idle' | 'walk' | 'attack'): void {
  const spec = figureSpec(id), dim = DIMENSIONS[spec.build], animal = CHARACTER_ANIMAL[id] ?? 'wolf';
  const feature = animalFeatures(animal);
  const scale = dim.height;
  const unit = 1.02 * scale;
  const footY = FOOT_Y, cx = CENTER_X;
  const legLen = 25 * unit, shinLen = 25 * unit, torsoLen = 40 * unit, armLen = 22 * unit, foreLen = 21 * unit;
  const hipY = footY - legLen - shinLen + 4 + pose.bob;
  const lean = pose.lean + dim.hunch;
  const hip: [number, number] = [cx, hipY];
  const neck: [number, number] = [cx + Math.sin(lean) * torsoLen, hipY - Math.cos(lean) * torsoLen];
  const shoulderB: [number, number] = [neck[0] - dim.shoulder * 0.35, neck[1] + 6];
  const shoulderF: [number, number] = [neck[0] + dim.shoulder * 0.35, neck[1] + 6];
  const headC: [number, number] = [neck[0] + 3 + Math.sin(lean) * 8, neck[1] - dim.head - 2];
  const skinDark = shade(spec.skin, -0.2), clothDark = shade(spec.cloth, -0.25);
  const glow = stars >= 2;

  // 3★ avatar: the spirit animal towers behind the figure.
  if (stars === 3) {
    const g = c.createRadialGradient(cx, hipY - 30, 10, cx, hipY - 30, 110);
    g.addColorStop(0, spec.accent + '55'); g.addColorStop(1, spec.accent + '00');
    c.fillStyle = g; c.fillRect(0, 0, FRAME_W, FRAME_H);
    paintGlyph(c, animal, cx + 6, hipY - 52, 132 * scale, spec.accent, 0.3);
  }
  // Wings and extra arms are spectral limbs, behind the body.
  if (stars >= 2 && feature.wings) {
    const spread = stars === 3 ? 1 : 0.6, flap = clip === 'attack' ? pose.cast * 0.3 : 0;
    c.globalAlpha = stars === 3 ? 0.7 : 0.45;
    for (const side of [-1, 1]) shape(c, [[neck[0], neck[1] + 8], [neck[0] + side * 48 * spread, neck[1] - 30 - flap * 30], [neck[0] + side * 62 * spread, neck[1] + 10], [neck[0] + side * 40 * spread, neck[1] + 4], [neck[0] + side * 30 * spread, neck[1] + 30]], spec.accent, false);
    c.globalAlpha = 1;
  }
  if (stars >= 2 && feature.arms) {
    c.globalAlpha = stars === 3 ? 0.75 : 0.5;
    const pairs = stars === 3 ? 3 : 1;
    for (let i = 0; i < pairs; i++) for (const side of [-1, 1]) {
      const base: [number, number] = [neck[0] + side * 4, neck[1] + 12 + i * 8];
      const knee: [number, number] = [base[0] + side * (26 + i * 4), base[1] - 18 + i * 10 + pose.bob];
      stroke(c, [base, knee, [knee[0] + side * 10, knee[1] + 26]], 3.4, spec.accent, false);
    }
    c.globalAlpha = 1;
  }
  if (stars >= 2 && feature.tail) {
    const sway = Math.sin(pose.bob + pose.legF * 2) * 6;
    c.globalAlpha = stars === 3 ? 0.9 : 0.6;
    const long = stars === 3 ? 1 : 0.7;
    stroke(c, [[hip[0] - 8, hip[1] + 4], [hip[0] - 22 * long, hip[1] + 18 + sway], [hip[0] - 36 * long, hip[1] + 22 + sway], [hip[0] - 46 * long, hip[1] + 12 + sway]], stars === 3 ? 8 : 6, stars === 3 ? spec.accent : shade(spec.accent, -0.15));
    c.globalAlpha = 1;
  }
  if (stars >= 2 && feature.shell) oval(c, neck[0] - 9, neck[1] + 20, 15 * unit, 22 * unit, shade(spec.accent, -0.35));
  if (spec.weapon === 'needles') for (let i = 0; i < 8; i++) {
    const a = -1.2 + i * 0.34;
    stroke(c, [[neck[0] - 6, neck[1] + 14], at(neck[0] - 6, neck[1] + 14, Math.PI + a, 34)], 2, '#d8cdb0');
  }
  if (spec.top === 'cape' || spec.top === 'mantle') shape(c, [[shoulderB[0] - 4, shoulderB[1] - 2], [shoulderF[0] + 2, shoulderF[1] - 2], [hip[0] - 4 + (spec.top === 'mantle' ? 0 : 6), hip[1] + 18], [hip[0] - 20, hip[1] + (spec.top === 'mantle' ? 30 : 14)]], spec.top === 'cape' ? spec.cloth : clothDark);

  // Back arm and leg.
  const elbowB = at(...shoulderB, pose.armB, armLen), handB = at(...elbowB, pose.armB + pose.elbowB, foreLen);
  stroke(c, [shoulderB, elbowB, handB], dim.limb - 1, skinDark);
  const kneeB = at(hip[0] - 4, hip[1], pose.legB, legLen), footB = at(...kneeB, pose.legB - pose.kneeB, shinLen);
  stroke(c, [[hip[0] - 4, hip[1]], kneeB, footB], dim.limb + 1, skinDark);
  stroke(c, [footB, [footB[0] + 9, footB[1]]], 5, shade(skinDark, -0.1));

  // Torso.
  const w = dim.shoulder, h = dim.hip;
  const waist: [number, number] = [neck[0] * 0.4 + hip[0] * 0.6, neck[1] * 0.4 + hip[1] * 0.6];
  const torso: [number, number][] = [[shoulderB[0] - 5, shoulderB[1] - 4], [shoulderF[0] + 5, shoulderF[1] - 4], [shoulderF[0] + 6, shoulderF[1] + 8], [waist[0] + w * 0.42, waist[1]], [hip[0] + h, hip[1] - 2], [hip[0] - h, hip[1] - 2], [waist[0] - w * 0.46, waist[1]], [shoulderB[0] - 6, shoulderB[1] + 8]];
  shape(c, torso, spec.top === 'armor' ? spec.cloth : spec.skin);
  if (spec.top !== 'armor') { c.globalAlpha = 0.35; shape(c, [[neck[0] + 2, neck[1] + 8], [shoulderF[0] + 3, shoulderF[1] + 2], [waist[0] + w * 0.32, waist[1] - 4], [neck[0] + 4, waist[1] - 8]], shade(spec.skin, 0.25), false); c.globalAlpha = 1; }
  if (spec.top === 'armor') for (let i = 0; i < 3; i++) shape(c, [[neck[0] - w * 0.55, neck[1] + 12 + i * 11], [neck[0] + w * 0.55, neck[1] + 12 + i * 11], [neck[0] + w * 0.45, neck[1] + 21 + i * 11], [neck[0] - w * 0.45, neck[1] + 21 + i * 11]], i % 2 ? spec.clothAlt : shade(spec.cloth, 0.25));
  else if (spec.top === 'robe') shape(c, [[neck[0] - w * 0.6, neck[1] + 6], [neck[0] + w * 0.6, neck[1] + 6], [hip[0] + h + 8, hip[1] + 42], [hip[0] - h - 6, hip[1] + 42]], spec.cloth);
  // Body paint, glowing from the second star.
  c.save(); c.globalAlpha = glow ? 0.95 : 0.8;
  if (glow) { c.shadowColor = spec.accent; c.shadowBlur = stars === 3 ? 10 : 6; }
  stroke(c, [[neck[0] - 5, neck[1] + 16], [neck[0] + 2, neck[1] + 22], [neck[0] + 8, neck[1] + 16]], 2.4, glow ? spec.accent : spec.paint, false);
  if (spec.spots || spec.scales) for (let i = 0; i < 5; i++) oval(c, neck[0] - 6 + (i % 3) * 7, neck[1] + 26 + Math.floor(i / 3) * 8, 2, 1.6, glow ? spec.accent : spec.paint, false);
  c.restore();
  // Belt and loincloth.
  stroke(c, [[hip[0] - h - 1, hip[1] - 3], [hip[0] + h + 1, hip[1] - 3]], 4, spec.clothAlt);
  if (spec.top !== 'robe') shape(c, [[hip[0] - h + 1, hip[1] - 2], [hip[0] + h - 1, hip[1] - 2], [hip[0] + 6, hip[1] + 24], [hip[0] - 7, hip[1] + 22]], spec.cloth);
  if (spec.masks) for (let i = 0; i < 3; i++) oval(c, hip[0] - 9 + i * 9, hip[1] + 2, 4, 5, ['#d9a35e', '#e8e0cc', '#e8ecf6'][i]);

  // Front leg.
  const kneeF = at(hip[0] + 4, hip[1], pose.legF, legLen), footF = at(...kneeF, pose.legF - pose.kneeF, shinLen);
  stroke(c, [[hip[0] + 4, hip[1]], kneeF, footF], dim.limb + 1, spec.skin);
  stroke(c, [[hip[0] + 6, hip[1] + 2], [kneeF[0] + 2, kneeF[1]]], dim.limb * 0.3, shade(spec.skin, 0.22), false);
  stroke(c, [footF, [footF[0] + 10, footF[1]]], 5.5, skinDark);
  if (spec.top === 'robe') shape(c, [[hip[0] - h - 4, hip[1] + 6], [hip[0] + h + 6, hip[1] + 6], [hip[0] + h + 12, hip[1] + 40], [hip[0] - h - 6, hip[1] + 40]], spec.cloth);

  // Head, hair and headgear: the hair mass sits behind the face.
  const [hx, hy] = headC, r = dim.head;
  stroke(c, [neck, [headC[0] - 2, headC[1] + r - 2]], dim.limb, skinDark);
  if (spec.hairStyle === 'mane') oval(c, hx - 5, hy + 2, r * 1.45, r * 1.35, spec.hair);
  if (spec.hairStyle === 'long') shape(c, [[hx - r, hy - 6], [hx + 2, hy - r], [hx - r * 0.2, hy + r * 2.4], [hx - r * 1.2, hy + r * 2.5], [hx - r * 1.35, hy + 4]], spec.hair);
  if (spec.hairStyle === 'braids') for (const dx of [-r * 0.9, -r * 0.35]) stroke(c, [[hx + dx, hy], [hx + dx - 3, hy + r * 1.6], [hx + dx - 1, hy + r * 2.4]], 5.5, spec.hair);
  if (feature.ears && stars >= 2) {
    const tall = feature.pointed ? 16 : 9;
    shape(c, [[hx - 8, hy - r + 4], [hx - 12, hy - r - tall], [hx + 1, hy - r + 2]], stars === 3 ? spec.accent : spec.hair);
  }
  if (spec.hairStyle !== 'shaved') oval(c, hx - 3, hy - 3, r * 1.04, r * 0.98, spec.hair);
  oval(c, hx + 1.5, hy + 1.5, r * 0.86, r * 0.92, spec.skin);
  if (spec.hairStyle !== 'shaved') shape(c, [[hx - r * 0.9, hy - 2], [hx - r * 0.6, hy - r * 0.85], [hx + r * 0.2, hy - r * 1.0], [hx + r * 0.85, hy - r * 0.55], [hx + r * 0.3, hy - r * 0.45], [hx - r * 0.3, hy - r * 0.2]], spec.hair, false);
  else stroke(c, [[hx - r * 0.7, hy - r * 0.6], [hx + r * 0.4, hy - r * 0.85]], 2, skinDark, false);
  if (spec.hairStyle === 'topknot') oval(c, hx - 4, hy - r - 4, 6, 5.5, spec.hair);
  oval(c, hx + r * 0.82, hy + 4, 3.2, 3.6, skinDark, false);
  stroke(c, [[hx + 2, hy - 4], [hx + 9, hy - 5]], 1.8, shade(spec.hair, -0.2), false);
  // Eyes glow with the spirit from the second star.
  c.save();
  if (glow) { c.shadowColor = spec.accent; c.shadowBlur = 8; }
  if (spec.head === 'blindfold') stroke(c, [[hx - r + 1, hy - 1], [hx + r, hy - 2]], 4.4, spec.clothAlt);
  else { oval(c, hx + 6, hy, 2.8, 2.4, '#f4ecd8', false); oval(c, hx + 6.8, hy, 1.6, 1.8, glow ? spec.accent : '#1a1410', false); }
  c.restore();
  stroke(c, [[hx - 1, hy + 6], [hx + 10, hy + 5]], 2, glow ? spec.accent : spec.paint, false);
  stroke(c, [[hx + 5, hy + 10], [hx + 10, hy + 9.5]], 1.4, shade(spec.skin, -0.35), false);
  if (spec.head === 'mask-long') shape(c, [[hx - 2, hy - r + 2], [hx + r + 2, hy - 4], [hx + r + 14, hy + 4], [hx + r, hy + 8], [hx, hy + 6]], '#e3d6b6');
  if (spec.head === 'horn-single' || (feature.horns && animal === 'rhino' && stars >= 2)) shape(c, [[hx + 2, hy - r + 2], [hx + r + 6, hy - r - 16], [hx + r - 1, hy - r + 6]], '#d9cdb0');
  if (spec.head === 'horns' || (feature.horns && stars >= 2 && animal !== 'rhino')) {
    const big = spec.head === 'horns' || stars === 3 ? 1 : 0.65;
    for (const side of [-1, 1]) stroke(c, [[hx + side * 4, hy - r + 2], [hx + side * 16 * big, hy - r - 8 * big], [hx + side * 22 * big, hy - r - 20 * big]], 3.6, stars >= 2 && spec.head !== 'horns' ? spec.accent : '#e3d6b6');
  }
  if (spec.head === 'feathers') for (let i = 0; i < 3; i++) shape(c, [[hx - 6 + i * 3, hy - r + 2], [hx - 12 + i * 6, hy - r - 18 - i * 3], [hx - 4 + i * 6, hy - r + 1]], i === 1 ? spec.accent : spec.clothAlt);
  if (spec.head === 'flowers') for (let i = 0; i < 3; i++) oval(c, hx - 8 + i * 7, hy - r + 2, 3.2, 3.2, ['#f2d5e0', '#f4f0c8', '#d8b8f0'][i]);
  if (spec.head === 'collar') {
    c.globalAlpha = stars >= 2 ? 0.95 : 0.85;
    shape(c, [[hx - r - 10, hy + 14], [hx - r - 6, hy - r - 8], [hx, hy - r - 14], [hx + 6, hy - r - 4], [hx + 2, hy + 14]], stars >= 2 ? shade(spec.accent, -0.2) : spec.clothAlt);
    oval(c, hx - 5, hy - 4, 5, 6, spec.skin, false);
    c.globalAlpha = 1;
    oval(c, hx + 1.5, hy + 1.5, r * 0.86, r * 0.92, spec.skin);
    oval(c, hx + 6, hy, 2.8, 2.4, '#f4ecd8', false); oval(c, hx + 6.8, hy, 1.6, 1.8, glow ? spec.accent : '#1a1410', false);
  }
  if (spec.head === 'beard') shape(c, [[hx - 2, hy + 4], [hx + r, hy + 3], [hx + r - 4, hy + 22], [hx + 2, hy + 26]], spec.hair);

  // Front arm and weapon.
  const elbowF = at(...shoulderF, pose.armF, armLen), handF = at(...elbowF, pose.armF + pose.elbowF, foreLen);
  stroke(c, [shoulderF, elbowF, handF], dim.limb - 0.5, spec.skin);
  stroke(c, [[shoulderF[0] + 1, shoulderF[1] + 1], elbowF], dim.limb * 0.28, shade(spec.skin, 0.22), false);
  if (spec.build === 'heavy' || spec.build === 'giant') oval(c, shoulderF[0] + 2, shoulderF[1] + 2, dim.limb * 0.75, dim.limb * 0.7, spec.top === 'armor' ? spec.clothAlt : spec.skin);
  if (stars >= 2) { c.save(); c.globalAlpha = 0.9; c.shadowColor = spec.accent; c.shadowBlur = 6; stroke(c, [[elbowF[0] * 0.5 + handF[0] * 0.5, elbowF[1] * 0.5 + handF[1] * 0.5], handF], 3, spec.accent, false); c.restore(); }
  paintWeapon(c, spec, handF, handB, pose, clip, stars);
  oval(c, handF[0], handF[1], dim.limb * 0.55, dim.limb * 0.55, spec.skin);
}

function paintWeapon(c: CanvasRenderingContext2D, spec: FigureSpec, hand: [number, number], back: [number, number], pose: Pose, clip: 'idle' | 'walk' | 'attack', stars: number): void {
  const angle = (clip === 'attack' ? pose.armF + 0.4 : pose.armF + 0.9) + Math.PI;
  const wood = '#8a6a44', stone = '#a7aaa0', bone = '#e3d6b6';
  const tip = (length: number, a = angle): [number, number] => at(hand[0], hand[1], a, length);
  const tail = (length: number, a = angle): [number, number] => at(hand[0], hand[1], a + Math.PI, length);
  switch (spec.weapon) {
    case 'spear': case 'harpoon': {
      const a = clip === 'attack' ? Math.PI / 2 + pose.weapon * 0.2 : angle;
      stroke(c, [tail(26, a), tip(46, a)], 3.4, wood);
      const end = tip(46, a), side = at(...end, a + 2.5, 9);
      shape(c, [end, at(...end, a, 12), side], spec.weapon === 'harpoon' ? '#c8d8e0' : stone);
      if (spec.weapon === 'harpoon') stroke(c, [at(...end, a + Math.PI, 2), at(...end, a + 2.2, 10)], 2.4, '#c8d8e0');
      break;
    }
    case 'staff': {
      const a = clip === 'attack' ? Math.PI - 0.15 - pose.cast * 0.2 : Math.PI - 0.05;
      stroke(c, [at(hand[0], hand[1], a + Math.PI, 40), at(hand[0], hand[1], a, 34)], 3.6, wood);
      const top = at(hand[0], hand[1], a, 36);
      c.save(); c.shadowColor = spec.accent; c.shadowBlur = clip === 'attack' ? 18 * pose.cast + 4 : stars >= 2 ? 8 : 2;
      oval(c, top[0], top[1], 5.5, 5.5, spec.accent); c.restore();
      if (clip === 'attack' && pose.cast > 0.5) { c.globalAlpha = pose.cast * 0.6; oval(c, top[0], top[1], 12 * pose.cast, 12 * pose.cast, spec.accent, false); c.globalAlpha = 1; }
      break;
    }
    case 'bow': {
      const a = clip === 'attack' ? Math.PI / 2 : angle * 0.5 + 1.2;
      const upper = at(hand[0], hand[1], a - 1.3, 26), lower = at(hand[0], hand[1], a + 1.3, 26), mid = at(hand[0], hand[1], a, 9);
      c.beginPath(); c.moveTo(...upper); c.quadraticCurveTo(...mid, ...lower); c.strokeStyle = OUTLINE; c.lineWidth = 5.6; c.stroke(); c.strokeStyle = wood; c.lineWidth = 3; c.stroke();
      const pull = clip === 'attack' ? (1 - pose.weapon) * 14 : 0;
      stroke(c, [upper, at(hand[0], hand[1], a + Math.PI, 4 + pull), lower], 1, '#e8e0cc', false);
      if (clip === 'attack' && pose.weapon < 0.5) stroke(c, [at(hand[0], hand[1], a + Math.PI, 4 + pull), at(hand[0], hand[1], a, 28)], 1.6, '#d8d4e4');
      break;
    }
    case 'blades': {
      for (const [h, offset] of [[hand, 0], [back, 0.5]] as [[number, number], number][]) {
        const a = (clip === 'attack' ? Math.PI / 2 - pose.weapon * 0.8 : Math.PI * 0.8) + offset;
        c.beginPath(); const start = h, end = at(h[0], h[1], a, 30), ctrl = at(h[0], h[1], a + 0.5, 20);
        c.moveTo(...start); c.quadraticCurveTo(...ctrl, ...end); c.strokeStyle = OUTLINE; c.lineWidth = 6; c.lineCap = 'round'; c.stroke(); c.strokeStyle = stars >= 2 ? spec.accent : '#cfd2c8'; c.lineWidth = 3.4; c.stroke();
      }
      break;
    }
    case 'claws': for (let i = 0; i < 3; i++) stroke(c, [hand, at(hand[0], hand[1], Math.PI / 2 - 0.4 + i * 0.35 - pose.weapon * 0.4, 14)], 2.2, stars >= 2 ? spec.accent : bone); break;
    case 'needles': for (let i = 0; i < 3; i++) stroke(c, [hand, at(hand[0], hand[1], Math.PI / 2 - 0.5 + i * 0.3, 18 + pose.cast * 10)], 1.6, bone); break;
    case 'club': case 'hammer': {
      const a = clip === 'attack' ? Math.PI * 0.5 + 1.4 - pose.weapon * 1.6 : Math.PI * 0.95;
      stroke(c, [hand, at(hand[0], hand[1], a, 38)], 4.4, wood);
      const head = at(hand[0], hand[1], a, 38);
      if (spec.weapon === 'hammer') shape(c, [at(...head, a + 1.57, 12), at(...head, a - 1.57, 12), at(...at(...head, a, 12), a - 1.57, 12), at(...at(...head, a, 12), a + 1.57, 12)], stone);
      else oval(c, head[0], head[1], 9, 9, stone);
      break;
    }
    case 'shield': {
      const center = at(back[0], back[1], Math.PI / 2, 10);
      oval(c, center[0] + 8, center[1], 15, 22, '#7a5a3a');
      oval(c, center[0] + 8, center[1], 7, 10, stars >= 2 ? spec.accent : bone, false);
      stroke(c, [hand, at(hand[0], hand[1], clip === 'attack' ? Math.PI / 2 : Math.PI * 0.9, 26)], 3.6, wood);
      break;
    }
    case 'none': if (clip === 'attack') { c.globalAlpha = pose.cast * 0.7; oval(c, hand[0] + 6, hand[1] - 4, 9 * pose.cast + 2, 9 * pose.cast + 2, spec.accent, false); c.globalAlpha = 1; } break;
  }
}

const cache = new Map<string, { canvas: HTMLCanvasElement; sheet: SheetDefinition }>();

/** A 4 × 3 sheet: idle, walk and attack rows with four poses each, matching the painted atlases. */
export function proceduralSheet(id: number, stars: number): { canvas: HTMLCanvasElement; sheet: SheetDefinition } {
  const key = `${id}:${stars}`;
  const found = cache.get(key);
  if (found) return found;
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_W * 4; canvas.height = FRAME_H * 3;
  const c = canvas.getContext('2d')!;
  (['idle', 'walk', 'attack'] as const).forEach((clip, row) => POSES[clip].forEach((pose, column) => {
    c.save(); c.translate(column * FRAME_W, row * FRAME_H);
    c.beginPath(); c.rect(0, 0, FRAME_W, FRAME_H); c.clip();
    paintFigure(c, id, stars, pose, clip);
    c.restore();
  }));
  const giant = figureSpec(id).build === 'giant';
  const sheet: SheetDefinition = {
    characterId: id, stars, name: characters.find(entry => entry.id === id)?.name ?? '',
    image: '', columns: 4, rows: 3, frameWidth: FRAME_W, frameHeight: FRAME_H,
    bodyHeight: giant ? 150 : 132, anchorX: CENTER_X, anchorY: FOOT_Y,
    imageWidth: canvas.width, imageHeight: canvas.height,
    portrait: { x: 10, y: 10, width: 180, height: 210 },
    clips: { idle: [0, 1, 2, 3], walk: [4, 5, 6, 7], attack: [8, 9, 10, 11] },
    notes: 'Figura procedural provisória; substituída automaticamente pela folha pintada.',
  };
  const entry = { canvas, sheet };
  cache.set(key, entry);
  return entry;
}

const portraits = new Map<string, string>();
/** Data URL of the first idle pose, for the interface. */
export function proceduralPortrait(id: number, stars: number): string {
  const key = `${id}:${stars}`;
  let url = portraits.get(key);
  if (!url) {
    const { canvas } = proceduralSheet(id, stars);
    // Crop to the painted figure (and its aura) so cards show it at a readable size.
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, FRAME_W, FRAME_H).data;
    let left = FRAME_W, right = 0, top = FRAME_H, bottom = 0;
    for (let y = 0; y < FRAME_H; y++) for (let x = 0; x < FRAME_W; x++) if (pixels[(y * FRAME_W + x) * 4 + 3] > 40) {
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    if (right <= left) { left = 0; top = 0; right = FRAME_W - 1; bottom = FRAME_H - 1; }
    const pad = 6;
    left = Math.max(0, left - pad); top = Math.max(0, top - pad); right = Math.min(FRAME_W - 1, right + pad); bottom = Math.min(FRAME_H - 1, bottom + pad);
    const crop = document.createElement('canvas');
    crop.width = right - left + 1; crop.height = bottom - top + 1;
    crop.getContext('2d')!.drawImage(canvas, left, top, crop.width, crop.height, 0, 0, crop.width, crop.height);
    url = crop.toDataURL('image/png');
    portraits.set(key, url);
  }
  return url;
}
export function proceduralImage(id: number, stars: number): string {
  const entry = proceduralSheet(id, stars);
  if (!entry.sheet.image) entry.sheet.image = entry.canvas.toDataURL('image/png');
  return entry.sheet.image;
}
