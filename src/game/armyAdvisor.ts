import { characters, type Character } from '../data/characters';
import { countTraits, TRAIT_RULES, traitStatus } from './synergies';
import { ITEMS, itemById, recipeFor, type ItemDef } from './items';
import type { GameState, Hero } from './simulation';
import { unlockedCost } from './roster';
import { expectedLevel, stageById } from './campaign';

export type ArmyRole = 'front'|'ranged'|'caster'|'support'|'flank'|'summon';
export const ROLE_GUIDE: Record<ArmyRole,{name:string;position:string;description:string;items:string[]}> = {
  front:{name:'Linha de frente',position:'Primeira fileira',description:'Absorve os primeiros golpes e protege quem ataca de longe. Vida, armadura e resistência aumentam sua permanência.',items:['muralha','carvalho','pele-urso']},
  ranged:{name:'Atirador',position:'Últimas fileiras',description:'Causa dano constante com ataques. Precisa de espaço, proteção e velocidade de ataque.',items:['garra','tempestade','talisma']},
  caster:{name:'Conjurador',position:'Atrás da linha de frente',description:'Seu impacto vem das habilidades. Mana e poder de habilidade antecipam e fortalecem as conjurações.',items:['lanca','coroa','colar-lua']},
  support:{name:'Suporte',position:'Centro ou retaguarda',description:'Sustenta os companheiros com cura ou escudos. Proteja-o para que consiga conjurar várias vezes.',items:['cajado-vida','coroa','escudo-totem']},
  flank:{name:'Flanqueador',position:'Laterais da formação',description:'Pressiona alvos vulneráveis. Ataque, velocidade e sobrevivência ajudam a alcançar a retaguarda.',items:['vento','garra','talisma']},
  summon:{name:'Invocador',position:'Segunda fileira',description:'Precisa conjurar cedo para aumentar o número de aliados. Mana inicial e o laço Invocador apoiam esse plano.',items:['coroa','colar-lua','cajado-vida']},
};
export function roleOf(c:Character):ArmyRole {
  if(c.traits.includes('Invocador'))return 'summon';
  if(c.traits.includes('Guardião')||c.traits.includes('Brigão'))return 'front';
  if(c.traits.includes('Espreitador')||c.traits.includes('Trapaceiro'))return 'flank';
  if(/cura|curar|escudo para|aliados.*escudo/i.test(c.ability.description)&&c.range>1)return 'support';
  if(c.traits.includes('Xamã')||c.traits.includes('Místico'))return 'caster';
  return c.range>1?'ranged':'front';
}
const char=(h:Hero)=>characters.find(c=>c.id===h.characterId)!;
export const activeArmy=(s:GameState)=>s.heroes.filter(h=>h.slot!==null&&!h.away);
export function armyScore(party:Hero[],focus:string[]=[]):number {
  const traits=countTraits(party.map(h=>h.characterId));
  let score=party.reduce((sum,h)=>sum+h.level*.4+h.stars*4+char(h).cost*.4,0);
  for(const [name,count]of traits){const rule=TRAIT_RULES[name],tier=traitStatus(name,count).tier;score+=tier*(rule.kind==='espírito'?2:8)+count*(focus.includes(name)?5:.3);if(focus.includes(name))score+=tier*9;}
  const roles=party.map(h=>roleOf(char(h)));
  if(roles.includes('front'))score+=8;if(roles.some(r=>['ranged','caster','summon'].includes(r)))score+=4;if(roles.includes('support'))score+=3;
  return score;
}
export function recommendedParty(s:GameState):Hero[] {
  const eligible=s.heroes.filter(h=>!h.away&&!h.work),limit=2+s.villageLevel,party:Hero[]=[];
  while(party.length<limit&&party.length<eligible.length){const best=eligible.filter(h=>!party.includes(h)).sort((a,b)=>armyScore([...party,b],s.settlement.focusTraits)-armyScore([...party,a],s.settlement.focusTraits)||a.characterId-b.characterId)[0];party.push(best);}
  // A bounded exchange pass catches pairs that the first greedy choice missed.
  for(let pass=0;pass<3;pass++)for(let i=0;i<party.length;i++)for(const h of eligible.filter(h=>!party.includes(h))){const swap=party.map((p,j)=>j===i?h:p);if(armyScore(swap,s.settlement.focusTraits)>armyScore(party,s.settlement.focusTraits)+.01)party[i]=h;}
  return party.sort((a,b)=>Number(roleOf(char(b))==='front')-Number(roleOf(char(a))==='front')||b.level-a.level||a.characterId-b.characterId);
}
export function armySuggestions(s:GameState) {
  const current=activeArmy(s),score=armyScore(current,s.settlement.focusTraits),limit=2+s.villageLevel;
  return s.heroes.filter(h=>h.slot===null&&!h.away&&!h.work).map(hero=>{
    const parties=current.length<limit?[{party:[...current,hero],replace:null as Hero|null}]:current.map(replace=>({party:current.map(h=>h===replace?hero:h),replace}));
    const choice=parties.sort((a,b)=>armyScore(b.party,s.settlement.focusTraits)-armyScore(a.party,s.settlement.focusTraits))[0];
    if(!choice)return null;
    const old=countTraits(current.map(h=>h.characterId)),next=countTraits(choice.party.map(h=>h.characterId));
    const gained=[...next].filter(([name,count])=>traitStatus(name,count).tier>traitStatus(name,old.get(name)??0).tier).map(([name])=>name);
    const lost=[...old].filter(([name,count])=>traitStatus(name,count).tier>traitStatus(name,next.get(name)??0).tier).map(([name])=>name);
    return {hero,replace:choice.replace,gained,lost,improvement:armyScore(choice.party,s.settlement.focusTraits)-score};
  }).filter((v):v is NonNullable<typeof v>=>!!v).sort((a,b)=>b.improvement-a.improvement).slice(0,5);
}
export function nearTraits(s:GameState) {
  const counts=countTraits(activeArmy(s).map(h=>h.characterId)),ritual=Math.max(...s.heroes.map(h=>h.ritualLevel));
  return Object.entries(TRAIT_RULES).map(([name,rule])=>{
    const count=counts.get(name)??0,status=traitStatus(name,count);
    const members=characters.filter(c=>c.traits.includes(name));
    const recruits=members.filter(c=>!s.heroes.some(h=>h.characterId===c.id)&&c.cost<=unlockedCost(s.villageLevel)&&ritual>=[0,1,2,3,5,7][c.cost]);
    return {...status,missing:status.next-count,members,recruits,complete:status.tier===rule.thresholds.length};
  }).filter(t=>t.count>0||s.settlement.focusTraits.includes(t.name)).sort((a,b)=>Number(b.name&&s.settlement.focusTraits.includes(b.name))-Number(s.settlement.focusTraits.includes(a.name))||a.missing-b.missing||b.count-a.count);
}
export function itemFit(c:Character,item:ItemDef):number {
  const r=roleOf(c),s=item.stats,p=item.perks??{},front=r==='front',spell=['caster','support','summon'].includes(r);
  return (s.hp??0)*(front?.04:.012)+(s.hpPct??0)*(front?50:15)+(s.armor??0)*(front?.7:.18)+(s.magicResist??0)*(front?.6:.2)+(s.attackPct??0)*(spell?15:70)+(s.attackSpeedPct??0)*(spell?20:75)+(s.mana??0)*(spell?.9:.2)+(s.spellPower??0)*(spell?80:20)+(s.manaRegen??0)*(spell?8:2)+(s.lifesteal??0)*45+(p.teamShield??0)*70+(p.healAllyOnCast??0)*(spell?120:30)+(p.manaAfterCast??0)*(spell?.8:.2)+(p.chain3??0)*30+(p.asStack??0)*200;
}
export function itemAdvice(s:GameState,h:Hero) {
  const c=char(h),owned=s.inventory.map((id,index)=>({item:itemById(id)!,index})).filter(v=>!!v.item).sort((a,b)=>itemFit(c,b.item)-itemFit(c,a.item));
  const recipes=[] as {item:ItemDef;a:number;b:number}[];
  for(let a=0;a<s.inventory.length;a++)for(let b=a+1;b<s.inventory.length;b++){const item=recipeFor(s.inventory[a],s.inventory[b]);if(item&&!recipes.some(v=>v.item.id===item.id))recipes.push({item,a,b});}
  recipes.sort((a,b)=>itemFit(c,b.item)-itemFit(c,a.item));
  return {owned:owned.slice(0,4),recipes:recipes.slice(0,3),ideal:ITEMS.filter(i=>ROLE_GUIDE[roleOf(c)].items.includes(i.id))};
}
export function armyWarnings(s:GameState,stage=s.selectedStage):string[] {
  const party=activeArmy(s),warnings:string[]=[];
  if(!party.length)return ['Sua formação está vazia ou os heróis estão em atividades.'];
  if(party.length<2+s.villageLevel)warnings.push(`${2+s.villageLevel-party.length} vaga(s) livres: mais companheiros aumentam as opções de laços.`);
  if(!party.some(h=>roleOf(char(h))==='front'))warnings.push('Falta uma linha de frente. Atiradores e conjuradores receberão os primeiros golpes.');
  for(const h of party){const role=roleOf(char(h));if(role==='front'&&h.slot!>=7)warnings.push(`${char(h).name} pode proteger melhor a primeira fileira.`);if(['ranged','support','caster','summon'].includes(role)&&h.slot!<7)warnings.push(`${char(h).name} está exposto na primeira fileira.`);}
  const average=party.reduce((sum,h)=>sum+h.level,0)/party.length;
  if(stage>0&&average<expectedLevel(stage)*.8)warnings.push(`Sua experiência média (${Math.round(average)}) está abaixo da referência da expedição (${Math.round(expectedLevel(stage))}). Caçadas e trabalho podem ajudar.`);
  if(party.some(h=>h.items.length===0)&&s.inventory.length)warnings.push('Há itens na bolsa e companheiros sem equipamento.');
  return warnings;
}

