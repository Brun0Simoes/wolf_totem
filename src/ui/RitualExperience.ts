import { RitualPlay, RITUAL_PLAY, participationBonus } from '../game/ritualPlay';
import { RITUAL_XP, practiceById, type PracticeId } from '../game/tribe';
import type { SoundSystem } from '../audio';

export function ritualExperienceMarkup(id: PracticeId, companion: string): string {
  const p = practiceById(id)!, design = RITUAL_PLAY[id];
  return `<section class="ritual-experience" style="--rite-color:${design.color}" aria-label="Participação em ${p.name}">
    <header class="rite-header"><div><p class="eyebrow">CASA DE CURA · ${p.name.toUpperCase()}</p><h2>${design.title}</h2></div><div class="rite-companion">${companion}</div></header>
    <div class="rite-stage"><canvas width="900" height="440" aria-label="Campo interativo de ${p.name}"></canvas><div class="rite-stage-caption"><span data-rite-stage>PREPARAÇÃO</span><strong data-rite-feedback role="status">Um instante de presença.</strong></div><div class="rite-intro"><span class="rite-glyph">✧</span><h3>Entre no ritmo da cerimônia</h3><p>${design.instruction}</p><button class="primary" data-rite-start>Começar participação</button><label><input type="checkbox" data-rite-gentle> Modo tranquilo · mais margem para acertar</label>${id === 'rape' ? '<label><input type="checkbox" data-rite-tap> Sopro por dois toques · iniciar e soltar</label>' : ''}</div></div>
    <div class="rite-hud"><span data-rite-round>Preparação interativa</span><progress max="1" value="0" aria-label="Progresso da participação"></progress><span data-rite-bonus>Até +${participationBonus(RITUAL_XP[id], 1)} XP ritual</span></div>
    <div class="rite-controls" hidden>${id === 'kambo' ? [0,1,2,3].map(n=>`<button class="rite-stone" data-rite-stone="${n}" aria-label="Pedra ${n+1}"><span>${['◇','△','◉','✧'][n]}</span><small>${n+1}</small></button>`).join('') : id === 'ayahuasca' ? '<button data-rite-steer="-1" aria-label="Conduzir para a esquerda">←</button><span>Dentro do rio<br><small>Arraste a luz ou use as setas</small></span><button data-rite-steer="1" aria-label="Conduzir para a direita">→</button>' : `<button class="rite-touch" data-rite-touch>${design.verb}<small>${id==='rape'?'Segure e solte · Espaço':'Toque · Espaço'}</small></button>`}</div>
    <div class="rite-result" hidden aria-live="polite"></div><p class="rite-instruction">${design.instruction}</p>
    <footer class="rite-footer"><button class="text-button" data-rite-audio>Ativar som</button><button class="text-button" data-rite-pause hidden>Pausar participação</button><button class="outline-button" data-rite-auto>Concluir com auxílio</button></footer>
    <p class="rite-note">${design.sound}. Sonoridade original do jogo. Confirme para receber XP ritual agora. Fechar antes disso mantém o herói disponível. Depois, integre com duas vitórias na expedição mais avançada, ou contra inimigos até três níveis abaixo do herói; alternativa offline: três horas.</p>
  </section>`;
}

