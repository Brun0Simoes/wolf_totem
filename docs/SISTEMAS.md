> Registro de uma versão anterior. As regras atuais estão em [Reformulação 2.2](REFORMULACAO-2.2.md); economia, construções, custos de rituais e trabalho descritos abaixo foram retirados.

# Wolf Totem 2.0 — sistemas do jogo

Todos os números abaixo são decisões de protótipo, calibradas por simulação, e ficam fora do catálogo canônico de `src/data/characters.ts`.

## Ciclo de jogo

```text
Aldeia produz ─► acolher / despertar / equipar ─► expedição automática ─► recursos e componentes
     ▲                                                                           │
     └──── eras (espíritos), construções, trabalhadores ◄────────────────────────┘
Primeiro Inverno ─► Caçada Eterna + Grande Totem ─► renascimento ─► memórias permanentes
```

## Ritmo e despertar

As cerimônias têm uma preparação interativa opcional que concede até 20% de XP ritual extra, sem alterar os tempos ou os requisitos. O bônus individual é persistido e concedido na conclusão; o da roda de cacau vale para os membros elegíveis. Veja [controles, regras e validação](RITUAIS-INTERATIVOS.md).

A progressão combina duas trilhas independentes. Trabalho, caçadas e expedições concedem experiência; cerimônias concedem experiência ritual. Nenhuma trilha substitui a outra.

| Forma | Experiência | Ritualística | Cerimônia adicional |
| --- | --- | --- | --- |
| 2★ | nível 8 | nível 3 | — |
| 3★ | nível 24 | nível 8 | ayahuasca concluída |

O despertar é automático e preserva o herói, sua posição e seus itens. O teste em `tests/progression.test.ts` faz duas visitas por dia, mantém Akru trabalhando, ergue a Casa de Cura com recursos produzidos pela aldeia e alterna ritos adequados à era. A primeira forma 3★ aparece em **6 dias**. Esse resultado mede uma rotina específica, sem caçadas ou bônus de memórias; a duração real varia com as escolhas.

## Aldeia

A população, as obras com duração, os oito territórios, as quatro pesquisas e o conselheiro estão detalhados em [Aldeia RTS](ALDEIA-RTS.md). Saves v5 preservam essas ordens e migram jornadas v1–v4.

| Construção | Produção por nível | Afinidade dos trabalhadores |
| --- | --- | --- |
| Bosque dos coletores | 1,5 madeira/s | Copa, Enxame |
| Acampamento de caça | 1,2 alimento/s | Caçador, Presas |
| Pedreira ancestral | 0,85 pedra/s | Brigão, Guardião, Manada |
| Círculo dos espíritos | 0,3 espírito/s | Xamã, Místico, Totêmico |
| Forja de Osso (Era II) | 1 componente a cada 900/nível s | Ancestral, Escamas, Trapaceiro |
| Casa de Cura | cerimônias (ver abaixo) | Xamã, Rio, Noturno |

- Construções vão até o nível 15; o custo cresce 1,65× por nível.
- Produção total = (produção das construções + população e território) × modificadores de era, espíritos, memórias e trabalhadores heróis. Ferramentas e depósitos afetam a parcela da população; roças e postos acrescentam produção. Veja as fórmulas da [aldeia RTS](ALDEIA-RTS.md).
- **Trabalhadores:** heróis da reserva (fora da formação). Vagas por construção: 1 + nível/4, no máximo 4. Cada um soma 10% × custo × (1; 2,2; 4 conforme as estrelas), com ×1,5 de afinidade.
- **Eras:** a aldeia de nível *n* custa 160/110/80/30 × 2,8^(n−1) (madeira, alimento, pedra, espírito). Cada era libera uma faixa do catálogo, uma vaga na formação e uma escolha de espírito. Avançar exige também, no mesmo herói, experiência/ritualística 4/2, 10/3, 16/5 e 22/7 para chegar às eras II–V.
- Coleta manual: 5/4/3 por clique × nível da aldeia.
- Produção offline: até 12 horas, inclusive da forja.

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

- Catálogo de 55 companheiros, sem sorteio ou compra de cópias. Eras I–V exigem também que a tribo tenha um herói com ritualística 1/2/3/5/7, respectivamente.
- Recrutar custa 15 de alimento e 30 de espírito × custo; liberar devolve 15 × custo de espírito e os itens.
- Até 55 heróis no total; formação de 3 a 7, conforme a era.
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

Cada herói carrega até 3 itens; despertar preserva os equipamentos. Na migração de saves antigos, itens das cópias voltam ao companheiro consolidado ou à bolsa. A lista completa está no códice (aba **Itens**).

