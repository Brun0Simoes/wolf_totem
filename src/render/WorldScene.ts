import Phaser from 'phaser';
import { fx,props,spellAtlas } from 'virtual:wolf-environment';
import { OVERTIME_START, type Game } from '../game/simulation';
import { characters } from '../data/characters';
import { animationSheets, assetUrl, bestAnimation, getAnimation, getSummonAnimation, frameRect, sheetKey, summonSheetKey } from './animationAssets';
import { advanceMotion, createMotion, directionFor, frameForMotion, poseForMotion, triggerMotion, type MotionClip, type MotionState, type SheetDefinition } from './animationModel';
import { CombatEffects, SKILL_COLORS } from './CombatEffects';
import { combatProfile } from './combatProfiles';
import { separateBodies } from '../game/combatTiming';
import { artFor } from './artSource';
import { proceduralSheet } from './proceduralArt';
import { CHARACTER_ANIMAL, paintGlyph, type AnimalId } from './spiritGlyphs';
import { REGIONS } from '../game/campaign';
import { allySlotCenter, enemyFormation, enemySlotCenter, FORMATION_SLOTS, hexCorners } from '../game/board';
import { ARENA_CENTER, ARENA_LABELS, depthAt, paintArena, perspectiveScale, project, widthAt } from './battleArena';
import { SPIRITS, spiritById } from '../game/spirits';

type View = 'village' | 'battle';
type Ctx = CanvasRenderingContext2D;
type Point = [number, number];
type Entity = NonNullable<Game['battle']>['entities'][number];
type Callbacks = { onHero: (uid:string)=>void; onMove:(uid:string,slot:number)=>void; onSlot: (slot: number) => void; onTerritory?:(id:string)=>void;onPlot?:(id:string)=>void;onCitizen?:(id:number)=>void };
type UnitView = { dragging?: boolean; summon?: string; transform: boolean; morph:number;stealth:boolean;shadow:Phaser.GameObjects.Ellipse;conditions:Phaser.GameObjects.Graphics;hpTrail:number;step:number;trailAt:number;layer: Phaser.GameObjects.Layer; aura?: Phaser.GameObjects.Image; sprite: Phaser.GameObjects.Sprite; bars: Phaser.GameObjects.Graphics; name: Phaser.GameObjects.Text; ring: Phaser.GameObjects.Ellipse; baseTexture: string; desiredHeight: number; characterId: number; stars: number; motion: MotionState; x: number; y: number; lastHp: number; enemy: boolean; lastHit: number; flashUntil: number; flashReady: number };

const COST_TINT = [0xdfd8c0, 0xc7dccf, 0xc3cde6, 0xdccbe6, 0xf1dca6];
const SUMMON_HEIGHT: Record<string, number> = { spider: 34, crow: 40, beetle: 36, elephant: 82, wolf: 48 };
const ZONE_COLOR: Record<string, number> = { web: 0xc8ebd8, water: 0x7fc8d6, veil: 0x4f7fa8, domain: 0xa77d4f, frost: 0xcfe9f7 };
const W = 1200;
const H = 740;
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

export interface WorldOptions { reducedMotion: boolean; numbers: boolean }