/** Disposable DOM/canvas presentation; progression is committed by Game only on confirmation. */
export class RitualExperience {
  private play: RitualPlay;
  private running = false;
  private paused = false;
  private consumed = false;
  private disposed = false;
  private frame = 0;
  private last = performance.now();
  private lastRound = -1;
  private lastCue = -1;
  private lastStone = -1;
  private tapBreath = false;
  private status = '';
  private abort = new AbortController();
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  constructor(private root: HTMLElement, readonly id: PracticeId, private sound: SoundSystem, private commit: (quality: number) => void, private toggleAudio: () => void, private reduced: boolean) {
    this.play = new RitualPlay(id, Date.now());
    this.canvas = this.get('canvas'); this.context = this.canvas.getContext('2d')!;
    const options = { signal: this.abort.signal };
    this.get('[data-rite-start]').addEventListener('click', () => {
      this.play = new RitualPlay(id, Date.now(), this.get<HTMLInputElement>('[data-rite-gentle]').checked);
      this.tapBreath = this.root.querySelector<HTMLInputElement>('[data-rite-tap]')?.checked ?? false;
      this.get('.rite-intro').hidden = true; this.get('.rite-controls').hidden = false;
      this.get('[data-rite-pause]').hidden = false; this.running = true; this.last = performance.now(); this.sound.startRitual();
      (this.root.querySelector('.rite-controls button') as HTMLButtonElement).focus();
    }, options);
    this.get('[data-rite-auto]').addEventListener('click', () => this.complete(0), options);
    this.get('[data-rite-audio]').addEventListener('click', () => { this.toggleAudio(); if (!this.sound.muted && this.running && !this.paused) this.sound.startRitual(); this.updateAudio(); }, options);
    this.get('[data-rite-pause]').addEventListener('click', () => this.pause(!this.paused), options);
    for (const button of Array.from(root.querySelectorAll<HTMLButtonElement>('[data-rite-stone]'))) button.addEventListener('click', () => {
      if (!this.canPlay()) return; this.play.press(Number(button.dataset.riteStone)); this.sound.ritualCue(id, Number(button.dataset.riteStone));
    }, options);
    const touch = root.querySelector<HTMLButtonElement>('[data-rite-touch]');
    touch?.addEventListener('pointerdown', event => { if (id !== 'rape' || this.tapBreath || !this.canPlay()) return; touch.setPointerCapture(event.pointerId); this.play.press(); }, options);
    touch?.addEventListener('pointerup', () => { if (!this.tapBreath && this.canPlay()) this.play.release(); }, options);
    touch?.addEventListener('pointercancel', () => { this.play.holding = false; this.play.charge = 0; }, options);
    touch?.addEventListener('click', () => { if (!this.canPlay()) return; if (id !== 'rape') this.play.press(); else if (this.tapBreath) { if (this.play.holding) this.play.release(); else this.play.press(); } }, options);
    for (const button of Array.from(root.querySelectorAll<HTMLButtonElement>('[data-rite-steer]'))) {
      button.addEventListener('pointerdown', e => { if (this.canPlay()) { button.setPointerCapture(e.pointerId); this.play.steering = Number(button.dataset.riteSteer); this.play.light = Math.max(.06, Math.min(.94, this.play.light + this.play.steering * .035)); } }, options);
      for (const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event, () => { this.play.steering = 0; }, options);
    }
    const guide = (e: PointerEvent) => { if (id !== 'ayahuasca' || !this.canPlay() || !(e.buttons & 1)) return; const rect = this.canvas.getBoundingClientRect(); this.play.light = Math.max(.06, Math.min(.94, (e.clientX - rect.left) / rect.width)); };
    this.canvas.addEventListener('pointerdown', e => { this.canvas.setPointerCapture(e.pointerId); guide(e); }, options);
    this.canvas.addEventListener('pointermove', guide, options);
    document.addEventListener('keydown', e => {
      if (!this.canPlay() || (e.target as HTMLElement).matches('[data-rite-auto],[data-rite-pause],[data-rite-audio],input')) return;
      if (e.code === 'Space' && id !== 'kambo' && id !== 'ayahuasca') { e.preventDefault(); if (!e.repeat) this.play.press(); }
      if (id === 'kambo' && /^[1-4]$/.test(e.key)) { e.preventDefault(); if (!e.repeat) { this.play.press(Number(e.key)-1); this.sound.ritualCue(id, Number(e.key)-1); } }
      if (id === 'ayahuasca' && ['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); this.play.steering = e.key === 'ArrowLeft' ? -1 : 1; if (!e.repeat) this.play.light = Math.max(.06, Math.min(.94, this.play.light + this.play.steering * .035)); }
    }, options);
    document.addEventListener('keyup', e => { if (e.code === 'Space' && id === 'rape') { e.preventDefault(); if (this.canPlay()) this.play.release(); } if (['ArrowLeft','ArrowRight'].includes(e.key)) this.play.steering = 0; }, options);
    window.addEventListener('blur', () => { if (this.running) this.pause(true); }, options);
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.running) this.pause(true); }, options);
    this.updateAudio(); this.frame = requestAnimationFrame(this.animate);
  }
  private get<T extends HTMLElement = HTMLElement>(selector: string): T { return this.root.querySelector<T>(selector)!; }
  private canPlay(): boolean { return this.running && !this.paused && !this.play.done; }
  private updateAudio(): void { this.get('[data-rite-audio]').textContent = this.sound.muted ? 'Ativar som' : 'Som ativado · silenciar'; }
  private pause(value: boolean): void {
    this.paused = value; this.play.holding = false; this.play.charge = 0; this.play.steering = 0;
    this.get('[data-rite-pause]').textContent = value ? 'Retomar participação' : 'Pausar participação';
    this.last = performance.now(); if (value) this.sound.stopRitual(); else this.sound.startRitual();
  }
  private complete(quality: number): void { if (this.consumed || this.disposed) return; this.consumed = true; this.sound.stopRitual(); this.commit(quality); }
  destroy(): void { this.disposed = true; cancelAnimationFrame(this.frame); this.abort.abort(); this.sound.stopRitual(); }
  private animate = (now: number): void => {
    if (this.disposed) return;
    if (this.canPlay()) this.play.tick(Math.min(.05, (now - this.last) / 1000));
    this.last = now; this.render(now / 1000);
    this.frame = requestAnimationFrame(this.animate);
  };
  private render(time: number): void {
    const p = this.play;
    if (this.running && p.done && !this.get('.rite-controls').hidden) {
      this.get('.rite-controls').hidden = true; this.get('[data-rite-pause]').hidden = true; this.sound.stopRitual();
      this.get('[data-rite-auto]').hidden = true;
      const bonus = participationBonus(RITUAL_XP[this.id], p.quality), result = this.get('.rite-result'); result.hidden = false;
      result.innerHTML = `<div><h3>${p.quality >= .8 ? 'Um vínculo em harmonia' : 'Cada gesto deixa uma memória'}</h3><p>${Math.round(p.quality * 100)}% de sintonia · <strong>+${bonus} XP ritual extra</strong></p><small>${this.id === 'cacau' ? 'O bônus vale para os companheiros disponíveis.' : 'Confirme para receber o XP ritual imediatamente.'}</small></div><button class="primary" data-rite-confirm>Confirmar cerimônia</button>`;
      this.get('[data-rite-confirm]').addEventListener('click', () => this.complete(p.quality), { signal: this.abort.signal });
    }
    this.get<HTMLProgressElement>('progress').value = Math.min(1, p.progress);
    this.get('.rite-instruction').hidden = !this.running || p.done;
    const status = p.done ? 'Sua preparação está pronta.' : this.paused ? 'Participação pausada. Retome quando quiser.' : p.id === 'kambo' ? p.observing ? 'Observe a sequência das pedras.' : `Sua vez · gesto ${p.memoryIndex + 1}/${p.pattern.length}` : p.feedback;
    if (status !== this.status) { this.get('[data-rite-feedback]').textContent = status; this.status = status; }
    this.get('[data-rite-stage]').textContent = p.done ? 'PREPARAÇÃO CONCLUÍDA' : !this.running ? 'PREPARAÇÃO' : this.paused ? 'PAUSADO' : 'EM PRESENÇA';
    this.get('[data-rite-round]').textContent = p.id === 'ayahuasca' ? `${Math.min(18, Math.floor(p.elapsed))} / 18 segundos` : `Gesto ${Math.min(p.round + 1, p.rounds)} de ${p.rounds}`;
    if (this.tapBreath) {
      const label = p.holding ? 'Soltar sopro' : 'Iniciar sopro', touch = this.get('[data-rite-touch]');
      if (touch.firstChild?.textContent !== label) touch.innerHTML = `${label}<small>Controle por dois toques</small>`;
    }
    if (this.canPlay()) {
      const cue = this.id === 'rape' && p.holding ? Math.floor(p.elapsed * 8) : this.id === 'ayahuasca' ? Math.floor(p.elapsed) : this.id === 'cacau' && p.position >= p.target ? p.round : -1;
      if (cue >= 0 && cue !== this.lastCue) { this.sound.ritualCue(this.id, cue, .3 + p.charge); this.lastCue = cue; }
      if (p.round !== this.lastRound && p.round > 0 && !['rape','cacau'].includes(this.id)) this.sound.ritualCue(this.id, p.round);
      if (p.litStone >= 0 && p.litStone !== this.lastStone) this.sound.ritualCue('kambo', p.litStone);
    }
    this.lastRound = p.round; this.lastStone = p.litStone;
    for (const stone of Array.from(this.root.querySelectorAll<HTMLElement>('[data-rite-stone]'))) { stone.classList.toggle('lit', !this.paused && Number(stone.dataset.riteStone) === p.litStone); (stone as HTMLButtonElement).disabled = p.observing || !this.canPlay(); }
    this.draw(this.reduced || this.paused ? 0 : time);
  }
  private draw(time: number): void {
    const c = this.context, p = this.play, accent = RITUAL_PLAY[this.id].color;
    c.clearRect(0, 0, 900, 440);
    const glow = c.createRadialGradient(450, 230, 20, 450, 230, 480); glow.addColorStop(0, '#233d3f'); glow.addColorStop(1, '#080f18'); c.fillStyle = glow; c.fillRect(0, 0, 900, 440);
    c.strokeStyle = '#668f8730'; c.lineWidth = 1;
    for (let i = 0; i < 22; i++) { const x = i * 43 + 4; c.beginPath(); c.moveTo(x, 440); c.lineTo(x+18, 160+i%4*18); c.lineTo(x+42,440); c.stroke(); }
    c.fillStyle = accent; for(let i=0;i<35;i++){ c.globalAlpha=.12+(i%4)*.06; c.beginPath(); c.arc((i*197)%900, 70+(i*71)%300+Math.sin(time+i)*3,1.5,0,Math.PI*2); c.fill(); } c.globalAlpha=1;
    c.strokeStyle=accent; c.lineWidth=2; c.shadowColor=accent; c.shadowBlur=16;
    if(this.id==='ayahuasca') {
      const bank = p.gentle ? 180 : 117;
      c.fillStyle='#bba5ed18'; c.beginPath();
      for(let y=80;y<=440;y+=4){const x=(.5+.28*Math.sin((p.elapsed+(270-y)/70)*.65)+.07*Math.sin((p.elapsed+(270-y)/70)*1.8))*900;c.lineTo(x-bank,y);} for(let y=440;y>=80;y-=4){const x=(.5+.28*Math.sin((p.elapsed+(270-y)/70)*.65)+.07*Math.sin((p.elapsed+(270-y)/70)*1.8))*900;c.lineTo(x+bank,y);}c.closePath();c.fill();c.stroke();
      c.fillStyle=accent;c.beginPath();c.arc(p.light*900,270,14,0,Math.PI*2);c.fill();
    } else if(this.id==='kambo') {
      const pattern=p.pattern; for(let i=0;i<pattern.length;i++){const x=450+(i-(pattern.length-1)/2)*70;c.globalAlpha=p.observing||p.gentle?1:i<p.memoryIndex?1:.18;c.beginPath();c.arc(x,220,22,0,Math.PI*2);c.stroke();c.fillStyle=accent;c.font='24px sans-serif';c.textAlign='center';c.fillText(p.observing||p.gentle?String(pattern[i]+1):i<p.memoryIndex?'✧':'·',x,228);}c.globalAlpha=1;
    } else if(this.id==='rape') {
      const x=170,y=240,w=560; c.strokeStyle='#ffffff28';c.strokeRect(x,y,w,22);c.fillStyle=accent+'55';c.fillRect(x+(p.target-.065)*w,y-10,.13*w,42);c.fillStyle=accent;c.fillRect(x,y,p.charge*w,22);
      c.strokeStyle=accent;for(let i=0;i<4;i++){c.beginPath();c.arc(450,170,24+i*17+p.charge*15,Math.PI*.12,Math.PI*.88);c.stroke();} c.font='16px sans-serif';c.textAlign='center';c.fillText(p.holding?'Soprando… solte na faixa':'Segure. Encontre a faixa. Solte.',450,310);
    } else {
      const radius=40+p.position*125,target=40+p.target*125;c.globalAlpha=.3;c.lineWidth=18;c.beginPath();c.arc(450,240,target,0,Math.PI*2);c.stroke();c.globalAlpha=1;c.lineWidth=3;c.beginPath();c.arc(450,240,radius,0,Math.PI*2);c.stroke();c.font='40px serif';c.fillStyle=accent;c.textAlign='center';c.fillText(this.id==='cacau'?'♡':'◉',450,254);
    }
    c.shadowBlur=0;c.globalAlpha=1;
  }
}
