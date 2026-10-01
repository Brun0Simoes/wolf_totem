// Canonical character data transcribed from docs/plano-original.txt.
// Keep prototype combat tuning separate from this source roster.
export interface Character {
  id: number;
  name: string;
  title: string;
  cost: number;
  traits: string[];
  type: string;
  hp: number[];
  attack: number[];
  armor: number;
  magicResist: number;
  attackSpeed: number;
  manaStart: number;
  manaMax: number;
  range: number;
  ability: { name: string; description: string };
  evolution: string[];
  art: string | null;
}

export const characters: Character[] = [
  {
    "id": 1,
    "name": "Akru",
    "title": "Presa Cinzenta",
    "cost": 1,
    "traits": [
      "Presas",
      "Caçador",
      "Espírito do Lobo"
    ],
    "type": "Melee",
    "hp": [
      650,
      1170,
      2105
    ],
    "attack": [
      55,
      99,
      178
    ],
    "armor": 35,
    "magicResist": 25,
    "attackSpeed": 0.75,
    "manaStart": 0,
    "manaMax": 60,
    "range": 1,
    "ability": {
      "name": "Caçada Marcada",
      "description": "salta sobre o alvo, causa 150/225/340% AD e o marca por 5s. Aliados que atacam a presa recebem 10/15/25% AS."
    },
    "evolution": [
      "jovem caçador de porte leve, cabelo cinza desgrenhado, lança curta, pés descalços e pintura branca nos olhos e mandíbula.",
      "cabelo cresce formando uma silhueta semelhante a uma juba; caninos ficam discretamente maiores; braceletes desenvolvem pequenas garras de energia.",
      "braços e pernas ficam parcialmente lupinos, olhos branco-azulados e uma enorme silhueta de lobo espiritual acompanha todos os seus movimentos."
    ],
    "art": "Akru"
  },
  {
    "id": 2,
    "name": "Nima",
    "title": "Tecelã de Orvalho",
    "cost": 1,
    "traits": [
      "Enxame",
      "Invocador",
      "Espírito da Aranha"
    ],
    "type": "Ranged",
    "hp": [
      520,
      935,
      1685
    ],
    "attack": [
      42,
      76,
      136
    ],
    "armor": 20,
    "magicResist": 30,
    "attackSpeed": 0.7,
    "manaStart": 20,
    "manaMax": 70,
    "range": 4,
    "ability": {
      "name": "Berçário de Seda",
      "description": "cria uma teia que reduz AS inimiga e invoca 2/3/5 pequenas manifestações."
    },
    "evolution": [
      "jovem tecelã com longos fios presos aos braços, roupa feita de fibras sobrepostas e pequenas agulhas de madeira.",
      "dois braços espectrais adicionais aparecem atrás dos ombros e seus fios passam a flutuar sozinhos.",
      "manifesta seis braços espirituais de aranha, olhos adicionais luminosos surgem brevemente na testa e uma teia gigantesca forma uma auréola atrás dela."
    ],
    "art": "Nima"
  },
  {
    "id": 3,
    "name": "Boru",
    "title": "Presa de Barro",
    "cost": 1,
    "traits": [
      "Manada",
      "Brigão"
    ],
    "type": "Melee",
    "hp": [
      720,
      1295,
      2335
    ],
    "attack": [
      60,
      108,
      194
    ],
    "armor": 40,
    "magicResist": 30,
    "attackSpeed": 0.6,
    "manaStart": 0,
    "manaMax": 70,
    "range": 1,
    "ability": {
      "name": "Investida Lamacenta",
      "description": "avança 2 hexes, causa dano, derruba e ganha escudo."
    },
    "evolution": [
      "guerreiro baixo e extremamente robusto, coberto por argila seca, cabelo raspado e arma de impacto curta.",
      "ombros engrossam e placas de barro endurecido recobrem o corpo; dois pequenos chifres espirituais aparecem na testa durante a corrida.",
      "corpo fica enorme, nariz e mandíbula assumem traços de javali e presas espirituais curvas aparecem sempre que entra em combate."
    ],
    "art": "Boru"
  },
  {
    "id": 4,
    "name": "Sesha",
    "title": "Víbora Verde",
    "cost": 1,
    "traits": [
      "Escamas",
      "Espreitador",
      "Espírito da Serpente"
    ],
    "type": "Melee",
    "hp": [
      560,
      1010,
      1815
    ],
    "attack": [
      52,
      94,
      168
    ],
    "armor": 25,
    "magicResist": 25,
    "attackSpeed": 0.8,
    "manaStart": 0,
    "manaMax": 50,
    "range": 1,
    "ability": {
      "name": "Troca de Pele",
      "description": "remove controles, fica inalvejável brevemente e fortalece os próximos ataques com veneno."
    },
    "evolution": [
      "assassina esguia, lâminas curvas, tranças longas e padrões verdes pintados ao longo dos braços.",
      "pupilas tornam-se verticais, pele ganha pequenos padrões de escamas e seus movimentos ficam quase sem articulação aparente.",
      "deixa constantemente uma imagem residual semelhante a uma pele abandonada; braços ficam alongados e uma cauda espiritual acompanha seus giros."
    ],
    "art": "Sesha"
  },
  {
    "id": 5,
    "name": "Kiko",
    "title": "Mão-Ligeira",
    "cost": 1,
    "traits": [
      "Copa",
      "Trapaceiro",
      "Espírito do Macaco"
    ],
    "type": "Ranged 2",
    "hp": [
      600,
      1080,
      1945
    ],
    "attack": [
      48,
      86,
      156
    ],
    "armor": 25,
    "magicResist": 25,
    "attackSpeed": 0.75,
    "manaStart": 30,
    "manaMax": 80,
    "range": 2,
    "ability": {
      "name": "Roubo Travesso",
      "description": "salta sobre um inimigo, rouba parte de AD/AP e retorna."
    },
    "evolution": [
      "adolescente acrobata com bastão curto, cabelo volumoso e dezenas de pequenos bolsos.",
      "braços parecem ligeiramente mais longos e uma cauda espectral ajuda seus saltos.",
      "três cópias espirituais imitam seus movimentos, mãos ficam parcialmente simiescas e sua cauda de energia passa a interagir fisicamente com inimigos."
    ],
    "art": "Kiko"
  },
  {
    "id": 6,
    "name": "Muru",
    "title": "Voz da Chuva",
    "cost": 1,
    "traits": [
      "Rio",
      "Místico"
    ],
    "type": "Ranged",
    "hp": [
      540,
      970,
      1750
    ],
    "attack": [
      40,
      72,
      130
    ],
    "armor": 20,
    "magicResist": 35,
    "attackSpeed": 0.65,
    "manaStart": 40,
    "manaMax": 90,
    "range": 4,
    "ability": {
      "name": "Chuva Curandeira",
      "description": "cria chuva que cura aliados e causa dano mágico a inimigos."
    },
    "evolution": [
      "xamã corpulento com grandes contas de madeira, folhas largas sobre os ombros e bastão cheio de recipientes de água.",
      "pele fica úmida e brilhante, garganta expande ao cantar e pequenos cogumelos surgem em seus acessórios.",
      "olhos tornam-se enormes e luminosos, mãos desenvolvem membranas e uma criatura anfíbia espiritual colossal canta atrás dele."
    ],
    "art": "Muru"
  },
  {
    "id": 7,
    "name": "Taka",
    "title": "Hiena Risonha",
    "cost": 1,
    "traits": [
      "Presas",
      "Brigão",
      "Necrófago"
    ],
    "type": "Melee",
    "hp": [
      680,
      1225,
      2205
    ],
    "attack": [
      58,
      104,
      188
    ],
    "armor": 35,
    "magicResist": 25,
    "attackSpeed": 0.7,
    "manaStart": 0,
    "manaMax": 60,
    "range": 1,
    "ability": {
      "name": "Riso da Carcaça",
      "description": "causa mais dano contra inimigos feridos e recupera vida ao executar."
    },
    "evolution": [
      "guerreiro magro, postura curvada, sorriso largo, cabelo irregular e duas pequenas lâminas serrilhadas.",
      "mandíbula ganha marcas negras, ombros ficam mais altos e risadas geram ecos animais.",
      "sorriso se transforma momentaneamente numa mandíbula espiritual gigantesca de hiena sempre que ataca uma presa enfraquecida."
    ],
    "art": "Taka"
  },
  {
    "id": 8,
    "name": "Ena",
    "title": "Olho do Crepúsculo",
    "cost": 1,
    "traits": [
      "Noturno",
      "Caçador",
      "Espírito da Coruja"
    ],
    "type": "Ranged",
    "hp": [
      560,
      1010,
      1815
    ],
    "attack": [
      50,
      90,
      162
    ],
    "armor": 20,
    "magicResist": 30,
    "attackSpeed": 0.75,
    "manaStart": 20,
    "manaMax": 70,
    "range": 4,
    "ability": {
      "name": "Olhar Noturno",
      "description": "marca o inimigo mais distante e fortalece ataques contra ele."
    },
    "evolution": [
      "arqueira jovem usando máscara circular que amplia visualmente os olhos.",
      "penas espirituais aparecem nos antebraços, máscara ganha dois grandes discos luminosos.",
      "enormes asas translúcidas se abrem ao atacar e múltiplos olhos espirituais surgem ao redor da cabeça."
    ],
    "art": "Ena"
  },
  {
    "id": 9,
    "name": "Paku",
    "title": "Casco do Lodo",
    "cost": 1,
    "traits": [
      "Rio",
      "Guardião"
    ],
    "type": "Melee",
    "hp": [
      760,
      1370,
      2460
    ],
    "attack": [
      45,
      81,
      146
    ],
    "armor": 45,
    "magicResist": 40,
    "attackSpeed": 0.55,
    "manaStart": 30,
    "manaMax": 90,
    "range": 1,
    "ability": {
      "name": "Casco Cerrado",
      "description": "reduz fortemente dano recebido e depois explode energia ao redor."
    },
    "evolution": [
      "guerreiro baixo usando enorme escudo circular de madeira, pedra e musgo.",
      "escudo passa a envolver ombros e costas como uma carapaça articulada.",
      "ao defender, placas espirituais formam um casco completo ao redor do corpo; pequenas plantas surgem sobre ele."
    ],
    "art": "Paku"
  },
  {
    "id": 10,
    "name": "Zirri",
    "title": "Lâmina-Folha",
    "cost": 1,
    "traits": [
      "Enxame",
      "Espreitador"
    ],
    "type": "Melee",
    "hp": [
      540,
      970,
      1750
    ],
    "attack": [
      62,
      112,
      201
    ],
    "armor": 25,
    "magicResist": 20,
    "attackSpeed": 0.85,
    "manaStart": 0,
    "manaMax": 50,
    "range": 1,
    "ability": {
      "name": "Três Cortes",
      "description": "desfere três golpes; o último provoca sangramento."
    },
    "evolution": [
      "guerreira extremamente magra com duas lâminas longas presas aos antebraços.",
      "cotovelos e antebraços ganham placas verdes de quitina espiritual.",
      "braços transformam-se parcialmente em lâminas serrilhadas, enquanto grandes asas semelhantes a folhas aparecem durante ataques críticos."
    ],
    "art": "Zirri"
  },
  {
    "id": 11,
    "name": "Ayo",
    "title": "Portador do Primeiro Totem",
    "cost": 1,
    "traits": [
      "Totêmico",
      "Xamã"
    ],
    "type": "Ranged",
    "hp": [
      580,
      1045,
      1880
    ],
    "attack": [
      43,
      77,
      139
    ],
    "armor": 25,
    "magicResist": 35,
    "attackSpeed": 0.65,
    "manaStart": 40,
    "manaMax": 100,
    "range": 4,
    "ability": {
      "name": "Totem da Brisa",
      "description": "finca um Totem que concede AS e Mana."
    },
    "evolution": [
      "jovem xamã carregando um pequeno Totem de madeira amarrado às costas.",
      "o Totem flutua e inscrições de vento percorrem seus braços.",
      "Totem torna-se quase do tamanho do personagem e manifesta uma enorme criatura alada abstrata sobre Ayo."
    ],
    "art": "Ayo"
  },
  {
    "id": 12,
    "name": "Kalu",
    "title": "Chifre Veloz",
    "cost": 1,
    "traits": [
      "Manada",
      "Caçador"
    ],
    "type": "Ranged",
    "hp": [
      620,
      1115,
      2010
    ],
    "attack": [
      54,
      97,
      175
    ],
    "armor": 30,
    "magicResist": 25,
    "attackSpeed": 0.8,
    "manaStart": 0,
    "manaMax": 60,
    "range": 3,
    "ability": {
      "name": "Dardo de Chifre",
      "description": "lança projétil que atravessa vários inimigos."
    },
    "evolution": [
      "caçador alto e muito veloz, usando duas lanças leves e adornos curvos sobre a cabeça.",
      "pernas tornam-se mais musculosas e chifres espirituais aparecem sobre a testa.",
      "pernas assumem forma parcialmente ungulada, chifres enormes de energia surgem e seus deslocamentos deixam múltiplas imagens residuais."
    ],
    "art": "Kalu"
  },
  {
    "id": 13,
    "name": "Viri",
    "title": "Asa de Fruta",
    "cost": 1,
    "traits": [
      "Noturno",
      "Místico"
    ],
    "type": "Ranged",
    "hp": [
      500,
      900,
      1620
    ],
    "attack": [
      38,
      68,
      123
    ],
    "armor": 20,
    "magicResist": 40,
    "attackSpeed": 0.7,
    "manaStart": 30,
    "manaMax": 80,
    "range": 4,
    "ability": {
      "name": "Eco Noturno",
      "description": "emite cone sonoro que causa dano e reduz AS."
    },
    "evolution": [
      "jovem curandeira noturna com tecido escuro formando grandes mangas.",
      "orelhas tornam-se discretamente alongadas e as mangas funcionam como membranas de energia.",
      "abre enormes asas espirituais de morcego e ondas sonoras visíveis percorrem todo o corpo."
    ],
    "art": "Viri"
  },
  {
    "id": 14,
    "name": "Jara",
    "title": "Puma da Folhagem",
    "cost": 2,
    "traits": [
      "Noturno",
      "Espreitador"
    ],
    "type": "Melee",
    "hp": [
      760,
      1370,
      2460
    ],
    "attack": [
      66,
      119,
      214
    ],
    "armor": 35,
    "magicResist": 30,
    "attackSpeed": 0.8,
    "manaStart": 0,
    "manaMax": 60,
    "range": 1,
    "ability": {
      "name": "Entre as Folhas",
      "description": "desaparece e ataca um inimigo isolado."
    },
    "evolution": [
      "caçadora de cabelos curtos, duas facas e pintura verde-escura cobrindo metade do rosto.",
      "mãos ganham garras espirituais e seus olhos refletem luz como os de um felino.",
      "postura fica quase quadrúpede durante movimentos; braços, pernas e mandíbula assumem características de puma ao entrar em furtividade."
    ],
    "art": null
  },
  {
    "id": 15,
    "name": "Grom",
    "title": "Punho Jovem",
    "cost": 2,
    "traits": [
      "Copa",
      "Guardião",
      "Espírito do Gorila"
    ],
    "type": "Melee",
    "hp": [
      900,
      1620,
      2915
    ],
    "attack": [
      58,
      104,
      188
    ],
    "armor": 45,
    "magicResist": 35,
    "attackSpeed": 0.65,
    "manaStart": 30,
    "manaMax": 90,
    "range": 1,
    "ability": {
      "name": "Peito de Guerra",
      "description": "provoca inimigos e ganha grande escudo."
    },
    "evolution": [
      "jovem enorme lutando de mãos nuas, antebraços protegidos por madeira grossa.",
      "braços e costas crescem, cabelo forma uma faixa prateada e punhos ficam cobertos de energia.",
      "assume aparência quase híbrida de grande símio, com braços enormes tocando o chão e silhueta espiritual duplicando seu tamanho."
    ],
    "art": null
  },
  {
    "id": 16,
    "name": "Ilya",
    "title": "Garra do Céu",
    "cost": 2,
    "traits": [
      "Copa",
      "Caçador",
      "Espírito da Águia"
    ],
    "type": "Ranged",
    "hp": [
      680,
      1225,
      2205
    ],
    "attack": [
      68,
      122,
      220
    ],
    "armor": 25,
    "magicResist": 30,
    "attackSpeed": 0.8,
    "manaStart": 0,
    "manaMax": 70,
    "range": 4,
    "ability": {
      "name": "Mergulho Celeste",
      "description": "sobe e mergulha sobre o inimigo com menor armadura."
    },
    "evolution": [
      "lanceira ágil com capa curta de penas estilizadas.",
      "olhos dourados e penas espirituais surgem nos braços.",
      "braços se transformam parcialmente em asas durante o salto e pés desenvolvem garras de energia."
    ],
    "art": null
  },
  {
    "id": 17,
    "name": "Nask",
    "title": "Boca do Delta",
    "cost": 2,
    "traits": [
      "Rio",
      "Escamas",
      "Guardião",
      "Espírito do Crocodilo"
    ],
    "type": "Melee",
    "hp": [
      880,
      1585,
      2850
    ],
    "attack": [
      62,
      112,
      201
    ],
    "armor": 50,
    "magicResist": 40,
    "attackSpeed": 0.6,
    "manaStart": 20,
    "manaMax": 80,
    "range": 1,
    "ability": {
      "name": "Giro da Morte",
      "description": "agarra o alvo, causa dano e recupera vida."
    },
    "evolution": [
      "guerreiro de rio largo e musculoso, machado pesado e placas verdes nos ombros.",
      "pele ganha textura escamosa, dentes ficam maiores e olhos amarelados.",
      "mandíbula, costas e cauda tornam-se parcialmente crocodilianas durante combate corpo a corpo."
    ],
    "art": null
  },
  {
    "id": 18,
    "name": "Rava",
    "title": "Xamã das Penas Negras",
    "cost": 2,
    "traits": [
      "Totêmico",
      "Xamã",
      "Espírito do Corvo"
    ],
    "type": "Ranged",
    "hp": [
      700,
      1260,
      2270
    ],
    "attack": [
      48,
      86,
      156
    ],
    "armor": 25,
    "magicResist": 40,
    "attackSpeed": 0.65,
    "manaStart": 40,
    "manaMax": 100,
    "range": 4,
    "ability": {
      "name": "Presságio",
      "description": "invoca corvos; mortes posteriores geram Mana."
    },
    "evolution": [
      "xamã de manto negro, cabelo longo e cajado fino.",
      "várias penas flutuam permanentemente e olhos escurecem completamente.",
      "corpo se desfaz parcialmente em corvos sempre que se move; enorme par de asas espectrais aparece ao conjurar."
    ],
    "art": null
  },
  {
    "id": 19,
    "name": "Tembu",
    "title": "Muralha de Chifres",
    "cost": 2,
    "traits": [
      "Manada",
      "Guardião"
    ],
    "type": "Melee",
    "hp": [
      950,
      1710,
      3080
    ],
    "attack": [
      55,
      99,
      178
    ],
    "armor": 50,
    "magicResist": 35,
    "attackSpeed": 0.55,
    "manaStart": 40,
    "manaMax": 100,
    "range": 1,
    "ability": {
      "name": "Linha Inquebrável",
      "description": "aumenta resistência de aliados adjacentes e empurra inimigos."
    },
    "evolution": [
      "soldado extremamente largo carregando escudo horizontal e dois adornos curvos no capacete.",
      "pescoço e ombros engrossam, chifres espirituais crescem sobre a cabeça.",
      "uma enorme cabeça espectral de búfalo envolve tronco e escudo, formando uma muralha viva."
    ],
    "art": null
  },
  {
    "id": 20,
    "name": "Zakka",
    "title": "Cauda Rubra",
    "cost": 2,
    "traits": [
      "Enxame",
      "Espreitador"
    ],
    "type": "Melee",
    "hp": [
      720,
      1295,
      2335
    ],
    "attack": [
      72,
      130,
      233
    ],
    "armor": 30,
    "magicResist": 25,
    "attackSpeed": 0.75,
    "manaStart": 0,
    "manaMax": 60,
    "range": 1,
    "ability": {
      "name": "Ferrão Carmesim",
      "description": "golpeia, atordoa e aplica veneno."
    },
    "evolution": [
      "duelista de pele pintada de vermelho e arma curva presa ao antebraço.",
      "placas de quitina aparecem nos ombros e uma cauda espiritual curta surge.",
      "longa cauda de escorpião espiritual cresce das costas e ataca independentemente junto de Zakka."
    ],
    "art": null
  },
  {
    "id": 21,
    "name": "Omi",
    "title": "Risonho das Águas",
    "cost": 2,
    "traits": [
      "Rio",
      "Trapaceiro"
    ],
    "type": "Ranged",
    "hp": [
      740,
      1330,
      2400
    ],
    "attack": [
      50,
      90,
      162
    ],
    "armor": 30,
    "magicResist": 35,
    "attackSpeed": 0.7,
    "manaStart": 30,
    "manaMax": 90,
    "range": 3,
    "ability": {
      "name": "Troca de Correnteza",
      "description": "troca de posição com um aliado ferido e protege ambos."
    },
    "evolution": [
      "guerreiro pequeno e extremamente ágil, usando funda e pedras polidas.",
      "cabelos ficam permanentemente molhados e água começa a correr ao redor de seus pés.",
      "mãos e pés ganham membranas espirituais e Omi desliza pelo campo sobre uma lontra de água translúcida."
    ],
    "art": null
  },
  {
    "id": 22,
    "name": "Suri",
    "title": "Coral de Sangue",
    "cost": 2,
    "traits": [
      "Escamas",
      "Xamã",
      "Espírito da Serpente"
    ],
    "type": "Ranged",
    "hp": [
      700,
      1260,
      2270
    ],
    "attack": [
      46,
      83,
      149
    ],
    "armor": 25,
    "magicResist": 35,
    "attackSpeed": 0.7,
    "manaStart": 30,
    "manaMax": 80,
    "range": 3,
    "ability": {
      "name": "Veneno Saltante",
      "description": "veneno ricocheteia entre inimigos e reduz cura."
    },
    "evolution": [
      "xamã de roupas vermelhas, pinturas em anéis e bastão curvo.",
      "pequenas escamas vermelhas aparecem no rosto e pescoço.",
      "parte inferior do corpo torna-se uma longa cauda espiritual enquanto várias serpentes de energia se enrolam em seus braços."
    ],
    "art": null
  },
  {
    "id": 23,
    "name": "Kesh",
    "title": "Leopardo Nebuloso",
    "cost": 2,
    "traits": [
      "Copa",
      "Espreitador"
    ],
    "type": "Melee",
    "hp": [
      720,
      1295,
      2335
    ],
    "attack": [
      74,
      133,
      240
    ],
    "armor": 30,
    "magicResist": 25,
    "attackSpeed": 0.85,
    "manaStart": 0,
    "manaMax": 60,
    "range": 1,
    "ability": {
      "name": "Salto entre Galhos",
      "description": "salta grandes distâncias e realiza dois ataques."
    },
    "evolution": [
      "assassino esguio com lâminas nos pés e mãos.",
      "manchas escuras aparecem sobre braços e costas; olhos tornam-se felinos.",
      "braços e pernas ficam parcialmente felinos e longos, enquanto galhos espirituais surgem sob seus pés a cada salto."
    ],
    "art": null
  },
  {
    "id": 24,
    "name": "Brak",
    "title": "Casco de Quitina",
    "cost": 2,
    "traits": [
      "Enxame",
      "Guardião"
    ],
    "type": "Melee",
    "hp": [
      920,
      1655,
      2980
    ],
    "attack": [
      55,
      99,
      178
    ],
    "armor": 55,
    "magicResist": 45,
    "attackSpeed": 0.55,
    "manaStart": 30,
    "manaMax": 90,
    "range": 1,
    "ability": {
      "name": "Carapaça de Guerra",
      "description": "cria escudo que explode quando destruído."
    },
    "evolution": [
      "guerreiro pesado usando armadura de placas negras sobrepostas.",
      "placas começam a crescer diretamente sobre braços e costas.",
      "enormes placas espirituais formam uma carapaça completa e um grande chifre frontal aparece durante investidas."
    ],
    "art": null
  },
  {
    "id": 25,
    "name": "Sena",
    "title": "Guardiã da Gazela",
    "cost": 2,
    "traits": [
      "Manada",
      "Místico",
      "Espírito do Cervo"
    ],
    "type": "Ranged",
    "hp": [
      680,
      1225,
      2205
    ],
    "attack": [
      45,
      81,
      146
    ],
    "armor": 25,
    "magicResist": 40,
    "attackSpeed": 0.7,
    "manaStart": 40,
    "manaMax": 100,
    "range": 4,
    "ability": {
      "name": "Passos da Primavera",
      "description": "cura aliados e aumenta AS."
    },
    "evolution": [
      "curandeira alta e leve, tecidos claros e pequenas flores trançadas no cabelo.",
      "pequenos chifres espirituais aparecem e plantas brotam após seus passos.",
      "grandes galhadas luminosas crescem sobre a cabeça, pernas ficam parcialmente cervídeas e uma floresta efêmera nasce durante a habilidade."
    ],
    "art": null
  },
  {
    "id": 26,
    "name": "Uru",
    "title": "Chacal do Osso",
    "cost": 2,
    "traits": [
      "Presas",
      "Trapaceiro",
      "Necrófago"
    ],
    "type": "Melee",
    "hp": [
      760,
      1370,
      2460
    ],
    "attack": [
      64,
      115,
      207
    ],
    "armor": 35,
    "magicResist": 25,
    "attackSpeed": 0.75,
    "manaStart": 0,
    "manaMax": 70,
    "range": 1,
    "ability": {
      "name": "Rouba-Ossos",
      "description": "causa dano e rouba ARM/MR."
    },
    "evolution": [
      "saqueador rápido com máscara alongada e duas pequenas lâminas.",
      "máscara se funde parcialmente ao rosto e unhas viram garras.",
      "forma uma cabeça espiritual de chacal sobre a própria cabeça e ossos etéreos orbitam o corpo como troféus."
    ],
    "art": null
  },
  {
    "id": 27,
    "name": "Amaru",
    "title": "Jaguar da Lua",
    "cost": 3,
    "traits": [
      "Noturno",
      "Presas",
      "Espreitador",
      "Espírito do Jaguar"
    ],
    "type": "Melee",
    "hp": [
      850,
      1530,
      2755
    ],
    "attack": [
      78,
      140,
      253
    ],
    "armor": 35,
    "magicResist": 30,
    "attackSpeed": 0.85,
    "manaStart": 0,
    "manaMax": 70,
    "range": 1,
    "ability": {
      "name": "Forma Lunar",
      "description": "transforma-se por 8s, ganhando AS e saltando através dos inimigos."
    },
    "evolution": [
      "guerreira de cabelos negros, duas lâminas curvas e pintura prateada em manchas.",
      "olhos tornam-se prateados, garras aparecem e manchas começam a emitir luz.",
      "mesmo fora da habilidade apresenta uma forma humano-jaguar elegante; ao conjurar, transforma-se quase completamente em uma fera bípede lunar."
    ],
    "art": null
  },
  {
    "id": 28,
    "name": "Duma",
    "title": "Matriarca do Marfim",
    "cost": 3,
    "traits": [
      "Manada",
      "Guardião",
      "Espírito do Elefante"
    ],
    "type": "Melee",
    "hp": [
      1100,
      1980,
      3565
    ],
    "attack": [
      62,
      112,
      201
    ],
    "armor": 55,
    "magicResist": 45,
    "attackSpeed": 0.55,
    "manaStart": 50,
    "manaMax": 120,
    "range": 1,
    "ability": {
      "name": "Chamado da Matriarca",
      "description": "protege aliados e empurra inimigos."
    },
    "evolution": [
      "líder alta e robusta carregando um enorme bastão e grandes adornos claros nos ombros.",
      "braços engrossam e pequenas presas espirituais surgem ao lado do rosto.",
      "pele assume textura espessa, orelhas espirituais gigantes aparecem e uma cabeça ancestral de elefante cobre sua silhueta."
    ],
    "art": null
  },
  {
    "id": 29,
    "name": "Roko",
    "title": "Oráculo da Copa",
    "cost": 3,
    "traits": [
      "Copa",
      "Xamã",
      "Espírito do Macaco"
    ],
    "type": "Ranged",
    "hp": [
      850,
      1530,
      2755
    ],
    "attack": [
      56,
      101,
      181
    ],
    "armor": 35,
    "magicResist": 45,
    "attackSpeed": 0.65,
    "manaStart": 50,
    "manaMax": 110,
    "range": 3,
    "ability": {
      "name": "Eco da Última Palavra",
      "description": "repete uma versão da última habilidade aliada."
    },
    "evolution": [
      "ancião alto de braços longos, cabelo avermelhado e cajado retorcido.",
      "braços ficam ainda mais longos, mãos maiores e uma cauda espiritual aparece.",
      "postura e proporções lembram um grande primata ancestral, enquanto três duplicatas espirituais repetem suas conjurações."
    ],
    "art": null
  },
  {
    "id": 30,
    "name": "Khepri",
    "title": "Escaravelho Solar",
    "cost": 3,
    "traits": [
      "Enxame",
      "Invocador"
    ],
    "type": "Ranged",
    "hp": [
      820,
      1475,
      2655
    ],
    "attack": [
      50,
      90,
      162
    ],
    "armor": 45,
    "magicResist": 45,
    "attackSpeed": 0.6,
    "manaStart": 40,
    "manaMax": 100,
    "range": 3,
    "ability": {
      "name": "Ninhada Solar",
      "description": "invoca escaravelhos que bloqueiam golpes e explodem."
    },
    "evolution": [
      "sacerdote de torso coberto por placas douradas arredondadas.",
      "placas criam uma carapaça parcial; dois pequenos chifres aparecem na testa.",
      "costas abrem-se em asas luminosas e um enorme escaravelho solar espectral paira sobre ele."
    ],
    "art": null
  },
  {
    "id": 31,
    "name": "Vesh",
    "title": "Rei Cobra",
    "cost": 3,
    "traits": [
      "Escamas",
      "Xamã",
      "Espírito da Serpente"
    ],
    "type": "Ranged",
    "hp": [
      820,
      1475,
      2655
    ],
    "attack": [
      52,
      94,
      168
    ],
    "armor": 30,
    "magicResist": 45,
    "attackSpeed": 0.7,
    "manaStart": 30,
    "manaMax": 90,
    "range": 3,
    "ability": {
      "name": "Veneno do Rei",
      "description": "lança veneno em linha; alvos muito envenenados são paralisados."
    },
    "evolution": [
      "sacerdote alto com grande gola semicircular e cajado em espiral.",
      "gola se abre como um capuz, olhos ficam dourados e língua torna-se bifurcada.",
      "pescoço se alonga durante casts e várias cabeças de cobra espirituais surgem atrás de sua própria cabeça."
    ],
    "art": null
  },
  {
    "id": 32,
    "name": "Toru",
    "title": "Senhor do Remanso",
    "cost": 3,
    "traits": [
      "Rio",
      "Guardião"
    ],
    "type": "Melee",
    "hp": [
      1150,
      2070,
      3725
    ],
    "attack": [
      66,
      119,
      214
    ],
    "armor": 55,
    "magicResist": 45,
    "attackSpeed": 0.55,
    "manaStart": 40,
    "manaMax": 110,
    "range": 1,
    "ability": {
      "name": "Remanso Violento",
      "description": "cria uma área de água onde regenera rapidamente."
    },
    "evolution": [
      "guerreiro gigantesco e pesado, quase sempre coberto de lama e carregando um martelo curto.",
      "corpo ganha enorme volume, nariz fica largo e presas espirituais surgem na mandíbula.",
      "assume aspecto parcialmente hipopótamo, com mandíbula colossal e pele de água e lama endurecida."
    ],
    "art": null
  },
  {
    "id": 33,
    "name": "Asha",
    "title": "Corvo da Cinza",
    "cost": 3,
    "traits": [
      "Ancestral",
      "Caçador",
      "Espírito do Corvo"
    ],
    "type": "Ranged",
    "hp": [
      780,
      1405,
      2525
    ],
    "attack": [
      70,
      126,
      227
    ],
    "armor": 25,
    "magicResist": 40,
    "attackSpeed": 0.8,
    "manaStart": 20,
    "manaMax": 80,
    "range": 4,
    "ability": {
      "name": "Penas dos Mortos",
      "description": "mortes geram penas; Asha dispara todas ao conjurar."
    },
    "evolution": [
      "arqueira de cabelos cinza, roupa negra e flechas semelhantes a penas.",
      "cabelos tornam-se parcialmente penas e sombra se movimenta de forma independente.",
      "braços podem abrir como asas durante os tiros e dezenas de corvos ancestrais orbitam seu corpo."
    ],
    "art": null
  },
  {
    "id": 34,
    "name": "Thari",
    "title": "Chifre de Guerra",
    "cost": 3,
    "traits": [
      "Manada",
      "Brigão"
    ],
    "type": "Melee",
    "hp": [
      1050,
      1890,
      3400
    ],
    "attack": [
      74,
      133,
      240
    ],
    "armor": 50,
    "magicResist": 35,
    "attackSpeed": 0.6,
    "manaStart": 0,
    "manaMax": 80,
    "range": 1,
    "ability": {
      "name": "Rompe-Linhas",
      "description": "investe através da formação inimiga."
    },
    "evolution": [
      "guerreiro pesado usando enorme chifre frontal em seu capacete.",
      "pele engrossa sobre ombros, pernas ficam mais maciças e o chifre aumenta.",
      "durante movimento assume uma forma humanoide-rinoceronte completa da cintura para cima."
    ],
    "art": null
  },
  {
    "id": 35,
    "name": "Mako",
    "title": "Arraia de Água Negra",
    "cost": 3,
    "traits": [
      "Rio",
      "Místico"
    ],
    "type": "Ranged",
    "hp": [
      800,
      1440,
      2590
    ],
    "attack": [
      48,
      86,
      156
    ],
    "armor": 30,
    "magicResist": 50,
    "attackSpeed": 0.65,
    "manaStart": 40,
    "manaMax": 100,
    "range": 4,
    "ability": {
      "name": "Véu de Água Negra",
      "description": "cria região que protege aliados e danifica inimigos."
    },
    "evolution": [
      "sacerdotisa de rio com manto muito largo e achatado.",
      "manto começa a flutuar como se estivesse submerso e duas extensões de água surgem nos braços.",
      "corpo desliza levemente acima do chão e o manto espiritual assume a forma inteira de uma gigantesca arraia."
    ],
    "art": null
  },
  {
    "id": 36,
    "name": "Sava",
    "title": "Tigresa Dourada",
    "cost": 3,
    "traits": [
      "Presas",
      "Espreitador"
    ],
    "type": "Melee",
    "hp": [
      860,
      1550,
      2785
    ],
    "attack": [
      82,
      148,
      266
    ],
    "armor": 35,
    "magicResist": 30,
    "attackSpeed": 0.8,
    "manaStart": 0,
    "manaMax": 70,
    "range": 1,
    "ability": {
      "name": "Frenesi Dourado",
      "description": "transforma-se, ganhando sustain e ataques em cone."
    },
    "evolution": [
      "guerreira musculosa com duas manoplas e linhas douradas pintadas no corpo.",
      "dentes, garras e olhos tornam-se felinos; cabelo cresce como pequena juba.",
      "fora do cast já possui traços híbridos; durante Frenesi transforma-se numa tigresa humanoide dourada quase completa."
    ],
    "art": null
  },
  {
    "id": 37,
    "name": "Nilo",
    "title": "Quebra-Cupins",
    "cost": 3,
    "traits": [
      "Copa",
      "Guardião"
    ],
    "type": "Melee",
    "hp": [
      1000,
      1800,
      3240
    ],
    "attack": [
      68,
      122,
      220
    ],
    "armor": 50,
    "magicResist": 40,
    "attackSpeed": 0.6,
    "manaStart": 30,
    "manaMax": 100,
    "range": 1,
    "ability": {
      "name": "Língua de Guerra",
      "description": "atinge inimigos em linha e puxa o primeiro."
    },
    "evolution": [
      "guerreiro alto com antebraços enormes e uma arma flexível enrolada na cintura.",
      "mãos tornam-se grandes garras e rosto ganha linhas alongadas.",
      "focinho espiritual se sobrepõe ao rosto e sua língua energética pode alcançar vários metros."
    ],
    "art": null
  },
  {
    "id": 38,
    "name": "Yara",
    "title": "Voz da Lua Branca",
    "cost": 3,
    "traits": [
      "Totêmico",
      "Místico",
      "Espírito da Coruja"
    ],
    "type": "Ranged",
    "hp": [
      760,
      1370,
      2460
    ],
    "attack": [
      45,
      81,
      146
    ],
    "armor": 30,
    "magicResist": 55,
    "attackSpeed": 0.65,
    "manaStart": 50,
    "manaMax": 120,
    "range": 4,
    "ability": {
      "name": "Ritual da Lua",
      "description": "cria escudos e resistência mágica para aliados."
    },
    "evolution": [
      "sacerdotisa com máscara branca lisa e cajado lunar.",
      "máscara ganha grandes olhos luminosos e penas aparecem no manto.",
      "máscara funde-se ao rosto, braços ganham asas brancas translúcidas e uma lua enorme acompanha seu cast."
    ],
    "art": null
  },
  {
    "id": 39,
    "name": "Fenra",
    "title": "Matriarca da Matilha",
    "cost": 4,
    "traits": [
      "Presas",
      "Caçador",
      "Espírito do Lobo"
    ],
    "type": "Melee",
    "hp": [
      950,
      1710,
      3080
    ],
    "attack": [
      88,
      158,
      285
    ],
    "armor": 40,
    "magicResist": 35,
    "attackSpeed": 0.85,
    "manaStart": 0,
    "manaMax": 80,
    "range": 1,
    "ability": {
      "name": "A Grande Caçada",
      "description": "marca uma presa e inicia uma caçada coletiva."
    },
    "evolution": [
      "líder veterana de cabelos grisalhos, lança longa e cicatrizes antigas.",
      "orelhas e olhos tornam-se lupinos; garras espirituais recobrem suas mãos.",
      "assume forma híbrida de loba durante combate, com pernas digitígradas e grande juba; uma matilha de espíritos corre ao seu redor."
    ],
    "art": null
  },
  {
    "id": 40,
    "name": "Koru",
    "title": "Costas de Prata",
    "cost": 4,
    "traits": [
      "Copa",
      "Brigão",
      "Espírito do Gorila"
    ],
    "type": "Melee",
    "hp": [
      1250,
      2250,
      4050
    ],
    "attack": [
      84,
      151,
      272
    ],
    "armor": 55,
    "magicResist": 45,
    "attackSpeed": 0.6,
    "manaStart": 30,
    "manaMax": 100,
    "range": 1,
    "ability": {
      "name": "Domínio",
      "description": "cria território onde fica muito mais poderoso."
    },
    "evolution": [
      "guerreiro gigantesco, cabelos grisalhos e braços desproporcionalmente grandes.",
      "costas, braços e mandíbula assumem traços de grande símio.",
      "transforma-se num colosso humano-gorila com braços quase tocando o chão e aura territorial de raízes quebradas."
    ],
    "art": null
  },
  {
    "id": 41,
    "name": "Makara",
    "title": "Mandíbula Antiga",
    "cost": 4,
    "traits": [
      "Rio",
      "Escamas",
      "Brigão",
      "Espírito do Crocodilo"
    ],
    "type": "Melee",
    "hp": [
      1200,
      2160,
      3890
    ],
    "attack": [
      90,
      162,
      292
    ],
    "armor": 55,
    "magicResist": 45,
    "attackSpeed": 0.65,
    "manaStart": 20,
    "manaMax": 90,
    "range": 1,
    "ability": {
      "name": "Giro Ancestral",
      "description": "imobiliza brutalmente um inimigo e causa dano percentual."
    },
    "evolution": [
      "guerreiro ancestral enorme com arma dentada e pele marcada.",
      "placas escamosas cobrem grande parte das costas, mandíbula fica mais larga.",
      "da cintura para cima parece um híbrido crocodiliano colossal, com cauda espiritual extremamente pesada."
    ],
    "art": null
  },
  {
    "id": 42,
    "name": "Nyala",
    "title": "Pantera do Eclipse",
    "cost": 4,
    "traits": [
      "Noturno",
      "Espreitador",
      "Espírito do Jaguar"
    ],
    "type": "Melee",
    "hp": [
      900,
      1620,
      2915
    ],
    "attack": [
      96,
      173,
      311
    ],
    "armor": 35,
    "magicResist": 30,
    "attackSpeed": 0.9,
    "manaStart": 0,
    "manaMax": 70,
    "range": 1,
    "ability": {
      "name": "Passo do Eclipse",
      "description": "desaparece e realiza múltiplos golpes entre inimigos."
    },
    "evolution": [
      "assassina completamente vestida em preto, apenas olhos violetas visíveis.",
      "dedos desenvolvem garras, sombra assume silhueta felina independente.",
      "corpo é parcialmente composto por escuridão; rosto, mãos e pernas tornam-se felinos durante cada teleporte."
    ],
    "art": null
  },
  {
    "id": 43,
    "name": "Vahara",
    "title": "Coração de Marfim",
    "cost": 4,
    "traits": [
      "Manada",
      "Guardião",
      "Espírito do Elefante"
    ],
    "type": "Melee",
    "hp": [
      1350,
      2430,
      4375
    ],
    "attack": [
      72,
      130,
      233
    ],
    "armor": 60,
    "magicResist": 55,
    "attackSpeed": 0.55,
    "manaStart": 60,
    "manaMax": 130,
    "range": 1,
    "ability": {
      "name": "Marcha das Memórias",
      "description": "avança protegendo aliados atrás dele."
    },
    "evolution": [
      "chefe guerreiro idoso de enorme porte, usando grande escudo frontal.",
      "pequenas presas espirituais surgem e sua pele ganha textura espessa.",
      "cabeça e ombros são envolvidos por um elefante ancestral transparente, fazendo Vahara parecer um híbrido colossal."
    ],
    "art": null
  },
  {
    "id": 44,
    "name": "Zyri",
    "title": "Mãe das Mil Teias",
    "cost": 4,
    "traits": [
      "Enxame",
      "Invocador",
      "Espírito da Aranha"
    ],
    "type": "Ranged",
    "hp": [
      900,
      1620,
      2915
    ],
    "attack": [
      52,
      94,
      168
    ],
    "armor": 35,
    "magicResist": 50,
    "attackSpeed": 0.65,
    "manaStart": 50,
    "manaMax": 120,
    "range": 4,
    "ability": {
      "name": "Reino de Seda",
      "description": "cobre grandes áreas com teia e invoca manifestações."
    },
    "evolution": [
      "matriarca de longos cabelos brancos e oito agulhas presas às costas.",
      "quatro braços espirituais extras surgem e olhos adicionais aparecem no rosto.",
      "oito membros aracnídeos completos emergem das costas, permitindo que ela flutue acima do chão enquanto mantém torso humano."
    ],
    "art": null
  },
  {
    "id": 45,
    "name": "Orun",
    "title": "Xamã das Mil Máscaras",
    "cost": 4,
    "traits": [
      "Totêmico",
      "Xamã",
      "Espírito do Macaco"
    ],
    "type": "Ranged",
    "hp": [
      850,
      1530,
      2755
    ],
    "attack": [
      58,
      104,
      188
    ],
    "armor": 30,
    "magicResist": 55,
    "attackSpeed": 0.7,
    "manaStart": 60,
    "manaMax": 130,
    "range": 4,
    "ability": {
      "name": "Três Máscaras",
      "description": "alterna entre Jaguar, Elefante e Coruja."
    },
    "evolution": [
      "xamã jovem carregando três máscaras presas ao corpo.",
      "máscaras flutuam independentemente e modificam seus olhos/postura quando ativadas.",
      "dezenas de máscaras orbitam Orun; cada uma projeta partes animalescas diferentes sobre seu corpo sem que ele deixe de ser humano."
    ],
    "art": null
  },
  {
    "id": 46,
    "name": "Sakar",
    "title": "Serpente Emplumada",
    "cost": 4,
    "traits": [
      "Escamas",
      "Copa",
      "Xamã",
      "Espírito da Serpente"
    ],
    "type": "Ranged",
    "hp": [
      900,
      1620,
      2915
    ],
    "attack": [
      60,
      108,
      194
    ],
    "armor": 35,
    "magicResist": 55,
    "attackSpeed": 0.75,
    "manaStart": 30,
    "manaMax": 100,
    "range": 4,
    "ability": {
      "name": "Muda Celeste",
      "description": "ganha voo temporário e dispara penas venenosas."
    },
    "evolution": [
      "xamã extremamente alto com manto comprido de padrões coloridos.",
      "escamas aparecem nos braços e grandes penas crescem sobre ombros.",
      "pernas transformam-se em longa cauda serpentiforme espiritual enquanto enormes asas emplumadas surgem durante o voo."
    ],
    "art": null
  },
  {
    "id": 47,
    "name": "Aruun",
    "title": "Garra das Correntes",
    "cost": 4,
    "traits": [
      "Rio",
      "Caçador",
      "Espírito da Águia"
    ],
    "type": "Ranged",
    "hp": [
      880,
      1585,
      2850
    ],
    "attack": [
      92,
      166,
      298
    ],
    "armor": 30,
    "magicResist": 35,
    "attackSpeed": 0.85,
    "manaStart": 0,
    "manaMax": 80,
    "range": 4,
    "ability": {
      "name": "Predador da Corrente",
      "description": "mergulha sobre um alvo e fortalece ataques contra inimigos molhados."
    },
    "evolution": [
      "caçador de rio usando arpão longo e capa de tecido azul.",
      "penas azuis e douradas aparecem nos braços e olhos ficam extremamente claros.",
      "ganha asas espirituais permanentes; pés viram garras de ave durante mergulho e água forma uma segunda águia ao seu redor."
    ],
    "art": null
  },
  {
    "id": 48,
    "name": "Boro",
    "title": "Rei dos Búfalos",
    "cost": 4,
    "traits": [
      "Manada",
      "Brigão"
    ],
    "type": "Melee",
    "hp": [
      1300,
      2340,
      4210
    ],
    "attack": [
      80,
      144,
      259
    ],
    "armor": 60,
    "magicResist": 45,
    "attackSpeed": 0.55,
    "manaStart": 40,
    "manaMax": 110,
    "range": 1,
    "ability": {
      "name": "Estouro da Manada",
      "description": "invoca uma carga espiritual de búfalos."
    },
    "evolution": [
      "chefe enorme com dois grandes chifres artificiais presos ao elmo.",
      "chifres espirituais verdadeiros atravessam a aura ao redor de sua cabeça e pescoço engrossa.",
      "parte superior torna-se um híbrido de búfalo, com pelagem espiritual sobre ombros e enormes cascos energéticos durante investidas."
    ],
    "art": null
  },
  {
    "id": 49,
    "name": "Uruq",
    "title": "Urso do Primeiro Inverno",
    "cost": 5,
    "traits": [
      "Ancestral",
      "Guardião",
      "Espírito do Urso"
    ],
    "type": "Melee",
    "hp": [
      1500,
      2700,
      4860
    ],
    "attack": [
      100,
      180,
      324
    ],
    "armor": 70,
    "magicResist": 60,
    "attackSpeed": 0.6,
    "manaStart": 40,
    "manaMax": 120,
    "range": 1,
    "ability": {
      "name": "Primeiro Inverno",
      "description": "transforma-se em uma criatura colossal, ganha vida e resistências e congela o território."
    },
    "evolution": [
      "ancião gigantesco de cabelo branco, barba longa e corpo marcado pelo frio; ainda completamente humano.",
      "braços ficam cobertos por pelagem branca espiritual, mãos ganham garras e olhos tornam-se azuis.",
      "forma base já parece um híbrido humano-urso. Ao conjurar, transforma-se em um gigantesco Avatar do Urso formado por gelo, carne e energia ancestral."
    ],
    "art": null
  },
  {
    "id": 50,
    "name": "Akh'ra",
    "title": "Jaguar Solar",
    "cost": 5,
    "traits": [
      "Presas",
      "Ancestral",
      "Espreitador",
      "Espírito do Jaguar"
    ],
    "type": "Melee",
    "hp": [
      1100,
      1980,
      3565
    ],
    "attack": [
      110,
      198,
      356
    ],
    "armor": 45,
    "magicResist": 40,
    "attackSpeed": 0.95,
    "manaStart": 0,
    "manaMax": 80,
    "range": 1,
    "ability": {
      "name": "Devorar o Sol",
      "description": "realiza múltiplos saltos executores."
    },
    "evolution": [
      "guerreiro de elite com pele pintada de dourado e duas enormes lâminas curvas.",
      "manchas solares surgem no corpo, rosto assume traços felinos e garras crescem.",
      "corpo alterna continuamente entre humano e jaguar dourado; durante a habilidade vira uma criatura bípede de luz solar quase inteiramente felina."
    ],
    "art": null
  },
  {
    "id": 51,
    "name": "Mahari",
    "title": "Memória do Rebanho",
    "cost": 5,
    "traits": [
      "Manada",
      "Ancestral",
      "Guardião",
      "Espírito do Elefante"
    ],
    "type": "Melee",
    "hp": [
      1600,
      2880,
      5185
    ],
    "attack": [
      85,
      153,
      275
    ],
    "armor": 75,
    "magicResist": 70,
    "attackSpeed": 0.55,
    "manaStart": 80,
    "manaMax": 160,
    "range": 1,
    "ability": {
      "name": "Todos Caminham Conosco",
      "description": "invoca ecos de aliados mortos."
    },
    "evolution": [
      "matriarca extremamente idosa com enorme bastão e pinturas brancas por todo o corpo.",
      "orelhas espirituais e pequenas presas surgem enquanto diversas mãos ancestrais aparecem ao seu redor.",
      "seu corpo torna-se translúcido e dentro dele é possível ver várias gerações de guerreiros e enormes elefantes espirituais caminhando."
    ],
    "art": null
  },
  {
    "id": 52,
    "name": "Veyra",
    "title": "A Coruja Sem Lua",
    "cost": 5,
    "traits": [
      "Noturno",
      "Ancestral",
      "Místico",
      "Espírito da Coruja"
    ],
    "type": "Ranged",
    "hp": [
      1050,
      1890,
      3400
    ],
    "attack": [
      70,
      126,
      227
    ],
    "armor": 40,
    "magicResist": 70,
    "attackSpeed": 0.75,
    "manaStart": 60,
    "manaMax": 130,
    "range": 4,
    "ability": {
      "name": "Noite Absoluta",
      "description": "escurece o campo e pune conjurações inimigas."
    },
    "evolution": [
      "oráculo humano vendado usando manto branco e preto.",
      "dezenas de pequenos olhos aparecem sobre o manto e penas crescem nos braços.",
      "rosto é substituído visualmente por uma máscara viva de coruja; quatro asas enormes de sombra cobrem grande parte do campo ao conjurar."
    ],
    "art": null
  },
  {
    "id": 53,
    "name": "Ssar'ka",
    "title": "Serpente da Renovação",
    "cost": 5,
    "traits": [
      "Escamas",
      "Ancestral",
      "Xamã",
      "Espírito da Serpente"
    ],
    "type": "Ranged",
    "hp": [
      1150,
      2070,
      3725
    ],
    "attack": [
      76,
      137,
      246
    ],
    "armor": 45,
    "magicResist": 65,
    "attackSpeed": 0.8,
    "manaStart": 50,
    "manaMax": 120,
    "range": 3,
    "ability": {
      "name": "Pele Sem Fim",
      "description": "ao morrer, abandona sua pele e renasce numa forma mais poderosa."
    },
    "evolution": [
      "xamã humana de pele clara marcada por padrões geométricos de escamas.",
      "pernas ficam parcialmente serpentinas, pupilas verticais e cabelo se move como pequenas cobras de energia.",
      "começa humanoide, mas ao morrer abandona literalmente essa aparência e renasce como uma grande forma humano-serpente ancestral."
    ],
    "art": null
  },
  {
    "id": 54,
    "name": "N'Goro",
    "title": "Primeiro Xamã",
    "cost": 5,
    "traits": [
      "Totêmico",
      "Ancestral",
      "Xamã"
    ],
    "type": "Ranged",
    "hp": [
      1200,
      2160,
      3890
    ],
    "attack": [
      72,
      130,
      233
    ],
    "armor": 50,
    "magicResist": 75,
    "attackSpeed": 0.7,
    "manaStart": 70,
    "manaMax": 150,
    "range": 4,
    "ability": {
      "name": "Conselho dos Primeiros Espíritos",
      "description": "manifesta Totens do Lobo, Urso e Águia simultaneamente."
    },
    "evolution": [
      "ancião humano magro e aparentemente frágil com um único cajado simples.",
      "três Totens flutuam ao redor e projeções de animais aparecem sobre braços e rosto conforme cada poder entra em ação.",
      "N'Goro continua essencialmente humano — justamente para diferenciá-lo dos metamorfos — mas sua silhueta fica cercada por Lobo, Urso e Águia colossais, todos agindo simultaneamente."
    ],
    "art": null
  },
  {
    "id": 55,
    "name": "Karkun",
    "title": "Leviatã do Pântano",
    "cost": 5,
    "traits": [
      "Rio",
      "Ancestral",
      "Brigão",
      "Espírito do Crocodilo"
    ],
    "type": "Melee",
    "hp": [
      1700,
      3060,
      5510
    ],
    "attack": [
      105,
      189,
      340
    ],
    "armor": 75,
    "magicResist": 60,
    "attackSpeed": 0.6,
    "manaStart": 50,
    "manaMax": 130,
    "range": 1,
    "ability": {
      "name": "O Pântano Tem Fome",
      "description": "submerge, atravessa o campo e emerge no maior grupo inimigo; pode devorar alvos muito feridos."
    },
    "evolution": [
      "chefe colossal de pântano, quase dois metros e meio, carregando enorme arma de pedra e madeira.",
      "costas cobertas por escamas, mandíbula ampliada, cauda espiritual e olhos completamente reptilianos.",
      "aparência base já é um híbrido crocodiliano enorme. Quando conjura, braços tocam o chão, mandíbula cresce absurdamente e ele assume uma forma quadrúpede de Leviatã Primal, ainda mantendo traços reconhecíveis do guerreiro original."
    ],
    "art": null
  }
];
