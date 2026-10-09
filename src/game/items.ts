/** Tribal items in the spirit of TFT: six components, and one finished item for every pair of them. */
export type ComponentId = 'presa' | 'arco' | 'couro' | 'manto' | 'pena' | 'raiz';
export interface ItemStats { attackPct?: number; attackSpeedPct?: number; armor?: number; magicResist?: number; mana?: number; hp?: number; hpPct?: number; spellPower?: number; lifesteal?: number; manaRegen?: number; regen?: number }
export interface ItemPerks {
  /** Bonus damage multiplier on every third basic attack. */
  crit3?: number;
  /** Attack speed gained per basic attack, up to ten stacks. */
  asStack?: number;
  /** Fraction of physical damage taken returned as magic damage. */
  thorns?: number;
  healOnKill?: number;
  /** Every third attack strikes two nearby enemies for this fraction of attack as magic damage. */
  chain3?: number;
  /** Magic resist removed from the target by each attack. */
  shred?: number;
  manaOnHit?: number;
  healOnHit?: number;
  startStealth?: number;
  /** Shield, as a fraction of the holder's life, for the holder and adjacent allies at the start. */
  teamShield?: number;
  startTaunt?: number;
  /** Number of stuns ignored. */
  ccShield?: number;
  /** Shield granted once when life drops below 40%. */
  lowHpShield?: number;
  manaAfterCast?: number;
  /** Heals the most wounded ally by this fraction of their life after each cast. */
  healAllyOnCast?: number;
}
export interface ItemDef { id: string; name: string; kind: 'component' | 'item'; recipe?: [ComponentId, ComponentId]; text: string; stats: ItemStats; perks?: ItemPerks; color: string; era?:number; price?:number }

export const COMPONENTS: ItemDef[] = [
  { id: 'presa', name: 'Presa de Osso', kind: 'component', text: '+12% de ataque.', stats: { attackPct: 0.12 }, color: '#e7d6b0' },
  { id: 'arco', name: 'Arco de Teixo', kind: 'component', text: '+12% de velocidade de ataque.', stats: { attackSpeedPct: 0.12 }, color: '#c9a86b' },
  { id: 'couro', name: 'Couro Curtido', kind: 'component', text: '+20 de armadura.', stats: { armor: 20 }, color: '#a97b4f' },
  { id: 'manto', name: 'Manto de Fibras', kind: 'component', text: '+20 de resistência mágica.', stats: { magicResist: 20 }, color: '#8fb7a6' },
  { id: 'pena', name: 'Pena Sagrada', kind: 'component', text: '+15 de mana inicial.', stats: { mana: 15 }, color: '#9fb8e0' },
  { id: 'raiz', name: 'Cinturão de Raízes', kind: 'component', text: '+180 de vida.', stats: { hp: 180 }, color: '#8faa5f' },
];

const item = (id: string, name: string, recipe: [ComponentId, ComponentId], text: string, stats: ItemStats, perks: ItemPerks, color: string): ItemDef =>
  ({ id, name, kind: 'item', recipe, text, stats, perks, color });

