import { BOARD, BOARD_CENTER, cellCenter, COLUMNS, hexCorners, MIDLINE, ROWS } from '../game/board';
import type { Region } from '../game/campaign';

/**
 * The expedition arena seen from the front, in gentle perspective: the near rows (the tribe)
 * are wider and deeper than the far rows (the enemy). Everything that places something on the
 * board — units, tiles, zones, effects — goes through `project`.
 */
type Ctx = CanvasRenderingContext2D;
type Point = [number, number];

const CENTER_X = 620, TOP = 228, ROW_STEP = 58, ROW_GROW = 1.3, UNIT = 150;
const rowPx = (y: number) => TOP + y * ROW_STEP + y * y * ROW_GROW;
const rowDepth = (y: number) => ROW_STEP + 2 * ROW_GROW * y;
/** Horizontal pixels per board unit at depth y. */
export const widthAt = (y: number) => UNIT * rowDepth(y) / rowDepth(BOARD.maxY);
/** Vertical pixels per board unit at depth y. */
export const depthAt = (y: number) => rowDepth(y);
export function project(x: number, y: number): Point { return [CENTER_X + (x - BOARD_CENTER.x) * widthAt(y), rowPx(y)]; }
/** Units shrink a little toward the back rows. */
export function perspectiveScale(screenY: number): number {
  const t = Math.max(0, Math.min(1, (screenY - rowPx(0)) / (rowPx(BOARD.maxY) - rowPx(0))));
  return .86 + .14 * t;
}
/** Screen anchors for effects that cover the whole field. */
export const ARENA_CENTER = { x: CENTER_X, y: rowPx(MIDLINE) };
export const ARENA_SPAN = { left: project(-.5, MIDLINE)[0], right: project(BOARD.maxX + .5, MIDLINE)[0], top: rowPx(0), bottom: rowPx(BOARD.maxY) };
/** The board's outer rim, in board units. */
const RIM = { left: -.85, right: BOARD.maxX + .85, back: -1, front: BOARD.maxY + 1 };
export const ARENA_LABELS = { hostile: project(RIM.right + .1, .2), formation: project(RIM.right + .1, 4.6) };

interface Scenery { sky: [string, string, string]; far: string; trees: string; treesLight: string; ground: [string, string]; tuft: string; mist: string; accent: string; kind: 'pines' | 'river' | 'canopy' | 'savanna' | 'swamp' | 'snow' }
const SCENERY: Scenery[] = [
  { sky: ['#0d1714', '#1d2d25', '#33473a'], far: '#22342b', trees: '#172820', treesLight: '#2b4434', ground: ['#2a382b', '#4a5a3c'], tuft: '#7a8a4f', mist: '#9fb39a', accent: '#e2cf8d', kind: 'pines' },
  { sky: ['#0c1719', '#1b3234', '#2f4f4c'], far: '#1f3a37', trees: '#14292a', treesLight: '#24423c', ground: ['#253832', '#40574a'], tuft: '#6f8d6c', mist: '#a4c7c3', accent: '#a9d4d0', kind: 'river' },
  { sky: ['#0b1510', '#16291b', '#253f27'], far: '#1a301f', trees: '#11221a', treesLight: '#2a4629', ground: ['#22301e', '#3b4e2c'], tuft: '#7f9a4a', mist: '#a7c28c', accent: '#d6e39a', kind: 'canopy' },
  { sky: ['#1c1712', '#4a3826', '#9a7448'], far: '#6a5236', trees: '#2b2419', treesLight: '#4a3e27', ground: ['#5b4a30', '#86724a'], tuft: '#c0a464', mist: '#e8cf98', accent: '#f0d89a', kind: 'savanna' },
  { sky: ['#0a110f', '#17221e', '#26352e'], far: '#18241f', trees: '#0f1915', treesLight: '#1f2e27', ground: ['#1d2822', '#334034'], tuft: '#5f7350', mist: '#9cb5a0', accent: '#9fc0a2', kind: 'swamp' },
  { sky: ['#10171e', '#2c3a46', '#6b7c88'], far: '#5d6c78', trees: '#22303a', treesLight: '#3c4d58', ground: ['#5a6670', '#97a4ad'], tuft: '#dfe9ef', mist: '#e6f0f5', accent: '#eef6fa', kind: 'snow' },
];