## Campanha

| Região | Era | Chefe |
| --- | --- | --- |
| 1. Clareira do Lobo | I | O Alfa Cinzento (Akru) |
| 2. Margem do Rio | II | A Boca do Delta (Nask) |
| 3. Copa Alta | III | O Oráculo da Copa (Roko) |
| 4. Savana de Marfim | IV | O Rei dos Búfalos (Boro) |
| 5. Pântano Ancestral | V | O Leviatã do Pântano (Karkun) |
| 6. Montanhas do Primeiro Inverno | V | O Primeiro Inverno (Uruq) |

- **Força dos inimigos:** (0,56 + 0,03·L + 0,0009·L²) ÷ (1 + 0,12 × (custo − 1)) × dificuldade × (1 + 5% × (nível esperado − 1)).
  - A dificuldade vai de 1,25 na primeira expedição a 1,1 na última: o começo ficou bem mais duro que na 1.2.
  - O **nível esperado** dos heróis na expedição L é 1 + 29 × ((L − 1)/29)^0,7, chegando ao nível 30 no Primeiro Inverno. O cartão da expedição mostra esse nível e o do herói mais forte da tribo.
  - Um chefe tem vida × (1,66 + 0,06 × região), ataque × (1,12 + 0,02 × região) e +15 de armadura e resistência.
- **Posição dos inimigos:** combatentes corpo a corpo ocupam a fileira da frente, do centro para fora; atiradores e conjuradores, as de trás.
- **Primeiras expedições:** a primeira tem um só inimigo, para Akru vencer sozinho; a partir da terceira, as regiões 1 a 3 trazem um inimigo a mais que na 1.2.
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

- Formato versão 4; aceita versões 1, 2 e 3.
- Saves anteriores conservam as estrelas já conquistadas e recebem os níveis mínimos correspondentes. Cópias do mesmo personagem são consolidadas, preservando o progresso mais alto de cada trilha, bônus aprendidos e equipamentos. Essa consolidação não concede novas estrelas.
- A versão 1 é migrada: cada onda vencida vira uma expedição vencida, e os heróis recebem espaços de item e de trabalho.
- Combate em andamento nunca é salvo.
- Valores inválidos são saneados: itens desconhecidos, espíritos fora da ordem das eras e trabalhadores acima das vagas.

## Diário da tribo (1.1)

31 objetivos em ordem (sete novos na 1.3: caçar, nível 3, Casa de Cura, rapé, roda de cacau, ayahuasca e nível 7), mostrados um por vez no painel da aldeia e todos no diário (botão **Ver diário**):

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

Com as fases e a dificuldade da 1.3, três heróis 1★ perdem para o Alfa; um grupo com alguns 2★ vence. O Rei dos Búfalos pede os espíritos das eras ou as cerimônias a quem estiver atrás no nível. O Primeiro Inverno exige heróis 3★, de preferência de custo alto, com itens e cerimônias.

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

## Campo hexagonal (1.2, ampliado na 1.3)

- Como no TFT, o campo tem 7 colunas e 8 fileiras de casas hexagonais, em fileiras alternadas deslocadas meia casa. As fileiras 0–3 são do inimigo (a 3 é a frente dele) e as fileiras 4–7 são da tribo (a 4 é a frente).
- As 28 casas da formação são numeradas de 1 a 28, sete por fileira, da frente para trás. Saves da 1.2 levam a formação de 4 × 3 para as colunas do meio, na mesma fileira.
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

## Níveis e experiência (1.3)

- A jornada começa com **Akru sozinho**. O próximo despertar aparece no painel do herói.
- Cada herói tem nível de 1 a 30. Para sair do nível n são precisos arredondar(50 × n^2,1) pontos de experiência. O nível 8 requer 8.282 XP acumulados; o nível 24, 286.883 XP. Trabalho concede 40 XP por minuto, sem gerar XP ritual.
- **Cada nível:** +7% de vida e +5% de ataque.
- **Batalhas:** todos os heróis que marcharam ganham (14 + 5 × nível da expedição), multiplicado conforme o resultado e o tipo de luta:

  | Resultado | Multiplicador |
  | --- | --- |
  | Primeira vitória | × 1,5 |
  | Repetição vencida | × 0,3 |
  | Derrota | × 0,25 |
  | Chefe (sobre os anteriores) | × 1,5 |

