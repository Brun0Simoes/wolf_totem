import { ritualMode } from './nightRituals';
import type { PracticeId } from './tribe';

export const RITUAL_PLAY = {
  rape: { title: 'O sopro da presença', verb: 'Segure para soprar', instruction: 'Segure o botão ou Espaço. Solte quando a energia alcançar a faixa iluminada. São três sopros.', sound: 'Ar, vento e sementes', color: '#d9b479' },
  sananga: { title: 'O centro da visão', verb: 'Firmar o foco', instruction: 'Toque ou pressione Espaço quando o círculo alcançar o anel iluminado. Encontre o foco quatro vezes.', sound: 'Gotas e ressonâncias claras', color: '#8cded3' },
  kambo: { title: 'A memória da terra', verb: 'Repetir a sequência', instruction: 'Observe as pedras acenderem e repita a sequência. Use os quatro botões ou as teclas 1 a 4.', sound: 'Tambor grave e madeira', color: '#b5ca82' },
  ayahuasca: { title: 'O rio das mirações', verb: 'Conduzir a luz', instruction: 'Mantenha a luz dentro do rio. Segure as setas, use ← e → ou deslize o dedo pelo campo.', sound: 'Cordas de luz e camadas de água', color: '#bba5ed' },
  cacau: { title: 'O pulso da roda', verb: 'Marcar o pulso', instruction: 'Toque ou pressione Espaço quando o círculo alcançar o coração. Acompanhe oito pulsações.', sound: 'Batida dupla e chocalho suave', color: '#edac86' },
  consecration: {title:'O selo da Vigília',verb:'Consagrar a lâmina',instruction:'Toque ou pressione Espaço quando a luz encontrar o selo, quatro vezes.',sound:'Metal, sino e ressonância luminosa',color:'#e4c894'},
  'blood-pact': {title:'O pulso rubro',verb:'Vincular o pulso',instruction:'Toque ou pressione Espaço acompanhando oito pulsações do relicário.',sound:'Pulso grave e cordas sombrias',color:'#e793a9'},
  'soul-forge': {title:'A ordem das almas',verb:'Forjar o sigilo',instruction:'Observe os quatro sigilos e repita a sequência. Use os botões ou as teclas 1 a 4.',sound:'Bigorna, fogo e vozes espectrais',color:'#afa7ec'},
  'speaker-seal': {title:'As quatro palavras',verb:'Traçar a runa',instruction:'Observe as runas e repita a sequência. Use os botões ou as teclas 1 a 4.',sound:'Cristal e notas elementais',color:'#98cfea'},
  'ancestral-song': {title:'O canto da memória',verb:'Acompanhar a nota',instruction:'Toque ou pressione Espaço em oito notas no centro do círculo.',sound:'Cordas e acordes de lembrança',color:'#b9d6b0'},
  eclipse: {title:'A centelha no eclipse',verb:'Conduzir a centelha',instruction:'Mantenha a centelha dentro do caminho de luz. Use as setas ou arraste pelo campo.',sound:'Ressonância grave e coro distante',color:'#d0aedc'},
  requiem: {title:'As notas do despertar',verb:'Tocar o réquiem',instruction:'Toque ou pressione Espaço quando cada nota alcançar o centro. Acompanhe oito notas do despertar.',sound:'Cordas elétricas suaves e acorde grave',color:'#ca91bf'},
  'first-blood': {title:'A memória do primeiro sangue',verb:'Firmar o selo',instruction:'Toque ou pressione Espaço quando o círculo encontrar o selo dourado. Complete quatro selos da linhagem.',sound:'Sino de bronze e pulso ancestral',color:'#e6bf81'},
} satisfies Record<PracticeId, { title: string; verb: string; instruction: string; sound: string; color: string }>;

/** Participation improves learning by at most 20%; it never shortens integration. */
export function participationBonus(base: number, quality: number): number {
  return Math.round(base * .2 * (Number.isFinite(quality) ? Math.max(0, Math.min(1, quality)) : 0));
}

