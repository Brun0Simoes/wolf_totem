import type { Character } from './characters';
import type { NightProfile } from './nocturne';

/** Film-inspired interpretations. Powers and ceremonies are Wolf Totem game adaptations. */
const entries = [
  { id:154, name:'Lestat', title:'O Príncipe do Réquiem', cost:4, role:'Trapaceiro', ability:'anthem', rite:'requiem', color:0xc477aa,
    skill:'Réquiem da Noite', description:'Atinge três inimigos com 160/210/270% de ataque mágico. Concede +15/22/30% de velocidade de ataque a três aliados próximos por 4 s e atordoa a presa por 1/1,3/1,6 s.',
    forms:['Nobre errante: casaco curto de veludo e rapieira estreita.','Virtuose imortal: sobretudo brocado, botas altas e lâmina de prata.','Príncipe do réquiem: manto de palco em camadas, coroa de espinhos de prata e rapieira cerimonial.'] },
  { id:155, name:'Akasha', title:'A Rainha do Primeiro Sangue', cost:5, role:'Místico', ability:'pyre', rite:'first-blood', color:0xf0b15e,
    skill:'Pira da Rainha', description:'Incendeia uma área por 4 s: 40/55/75% de ataque mágico por segundo. O impacto atinge três inimigos em 180/240/310% de ataque mágico e recupera 15% do dano causado.',
    forms:['Rainha desperta: linho negro, ouro antigo e diadema discreto.','Soberana: colar monumental, braceletes dourados e saia real em camadas.','Primeira mãe: coroa solar alta, placas de ouro, manto escarlate e cetro de obsidiana.'] },
  { id:156, name:'Louis', title:'A Memória de Nova Orleans', cost:2, role:'Espreitador', ability:'blade', rite:'blood-pact', color:0x9fb6cc,
    skill:'Passo da Memória', description:'Avança à retaguarda: 240/300/390% de ataque e 1 s inalvejável. Recebe escudo de 12/18/24% da vida; se a presa estiver marcada, causa mais 40% de ataque.',
    forms:['Viajante melancólico: camisa clara e colete escuro.','Imortal: casaco verde profundo, luvas e rapieira trabalhada.','Senhor das memórias: sobretudo de veludo, gola de prata e longa capa de noite.'] },
  { id:157, name:'Claudia', title:'A Fúria que Não Envelhece', cost:1, role:'Caçador', ability:'volley', rite:'blood-pact', color:0xe6b7a7,
    skill:'Agulhas de Veludo', description:'Lança punhais contra quatro inimigos: 140/180/230% de ataque. A presa primária recebe outro golpe e marca por 5 s. Contra presas abaixo de 30% da vida, o golpe adicional causa mais 30% de ataque.',
    forms:['Pequena imortal: vestido vinho, cachos dourados e um punhal.','Rebelde: vestido bordado, capa curta e par de punhais.','Fúria eterna: vestido cerimonial em camadas, diadema de rosas e punhais de prata; conserva sua estatura.'] },
  { id:158, name:'Armand', title:'O Senhor do Teatro', cost:3, role:'Xamã', ability:'curse', rite:'requiem', color:0xc294bb,
    skill:'Olhar do Teatro', description:'Amaldiçoa dois inimigos por 5 s: 200/270/350% de ataque mágico e drena 15/25/35 de mana. A presa fica atordoada por 0,6/0,8/1 s e perde 10% de ataque por 4 s.',
    forms:['Observador: túnica escura e cabelos castanhos longos.','Mestre: casaco teatral bordado e relicário de prata.','Senhor do teatro: manto de seda em camadas, gola monumental e máscara cerimonial na mão.'] },
  { id:159, name:'Marius', title:'O Guardião dos Antigos', cost:4, role:'Guardião', ability:'guard', rite:'first-blood', color:0xb5c8dc,
    skill:'Vigília dos Antigos', description:'Escudo de 25/35/45% da vida, provoca por 4 s e protege três aliados com escudo de 12/18/25% da vida. Concede +12/18/25 de armadura a esses aliados por 4 s.',
    forms:['Guardião viajante: cabelos brancos, casaco cinza e espada sóbria.','Protetor antigo: sobretudo branco e vermelho, armadura de prata.','Vigília ancestral: armadura cerimonial, ombreiras esculpidas, manto branco e escudo de relicário.'] },
  { id:160, name:'Maharet', title:'A Última Gota', cost:5, role:'Xamã', ability:'blood', rite:'first-blood', color:0xdca388,
    skill:'Memória da Linhagem', description:'Drena três inimigos em 180/230/300% de ataque mágico e recupera 35% do dano. Cura também os dois aliados mais feridos em 80/110/150% de ataque e remove suas maldições.',
    forms:['Ancestral errante: cabelos ruivos e túnica de terra.','Guardiã da linhagem: robe verde, adornos de cobre e bastão antigo.','Última gota: coroa de raízes douradas, manto ancestral bordado e bastão de memória.'] },
  { id:161, name:'Jesse', title:'A Leitora do Sangue', cost:2, role:'Místico', ability:'elements', rite:'requiem', color:0x91ccb9,
    skill:'Revelação da Talamasca', description:'Impacto de 160/210/280% de ataque mágico e campo de 5 s com lentidão. Marca por 5 s até três presas próximas e revela sua furtividade. Campo causa 35/45/60% de ataque mágico por segundo.',
    forms:['Pesquisadora: casaco de viagem e diário de campo.','Iniciada: manto verde escuro, relicário e grimório aberto.','Leitora desperta: robe de runas de prata, diadema lunar e grande grimório de selos.'] },
  { id:162, name:'Santiago', title:'O Carrasco do Palco', cost:3, role:'Brigão', ability:'beast', rite:'requiem', color:0xd69fa0,
    skill:'Último Ato', description:'Investida contra três inimigos: 180/240/320% de ataque; atordoa a presa por 1/1,3/1,6 s e acelera por 4 s. Recebe evasão por 0,6 s e provoca por 2 s.',
    forms:['Ator errante: colete rubro e bengala.','Carrasco: casaco de palco, botas e lâmina de bengala.','Último ato: capa teatral de dupla face, gola prateada e espada cerimonial.'] },
  { id:163, name:'Madeleine', title:'A Guardiã do Vínculo', cost:1, role:'Xamã', ability:'heal', rite:'blood-pact', color:0xd6c3a1,
    skill:'Vínculo de Veludo', description:'Cura três aliados em 180/250/340% de ataque, limpa veneno e maldição e concede 10 de mana. Escuda o aliado mais ferido em 60/90/120% de ataque por conjuração.',
    forms:['Artesã: vestido de viagem e estojo de costura.','Protetora: vestido de renda, capa e relicário do vínculo.','Guardiã eterna: manto cerimonial de marfim e vinho, bordados de prata e grande relicário.'] },
] as const;

