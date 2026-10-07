import type { BuildingId, GameState, Resource, Resources } from './simulation';

export type CitizenJob = Resource | 'builder' | 'idle';
export type InfrastructureId = 'housing' | 'store' | 'farm' | 'watchtower' | 'market';
export type ResearchId = 'tools' | 'tracking' | 'sentinels' | 'warfare';
export type OrderKind = 'building' | 'infrastructure' | 'train' | 'scout' | 'claim' | 'research';
export interface VillageOrder { id: number; kind: OrderKind; target: string; plot?: string; citizenId?:number; level: number; started: number; until: number; cost: Resources }
export interface Settlement {
  citizens: { id: number; job: CitizenJob }[]; nextCitizen: number; nextOrder: number;
  orders: VillageOrder[]; discovered: string[]; claimed: string[];
  sites: Partial<Record<string, InfrastructureId>>; research: Record<ResearchId, number>;
  focusTraits: string[]; milestones:string[]; log: { at: number; text: string }[];
}
const price = (wood=0,food=0,stone=0,spirit=0): Resources => ({wood,food,stone,spirit});
export const CITIZEN_JOBS: Record<CitizenJob, { name: string; icon: string }> = {
  wood:{name:'Madeira',icon:'trees'},food:{name:'Alimento',icon:'wheat'},stone:{name:'Pedra',icon:'mountain'},spirit:{name:'Espírito',icon:'flame'},builder:{name:'Construtores',icon:'hammer'},idle:{name:'Disponíveis',icon:'users'},
};
export const INFRASTRUCTURE: Record<InfrastructureId,{name:string;description:string;era:number;seconds:number;cost:Resources;frame:string}> = {
  housing:{name:'Moradia da tribo',description:'+4 vagas de população. Cada moradia abriga novos trabalhadores.',era:1,seconds:35,cost:price(65,0,20),frame:'hut-hunt'},
  store:{name:'Armazém de provisões',description:'+10% de produção dos aldeões por armazém.',era:1,seconds:45,cost:price(95,0,45),frame:'hut-lumber'},
  farm:{name:'Roça comunitária',description:'+0,6 alimento/s, multiplicado pela era e pelas pesquisas de ferramentas.',era:1,seconds:40,cost:price(70,35,15),frame:'hut-hunt'},
  watchtower:{name:'Torre de vigia',description:'Reduz em 12% a perda de recursos por incursões ignoradas.',era:2,seconds:60,cost:price(120,0,90),frame:'totem'},
  market:{name:'Casa de trocas',description:'Troque 100 madeira, alimento ou pedra por 65 de outro recurso material.',era:2,seconds:65,cost:price(150,50,75),frame:'hut-lumber'},
};
export const RESEARCH: Record<ResearchId,{name:string;description:string;era:number;cost:Resources;seconds:number}> = {
  tools:{name:'Ferramentas de osso',description:'+15% de produção dos aldeões e das roças por nível.',era:1,cost:price(85,30,60),seconds:55},
  tracking:{name:'Leitura de rastros',description:'+3 pontos percentuais de sucesso em caçadas e -15% de tempo de reconhecimento por nível.',era:2,cost:price(60,110,20,40),seconds:75},
  sentinels:{name:'Vigília da mata',description:'Reduz as perdas de incursões em mais 10% por nível.',era:2,cost:price(90,60,100,30),seconds:85},
  warfare:{name:'Táticas de matilha',description:'+4% de vida e ataque para os heróis em batalha por nível.',era:2,cost:price(100,100,80,65),seconds:100},
};
export interface Territory { id:string;name:string;resource:Resource;era:number;victories:number;neighbors:string[];x:number;y:number;scout:number;cost:Resources;description:string }
export const TERRITORIES: Territory[] = [
  {id:'grove',name:'Bosque do cedro',resource:'wood',era:1,victories:0,neighbors:['hearth'],x:175,y:225,scout:35,cost:price(55,20,15),description:'Madeira farta na primeira fronteira da aldeia.'},
  {id:'river',name:'Curva do igarapé',resource:'food',era:1,victories:0,neighbors:['hearth'],x:1045,y:305,scout:45,cost:price(65,30,20),description:'Peixes e margens férteis para sustentar a população.'},
  {id:'meadow',name:'Clareira das antas',resource:'food',era:1,victories:1,neighbors:['hearth'],x:265,y:590,scout:50,cost:price(85,35,25),description:'Abra espaço para roças e moradias após a primeira vitória.'},
  {id:'ridge',name:'Pedras do nascente',resource:'stone',era:2,victories:5,neighbors:['river'],x:1070,y:525,scout:65,cost:price(130,50,70),description:'Pedra para sustentar a expansão da segunda era.'},
  {id:'north',name:'Mata dos antigos',resource:'wood',era:2,victories:4,neighbors:['grove'],x:435,y:110,scout:70,cost:price(150,65,60),description:'Uma mata profunda além do primeiro posto avançado.'},
  {id:'marsh',name:'Brejo dos espíritos',resource:'spirit',era:2,victories:3,neighbors:['hearth'],x:765,y:655,scout:75,cost:price(115,70,55,40),description:'O nevoeiro guarda novas fontes de vínculo espiritual.'},
  {id:'ruins',name:'Pedras da memória',resource:'spirit',era:3,victories:10,neighbors:['meadow','marsh'],x:475,y:675,scout:90,cost:price(230,110,160,70),description:'Ruínas ancestrais protegidas pelas expedições da tribo.'},
  {id:'highlands',name:'Passagem do inverno',resource:'stone',era:4,victories:15,neighbors:['ridge','north'],x:870,y:125,scout:110,cost:price(400,180,250,110),description:'A última fronteira, entre a aldeia e as montanhas.'},
];
export const CORE_PLOTS = [{id:'hearth-1',x:495,y:352},{id:'hearth-2',x:727,y:526},{id:'hearth-3',x:292,y:488}];
export function villagePlots(s: GameState) {
  return [...CORE_PLOTS,...TERRITORIES.filter(t=>s.settlement.claimed.includes(t.id)).map(t=>({id:`${t.id}-1`,x:t.x+45,y:t.y+38}))];
}
export const territoryById = (id:string) => TERRITORIES.find(t=>t.id===id);
export const infrastructureCount = (s:GameState,id:InfrastructureId) => Object.values(s.settlement.sites).filter(v=>v===id).length;
export const populationCap = (s:GameState) => Math.min(40,4+s.villageLevel*2+infrastructureCount(s,'housing')*4);
export const builderCount = (s:GameState) => s.settlement.citizens.filter(c=>c.job==='builder').length;
export const constructionCount = (s:GameState) => s.settlement.orders.filter(o=>['building','infrastructure','claim'].includes(o.kind)).length;
export const trainingCost = (): Resources => price(0,45);
export function researchCost(s:GameState,id:ResearchId): Resources {
  return Object.fromEntries(Object.entries(RESEARCH[id].cost).map(([key,value])=>[key,Math.ceil(value*Math.pow(1.9,s.settlement.research[id]))])) as Resources;
}
export function territoryLock(s:GameState,t:Territory): string | null {
  if(s.villageLevel<t.era)return `Era ${['I','II','III','IV','V'][t.era-1]}`;
  if(!t.neighbors.some(id=>s.settlement.claimed.includes(id)))return 'Estabeleça um posto em um território vizinho.';
  if(s.progress<t.victories)return `Vença ${t.victories} expedições da campanha.`;
  return null;
}
export function initialSettlement(): Settlement {
  return {citizens:[{id:1,job:'wood'},{id:2,job:'food'},{id:3,job:'stone'},{id:4,job:'builder'}],nextCitizen:5,nextOrder:1,orders:[],discovered:['hearth'],claimed:['hearth'],sites:{},research:{tools:0,tracking:0,sentinels:0,warfare:0},focusTraits:[],milestones:[],log:[]};
}
export const SETTLEMENT_MILESTONES:{id:string;name:string;hint:string;done:(s:GameState)=>boolean;reward:Resources}[] = [
  {id:'hands',name:'Um novo par de mãos',hint:'Prepare o quinto aldeão.',done:s=>s.settlement.citizens.length>=5,reward:price(40,25)},
  {id:'roof',name:'Um teto para crescer',hint:'Erga a primeira moradia.',done:s=>infrastructureCount(s,'housing')>0,reward:price(75,35,0,15)},
  {id:'frontier',name:'Além da clareira',hint:'Estabeleça um posto avançado.',done:s=>s.settlement.claimed.length>=2,reward:price(0,100,80,20)},
  {id:'knowledge',name:'A memória das ferramentas',hint:'Conclua Ferramentas de osso I.',done:s=>s.settlement.research.tools>=1,reward:price(60,0,30,55)},
  {id:'village',name:'Uma tribo que permanece',hint:'Alcance oito aldeões e três construções novas.',done:s=>s.settlement.citizens.length>=8&&Object.keys(s.settlement.sites).length>=3,reward:price(180,180,130,60)},
  {id:'lands',name:'Caminhos da floresta',hint:'Estabeleça quatro postos avançados.',done:s=>s.settlement.claimed.length>=5,reward:price(300,250,200,150)},
];
/** Ordinary villagers supplement production; hero affinities remain multiplicative. */
export function settlementRates(s:GameState): Resources {
  const result=price(),base={wood:.35,food:.3,stone:.23,spirit:.12};
  const efficiency=(1+.15*s.settlement.research.tools)*(1+.1*infrastructureCount(s,'store'));
  for(const key of Object.keys(base) as Resource[]) {
    const count=s.settlement.citizens.filter(c=>c.job===key&&!s.settlement.orders.some(o=>o.citizenId===c.id)).length;
    const outposts=TERRITORIES.filter(t=>t.resource===key&&s.settlement.claimed.includes(t.id)).length;
    result[key]=count*base[key]*efficiency*(1+.12*outposts)+outposts*.15;
  }
  result.food+=infrastructureCount(s,'farm')*.6*(1+.15*s.settlement.research.tools);
  return result;
}
export const raidProtection = (s:GameState) => Math.min(.8,infrastructureCount(s,'watchtower')*.12+s.settlement.research.sentinels*.1);
export const orderTitle = (o:VillageOrder):string => o.kind==='train'?'Novo aldeão':o.kind==='research'?RESEARCH[o.target as ResearchId]?.name??'Pesquisa':o.kind==='infrastructure'?INFRASTRUCTURE[o.target as InfrastructureId]?.name??'Obra':o.kind==='building'?({lumber:'Bosque',hunt:'Acampamento',quarry:'Pedreira',shrine:'Círculo',forge:'Forja',cura:'Casa de Cura'} as Record<BuildingId,string>)[o.target as BuildingId]:`${o.kind==='scout'?'Reconhecer':'Estabelecer posto'} · ${territoryById(o.target)?.name}`;