export function enemyAdvice(s:GameState):{name:string;roles:{role:ArmyRole;count:number}[];tips:string[]} {
  const stage=stageById(s.selectedStage);if(!stage)return{name:'Caçada Eterna',roles:[],tips:['Prepare uma formação capaz de sustentar dano e cura por batalhas mais longas.']};
  const roster=stage.units.map(u=>characters.find(c=>c.id===u.id)!).filter(Boolean),roles=Object.keys(ROLE_GUIDE).map(r=>({role:r as ArmyRole,count:roster.filter(c=>roleOf(c)===r).length})).filter(r=>r.count>0);
  const count=(role:ArmyRole)=>roles.find(r=>r.role===role)?.count??0,tips:string[]=[];
  if(count('caster')+count('summon')>=2)tips.push('Há vários conjuradores ou invocadores: resistência mágica e conjurações rápidas são opções úteis.');
  if(count('ranged')>=2)tips.push('A retaguarda inimiga tem atiradores: mantenha uma linha de frente resistente e considere flanqueadores.');
  if(count('flank'))tips.push('Há flanqueadores: evite deixar seu suporte isolado nas laterais.');
  if(count('front')>=2)tips.push('A frente inimiga é numerosa: dano sustentado e habilidades ajudam a atravessá-la.');
  if(!tips.length)tips.push('Distribua as funções, equipe seus companheiros e confira a experiência antes de partir.');
  return{name:stage.name,roles,tips};
}