export const ITEMS: ItemDef[] = [
  item('obsidiana', 'Lâmina de Obsidiana', ['presa', 'presa'], '+30% de ataque. Cada terceiro ataque causa o dobro de dano.', { attackPct: 0.3 }, { crit3: 1 }, '#3b3346'),
  item('garra', 'Garra do Caçador', ['presa', 'arco'], '+12% de ataque e velocidade. Cada ataque soma +4% de velocidade (até 10 vezes).', { attackPct: 0.12, attackSpeedPct: 0.12 }, { asStack: 0.04 }, '#d9b36a'),
  item('espinhos', 'Couraça de Espinhos', ['presa', 'couro'], '+12% de ataque e +20 de armadura. Devolve 25% do dano físico recebido.', { attackPct: 0.12, armor: 20 }, { thorns: 0.25 }, '#8a6a45'),
  item('talisma', 'Talismã Sangrento', ['presa', 'manto'], '+12% de ataque e +20 de resistência. Rouba 20% do dano causado como vida.', { attackPct: 0.12, magicResist: 20, lifesteal: 0.2 }, {}, '#b34b4b'),
  item('lanca', 'Lança do Xamã', ['presa', 'pena'], '+12% de ataque e +15 de mana. Habilidades causam 25% mais dano e cura.', { attackPct: 0.12, mana: 15, spellPower: 0.25 }, {}, '#c98f5e'),
  item('machado', 'Machado do Chefe', ['presa', 'raiz'], '+12% de ataque e +180 de vida. Cada abate cura 25% da vida.', { attackPct: 0.12, hp: 180 }, { healOnKill: 0.25 }, '#9b8a6a'),
  item('tempestade', 'Arco da Tempestade', ['arco', 'arco'], '+30% de velocidade. Cada terceiro ataque salta para dois inimigos próximos.', { attackSpeedPct: 0.3 }, { chain3: 0.6 }, '#9fc7e8'),
  item('vento', 'Braçadeira do Vento', ['arco', 'couro'], '+12% de velocidade e +20 de armadura. Começa o combate inalvejável por 2 s.', { attackSpeedPct: 0.12, armor: 20 }, { startStealth: 2 }, '#b9c9a8'),
  item('corda', 'Corda Encantada', ['arco', 'manto'], '+12% de velocidade e +20 de resistência. Cada ataque remove 6 de resistência mágica do alvo.', { attackSpeedPct: 0.12, magicResist: 20 }, { shred: 6 }, '#7fb4c4'),
  item('flauta', 'Flauta dos Espíritos', ['arco', 'pena'], '+12% de velocidade e +15 de mana. Ataques geram 5 de mana adicional.', { attackSpeedPct: 0.12, mana: 15 }, { manaOnHit: 5 }, '#c4b7e8'),
  item('mocassins', 'Mocassins do Rio', ['arco', 'raiz'], '+12% de velocidade e +180 de vida. Cada ataque cura 2% da vida.', { attackSpeedPct: 0.12, hp: 180 }, { healOnHit: 0.02 }, '#6fa8a0'),
  item('carapaca', 'Carapaça Ancestral', ['couro', 'couro'], '+60 de armadura. Devolve 15% do dano físico recebido.', { armor: 60 }, { thorns: 0.15 }, '#6c6a5a'),
  item('pele-urso', 'Pele do Urso', ['couro', 'manto'], '+30 de armadura e de resistência. Regenera 2% da vida por segundo.', { armor: 30, magicResist: 30, regen: 0.02 }, {}, '#d7d0c0'),
  item('escudo-totem', 'Escudo Totêmico', ['couro', 'pena'], '+20 de armadura e +15 de mana. No início, escuda a si e aos aliados vizinhos com 20% da vida.', { armor: 20, mana: 15 }, { teamShield: 0.2 }, '#c9a24f'),
  item('muralha', 'Muralha de Pedra', ['couro', 'raiz'], '+20 de armadura e +350 de vida. Provoca inimigos próximos por 3 s no início.', { armor: 20, hp: 350 }, { startTaunt: 3 }, '#8d8f86'),
  item('veu-coruja', 'Véu da Coruja', ['manto', 'manto'], '+60 de resistência mágica. Ignora os dois primeiros atordoamentos.', { magicResist: 60 }, { ccShield: 2 }, '#e6e6f2'),
  item('colar-lua', 'Colar da Lua', ['manto', 'pena'], '+20 de resistência e +15 de mana. Regenera 4 de mana por segundo.', { magicResist: 20, mana: 15, manaRegen: 4 }, {}, '#dfe7f4'),
  item('amuleto', 'Amuleto do Remanso', ['manto', 'raiz'], '+20 de resistência e +180 de vida. Abaixo de 40% da vida, recebe um escudo de 35% (uma vez).', { magicResist: 20, hp: 180 }, { lowHpShield: 0.35 }, '#5c8fa8'),
  item('coroa', 'Coroa de Penas', ['pena', 'pena'], '+35 de mana inicial. Recupera 20 de mana após cada conjuração.', { mana: 35 }, { manaAfterCast: 20 }, '#f2d486'),
  item('cajado-vida', 'Cajado da Vida', ['pena', 'raiz'], '+15 de mana e +180 de vida. Cada conjuração cura o aliado mais ferido em 18% da vida.', { mana: 15, hp: 180 }, { healAllyOnCast: 0.18 }, '#a9d68a'),
  item('carvalho', 'Coração do Carvalho', ['raiz', 'raiz'], '+400 de vida e +15% de vida máxima.', { hp: 400, hpPct: 0.15 }, {}, '#5f8a3f'),
];

export const RELICS:ItemDef[]=[
  {id:'dente-eclipse',name:'Dente do Eclipse',kind:'item',era:3,price:100,color:'#db8776',text:'+25% de ataque, 20% de roubo de vida e +75% de dano no terceiro golpe.',stats:{attackPct:.25,lifesteal:.2},perks:{crit3:.75}},
  {id:'orbe-aurora',name:'Orbe da Aurora',kind:'item',era:3,price:100,color:'#b5a9ed',text:'+35% de poder e +25 de mana. Recupera 15 de mana após conjurar.',stats:{spellPower:.35,mana:25},perks:{manaAfterCast:15}},
  {id:'egide-tronco',name:'Égide do Tronco',kind:'item',era:3,price:100,color:'#9ab98b',text:'+18% de vida e 1% de regeneração. Provoca por 3 s e escuda aliados vizinhos com 12% da vida.',stats:{hpPct:.18,regen:.01},perks:{startTaunt:3,teamShield:.12}},
  {id:'asa-tempestade',name:'Asa da Tempestade',kind:'item',era:4,price:130,color:'#84c7dc',text:'+30% de velocidade. Ignora o primeiro atordoamento e começa inalvejável por 1,5 s.',stats:{attackSpeedPct:.3},perks:{ccShield:1,startStealth:1.5}},
  {id:'raiz-luz',name:'Raiz de Luz',kind:'item',era:4,price:130,color:'#c5daa0',text:'+3 de mana por segundo. Cada conjuração cura o aliado mais ferido em 24% da vida.',stats:{manaRegen:3},perks:{healAllyOnCast:.24}},
  {id:'coroa-inverno',name:'Coroa do Primeiro Inverno',kind:'item',era:5,price:165,color:'#e0e6ef',text:'+25% de vida e +45 de resistência. Ignora três atordoamentos e recebe escudo de 35% ao cair abaixo de 40% da vida.',stats:{hpPct:.25,magicResist:45},perks:{ccShield:3,lowHpShield:.35}},
];
export const ALL_ITEMS: ItemDef[] = [...COMPONENTS, ...ITEMS, ...RELICS];
export const itemById = (id: string): ItemDef | undefined => ALL_ITEMS.find(entry => entry.id === id);
export const isComponent = (id: string): id is ComponentId => COMPONENTS.some(component => component.id === id);
export function recipeFor(a: string, b: string): ItemDef | undefined {
  return ITEMS.find(entry => entry.recipe && ((entry.recipe[0] === a && entry.recipe[1] === b) || (entry.recipe[0] === b && entry.recipe[1] === a)));
}
export const MAX_ITEMS_PER_HERO = 3;
export const COMPONENT_IDS = COMPONENTS.map(component => component.id as ComponentId);
