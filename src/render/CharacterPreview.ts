import { getAnimation, frameRect } from './animationAssets';
import { CLIP_DURATION, createMotion, frameForMotion, poseForMotion, type FacingDirection, type MotionClip, type SheetDefinition } from './animationModel';
import { combatProfile } from './combatProfiles';

/** Uses the shipped atlas and the same frame timing as the battlefield. */
export class CharacterPreview {
  private canvas?: HTMLCanvasElement;
  private image?: HTMLImageElement;
  private sheet?: SheetDefinition;
  private generation = 0;
  private elapsed = 0;
  private facing = 1;
  private direction: FacingDirection = 'south';
  private paused = false;
  private clip: MotionClip = 'idle';
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  clear(): void { this.generation++; this.canvas = undefined; this.image = undefined; this.sheet = undefined; }

  /** `sheet` overrides the painted atlas, e.g. a stand-in or a code-drawn figure. */
  mount(canvas: HTMLCanvasElement, characterId: number, stars: number, sheet?: SheetDefinition): void {
    this.clear(); this.canvas = canvas; this.sheet = sheet ?? getAnimation(characterId, stars); this.elapsed = 0;
    canvas.style.imageRendering = this.sheet?.style === 'lpc' ? 'pixelated' : 'auto';
    const status = document.querySelector<HTMLElement>('#preview-status');
    if (!this.sheet) { if (status) status.textContent = 'Animação em produção'; return; }
    if (status) status.textContent = 'Carregando animação…';
    const token = this.generation;
    const image = new Image(); image.decoding = 'async';
    image.onload = () => {
      if (this.generation !== token) return;
      this.image = image;
      if (status) status.textContent = this.paused ? 'Prévia pausada' : 'Prévia animada';
      this.draw();
    };
    image.onerror = () => { if (this.generation === token && status) status.textContent = 'Não foi possível carregar a animação.'; };
    image.src = this.sheet.image;
  }

  select(clip: MotionClip): void { this.clip = clip; this.elapsed = 0; this.draw(); }
  flip(): void {
    this.facing *= -1;
    const directions: FacingDirection[] = ['south', 'west', 'north', 'east'];
    this.direction = directions[(directions.indexOf(this.direction) + 1) % directions.length];
    this.draw();
  }
  toggle(): boolean {
    this.paused = !this.paused;
    const status = document.querySelector<HTMLElement>('#preview-status');
    if (status) status.textContent = this.paused ? 'Prévia pausada' : 'Prévia animada';
    return this.paused;
  }
  get currentClip(): MotionClip { return this.clip; }
  get isPaused(): boolean { return this.paused; }
  setReducedMotion(value: boolean): void { this.reduced = value; this.draw(); }

  update(seconds: number): void {
    if (!this.canvas?.isConnected || !this.image || document.hidden) return;
    if (!this.paused) this.elapsed += Math.min(.1, Math.max(0, seconds));
    this.draw();
  }

  private draw(): void {
    const c = this.canvas?.getContext('2d'), sheet = this.sheet, image = this.image;
    if (!c || !sheet || !image || !this.canvas) return;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const duration = CLIP_DURATION[this.clip];
    const looping = this.clip === 'idle' || this.clip === 'walk' || this.clip === 'victory';
    const phase = this.elapsed % (duration + (looping ? 0 : .65));
    const state = createMotion();
    const profile=combatProfile(sheet.characterId);Object.assign(state,{weight:profile.weight,stride:profile.stride,reach:profile.reach});
    state.clip = this.clip === 'hurt' && !sheet.directions ? 'idle' : this.clip;
    state.elapsed = looping ? this.elapsed : Math.min(phase, duration);
    state.facing = this.facing;
    state.direction = this.direction;
    if (this.clip === 'hurt') state.hit = Math.max(0, duration - phase);
    const index = frameForMotion(state, sheet, this.reduced);
    const rect = frameRect(sheet, index);
    const anchor = sheet.frameAnchors?.[index] ?? { x: sheet.anchorX, y: sheet.anchorY };
    // Spirit silhouettes can be taller than the physical body used on the battlefield.
    const clipFrames = sheet.directions?.[this.direction]?.[this.clip] ?? sheet.clips.idle;
    const indices = sheet.style === 'lpc' ? clipFrames : sheet.frameRects?.map((_, i) => i) ?? [0];
    const widestFrame = Math.max(...indices.map(i => frameRect(sheet, i).width));
    const abovePivot = Math.max(...indices.map(i => sheet.frameAnchors?.[i].y ?? sheet.anchorY));
    const belowPivot = Math.max(...indices.map(i => frameRect(sheet,i).height - (sheet.frameAnchors?.[i].y ?? sheet.anchorY)));
    const scale = Math.min(330 / sheet.bodyHeight, 430 / (abovePivot + belowPivot), 570 / widestFrame);
    const ground = Math.min(480, 45 + abovePivot * scale);
    const pose = poseForMotion(state, true, this.reduced, sheet.style === 'lpc');
    c.imageSmoothingEnabled = sheet.style !== 'lpc';
    c.fillStyle = '#0b15184a'; c.beginPath(); c.ellipse(320, ground + 3, 86, 17, 0, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(320 + pose.x * 2, ground + pose.y * 2);
    c.rotate(pose.angle * Math.PI / 180);
    c.scale((sheet.directions ? 1 : this.facing) * scale * pose.scaleX, scale * pose.scaleY);
    c.globalAlpha = pose.alpha;
    c.drawImage(image, rect.x, rect.y, rect.width, rect.height, -anchor.x, -anchor.y, rect.width, rect.height);
    c.restore();
    if (this.clip === 'cast' && phase < duration) {
      c.strokeStyle = '#d5dba677'; c.lineWidth = 2; c.beginPath();
      c.ellipse(320, ground, 65 + phase * 120, 15 + phase * 35, 0, 0, Math.PI * 2); c.stroke();
    }
  }
}
