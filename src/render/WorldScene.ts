import Phaser from 'phaser';
import type { BuildingId, Game } from '../game/simulation';
import { characters } from '../data/characters';
import { animationSheets, bestAnimation, getAnimation, frameRect, sheetKey } from './animationAssets';
import { advanceMotion, createMotion, frameForMotion, poseForMotion, triggerMotion, type MotionClip, type MotionState, type SheetDefinition } from './animationModel';
import { CombatEffects, SKILL_COLORS } from './CombatEffects';
import { artFor } from './artSource';
import { proceduralSheet } from './proceduralArt';
import { CHARACTER_ANIMAL, paintGlyph, type AnimalId } from './spiritGlyphs';
import { REGIONS } from '../game/campaign';
import { SPIRITS, spiritById } from '../game/spirits';

type View = 'village' | 'battle';
type Ctx = CanvasRenderingContext2D;
type Point = [number, number];
type Entity = NonNullable<Game['battle']>['entities'][number];
type Callbacks = { onBuilding: (id: BuildingId) => void; onSlot: (slot: number) => void };
type UnitView = { summon?: string; transform: boolean; layer: Phaser.GameObjects.Layer; aura?: Phaser.GameObjects.Image; sprite: Phaser.GameObjects.Sprite; bars: Phaser.GameObjects.Graphics; name: Phaser.GameObjects.Text; ring: Phaser.GameObjects.Ellipse; baseTexture: string; desiredHeight: number; characterId: number; stars: number; motion: MotionState; x: number; y: number; lastHp: number; enemy: boolean };
type Villager = { uid: string; view: UnitView; phase: number; work: BuildingId | null; lastWork: number };

