import Phaser from 'phaser';
import type { BuildingId, Game } from '../game/simulation';
import { characters } from '../data/characters';
import { animationSheets, sheetKey } from './animationAssets';
import { advanceMotion, createMotion, frameForMotion, poseForMotion, triggerMotion, type MotionClip, type MotionState } from './animationModel';
import { CombatEffects } from './CombatEffects';

type View = 'village' | 'battle';
type Ctx = CanvasRenderingContext2D;
type Point = [number, number];
type Entity = NonNullable<Game['battle']>['entities'][number];
type Callbacks = { onBuilding: (id: BuildingId) => void; onSlot: (slot: number) => void };
type UnitView = { sprite: Phaser.GameObjects.Sprite; bars: Phaser.GameObjects.Graphics; name: Phaser.GameObjects.Text; ring: Phaser.GameObjects.Ellipse; baseTexture: string; desiredHeight: number; characterId: number; stars: number; motion: MotionState; x: number; y: number; lastHp: number; enemy: boolean };
type Villager = { uid: string; view: UnitView; phase: number; work: BuildingId; lastWork: number };

const W = 1200;
const H = 740;
const BUILDINGS: { id: BuildingId; name: string; x: number; y: number; icon: string }[] = [
  { id: 'lumber', name: 'BOSQUE DOS COLETORES', x: 390, y: 329, icon: '↟' },
  { id: 'hunt', name: 'ACAMPAMENTO DE CAÇA', x: 797, y: 337, icon: '⌁' },
  { id: 'quarry', name: 'PEDREIRA ANCESTRAL', x: 838, y: 494, icon: '◇' },
  { id: 'shrine', name: 'CÍRCULO DOS ESPÍRITOS', x: 398, y: 493, icon: '✦' },
];

