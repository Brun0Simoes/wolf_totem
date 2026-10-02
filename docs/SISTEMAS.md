# Wolf Totem 1.2 — sistemas do jogo

Todos os números abaixo são decisões de protótipo, calibradas por simulação, e ficam fora do catálogo canônico de `src/data/characters.ts`.

## Ciclo de jogo

```text
Aldeia produz ─► recrutar / fundir / equipar ─► expedição automática ─► recursos e componentes
     ▲                                                                           │
     └──── eras (espíritos), construções, trabalhadores ◄────────────────────────┘
Primeiro Inverno ─► Caçada Eterna + Grande Totem ─► renascimento ─► memórias permanentes
```

Ritmo medido durante o desenvolvimento com um jogador automático simples (melhora construções, avança eras, recruta um núcleo de equipe e tenta sempre a próxima expedição):

| Marco | Tempo de jogo |
| --- | --- |
| Era II | ~1 min |
| Era III / IV / V | ~3 / ~10 / ~20 min |
| Chefe da região 5 (Leviatã) | ~25 min |
| Primeiro Inverno | entre 30 min e 1h40, conforme a equipe chega a 3★ |
| Grande Totem completo e primeiro renascimento | ~1h10–1h40 |
| Segundo ciclo até a região 5 | ~20 min (com memórias) |

## Aldeia

| Construção | Produção por nível | Afinidade dos trabalhadores |
| --- | --- | --- |
| Bosque dos coletores | 1,5 madeira/s | Copa, Enxame |
| Acampamento de caça | 1,2 alimento/s | Caçador, Presas |
| Pedreira ancestral | 0,85 pedra/s | Brigão, Guardião, Manada |
| Círculo dos espíritos | 0,3 espírito/s | Xamã, Místico, Totêmico |
| Forja de Osso (Era II) | 1 componente a cada 900/nível s | Ancestral, Escamas, Trapaceiro |

- Construções vão até o nível 15; o custo cresce 1,65× por nível.
- Produção total = base × nível × (1 + 12% por era) × espíritos × (1 + 25% por Raízes Profundas) × trabalhadores.
- **Trabalhadores:** heróis da reserva (fora da formação). Vagas por construção: 1 + nível/4, no máximo 4. Cada um soma 10% × custo × (1; 2,2; 4 conforme as estrelas), com ×1,5 de afinidade.
- **Eras:** a aldeia de nível *n* custa 160/110/80/30 × 2,8^(n−1) (madeira, alimento, pedra, espírito). Cada era libera um custo de herói, uma vaga na formação e uma escolha de espírito.
- Coleta manual: 5/4/3 por clique × nível da aldeia.
- Produção offline: até 2 horas, inclusive da forja.

## Espíritos protetores

| Era | Espírito | Bônus permanente | Poder (1× por expedição) |
| --- | --- | --- | --- |
| II | Lobo | Presas e Caçadores +12% ataque; +10% alimento | Uivo da Matilha: +40% velocidade e +20% ataque por 6 s |
| II | Cervo | Curas e escudos +20%; +15% madeira | Chuva de Primavera: cura 35% e remove veneno |
| II | Corvo | +12 mana inicial; +15% espírito | Revoada: 10% da vida máx. e −20 armadura por 8 s |
| III | Serpente | Escamas −12% dano recebido; +15% pedra | Bote Coletivo: veneno de 4% da vida/s por 6 s |
| III | Coruja | Místicos, Xamãs e Totêmicos +20% poder; +10% espírito | Silêncio da Noite: inimigos sem mana e lentos por 5 s |
| III | Gorila | Copa e Guardiões +15% vida; +10% madeira | Rugido da Copa: atordoa todos por 1,75 s |
| IV | Crocodilo | Rio e Brigões +12% vida e ataque; +15% alimento | Fome do Pântano: devora o mais ferido (<40%) e molha todos |
| IV | Elefante | Manada e Ancestrais +25 armadura/RM; +15% pedra | Muralha de Marfim: escudo de 30% da vida |
| IV | Águia | Caçadores +12% velocidade; +1 viajante na fogueira | Olho do Céu: marca todos e revela furtivos por 10 s |
| V | Urso | +10% vida; +10% de tudo | Despertar do Inverno: ergue os caídos com 35% |
| V | Jaguar | Espreitadores e Noturnos +18% ataque | Eclipse: aliados inalvejáveis 2,5 s e +50% ataque |
| V | Aranha | Invocações +50%; forja 50% mais rápida | Teia Mãe: atordoa 1 s e desacelera 6 s |

## Heróis e laços

- Fogueira: 4 viajantes (5 com a Águia); chances por era em [PERSONAGENS.md](PERSONAGENS.md).
- Recrutar custa 15 de alimento e 30 de espírito × custo; liberar devolve 15 × custo × 3^(estrelas−1) de espírito e os itens.
- Até 18 heróis no total; formação de 3 a 7, conforme a era.
- Os laços contam personagens distintos na formação; a tabela completa está no códice (aba **Laços**) e em `src/game/synergies.ts`.