/** Short, renderer-independent games. Time advances only while the player is present. */
export class RitualPlay {
  elapsed = 0;
  phase = 0;
  round = 0;
  holding = false;
  charge = 0;
  light = .5;
  steering = 0;
  feedback = 'Encontre seu ritmo.';
  lastQuality = -1;
  points: number[] = [];
  memoryIndex = 0;
  done = false;
  private aligned = 0;
  readonly rounds: number;
  constructor(readonly id: PracticeId, readonly seed = 1, readonly gentle = false) {
    const idMode=ritualMode(id);
    this.rounds = idMode === 'rape' ? 3 : idMode === 'sananga' ? 4 : idMode === 'kambo' ? 3 : idMode === 'cacau' ? 8 : 1;
  }
  get target(): number { return ritualMode(this.id) === 'rape' ? .55 + this.round * .1 : .65; }
  get position(): number { return ritualMode(this.id) === 'sananga' ? (1 - Math.cos(this.phase * Math.PI * 2 / 3)) / 2 : this.phase / 1.8; }
  get river(): number { return .5 + .28 * Math.sin(this.elapsed * .65) + .07 * Math.sin(this.elapsed * 1.8); }
  get pattern(): number[] {
    return Array.from({ length: this.round + 3 }, (_, i) => Math.floor(Math.abs(Math.sin((this.seed % 997 + this.round * 17 + i * 31) * 12.9898) * 43758)) % 4);
  }
  get observing(): boolean { return ritualMode(this.id) === 'kambo' && this.phase < this.pattern.length * .9 + .4; }
  get litStone(): number { return this.observing && this.phase % .9 < .6 ? this.pattern[Math.floor(this.phase / .9)] ?? -1 : -1; }
  get quality(): number { return this.points.length ? this.points.reduce((a, b) => a + b, 0) / this.points.length : 0; }
  get progress(): number { return ritualMode(this.id) === 'ayahuasca' ? this.elapsed / 18 : this.round / this.rounds; }
  tick(seconds: number): void {
    if (this.done || !Number.isFinite(seconds) || seconds <= 0) return;
    const dt = Math.min(seconds, .05);
    this.elapsed += dt; this.phase += dt;
    if (ritualMode(this.id) === 'rape' && this.holding) {
      this.charge = Math.min(1, this.charge + dt * .48);
      if (this.charge >= 1) this.release();
    }
    if (ritualMode(this.id) === 'cacau' && this.phase >= 1.8) this.record(0);
    if (ritualMode(this.id) === 'ayahuasca') {
      this.light = Math.max(.06, Math.min(.94, this.light + this.steering * dt * .42));
      const inside = Math.abs(this.light - this.river) <= (this.gentle ? .2 : .13);
      if (inside) this.aligned += dt;
      this.feedback = inside ? 'Em fluxo. A luz acompanha o rio.' : 'Volte ao rio de luz.';
      if (this.elapsed >= 18) this.record(Math.min(1, this.aligned / 18));
    }
    if (this.elapsed >= 45 && !this.done) {
      while (this.points.length < this.rounds) this.points.push(0);
      this.done = true; this.holding = false; this.feedback = 'A preparação chegou ao fim.';
    }
  }
  press(stone?: number): void {
    if (this.done) return;
    if (ritualMode(this.id) === 'rape') this.holding = true;
    else if (ritualMode(this.id) === 'sananga' || ritualMode(this.id) === 'cacau') {
      const width = this.gentle ? .3 : ritualMode(this.id) === 'sananga' ? .22 : .2;
      this.record(Math.max(0, 1 - Math.abs(this.position - this.target) / width));
    } else if (ritualMode(this.id) === 'kambo' && !this.observing && stone !== undefined) {
      if (stone !== this.pattern[this.memoryIndex]) this.record(this.memoryIndex / this.pattern.length);
      else if (++this.memoryIndex === this.pattern.length) this.record(1);
    }
  }
  release(): void {
    if (ritualMode(this.id) !== 'rape' || !this.holding || this.done) return;
    this.holding = false;
    this.record(Math.max(0, 1 - Math.abs(this.charge - this.target) / (this.gentle ? .32 : .22)));
    this.charge = 0;
  }
  private record(quality: number): void {
    this.lastQuality = quality;
    this.points.push(quality); this.round++; this.phase = 0; this.memoryIndex = 0;
    this.feedback = quality >= .8 ? 'Em harmonia.' : quality >= .4 ? 'O vínculo se aproxima.' : 'Respire. O próximo gesto é uma nova chance.';
    if (this.round >= this.rounds) this.done = true;
  }
}