function random(seed: number): () => number {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
const css = (color: number, alpha = 1) => `rgba(${color >> 16 & 255},${color >> 8 & 255},${color & 255},${alpha})`;
const mix = (a: number, b: number, t: number) => {
  const ch = (shift: number) => Math.round((a >> shift & 255) * (1 - t) + (b >> shift & 255) * t);
  return ch(16) << 16 | ch(8) << 8 | ch(0);
};
function shape(c: Ctx, points: Point[], fill: string | CanvasGradient, stroke?: string, width = 1): void {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
  c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function stroke(c: Ctx, points: Point[], color: string, width = 1): void {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
}
function oval(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string | CanvasGradient): void {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
}
function glow(c: Ctx, x: number, y: number, radius: number, color: string, sy = 1): void {
  c.save(); c.translate(x, y); c.scale(1, sy);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, radius); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(-radius, -radius, radius * 2, radius * 2); c.restore();
}

function pine(c: Ctx, x: number, base: number, height: number, dark: string, light: string, snow = false): void {
  const w = height * .34;
  stroke(c, [[x, base], [x, base - height * .25]], '#1a1510', Math.max(2, height * .05));
  for (let tier = 0; tier < 4; tier++) {
    const top = base - height + tier * height * .2, bottom = base - height * .2 - (3 - tier) * height * .14, half = w * (.45 + tier * .2);
    shape(c, [[x, top], [x + half, bottom], [x - half, bottom]], dark);
    shape(c, [[x, top], [x - half, bottom], [x - half * .35, bottom - height * .04]], light);
    if (snow) shape(c, [[x, top], [x + half * .45, top + height * .12], [x - half * .5, top + height * .12]], '#e9f2f6');
  }
}
function canopyTree(c: Ctx, rng: () => number, x: number, base: number, height: number, s: Scenery): void {
  stroke(c, [[x, base], [x - 4, base - height * .55]], '#1e1a12', height * .09);
  for (let i = 0; i < 6; i++) {
    const cx = x + (rng() - .5) * height * .55, cy = base - height * (.55 + rng() * .4), r = height * (.16 + rng() * .1);
    oval(c, cx, cy, r, r * .8, i % 2 ? s.trees : s.treesLight);
  }
}
function acacia(c: Ctx, x: number, base: number, height: number, color: string): void {
  stroke(c, [[x, base], [x + 3, base - height * .6], [x - height * .18, base - height * .85]], color, height * .05);
  stroke(c, [[x + 3, base - height * .6], [x + height * .22, base - height * .88]], color, height * .04);
  shape(c, [[x - height * .48, base - height * .82], [x - height * .2, base - height], [x + height * .3, base - height * 1.02], [x + height * .52, base - height * .84], [x + height * .1, base - height * .78]], color);
}
function deadTree(c: Ctx, x: number, base: number, height: number, color: string): void {
  stroke(c, [[x, base], [x + 4, base - height * .5], [x - 6, base - height]], color, height * .06);
  stroke(c, [[x + 3, base - height * .45], [x + height * .3, base - height * .72]], color, height * .035);
  stroke(c, [[x - 2, base - height * .7], [x - height * .25, base - height * .85]], color, height * .03);
}
function rock(c: Ctx, x: number, y: number, size: number, tone: string, light: string): void {
  oval(c, x, y + size * .1, size * 1.05, size * .26, 'rgba(8,12,10,.4)');
  shape(c, [[x - size, y], [x - size * .7, y - size * .55], [x - size * .1, y - size * .78], [x + size * .6, y - size * .5], [x + size * .95, y]], tone);
  shape(c, [[x - size * .7, y - size * .55], [x - size * .1, y - size * .78], [x + size * .05, y - size * .3], [x - size * .45, y - size * .18]], light);
}

/** Paints the full arena backdrop, board included, for one region. */
export function paintArena(c: Ctx, region: Region): void {
  const s = SCENERY[region.id - 1] ?? SCENERY[0], palette = region.palette, rng = random(region.id * 977 + 13);
  const W = c.canvas.width, H = c.canvas.height, horizon = 176;

  // Sky and distant ridge.
  let g = c.createLinearGradient(0, 0, 0, horizon + 30);
  g.addColorStop(0, s.sky[0]); g.addColorStop(.6, s.sky[1]); g.addColorStop(1, s.sky[2]);
  c.fillStyle = g; c.fillRect(0, 0, W, horizon + 30);
  if (s.kind === 'savanna') glow(c, 880, horizon - 50, 120, 'rgba(255,214,150,.35)');
  const ridge: Point[] = [[0, horizon + 10]];
  for (let x = 0; x <= W; x += 40) ridge.push([x, horizon - 28 - (s.kind === 'snow' ? 70 : 30) * Math.abs(Math.sin(x * .006 + region.id)) - rng() * 14]);
  ridge.push([W, horizon + 10]);
  shape(c, ridge, s.far);
  if (s.kind === 'snow') for (let i = 1; i < ridge.length - 2; i++) {
    const [x, y] = ridge[i];
    if (y < horizon - 70) shape(c, [[x, y], [x + 18, y + 16], [x - 16, y + 18]], '#dfe8ee');
  }

  // Tree line along the horizon.
  for (let layer = 0; layer < 2; layer++) {
    for (let x = -20; x < W + 40; x += 26 + rng() * 22) {
      const base = horizon + 14 + layer * 16 + rng() * 6, height = (layer ? 70 : 52) + rng() * 46;
      if (s.kind === 'savanna') { if (rng() < .22) acacia(c, x, base, height * .8, layer ? s.trees : s.far); continue; }
      if (s.kind === 'swamp' && rng() < .35) { deadTree(c, x, base, height, layer ? s.trees : s.far); continue; }
      if (s.kind === 'canopy') canopyTree(c, rng, x, base, height * 1.25, s);
      else pine(c, x, base, height, layer ? s.trees : s.far, layer ? s.treesLight : s.trees, s.kind === 'snow');
    }
  }

  // Ground, horizon mist and texture.
  g = c.createLinearGradient(0, horizon + 20, 0, H);
  g.addColorStop(0, s.ground[0]); g.addColorStop(1, s.ground[1]);
  c.fillStyle = g; c.fillRect(0, horizon + 20, W, H - horizon - 20);
  g = c.createLinearGradient(0, horizon - 10, 0, horizon + 70);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.45, s.mist + '40'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, horizon - 10, W, 80);
  if (s.kind === 'river' || s.kind === 'swamp') {
    const water = s.kind === 'river' ? '#2c5552' : '#1d2f2a';
    shape(c, [[0, horizon + 34], [W, horizon + 26], [W, horizon + 58], [0, horizon + 66]], water);
    for (let i = 0; i < 28; i++) { const x = rng() * W, y = horizon + 36 + rng() * 26; stroke(c, [[x, y], [x + 18 + rng() * 30, y]], s.mist + '55', 1.2); }
    if (s.kind === 'swamp') for (const [x, y, r] of [[120, 560, 90], [1090, 520, 110], [180, 340, 60], [1040, 300, 70]] as [number, number, number][]) {
      oval(c, x, y, r, r * .3, '#162621');
      for (let i = 0; i < 4; i++) oval(c, x - r * .5 + rng() * r, y - r * .1 + rng() * r * .2, 7, 3, '#4f6b49');
    }
  }
  for (let i = 0; i < 420; i++) {
    const y = horizon + 30 + Math.pow(rng(), .7) * (H - horizon - 30), x = rng() * W, near = (y - horizon) / (H - horizon);
    const h = 2 + near * 7;
    if (s.kind === 'snow') { oval(c, x, y, 1 + near * 2, .6 + near, 'rgba(240,248,252,.5)'); continue; }
    stroke(c, [[x, y], [x - h * .3, y - h]], s.tuft + '66', 1); stroke(c, [[x, y], [x + h * .25, y - h * .9]], s.tuft + '55', 1);
  }

  // Shadow and the raised platform.
  glow(c, CENTER_X, rowPx(MIDLINE) + 30, 470, 'rgba(5,9,7,.55)', .48);
  const rim = [project(RIM.left, RIM.back), project(RIM.right, RIM.back), project(RIM.right, RIM.front), project(RIM.left, RIM.front)];
  const thickness = 24;
  const [fl, fr] = [rim[3], rim[2]];
  shape(c, [fl, fr, [fr[0] - 6, fr[1] + thickness], [fl[0] + 6, fl[1] + thickness]], '#211d16');
  for (let i = 1; i < 14; i++) { const x = fl[0] + (fr[0] - fl[0]) * i / 14; stroke(c, [[x, fl[1] + 3], [x + (i % 2 ? 2 : -2), fl[1] + thickness - 3]], 'rgba(0,0,0,.35)', 2); }
  stroke(c, [[fl[0] + 4, fl[1] + 2], [fr[0] - 4, fr[1] + 2]], 'rgba(255,240,200,.12)', 2);
  g = c.createLinearGradient(0, rim[0][1], 0, rim[3][1]);
  g.addColorStop(0, css(mix(palette.floor, 0x15120d, .62))); g.addColorStop(1, css(mix(palette.ally, 0x15120d, .5)));
  shape(c, rim, g, css(palette.line, .35), 2);
  // Stones along the rim.
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    for (const y of [RIM.back + .12, RIM.front - .12]) {
      const [x, py] = project(RIM.left + .12 + (RIM.right - RIM.left - .24) * t, y);
      oval(c, x, py, 5 + rng() * 3, 2.5 + rng(), 'rgba(205,190,150,.18)');
    }
  }

  // The hexes: warm for the enemy half, green for the tribe, bevelled like carved stone.
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLUMNS; col++) {
    const enemy = row < 3, base = enemy ? ((col + row) % 2 ? palette.floor : palette.floorAlt) : ((col + row) % 2 ? palette.ally : palette.allyAlt);
    const corners = hexCorners(cellCenter(col, row), .93).map(p => project(p.x, p.y));
    const tone = mix(base, 0x000000, rng() * .08);
    g = c.createLinearGradient(0, corners[4][1], 0, corners[1][1]);
    g.addColorStop(0, css(mix(tone, 0xfff4d6, .12))); g.addColorStop(1, css(mix(tone, 0x0b0a08, .12)));
    shape(c, corners, g);
    stroke(c, [corners[2], corners[3], corners[4], corners[5], corners[0]], 'rgba(255,244,214,.22)', 1.5);
    stroke(c, [corners[0], corners[1], corners[2]], 'rgba(10,10,6,.38)', 2);
    const [cx, cy] = project(cellCenter(col, row).x, cellCenter(col, row).y);
    oval(c, cx, cy, 10 * widthAt(row) / UNIT, 4 * widthAt(row) / UNIT, enemy ? 'rgba(60,30,20,.12)' : 'rgba(20,40,20,.12)');
  }

  // The meeting line follows the hex edges between the two fronts.
  const seam: Point[] = [];
  for (let col = 0; col < COLUMNS; col++) {
    const corners = hexCorners(cellCenter(col, 2)).map(p => project(p.x, p.y));
    seam.push(corners[2], corners[1], corners[0]);
  }
  stroke(c, seam, css(palette.line, .25), 6);
  stroke(c, seam, s.accent + 'cc', 2);

  // Carved totem posts mark both ends of the line.
  for (const side of [RIM.left - .05, RIM.right + .05]) {
    const [x, y] = project(side, MIDLINE);
    oval(c, x, y + 4, 16, 5, 'rgba(0,0,0,.35)');
    shape(c, [[x - 9, y + 2], [x - 8, y - 78], [x + 8, y - 78], [x + 9, y + 2]], '#4d3a26', '#2a1f14', 2);
    for (let k = 0; k < 3; k++) { const ky = y - 18 - k * 22; shape(c, [[x - 10, ky], [x, ky - 10], [x + 10, ky], [x, ky + 6]], k === 1 ? '#a0583a' : '#c9a66b'); oval(c, x, ky - 2, 2, 2, '#1d150d'); }
    shape(c, [[x - 15, y - 76], [x, y - 92], [x + 15, y - 76]], '#6b4d2f');
    glow(c, x, y - 96, 26, s.accent + '88');
    oval(c, x, y - 96, 4, 5, '#ffe9b0');
  }

  // Foreground frame: rocks and the region's trees at the edges.
  for (const [x, y, size] of [[70, 700, 64], [1140, 690, 72], [210, 300, 30], [1010, 280, 26], [150, 470, 38], [1080, 470, 42]] as [number, number, number][]) {
    rock(c, x, y, size, s.kind === 'snow' ? '#7d8a94' : '#4f5446', s.kind === 'snow' ? '#e2ebf0' : '#787a62');
  }
  for (const [x, y, h] of [[40, 430, 230], [1165, 420, 240], [110, 320, 150], [1100, 310, 160]] as [number, number, number][]) {
    if (s.kind === 'savanna') acacia(c, x, y, h * .7, '#2c2416');
    else if (s.kind === 'swamp') deadTree(c, x, y, h * .8, '#121b17');
    else if (s.kind === 'canopy') canopyTree(c, rng, x, y, h, s);
    else pine(c, x, y, h, s.trees, s.treesLight, s.kind === 'snow');
  }

  // Vignette keeps the eye on the board.
  g = c.createRadialGradient(CENTER_X, rowPx(MIDLINE), 260, CENTER_X, rowPx(MIDLINE), 760);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(4,7,6,.5)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