const COST_TINT = [0xdfd8c0, 0xc7dccf, 0xc3cde6, 0xdccbe6, 0xf1dca6];
const SUMMON_HEIGHT: Record<string, number> = { spider: 34, crow: 40, beetle: 36, elephant: 82 };
const ZONE_COLOR: Record<string, number> = { web: 0xc8ebd8, water: 0x7fc8d6, veil: 0x4f7fa8, domain: 0xa77d4f, frost: 0xcfe9f7 };
const W = 1200;
const H = 740;
const BUILDINGS: { id: BuildingId; name: string; x: number; y: number; icon: string; labelY?: number }[] = [
  { id: 'lumber', name: 'BOSQUE DOS COLETORES', x: 390, y: 329, icon: '↟' },
  { id: 'hunt', name: 'ACAMPAMENTO DE CAÇA', x: 797, y: 337, icon: '⌁' },
  { id: 'quarry', name: 'PEDREIRA ANCESTRAL', x: 838, y: 494, icon: '◇' },
  { id: 'shrine', name: 'CÍRCULO DOS ESPÍRITOS', x: 398, y: 493, icon: '✦' },
  { id: 'forge', name: 'FORJA DE OSSO', x: 672, y: 254, icon: '⚒', labelY: -118 },
];
const ENEMY_SLOTS = [1, 2, 5, 6, 0, 3, 8, 11];
const procKey = (id: number, stars: number) => `proc-${id}-${stars}`;

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
    private atlasUsed = new Map<string, number>();
    private lastAtlasSweep = 0;
    private fire!: Phaser.GameObjects.Graphics;
    private ambience!: Phaser.GameObjects.Graphics;
    private floorHover!: Phaser.GameObjects.Graphics;
    private zoneLayer!: Phaser.GameObjects.Graphics;
    private board!: Phaser.GameObjects.Graphics;
    private boardRegion = 0;
    private totemImage!: Phaser.GameObjects.Image;
    private forgeImage!: Phaser.GameObjects.Image;
    private banners: Phaser.GameObjects.Image[] = [];
    private bannerKey = '';
    private totemStage = -1;
    private stars: { x: number; y: number; phase: number; speed: number }[] = [];
    private activeView: View = 'village';
    private lastFormation = '';
    private floating: Phaser.GameObjects.GameObject[] = [];
    private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    constructor() { super({ key: 'WolfTotemWorld' }); }

    preload(): void {
      const initial = new Set(game.state.heroes.slice(0, 6).map(h => `${h.characterId}:${h.stars}`));
      for (const sheet of animationSheets.values()) {
        if (initial.has(`${sheet.characterId}:${sheet.stars ?? 1}`)) this.load.image(sheetKey(sheet.characterId, sheet.stars), sheet.image);
      }
    }

    create(): void {
      scene = this;
      for (const sheet of animationSheets.values()) {
        if (this.textures.exists(sheetKey(sheet.characterId, sheet.stars))) this.registerAtlas(sheet);
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
      for (let stage = 0; stage <= 5; stage++) this.paint(`totem-${stage}`, 220, 330, c => this.paintGreatTotem(c, stage));
      this.paint('forge', 230, 200, c => this.paintForge(c, true));
      this.paint('forge-site', 230, 200, c => this.paintForge(c, false));
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
        { key: 'logs', x: 308, y: 350, scale: .85 },
        { key: 'logs', x: 455, y: 326, scale: .65 },
        { key: 'tent', x: 520, y: 262, scale: .5 },
        { key: 'tent', x: 746, y: 425, scale: .50 },
        { key: 'rock', x: 970, y: 448, scale: .74 },
        { key: 'rock', x: 187, y: 368, scale: .79 },
        { key: 'rock', x: 698, y: 606, scale: .6 },
      ];
      objects.forEach(o => this.village.add(this.add.image(o.x, o.y, o.key).setOrigin(.5, 1).setScale(o.scale).setDepth(o.y)));
      this.totemImage = this.add.image(610, 412, 'totem-0').setOrigin(.5, 1).setScale(.93).setDepth(410); this.village.add(this.totemImage);
      this.forgeImage = this.add.image(672, 256, 'forge-site').setOrigin(.5, 1).setScale(.62).setDepth(268); this.village.add(this.forgeImage);

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
        const labelY = b.y + (b.labelY ?? 17);
        const bg = this.add.rectangle(b.x, labelY, 193, 24, 0x1d2920, .9).setStrokeStyle(1, 0xc5b481, .27).setDepth(1000);
        const badge = this.add.text(b.x, labelY, `${b.icon}  ${b.name}`, { fontFamily: 'Georgia, serif', fontSize: '10px', color: '#e8ddba', letterSpacing: .8 }).setOrigin(.5).setDepth(1001);
        const level = this.add.text(b.x, labelY + 19, '', { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#bbc29d' }).setOrigin(.5).setDepth(1001);
        this.village.add([bg, badge, level]); this.labels.set(b.id, level);
      }
      this.fire = this.add.graphics().setDepth(465); this.village.add(this.fire);
      // Small flag claims the center, leaving the place itself as the hero of the screen.
      const centerTitle = this.add.text(610, 429, 'TOTEM DO LOBO', { fontFamily: 'Georgia, serif', fontSize: '11px', color: '#f4dda1', letterSpacing: 1.8 }).setOrigin(.5).setDepth(1001);
      this.village.add(centerTitle);
    }

    /** Each raised stage of the Great Totem stacks another carved spirit; the last one opens wings and glows. */
    private paintGreatTotem(c: Ctx, stage: number): void {
      if (stage >= 5) glow(c, 110, 120, 120, '#f2d48633');
      const animals: AnimalId[] = ['bear', 'eagle', 'owl', 'serpent', 'elephant'];
      for (let i = 0; i < stage; i++) {
        const top = 139 - 27 * (i + 1);
        polygon(c, [[92, top + 28], [93, top], [127, top], [128, top + 28]], i % 2 ? '#7d5c3c' : '#8e6b45', '#3b2e20', 2);
        line(c, [[95, top + 3], [125, top + 3]], '#c9a66c88', 2);
        paintGlyph(c, animals[i], 110, top + 14, 30, i === stage - 1 && stage === 5 ? '#f2d486' : '#d9c39a', 1, '#3b2e20');
      }
      if (stage >= 3) {
        const top = 139 - 27 * stage;
        for (const side of [-1, 1]) polygon(c, [[110 + side * 16, top + 10], [110 + side * 70, top - 12], [110 + side * 86, top + 6], [110 + side * 58, top + 14], [110 + side * 72, top + 26], [110 + side * 22, top + 22]], stage >= 5 ? '#e8c77a' : '#b39a6c', '#4a3a26', 2);
      }
      c.save(); c.translate(25, 132); this.paintTotem(c); c.restore();
    }

    private paintForge(c: Ctx, built: boolean): void {
      ellipse(c, 118, 186, 100, 18, '#1c2c2363');
      if (!built) {
        for (const [x, y] of [[50, 176], [186, 176], [80, 150], [160, 150]]) { line(c, [[x, y], [x, y - 34]], '#7b6545', 4); ellipse(c, x, y - 34, 3, 2, '#c7ab78'); }
        line(c, [[50, 150], [80, 124], [160, 124], [186, 150]], '#b9a172', 1.5);
        for (let i = 0; i < 9; i++) { const a = i * Math.PI * 2 / 9; polygon(c, [[118 + Math.cos(a) * 34 - 6, 168 + Math.sin(a) * 11], [118 + Math.cos(a) * 34, 160 + Math.sin(a) * 11], [118 + Math.cos(a) * 34 + 7, 168 + Math.sin(a) * 11]], '#8e9386', '#5f665c', 1); }
        return;
      }
      // Hide canopy over the hearth.
      for (const [x, y] of [[44, 182], [192, 182], [70, 150], [168, 150]]) line(c, [[x, y], [x + (x < 118 ? 6 : -6), y - 92]], '#6b5236', 5);
      polygon(c, [[40, 94], [118, 64], [198, 94], [176, 112], [118, 88], [62, 112]], '#b08a5c', '#5a4430', 2);
      polygon(c, [[118, 64], [198, 94], [176, 112], [118, 88]], '#94714a');
      for (let i = 0; i < 6; i++) line(c, [[62 + i * 22, 108 - Math.abs(2.5 - i) * 3], [62 + i * 22, 116 - Math.abs(2.5 - i) * 3]], '#d8bf8f', 2);
      // Stone hearth with embers.
      ellipse(c, 118, 168, 46, 16, '#6f7468'); ellipse(c, 118, 164, 38, 12, '#3a2a20');
      glow(c, 118, 156, 44, '#f2a24f66');
      for (let i = 0; i < 5; i++) polygon(c, [[104 + i * 7, 166], [108 + i * 7, 146 - (i % 2) * 10], [112 + i * 7, 166]], i % 2 ? '#f9d378' : '#e0843e');
      for (let i = 0; i < 10; i++) { const a = i * Math.PI * 2 / 10; ellipse(c, 118 + Math.cos(a) * 44, 166 + Math.sin(a) * 14, 7, 5, '#9a9f8f'); }
      // Anvil stone, bones and a finished spear on the rack.
      polygon(c, [[160, 176], [166, 158], [194, 156], [200, 174], [182, 182]], '#868b80', '#4f564c', 2);
      line(c, [[170, 157], [192, 155]], '#c7c9b8', 2);
      line(c, [[52, 176], [58, 120]], '#7b6545', 4); line(c, [[78, 176], [84, 120]], '#7b6545', 4); line(c, [[50, 132], [88, 128]], '#7b6545', 3);
      for (let i = 0; i < 4; i++) line(c, [[56 + i * 8, 130], [54 + i * 8, 160]], '#e8dcc0', 3);
      line(c, [[34, 178], [64, 96]], '#9d8358', 3); polygon(c, [[64, 96], [70, 84], [60, 92]], '#c2c7bb');
    }

    private paintBanner(c: Ctx, color: string, animal: AnimalId): void {
      line(c, [[24, 116], [24, 6]], '#6b5236', 4); ellipse(c, 24, 6, 3, 3, '#e3c27c');
      polygon(c, [[26, 12], [66, 14], [62, 40], [66, 66], [44, 58], [26, 64]], '#d8c7a2', '#5a4430', 2);
      paintGlyph(c, animal, 46, 38, 30, color, 1, '#3b2e20');
      line(c, [[26, 64], [30, 76]], color, 2); line(c, [[44, 58], [46, 72]], color, 2);
    }

    private updateVillageStructures(t: number): void {
      const s = game.state;
      if (s.wonder !== this.totemStage) {
        if (this.totemStage >= 0) { this.pulse(610, 360, 0xf2d486, this.village); this.pulse(610, 300, 0xf2d486, this.village); }
        this.totemStage = s.wonder; this.totemImage.setTexture(`totem-${Math.min(5, s.wonder)}`);
      }
      const forgeKey = s.buildings.forge > 0 ? 'forge' : 'forge-site';
      if (this.forgeImage.texture.key !== forgeKey) this.forgeImage.setTexture(forgeKey);
      const key = s.spirits.join(',');
      if (key !== this.bannerKey) {
        this.bannerKey = key;
        for (const banner of this.banners) banner.destroy();
        const spots: Point[] = [[530, 402], [694, 404], [548, 462], [676, 462]];
        this.banners = s.spirits.map((id, i) => {
          const spirit = spiritById(id)!, texture = `banner-${id}`;
          if (!this.textures.exists(texture)) this.paint(texture, 72, 120, c => this.paintBanner(c, spirit.color, spirit.animal as AnimalId));
          const image = this.add.image(spots[i][0], spots[i][1], texture).setOrigin(.33, 1).setScale(.62).setDepth(spots[i][1]);
          this.village.add(image); this.pulse(spots[i][0], spots[i][1], 0xe9d18e, this.village);
          return image;
        });
      }
      this.banners.forEach((banner, i) => banner.setAngle(this.reducedMotion ? 0 : Math.sin(t * 1.3 + i) * 2.5));
    }

    /** Board colors follow the region of the selected expedition. */
    private paintBoard(region: number): void {
      if (region === this.boardRegion) return;
      this.boardRegion = region;
      const palette = (REGIONS[region - 1] ?? REGIONS[0]).palette, g = this.board;
      const corners: Point[] = [[672, 171], [1037, 351], [599, 567], [234, 387]];
      g.clear();
      g.fillStyle(0x283b31, .96); g.fillPoints(corners.map(([x, y]) => ({ x, y: y + 15 })), true);
      g.fillStyle(palette.floor, 1); g.fillPoints(corners.map(([x, y]) => ({ x, y })), true);
      g.lineStyle(2, palette.line, .45); g.strokePoints(corners.map(([x, y]) => ({ x, y })), true);
      for (let y = 0; y < 6; y++) for (let x = 0; x < 4; x++) {
        const [px, py] = iso(x, y);
        const points = [{ x: px, y: py - 35 }, { x: px + 71, y: py }, { x: px, y: py + 35 }, { x: px - 71, y: py }];
        g.fillStyle(y < 3 ? ((x + y) % 2 ? palette.floor : palette.floorAlt) : ((x + y) % 2 ? palette.ally : palette.allyAlt), 1);
        g.fillPoints(points, true); g.lineStyle(1, palette.line, .18); g.strokePoints(points, true);
      }
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
      this.board = g; this.paintBoard(1);
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 4; x++) {
          const [px, py] = iso(x, y);
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
      this.paintSummons();
      this.zoneLayer = this.add.graphics().setDepth(3); this.battlefield.add(this.zoneLayer);
    }

    /** Spirit creatures are luminous silhouettes until their own sprites are produced. */
    private paintSummons(): void {
      this.paint('summon-spider', 80, 60, c => {
        glow(c, 40, 34, 30, '#c8ebd855');
        for (const side of [-1, 1]) for (let i = 0; i < 4; i++) line(c, [[40, 34], [40 + side * (16 + i * 3), 24 + i * 6], [40 + side * (24 + i * 2), 44 + i * 3]], '#bfe3cf', 2);
        ellipse(c, 40, 36, 13, 10, '#6f9c86'); ellipse(c, 40, 24, 8, 7, '#8fc0a6');
        ellipse(c, 37, 23, 1.6, 1.6, '#f3fff5'); ellipse(c, 43, 23, 1.6, 1.6, '#f3fff5');
      });
      this.paint('summon-crow', 80, 70, c => {
        glow(c, 40, 34, 32, '#b7a6d855');
        polygon(c, [[8, 22], [36, 34], [40, 48], [44, 34], [72, 22], [56, 40], [40, 56], [24, 40]], '#2b2836', '#8f84b5', 1.5);
        ellipse(c, 40, 30, 7, 7, '#3a3548'); polygon(c, [[46, 29], [55, 32], [46, 33]], '#c9b37a');
        ellipse(c, 42, 28, 1.4, 1.4, '#f0e6ff');
      });
      this.paint('summon-beetle', 70, 60, c => {
        glow(c, 35, 32, 30, '#f2d48666');
        for (const side of [-1, 1]) for (let i = 0; i < 3; i++) line(c, [[35, 34 + i * 5], [35 + side * 22, 40 + i * 7]], '#8c6b2f', 2);
        ellipse(c, 35, 34, 16, 13, '#b98a2f'); line(c, [[35, 22], [35, 47]], '#6b4f1c', 2);
        ellipse(c, 35, 20, 8, 6, '#8a6a2a'); line(c, [[35, 15], [35, 6]], '#f2d486', 2);
      });
      this.paint('summon-elephant', 130, 110, c => {
        glow(c, 65, 60, 60, '#e8dcc044');
        ellipse(c, 70, 58, 38, 26, '#d8cfb8aa'); ellipse(c, 34, 46, 18, 16, '#e4dcc8bb');
        polygon(c, [[18, 40], [30, 30], [40, 52], [24, 64]], '#cfc4aaaa');
        line(c, [[22, 54], [16, 80], [22, 92]], '#e4dcc8bb', 7); line(c, [[30, 58], [36, 70]], '#fff7e4', 3);
        for (const x of [48, 62, 84, 98]) line(c, [[x, 76], [x, 100]], '#d8cfb8aa', 9);
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
      if (this.clock - this.lastAtlasSweep > 5) { this.evictAtlases(); this.lastAtlasSweep = this.clock; }
    }

    private updateVillage(time: number, dt: number): void {
      this.syncVillageRoster();
      for (const b of BUILDINGS) {
        const level = game.state.buildings[b.id];
        const label = this.labels.get(b.id), text = level ? `Nível ${level}  ·  ${level >= 10 ? 'máximo' : 'melhorar'}` : 'construir';
        if (label?.text !== text) label?.setText(text);
        if (level > this.previousLevels[b.id]) {
          this.pulse(b.x, b.y, 0xe9d18e, this.village);
          this.pulse(b.x, b.y - 15, 0xbce3ad, this.village);
        }
        this.previousLevels[b.id] = level;
      }
      const t = this.reducedMotion ? 0 : time / 1000;
      for (const tree of this.scenery) tree.object.setAngle(Math.sin(t * .8 + tree.phase) * tree.angle);
      this.updateVillageStructures(t);
      const idle = this.villageActors.filter(actor => !actor.work);
      this.villageActors.forEach(actor => {
        let x: number, y: number, moving = false;
        if (actor.work) {
          // Workers walk from the fire to the building they really work in, labour, and return.
          const cycle = (this.clock + actor.phase) % 20;
          const building = BUILDINGS.find(b => b.id === actor.work)!;
          const slot = this.villageActors.filter(other => other.work === actor.work).indexOf(actor);
          const start = { x: 560 + (actor.phase * 13) % 90, y: 440 + (actor.phase * 7) % 30 };
          const end = { x: building.x + 30 + slot * 22, y: building.y + 6 + slot * 6 };
          let progress = 0;
          if (cycle >= 2 && cycle < 6) { progress = (cycle - 2) / 4; moving = true; }
          else if (cycle >= 6 && cycle < 16) progress = 1;
          else if (cycle >= 16) { progress = 1 - (cycle - 16) / 4; moving = true; }
          if (this.reducedMotion) { progress = 1; moving = false; }
          x = Phaser.Math.Linear(start.x, end.x, progress); y = Phaser.Math.Linear(start.y, end.y, progress);
          const workBeat = Math.floor((this.clock + actor.phase) / 1.5);
          if (cycle >= 6 && cycle < 16 && actor.lastWork !== workBeat && dt > 0) { triggerMotion(actor.view.motion, 'attack', building.x - x); actor.lastWork = workBeat; }
        } else {
          // Resting heroes gather around the fire and stroll a little.
          const index = idle.indexOf(actor), angle = index / Math.max(1, idle.length) * Math.PI * 2 + .4;
          const sway = this.reducedMotion ? 0 : Math.sin(this.clock * .25 + actor.phase) * 10;
          x = 612 + Math.cos(angle) * (78 + sway); y = 418 + Math.sin(angle) * 34 + 6;
          moving = !this.reducedMotion && Math.abs(Math.cos(this.clock * .25 + actor.phase)) > .85;
        }
        this.presentUnit(actor.view, moving ? 'walk' : 'idle', dt, x, y, x - actor.view.x);
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

    private registerAtlas(sheet: SheetDefinition): void {
      const key = sheetKey(sheet.characterId, sheet.stars);
      const texture = this.textures.get(key);
      for (let i = 0; i < sheet.columns * sheet.rows; i++) {
        if (texture.has(String(i))) continue;
        const rect = frameRect(sheet, i);
        texture.add(i, 0, rect.x, rect.y, rect.width, rect.height);
      }
      this.atlasUsed.set(key, this.clock);
    }

    private ensureAtlas(characterId: number, stars: number): SheetDefinition | undefined {
      const sheet = getAnimation(characterId, stars);
      if (!sheet) return undefined;
      const key = sheetKey(characterId, stars);
      this.atlasUsed.set(key, this.clock);
      if (!this.textures.exists(key) && !this.loadingArt.has(key)) {
        this.loadingArt.add(key);
        this.load.once(`filecomplete-image-${key}`, () => { this.registerAtlas(sheet); this.loadingArt.delete(key); });
        this.load.image(key, sheet.image);
        if (!this.load.isLoading()) this.load.start();
      }
      return sheet;
    }

    private ensureProcedural(characterId: number, stars: number): SheetDefinition {
      const { canvas, sheet } = proceduralSheet(characterId, stars);
      const key = procKey(characterId, stars);
      if (!this.textures.exists(key)) {
        const texture = this.textures.addCanvas(key, canvas)!;
        for (let i = 0; i < sheet.columns * sheet.rows; i++) { const rect = frameRect(sheet, i); texture.add(i, 0, rect.x, rect.y, rect.width, rect.height); }
      }
      this.atlasUsed.set(key, this.clock);
      return sheet;
    }

    /** Stand-in stages show the painted lower star with the spirit animal rising behind it. */
    private updateAura(view: UnitView, show: boolean, x: number, y: number): void {
      if (!show) { view.aura?.setVisible(false); return; }
      const animal = CHARACTER_ANIMAL[view.characterId] ?? 'wolf', texture = `aura-${animal}-${view.characterId}`;
      if (!this.textures.exists(texture)) {
        const color = '#' + (SKILL_COLORS[view.characterId] ?? 0xd6c08a).toString(16).padStart(6, '0');
        this.paint(texture, 160, 160, c => { glow(c, 80, 80, 78, color + '40'); paintGlyph(c, animal, 80, 80, 140, color, 1); });
      }
      if (!view.aura) { view.aura = this.add.image(x, y, texture).setOrigin(.5, .5); view.layer.add(view.aura); }
      const big = view.stars >= 3, pulse = this.reducedMotion ? 0 : Math.sin(this.clock * 2 + view.motion.seed) * .04;
      const size = view.desiredHeight * (big ? 1.35 : .8) / 160;
      view.aura.setVisible(true).setTexture(texture).setPosition(x - view.motion.facing * (big ? 4 : 10), y - view.desiredHeight * (big ? .62 : .78))
        .setScale(size * (1 + pulse)).setAlpha(big ? .48 : .34).setDepth(y + 9).setFlipX(view.motion.facing < 0);
    }

    private evictAtlases(): void {
      if (this.atlasUsed.size <= 24) return;
      const active = new Set([...this.units.values(), ...this.villageActors.map(a => a.view)].flatMap(v => {
        const best = bestAnimation(v.characterId, v.stars);
        return [sheetKey(v.characterId, v.stars), procKey(v.characterId, v.stars), ...(best ? [sheetKey(best.characterId, best.stars)] : [])];
      }));
      for (const [key, lastUsed] of [...this.atlasUsed].sort((a, b) => a[1] - b[1])) {
        if (this.atlasUsed.size <= 24) break;
        if (active.has(key) || this.loadingArt.has(key) || this.clock - lastUsed < 10) continue;
        if (this.textures.exists(key)) this.textures.remove(key);
        this.atlasUsed.delete(key);
      }
    }

    private resolveArt(characterId: number, stars: number): string {
      const character = characters.find(h => h.id === characterId);
      const key = stars === 1 ? 'hero-' + characterId : 'hero-' + characterId + '-' + stars;
      if (!getAnimation(characterId, stars) && character?.art && !this.textures.exists(key) && !this.loadingArt.has(key)) {
        this.loadingArt.add(key);
        this.load.image(key, '/chars/' + character.art + '-' + stars + 'star.png');
        if (!this.load.isLoading()) this.load.start();
      }
      return this.textures.exists(key) ? key : this.textures.exists('hero-' + characterId) ? 'hero-' + characterId : 'warrior';
    }

    private makeUnit(characterId: number, enemy: boolean, stars: number, layer: Phaser.GameObjects.Layer, height: number, summon?: string, label?: string): UnitView {
      const key = summon && summon !== 'echo' ? 'summon-' + summon : this.resolveArt(characterId, stars);
      const character = characters.find(h => h.id === characterId);
      const sprite = this.add.sprite(0, 0, key).setOrigin(.5, 1);
      const ring = this.add.ellipse(0, 0, 55, 21, enemy ? 0xb16d52 : 0xa3b878, .2).setStrokeStyle(1, enemy ? 0xd69779 : 0xc7cf99, .55);
      const bars = this.add.graphics();
      const name = this.add.text(0, 0, summon ? (label ?? '') : (character?.name ?? 'Guardião') + (stars > 1 ? ' ' + '✦'.repeat(stars) : ''), { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#e7e3c8', stroke: '#24352c', strokeThickness: 3 }).setOrigin(.5);
      layer.add([ring, sprite, bars, name]);
      const motion = createMotion(characterId * .173 + this.units.size * .11);
      motion.facing = enemy ? -1 : 1;
      if (summon) { ring.setScale(.6); name.setFontSize(8).setAlpha(.8); }
      return { summon, transform: false, layer, sprite, bars, name, ring, baseTexture: key, desiredHeight: height, characterId, stars, motion, x: 0, y: 0, lastHp: -1, enemy };
    }

    private unitView(id: string, characterId: number, enemy: boolean, stars: number, summon?: string, label?: string): UnitView {
      const height = summon && summon !== 'echo' ? SUMMON_HEIGHT[summon] ?? 40 : 108 + (stars - 1) * 8;
      const found = this.units.get(id);
      if (found) {
        found.stars = stars; found.desiredHeight = height;
        return found;
      }
      const view = this.makeUnit(characterId, enemy, stars, this.battlefield, height, summon, label);
      this.units.set(id, view);
      return view;
    }

    private syncVillageRoster(): void {
      const workers = game.state.heroes.filter(h => h.work);
      const heroes = [...workers, ...game.state.heroes.filter(h => !h.work)].slice(0, Math.max(8, workers.length));
      const key = heroes.map(h => h.uid + ':' + h.stars + ':' + (h.work ?? '')).join(',');
      if (key === this.villageRoster) return;
      this.villageRoster = key;
      for (const actor of this.villageActors) this.destroyUnit(actor.view);
      this.villageActors = heroes.map((hero, i) => ({ uid: hero.uid, view: this.makeUnit(hero.characterId, false, hero.stars, this.village, 69 + hero.stars * 3), phase: i * 3.7, work: hero.work, lastWork: -1 }));
    }

    private presentUnit(view: UnitView, desired: MotionClip, dt: number, x: number, y: number, direction = 0): void {
      advanceMotion(view.motion, desired, dt, direction);
      const creature = !!view.summon && view.summon !== 'echo';
      const character = characters.find(h => h.id === view.characterId);
      // Painted sheet of this star, original illustration, closest painted star with an aura, or the drawn figure.
      const art = creature || !character ? undefined : artFor(character, view.stars);
      let sheet: SheetDefinition | undefined, key = '';
      if (art?.kind === 'painted' || art?.kind === 'standin') { sheet = this.ensureAtlas(art.sheet!.characterId, art.sheet!.stars ?? 1); key = sheetKey(art.sheet!.characterId, art.sheet!.stars); }
      else if (art?.kind === 'procedural') { sheet = this.ensureProcedural(view.characterId, view.stars); key = procKey(view.characterId, view.stars); }
      const hasSheet = !!sheet && this.textures.exists(key);
      this.updateAura(view, art?.kind === 'standin' && view.stars >= 2, x, y);
      const pose = poseForMotion(view.motion, hasSheet, this.reducedMotion);
      if (!creature) view.baseTexture = this.resolveArt(view.characterId, view.stars);
      let scale: number;
      if (sheet && hasSheet) {
        const frame = frameForMotion(view.motion, sheet, this.reducedMotion);
        view.sprite.setTexture(key, frame);
        const anchor = sheet.frameAnchors?.[frame] ?? { x: sheet.anchorX, y: sheet.anchorY };
        const footX = view.motion.facing < 0 ? view.sprite.width - anchor.x : anchor.x;
        view.sprite.setOrigin(footX / view.sprite.width, anchor.y / view.sprite.height);
        scale = view.desiredHeight / sheet.bodyHeight;
      } else {
        view.sprite.setTexture(view.baseTexture).setOrigin(.5, 1);
        scale = view.desiredHeight / view.sprite.height;
      }
      // Metamorphs grow while their transformation lasts; summoned echoes stay translucent.
      if (view.transform) scale *= 1.12;
      view.sprite.setFlipX(view.motion.facing < 0).setScale(scale * pose.scaleX, scale * pose.scaleY);
      view.sprite.setPosition(x + pose.x, y + 5 + pose.y).setAngle(pose.angle).setAlpha(pose.alpha * (view.summon ? .82 : 1)).setDepth(y + 10);
      if (view.motion.hit > .12) view.sprite.setTintFill(0xf5d8b2);
      else if (view.summon === 'echo') view.sprite.setTint(0xbfe0f2);
      else if (view.transform) view.sprite.setTint(0xfff0c8);
      else if (view.enemy) view.sprite.setTint(0xdfc5b3);
      else if (view.baseTexture === 'warrior' && !hasSheet) view.sprite.setTint(COST_TINT[(character?.cost ?? 1) - 1]);
      else view.sprite.clearTint();
      view.ring.setPosition(x, y + 5).setDepth(y - 1).setAlpha(desired === 'death' ? 0 : 1);
      view.name.setPosition(x, y + 34).setDepth(y + 125).setAlpha(desired === 'death' ? 0 : 1);
      view.x = x; view.y = y;
    }

    private syncBattle(dt: number): void {
      const battle = game.battle;
      this.paintBoard(battle ? battle.region : game.nextStage().stage.region);
      if (!battle) {
        const keep = new Set<string>();
        // The next expedition's enemies wait on their half of the board.
        if (game.state.heroes.some(h => h.slot !== null)) game.nextStage().stage.units.forEach((unit, index) => {
          const id = `preview-${game.state.selectedStage}-${index}-${unit.id}`; keep.add(id);
          const view = this.unitView(id, unit.id, true, unit.stars);
          const slot = ENEMY_SLOTS[index];
          const [x, y] = iso(slot % 4, 2 - Math.floor(slot / 4));
          view.motion.facing = -1;
          this.presentUnit(view, 'idle', dt, x, y); view.bars.clear();
          if (unit.boss) view.name.setColor('#f2c879');
        });
        for (const hero of game.state.heroes) {
          if (hero.slot === null || hero.slot === undefined || hero.slot < 0) continue;
          const id = 'formation-' + hero.uid; keep.add(id);
          const view = this.unitView(id, hero.characterId, false, hero.stars);
          const [x, y] = iso(hero.slot % 4, 3 + Math.floor(hero.slot / 4));
          this.presentUnit(view, 'idle', dt, x, y); view.bars.clear();
        }
        this.removeUnitsExcept(keep); this.zoneLayer.clear(); return;
      }
      const keep = new Set<string>();
      const positions = new Map<string, { x: number; y: number; dx: number; moving: boolean }>();
      for (const entity of battle.entities) {
        const id = String(entity.id); keep.add(id);
        const view = this.unitView(id, entity.characterId, entity.team === 'enemy', entity.stars, entity.summon, entity.name);
        view.transform = entity.transform > 0 && entity.hp > 0;
        const [x, y] = iso(entity.x, entity.y);
        const fresh = view.lastHp < 0;
        const blend = fresh ? 1 : dt > 0 ? 1 - Math.exp(-dt * 15) : 0;
        const sx = Phaser.Math.Linear(view.x, x, blend), sy = Phaser.Math.Linear(view.y, y, blend);
        positions.set(id, { x: sx, y: sy, dx: fresh ? 0 : sx - view.x, moving: !fresh && Math.hypot(x - view.x, y - view.y) > 1 });
        view.lastHp = entity.hp;
      }
      this.removeUnitsExcept(keep);
      this.drawZones(battle.zones);
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
          // Fully absorbed hits still flinch, without a "−0" label.
          if (Math.round(event.amount ?? 0) > 0) this.floatText((event.type === 'heal' ? '+' : '−') + Math.round(event.amount ?? 0), b.x, b.y - 88, event.type === 'heal' ? '#c0d997' : '#f3dbc0');
          if (event.type === 'damage') { triggerMotion(target.motion, 'hurt'); this.effects.hit(b); }
          else this.effects.heal(b);
        } else if (event.type === 'shield') this.effects.shield(b);
        else if (event.type === 'summon') this.effects.summon(b, target.enemy ? 0xd49a7c : 0xc8e3b0);
        else if (event.type === 'power') {
          const spirit = SPIRITS.find(entry => event.text?.startsWith(entry.name + ':'));
          if (spirit) {
            const texture = `power-${spirit.id}`;
            if (!this.textures.exists(texture)) this.paint(texture, 220, 220, c => { glow(c, 110, 110, 108, spirit.color + '55'); paintGlyph(c, spirit.animal as AnimalId, 110, 110, 190, spirit.color, 1, '#1b1712'); });
            this.effects.power(texture, parseInt(spirit.color.slice(1), 16), points('ally'), points('enemy'));
            this.floatText(spirit.power.name, 672, 250, spirit.color, true);
          }
        }
        else if (event.type === 'revive') {
          target.motion = createMotion(target.motion.seed); target.motion.facing = target.enemy ? -1 : 1;
          this.effects.revive(b); if (event.text) this.floatText(event.text, b.x, b.y - 122, '#f4d79b', true);
        }
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

    private drawZones(zones: NonNullable<Game['battle']>['zones']): void {
      const g = this.zoneLayer; g.clear();
      const t = this.reducedMotion ? 0 : this.clock;
      for (const zone of zones) {
        const [x, y] = iso(zone.x, zone.y);
        const color = ZONE_COLOR[zone.kind] ?? 0xd8d0a0;
        const fade = Math.min(1, zone.time / .6, (zone.duration - zone.time + .05) / .35);
        const rx = zone.radius * 73 * 1.2, ry = zone.radius * 36 * 1.2;
        g.fillStyle(color, (zone.kind === 'veil' ? .16 : .1) * fade); g.fillEllipse(x, y, rx * 2, ry * 2);
        g.lineStyle(1.5, color, .55 * fade); g.strokeEllipse(x, y, rx * 2, ry * 2);
        if (zone.kind === 'web') for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.lineStyle(1, color, .35 * fade); g.lineBetween(x, y, x + Math.cos(a) * rx, y + Math.sin(a) * ry); }
        else for (let i = 0; i < 3; i++) { const p = (t * .5 + i / 3) % 1; g.lineStyle(1, color, (1 - p) * .5 * fade); g.strokeEllipse(x, y, rx * 2 * p, ry * 2 * p); }
      }
    }

    private destroyUnit(view: UnitView): void {
      view.sprite.destroy(); view.bars.destroy(); view.name.destroy(); view.ring.destroy(); view.aura?.destroy();
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
