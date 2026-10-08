import type { GameState } from './simulation';

export type LegacyId='roots'|'forge'|'tracking'|'learning'|'vigor'|'tactics'|'guard'|'resolve'|'insight'|'ceremony'|'ward'|'channel';
export type PreparationId='feast'|'warpaint'|'incense'|'bark'|'amulet'|'spring';
export type JourneyBranch='war'|'wild'|'spirit';
export type TrialId='combat'|'hunt'|'ritual';
export interface AncestralJourney {
  knowledge:number;legacies:Partial<Record<LegacyId,number>>;focusTraits:string[];
  selected:PreparationId[];
  trial:{id:TrialId;start:number}|null;completed:number;migrated:boolean;
}
export interface LegacyDef {id:LegacyId;branch:JourneyBranch;name:string;icon:string;text:string;era:number;parent?:LegacyId}
export const JOURNEY_BRANCHES:Record<JourneyBranch,{name:string;animal:string;color:string;description:string}>={
  war:{name:'Caminho da Matilha',animal:'wolf',color:'#d8af72',description:'Resistência, ataque e proteção para quem luta pela tribo.'},
  wild:{name:'Caminho das Raízes',animal:'bear',color:'#91bf9a',description:'Caçadas, aprendizado e descoberta de equipamentos.'},
  spirit:{name:'Caminho do Encanto',animal:'owl',color:'#a4b7db',description:'Conjurações, cerimônias e proteção espiritual.'},
};
export const LEGACIES:LegacyDef[]=[
  {id:'vigor',branch:'war',name:'Coração da Matilha',icon:'heart',text:'+3% de vida dos heróis por nível.',era:1},
  {id:'tactics',branch:'war',name:'Dentes do Lobo',icon:'swords',text:'+3% de ataque dos heróis por nível.',era:1,parent:'vigor'},
  {id:'guard',branch:'war',name:'Pele de Pedra',icon:'shield',text:'Escudo inicial de 3% da vida por nível.',era:2,parent:'tactics'},
  {id:'resolve',branch:'war',name:'Passo de Guerra',icon:'wind',text:'+3% de velocidade de ataque por nível.',era:3,parent:'guard'},
  {id:'roots',branch:'wild',name:'Raízes Profundas',icon:'sprout',text:'+8% de experiência nas caçadas por nível.',era:1},
  {id:'learning',branch:'wild',name:'Memória dos Caminhos',icon:'book-open',text:'+4% de experiência de atividades por nível.',era:1,parent:'roots'},
  {id:'tracking',branch:'wild',name:'Olhos da Mata',icon:'crosshair',text:'+2 pontos percentuais de sucesso nas caçadas por nível.',era:2,parent:'learning'},
  {id:'forge',branch:'wild',name:'Mãos de Osso',icon:'anvil',text:'+2 pontos percentuais de chance de componente nas caçadas por nível.',era:3,parent:'tracking'},
  {id:'insight',branch:'spirit',name:'Voz do Encanto',icon:'sparkles',text:'+4% de poder de habilidade por nível.',era:1},
  {id:'ceremony',branch:'spirit',name:'Círculo dos Ancestrais',icon:'flame',text:'+4% de experiência ritual por nível.',era:1,parent:'insight'},
  {id:'ward',branch:'spirit',name:'Véu Protetor',icon:'feather',text:'+4 de resistência mágica por nível.',era:2,parent:'ceremony'},
  {id:'channel',branch:'spirit',name:'Primeira Palavra',icon:'moon',text:'+5 de mana inicial dos heróis por nível.',era:3,parent:'ward'},
];
export const PREPARATIONS:{id:PreparationId;name:string;icon:string;text:string;era:number;practice?:'rape'|'sananga'|'kambo'|'ayahuasca';ritualLevel?:number}[]=[
  {id:'feast',name:'Vigor ancestral',icon:'heart',text:'+12% de vida para a formação.',era:2,practice:'kambo'},
  {id:'warpaint',name:'Olhar do caçador',icon:'crosshair',text:'+8% de ataque para a formação.',era:1,practice:'sananga'},
  {id:'incense',name:'Sopro do encanto',icon:'wind',text:'+12 de mana inicial para a formação.',era:1,practice:'rape'},
  {id:'bark',name:'Pele da mata',icon:'shield',text:'+12 de armadura para a formação.',era:2,ritualLevel:3},
  {id:'amulet',name:'Véu do cipó',icon:'feather',text:'+15 de resistência mágica para a formação.',era:3,practice:'ayahuasca'},
  {id:'spring',name:'Água da nascente',icon:'droplets',text:'Regenera 0,5% da vida máxima por segundo.',era:3,ritualLevel:5},
];
/** Ritual learning unlocks reusable blessings. No items or charges are spent. */
export function blessingLock(s:GameState,id:PreparationId):string|null {
  const d=PREPARATIONS.find(p=>p.id===id)!;
  if(s.era<d.era)return `Exige Era ${d.era}`;
  if(d.practice&&!s.heroes.some(h=>(h.rituals[d.practice!]??0)>0))return `Conclua ${d.practice==='rape'?'rapé':d.practice==='sananga'?'sananga':d.practice==='kambo'?'kambô':'ayahuasca'} com um herói`;
  if(d.ritualLevel&&!s.heroes.some(h=>h.ritualLevel>=d.ritualLevel!))return `Exige vínculo ritual ${d.ritualLevel}`;
  return null;
}
export const TRIALS:{id:TrialId;name:string;icon:string;text:string;goal:number;reward:number;stat:'victories'|'hunts'|'rituals'}[]=[
  {id:'combat',name:'Provar a coragem',icon:'swords',text:'Vença duas batalhas após assumir este desafio.',goal:2,reward:3,stat:'victories'},
  {id:'hunt',name:'Ouvir a mata',icon:'trees',text:'Conclua uma caçada após assumir este desafio.',goal:1,reward:4,stat:'hunts'},
  {id:'ritual',name:'Honrar o encanto',icon:'flame',text:'Conclua uma cerimônia após assumir este desafio.',goal:1,reward:5,stat:'rituals'},
];
export const legacyLevel=(s:GameState,id:LegacyId)=>s.journey.legacies[id]??0;
export const legacyCost=(level:number)=>3+level*3;
export function legacyLock(s:GameState,d:LegacyDef):string|null {
  if(legacyLevel(s,d.id)>=3)return 'Legado completo';
  if(s.era<d.era)return `Exige Era ${d.era}`;
  if(d.parent&&!legacyLevel(s,d.parent))return `Abra ${LEGACIES.find(l=>l.id===d.parent)!.name}`;
  return null;
}
export function trialProgress(s:GameState):number {
  const active=s.journey.trial,def=TRIALS.find(t=>t.id===active?.id);
  return active&&def?Math.max(0,Math.min(def.goal,s.stats[def.stat]-active.start)):0;
}
export const initialJourney=():AncestralJourney=>({knowledge:3,legacies:Object.fromEntries(LEGACIES.map(d=>[d.id,0])),focusTraits:[],selected:[],trial:null,completed:0,migrated:false});
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const int=(v:unknown,max:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
export function sanitizeJourney(value:unknown):AncestralJourney {
  const v=object(value),l=object(v.legacies),t=object(v.trial);
  return {knowledge:int(v.knowledge,1e6),legacies:Object.fromEntries(LEGACIES.map(d=>[d.id,int(l[d.id],3)])),
    selected:Array.isArray(v.selected)?[...new Set(v.selected.filter(id=>PREPARATIONS.some(p=>p.id===id)))].slice(0,2) as PreparationId[]:[],
    focusTraits:Array.isArray(v.focusTraits)?[...new Set(v.focusTraits.filter(t=>typeof t==='string'))].slice(0,2) as string[]:[],
    trial:TRIALS.some(d=>d.id===t.id)?{id:t.id as TrialId,start:int(t.start,1e9)}:null,completed:int(v.completed,1e9),migrated:v.migrated===true};
}
/** Convert removed economic investments to bounded knowledge once when importing pre-v7 saves. */
export function migrateSettlement(s:GameState,value:unknown):void {
  const old=object(value),v=object(old.settlement),research=object(v.research),sites=object(v.sites),buildings=object(old.buildings),stock=object(object(old.journey).preparations);
  const credit=Object.values(buildings).reduce<number>((n,l)=>n+Math.max(0,int(l,15)-1),0)+Object.values(stock).reduce<number>((n,c)=>n+int(c,5),0)
    +Object.keys(sites).length*2+Object.values(research).reduce<number>((n,l)=>n+int(l,3)*3,0);
  s.journey.knowledge=Math.min(1e6,s.journey.knowledge+Math.min(60,credit));
  if(!s.journey.focusTraits.length&&Array.isArray(v.focusTraits))s.journey.focusTraits=v.focusTraits.filter(t=>typeof t==='string').slice(0,2) as string[];
  s.journey.migrated=true;
}