## Itens

Os componentes vêm de:

- primeiras vitórias: 1 componente, ou 2 nos chefes;
- repetições: 35% de chance;
- Caçada Eterna: 1 por vitória, 2 a cada 5 profundidades;
- Forja de Osso.

| Componente | Efeito |
| --- | --- |
| Presa de Osso | +12% ataque |
| Arco de Teixo | +12% velocidade de ataque |
| Couro Curtido | +20 armadura |
| Manto de Fibras | +20 resistência mágica |
| Pena Sagrada | +15 mana inicial |
| Cinturão de Raízes | +180 vida |

Cada par de componentes forma um dos 21 itens. Exemplos:

- **Lâmina de Obsidiana:** o terceiro ataque causa dano dobrado.
- **Garra do Caçador:** velocidade de ataque crescente.
- **Couraça de Espinhos:** devolve parte do dano recebido.
- **Escudo Totêmico:** escuda os aliados vizinhos.
- **Véu da Coruja:** ignora atordoamentos.

Para combinar:

- coloque o segundo componente no herói que já tem o primeiro;
- ou, com a forja construída, toque dois componentes na bolsa.

Cada herói carrega até 3 itens; ao fundir cópias, os itens passam ao herói que fica e o excedente volta à bolsa. A lista completa está no códice (aba **Itens**).

## Campanha

| Região | Era | Chefe |
| --- | --- | --- |
| 1. Clareira do Lobo | I | O Alfa Cinzento (Akru) |
| 2. Margem do Rio | II | A Boca do Delta (Nask) |
| 3. Copa Alta | III | O Oráculo da Copa (Roko) |
| 4. Savana de Marfim | IV | O Rei dos Búfalos (Boro) |
| 5. Pântano Ancestral | V | O Leviatã do Pântano (Karkun) |
| 6. Montanhas do Primeiro Inverno | V | O Primeiro Inverno (Uruq) |

- **Força dos inimigos:** (0,56 + 0,03·L + 0,0009·L²) ÷ (1 + 0,12 × (custo − 1)). Um chefe tem vida × (1,7 + 0,12 × região), ataque × (1,12 + 0,02 × região) e +15 de armadura e resistência.
- **Recompensa:** madeira 40 + 14·L, alimento 35 + 12·L, pedra 25 + 10·L e espírito 40 + 10·L. A repetição paga metade.
- **Caçada Eterna:** composições geradas por semente, que crescem em quantidade, estrelas e custo; o nível equivale a 30 + 1,6 × profundidade.

## Grande Totem e renascimento

- Exige a Era V e a vitória na expedição 5·5.
- Tem 5 partes; a parte *n* custa 2 500/1 800/2 200/1 100 × *n*.
- Para renascer: Totem completo e Primeiro Inverno vencido.
- Brasas ganhas = 8 + 2 × profundidade da Caçada Eterna nesta jornada + 2 × renascimentos anteriores.
- O renascimento volta a aldeia, os heróis, os itens, os espíritos e a campanha ao início. Mantém brasas, memórias, configurações e o recorde da Caçada.

| Memória | Efeito por nível | Máx. | Custo |
| --- | --- | --- | --- |
| Raízes Profundas | +25% produção | 10 | 3 × (nível + 1) |
| Bênção Ancestral | +6% vida e ataque | 10 | 4 × (nível + 1) |
| Fogueira Acolhedora | −8% preço de recrutamento | 5 | 3 × (nível + 1) |
| Botim das Caçadas | +20% recompensas | 5 | 3 × (nível + 1) |
| Herança da Tribo | +150 de cada recurso ao renascer | 5 | 2 × (nível + 1) |
| Memória da Forja | +1 componente ao renascer | 3 | 4 × (nível + 1) |

## Saves

- Formato versão 2.
- A versão 1 é migrada: cada onda vencida vira uma expedição vencida, e os heróis recebem espaços de item e de trabalho.
- Combate em andamento nunca é salvo.
- Valores inválidos são saneados: itens desconhecidos, espíritos fora da ordem das eras e trabalhadores acima das vagas.

## Diário da tribo (1.1)

24 objetivos em ordem, mostrados um por vez no painel da aldeia e todos no diário (botão **Ver diário**):

- **Os primeiros ensinam o jogo:** vencer a primeira expedição, recrutar, melhorar uma construção, avançar de era, honrar um espírito, formar um 2★, pôr um herói para trabalhar, construir a forja, completar um item e usar um poder.
- **Os seguintes apontam os marcos:** os seis chefes, as eras III a V, um laço no segundo nível, um herói 3★, o Grande Totem, a profundidade 5 da Caçada Eterna e o renascimento.

As recompensas são recursos, componentes ou brasas. Cada objetivo paga uma vez e continua resgatado depois de renascer. Um ponto dourado no botão **Aldeia** avisa quando há recompensa ou evento esperando.

## Chefes com fase (1.1)