function random(seed: number): () => number {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
function polygon(c: Ctx, p: Point[], fill: string | CanvasGradient, stroke?: string, width = 1): void {
  c.beginPath(); p.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
  c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function ellipse(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string): void {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
}
function line(c: Ctx, points: Point[], color: string, width = 1): void {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
}
function glow(c: Ctx, x: number, y: number, radius: number, color: string): void {
  const g = c.createRadialGradient(x, y, 0, x, y, radius); g.addColorStop(0, color); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}
function iso(x: number, y: number): Point { return [672 + (x - y) * 73, 245 + (x + y) * 36]; }

/** Presentation only: the caller owns the simulation clock, saves and all game rules. */
export function createWorld(parent: HTMLElement, game: Game, callbacks: Callbacks): { setView(view: View): void; destroy(): void } {
  let requestedView: View = 'village';
  let scene: WorldScene | undefined;

  class WorldScene extends Phaser.Scene {
    private village!: Phaser.GameObjects.Layer;
    private battlefield!: Phaser.GameObjects.Layer;
    private villageActors: Villager[] = [];
    private villageRoster = '';
    private scenery: { object: Phaser.GameObjects.Image; angle: number; phase: number }[] = [];
    private clock = 0;
    private paused = false;
    private previousLevels = { ...game.state.buildings };
    private effects!: CombatEffects;
    private labels = new Map<BuildingId, Phaser.GameObjects.Text>();
    private units = new Map<string, UnitView>();
    private seenEvents = new Set<number>();
    private loadingArt = new Set<string>();
    private fire!: Phaser.GameObjects.Graphics;
    private ambience!: Phaser.GameObjects.Graphics;
    private floorHover!: Phaser.GameObjects.Graphics;
    private stars: { x: number; y: number; phase: number; speed: number }[] = [];
    private activeView: View = 'village';
    private lastFormation = '';
    private floating: Phaser.GameObjects.GameObject[] = [];
    private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    constructor() { super({ key: 'WolfTotemWorld' }); }

    preload(): void {
      for (const character of characters) {
        if (character.art) this.load.image(`hero-${character.id}`, `/chars/${character.art}-1star.png`);
      }
      for (const sheet of animationSheets.values()) {
        this.load.image(sheetKey(sheet.characterId), sheet.image);
      }
    }

    create(): void {
      scene = this;
      for (const sheet of animationSheets.values()) {
        const texture = this.textures.get(sheetKey(sheet.characterId));
        if (!this.textures.exists(sheetKey(sheet.characterId))) continue;
        for (let i = 0; i < sheet.columns * sheet.rows; i++) {
          const rect = sheet.frameRects?.[i] ?? { x: i % sheet.columns * sheet.frameWidth, y: Math.floor(i / sheet.columns) * sheet.frameHeight, width: sheet.frameWidth, height: sheet.frameHeight };
          texture.add(i, 0, rect.x, rect.y, rect.width, rect.height);
        }
      }
      this.cameras.main.setBackgroundColor('#111a17');
      this.paint('land', W, H, (c) => this.paintLandscape(c));
      this.add.image(0, 0, 'land').setOrigin(0).setDepth(-1000);
      this.village = this.add.layer().setDepth(0);
      this.battlefield = this.add.layer().setDepth(1).setVisible(false);
      this.createVillage();
      this.createBattlefield();
      this.effects = new CombatEffects(this, this.battlefield, this.reducedMotion);
      this.ambience = this.add.graphics().setDepth(1200);
      const rng = random(91);
      this.stars = Array.from({ length: 22 }, () => ({ x: 140 + rng() * 920, y: 170 + rng() * 405, phase: rng() * 6.28, speed: .3 + rng() * .6 }));
      this.setWorldView(requestedView);
      this.game.canvas.setAttribute('aria-label', 'Vila ancestral interativa. Selecione construções para melhorar a produção ou organize os heróis na expedição.');
      this.game.canvas.setAttribute('role', 'img');
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.tweens.killAll(); this.units.clear(); this.labels.clear(); this.seenEvents.clear();
      });
    }

    private paint(key: string, width: number, height: number, draw: (c: Ctx) => void): void {
      const texture = this.textures.createCanvas(key, width, height);
      if (!texture) return;
      draw(texture.context); texture.refresh();
    }

    private paintLandscape(c: Ctx): void {
      const rng = random(4791);
      const bg = c.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#1d2a23'); bg.addColorStop(.5, '#182820'); bg.addColorStop(1, '#101e1e');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      glow(c, 470, 190, 500, '#9c93531a');
      // Deep forest silhouettes dissolve into the mist behind the clearing.
      for (let i = 0; i < 75; i++) {
        const x = rng() * W, y = 90 + rng() * 190, h = 40 + rng() * 110;
        const shade = i % 3 ? '#22352a' : '#293d2e';
        polygon(c, [[x, y - h], [x - h * .24, y - h * .34], [x - h * .15, y - h * .34], [x - h * .35, y], [x + h * .32, y], [x + h * .13, y - h * .34], [x + h * .22, y - h * .34]], shade);
      }
      const mist = c.createLinearGradient(0, 90, 0, 330);
      mist.addColorStop(0, '#b8bda707'); mist.addColorStop(1, '#142b2400'); c.fillStyle = mist; c.fillRect(0, 90, W, 260);
      // River, ripples and submerged stone shelves.
      polygon(c, [[1030, 230], [1200, 300], [1200, 740], [280, 740], [541, 579], [909, 416]], '#213e3b');
      const water = c.createLinearGradient(0, 360, 1200, 710); water.addColorStop(0, '#335446'); water.addColorStop(1, '#142f31');
      polygon(c, [[1150, 337], [1200, 360], [1200, 740], [430, 740], [670, 582]], water);
      for (let i = 0; i < 135; i++) {
        const x = rng() * W, y = 370 + rng() * 370;
        line(c, [[x, y], [x + 5 + rng() * 41, y - 1]], i % 4 ? '#82a7970d' : '#bcd1af20', 1);
      }
      ellipse(c, 627, 518, 516, 162, '#0a15176b');
      const edge: Point[] = [[77, 361], [299, 230], [590, 132], [849, 230], [1127, 363], [875, 534], [599, 648], [313, 530]];
      polygon(c, edge.map(([x, y]) => [x, y + 33]), '#283b34', '#385047', 2);
      polygon(c, [[77, 361], [313, 530], [599, 648], [599, 680], [313, 563], [77, 389]], '#3a493b');
      polygon(c, [[599, 648], [875, 534], [1127, 363], [1127, 393], [875, 565], [599, 680]], '#273d35');
      for (let i = 0; i < 24; i++) {
        const t = i / 24, x = 79 + t * 518, y = 363 + t * 285;
        polygon(c, [[x, y + 8], [x + 18, y + 18], [x + 14, y + 35], [x - 5, y + 23]], i % 3 ? '#455241' : '#566047');
      }
      polygon(c, edge, '#667251', '#849071', 3);
      polygon(c, [[93, 360], [309, 239], [591, 142], [840, 237], [1111, 363], [866, 525], [596, 637], [321, 521]], '#697451');
      // Soil color subtly changes across the sunny clearing.
      c.save(); c.beginPath(); edge.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.clip();
      glow(c, 547, 352, 360, '#c2b36d47'); glow(c, 979, 440, 240, '#204f3c45');
      for (let i = 0; i < 4700; i++) {
        const x = 70 + rng() * 1060, y = 130 + rng() * 520;
        c.fillStyle = ['#c1bd7f13', '#2c4a2e15', '#d1c58f13'][i % 3];
        c.fillRect(x, y, 1 + rng() * 3, .7 + rng() * 1.3);
      }
      // Branching paths connect the actual places the player can improve.
      const paths: Point[][] = [
        [[362, 318], [456, 369], [593, 412], [669, 463], [655, 558], [596, 630]],
        [[586, 415], [678, 358], [790, 335]],
        [[645, 447], [732, 473], [851, 493]],
        [[586, 414], [521, 447], [405, 485]],
        [[576, 397], [578, 304], [648, 259]],
      ];
      for (const p of paths) { line(c, p, '#52604680', 40); line(c, p, '#a49a6e', 29); line(c, p, '#b3a579', 22); }
      ellipse(c, 591, 411, 82, 42, '#ac9e71');
      for (let i = 0; i < 550; i++) {
        const x = 90 + rng() * 1020, y = 155 + rng() * 470;
        if (Math.abs(x - 600) < 180 && y > 320 && y < 480) continue;
        if (rng() < .3) {
          line(c, [[x, y], [x - 2, y - 3]], '#4b633b88', 1); line(c, [[x, y], [x + 3, y - 4]], '#a1a67466', 1);
        } else ellipse(c, x, y, .9 + rng() * 1.9, .7, '#d0c79b55');
      }
      c.restore();
      // Thin light on the grassy edge helps the map read as physical terrain.
      line(c, [[93, 360], [319, 520], [596, 638], [866, 525]], '#adb18066', 2);
      for (let i = 0; i < 22; i++) {
        const t = i / 22, x = 627 + t * 474, y = 644 - t * 249;
        ellipse(c, x + 20, y + 40, 5 + rng() * 13, 3 + rng() * 3, '#8faaa51b');
      }
      // A wooden footbridge meets the near river bank.
      polygon(c, [[556, 645], [594, 630], [661, 703], [625, 722]], '#302f24');
      for (let i = 0; i < 9; i++) {
        const t = i / 9; line(c, [[559 + t * 66, 644 + t * 76], [592 + t * 65, 633 + t * 73]], i % 2 ? '#8a7950' : '#a28a5b', 7);
      }
      for (const [x, y] of [[555, 645], [594, 631], [627, 718], [662, 702]]) {
        line(c, [[x, y], [x, y - 25]], '#5b4d35', 5); ellipse(c, x, y - 25, 3, 2, '#bb9c61');
      }
      line(c, [[555, 621], [627, 693]], '#b8a27c', 2); line(c, [[594, 607], [662, 677]], '#b8a27c', 2);
    }

    private createVillage(): void {
      const rng = random(412);
      for (let i = 0; i < 5; i++) this.paint(`tree-${i}`, 172, 213, c => this.paintTree(c, i));
      this.paint('rock', 106, 72, c => this.paintRocks(c));
      this.paint('hut-lumber', 248, 225, c => this.paintHut(c, false));
      this.paint('hut-hunt', 248, 225, c => this.paintHut(c, true));
      this.paint('shrine', 210, 183, c => this.paintShrine(c));
      this.paint('quarry', 230, 175, c => this.paintQuarry(c));
      this.paint('totem', 170, 198, c => this.paintTotem(c));
      this.paint('logs', 105, 65, c => this.paintLogs(c));
      this.paint('tent', 160, 148, c => this.paintTent(c));

      const groves: Point[] = [
        [247, 300], [290, 268], [352, 247], [418, 220], [490, 202], [551, 193], [618, 194], [692, 213], [738, 232],
        [846, 272], [899, 297], [957, 330], [995, 374], [952, 413], [987, 409],
        [210, 350], [225, 388], [274, 417], [301, 445], [267, 362], [877, 533], [777, 568],
        [504, 583], [428, 556], [467, 570], [652, 575], [723, 582],
      ];
      groves.forEach(([x, y], i) => {
        const tree = this.add.image(x, y, `tree-${i % 5}`).setOrigin(.5, 1).setScale(.65 + rng() * .26).setDepth(y);
        this.village.add(tree);
        this.scenery.push({ object: tree, angle: .5 + rng() * .5, phase: rng() * 6.28 });
      });
      const objects = [
        { key: 'hut-lumber', x: 390, y: 329, scale: .91 },
        { key: 'hut-hunt', x: 797, y: 337, scale: .92 },
        { key: 'shrine', x: 398, y: 493, scale: .96 },
        { key: 'quarry', x: 838, y: 494, scale: .97 },
        { key: 'totem', x: 610, y: 410, scale: .93 },
        { key: 'logs', x: 308, y: 350, scale: .85 },
        { key: 'logs', x: 455, y: 326, scale: .65 },
        { key: 'tent', x: 640, y: 271, scale: .62 },
        { key: 'tent', x: 746, y: 425, scale: .50 },
        { key: 'rock', x: 970, y: 448, scale: .74 },
        { key: 'rock', x: 187, y: 368, scale: .79 },
        { key: 'rock', x: 698, y: 606, scale: .6 },
      ];
      objects.forEach(o => this.village.add(this.add.image(o.x, o.y, o.key).setOrigin(.5, 1).setScale(o.scale).setDepth(o.y)));

      for (const b of BUILDINGS) {
        const ring = this.add.ellipse(b.x, b.y - 8, 156, 67).setStrokeStyle(1.5, 0xe9c47c, 0).setDepth(b.y - 1);
        this.village.add(ring);
        const zone = this.add.zone(b.x, b.y - 58, 179, 135).setInteractive({ useHandCursor: true }).setDepth(b.y + 300);
        zone.on('pointerover', () => { ring.setStrokeStyle(1.5, 0xe9c47c, .7); badge.setColor('#f6db9a'); });
        zone.on('pointerout', () => { ring.setStrokeStyle(1.5, 0xe9c47c, 0); badge.setColor('#e8ddba'); });
        zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if (pointer.event.target !== this.game.canvas || game.state.paused) return;
          callbacks.onBuilding(b.id); this.pulse(b.x, b.y - 7, 0xe2bd79, this.village);
        });
        this.village.add(zone);
        const bg = this.add.rectangle(b.x, b.y + 17, 193, 24, 0x1d2920, .9).setStrokeStyle(1, 0xc5b481, .27).setDepth(1000);
        const badge = this.add.text(b.x, b.y + 17, `${b.icon}  ${b.name}`, { fontFamily: 'Georgia, serif', fontSize: '10px', color: '#e8ddba', letterSpacing: .8 }).setOrigin(.5).setDepth(1001);
        const level = this.add.text(b.x, b.y + 36, '', { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#bbc29d' }).setOrigin(.5).setDepth(1001);
        this.village.add([bg, badge, level]); this.labels.set(b.id, level);
      }
      this.syncVillageRoster();
      this.fire = this.add.graphics().setDepth(465); this.village.add(this.fire);
      // Small flag claims the center, leaving the place itself as the hero of the screen.
      const centerTitle = this.add.text(610, 429, 'TOTEM DO LOBO', { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#f4dda1', letterSpacing: 1.8 }).setOrigin(.5).setDepth(1001);
      this.village.add(centerTitle);
    }

    private paintTree(c: Ctx, variant: number): void {
      const rng = random(51 + variant * 47), pine = variant % 3 !== 1;
      ellipse(c, 88, 197, 43, 12, '#182a2263');
      polygon(c, [[77, 199], [82, 102], [91, 89], [96, 198], [88, 205]], '#514d32');
      polygon(c, [[83, 195], [87, 103], [91, 195]], '#8a7650');
      line(c, [[79, 193], [69, 202]], '#484630', 3); line(c, [[96, 194], [107, 200]], '#4c4b31', 3);
      if (pine) {
        for (let tier = 0; tier < 5; tier++) {
          const top = 111 - tier * 19, bottom = 177 - tier * 26, width = 66 - tier * 11;
          const p: Point[] = [[88, top - 37]];
          for (let j = 0; j < 7; j++) p.push([88 - width + j * width / 3, bottom + (j % 2 ? 2 : -5) + rng() * 5]);
          polygon(c, p, ['#314b35', '#3a583b', '#435f3d', '#536d44', '#667e4e'][tier]);
          polygon(c, [[88, top - 37], [88 - width, bottom - 5], [79, bottom - 15]], ['#506344', '#5b714a', '#698052', '#75885a', '#819262'][tier]);
          line(c, [[88 - width + 7, bottom - 4], [78, bottom - 13]], '#a8b57627', 1);
        }
      } else {
        line(c, [[87, 152], [44, 98]], '#665b37', 8); line(c, [[88, 127], [124, 76]], '#635b38', 7);
        const clusters: Point[] = [[51, 106], [110, 111], [128, 74], [72, 59], [49, 66], [91, 89], [89, 43]];
        clusters.forEach(([x, y], i) => {
          const r = 29 + rng() * 12, points: Point[] = [];
          for (let j = 0; j < 11; j++) { const a = j * Math.PI * 2 / 11, s = r * (.84 + rng() * .18); points.push([x + Math.cos(a) * s, y + Math.sin(a) * s * .76]); }
          polygon(c, points, ['#425c3b', '#4a643f', '#597246', '#6c8150', '#657a4b', '#6a8150', '#82905a'][i]);
          for (let j = 0; j < 14; j++) { const px = x - 24 + rng() * 44, py = y - 16 + rng() * 30; ellipse(c, px, py, 3.5, 1.8, '#c1c88815'); }
        });
      }
      for (let i = 0; i < 6; i++) { const x = 69 + rng() * 37; line(c, [[x, 202], [x - 2, 194 - rng() * 4]], '#7e8952', 1); }
    }

    private paintHut(c: Ctx, hunting: boolean): void {
      ellipse(c, 122, 204, 107, 19, '#19261e63');
      polygon(c, [[55, 146], [127, 169], [196, 143], [195, 192], [126, 221], [53, 194]], '#68513b', '#473f2d', 2);
      polygon(c, [[55, 146], [127, 169], [127, 219], [54, 193]], '#a18659');
      for (let i = 0; i < 9; i++) { const x = 59 + i * 7.5; line(c, [[x, 149 + i * 2.5], [x, 193 + i * 2.9]], i % 2 ? '#7c6547' : '#bba271', 3); }
      for (let i = 0; i < 8; i++) { const x = 133 + i * 8; line(c, [[x, 171 - i * 3], [x, 216 - i * 3.6]], '#92774f', 4); }
      polygon(c, [[143, 176], [169, 165], [169, 204], [143, 215]], '#252d23');
      polygon(c, [[149, 180], [165, 173], [165, 202], [149, 209]], '#161e19');
      line(c, [[139, 175], [170, 163], [173, 206]], '#b79a6a', 4);
      polygon(c, [[45, 142], [120, 54], [212, 135], [129, 174]], hunting ? '#a49466' : '#bba36d', '#66583c', 3);
      polygon(c, [[45, 142], [120, 54], [129, 174]], hunting ? '#c5b57b' : '#dcc187');
      polygon(c, [[120, 54], [212, 135], [129, 174]], hunting ? '#a4915a' : '#b5985f');
      const rng = random(hunting ? 92 : 24);
      for (let i = 0; i < 70; i++) {
        const t = i / 70;
        line(c, [[120 - t * 73, 61 + t * 82], [130 - t * 77, 169 - t * 24]], i % 3 ? '#8e794733' : '#fff0b256', 1.3);
        line(c, [[122 + t * 86, 59 + t * 75], [130 + t * 80, 172 - t * 34]], i % 3 ? '#7761393b' : '#f5d89448', 1.5);
      }
      for (let i = 0; i < 26; i++) {
        const t = i / 26; line(c, [[47 + t * 82, 144 + t * 29], [46 + t * 82, 148 + t * 29 + rng() * 5]], '#e0c385', 2);
        line(c, [[129 + t * 82, 173 - t * 37], [129 + t * 82, 179 - t * 37]], '#af935b', 2);
      }
      line(c, [[119, 51], [129, 174]], '#ebd19788', 2);
      line(c, [[47, 143], [55, 201]], '#695335', 5); line(c, [[130, 173], [130, 224]], '#725738', 5); line(c, [[205, 139], [196, 198]], '#725738', 5);
      line(c, [[44, 154], [52, 156]], '#d0b579', 2); line(c, [[126, 182], [133, 183]], '#d0b579', 2);
      ellipse(c, 101, 187, 8, 10, '#3e3826'); line(c, [[93, 187], [109, 191]], '#cbb48a', 2);
      if (hunting) {
        line(c, [[189, 200], [231, 123]], '#9d8b5e', 4); line(c, [[218, 211], [185, 124]], '#a28f5e', 4);
        line(c, [[190, 135], [223, 140]], '#d6c592', 3);
        polygon(c, [[194, 139], [218, 141], [217, 166], [209, 178], [198, 167]], '#b38351');
        ellipse(c, 203, 151, 4, 7, '#654631');
        line(c, [[180, 107], [181, 91], [187, 84]], '#e7d7ae', 3); line(c, [[181, 95], [172, 85]], '#e7d7ae', 2);
      } else {
        line(c, [[33, 199], [39, 167]], '#766547', 4); line(c, [[32, 166], [49, 172]], '#a6b1a3', 6);
        ellipse(c, 29, 203, 13, 6, '#685a3c'); ellipse(c, 29, 200, 13, 5, '#c5a87b');
      }
      for (let i = 0; i < 7; i++) { const x = 61 + i * 20; ellipse(c, x, 212 - Math.abs(125 - x) * .22, 7, 4, '#919080'); }
    }

    private paintShrine(c: Ctx): void {
      ellipse(c, 105, 160, 91, 21, '#1c2e2466');
      ellipse(c, 105, 150, 78, 27, '#92916f'); ellipse(c, 105, 146, 69, 23, '#c1b58a');
      ellipse(c, 105, 144, 46, 16, '#8a8f6e');
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, x = 105 + Math.cos(a) * 63, y = 145 + Math.sin(a) * 21;
        polygon(c, [[x - 9, y], [x - 8, y - 15], [x + 1, y - 23], [x + 11, y - 17], [x + 12, y - 2], [x + 3, y + 4]], '#7f8776', '#aaa993', 1);
      }
      polygon(c, [[72, 139], [73, 54], [85, 42], [96, 52], [96, 147]], '#6c7769');
      polygon(c, [[119, 146], [119, 56], [133, 42], [144, 57], [144, 138]], '#818a74');
      polygon(c, [[68, 59], [76, 34], [135, 32], [151, 55], [126, 66], [88, 66]], '#a0a28a', '#626c5b', 2);
      polygon(c, [[76, 34], [135, 32], [144, 40], [85, 47]], '#c0bda1');
      line(c, [[79, 77], [85, 89], [78, 99], [85, 113]], '#c6d8ad', 2); line(c, [[133, 73], [126, 87], [133, 101]], '#d4dcba', 2);
      glow(c, 109, 117, 47, '#c4e59d3c');
      ellipse(c, 108, 132, 18, 8, '#527956');
      polygon(c, [[108, 87], [121, 115], [110, 133], [99, 115]], '#bcdda6', '#e7efc0', 1.3);
      polygon(c, [[108, 87], [111, 118], [99, 115]], '#ecf3c6');
      line(c, [[79, 66], [64, 80], [48, 75], [30, 90]], '#615b36', 1);
      for (const [x, y] of [[64, 82], [48, 78], [32, 88]]) polygon(c, [[x - 4, y], [x + 4, y], [x + 2, y + 12]], '#b5a16c');
    }

    private paintQuarry(c: Ctx): void {
      ellipse(c, 115, 149, 106, 23, '#1c2c2363');
      polygon(c, [[18, 128], [29, 78], [69, 57], [97, 76], [129, 112], [116, 148], [62, 161]], '#727c74', '#5d695e', 2);
      polygon(c, [[29, 78], [69, 57], [97, 76], [69, 114], [18, 128]], '#a4a798');
      polygon(c, [[69, 114], [97, 76], [129, 112], [116, 148], [62, 161]], '#7a877b');
      polygon(c, [[113, 129], [121, 95], [153, 65], [183, 85], [205, 131], [171, 152]], '#768078');
      polygon(c, [[121, 95], [153, 65], [183, 85], [161, 107]], '#b2b5a0');
      polygon(c, [[121, 95], [161, 107], [171, 152], [113, 129]], '#939b8b');
      line(c, [[77, 68], [66, 93], [76, 105], [69, 128]], '#53665c', 2); line(c, [[175, 89], [166, 113], [186, 129]], '#53665c', 2);
      line(c, [[72, 78], [66, 93], [71, 100]], '#cfd0b755', 1);
      for (let i = 0; i < 9; i++) { const x = 57 + i * 15, y = 149 + Math.sin(i) * 12; polygon(c, [[x - 9, y], [x - 5, y - 10], [x + 5, y - 12], [x + 10, y - 3], [x + 4, y + 4]], '#9a9f8d'); }
      line(c, [[143, 165], [179, 116]], '#ac8c56', 5); line(c, [[164, 112], [193, 127]], '#d3d0b4', 5);
      polygon(c, [[18, 127], [40, 132], [38, 145], [19, 141]], '#8a7551');
      line(c, [[22, 127], [25, 114], [37, 118], [37, 131]], '#a38c63', 2);
    }

    private paintTotem(c: Ctx): void {
      ellipse(c, 84, 179, 67, 17, '#2e352568');
      ellipse(c, 84, 174, 57, 17, '#877a53');
      for (let i = 0; i < 9; i++) {
        const a = i * Math.PI * 2 / 9, x = 85 + Math.cos(a) * 49, y = 172 + Math.sin(a) * 13;
        polygon(c, [[x - 9, y], [x - 6, y - 7], [x + 4, y - 9], [x + 9, y - 3], [x + 7, y + 3]], '#b2ac87', '#70785e', 1);
      }
      polygon(c, [[65, 169], [67, 59], [103, 54], [108, 168], [87, 181]], '#725437');
      polygon(c, [[65, 169], [67, 59], [82, 60], [82, 178]], '#a28252');
      line(c, [[74, 74], [72, 158]], '#c7a66c66', 2); line(c, [[98, 90], [101, 159]], '#382e2166', 2);
      for (const y of [108, 128, 152]) { line(c, [[67, y], [85, y + 6], [105, y - 2]], '#d1b88d', 3); }
      polygon(c, [[55, 51], [49, 11], [73, 31], [90, 25], [116, 7], [115, 48], [130, 62], [108, 85], [84, 104], [63, 82], [43, 63]], '#858f7e', '#414e40', 2);
      polygon(c, [[49, 11], [58, 48], [76, 52], [72, 31]], '#b7bd9d');
      polygon(c, [[90, 25], [116, 7], [109, 45], [96, 48]], '#a7b395');
      polygon(c, [[47, 59], [75, 49], [83, 75], [68, 86]], '#b4b99c');
      polygon(c, [[96, 48], [125, 62], [103, 84], [83, 75]], '#7c8e76');
      polygon(c, [[82, 60], [95, 77], [84, 101], [74, 79]], '#d0d0ad');
      polygon(c, [[74, 79], [95, 78], [85, 88]], '#354c40');
      line(c, [[61, 62], [74, 67]], '#e7e1a8', 4); line(c, [[98, 65], [111, 59]], '#e7e1a8', 4);
      glow(c, 68, 64, 15, '#eeda9155'); glow(c, 103, 63, 15, '#eeda9155');
      line(c, [[50, 112], [56, 143], [68, 155]], '#82683d', 3);
      polygon(c, [[49, 110], [45, 141], [60, 137]], '#b55335');
      line(c, [[119, 115], [117, 164]], '#b3a477', 3); polygon(c, [[119, 116], [143, 121], [126, 132], [119, 127]], '#b49a5a');
    }

    private paintRocks(c: Ctx): void {
      ellipse(c, 50, 60, 48, 10, '#24372d55');
      polygon(c, [[6, 55], [19, 21], [50, 8], [73, 25], [79, 57], [40, 69]], '#6c7c70');
      polygon(c, [[6, 55], [19, 21], [50, 8], [51, 46]], '#a1a791');
      polygon(c, [[51, 46], [50, 8], [73, 25], [79, 57], [40, 69]], '#829080');
      polygon(c, [[69, 56], [77, 35], [96, 40], [103, 61], [88, 69]], '#939d86');
      line(c, [[21, 28], [39, 20], [47, 29]], '#c4c5a366', 2);
      ellipse(c, 17, 56, 11, 3, '#7b8c55');
    }

    private paintLogs(c: Ctx): void {
      ellipse(c, 53, 53, 49, 10, '#24322555');
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i < 3 - row; i++) {
          const x = 13 + i * 20 + row * 10, y = 49 - row * 12;
          line(c, [[x, y], [x + 40, y - 17]], '#6c5637', 17);
          line(c, [[x, y - 5], [x + 40, y - 22]], '#9e8051', 3);
          ellipse(c, x, y, 8, 7, '#c6ac75'); ellipse(c, x, y, 5, 4, '#967744'); ellipse(c, x, y, 3, 2, '#cdb887');
        }
      }
      line(c, [[43, 20], [37, 49]], '#c8b786', 2);
    }

    private paintTent(c: Ctx): void {
      ellipse(c, 83, 126, 68, 16, '#24332466');
      polygon(c, [[81, 24], [19, 113], [78, 142], [141, 114]], '#bda77d', '#8b795a', 2);
      polygon(c, [[81, 24], [78, 142], [141, 114]], '#928363');
      polygon(c, [[81, 76], [62, 133], [96, 135]], '#343d30');
      line(c, [[69, 10], [131, 132]], '#b7a174', 4); line(c, [[90, 10], [33, 130]], '#b7a174', 4);
      line(c, [[42, 87], [61, 91], [60, 109]], '#785d43', 2); line(c, [[114, 100], [128, 104]], '#c6b28a', 2);
    }

    private createBattlefield(): void {
      const g = this.add.graphics(); this.battlefield.add(g);
      const corners: Point[] = [[672, 171], [1037, 351], [599, 567], [234, 387]];
      g.fillStyle(0x283b31, .96); g.fillPoints(corners.map(([x, y]) => ({ x, y: y + 15 })), true);
      g.fillStyle(0x73765a, 1); g.fillPoints(corners.map(([x, y]) => ({ x, y })), true);
      g.lineStyle(2, 0xaca57a, .45); g.strokePoints(corners.map(([x, y]) => ({ x, y })), true);
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 4; x++) {
          const [px, py] = iso(x, y);
          const points = [{ x: px, y: py - 35 }, { x: px + 71, y: py }, { x: px, y: py + 35 }, { x: px - 71, y: py }];
          g.fillStyle(y < 3 ? ((x + y) % 2 ? 0x77755a : 0x7e7b5d) : ((x + y) % 2 ? 0x647257 : 0x6d7a5e), 1);
          g.fillPoints(points, true); g.lineStyle(1, 0xccca9d, .18); g.strokePoints(points, true);
          if (y >= 3) {
            const slot = (y - 3) * 4 + x;
            const diamond = [71, 0, 142, 35, 71, 70, 0, 35];
            const tile = this.add.polygon(px, py, diamond, 0xe2cf8d, .001).setInteractive(new Phaser.Geom.Polygon(diamond), Phaser.Geom.Polygon.Contains).setDepth(600);
            // Explicit centered hit area keeps pointer coordinates aligned with the diamond.
            tile.input!.cursor = 'pointer';
            tile.on('pointerover', () => this.highlightTile(px, py)); tile.on('pointerout', () => this.floorHover.clear());
            tile.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
              if (pointer.event.target !== this.game.canvas || game.state.paused || game.battle) return;
              callbacks.onSlot(slot); this.pulse(px, py, 0xdfc889, this.battlefield);
            });
            this.battlefield.add(tile);
            const dot = this.add.text(px, py + 12, `${slot + 1}`, { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#dae0b5' }).setAlpha(.34).setOrigin(.5);
            this.battlefield.add(dot);
          }
        }
      }
      this.floorHover = this.add.graphics().setDepth(2); this.battlefield.add(this.floorHover);
      const [a, b] = [iso(-.5, 2.5), iso(3.5, 2.5)];
      g.lineStyle(2, 0xe0c17c, .7); g.lineBetween(a[0], a[1], b[0], b[1]);
      this.battlefield.add(this.add.text(917, 280, 'TERRITÓRIO HOSTIL', { fontFamily: 'Georgia, serif', fontSize: '10px', letterSpacing: 2, color: '#d3b895' }).setOrigin(.5));
      this.battlefield.add(this.add.text(524, 564, 'SUA FORMAÇÃO', { fontFamily: 'Georgia, serif', fontSize: '11px', letterSpacing: 2, color: '#e8d79d' }).setOrigin(.5));
      // Guarding stones keep the battlefield part of the same ancestral landscape.
      for (const [x, y, scale] of [[238, 365, .7], [978, 390, .75], [769, 208, .6], [384, 521, .55]]) {
        this.battlefield.add(this.add.image(x, y, 'rock').setOrigin(.5, 1).setScale(scale));
      }
      for (const [x, y, key] of [[271, 319, 'tree-0'], [1025, 351, 'tree-3'], [770, 576, 'tree-2']] as [number, number, string][]) {
        this.battlefield.add(this.add.image(x, y, key).setOrigin(.5, 1).setScale(.7).setDepth(y));
      }
      this.paint('warrior', 100, 150, c => {
        ellipse(c, 50, 142, 30, 7, '#1d29274d');
        line(c, [[40, 113], [32, 142]], '#9f9270', 11); line(c, [[58, 113], [66, 142]], '#9f9270', 11);
        polygon(c, [[34, 61], [68, 61], [76, 118], [28, 118]], '#6e684f', '#a69f78', 2);
        line(c, [[34, 72], [18, 102]], '#b4a282', 10); line(c, [[67, 74], [80, 98]], '#b4a282', 10);
        ellipse(c, 50, 49, 19, 22, '#b09a77'); polygon(c, [[28, 40], [34, 18], [48, 25], [65, 17], [73, 40], [61, 34], [52, 46], [42, 33]], '#706f62');
        line(c, [[42, 50], [45, 50]], '#eac785', 2); line(c, [[57, 50], [60, 50]], '#eac785', 2);
        line(c, [[82, 140], [85, 32]], '#b5a177', 3); polygon(c, [[85, 18], [93, 40], [85, 36], [77, 39]], '#bfcec1');
        polygon(c, [[16, 78], [32, 84], [31, 108], [18, 119], [9, 103]], '#8c7955', '#c7b487', 2);
      });
    }

    private highlightTile(x: number, y: number): void {
      this.floorHover.clear(); this.floorHover.fillStyle(0xe2cb8b, .14); this.floorHover.lineStyle(2, 0xe2cb8b, .9);
      const p = [{ x, y: y - 35 }, { x: x + 71, y }, { x, y: y + 35 }, { x: x - 71, y }];
      this.floorHover.fillPoints(p, true); this.floorHover.strokePoints(p, true);
    }

    setWorldView(view: View): void {
      this.activeView = view;
      this.village.setVisible(view === 'village'); this.battlefield.setVisible(view === 'battle');
      for (const effect of this.floating) if ('setVisible' in effect) (effect as Phaser.GameObjects.Text).setVisible(false);
      this.floorHover.clear();
      if (view === 'battle') { this.lastFormation = ''; this.syncBattle(0); }
    }

    update(time: number, delta: number): void {
      if (!this.village) return;
      if (this.paused !== game.state.paused) {
        this.paused = game.state.paused;
        if (this.paused) this.tweens.pauseAll(); else this.tweens.resumeAll();
        this.time.paused = this.paused;
      }
      const dt = this.paused ? 0 : Math.min(delta / 1000, .1);
      this.clock += dt;
      this.input.enabled = !game.state.paused && !(this.activeView === 'battle' && game.battle);
      if (this.activeView === 'village') this.updateVillage(this.clock * 1000, dt);
      else this.syncBattle(dt);
      this.updateAmbience(this.clock * 1000);
    }

    private updateVillage(time: number, dt: number): void {
      this.syncVillageRoster();
      for (const b of BUILDINGS) {
        const level = game.state.buildings[b.id];
        const label = this.labels.get(b.id), text = `Nível ${level}  ·  ${level >= 10 ? 'máximo' : 'melhorar'}`;
        if (label?.text !== text) label?.setText(text);
        if (level > this.previousLevels[b.id]) {
          this.pulse(b.x, b.y, 0xe9d18e, this.village);
          this.pulse(b.x, b.y - 15, 0xbce3ad, this.village);
        }
        this.previousLevels[b.id] = level;
      }
      const t = this.reducedMotion ? 0 : time / 1000;
      for (const tree of this.scenery) tree.object.setAngle(Math.sin(t * .8 + tree.phase) * tree.angle);
      this.villageActors.forEach((actor, i) => {
        const cycle = (this.clock + actor.phase) % 20;
        const building = BUILDINGS.find(b => b.id === actor.work)!;
        const start = { x: 536 + i % 3 * 42, y: 435 + Math.floor(i / 3) * 22 };
        const end = { x: building.x + 38, y: building.y + 2 };
        let progress = 0, moving = false;
        if (cycle >= 3 && cycle < 9) { progress = (cycle - 3) / 6; moving = true; }
        else if (cycle >= 9 && cycle < 14) progress = 1;
        else if (cycle >= 14) { progress = 1 - (cycle - 14) / 6; moving = true; }
        if (this.reducedMotion) progress = 0;
        const x = Phaser.Math.Linear(start.x, end.x, progress), y = Phaser.Math.Linear(start.y, end.y, progress);
        const workBeat = Math.floor((this.clock + actor.phase) / 1.5);
        if (cycle >= 9 && cycle < 14 && actor.lastWork !== workBeat && dt > 0) {
          triggerMotion(actor.view.motion, 'attack', building.x - x); actor.lastWork = workBeat;
        }
        this.presentUnit(actor.view, moving && !this.reducedMotion ? 'walk' : 'idle', dt, x, y, x - actor.view.x);
        actor.view.name.setVisible(false); actor.view.bars.clear(); actor.view.ring.setAlpha(.2);
      });
      const f = this.fire; f.clear();
      f.fillStyle(0xe6a855, .04 + Math.sin(t * 4) * .012); f.fillEllipse(613, 411, 122, 57);
      f.fillStyle(0x422e22, 1); f.fillEllipse(605, 405, 26, 11);
      f.lineStyle(4, 0x8a6540, 1); f.lineBetween(591, 408, 616, 398); f.lineBetween(593, 398, 617, 409);
      for (let i = 0; i < 4; i++) {
        const x = 599 + i * 4, h = 15 + Math.sin(t * 7 + i * 2) * 6;
        f.fillStyle(i % 2 ? 0xf9d378 : 0xdb8a41, .94);
        f.fillTriangle(x - 5, 404, x + Math.sin(t * 6 + i) * 3, 404 - h, x + 5, 404);
      }
      for (let i = 0; i < 6; i++) {
        const p = (t * .22 + i / 6) % 1;
        f.fillStyle(0xe6bd74, (1 - p) * .55); f.fillCircle(605 + Math.sin(t + i) * p * 13, 392 - p * 43, 1 - p * .4);
      }
    }

    private updateAmbience(time: number): void {
      this.ambience.clear();
      const t = this.reducedMotion ? 0 : time / 1000;
      for (const star of this.stars) {
        const a = .12 + (Math.sin(t * star.speed + star.phase) + 1) * .15;
        const x = star.x + Math.sin(t * .13 + star.phase) * 12, y = star.y - Math.cos(t * .2 + star.phase) * 9;
        this.ambience.fillStyle(0xe7d498, a * .2); this.ambience.fillCircle(x, y, 4);
        this.ambience.fillStyle(0xebe1ac, a); this.ambience.fillCircle(x, y, 1.3);
      }
    }

    private resolveArt(characterId: number, stars: number): string {
      const character = characters.find(h => h.id === characterId);
      const key = stars === 1 ? 'hero-' + characterId : 'hero-' + characterId + '-' + stars;
      if (stars > 1 && character?.art && !this.textures.exists(key) && !this.loadingArt.has(key)) {
        this.loadingArt.add(key);
        this.load.image(key, '/chars/' + character.art + '-' + stars + 'star.png');
        if (!this.load.isLoading()) this.load.start();
      }
      return this.textures.exists(key) ? key : this.textures.exists('hero-' + characterId) ? 'hero-' + characterId : 'warrior';
    }

    private makeUnit(characterId: number, enemy: boolean, stars: number, layer: Phaser.GameObjects.Layer, height: number): UnitView {
      const key = this.resolveArt(characterId, stars);
      const character = characters.find(h => h.id === characterId);
      const sprite = this.add.sprite(0, 0, key).setOrigin(.5, 1);
      const ring = this.add.ellipse(0, 0, 55, 21, enemy ? 0xb16d52 : 0xa3b878, .2).setStrokeStyle(1, enemy ? 0xd69779 : 0xc7cf99, .55);
      const bars = this.add.graphics();
      const name = this.add.text(0, 0, (character?.name ?? 'Guardião') + (stars > 1 ? ' ' + '✦'.repeat(stars) : ''), { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#e7e3c8', stroke: '#24352c', strokeThickness: 3 }).setOrigin(.5);
      layer.add([ring, sprite, bars, name]);
      const motion = createMotion(characterId * .173 + this.units.size * .11);
      motion.facing = enemy ? -1 : 1;
      return { sprite, bars, name, ring, baseTexture: key, desiredHeight: height, characterId, stars, motion, x: 0, y: 0, lastHp: -1, enemy };
    }

    private unitView(id: string, characterId: number, enemy: boolean, stars: number): UnitView {
      const found = this.units.get(id);
      if (found) {
        found.stars = stars; found.desiredHeight = 108 + (stars - 1) * 8;
        return found;
      }
      const view = this.makeUnit(characterId, enemy, stars, this.battlefield, 108 + (stars - 1) * 8);
      this.units.set(id, view);
      return view;
    }

    private syncVillageRoster(): void {
      const heroes = game.state.heroes.slice(0, 6);
      const key = heroes.map(h => h.uid + ':' + h.stars).join(',');
      if (key === this.villageRoster) return;
      this.villageRoster = key;
      for (const actor of this.villageActors) this.destroyUnit(actor.view);
      this.villageActors = heroes.map((hero, i) => ({ uid: hero.uid, view: this.makeUnit(hero.characterId, false, hero.stars, this.village, 69 + hero.stars * 3), phase: i * 3.7, work: BUILDINGS[i % BUILDINGS.length].id, lastWork: -1 }));
    }

    private presentUnit(view: UnitView, desired: MotionClip, dt: number, x: number, y: number, direction = 0): void {
      advanceMotion(view.motion, desired, dt, direction);
      const sheet = view.stars === 1 ? animationSheets.get(view.characterId) : undefined;
      const hasSheet = !!sheet && this.textures.exists(sheetKey(view.characterId));
      const pose = poseForMotion(view.motion, hasSheet, this.reducedMotion);
      view.baseTexture = this.resolveArt(view.characterId, view.stars);
      let scale: number;
      if (sheet && hasSheet) {
        const frame = frameForMotion(view.motion, sheet, this.reducedMotion);
        view.sprite.setTexture(sheetKey(view.characterId), frame);
        const anchor = sheet.frameAnchors?.[frame] ?? { x: sheet.anchorX, y: sheet.anchorY };
        const footX = view.motion.facing < 0 ? view.sprite.width - anchor.x : anchor.x;
        view.sprite.setOrigin(footX / view.sprite.width, anchor.y / view.sprite.height);
        scale = view.desiredHeight / sheet.bodyHeight;
      } else {
        view.sprite.setTexture(view.baseTexture).setOrigin(.5, 1);
        scale = view.desiredHeight / view.sprite.height;
      }
      view.sprite.setFlipX(view.motion.facing < 0).setScale(scale * pose.scaleX, scale * pose.scaleY);
      view.sprite.setPosition(x + pose.x, y + 5 + pose.y).setAngle(pose.angle).setAlpha(pose.alpha).setDepth(y + 10);
      if (view.motion.hit > .12) view.sprite.setTintFill(0xf5d8b2);
      else if (view.enemy) view.sprite.setTint(0xdfc5b3);
      else view.sprite.clearTint();
      view.ring.setPosition(x, y + 5).setDepth(y - 1).setAlpha(desired === 'death' ? 0 : 1);
      view.name.setPosition(x, y + 34).setDepth(y + 125).setAlpha(desired === 'death' ? 0 : 1);
      view.x = x; view.y = y;
    }

    private syncBattle(dt: number): void {
      const battle = game.battle;
      if (!battle) {
        const keep = new Set<string>();
        for (const hero of game.state.heroes) {
          if (hero.slot === null || hero.slot === undefined || hero.slot < 0) continue;
          const id = 'formation-' + hero.uid; keep.add(id);
          const view = this.unitView(id, hero.characterId, false, hero.stars);
          const [x, y] = iso(hero.slot % 4, 3 + Math.floor(hero.slot / 4));
          this.presentUnit(view, 'idle', dt, x, y); view.bars.clear();
        }
        this.removeUnitsExcept(keep); return;
      }
      const keep = new Set<string>();
      const positions = new Map<string, { x: number; y: number; dx: number; moving: boolean }>();
      for (const entity of battle.entities) {
        const id = String(entity.id); keep.add(id);
        const view = this.unitView(id, entity.characterId, entity.team === 'enemy', entity.stars);
        const [x, y] = iso(entity.x, entity.y);
        const fresh = view.lastHp < 0;
        const blend = fresh ? 1 : dt > 0 ? 1 - Math.exp(-dt * 15) : 0;
        const sx = Phaser.Math.Linear(view.x, x, blend), sy = Phaser.Math.Linear(view.y, y, blend);
        positions.set(id, { x: sx, y: sy, dx: fresh ? 0 : sx - view.x, moving: !fresh && Math.hypot(x - view.x, y - view.y) > 1 });
        view.lastHp = entity.hp;
      }
      this.removeUnitsExcept(keep);
      const points = (team: 'ally' | 'enemy') => battle.entities.filter(e => e.team === team && e.hp > 0).map(e => positions.get(String(e.id))!);
      for (const event of game.events) {
        if (this.seenEvents.has(event.id)) continue;
        this.seenEvents.add(event.id);
        if (battle.time - event.time > .3) continue;
        const source = this.units.get(String(event.sourceId));
        const target = this.units.get(String(event.targetId ?? event.sourceId));
        const a = positions.get(String(event.sourceId));
        const b = positions.get(String(event.targetId ?? event.sourceId));
        if (!target || !b) continue;
        if ((event.type === 'attack' || event.type === 'skill') && source && a) {
          triggerMotion(source.motion, event.type === 'skill' ? 'cast' : 'attack', b.x - a.x);
          const entity = battle.entities.find(e => String(e.id) === String(event.sourceId));
          if (event.type === 'attack') this.effects.attack(source.characterId, a, b, (entity?.range ?? 1) > 1);
          else {
            const team = entity?.team ?? 'ally';
            this.effects.skill(source.characterId, a, b, points(team), points(team === 'ally' ? 'enemy' : 'ally'));
            if (event.text) this.floatText(event.text, a.x, a.y - 122, '#f4d79b', true);
          }
        } else if (event.type === 'damage' || event.type === 'heal') {
          this.floatText((event.type === 'heal' ? '+' : '−') + Math.round(event.amount ?? 0), b.x, b.y - 88, event.type === 'heal' ? '#c0d997' : '#f3dbc0');
          if (event.type === 'damage') { triggerMotion(target.motion, 'hurt'); this.effects.hit(b); }
          else this.effects.heal(b);
        } else if (event.type === 'shield') this.effects.shield(b);
        else if (event.type === 'death') {
          triggerMotion(target.motion, 'death'); this.effects.death(b, target.enemy ? 0xd49a7c : 0xc1d89d);
        }
      }
      for (const entity of battle.entities) {
        const view = this.units.get(String(entity.id))!, p = positions.get(String(entity.id))!;
        const winner = battle.status === 'victory' ? 'ally' : battle.status === 'defeat' ? 'enemy' : null;
        const desired = entity.hp <= 0 ? 'death' : entity.team === winner ? 'victory' : p.moving || entity.action === 'walk' ? 'walk' : 'idle';
        this.presentUnit(view, desired, dt, p.x, p.y, p.dx);
        this.drawBars(view, entity, p.x, p.y + 14);
      }
      if (this.seenEvents.size > 1500) this.seenEvents = new Set(game.events.map(event => event.id));
    }

    private destroyUnit(view: UnitView): void {
      view.sprite.destroy(); view.bars.destroy(); view.name.destroy(); view.ring.destroy();
    }

    private drawBars(view: UnitView, entity: Entity, x: number, y: number): void {
      const g = view.bars; g.clear().setDepth(entity.y * 36 + entity.x * 36 + 800);
      if (entity.hp <= 0) return;
      g.fillStyle(0x18241e, .9); g.fillRoundedRect(x - 28, y - 1, 56, 8, 2);
      g.fillStyle(entity.team === 'ally' ? 0xa6bf7b : 0xc98d6a, 1); g.fillRoundedRect(x - 26, y + 1, 52 * Math.max(0, Math.min(1, entity.hp / entity.maxHp)), 4, 1);
      g.fillStyle(0x1b2927, .8); g.fillRect(x - 26, y + 8, 52, 2);
      g.fillStyle(0x8bb3c5, 1); g.fillRect(x - 26, y + 8, 52 * Math.max(0, Math.min(1, entity.mana / Math.max(1, entity.manaMax))), 2);
      if (entity.shield > 0) { g.lineStyle(1, 0xc7dedd, .6); g.strokeEllipse(x, y - 43, 66, 94); }
    }

    private removeUnitsExcept(keep: Set<string>): void {
      for (const [id, view] of this.units) {
        if (!keep.has(id)) { this.destroyUnit(view); this.units.delete(id); }
      }
    }

    private pulse(x: number, y: number, color: number, layer: Phaser.GameObjects.Layer): void {
      const ring = this.add.ellipse(x, y, 22, 11).setStrokeStyle(2, color, .9).setDepth(1100); layer.add(ring);
      this.tweens.add({ targets: ring, scaleX: 3.4, scaleY: 3.4, alpha: 0, duration: this.reducedMotion ? 140 : 500, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
    }

    private floatText(text: string, x: number, y: number, color: string, skill = false): void {
      const label = this.add.text(x, y, text, { fontFamily: skill ? 'Georgia, serif' : 'Arial, sans-serif', fontSize: skill ? '12px' : '17px', color, stroke: '#19281f', strokeThickness: 3, fontStyle: skill ? 'normal' : 'bold' }).setOrigin(.5).setDepth(1300);
      this.battlefield.add(label); this.floating.push(label);
      this.tweens.add({ targets: label, y: y - (this.reducedMotion ? 3 : 28), alpha: 0, delay: 180, duration: 650, onComplete: () => { label.destroy(); this.floating = this.floating.filter(v => v !== label); } });
    }
  }

  const instance = new Phaser.Game({
    type: Phaser.AUTO,
    width: W,
    height: H,
    parent,
    backgroundColor: '#111a17',
    transparent: false,
    antialias: true,
    render: { roundPixels: false },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H },
    fps: { target: 60, forceSetTimeOut: false },
    scene: WorldScene,
    audio: { noAudio: true },
  });
  return {
    setView(view) { requestedView = view; scene?.setWorldView(view); },
    destroy() { scene = undefined; instance.destroy(true); },
  };
}