- **Aprendizes:** um herói mais de um nível abaixo do mais forte da tribo ganha +25% de experiência por nível de diferença além do primeiro, até o dobro. Assim, recrutas novos alcançam o grupo.
- **Ritualística:** níveis 1–10. Para sair do nível n são precisos arredondar(90 × n^1,4) XP ritual. Nível 3 exige 328 XP acumulados; nível 8, 4.709. Concluir um rito inicia 3 horas de integração, durante as quais o herói pode trabalhar ou caçar.

## Caçadas (1.3)

- Heróis em **Caçadas** seguem uma trilha por um tempo real de jogo, que corre também com o jogo fechado.
- Enquanto caçam, guardam o lugar na formação, mas não lutam nem trabalham.
- **Vagas de caçadores:** 1 + nível do Acampamento de caça ÷ 4, no máximo 4.

| Trilha | Tempo | Exige | Experiência | Alimento | Componente |
| --- | --- | --- | --- | --- | --- |
| Margem do igarapé | 10 min | nível 1 | 600 | 140 | 5% |
| Mata de terra firme | 1 h | nível 4 | 4000 | 900 | 15% |
| Várzea alagada | 3 h | Era II, nível 8 | 15000 | 3000 | 25% |
| Serra das antas | 6 h | Era III, nível 14 | 42000 | 6200 | 40% |
| Cabeceiras do rio | 8 h | Era IV, nível 18 | 65000 | 9000 | 60% |

- **Sucesso:** 86% + 4% por estrela além da primeira + 4% por sananga − 14% por ponto de panema, entre 30% e 98%.
  - Com sucesso, o herói traz o alimento (+15% por estrela além da primeira) e, com a chance da tabela, um componente.
  - Sem sucesso, traz 40% da experiência e ganha 1 de panema.
- **Panema** é a palavra amazônica, de origem tupi, para o azar do caçador: a flecha que erra, a caça que foge.
  - Vai de 0 a 3. Cada ponto tira 14% da chance de sucesso e 15% da experiência das caçadas.
  - A sananga tira 1 ponto e o kambô tira todos.
- O herói pode ser chamado de volta antes da hora, sem caça.

## Casa de Cura e cerimônias (1.3)

A Casa de Cura é a maloca onde o pajé conduz as cerimônias. Ela se constrói desde a Era I e sobe até o nível 15. Cada cerimônia tem custo e tempo. O herói fica fora das expedições durante a cerimônia, e ajudantes na maloca (afinidade: Xamã, Rio e Noturno) encurtam esse tempo em até 1,5×.

| Prática | Povos | No jogo | Exige | Tempo |
| --- | --- | --- | --- | --- |
| **Rapé** (rume) | Huni Kuin, Yawanawá, Noke Koî | +5% de velocidade de ataque por cerimônia (até 3) e foco na próxima caçada: +50% de experiência | Casa nível 1 | 20 min |
| **Sananga** (colírio da floresta) | Matsés, Huni Kuin, Tikuna | Tira 1 de panema; +6% de dano e +4% de sucesso na caça por cerimônia (até 3) | Casa nível 1, herói nível 2 | 45 min |
| **Kambô** (kampô) | Noke Koî, Matsés, Yawanawá, Huni Kuin | Tira toda a panema; +8% de vida máxima por cerimônia (até 3) | Casa nível 2, Era II, herói nível 8 | 2 h |
| **Ayahuasca** (nixi pae) | Huni Kuin e outros povos da Amazônia | +20% de poder de habilidade e +25 de mana inicial, uma vez por herói | Casa nível 3, Era III, herói nível 14, um rapé antes | 6 h |
| **Roda de cacau** | Mayo-Chinchipe da Alta Amazônia; depois maias | Toda a tribo por 10 min: +25% de experiência e +10% de cura e escudos | Casa nível 2, Era II | — |

- XP ritual por cerimônia: rapé 90, sananga 180, kambô 450, ayahuasca 900, cacau 60. Repetições continuam ensinando, mas os bônus de atributos permanecem limitados a 3/3/3/1. O custo cresce até o limite de aprendizado do bônus e depois permanece estável. Cacau concede XP apenas a heróis presentes que concluíram a integração.
- **Pesquisa e respeito:** os textos seguem fontes etnográficas e de divulgação sobre essas práticas:
  - nixi pae, "o encanto do cipó", e os cantos huni meka da cerimônia Huni Kuin;
  - rapé (rume) soprado pelo tepi ou pelo kuripe;
  - sananga e kambô contra a panema dos caçadores;
  - cacau domesticado na Alta Amazônia há cerca de 5.300 anos.

  O jogo trata as práticas como cultura da tribo, sem promessas de cura. A Casa de Cura lembra que, fora do jogo, algumas têm riscos sérios à saúde e só fazem sentido no seu contexto tradicional.