/** Presentation only: the caller owns the simulation clock, saves and all game rules. */
export function createWorld(parent: HTMLElement, game: Game, callbacks: Callbacks, initial: WorldOptions): { setView(view: View): void; setOptions(options: WorldOptions): void; destroy(): void } {
  let requestedView: View = 'battle';
  let scene: WorldScene | undefined;
  let options = { ...initial };

  class WorldScene extends Phaser.Scene {
    private battlefield!: Phaser.GameObjects.Layer;
    private clock = 0;
    private paused = false;
    private effects!: CombatEffects;
    private units = new Map<string, UnitView>();
    private seenEvents = new Set<number>();
    private impactAt = new Map<string,number>();
    private lastBattleTime=0;
    private battleIdentity:Game['battle']=null;
    private cameraReady=0;
    private loadingArt = new Set<string>();
    private atlasUsed = new Map<string, number>();
    private lastAtlasSweep = 0;
    private ambience!: Phaser.GameObjects.Graphics;
    private floorHover!: Phaser.GameObjects.Graphics;
    private zoneLayer!: Phaser.GameObjects.Graphics;
    private board!: Phaser.GameObjects.Image;
    private boardRegion = 0;
    private stars: { x: number; y: number; phase: number; speed: number }[] = [];
    private activeView: View = 'battle';
    private lastFormation = '';
    private floating: Phaser.GameObjects.GameObject[] = [];
    private dusk!: Phaser.GameObjects.Rectangle;
    reducedMotion = options.reducedMotion;

    constructor() { super({ key: 'WolfTotemWorld' }); }

    preload(): void {
      this.load.image('painted-props',assetUrl(props.image));
      this.load.image('painted-fx',assetUrl(fx.image));
      this.load.image('painted-spells',assetUrl(spellAtlas.image));
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
      if(this.textures.exists('painted-fx'))for(const [name,r]of Object.entries(fx.frames))this.textures.get('painted-fx').add(name,0,r.x,r.y,r.width,r.height);
      if(this.textures.exists('painted-spells'))for(const [name,r]of Object.entries(spellAtlas.frames))this.textures.get('painted-spells').add(name,0,r.x,r.y,r.width,r.height);
      if(this.textures.exists('painted-props'))for(const [name,r]of Object.entries(props.frames))this.textures.get('painted-props').add(name,0,r.x,r.y,r.width,r.height);
      this.battlefield = this.add.layer().setDepth(1).setVisible(false);
      this.createBattlefield();
      this.effects = new CombatEffects(this, this.battlefield, this.reducedMotion);
      this.ambience = this.add.graphics().setDepth(1200);
      const rng = random(91);
      this.stars = Array.from({ length: 22 }, () => ({ x: 140 + rng() * 920, y: 170 + rng() * 405, phase: rng() * 6.28, speed: .3 + rng() * .6 }));
      this.setWorldView(requestedView);
      this.updateCanvasLabel();
      this.game.canvas.setAttribute('role', 'img');
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.effects.destroy();
        this.tweens.killAll(); this.units.clear(); this.seenEvents.clear();
      });
    }

    private paint(key: string, width: number, height: number, draw: (c: Ctx) => void): void {
      const texture = this.textures.createCanvas(key, width, height);
      if (!texture) return;
      draw(texture.context); texture.refresh();
    }

    private paintBoard(region: number): void {
      if (region === this.boardRegion) return;
      this.boardRegion = region;
      const key = `arena-${region}`;
      if (!this.textures.exists(key)) this.paint(key, W, H, c => paintArena(c, REGIONS[region - 1] ?? REGIONS[0]));
      this.board.setTexture(key);
    }

    private createBattlefield(): void {
      this.board = this.add.image(0, 0, '__DEFAULT').setOrigin(0).setDepth(-500); this.battlefield.add(this.board);
      this.paintBoard(1);
      this.dusk = this.add.rectangle(0, 0, W, H, 0x251638, 1).setOrigin(0).setDepth(-400).setAlpha(0); this.battlefield.add(this.dusk);
      for (let slot = 0; slot < FORMATION_SLOTS; slot++) {
        const center = allySlotCenter(slot);
        const corners = hexCorners(center, .93).map(p => project(p.x, p.y));
        const xs = corners.map(p => p[0]), ys = corners.map(p => p[1]);
        const [minX, minY, maxX, maxY] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
        const local = corners.flatMap(([x, y]) => [x - minX, y - minY]);
        const [px, py] = project(center.x, center.y);
        // The hit area is the projected hex itself, in the polygon's local space.
        const tile = this.add.polygon((minX + maxX) / 2, (minY + maxY) / 2, local, 0xe2cf8d, .001).setInteractive(new Phaser.Geom.Polygon(local), Phaser.Geom.Polygon.Contains).setDepth(600);
        tile.input!.cursor = 'pointer';
        tile.on('pointerover', () => this.highlightTile(corners)); tile.on('pointerout', () => this.floorHover.clear());
        tile.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if (pointer.event.target !== this.game.canvas || game.state.paused || game.battle) return;
          callbacks.onSlot(slot); this.pulse(px, py, 0xdfc889, this.battlefield);
        });
        this.battlefield.add(tile);
        const dot = this.add.text(px, py + 11, `${slot + 1}`, { fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#e6e7c4' }).setAlpha(.32).setOrigin(.5).setDepth(1);
        this.battlefield.add(dot);
      }
      this.floorHover = this.add.graphics().setDepth(2); this.battlefield.add(this.floorHover);
      const label = (text: string, [x, y]: Point, color: string, side: 1 | -1) => this.battlefield.add(this.add.text(x + side * 18, y, text, { fontFamily: 'Georgia, serif', fontSize: '10px', letterSpacing: 2, color, stroke: '#111a17', strokeThickness: 3 }).setOrigin(side > 0 ? 0 : 1, .5).setDepth(2));
      label('TERRITÓRIO HOSTIL', ARENA_LABELS.hostile, '#e0c3a0', 1);
      label('SUA FORMAÇÃO', ARENA_LABELS.formation, '#e8d79d', -1);
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
      this.paint('summon-wolf', 110, 110, c => { glow(c, 55, 55, 54, '#b7dfff44'); paintGlyph(c, 'wolf', 55, 56, 96, '#b9c7d4', 1, '#1b1712'); });
      this.paint('summon-elephant', 130, 110, c => {
        glow(c, 65, 60, 60, '#e8dcc044');
        ellipse(c, 70, 58, 38, 26, '#d8cfb8aa'); ellipse(c, 34, 46, 18, 16, '#e4dcc8bb');
        polygon(c, [[18, 40], [30, 30], [40, 52], [24, 64]], '#cfc4aaaa');
        line(c, [[22, 54], [16, 80], [22, 92]], '#e4dcc8bb', 7); line(c, [[30, 58], [36, 70]], '#fff7e4', 3);
        for (const x of [48, 62, 84, 98]) line(c, [[x, 76], [x, 100]], '#d8cfb8aa', 9);
      });
    }

    private highlightTile(corners: Point[]): void {
      this.floorHover.clear(); this.floorHover.fillStyle(0xe2cb8b, .16); this.floorHover.lineStyle(2, 0xe2cb8b, .9);
      const p = corners.map(([x, y]) => ({ x, y }));
      this.floorHover.fillPoints(p, true); this.floorHover.strokePoints(p, true);
    }

    /** Motion can change from the settings while the scene runs. */
    applyMotion(): void {
      if (this.effects) this.effects.reduced = this.reducedMotion;
    }

    setWorldView(view: View): void {
      this.activeView = view;
      this.updateCanvasLabel();
      if(view!=='battle'){this.effects?.clear();this.cameras.main.shakeEffect.reset();}
      this.battlefield.setVisible(view === 'battle');
      for (const effect of this.floating) if ('setVisible' in effect) (effect as Phaser.GameObjects.Text).setVisible(false);
      this.floorHover.clear();
      if (view === 'battle') { this.lastFormation = ''; this.syncBattle(0); }
    }

    updateCanvasLabel():void {
      this.game.canvas.setAttribute('aria-label',this.activeView==='battle'?'Campo de expedição interativo: selecione heróis e posições para organizar sua formação.':'Acampamento da tribo.');
    }

    update(time: number, delta: number): void {
      if (!this.battlefield) return;
      if (this.paused !== game.state.paused) {
        this.paused = game.state.paused;
        if(this.paused)this.cameras.main.shakeEffect.reset();
        if (this.paused) this.tweens.pauseAll(); else this.tweens.resumeAll();
        this.time.paused = this.paused;
      }
      // Do not consume queued events or create new tweens after pauseAll().
      if(this.paused){this.input.enabled=false;return;}
      const dt = this.paused ? 0 : Math.min(delta / 1000, .1);
      this.clock += dt;
      this.input.enabled = !game.state.paused && !(this.activeView === 'battle' && game.battle);
      if(this.activeView==='battle')this.syncBattle(dt);
      this.effects.update(dt,this.activeView==='battle'&&game.battle?.status==='fighting'?game.state.settings.speed:1);
      this.updateAmbience(this.clock * 1000);
      if (this.clock - this.lastAtlasSweep > 5) { this.evictAtlases(); this.lastAtlasSweep = this.clock; }
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

    private registerAtlas(sheet: SheetDefinition, key = sheetKey(sheet.characterId, sheet.stars)): void {
      const texture = this.textures.get(key);
      if (sheet.style === 'lpc') texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      for (let i = 0; i < (sheet.frameRects?.length ?? sheet.columns * sheet.rows); i++) {
        if (texture.has(String(i))) continue;
        const rect = frameRect(sheet, i);
        texture.add(i, 0, rect.x, rect.y, rect.width, rect.height);
      }
      this.atlasUsed.set(key, this.clock);
    }

    private ensureAtlas(characterId: number, stars: number): SheetDefinition | undefined {
      const sheet = getAnimation(characterId, stars);
      if (!sheet) return undefined;
      return this.ensureSheet(sheet, sheetKey(characterId, stars));
    }

    private ensureSummonAtlas(kind: string): SheetDefinition | undefined {
      const sheet = getSummonAnimation(kind);
      return sheet ? this.ensureSheet(sheet, summonSheetKey(kind)) : undefined;
    }

    private ensureSheet(sheet: SheetDefinition, key: string): SheetDefinition {
      this.atlasUsed.set(key, this.clock);
      if (!this.textures.exists(key) && !this.loadingArt.has(key)) {
        this.loadingArt.add(key);
        this.load.once(`filecomplete-image-${key}`, () => { this.registerAtlas(sheet, key); this.loadingArt.delete(key); });
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
      const active = new Set([...this.units.values()].flatMap(v => {
        if (v.summon && v.summon !== 'echo') return [summonSheetKey(v.summon)];
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
        this.load.image(key, assetUrl(`chars/${character.art}-${stars}star.png`));
        if (!this.load.isLoading()) this.load.start();
      }
      return this.textures.exists(key) ? key : this.textures.exists('hero-' + characterId) ? 'hero-' + characterId : 'warrior';
    }

    private makeUnit(characterId: number, enemy: boolean, stars: number, layer: Phaser.GameObjects.Layer, height: number, summon?: string, label?: string): UnitView {
      const key = summon && summon !== 'echo' ? 'summon-' + summon : this.resolveArt(characterId, stars);
      const character = characters.find(h => h.id === characterId);
      const sprite = this.add.sprite(0, 0, key).setOrigin(.5, 1);
      const shadow=this.add.ellipse(0,0,46,13,0x030909,.36);
      const conditions=this.add.graphics();
      const ring = this.add.ellipse(0, 0, 55, 21, enemy ? 0xb16d52 : 0xa3b878, .2).setStrokeStyle(1, enemy ? 0xd69779 : 0xc7cf99, .55);
      const bars = this.add.graphics();
      const name = this.add.text(0, 0, summon ? (label ?? '') : (character?.name ?? 'Guardião') + (stars > 1 ? ' ' + '✦'.repeat(stars) : ''), { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#e7e3c8', stroke: '#24352c', strokeThickness: 3 }).setOrigin(.5);
      layer.add([shadow,ring, sprite, bars, name,conditions]);
      const motion = createMotion(characterId * .173 + this.units.size * .11);
      motion.facing = enemy ? -1 : 1;
      motion.direction = enemy ? 'south' : 'north';
      const profile=combatProfile(characterId);Object.assign(motion,{weight:profile.weight,stride:profile.stride,reach:profile.reach});
      if (summon) { ring.setScale(.6); name.setFontSize(8).setAlpha(.8); }
      return { summon, transform: false,morph:0,stealth:false,shadow,conditions,hpTrail:-1,step:-1,trailAt:0,layer, sprite, bars, name, ring, baseTexture: key, desiredHeight: height, characterId, stars, motion, x: 0, y: 0, lastHp: -1, enemy, lastHit: 0, flashUntil: 0, flashReady: 0 };
    }

    private unitView(id: string, characterId: number, enemy: boolean, stars: number, summon?: string, label?: string): UnitView {
      const height = summon && summon !== 'echo' ? SUMMON_HEIGHT[summon] ?? 40 : 100 + (stars - 1) * 8;
      const found = this.units.get(id);
      if (found) {
        found.stars = stars; found.desiredHeight = height;
        return found;
      }
      const view = this.makeUnit(characterId, enemy, stars, this.battlefield, height, summon, label);
      if(id.startsWith('formation-')) {
        const uid=id.slice('formation-'.length);
        view.sprite.setInteractive({useHandCursor:true});this.input.setDraggable(view.sprite);
        view.sprite.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(pointer.event.target===this.game.canvas&&!game.battle)callbacks.onHero(uid);});
        view.sprite.on('dragstart',()=>{view.dragging=true;});
        view.sprite.on('drag',(_pointer:Phaser.Input.Pointer,dx:number,dy:number)=>{if(!game.battle){view.sprite.setPosition(dx,dy);}});
        view.sprite.on('dragend',(pointer:Phaser.Input.Pointer)=>{
          view.dragging=false;
          if(game.battle)return;
          const slots=Array.from({length:FORMATION_SLOTS},(_,slot)=>{const cell=allySlotCenter(slot);const [x,y]=project(cell.x,cell.y);return{slot,d:Math.hypot(pointer.x-x,pointer.y-y)};}).sort((a,b)=>a.d-b.d);
          if(slots[0].d<70)callbacks.onMove(uid,slots[0].slot);
        });
      }
      this.units.set(id, view);
      return view;
    }

    private presentUnit(view: UnitView, desired: MotionClip, dt: number, x: number, y: number, direction = 0, verticalDirection = 0): void {
      if(view.dragging)return;
      advanceMotion(view.motion, desired, dt, direction);
      if (dt > 0 && view.motion.locked === 0 && desired !== 'death') view.motion.direction = directionFor(direction, verticalDirection, view.motion.direction);
      const creature = !!view.summon && view.summon !== 'echo';
      const character = characters.find(h => h.id === view.characterId);
      // Painted sheet of this star, original illustration, closest painted star with an aura, or the drawn figure.
      const art = creature || !character ? undefined : artFor(character,view.transform?Math.min(3,view.stars+1):view.stars);
      let sheet: SheetDefinition | undefined, key = '';
      if (creature) { sheet = this.ensureSummonAtlas(view.summon!); key = summonSheetKey(view.summon!); }
      else if (art?.kind === 'painted' || art?.kind === 'standin') { sheet = this.ensureAtlas(art.sheet!.characterId, art.sheet!.stars ?? 1); key = sheetKey(art.sheet!.characterId, art.sheet!.stars); }
      else if (art?.kind === 'procedural') { sheet = this.ensureProcedural(view.characterId, view.stars); key = procKey(view.characterId, view.stars); }
      const hasSheet = !!sheet && this.textures.exists(key);
      this.updateAura(view, art?.kind === 'standin' && view.stars >= 2 && desired !== 'death', x, y);
      const directional = !!sheet?.directions;
      const pose = poseForMotion(view.motion, hasSheet, this.reducedMotion, sheet?.style === 'lpc');
      if (!creature) view.baseTexture = this.resolveArt(view.characterId, view.stars);
      let scale: number;
      if (sheet && hasSheet) {
        const frame = frameForMotion(view.motion, sheet, this.reducedMotion);
        view.sprite.setTexture(key, frame);
        const anchor = sheet.frameAnchors?.[frame] ?? { x: sheet.anchorX, y: sheet.anchorY };
        const footX = !directional && view.motion.facing < 0 ? view.sprite.width - anchor.x : anchor.x;
        view.sprite.setOrigin(footX / view.sprite.width, anchor.y / view.sprite.height);
        scale = view.desiredHeight / sheet.bodyHeight;
      } else {
        view.sprite.setTexture(view.baseTexture).setOrigin(.5, 1);
        scale = view.desiredHeight / view.sprite.height;
      }
      // Metamorphs grow while their transformation lasts; summoned echoes stay translucent.
      view.morph=Phaser.Math.Linear(view.morph,view.transform?1:0,1-Math.exp(-dt*7));
      scale *= 1+view.morph*.26;
      // On the arena, the back rows stand a little smaller.
      const depth = view.layer === this.battlefield ? perspectiveScale(y) : 1;
      scale *= depth;
      view.sprite.setFlipX(!directional && view.motion.facing < 0).setScale(scale * pose.scaleX, scale * pose.scaleY);
      view.sprite.setPosition(x + pose.x, y + 5 + pose.y).setAngle(pose.angle).setAlpha(pose.alpha * (view.summon ? .82 : 1)*(view.stealth?.34:1)).setDepth(y + 10);
      view.shadow.setPosition(x,y+8).setDepth(y-2).setScale(depth*(1+view.morph*.2)).setAlpha(desired==='death'?pose.alpha*.3:.36);
      // A short flash per hit, at most a few times per second, so crowded fights keep their colours.
      if (view.motion.hit > view.lastHit + .05 && this.clock >= view.flashReady) { view.flashUntil = this.clock + .07; view.flashReady = this.clock + .4; }
      view.lastHit = view.motion.hit;
      if (this.clock < view.flashUntil && desired !== 'death') view.sprite.setTint(0xffe9c9);
      else if (view.summon === 'echo') view.sprite.setTint(0xbfe0f2);
      else if (view.transform) view.sprite.setTint(0xfff0c8);
      else if (view.enemy) view.sprite.setTint(0xdfc5b3);
      else if (view.baseTexture === 'warrior' && !hasSheet) view.sprite.setTint(COST_TINT[(character?.cost ?? 1) - 1]);
      else view.sprite.clearTint();
      view.ring.setPosition(x, y + 5).setDepth(y - 1).setAlpha(desired === 'death' ? 0 : 1).setScale((creature ? .6 : 1) * depth);
      view.name.setPosition(x, y + 34).setDepth(y + 125).setAlpha(desired === 'death'||view.summon ? 0 : .72);
      if(view.layer===this.battlefield&&dt>0){
        const step=Math.floor(view.motion.elapsed*(view.motion.stride??1)/.32);
        if(desired==='walk'&&step!==view.step){this.effects.footstep({x,y});view.step=step;}
        if(view.motion.clip==='cast'&&!this.reducedMotion&&this.clock-view.trailAt>.085){this.effects.afterimage(view.sprite,combatProfile(view.characterId).color);view.trailAt=this.clock;}
      }
      view.x = x; view.y = y;
    }

    private syncBattle(dt: number): void {
      const battle = game.battle;
      if(battle!==this.battleIdentity){this.removeUnitsExcept(new Set());this.effects.clear();this.seenEvents.clear();this.impactAt.clear();this.battleIdentity=battle;this.lastBattleTime=battle?.time??0;}
      const motionDt=battle?.status==='fighting'?Math.min(.3,Math.max(0,battle.time-this.lastBattleTime)):dt;
      this.lastBattleTime=battle?.time??0;
      this.paintBoard(battle ? battle.region : game.nextStage().stage.region);
      this.dusk.setAlpha(battle ? Math.max(0, Math.min(1, (battle.time - OVERTIME_START) / 8)) * .32 : 0);
      if (!battle) {
        const keep = new Set<string>();
        // The next expedition's enemies wait on their half of the board.
        const preview = game.nextStage().stage.units, previewSlots = enemyFormation(preview.map(unit => (characters.find(c => c.id === unit.id)?.range ?? 1) > 1));
        if (game.state.heroes.some(h => h.slot !== null)) preview.forEach((unit, index) => {
          const id = `preview-${game.state.selectedStage}-${index}-${unit.id}`; keep.add(id);
          const view = this.unitView(id, unit.id, true, unit.stars);
          const cell = enemySlotCenter(previewSlots[index]);
          const [x, y] = project(cell.x, cell.y);
          view.motion.facing = -1;
          this.presentUnit(view, 'idle', dt, x, y); view.bars.clear();
          if (unit.boss) view.name.setColor('#f2c879');
        });
        for (const hero of game.state.heroes) {
          if (hero.slot === null || hero.slot === undefined || hero.slot < 0 || hero.away) continue;
          const id = 'formation-' + hero.uid; keep.add(id);
          const view = this.unitView(id, hero.characterId, false, hero.stars);
          const cell = allySlotCenter(hero.slot);
          const [x, y] = project(cell.x, cell.y);
          this.presentUnit(view, 'idle', dt, x, y); view.bars.clear();
        }
        this.removeUnitsExcept(keep); this.zoneLayer.clear(); return;
      }
      const keep = new Set<string>();
      const positions = new Map<string, { x: number; y: number; dx: number; dy: number; moving: boolean }>();
      const bodies=battle.entities.map(e=>({id:e.id,x:e.x,y:e.y,hp:e.hp,summon:e.summon}));
      for(let pass=0;pass<4;pass++)separateBodies(bodies,.04,p=>{p.x=Math.max(0,Math.min(6.5,p.x));p.y=Math.max(0,Math.min(7,p.y));});
      for (const entity of battle.entities) {
        const id = String(entity.id); keep.add(id);
        const view = this.unitView(id, entity.characterId, entity.team === 'enemy', entity.stars, entity.summon, entity.name);
        view.transform = entity.transform > 0 && entity.hp > 0;
        view.stealth=entity.stealth>0&&entity.hp>0;
        const body=bodies.find(b=>b.id===id)!;
        const [x, y] = project(body.x, body.y);
        const fresh = view.lastHp < 0;
        const blend = fresh ? 1 : motionDt > 0 ? 1 - Math.exp(-motionDt * 18) : 0;
        const sx = Phaser.Math.Linear(view.x, x, blend), sy = Phaser.Math.Linear(view.y, y, blend);
        positions.set(id, { x: sx, y: sy, dx: fresh ? 0 : sx - view.x, dy: fresh ? 0 : sy - view.y, moving: !fresh && Math.hypot(x - view.x, y - view.y) > 1 });
        view.lastHp = entity.hp;
        view.hpTrail=view.hpTrail<0?entity.hp:Phaser.Math.Linear(view.hpTrail,entity.hp,1-Math.exp(-motionDt*3));
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
        if(event.type==='prepare'&&source&&a){
          source.motion.direction = directionFor(b.x-a.x, b.y-a.y, source.motion.direction);
          source.motion.preparingCast=event.text==='cast';triggerMotion(source.motion,'windup',b.x-a.x,event.duration??.2);
          if(event.text==='cast')this.effects.prepare(a,source.characterId,event.duration??.3);
        }else if ((event.type === 'attack' || event.type === 'skill') && source && a) {
          source.motion.direction = directionFor(b.x-a.x, b.y-a.y, source.motion.direction);
          triggerMotion(source.motion, event.type === 'skill' ? 'cast' : 'attack', b.x - a.x);
          const entity = battle.entities.find(e => String(e.id) === String(event.sourceId));
          if (event.type === 'attack') this.effects.attack(source.characterId, a, b, (entity?.range ?? 1) > 1,event.duration??.2,()=>{const v=this.units.get(String(event.targetId));return v?{x:v.x,y:v.y}:b;});
          else {
            const team = entity?.team ?? 'ally';
            this.effects.skill(source.characterId, a, b, points(team), points(team === 'ally' ? 'enemy' : 'ally'),source.stars);
            const animal=CHARACTER_ANIMAL[source.characterId],texture=`combat-spirit-${animal}`;
            if(!this.textures.exists(texture))this.paint(texture,180,180,c=>paintGlyph(c,animal,90,90,150,'#ffffff',1,'transparent'));
            this.effects.crest(texture,a,combatProfile(source.characterId).color,source.stars);
            if(entity?.boss&&event.text)this.floatText(event.text,a.x,a.y-122,'#f4d79b',true);
          }
        } else if (event.type === 'damage' || event.type === 'heal') {
          // Fully absorbed hits still flinch, without a "−0" label.
          if (options.numbers && this.clock-(this.impactAt.get(event.targetId??'')??-1)>.4 && Math.round(event.amount ?? 0) > 0) { this.floatText((event.type === 'heal' ? '+' : '−') + Math.round(event.amount ?? 0), b.x, b.y - 88, event.type === 'heal' ? '#c0d997' : '#f3dbc0'); this.impactAt.set(event.targetId??'',this.clock); }
          if (event.type === 'damage') {
            const hurt=battle.entities.find(e=>String(e.id)===String(event.targetId))!;
            const intensity=Math.min(1,((event.amount??0)+(event.absorbed??0))/Math.max(1,hurt.maxHp)*6);
            triggerMotion(target.motion,'hurt');this.effects.hit(b,0xf6e1ad,source?.characterId??1,intensity,event.school==='magic',event.absorbed??0);
            if(!this.reducedMotion&&intensity>.6){target.motion.freeze=.035;if(this.clock>=this.cameraReady){this.cameras.main.shake(90,.0012);this.cameraReady=this.clock+.65;}}
          }
          else this.effects.heal(b);
        } else if (event.type === 'shield') this.effects.shield(b);
        else if (event.type === 'summon') this.effects.summon(b, target.enemy ? 0xd49a7c : 0xc8e3b0);
        else if (event.type === 'phase') {
          // A boss reaches half life: a banner, a shockwave and a short tremor.
          this.effects.nova(b, 0xe9a35f, 140); this.effects.aura(b, 0xe9a35f);
          this.banner(event.text ?? '', '#f2b36b');
          if (!this.reducedMotion) this.cameras.main.shake(320, 0.002);
        }
        else if (event.type === 'overtime') {
          // Twilight falls on long fights: healing fades and every blow lands harder.
          this.banner(event.text ?? 'Crepúsculo', '#d7b8f0');
        }
        else if (event.type === 'power') {
          const spirit = SPIRITS.find(entry => event.text?.startsWith(entry.name + ':'));
          if (spirit) {
            const texture = `power-${spirit.id}`;
            if (!this.textures.exists(texture)) this.paint(texture, 220, 220, c => { glow(c, 110, 110, 108, spirit.color + '55'); paintGlyph(c, spirit.animal as AnimalId, 110, 110, 190, spirit.color, 1, '#1b1712'); });
            this.effects.power(texture, parseInt(spirit.color.slice(1), 16), points('ally'), points('enemy'));
            this.floatText(spirit.power.name, ARENA_CENTER.x, ARENA_CENTER.y - 150, spirit.color, true);
          }
        }
        else if (event.type === 'revive') {
          target.motion = createMotion(target.motion.seed); target.motion.facing = target.enemy ? -1 : 1;
          target.motion.direction = target.enemy ? 'south' : 'north';
          const profile=combatProfile(target.characterId);Object.assign(target.motion,{weight:profile.weight,stride:profile.stride,reach:profile.reach});
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
        this.presentUnit(view, desired, motionDt, p.x, p.y, p.dx, p.dy);
        this.drawBars(view, entity, p.x, p.y + 14);
        this.drawConditions(view,entity,p.x,p.y);
      }
      if (this.seenEvents.size > 1500) this.seenEvents = new Set(game.events.map(event => event.id));
    }

    private drawZones(zones: NonNullable<Game['battle']>['zones']): void {
      const g = this.zoneLayer; g.clear();
      const t = this.reducedMotion ? 0 : this.clock;
      for (const zone of zones) {
        const [x, y] = project(zone.x, zone.y);
        const color = ZONE_COLOR[zone.kind] ?? 0xd8d0a0;
        const fade = Math.min(1, zone.time / .6, (zone.duration - zone.time + .05) / .35);
        const rx = zone.radius * widthAt(zone.y), ry = zone.radius * depthAt(zone.y) * .9;
        g.fillStyle(color, (zone.kind === 'veil' ? .16 : .1) * fade); g.fillEllipse(x, y, rx * 2, ry * 2);
        g.lineStyle(1.5, color, .55 * fade); g.strokeEllipse(x, y, rx * 2, ry * 2);
        if (zone.kind === 'web') for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.lineStyle(1, color, .35 * fade); g.lineBetween(x, y, x + Math.cos(a) * rx, y + Math.sin(a) * ry); }
        else for (let i = 0; i < 3; i++) { const p = (t * .5 + i / 3) % 1; g.lineStyle(1, color, (1 - p) * .5 * fade); g.strokeEllipse(x, y, rx * 2 * p, ry * 2 * p); }
      }
    }

    private destroyUnit(view: UnitView): void {
      view.shadow.destroy();view.conditions.destroy();
      view.sprite.destroy(); view.bars.destroy(); view.name.destroy(); view.ring.destroy(); view.aura?.destroy();
    }

    private drawBars(view: UnitView, entity: Entity, x: number, y: number): void {
      const g = view.bars; g.clear().setDepth(y + 800);
      if (entity.hp <= 0) return;
      g.fillStyle(0x18241e, .9); g.fillRoundedRect(x - 28, y - 1, 56, 8, 2);
      g.fillStyle(0xd9aa78,.7);g.fillRoundedRect(x-26,y+1,52*Math.max(0,Math.min(1,view.hpTrail/entity.maxHp)),4,1);
      g.fillStyle(entity.team === 'ally' ? 0xa6bf7b : 0xc98d6a, 1); g.fillRoundedRect(x - 26, y + 1, 52 * Math.max(0, Math.min(1, entity.hp / entity.maxHp)), 4, 1);
      g.fillStyle(0x1b2927, .8); g.fillRect(x - 26, y + 8, 52, 2);
      g.fillStyle(0x8bb3c5, 1); g.fillRect(x - 26, y + 8, 52 * Math.max(0, Math.min(1, entity.mana / Math.max(1, entity.manaMax))), 2);
      if (entity.shield > 0) { g.lineStyle(1, 0xc7dedd, .6); g.strokeEllipse(x, y - 43, 66, 94); }
    }

    private drawConditions(view:UnitView,e:Entity,x:number,y:number):void {
      const g=view.conditions;g.clear().setDepth(y+790);if(e.hp<=0)return;
      const time=this.reducedMotion?0:this.clock,head=y-view.desiredHeight*perspectiveScale(y)-8;
      if(e.stun>0)for(let i=0;i<3;i++){const a=time*4+i*2.094;g.fillStyle(0xf4d79b,.9);g.fillCircle(x+Math.cos(a)*17,head+Math.sin(a)*5,2.8);}
      if(e.poison>0)for(let i=0;i<3;i++){g.fillStyle(0x93d77a,.7);g.fillCircle(x+(i-1)*12,y-34-((time*18+i*13)%40),2);}
      if(e.marked>0||e.huntMarked>0){g.lineStyle(1.5,0xe5ad85,.75);g.strokeCircle(x,head-5,7);g.lineBetween(x-11,head-5,x+11,head-5);}
      if(e.guard>0){g.lineStyle(2,0xa9d8dd,.45);g.strokeEllipse(x,y-44,68,88);}
      if(e.slow>0){g.lineStyle(1,0x97b9d8,.5);g.strokeEllipse(x,y+6,38,12);}
      if(view.motion.clip==='windup'&&view.motion.preparingCast){g.lineStyle(2,combatProfile(e.characterId).color,.65);g.strokeEllipse(x,y+5,45+view.motion.elapsed*35,17+view.motion.elapsed*12);}
      if(view.transform){g.lineStyle(1.2,combatProfile(e.characterId).color,.22);g.strokeEllipse(x,y+5,66+Math.sin(time*3)*5,22);}
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

    /** A large title over the battlefield for boss phases. */
    private banner(text: string, color: string): void {
      const label = this.add.text(ARENA_CENTER.x, ARENA_CENTER.y - 20, text.toUpperCase(), { fontFamily: 'Georgia, serif', fontSize: '30px', color, stroke: '#19281f', strokeThickness: 6, letterSpacing: 3 }).setOrigin(.5).setDepth(1350).setAlpha(0).setScale(.8);
      this.battlefield.add(label); this.floating.push(label);
      this.tweens.add({ targets: label, alpha: 1, scale: 1, duration: this.reducedMotion ? 80 : 260, ease: 'Back.easeOut', hold: 1100, yoyo: true, onComplete: () => { label.destroy(); this.floating = this.floating.filter(v => v !== label); } });
    }

    private floatText(text: string, x: number, y: number, color: string, skill = false): void {
      if(this.floating.length>=(skill?16:10))return;
      const label = this.add.text(x, y, text, { fontFamily: skill ? 'Georgia, serif' : 'Arial, sans-serif', fontSize: skill ? '12px' : '17px', color, stroke: '#19281f', strokeThickness: 3, fontStyle: skill ? 'normal' : 'bold' }).setOrigin(.5).setDepth(1300);
      this.battlefield.add(label); this.floating.push(label);
      this.tweens.add({ targets: label, y: y - (this.reducedMotion ? 3 : 22), alpha: 0, delay: 80, duration: 480,timeScale:game.battle?.status==='fighting'?game.state.settings.speed:1,onComplete: () => { label.destroy(); this.floating = this.floating.filter(v => v !== label); } });
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
    setOptions(next) {
      options = { ...next };
      if (scene) { scene.reducedMotion = next.reducedMotion; scene.applyMotion(); }
    },
    destroy() { scene = undefined; instance.destroy(true); },
  };
}
