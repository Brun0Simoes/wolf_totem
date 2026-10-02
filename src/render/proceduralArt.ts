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
function shape(c: CanvasRenderingContext2D, points: [number, number][], fill: string | CanvasGradient, outline = true): void {
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

type P = [number, number];
/** Light comes from the front and above: the side facing it is lit, the far side falls into shade. */
const LIGHT: P = [0.55, -0.83];

/** A gradient across a segment, dark on the shaded side and warm on the lit edge. */
function across(c: CanvasRenderingContext2D, a: P, b: P, width: number, base: string): CanvasGradient {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len, ny = dx / len;
  if (nx * LIGHT[0] + ny * LIGHT[1] < 0) { nx = -nx; ny = -ny; }
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, half = width / 2 + 1;
  const g = c.createLinearGradient(mx - nx * half, my - ny * half, mx + nx * half, my + ny * half);
  g.addColorStop(0, shade(base, -0.3)); g.addColorStop(0.42, base); g.addColorStop(0.82, shade(base, 0.06)); g.addColorStop(1, shade(base, 0.24));
  return g;
}
/** A horizontal gradient for broad shapes such as the torso, robes and mantles. */
function sideLight(c: CanvasRenderingContext2D, left: number, right: number, base: string): CanvasGradient {
  const g = c.createLinearGradient(left, 0, right, 0);
  g.addColorStop(0, shade(base, -0.28)); g.addColorStop(0.5, base); g.addColorStop(0.88, shade(base, 0.08)); g.addColorStop(1, shade(base, 0.2));
  return g;
}
/** A jointed, tapering limb: widths are given at each joint. The outline wraps the whole limb. */
function limb(c: CanvasRenderingContext2D, points: P[], widths: number[], base: string, outline = true): void {
  const segments: Path2D[] = [], joints: Path2D[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [a, b] = [points[i], points[i + 1]], [wa, wb] = [widths[i] / 2, widths[i + 1] / 2];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const path = new Path2D();
    path.moveTo(a[0] + nx * wa, a[1] + ny * wa); path.lineTo(b[0] + nx * wb, b[1] + ny * wb);
    path.lineTo(b[0] - nx * wb, b[1] - ny * wb); path.lineTo(a[0] - nx * wa, a[1] - ny * wa); path.closePath();
    segments.push(path);
  }
  points.forEach(([x, y], i) => { const path = new Path2D(); path.arc(x, y, widths[i] / 2, 0, Math.PI * 2); joints.push(path); });
  if (outline) { c.strokeStyle = OUTLINE; c.lineWidth = 3.4; c.lineJoin = 'round'; for (const path of [...segments, ...joints]) c.stroke(path); }
  segments.forEach((path, i) => { c.fillStyle = across(c, points[i], points[i + 1], Math.max(widths[i], widths[i + 1]), base); c.fill(path); });
  joints.forEach((path, i) => { const j = Math.min(i, points.length - 2); c.fillStyle = across(c, points[j], points[j + 1], widths[i], base); c.fill(path); });
}
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** A wrapped band around a limb, between two fractions of a segment. */
function band(c: CanvasRenderingContext2D, a: P, b: P, from: number, to: number, width: number, color: string): void {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len * width / 2, ny = dx / len * width / 2;
  const [p, q] = [lerp(a, b, from), lerp(a, b, to)];
  shape(c, [[p[0] + nx, p[1] + ny], [q[0] + nx, q[1] + ny], [q[0] - nx, q[1] - ny], [p[0] - nx, p[1] - ny]], across(c, p, q, width, color));
  const mid = lerp(a, b, (from + to) / 2);
  stroke(c, [[mid[0] + nx * 0.7, mid[1] + ny * 0.7], [mid[0] - nx * 0.7, mid[1] - ny * 0.7]], 0.9, shade(color, -0.35), false);
}
/** Short hanging strands along a hem. */
function fringe(c: CanvasRenderingContext2D, from: P, to: P, count: number, length: number, color: string): void {
  for (let i = 0; i <= count; i++) {
    const [x, y] = lerp(from, to, i / count);
    stroke(c, [[x, y - 1], [x - 0.5, y + length * (0.8 + (i % 2) * 0.35)]], 1.6, color);
  }
}
/** A tribal zigzag between two points. */
function zigzag(c: CanvasRenderingContext2D, from: P, to: P, teeth: number, height: number, color: string, width = 1.5): void {
  const points: P[] = [];
  for (let i = 0; i <= teeth * 2; i++) { const [x, y] = lerp(from, to, i / (teeth * 2)); points.push([x, y + (i % 2 ? height : 0)]); }
  stroke(c, points, width, color, false);
}
function foot(c: CanvasRenderingContext2D, ankle: P, length: number, skin: string, strap: string): void {
  const [x, y] = ankle;
  shape(c, [[x - 4, y - 3], [x + 2, y - 4], [x + length * 0.7, y - 1], [x + length, y + 2], [x + length - 1, y + 5], [x - 5, y + 5]], skin);
  stroke(c, [[x - 5, y + 4.6], [x + length - 0.5, y + 4.6]], 2, shade(strap, -0.25), false);
  stroke(c, [[x - 1, y - 2], [x + 4, y + 3]], 1.6, strap, false);
}

/** Paints one frame. x/y are the feet; the figure faces right. */
function paintFigure(c: CanvasRenderingContext2D, id: number, stars: number, pose: Pose, clip: 'idle' | 'walk' | 'attack'): void {
  const spec = figureSpec(id), dim = DIMENSIONS[spec.build], animal = CHARACTER_ANIMAL[id] ?? 'wolf';
  const feature = animalFeatures(animal);
  const scale = dim.height;
  const unit = 1.02 * scale;
  const footY = FOOT_Y, cx = CENTER_X;
  const legLen = 25 * unit, shinLen = 25 * unit, torsoLen = 40 * unit, armLen = 22 * unit, foreLen = 21 * unit;
  const hipY = footY - legLen - shinLen + 1 + pose.bob;
  const lean = pose.lean + dim.hunch;
  const hip: P = [cx, hipY];
  const neck: P = [cx + Math.sin(lean) * torsoLen, hipY - Math.cos(lean) * torsoLen];
  const shoulderB: P = [neck[0] - dim.shoulder * 0.35, neck[1] + 6];
  const shoulderF: P = [neck[0] + dim.shoulder * 0.35, neck[1] + 6];
  const headC: P = [neck[0] + 3 + Math.sin(lean) * 8, neck[1] - dim.head - 2];
  const skinDark = shade(spec.skin, -0.2), clothDark = shade(spec.cloth, -0.25);
  const glow = stars >= 2;
  const L = dim.limb, heavy = spec.build === 'heavy' || spec.build === 'giant';
  const markColor = glow ? spec.accent : spec.paint;

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
    for (const side of [-1, 1]) {
      const root: P = [neck[0], neck[1] + 8];
      shape(c, [root, [neck[0] + side * 48 * spread, neck[1] - 30 - flap * 30], [neck[0] + side * 62 * spread, neck[1] + 10], [neck[0] + side * 40 * spread, neck[1] + 4], [neck[0] + side * 30 * spread, neck[1] + 30]], spec.accent, false);
      for (let i = 1; i < 4; i++) stroke(c, [root, [neck[0] + side * (30 + i * 9) * spread, neck[1] - 18 + i * 9 - flap * 20]], 1, shade(spec.accent, 0.35), false);
    }
    c.globalAlpha = 1;
  }
  if (stars >= 2 && feature.arms) {
    c.globalAlpha = stars === 3 ? 0.75 : 0.5;
    const pairs = stars === 3 ? 3 : 1;
    for (let i = 0; i < pairs; i++) for (const side of [-1, 1]) {
      const base: P = [neck[0] + side * 4, neck[1] + 12 + i * 8];
      const knee: P = [base[0] + side * (26 + i * 4), base[1] - 18 + i * 10 + pose.bob];
      stroke(c, [base, knee, [knee[0] + side * 10, knee[1] + 26]], 3.4, spec.accent, false);
    }
    c.globalAlpha = 1;
  }
  if (stars >= 2 && feature.tail) {
    const sway = Math.sin(pose.bob + pose.legF * 2) * 6;
    c.globalAlpha = stars === 3 ? 0.9 : 0.6;
    const long = stars === 3 ? 1 : 0.7;
    limb(c, [[hip[0] - 8, hip[1] + 4], [hip[0] - 22 * long, hip[1] + 18 + sway], [hip[0] - 36 * long, hip[1] + 20 + sway], [hip[0] - 46 * long, hip[1] + 10 + sway]], stars === 3 ? [9, 8, 6, 3] : [7, 6, 4, 2], stars === 3 ? spec.accent : shade(spec.accent, -0.15));
    c.globalAlpha = 1;
  }
  if (stars >= 2 && feature.shell) {
    const sx = neck[0] - 9, sy = neck[1] + 20, color = shade(spec.accent, -0.35);
    oval(c, sx, sy, 15 * unit, 22 * unit, color);
    for (let i = -1; i <= 1; i++) stroke(c, [[sx - 12 * unit, sy + i * 9], [sx + 12 * unit, sy + i * 9]], 1.2, shade(color, -0.3), false);
  }
  if (spec.weapon === 'needles') for (let i = 0; i < 8; i++) {
    const a = -1.2 + i * 0.34;
    stroke(c, [[neck[0] - 6, neck[1] + 14], at(neck[0] - 6, neck[1] + 14, Math.PI + a, 34)], 2, '#d8cdb0');
  }
  // Cape or mantle hanging behind the body.
  if (spec.top === 'cape' || spec.top === 'mantle') {
    const mantle = spec.top === 'mantle';
    const back: P[] = [[shoulderB[0] - 4, shoulderB[1] - 2], [shoulderF[0] + 2, shoulderF[1] - 2], [hip[0] - 4 + (mantle ? 0 : 6), hip[1] + 18], [hip[0] - 20, hip[1] + (mantle ? 30 : 14)]];
    shape(c, back, mantle ? clothDark : spec.cloth);
    zigzag(c, lerp(back[3], back[2], 0.08), lerp(back[3], back[2], 0.92), 4, -3, shade(spec.clothAlt, -0.1));
    fringe(c, back[3], back[2], 6, 4, shade(mantle ? clothDark : spec.cloth, -0.1));
  }
  // Rear flap of the loincloth.
  if (spec.top !== 'robe') shape(c, [[hip[0] - dim.hip + 2, hip[1] - 1], [hip[0] - 3, hip[1] - 1], [hip[0] - 7, hip[1] + 19], [hip[0] - dim.hip - 2, hip[1] + 17]], clothDark);

  // Back arm and leg, in shade.
  const elbowB = at(...shoulderB, pose.armB, armLen), handB = at(...elbowB, pose.armB + pose.elbowB, foreLen);
  limb(c, [shoulderB, elbowB, handB], [L * (heavy ? 1.15 : 1), L * 0.78, L * 0.62], skinDark);
  band(c, elbowB, handB, 0.62, 0.8, L * 0.72, shade(spec.clothAlt, -0.2));
  const hipB: P = [hip[0] - 4, hip[1]];
  const kneeB = at(...hipB, pose.legB, legLen), footB = at(...kneeB, pose.legB - pose.kneeB, shinLen);
  limb(c, [hipB, kneeB, footB], [L * 1.3, L * 0.86, L * 0.6], skinDark);
  band(c, kneeB, footB, 0.72, 0.86, L * 0.7, shade(spec.clothAlt, -0.2));
  foot(c, footB, 13 * unit, shade(skinDark, -0.06), shade(spec.cloth, -0.2));

  // Torso, shaded from the far side to the lit front.
  const w = dim.shoulder, h = dim.hip;
  const waist: P = [neck[0] * 0.4 + hip[0] * 0.6, neck[1] * 0.4 + hip[1] * 0.6];
  const torso: P[] = [[shoulderB[0] - 5, shoulderB[1] - 4], [shoulderF[0] + 5, shoulderF[1] - 4], [shoulderF[0] + 6, shoulderF[1] + 8], [waist[0] + w * 0.42, waist[1]], [hip[0] + h, hip[1] - 2], [hip[0] - h, hip[1] - 2], [waist[0] - w * 0.46, waist[1]], [shoulderB[0] - 6, shoulderB[1] + 8]];
  const torsoLeft = shoulderB[0] - 8, torsoRight = shoulderF[0] + 8;
  shape(c, torso, sideLight(c, torsoLeft, torsoRight, spec.top === 'armor' ? spec.cloth : spec.skin));
  if (spec.top === 'bare' || spec.top === 'cape' || spec.top === 'mantle') {
    // Chest and belly read through soft creases.
    const crease = shade(spec.skin, -0.32);
    c.beginPath(); c.moveTo(neck[0] - 4, neck[1] + 19); c.quadraticCurveTo(neck[0] + 4, neck[1] + 24, shoulderF[0] + 3, neck[1] + 17);
    c.strokeStyle = crease; c.lineWidth = 1.5; c.stroke();
    for (let i = 0; i < 2; i++) stroke(c, [[waist[0] - 2, waist[1] - 6 + i * 7], [waist[0] + 6, waist[1] - 6.5 + i * 7]], 1.1, crease, false);
    stroke(c, [[shoulderF[0] + 4, shoulderF[1] - 1], [waist[0] + w * 0.4, waist[1] - 2]], 1.6, shade(spec.skin, 0.32), false);
  }
  if (spec.top === 'armor') for (let i = 0; i < 3; i++) {
    const y = neck[1] + 12 + i * 11;
    shape(c, [[neck[0] - w * 0.55, y], [neck[0] + w * 0.55, y], [neck[0] + w * 0.45, y + 9], [neck[0] - w * 0.45, y + 9]], i % 2 ? spec.clothAlt : shade(spec.cloth, 0.25));
    for (const dx of [-w * 0.35, 0, w * 0.35]) oval(c, neck[0] + dx, y + 4.5, 1.2, 1.2, shade(spec.clothAlt, 0.35), false);
  } else if (spec.top === 'robe') {
    const robe: P[] = [[neck[0] - w * 0.6, neck[1] + 6], [neck[0] + w * 0.6, neck[1] + 6], [hip[0] + h + 8, hip[1] + 42], [hip[0] - h - 6, hip[1] + 42]];
    shape(c, robe, sideLight(c, robe[3][0], robe[2][0], spec.cloth));
    stroke(c, [[neck[0] - 2, neck[1] + 8], [hip[0] + 1, hip[1] + 40]], 1.2, clothDark, false);
  }
  // Body paint, glowing from the second star.
  c.save(); c.globalAlpha = glow ? 0.95 : 0.85;
  if (glow) { c.shadowColor = spec.accent; c.shadowBlur = stars === 3 ? 10 : 6; }
  if (spec.top !== 'robe' && spec.top !== 'armor') {
    stroke(c, [[waist[0] - 6, waist[1] + 2], [waist[0] + 1, waist[1] + 7], [waist[0] + 8, waist[1] + 2]], 2, markColor, false);
    if (spec.spots || spec.scales) for (let i = 0; i < 5; i++) oval(c, neck[0] - 7 + (i % 3) * 7, neck[1] + 28 + Math.floor(i / 3) * 7, spec.scales ? 2.2 : 1.8, spec.scales ? 1.4 : 1.8, markColor, false);
  }
  c.restore();
  // Necklace of beads with a carved tooth.
  {
    const beads = 7;
    for (let i = 0; i < beads; i++) {
      const t = i / (beads - 1), x = neck[0] - 8 + t * 18, y = neck[1] + 7 + Math.sin(t * Math.PI) * 8;
      oval(c, x, y, 1.9, 1.9, i % 2 ? spec.clothAlt : spec.paint);
    }
    shape(c, [[neck[0] + 0.5, neck[1] + 15], [neck[0] + 4.5, neck[1] + 15], [neck[0] + 2.5, neck[1] + 22]], '#efe6cf');
  }
  // Belt and front flap with a woven border.
  stroke(c, [[hip[0] - h - 1, hip[1] - 3], [hip[0] + h + 1, hip[1] - 3]], 4.5, spec.clothAlt);
  zigzag(c, [hip[0] - h + 1, hip[1] - 4.6], [hip[0] + h - 1, hip[1] - 4.6], 4, 2.4, shade(spec.clothAlt, -0.4), 1);
  if (spec.top !== 'robe') {
    const flap: P[] = [[hip[0] - h + 3, hip[1] - 1], [hip[0] + h - 1, hip[1] - 1], [hip[0] + 7, hip[1] + 24], [hip[0] - 6, hip[1] + 22]];
    shape(c, flap, sideLight(c, flap[0][0], flap[1][0], spec.cloth));
    zigzag(c, [hip[0] - 4, hip[1] + 12], [hip[0] + 6, hip[1] + 12], 2, 3, spec.clothAlt);
    fringe(c, flap[3], flap[2], 4, 3.5, spec.cloth);
  }
  if (spec.masks) for (let i = 0; i < 3; i++) {
    const x = hip[0] - 9 + i * 9, y = hip[1] + 2;
    oval(c, x, y, 4, 5, ['#d9a35e', '#e8e0cc', '#e8ecf6'][i]);
    oval(c, x - 1.2, y - 1, 0.8, 0.8, OUTLINE, false); oval(c, x + 1.4, y - 1, 0.8, 0.8, OUTLINE, false);
  }

  // Front leg.
  const hipF: P = [hip[0] + 4, hip[1]];
  const kneeF = at(...hipF, pose.legF, legLen), footF = at(...kneeF, pose.legF - pose.kneeF, shinLen);
  limb(c, [hipF, kneeF, footF], [L * 1.35, L * 0.9, L * 0.62], spec.skin);
  if (glow) { c.save(); c.shadowColor = spec.accent; c.shadowBlur = 6; stroke(c, [lerp(hipF, kneeF, 0.3), lerp(hipF, kneeF, 0.55), lerp(hipF, kneeF, 0.75)].map(([x, y], i) => [x + (i % 2 ? 3 : 0), y] as P), 1.6, spec.accent, false); c.restore(); }
  band(c, kneeF, footF, 0.72, 0.86, L * 0.74, spec.clothAlt);
  foot(c, footF, 14 * unit, spec.skin, spec.cloth);
  if (spec.top === 'robe') {
    const hem: P[] = [[hip[0] - h - 4, hip[1] + 6], [hip[0] + h + 6, hip[1] + 6], [hip[0] + h + 12, hip[1] + 40], [hip[0] - h - 6, hip[1] + 40]];
    shape(c, hem, sideLight(c, hem[3][0], hem[2][0], spec.cloth));
    zigzag(c, [hem[3][0] + 2, hem[3][1] - 7], [hem[2][0] - 2, hem[2][1] - 7], 5, 3.5, spec.clothAlt, 1.8);
    stroke(c, [[hem[3][0] + 1, hem[3][1] - 2], [hem[2][0] - 1, hem[2][1] - 2]], 2.2, shade(spec.clothAlt, -0.2), false);
    fringe(c, hem[3], hem[2], 7, 3.5, spec.cloth);
  }

  // Head: neck, hair mass behind, the profile with its features, then the hair over the crown.
  const [hx, hy] = headC, r = dim.head;
  limb(c, [neck, [headC[0] - 2, headC[1] + r - 3]], [L * 1.05, L * 0.95], skinDark);
  if (spec.hairStyle === 'mane') { oval(c, hx - 5, hy + 2, r * 1.45, r * 1.35, spec.hair); for (let i = 0; i < 5; i++) stroke(c, [[hx - r * 1.2 + i * 3, hy - r * 0.6 + i * 6], [hx - r * 1.4 + i * 2, hy + r * 0.2 + i * 6]], 1.2, shade(spec.hair, 0.25), false); }
  if (spec.hairStyle === 'long') {
    shape(c, [[hx - r, hy - 6], [hx + 2, hy - r], [hx - r * 0.2, hy + r * 2.4], [hx - r * 1.2, hy + r * 2.5], [hx - r * 1.35, hy + 4]], spec.hair);
    for (let i = 0; i < 3; i++) stroke(c, [[hx - r * 0.9 + i * 4, hy], [hx - r * 1.05 + i * 4, hy + r * 2.2]], 1, shade(spec.hair, 0.28), false);
  }
  if (spec.hairStyle === 'braids') for (const dx of [-r * 0.9, -r * 0.35]) {
    stroke(c, [[hx + dx, hy], [hx + dx - 3, hy + r * 1.6], [hx + dx - 1, hy + r * 2.4]], 5.5, spec.hair);
    oval(c, hx + dx - 2.6, hy + r * 1.7, 3.2, 2.2, spec.clothAlt);
  }
  if (feature.ears && stars >= 2) {
    const tall = feature.pointed ? 16 : 9;
    shape(c, [[hx - 8, hy - r + 4], [hx - 12, hy - r - tall], [hx + 1, hy - r + 2]], stars === 3 ? spec.accent : spec.hair);
    shape(c, [[hx - 7, hy - r + 3], [hx - 10, hy - r - tall + 6], [hx - 2, hy - r + 2]], shade(stars === 3 ? spec.accent : spec.hair, 0.35), false);
  }
  const face = new Path2D();
  face.arc(hx, hy, r, -0.6, 1.9, true);
  face.lineTo(hx + r * 0.2, hy + r * 1.05); face.lineTo(hx + r * 0.7, hy + r * 0.94); face.lineTo(hx + r * 0.86, hy + r * 0.64);
  face.lineTo(hx + r * 0.95, hy + r * 0.44); face.lineTo(hx + r * 1.15, hy + r * 0.24); face.lineTo(hx + r * 0.96, hy - r * 0.04);
  face.lineTo(hx + r * 0.99, hy - r * 0.32); face.closePath();
  c.strokeStyle = OUTLINE; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke(face);
  const skinLight = c.createRadialGradient(hx + r * 0.45, hy - r * 0.25, r * 0.2, hx, hy, r * 1.25);
  skinLight.addColorStop(0, shade(spec.skin, 0.2)); skinLight.addColorStop(0.55, spec.skin); skinLight.addColorStop(1, shade(spec.skin, -0.28));
  c.fillStyle = skinLight; c.fill(face);
  // Ear, brow, eye, nose shadow, mouth and cheek paint.
  oval(c, hx - r * 0.12, hy + r * 0.14, 3.2, 4.6, shade(spec.skin, -0.08));
  stroke(c, [[hx - r * 0.12, hy + r * 0.02], [hx - r * 0.1, hy + r * 0.3]], 1.1, shade(spec.skin, -0.35), false);
  c.save();
  if (glow) { c.shadowColor = spec.accent; c.shadowBlur = 8; }
  if (spec.head === 'blindfold') stroke(c, [[hx - r + 1, hy - 1], [hx + r * 1.02, hy - 2]], 4.6, spec.clothAlt);
  else {
    c.beginPath(); c.moveTo(hx + r * 0.38, hy + r * 0.03); c.quadraticCurveTo(hx + r * 0.58, hy - r * 0.16, hx + r * 0.8, hy + r * 0.02); c.quadraticCurveTo(hx + r * 0.58, hy + r * 0.14, hx + r * 0.38, hy + r * 0.03);
    c.fillStyle = '#f4ecd8'; c.fill();
    oval(c, hx + r * 0.62, hy + r * 0.0, 1.9, 2.1, glow ? spec.accent : '#2a1a10', false);
    oval(c, hx + r * 0.66, hy - r * 0.05, 0.6, 0.6, '#ffffff', false);
  }
  c.restore();
  stroke(c, [[hx + r * 0.32, hy - r * 0.22], [hx + r * 0.62, hy - r * 0.28], [hx + r * 0.9, hy - r * 0.2]], 2, shade(spec.hairStyle === 'shaved' ? spec.skin : spec.hair, -0.3), false);
  stroke(c, [[hx + r * 0.98, hy + r * 0.02], [hx + r * 0.92, hy + r * 0.3]], 1.1, shade(spec.skin, -0.3), false);
  stroke(c, [[hx + r * 0.62, hy + r * 0.62], [hx + r * 0.86, hy + r * 0.6]], 1.4, shade(spec.skin, -0.42), false);
  c.save(); if (glow) { c.shadowColor = spec.accent; c.shadowBlur = 6; }
  for (let i = 0; i < 2; i++) stroke(c, [[hx + r * 0.22, hy + r * (0.3 + i * 0.2)], [hx + r * 0.58, hy + r * (0.32 + i * 0.2)]], 1.7, markColor, false);
  c.restore();
  // Hair over the crown.
  if (spec.hairStyle !== 'shaved') {
    const cap: P[] = [[hx + r * 0.9, hy - r * 0.42], [hx + r * 0.55, hy - r * 1.04], [hx - r * 0.35, hy - r * 1.14], [hx - r * 1.08, hy - r * 0.38], [hx - r * 1.02, hy + r * 0.42], [hx - r * 0.42, hy + r * 0.05], [hx - r * 0.05, hy - r * 0.5], [hx + r * 0.42, hy - r * 0.52]];
    shape(c, cap, across(c, [hx - r, hy], [hx + r, hy - r * 0.6], r * 2, spec.hair));
    for (let i = 0; i < 3; i++) stroke(c, [[hx - r * 0.6 + i * r * 0.35, hy - r * 0.95 + i * 1.5], [hx - r * 0.85 + i * r * 0.4, hy - r * 0.2 + i * 2]], 1, shade(spec.hair, 0.38), false);
  } else {
    c.save(); c.globalAlpha = 0.3; c.clip(face); oval(c, hx - r * 0.2, hy - r * 0.55, r * 1.05, r * 0.6, spec.hair, false); c.restore();
  }
  if (spec.hairStyle === 'topknot') { oval(c, hx - 4, hy - r - 4, 6, 5.5, spec.hair); stroke(c, [[hx - 8, hy - r - 1], [hx, hy - r - 1]], 2.2, spec.clothAlt); }
  if (spec.head === 'mask-long') {
    shape(c, [[hx - 2, hy - r + 2], [hx + r + 2, hy - 4], [hx + r + 14, hy + 4], [hx + r, hy + 8], [hx, hy + 6]], '#e3d6b6');
    oval(c, hx + r * 0.62, hy - 1, 2, 1.6, OUTLINE, false);
    stroke(c, [[hx + 2, hy + 3], [hx + r + 8, hy + 4]], 1, shade('#e3d6b6', -0.3), false);
  }
  if (spec.head === 'horn-single' || (feature.horns && animal === 'rhino' && stars >= 2)) shape(c, [[hx + 2, hy - r + 2], [hx + r + 6, hy - r - 16], [hx + r - 1, hy - r + 6]], '#d9cdb0');
  if (spec.head === 'horns' || (feature.horns && stars >= 2 && animal !== 'rhino')) {
    const big = spec.head === 'horns' || stars === 3 ? 1 : 0.65;
    for (const side of [-1, 1]) limb(c, [[hx + side * 4, hy - r + 2], [hx + side * 16 * big, hy - r - 8 * big], [hx + side * 22 * big, hy - r - 20 * big]], [5, 3.6, 1.6], stars >= 2 && spec.head !== 'horns' ? spec.accent : '#e3d6b6');
  }
  if (spec.head === 'feathers') for (let i = 0; i < 3; i++) {
    const base: P = [hx - 6 + i * 3, hy - r + 2], tip: P = [hx - 12 + i * 6, hy - r - 18 - i * 3];
    shape(c, [base, tip, [hx - 4 + i * 6, hy - r + 1]], i === 1 ? spec.accent : spec.clothAlt);
    stroke(c, [base, tip], 0.9, shade(i === 1 ? spec.accent : spec.clothAlt, -0.35), false);
  }
  if (spec.head === 'flowers') for (let i = 0; i < 3; i++) {
    const [fx, fy] = [hx - 8 + i * 7, hy - r + 2], color = ['#f2d5e0', '#f4f0c8', '#d8b8f0'][i];
    for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; oval(c, fx + Math.cos(a) * 2.4, fy + Math.sin(a) * 2.4, 1.9, 1.9, color, false); }
    oval(c, fx, fy, 1.2, 1.2, '#e8b84a', false);
  }
  if (spec.head === 'collar') {
    c.globalAlpha = stars >= 2 ? 0.95 : 0.85;
    shape(c, [[hx - r - 10, hy + 14], [hx - r - 6, hy - r - 8], [hx, hy - r - 14], [hx + 6, hy - r - 4], [hx + 2, hy + 14]], stars >= 2 ? shade(spec.accent, -0.2) : spec.clothAlt);
    for (let i = 0; i < 3; i++) oval(c, hx - r - 2 + i * 3, hy - r - 2 + i * 6, 2, 1.4, shade(stars >= 2 ? spec.accent : spec.clothAlt, 0.35), false);
    c.globalAlpha = 1;
    c.strokeStyle = OUTLINE; c.lineWidth = 3; c.stroke(face); c.fillStyle = skinLight; c.fill(face);
    oval(c, hx + r * 0.62, hy, 1.9, 2.1, glow ? spec.accent : '#2a1a10', false);
    stroke(c, [[hx + r * 0.32, hy - r * 0.22], [hx + r * 0.9, hy - r * 0.2]], 2, shade(spec.hair, -0.3), false);
  }
  if (spec.head === 'beard') {
    shape(c, [[hx - 2, hy + 4], [hx + r * 0.78, hy + r * 0.48], [hx + r - 4, hy + 22], [hx + 2, hy + 26]], spec.hair);
    for (let i = 0; i < 3; i++) stroke(c, [[hx + 2 + i * 3, hy + 9], [hx + 3 + i * 3, hy + 22]], 0.9, shade(spec.hair, -0.25), false);
  }

  // Front arm and weapon.
  const elbowF = at(...shoulderF, pose.armF, armLen), handF = at(...elbowF, pose.armF + pose.elbowF, foreLen);
  limb(c, [shoulderF, elbowF, handF], [L * (heavy ? 1.2 : 1.05), L * 0.82, L * 0.64], spec.skin);
  if (heavy) oval(c, shoulderF[0] + 2, shoulderF[1] + 2, L * 0.78, L * 0.72, spec.top === 'armor' ? spec.clothAlt : spec.skin);
  if (spec.top === 'mantle') for (let i = 0; i < 6; i++) oval(c, shoulderB[0] - 4 + i * (w * 0.15 + 1.5), shoulderB[1] - 3 + Math.sin(i * 1.7) * 1.4, 4.2, 3.6, shade(spec.clothAlt, i % 2 ? -0.08 : 0.06));
  band(c, shoulderF, elbowF, 0.5, 0.64, L * 0.95, spec.clothAlt);
  band(c, elbowF, handF, 0.66, 0.84, L * 0.74, spec.clothAlt);
  if (glow) { c.save(); c.globalAlpha = 0.9; c.shadowColor = spec.accent; c.shadowBlur = 6; stroke(c, [lerp(elbowF, handF, 0.15), lerp(elbowF, handF, 0.55)], 2.4, spec.accent, false); c.restore(); }
  paintWeapon(c, spec, handF, handB, pose, clip, stars);
  oval(c, handF[0], handF[1], L * 0.56, L * 0.56, spec.skin);
  stroke(c, [[handF[0] - L * 0.2, handF[1] - L * 0.15], [handF[0] + L * 0.25, handF[1] - L * 0.1]], 1, shade(spec.skin, -0.35), false);
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
