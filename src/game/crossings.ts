import { nextRandom } from './roster';
import type { Stage } from './campaign';

export type RouteId = 'ridge' | 'river' | 'ruins';
export type AffinityId = 'scattered' | 'healing' | 'prey' | 'opening' | 'roots' | 'echo';
export type ObjectiveKind = 'altar' | 'seals';
export type Point = { x: number; y: number };
export interface CrossingRun {
  seed: number; guide: number; route: RouteId; tier: number; node: number;
  mode: 'explore' | 'prepare' | 'battle' | 'complete'; position: Point;
  affinities: AffinityId[]; threat: number; strain: number; choices: string[];
  objective: ObjectiveKind; directive: 'guard' | 'focus' | 'balanced';
  amber: number; xp: number; loot: string[]; failures: number;
}
export interface CrossingChronicle {
  visits: number; discoveries: string[]; routes: RouteId[]; chapters: Record<string, number>;
  specializations: Record<string, string>; scenarios: string[]; active: CrossingRun | null;
}
export const CROSSING_START: Point = { x: 760, y: 830 };
export const GUIDES = [1, 2, 3] as const;
export const GUIDE_STORIES:Record<number,{gift:string;tracks:string;glyphs:string}> = {
  1:{gift:'Presa marcada · 4s',tracks:'Akru reconhece o sinal de uma matilha que atravessou a margem antes da tribo. As pegadas contam quem abriu o caminho e quem ficou para proteger os outros.',glyphs:'A pedra guarda a resposta da antiga matilha: uma presa pode chamar os companheiros ou enfrentar o perigo sozinha. Akru leva essa escolha para sua próxima batalha.'},
  2:{gift:'Desgaste −4',tracks:'Nima encontra fios de seda entre as marcas no barro. Eles guardam a memória de pequenas criaturas que mantiveram as duas margens unidas.',glyphs:'Os fios alcançam a pedra esquecida. Nima reconhece duas formas de preservar a trama: proteger seus companheiros ou fortalecer a ninhada que guarda o caminho.'},
  3:{gift:'Altar +12% de vida',tracks:'Boru toca o barro seco junto às pegadas. Uma antiga guarda ergueu este caminho para que a manada pudesse atravessar em segurança.',glyphs:'A pedra revela quem sustentou a passagem quando a margem cedeu. Boru aprende a repartir sua proteção e a concentrar a força numa investida.'},
};
export const ROUTES: { id: RouteId; name: string; subtitle: string; icon: string; reward: string; challenge: string; points: Point[] }[] = [
  { id: 'ridge', name: 'Crista da matilha', subtitle: 'Pegadas entre raízes e pedras.', icon: 'mountain', reward: 'Presa · dano coordenado', challenge: 'Flancos abertos', points: [{x:545,y:725},{x:395,y:470},{x:380,y:290},{x:505,y:185},{x:660,y:155},{x:815,y:95}] },
  { id: 'river', name: 'Vozes do rio', subtitle: 'O reflexo revela outra passagem.', icon: 'waves', reward: 'Raiz · cura e proteção', challenge: 'Defender o altar', points: [{x:815,y:690},{x:685,y:465},{x:835,y:390},{x:980,y:300},{x:925,y:175},{x:815,y:95}] },
  { id: 'ruins', name: 'Memória das ruínas', subtitle: 'Símbolos sob a pedra antiga.', icon: 'landmark', reward: 'Pena · conjuração', challenge: 'Romper os selos', points: [{x:1040,y:735},{x:1200,y:600},{x:1110,y:420},{x:1145,y:265},{x:990,y:175},{x:815,y:95}] },
];
export const NODE_NAMES = ['Rastros na margem', 'Um encontro no caminho', 'O altar desperto', 'A linguagem das pedras', 'O preço da passagem', 'O guardião do Igarapé'];
export const AFFINITIES: { id: AffinityId; name: string; icon: string; text: string; advice: string }[] = [
  {id:'scattered',name:'Guarda dispersa',icon:'scan',text:'Aliados sem vizinhos recebem escudo de 22% da vida no início.',advice:'Separe atiradores e conjuradores; preserve a frente.'},
  {id:'healing',name:'Eco da cura',icon:'heart',text:'35% da cura excedente se torna escudo, limitado a 25% da vida.',advice:'Valorize Xamãs, sustentação e itens de cura.'},
  {id:'prey',name:'Uma só presa',icon:'crosshair',text:'Ataques contra inimigos marcados causam 18% mais dano.',advice:'Combine Caçadores e heróis que marcam alvos.'},
  {id:'opening',name:'Primeiro clarão',icon:'zap',text:'Comece com 18 de mana. Cada herói recupera 12 de mana após sua primeira habilidade.',advice:'Antecipe controle e conjurações da retaguarda.'},
  {id:'roots',name:'Raízes firmes',icon:'shield',text:'A primeira fileira recebe 18 de armadura, mas tem 8% menos velocidade de ataque.',advice:'Tanques protegem os aliados enquanto o dano vem de trás.'},
  {id:'echo',name:'Laço da margem',icon:'link',text:'Na primeira conjuração, proteja o aliado mais ferido com escudo de 18% da vida.',advice:'Conjuradores também sustentam uma formação pequena.'},
];
export interface CrossingEvent { id: string; title: string; text: string; choices: {id:string;name:string;text:string; effect:'component'|'insight'|'risk'|'rest'|'recipe'|'shelter'}[] }
export const CROSSING_EVENTS: CrossingEvent[] = [
  {id:'keeper',title:'A guardiã da margem',text:'Uma viajante protege as cinzas de um antigo altar. Ela conhece um caminho seguro, mas pede que a tribo guarde a passagem.',choices:[{id:'listen',name:'Ouvir sua história',text:'Descoberta e conhecimento. Próximos inimigos: +8% de dano.',effect:'insight'},{id:'shelter',name:'Aceitar abrigo',text:'Escudo inicial de 10% no próximo confronto; sem componente.',effect:'shelter'}]},
  {id:'forge',title:'A forja adormecida',text:'Entre as pedras, uma ferramenta ainda pulsa. O rio parece guardar a memória de quem a criou.',choices:[{id:'recipe',name:'Reconstruir a memória',text:'Descubra uma receita da rota. Comece o próximo combate com 8% menos vida.',effect:'recipe'},{id:'parts',name:'Recolher uma peça',text:'Receba o componente da rota; próximos inimigos: +8% de dano.',effect:'component'}]},
  {id:'bridge',title:'A ponte das raízes',text:'A ponte range. Uma trilha sob as raízes evita a correnteza; um brilho do outro lado convida a avançar.',choices:[{id:'risk',name:'Seguir o brilho',text:'Componente e afinidade adicional para escolher. Próximos inimigos: +15% de dano.',effect:'risk'},{id:'rest',name:'Seguir as raízes',text:'Retire o desgaste acumulado e reduza a ameaça em 8%.',effect:'rest'}]},
  {id:'tracks',title:'A presa ferida',text:'O guardião reconhece o rastro de uma criatura acuada. Alguém a levou em direção às ruínas.',choices:[{id:'listen',name:'Investigar o rastro',text:'Descoberta e conhecimento. Próximos inimigos: +8% de dano.',effect:'insight'},{id:'shelter',name:'Marcar uma passagem segura',text:'Escudo inicial de 10% no próximo confronto.',effect:'shelter'}]},
  {id:'offering',title:'A oferenda esquecida',text:'Um componente repousa num círculo de pedras. O vento muda quando você se aproxima.',choices:[{id:'parts',name:'Aceitar a oferenda',text:'Componente da rota; próximos inimigos: +8% de dano.',effect:'component'},{id:'recipe',name:'Decifrar as marcas',text:'Descubra uma receita. Comece o próximo combate com 8% menos vida.',effect:'recipe'}]},
  {id:'reflection',title:'O outro lado do reflexo',text:'Na água, a formação aparece numa disposição diferente. O reflexo espera uma escolha.',choices:[{id:'risk',name:'Atravessar o reflexo',text:'Componente e nova escolha de afinidade. Próximos inimigos: +15% de dano.',effect:'risk'},{id:'rest',name:'Acalmar as águas',text:'Retire o desgaste e reduza a ameaça em 8%.',effect:'rest'}]},
];
export const SPECIALIZATIONS = [
  {id:'lone',hero:1,name:'Presa solitária',text:'Akru: +22% de poder da habilidade; −12% de vida.'},
  {id:'pack',hero:1,name:'Voz da matilha',text:'Após conjurar, Akru acelera os aliados próximos por 3s; −12% de ataque.'},
  {id:'weaver',hero:2,name:'Seda protetora',text:'Nima cura o aliado mais ferido em 8% da vida após conjurar; −15% de poder da habilidade.'},
  {id:'brood',hero:2,name:'Ninhada viva',text:'As invocações de Nima têm +18% de vida e ataque; Nima tem −12% de vida.'},
  {id:'shelter',hero:3,name:'Abrigo da manada',text:'Boru protege aliados adjacentes com escudo inicial de 16% da sua vida; −10 de armadura.'},
  {id:'charge',hero:3,name:'Chifre indomável',text:'Boru: +22% de ataque; −12 de armadura.'},
];
export const SCENARIOS = [
  {id:'last-stand',name:'A última margem',objective:'altar' as const,description:'Seis guardiões. Proteja o altar contra dois flancos.',heroes:[3,1,7,12,11,13],enemies:[1,7,12,8,3,4]},
  {id:'broken-seals',name:'Três selos, uma saída',objective:'seals' as const,description:'Alcance os selos antes que a conjuração termine.',heroes:[1,5,6,8,11,13],enemies:[3,4,7,9,12,13]},
  {id:'silk-watch',name:'A vigília da seda',objective:'altar' as const,description:'Invocações e cura sustentam uma defesa pequena.',heroes:[2,3,4,10,11,13],enemies:[1,5,6,7,8,12]},
  {id:'silent-ruins',name:'As ruínas silenciosas',objective:'seals' as const,description:'Uma equipe de conjuradores precisa abrir a passagem.',heroes:[2,5,9,10,11,13],enemies:[1,3,4,6,7,8]},
];
export const routeOf = (id: RouteId) => ROUTES.find(r=>r.id===id)!;
export const crossingPath = (run: CrossingRun) => [CROSSING_START,...routeOf(run.route).points];
export const pointDistance = (a:Point,b:Point) => Math.hypot(a.x-b.x,a.y-b.y);
export function pathProjection(point:Point,path:Point[]): Point {
  let nearest=path[0],best=Infinity;
  for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i],length=(b.x-a.x)**2+(b.y-a.y)**2;
    const t=Math.max(0,Math.min(1,((point.x-a.x)*(b.x-a.x)+(point.y-a.y)*(b.y-a.y))/length));
    const p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},d=pointDistance(p,point);
    if(d<best){best=d;nearest=p;}
  }return nearest;
}
export const atCrossingNode = (run:CrossingRun) => pointDistance(run.position,routeOf(run.route).points[Math.min(5,run.node)])<115;
export const freshChronicle = (): CrossingChronicle => ({visits:0,discoveries:[],routes:[],chapters:{1:0,2:0,3:0},specializations:{},scenarios:[],active:null});
export function createCrossing(seed:number,guide:number,route:RouteId,tier:number):CrossingRun {
  return {seed,guide,route,tier,node:0,mode:'explore',position:{...CROSSING_START},affinities:[],threat:0,strain:0,choices:[],objective:route==='ruins'?'seals':'altar',directive:route==='ruins'?'focus':'guard',amber:0,xp:0,loot:[],failures:0};
}
const bounded=(v:unknown,max:number,fallback=0)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):fallback;
const strings=(v:unknown)=>Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'&&x.length<100):[];
export function sanitizeChronicle(value:unknown):CrossingChronicle {
  const s=value&&typeof value==='object'?value as Record<string,unknown>:{};
  const out=freshChronicle();out.visits=bounded(s.visits,1e6);
  const knownDiscovery=(id:string)=>/^route:(ridge|river|ruins)$|^clue:(ridge|river|ruins):(tracks|glyphs)$|^event:(keeper|forge|bridge|tracks|offering|reflection)$|^recipe:(ridge|river|ruins)$|^encounter:(ridge|river|ruins):[1-3]:[25]$/.test(id);
  out.discoveries=[...new Set(strings(s.discoveries).filter(knownDiscovery))];
  out.routes=[...new Set(strings(s.routes).filter((id):id is RouteId=>ROUTES.some(r=>r.id===id)))];
  const chapters=s.chapters&&typeof s.chapters==='object'?s.chapters as Record<string,unknown>:{};
  const specs=s.specializations&&typeof s.specializations==='object'?s.specializations as Record<string,unknown>:{};
  for(const id of GUIDES){out.chapters[id]=bounded(chapters[id],2);if(out.chapters[id]>=2&&SPECIALIZATIONS.some(d=>d.hero===id&&d.id===specs[id]))out.specializations[id]=specs[id] as string;}
  out.scenarios=[...new Set(strings(s.scenarios).filter(id=>SCENARIOS.some(d=>d.id===id)))];
  const a=s.active&&typeof s.active==='object'?s.active as Record<string,unknown>:null;
  if(a&&ROUTES.some(r=>r.id===a.route)&&GUIDES.includes(a.guide as 1|2|3)){
    const run=createCrossing(bounded(a.seed,4294967295,7),a.guide as number,a.route as RouteId,Math.max(1,bounded(a.tier,3,1)));
    run.node=bounded(a.node,6);run.mode=a.mode==='complete'&&run.node===6?'complete':(a.mode==='prepare'||a.mode==='battle')&&[2,5].includes(run.node)?'prepare':'explore';
    if(run.node===6)run.mode='complete';
    run.affinities=[...new Set(strings(a.affinities).filter((id):id is AffinityId=>AFFINITIES.some(d=>d.id===id)))].slice(0,2);
    run.threat=bounded(a.threat,40);run.strain=bounded(a.strain,24);run.choices=strings(a.choices).slice(0,10);
    run.objective=run.node===5?'seals':run.route==='ruins'?'seals':'altar';
    run.directive=a.directive==='focus'||a.directive==='balanced'?a.directive:'guard';
    run.amber=bounded(a.amber,1e7);run.xp=bounded(a.xp,1e8);run.loot=strings(a.loot).slice(0,20);run.failures=bounded(a.failures,1e6);
    const p=a.position&&typeof a.position==='object'?a.position as Record<string,unknown>:{};
    const pos={x:bounded(p.x,1536,CROSSING_START.x),y:bounded(p.y,1024,CROSSING_START.y)};
    run.position=pathProjection(pos,crossingPath(run));out.active=run;
  }return out;
}
export function affinityOffers(run:CrossingRun,extra=0): typeof AFFINITIES {
  let seed=(run.seed+run.node*197+extra*619)>>>0;
  const pool=AFFINITIES.filter(a=>!run.affinities.includes(a.id));
  const favored=run.route==='ridge'?'prey':run.route==='river'?'healing':'opening';
  const first=pool.find(a=>a.id===favored);const offers=first?[first]:[];
  const rest=pool.filter(a=>a!==first);
  while(offers.length<3&&rest.length){const roll=nextRandom(seed);seed=roll.seed;offers.push(rest.splice(Math.floor(roll.value*rest.length),1)[0]);}
  return offers;
}
export function crossingEvent(run:CrossingRun):CrossingEvent {
  const offset=run.route==='ridge'?0:run.route==='river'?2:4;
  const roll=nextRandom((run.seed+offset*31)>>>0);
  return CROSSING_EVENTS[(Math.floor(roll.value*3)*2+(run.node===4?1:0)+offset)%CROSSING_EVENTS.length];
}
export const PUZZLE_SYMBOLS=['Presa','Onda','Raiz','Lua'] as const;
export function puzzleSequence(run:CrossingRun): number[] {
  let seed=(run.seed+run.node*271)>>>0;const remaining=[0,1,2,3],order:number[]=[];
  while(remaining.length){const roll=nextRandom(seed);seed=roll.seed;order.push(remaining.splice(Math.floor(roll.value*remaining.length),1)[0]);}
  return run.node===0?order.slice(0,3):order;
}
export function crossingStage(run:CrossingRun):{stage:Stage;level:number} {
  const level=1+(run.tier-1)*6;
  const pool=run.route==='ridge'?[7,12,1,3,8,6,5,13]:run.route==='river'?[9,6,4,2,7,11,3,12]:[5,10,13,3,4,8,7,11];
  const count=run.tier===1?2:run.tier===2?7:12;
  const units=Array.from({length:count},(_,i)=>({id:pool[(i+(run.seed%pool.length))%pool.length],stars:run.tier===3?2:1}));
  if(run.node===5)units[0]={id:run.route==='ridge'?1:run.route==='river'?17:29,stars:run.tier===3?2:1,...{boss:true}};
  return {level,stage:{id:-101-run.tier,region:run.route==='ruins'?3:run.route==='river'?2:1,index:run.node===5?5:3,name:run.node===5?'O guardião do Igarapé':'A vigília da margem',units}};
}
export function recordDiscovery(chronicle:CrossingChronicle,id:string):boolean {
  if(chronicle.discoveries.includes(id))return false;chronicle.discoveries.push(id);return true;
}
export function completeCrossing(chronicle:CrossingChronicle):void {
  const run=chronicle.active;if(!run)return;
  run.node=6;run.mode='complete';chronicle.visits++;
  if(!chronicle.routes.includes(run.route))chronicle.routes.push(run.route);
  recordDiscovery(chronicle,`route:${run.route}`);chronicle.chapters[run.guide]=2;
}