export const VAMPIRE_PROFILES = new Map<number,NightProfile>();
export const vampireCharacters: Character[] = entries.map(e => {
  const tank=['Guardião','Brigão'].includes(e.role), ranged=['Místico','Xamã','Caçador','Trapaceiro'].includes(e.role);
  const hp=(tank?710:530)+e.cost*90, attack=(tank?43:48)+e.cost*7;
  VAMPIRE_PROFILES.set(e.id,{ability:e.ability,rite:e.rite,color:e.color,faction:'Crônicas do Sangue',source:e.id===155||[159,160,161].includes(e.id)?'Queen of the Damned':'Interview with the Vampire'});
  return {id:e.id,name:e.name,title:e.title,cost:e.cost,traits:['Crônicas do Sangue',e.role],type:ranged?'Ranged':'Melee',hp:[hp,Math.round(hp*1.8),Math.round(hp*3.24)],attack:[attack,Math.round(attack*1.8),Math.round(attack*3.24)],armor:tank?45:25,magicResist:e.role==='Místico'?40:25,attackSpeed:e.role==='Espreitador'?.85:ranged?.7:.65,manaStart:e.role==='Xamã'?25:0,manaMax:e.ability==='pyre'?110:e.ability==='anthem'?90:70,range:ranged?4:1,ability:{name:e.skill,description:e.description},evolution:[...e.forms],art:`nocturne-${e.id}`};
});
export const VAMPIRE_CHARACTER_IDS = vampireCharacters.map(c=>c.id);