export function sanitizeSettlement(value:unknown,clock:number): Settlement {
  const fresh=initialSettlement();if(!value||typeof value!=='object')return fresh;
  const data=value as Partial<Settlement>;
  const integer=(v:unknown,fallback:number,max:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):fallback;
  const ids=new Set<number>();
  if(Array.isArray(data.citizens))fresh.citizens=data.citizens.slice(0,40).flatMap(c=>{if(!c||typeof c!=='object'||!Object.hasOwn(CITIZEN_JOBS,c.job))return[];const id=integer(c.id,0,1e6);if(!id||ids.has(id))return[];ids.add(id);return[{id,job:c.job}];});
  if(!fresh.citizens.length)fresh.citizens=[{id:1,job:'builder'}];
  fresh.nextCitizen=Math.max(integer(data.nextCitizen,5,1e6),...fresh.citizens.map(c=>c.id+1));
  const valid=(id:string)=>id==='hearth'||!!territoryById(id);
  if(Array.isArray(data.discovered))fresh.discovered=[...new Set(['hearth',...data.discovered.filter(id=>typeof id==='string'&&valid(id))])];
  if(Array.isArray(data.claimed))fresh.claimed=[...new Set(['hearth',...data.claimed.filter(id=>typeof id==='string'&&valid(id)&&fresh.discovered.includes(id))])];
  const plotIds=[...CORE_PLOTS.map(p=>p.id),...fresh.claimed.filter(id=>id!=='hearth').map(id=>`${id}-1`)];
  if(data.sites&&typeof data.sites==='object')fresh.sites=Object.fromEntries(Object.entries(data.sites).filter(([id,type])=>plotIds.includes(id)&&typeof type==='string'&&Object.hasOwn(INFRASTRUCTURE,type)));
  if(data.research&&typeof data.research==='object')for(const id of Object.keys(RESEARCH) as ResearchId[])fresh.research[id]=integer(data.research[id],0,3);
  if(Array.isArray(data.focusTraits))fresh.focusTraits=[...new Set(data.focusTraits.filter(id=>typeof id==='string').map(id=>id.slice(0,40)))].slice(0,2);
  if(Array.isArray(data.milestones))fresh.milestones=[...new Set(data.milestones.filter(id=>SETTLEMENT_MILESTONES.some(m=>m.id===id)))];
  const orderIds=new Set<number>(),targets=new Set<string>();
  if(Array.isArray(data.orders))fresh.orders=data.orders.slice(0,12).flatMap(o=>{
    if(!o||typeof o!=='object'||typeof o.target!=='string')return[];
    const known=o.kind==='train'?o.target==='citizen':o.kind==='building'?['lumber','hunt','quarry','shrine','forge','cura'].includes(o.target):o.kind==='infrastructure'?Object.hasOwn(INFRASTRUCTURE,o.target)&&!!o.plot&&plotIds.includes(o.plot)&&!fresh.sites[o.plot]:o.kind==='research'?Object.hasOwn(RESEARCH,o.target):o.kind==='scout'||o.kind==='claim'?!!territoryById(o.target):false;
    const id=integer(o.id,0,1e9),key=`${o.kind}:${o.kind==='infrastructure'?o.plot:o.target}`;
    if(!known||!id||orderIds.has(id)||targets.has(key)||!Number.isFinite(o.until)||o.until>clock+86400||!Number.isFinite(o.started)||o.started>o.until)return[];
    orderIds.add(id);targets.add(key);
    const cost=price();for(const resource of Object.keys(cost) as Resource[])cost[resource]=integer(o.cost?.[resource],0,1e7);
    return[{id,kind:o.kind,target:o.target,plot:o.plot,citizenId:o.kind==='scout'&&fresh.citizens.some(c=>c.id===o.citizenId)?o.citizenId:undefined,level:integer(o.level,1,15),started:Math.max(0,o.started),until:Math.max(0,o.until),cost}];
  });
  fresh.nextOrder=Math.max(integer(data.nextOrder,1,1e9),...fresh.orders.map(o=>o.id+1));
  if(Array.isArray(data.log))fresh.log=data.log.slice(-12).filter(e=>e&&typeof e.text==='string'&&Number.isFinite(e.at)).map(e=>({at:Math.max(0,e.at),text:e.text.slice(0,200)}));
  return fresh;
}
