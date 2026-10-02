/** Synthesized sound: effects and a tribal ambience, with no audio files to load. */
export type Sfx = 'click' | 'hit' | 'cast' | 'heal' | 'death' | 'recruit' | 'upgrade' | 'victory' | 'defeat' | 'power' | 'item' | 'era' | 'summon';

const PENTATONIC = [0, 3, 5, 7, 10, 12, 15];

export class SoundSystem {
  private context?: AudioContext;
  private master?: GainNode;
  private musicGain?: GainNode;
  private effectsGain?: GainNode;
  private volumes = { effects: 0.8, music: 0.5 };
  private last = new Map<Sfx, number>();
  private timer = 0;
  private step = 0;
  private nextTime = 0;
  muted = true;
  mood: 'village' | 'battle' = 'village';

  private ensure(): AudioContext | undefined {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain(); this.master.gain.value = 0.55; this.master.connect(this.context.destination);
        this.musicGain = this.context.createGain(); this.musicGain.connect(this.master);
        this.effectsGain = this.context.createGain(); this.effectsGain.connect(this.master);
        this.applyVolumes();
      }
      void this.context.resume();
      return this.context;
    } catch { return undefined; }
  }

  toggle(): boolean {
    this.setMuted(!this.muted);
    if (!this.muted) this.play('click');
    return this.muted;
  }

  /** Unmuting must come from a user gesture, as browsers require for audio. */
  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) { window.clearInterval(this.timer); this.timer = 0; }
    else { this.ensure(); this.startMusic(); }
  }

  /** Both levels go from 0 to 1; the defaults match the original mix. */
  setVolumes(effects: number, music: number): void {
    this.volumes = { effects, music };
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (this.effectsGain) this.effectsGain.gain.value = this.volumes.effects * 1.25;
    if (this.musicGain) this.musicGain.gain.value = this.volumes.music * 0.64;
  }

  private tone(frequency: number, start: number, duration: number, type: OscillatorType, volume: number, slideTo?: number, destination?: AudioNode): void {
    const context = this.context!;
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.02, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(destination ?? this.effectsGain!);
    oscillator.start(start); oscillator.stop(start + duration + 0.02);
  }

  private noise(start: number, duration: number, volume: number, frequency: number, destination?: AudioNode): void {
    const context = this.context!;
    const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * duration)), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = 0.9;
    gain.gain.value = volume;
    source.connect(filter).connect(gain).connect(destination ?? this.effectsGain!);
    source.start(start);
  }

  /** Effects are throttled so a crowded battle does not become noise. */
  play(sfx: Sfx): void {
    if (this.muted) return;
    const context = this.ensure();
    if (!context) return;
    const now = context.currentTime;
    const gap = sfx === 'hit' ? 0.07 : sfx === 'death' || sfx === 'cast' || sfx === 'heal' ? 0.12 : 0.05;
    if (now - (this.last.get(sfx) ?? -1) < gap) return;
    this.last.set(sfx, now);
    switch (sfx) {
      case 'click': this.tone(660, now, 0.06, 'triangle', 0.05); break;
      case 'hit': this.noise(now, 0.07, 0.12, 900 + Math.random() * 500); this.tone(140, now, 0.06, 'sine', 0.05, 90); break;
      case 'cast': this.tone(330, now, 0.35, 'sine', 0.06, 880); this.tone(495, now + 0.05, 0.3, 'triangle', 0.03, 990); break;
      case 'heal': for (const [i, f] of [523, 659, 784].entries()) this.tone(f, now + i * 0.06, 0.4, 'sine', 0.04); break;
      case 'death': this.tone(180, now, 0.3, 'sine', 0.08, 60); this.noise(now, 0.2, 0.06, 300); break;
      case 'recruit': for (const [i, f] of [392, 494, 587].entries()) this.tone(f, now + i * 0.05, 0.45, 'triangle', 0.05); break;
      case 'upgrade': this.tone(440, now, 0.18, 'triangle', 0.06); this.tone(660, now + 0.12, 0.3, 'triangle', 0.06); break;
      case 'item': this.tone(1320, now, 0.12, 'square', 0.025); this.tone(1760, now + 0.05, 0.2, 'sine', 0.03); break;
      case 'summon': this.tone(220, now, 0.3, 'sawtooth', 0.025, 440); this.noise(now, 0.25, 0.04, 1800); break;
      case 'power': this.tone(70, now, 0.6, 'sine', 0.18, 45); this.noise(now, 0.5, 0.1, 500); this.tone(220, now + 0.1, 0.6, 'triangle', 0.05, 330); break;
      case 'era': for (const [i, f] of [196, 247, 294, 392].entries()) this.tone(f, now + i * 0.18, 0.9, 'sawtooth', 0.025); break;
      case 'victory': for (const [i, step] of [0, 3, 7, 12].entries()) this.tone(392 * Math.pow(2, step / 12), now + i * 0.12, 0.55, 'triangle', 0.06); break;
      case 'defeat': for (const [i, step] of [7, 3, 0].entries()) this.tone(294 * Math.pow(2, step / 12), now + i * 0.2, 0.6, 'sine', 0.06); break;
    }
  }

  /** A slow frame drum with a pentatonic flute that quickens during expeditions. */
  private startMusic(): void {
    if (this.timer || !this.context) return;
    this.nextTime = this.context.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 120);
  }

  private schedule(): void {
    const context = this.context;
    if (!context || this.muted) return;
    const beat = this.mood === 'battle' ? 0.32 : 0.5;
    while (this.nextTime < context.currentTime + 0.4) {
      const t = this.nextTime, bar = this.step % 16;
      if (bar % 4 === 0) { this.tone(70, t, 0.35, 'sine', 0.22, 48, this.musicGain); this.noise(t, 0.08, 0.05, 160, this.musicGain); }
      if (this.mood === 'battle' && bar % 4 === 2) this.noise(t, 0.05, 0.06, 2400, this.musicGain);
      if (bar % 8 === 6) this.tone(110, t, 0.2, 'sine', 0.1, 80, this.musicGain);
      if (bar === 0) this.tone(55, t, beat * 16, 'sine', 0.04, undefined, this.musicGain);
      const hash = Math.sin((this.step + 1) * 12.9898) * 43758.5453;
      if ((bar === 2 || bar === 7 || bar === 11) && hash - Math.floor(hash) > 0.35) {
        const note = PENTATONIC[Math.floor((hash * 7 % 7 + 7) % 7)];
        this.tone(294 * Math.pow(2, note / 12), t, beat * 2.2, 'triangle', 0.035, undefined, this.musicGain);
      }
      this.nextTime += beat; this.step++;
    }
  }
}