Abaixo de 50% da vida, cada chefe dispara uma vez a sua mecânica, anunciada por um estandarte no campo:

| Chefe | Mecânica |
| --- | --- |
| O Alfa Cinzento | **Uivo do Alfa:** 2 lobos cinzentos e +30% de velocidade de ataque para a matilha por 8 s |
| A Boca do Delta | **Mergulho no Delta:** some por 1,5 s, cura 25% e cria um remanso que o acompanha |
| O Oráculo da Copa | **Coro dos Ecos:** conjura as habilidades de dois aliados e ganha 60 de mana |
| O Rei dos Búfalos | **Fúria da Manada:** +50% de velocidade e +30% de ataque até o fim, e uma nova carga de búfalos |
| O Leviatã do Pântano | **Fome Abissal:** emerge no maior grupo da tribo, causa 20% da vida máxima e ganha escudo de 25% |
| O Primeiro Inverno | **Nevasca Eterna:** gelo sobre o campo inteiro por 12 s e o Primeiro Inverno conjurado |
| Alfas da Caçada Eterna | **Fúria do Alfa:** +40% de velocidade, +20% de ataque e escudo de 20% |

Com as fases, a equipe inicial de três heróis 1★ só vence o Alfa na formação de partida, com Ena atrás de Akru e Boru; com a atiradora na linha de frente, perde. Equipes com alguns 2★ vencem com folga. O Primeiro Inverno continua exigindo heróis 3★ e uma formação com os tanques na frente.

## Eventos da aldeia (1.1)

- A partir da Era II, um acontecimento surge a cada 4 a 7 minutos de jogo (o tempo offline conta) e expira em 2,5 minutos.
- **Mercador errante:** vende um componente ou, com 35% de chance, um item completo. O preço sobe com a era.
- **Presságio favorável:** +60% de produção de um recurso por 3 minutos. O recurso fica dourado no topo da tela.
- **Viajante perdido:** um herói 1★ de custo até 3 junta-se à tribo, se houver vaga.
- **Incursão de saqueadores:**
  - **Defender:** uma batalha com 2 + era inimigos, ajustados ao progresso. A vitória rende 120% da recompensa de uma expedição e um componente. A derrota custa 6% da madeira e do alimento.
  - **Pagar tributo:** custa 10% do alimento e do espírito.
  - **Ignorar:** custa 6% da madeira e do alimento.
  - Incursões não mexem no progresso da campanha.

## Resumo da batalha (1.1)

Ao fim de cada luta, o cartão de resultado lista os heróis com barras de dano causado, dano recebido (incluindo o absorvido por escudos) e cura mais escudos dados. O dano das invocações conta para quem as chamou.

## Campo hexagonal (1.2)

- O campo tem 4 colunas e 6 fileiras de casas hexagonais, em fileiras alternadas deslocadas meia casa. As fileiras 0–2 são do inimigo (a 2 é a frente dele) e as fileiras 3–5 são da tribo (a 3 é a frente).
- As 12 casas da formação seguem numeradas de 1 a 12, quatro por fileira, da frente para trás. Saves antigos mantêm as posições.
- Colunas ficam a 1 unidade e fileiras a 1 unidade de profundidade. Por isso, alcances e áreas das habilidades valem o mesmo que antes. O vizinho diagonal fica a 1,12, ainda dentro do alcance corpo a corpo.
- O campo é visto de frente, em leve perspectiva: as fileiras da tribo ficam mais largas e próximas, e as unidades do fundo ficam um pouco menores.
- Cada região tem cenário próprio: pinheiros na Clareira, rio na Margem, copas na Copa Alta, acácias e sol baixo na Savana, árvores mortas e poças no Pântano, picos nevados nas Montanhas.

## Crepúsculo (1.2)

Lutas longas não empacam. A partir de 75 s de combate o campo escurece e o Crepúsculo começa:

| Efeito | Valor |
| --- | --- |
| Dano recebido por todos | +3% por segundo depois dos 75 s (o dobro aos ~108 s) |
| Cura, escudos e regeneração | −2% por segundo depois dos 75 s, até o mínimo de 15% |

O limite de 150 s continua valendo: se ninguém vencer até lá, a tribo perde.

## Tela inicial e configurações (1.2)

- **Tela inicial:** a história da tribo e o resumo da jornada (era, expedições, heróis e renascimentos). Opções: continuar, começar uma nova jornada (pede confirmação), configurações e como jogar. O tempo da aldeia não corre enquanto a tela está aberta.
- **Configurações:**
  - Ficam salvas neste aparelho, separadas do save da jornada.
  - **Som:** liga e desliga sons e música, com volume separado para efeitos e música.
  - **Movimento:** segue o sistema, completo ou reduzido. O reduzido acalma tremores de câmera, ondas e animações da interface.
  - **Números de dano e cura:** podem ser desligados.
  - **Jornada:** exportar, importar, voltar à tela inicial e apagar a jornada. Apagar pede uma segunda confirmação e recomeça direto no guia.
