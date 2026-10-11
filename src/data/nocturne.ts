import type { Character } from './characters';

export type NightAbility = 'whip' | 'elements' | 'blade' | 'blood' | 'heal' | 'forge' | 'guard' | 'curse' | 'volley' | 'portal' | 'serpent' | 'beast' | 'eclipse';
export type NightRite = 'consecration' | 'blood-pact' | 'soul-forge' | 'speaker-seal' | 'ancestral-song' | 'eclipse';
export interface NightProfile { ability: NightAbility; rite: NightRite; color: number; faction: string; source: 'Castlevania' | 'Nocturne'; }
type Entry = [string, string, number, string, string, NightAbility, NightRite, number];
/** 53 original identities, inspired by the designs and power archetypes of the two animated series. */
const entries: Entry[] = [
  ['Kael Voss','O Último Caçador',3,'Vigília','Caçador','whip','consecration',0xe7be89],
  ['Elira','A Voz dos Elementos',3,'Vozes do Véu','Místico','elements','speaker-seal',0x8eddeb],
  ['Aurelian','O Filho da Noite',5,'Vigília','Espreitador','blade','blood-pact',0xf0d99d],
  ['Valtherion','O Senhor do Castelo',5,'Corte Rubra','Místico','eclipse','eclipse',0xde4665],
  ['Liora','A Médica de Lúmen',1,'Insurgentes','Místico','heal','ancestral-song',0xe6bea9],
  ['Zahir','O Mestre das Almas',4,'Artífices da Alma','Invocador','forge','soul-forge',0x98cbea],
  ['Corven','O Artífice da Noite',3,'Artífices da Alma','Invocador','forge','soul-forge',0xc6a7e9],
  ['Seraphine','A Rainha da Estéria',4,'Corte Rubra','Espreitador','blood','blood-pact',0xdd6281],
  ['Isolde','A Diplomata Carmesim',2,'Corte Rubra','Trapaceiro','curse','blood-pact',0xe5a4b6],
  ['Astrid','A Armadura do Dia',4,'Corte Rubra','Guardião','guard','blood-pact',0xbec9d8],
  ['Maelis','A Estrategista da Corte',2,'Corte Rubra','Xamã','guard','blood-pact',0xa793d6],
  ['Oren Valis','O Viajante do Corredor',4,'Vozes do Véu','Xamã','portal','speaker-seal',0xd2b875],
  ['Sylvara','A Viajante Perdida',2,'Vigília','Brigão','blade','consecration',0x98bba4],
  ['Akemi','A Lâmina de Shiori',1,'Vigília','Espreitador','blade','consecration',0x8eaeca],
  ['Renji','O Arqueiro de Shiori',1,'Vigília','Caçador','volley','consecration',0xd4b89a],
  ['Nayara','A Defensora de Danora',2,'Insurgentes','Guardião','guard','consecration',0xa9bd8d],
  ['Vespera','A Guarda de Tarvessa',2,'Insurgentes','Brigão','blade','consecration',0x8bb8c5],
  ['Borvath','O Veterano da Guerra',3,'Corte Rubra','Brigão','beast','blood-pact',0xd7a177],
  ['Nharos','A Fome do Infinito',5,'Sol Negro','Necrófago','eclipse','eclipse',0xba9bdc],
  ['Hrold','O Viking Vampiro',2,'Corte Rubra','Brigão','beast','blood-pact',0xda9468],
  ['Shiori','A Senhora do Oriente',3,'Corte Rubra','Místico','blood','blood-pact',0xe27e85],
  ['Rajhan','O General Carmesim',2,'Corte Rubra','Guardião','blade','blood-pact',0xdbb86d],
  ['Kavira','A Lâmina Escarlate',2,'Corte Rubra','Espreitador','blade','blood-pact',0xd68ba4],
  ['Osskar','A Lança Ossuda',1,'Nascidos da Noite','Caçador','whip','soul-forge',0xd0c39f],
  ['Varkul','As Asas do Inferno',2,'Nascidos da Noite','Brigão','beast','soul-forge',0x88aeda],
  ['Azgorr','O Demônio de Gresan',1,'Nascidos da Noite','Brigão','beast','soul-forge',0x7fbbe2],
  ['Eresh','A Voz da Fenda',4,'Sol Negro','Místico','portal','soul-forge',0xac90d4],
  ['Mivren','A Memória Humana',1,'Nascidos da Noite','Xamã','curse','soul-forge',0xa8be92],
  ['Azrael','A Lâmina de Zahir',3,'Nascidos da Noite','Guardião','blade','soul-forge',0xc1c9e0],
  ['Dorian','O Homem do Mar',1,'Insurgentes','Guardião','guard','consecration',0x98bdc4],
  ['Saren','O Prior do Culto',1,'Sol Negro','Xamã','curse','eclipse',0xc595b4],
  ['Malrec','A Lei de Lindenor',1,'Insurgentes','Trapaceiro','curse','consecration',0xc09b8c],
  ['Osvan','O Fanático de Gresan',1,'Sol Negro','Xamã','curse','eclipse',0xe2b99c],
  ['Riven Ash','A Chama da Revolução',4,'Vigília','Caçador','whip','consecration',0x7faee8],
  ['Mirielle','A Guardiã dos Quatro',3,'Bestas Astrais','Invocador','forge','speaker-seal',0xa6d7a4],
  ['Amaya','O Ferro da Liberdade',4,'Insurgentes','Místico','elements','ancestral-song',0xe5c28a],
  ['Eloan','O Canto que Desperta',2,'Nascidos da Noite','Místico','heal','ancestral-song',0x9ad0b4],
  ['Teriel','A Voz da Neve',3,'Vozes do Véu','Místico','elements','speaker-seal',0xb6d8ed],
  ['Jovana','A Protetora de Baston',3,'Vigília','Caçador','whip','consecration',0x98bee3],
  ['Aldren','A Memória da Vigília',4,'Vigília','Místico','elements','consecration',0xe39993],
  ['Xolvar','A Serpente da Tempestade',4,'Corte Rubra','Espreitador','serpent','blood-pact',0x8fd6bb],
  ['Merek','O Cavaleiro da Fé',2,'Insurgentes','Guardião','guard','consecration',0xbcbbab],
  ['Zoraya','A Sacerdotisa do Eclipse',4,'Sol Negro','Espreitador','blood','eclipse',0xe19abb],
  ['Elysandra','A Devoradora do Sol',5,'Sol Negro','Místico','eclipse','eclipse',0xe7c68d],
  ['Emrys','O Abade da Forja',3,'Artífices da Alma','Invocador','forge','soul-forge',0xd0b68e],
  ['Ysola','A Voz dos Ancestrais',2,'Insurgentes','Xamã','heal','ancestral-song',0xb9a0d8],
  ['Vaelor','O Senhor das Correntes',2,'Corte Rubra','Trapaceiro','curse','blood-pact',0xc8b1a1],
  ['Jarek','A Alma que Resiste',1,'Nascidos da Noite','Brigão','beast','soul-forge',0x9abfaa],
  ['Sahmara','A Balança do Sol',5,'Sol Negro','Místico','eclipse','eclipse',0xf0cd7b],
  ['Pyris','A Asa de Mirielle',2,'Bestas Astrais','Caçador','volley','speaker-seal',0xe59665],
  ['Bairos','A Garra de Mirielle',2,'Bestas Astrais','Brigão','beast','speaker-seal',0xc6d7ec],
  ['Chelon','O Escudo de Mirielle',2,'Bestas Astrais','Guardião','guard','speaker-seal',0x9cbcb0],
  ['Azurion','O Sopro de Mirielle',4,'Bestas Astrais','Místico','serpent','speaker-seal',0x91c4e1],
];
const descriptions: Record<NightAbility,string> = {
  whip: 'Varre até três inimigos com o chicote: 180/230/290% de ataque, marca a presa por 5 s e reduz sua armadura em 12/18/24 por 5 s.',
  elements: 'Cria um campo elemental por 5 s: 35/45/60% de ataque mágico por segundo e lentidão. O impacto causa 160/210/280% de ataque.',
  blade: 'Avança contra o inimigo mais distante: 240/300/390% de ataque, fica inalvejável por 1 s e recebe escudo de 12/18/24% da vida.',
  blood: 'Drena até três inimigos próximos: 180/230/300% de ataque mágico. Recupera 35% do dano causado e aplica feridas por 5 s.',
  heal: 'Cura os três aliados mais feridos em 180/250/340% de ataque; remove veneno e maldição e concede 10 de mana.',
  forge: 'Forja 2/3/4 almas guerreiras por 9 s, com 18% da vida e 40/50/65% do ataque do conjurador. Limite de seis invocações por mestre.',
  guard: 'Escudo próprio de 25/35/45% da vida, provoca por 4 s e protege três aliados próximos com escudo de 12/18/25% da vida.',
  curse: 'Amaldiçoa os dois inimigos com mais vida: 200/270/350% de ataque mágico em 5 s, drena 15/25/35 de mana e reduz cura por 5 s.',
  volley: 'Dispara contra quatro inimigos: 140/180/230% de ataque; o alvo primário recebe um disparo adicional e fica marcado por 5 s.',
  portal: 'Abre uma fenda de 4 s: 45/60/80% de ataque mágico por segundo, lentidão e escudo de 18/25/32% da vida para o conjurador.',
  serpent: 'Assume a forma espiritual por 6 s, ganha 25/35/50% de ataque, atinge três alvos em 180/240/320% de ataque mágico e os envenena.',
  beast: 'Investida em área: 180/240/320% de ataque contra três inimigos próximos, atordoa o alvo por 1/1,3/1,6 s e ganha 25% de velocidade por 4 s.',
  eclipse: 'Eclipse sobre os quatro inimigos com mais vida: 210/280/370% de ataque mágico e feridas por 6 s. O conjurador recebe escudo de 20/28/36% da vida.',
};
const signatureNotes=["A marca concede velocidade aos aliados próximos.","O impacto deixa o alvo molhado por 5 s.","A espada viva concede ímpeto por 4 s.","Meteoros deixam um domínio rubro de 4 s.","A médica também escuda o aliado mais ferido.","A legião recebe reforço de um guerreiro alado.","A forja também cria uma fera de quitina.","A rainha amplia suas feridas para cinco inimigos.","As correntes reduzem o ataque da presa em 12% por 5 s.","A armadura concede +25 de armadura por 5 s.","A estrategista concede +10% de ataque a três aliados por 5 s.","O corredor devolve 15 de mana ao viajante.","A viajante recebe evasão por 1 s.","O corte causa mais 60% de ataque se a presa estiver abaixo de 40% da vida.","Flechas desaceleram duas presas por 3 s.","A muralha recebe 12% menos dano por 4 s.","A guarda ganha +20% de velocidade por 4 s.","O veterano derruba a armadura do alvo em 20 por 4 s.","A foice causa mais 80% de ataque verdadeiro em presas abaixo de 20% da vida.","Os machados concedem 12% de roubo de vida por 5 s.","O sangue concede regeneração imediata de 5% da vida.","A falange concede um escudo extra ao aliado mais ferido.","A dança desacelera a retaguarda atingida por 3 s.","A lança drena mais 10 de mana.","O sopro aplica veneno de 15% do ataque por segundo por 4 s.","A mordida recupera 8% da vida máxima.","A fenda deixa três presas com feridas por 6 s.","A memória concede 12 de mana a dois aliados.","O serafim ganha +20 de resistência mágica por 5 s.","A âncora limpa o próprio veneno e maldição.","A invocação prolonga a maldição da presa por 2 s.","A sentença provoca a atenção da presa por 2 s.","A palavra remove 10 de mana de três inimigos.","As chamas deixam um campo de fogo de 3 s.","Invoca quatro bestas astrais diferentes por 8 s, sem duplicar a forja comum.","O ferro ergue um escudo de 15% da vida do conjurador.","O canto acelera três aliados por 3 s.","A neve atordoa a presa por 0,8 s.","A aurora restaura 10 de mana ao caçador.","A última chama concede +15% de poder ao próximo ataque por 4 s.","A serpente amplia sua transformação para 8 s.","O juramento concede +20 de RM por 5 s.","As asas deslocam a sacerdotisa até a presa.","O sol negro concede +15% de ataque por 5 s.","O ofício escuda o aliado mais ferido.","O canto devolve 15 de mana a três aliados.","Os grilhões devolvem 12 de mana ao vampiro.","A alma rebelde atordoa a presa por mais 0,4 s.","A balança cura três aliados em 80% do ataque.","As plumas envenenam a presa com fogo por 4 s.","As garras desaceleram três inimigos por 3 s.","A carapaça protege a área em 12% por 4 s.","O sopro deixa três inimigos molhados por 6 s."];
const nightAbilityNames=["Marca da Vigília","Tríade Elemental","Dança da Espada Viva","Meteoros Rubros","Mãos de Lúmen","Legião das Almas","Coração da Forja","Lâmina da Rainha","Correntes do Pacto","Armadura do Amanhecer","Comando da Corte","Corredor entre Mundos","Passo da Viajante","Corte Silencioso","Flechas do Exílio","Muralha de Danora","Juramento da Guarda","Carga do Veterano","Foice da Última Alma","Machados da Fome","Sangue do Oriente","Falange Carmesim","Dança Escarlate","Lança de Ossos","Sopro Infernal","Mordida Azul","Fenda do Visitante","Memória Roubada","Espada do Serafim","Âncora da Vida","Invocação Profana","Sentença Sombria","Palavra do Fanático","Chicote das Chamas","As Quatro Bestas","Lâminas de Ferro e Terra","Canto da Alma Livre","Véu de Neve","Chicote da Aurora","Última Chama","Serpente da Tempestade","Juramento de Fé","Asas da Sacerdotisa","Sol Devorado","Ofício das Almas","Canto dos Ancestrais","Grilhões da Corte","Fúria da Alma Rebelde","Balança Solar","Plumas de Brasa","Garras Astrais","Carapaça do Véu","Sopro do Dragão"];
export const NIGHT_PROFILES = new Map<number,NightProfile>();
export const nocturneCharacters: Character[] = entries.map(([name,title,cost,faction,role,ability,rite,color],i) => {
  const id = 101+i, tank = ['Guardião','Brigão'].includes(role), ranged = ['Místico','Xamã','Invocador'].includes(role) || ability === 'volley';
  const hp = (tank ? 710 : 530) + cost * 90, attack = (tank ? 43 : 48) + cost * 7;
  NIGHT_PROFILES.set(id,{ability,rite,color,faction,source:i<33?'Castlevania':'Nocturne'});
  return { id,name,title,cost,traits:[faction,role],type:ranged?'Ranged':'Melee',hp:[hp,Math.round(hp*1.8),Math.round(hp*3.24)],attack:[attack,Math.round(attack*1.8),Math.round(attack*3.24)],armor:tank?45:25,magicResist:role==='Místico'?40:25,attackSpeed:role==='Espreitador'?.85:ranged?.7:.65,manaStart:['Xamã','Invocador'].includes(role)?25:0,manaMax:ability==='eclipse'?110:ability==='forge'?90:70,range:ranged?4:1,ability:{name:nightAbilityNames[i],description:(id===135?"Invoca Pyris, Bairos, Chelon e Azurion por 8 s. Cada besta recebe 16% da vida e 35/45/55% do ataque da conjuradora. Limite de seis invocações por mestre.":descriptions[ability]+" "+signatureNotes[i])},evolution:[`${name} em sua forma inicial: ${title.toLowerCase()}.`,`${name} domina ${faction.toLowerCase()}; armas e selos recebem uma aura sobrenatural.`,`${name} desperta seu avatar: a energia de ${faction.toLowerCase()} envolve sua silhueta e intensifica a habilidade.`],art:`nocturne-${id}`};

});
export const isNightCharacter = (id: number) => NIGHT_PROFILES.has(id);
export const NIGHT_CHARACTER_IDS = nocturneCharacters.map(c => c.id);
