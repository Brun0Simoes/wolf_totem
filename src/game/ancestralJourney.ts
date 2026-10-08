import type { GameState, Resources } from './simulation';

export type LegacyId='roots'|'forge'|'tracking'|'learning'|'vigor'|'tactics'|'guard'|'resolve'|'insight'|'ceremony'|'ward'|'channel';
export type PreparationId='feast'|'warpaint'|'incense'|'bark'|'amulet'|'spring';
export type JourneyBranch='war'|'wild'|'spirit';
export type TrialId='combat'|'hunt'|'ritual';
export interface AncestralJourney {
  knowledge:number;legacies:Partial<Record<LegacyId,number>>;focusTraits:string[];
  preparations:Partial<Record<PreparationId,number>>;selected:PreparationId[];
  trial:{id:TrialId;start:number}|null;completed:number;migrated:boolean;
}
export interface LegacyDef {id:LegacyId;branch:JourneyBranch;name:string;icon:string;text:string;era:number;parent?:LegacyId}
export const JOURNEY_BRANCHES:Record<JourneyBranch,{name:string;animal:string;color:string;description:string}>={
  war:{name:'Caminho da Matilha',animal:'wolf',color:'#d8af72',description:'Resistência, ataque e proteção para quem luta pela tribo.'},
  wild:{name:'Caminho das Raízes',animal:'bear',color:'#91bf9a',description:'Provisões, caçadas, aprendizado e uma forja mais produtiva.'},
  spirit:{name:'Caminho do Encanto',animal:'owl',color:'#a4b7db',description:'Conjurações, cerimônias e proteção espiritual.'},
};
export const LEGACIES:LegacyDef[]=[
  {id:'vigor',branch:'war',name:'Coração da Matilha',icon:'heart',text:'+3% de vida dos heróis por nível.',era:1},
  {id:'tactics',branch:'war',name:'Dentes do Lobo',icon:'swords',text:'+3% de ataque dos heróis por nível.',era:1,parent:'vigor'},
  {id:'guard',branch:'war',name:'Pele de Pedra',icon:'shield',text:'Escudo inicial de 3% da vida por nível.',era:2,parent:'tactics'},
  {id:'resolve',branch:'war',name:'Passo de Guerra',icon:'wind',text:'+3% de velocidade de ataque por nível.',era:3,parent:'guard'},
  {id:'roots',branch:'wild',name:'Raízes Profundas',icon:'sprout',text:'+8% de produção de provisões por nível.',era:1},
  {id:'learning',branch:'wild',name:'Memória dos Caminhos',icon:'book-open',text:'+4% de experiência de atividades por nível.',era:1,parent:'roots'},
  {id:'tracking',branch:'wild',name:'Olhos da Mata',icon:'crosshair',text:'+2 pontos percentuais de sucesso nas caçadas por nível.',era:2,parent:'learning'},
  {id:'forge',branch:'wild',name:'Mãos de Osso',icon:'anvil',text:'+10% de produção da forja por nível.',era:3,parent:'tracking'},
  {id:'insight',branch:'spirit',name:'Voz do Encanto',icon:'sparkles',text:'+4% de poder de habilidade por nível.',era:1},
  {id:'ceremony',branch:'spirit',name:'Círculo dos Ancestrais',icon:'flame',text:'+4% de experiência ritual por nível.',era:1,parent:'insight'},
  {id:'ward',branch:'spirit',name:'Véu Protetor',icon:'feather',text:'+4 de resistência mágica e 4% de proteção contra perdas em ataques à tribo por nível.',era:2,parent:'ceremony'},
  {id:'channel',branch:'spirit',name:'Primeira Palavra',icon:'moon',text:'+5 de mana inicial dos heróis por nível.',era:3,parent:'ward'},
];
const cost=(food:number,spirit=0,wood=0,stone=0):Resources=>({food,spirit,wood,stone});
export const PREPARATIONS:{id:PreparationId;name:string;icon:string;text:string;cost:Resources;era:number}[]=[
  {id:'feast',name:'Banquete da partida',icon:'cooking-pot',text:'+12% de vida para a formação durante uma expedição.',cost:cost(80,0,20),era:1},
  {id:'warpaint',name:'Pintura de guerra',icon:'swords',text:'+8% de ataque para a formação durante uma expedição.',cost:cost(40,25,0,20),era:1},
  {id:'incense',name:'Fumaça do encanto',icon:'sparkles',text:'+12 de mana inicial para a formação durante uma expedição.',cost:cost(20,60),era:2},
  {id:'bark',name:'Resina de casca',icon:'shield',text:'+12 de armadura para a formação durante uma expedição.',cost:cost(30,0,60),era:1},
  {id:'amulet',name:'Amuleto de proteção',icon:'feather',text:'+15 de resistência mágica para a formação durante uma expedição.',cost:cost(0,50,0,35),era:2},
  {id:'spring',name:'Água da nascente',icon:'droplets',text:'Regenera 0,5% da vida máxima por segundo durante uma expedição.',cost:cost(60,45),era:3},
];
export const TRIALS:{id:TrialId;name:string;icon:string;text:string;goal:number;reward:number;stat:'victories'|'hunts'|'rituals'}[]=[
  {id:'combat',name:'Provar a coragem',icon:'swords',text:'Vença duas batalhas após assumir este desafio.',goal:2,reward:3,stat:'victories'},
  {id:'hunt',name:'Ouvir a mata',icon:'trees',text:'Conclua uma caçada após assumir este desafio.',goal:1,reward:4,stat:'hunts'},
  {id:'ritual',name:'Honrar o encanto',icon:'flame',text:'Conclua uma cerimônia após assumir este desafio.',goal:1,reward:5,stat:'rituals'},
];
export const legacyLevel=(s:GameState,id:LegacyId)=>s.journey.legacies[id]??0;
export const legacyCost=(level:number)=>3+level*3;
export function legacyLock(s:GameState,d:LegacyDef):string|null {
  if(legacyLevel(s,d.id)>=3)return 'Legado completo';
  if(s.villageLevel<d.era)return `Exige Era ${d.era}`;
  if(d.parent&&!legacyLevel(s,d.parent))return `Abra ${LEGACIES.find(l=>l.id===d.parent)!.name}`;
  return null;
}
export function trialProgress(s:GameState):number {
  const active=s.journey.trial,def=TRIALS.find(t=>t.id===active?.id);
  return active&&def?Math.max(0,Math.min(def.goal,s.stats[def.stat]-active.start)):0;
}
export const initialJourney=():AncestralJourney=>({knowledge:3,legacies:Object.fromEntries(LEGACIES.map(d=>[d.id,0])),focusTraits:[],preparations:Object.fromEntries(PREPARATIONS.map(d=>[d.id,0])),selected:[],trial:null,completed:0,migrated:false});
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const int=(v:unknown,max:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
export function sanitizeJourney(value:unknown):AncestralJourney {
  const v=object(value),l=object(v.legacies),p=object(v.preparations),t=object(v.trial);
  return {knowledge:int(v.knowledge,1e6),legacies:Object.fromEntries(LEGACIES.map(d=>[d.id,int(l[d.id],3)])),
    preparations:Object.fromEntries(PREPARATIONS.map(d=>[d.id,int(p[d.id],5)])),selected:Array.isArray(v.selected)?[...new Set(v.selected.filter(id=>PREPARATIONS.some(p=>p.id===id)))].slice(0,2) as PreparationId[]:[],
    focusTraits:Array.isArray(v.focusTraits)?[...new Set(v.focusTraits.filter(t=>typeof t==='string'))].slice(0,2) as string[]:[],
    trial:TRIALS.some(d=>d.id===t.id)?{id:t.id as TrialId,start:int(t.start,1e9)}:null,completed:int(v.completed,1e9),migrated:v.migrated===true};
}
/** One-time conversion: deliver paid workshop upgrades, refund unfinished civic orders and credit removed investments. */
export function migrateSettlement(s:GameState,value:unknown):void {
  const v=object(value),research=object(v.research),sites=object(v.sites);
  const ids=new Set<number>();
  for(const raw of Array.isArray(v.orders)?v.orders.slice(0,12):[]){
    const o=object(raw),id=int(o.id,1e9);if(!id||ids.has(id))continue;ids.add(id);
    if(o.kind==='building'&&Object.hasOwn(s.buildings,String(o.target))){const key=o.target as keyof typeof s.buildings;s.buildings[key]=Math.max(s.buildings[key],int(o.level,15));}
    else if(['infrastructure','train','scout','claim','research'].includes(String(o.kind))){const c=object(o.cost);for(const r of ['wood','food','stone','spirit'] as const)s.resources[r]=Math.min(1e12,s.resources[r]+int(c[r],1e6));}
  }
  s.journey.knowledge+=Math.min(60,Object.values(sites).filter(id=>['housing','store','farm','watchtower','market'].includes(String(id))).length*2+['tools','tracking','sentinels','warfare'].reduce((n,k)=>n+int(research[k],3)*3,0)+Math.max(0,(Array.isArray(v.citizens)?v.citizens.length:4)-4));
  s.journey.focusTraits=Array.isArray(v.focusTraits)?v.focusTraits.filter(t=>typeof t==='string').slice(0,2) as string[]:[];
  s.journey.migrated=Object.keys(v).length>0;
}
