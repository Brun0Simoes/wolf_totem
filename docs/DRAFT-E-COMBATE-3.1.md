# Wolf Totem 3.1 — draft, composições e Arsenal

O ciclo passa a ser **combater → ganhar âmbar e XP → escolher heróis, rituais e equipamentos → preparar a próxima formação**. Experiência e ritualística continuam separadas. Estrelas dependem dos dois requisitos; adquirir cópias não faz parte da progressão.

## Economia e aquisição

A jornada começa com Akru e 80 âmbar. Combates concluídos rendem recursos, incluindo derrotas. Fechar uma batalha em andamento não concede recompensa. Primeiras vitórias e chefes valem mais; repetir encontros continua sendo uma fonte de âmbar.

| Era | Abrir draft | Renovar uma posição | Comprar componente | Heróis disponíveis |
| --- | ----------: | ------------------: | -----------------: | ------------------ |
| I   |          36 |                   8 |                 30 | Custo 1            |
| II  |          48 |                  11 |                 34 | Custos 1–2         |
| III |          60 |                  14 |                 38 | Custos 1–3         |
| IV  |          72 |                  17 |                 42 | Custos 1–4         |
| V   |          84 |                  20 |                 46 | Custos 1–5         |

Cada draft oferece até três heróis distintos, excluindo todos os já acolhidos. Escolher um encerra as outras ofertas; a escolha já está incluída no preço. As ofertas e a era em que foram pagas persistem no save.

Cada carta pode ser renovada separadamente, com filtro de função ou laço. As outras duas ofertas permanecem. O herói substituído não volta nesse sorteio. Se não existir alternativa válida, o jogo informa o motivo e não cobra. No fim do catálogo, oferece apenas os heróis restantes. Os custos disponíveis têm pesos iguais no sorteio; dentro do custo escolhido, cada candidato tem a mesma chance.

As cartas mostram arte, função, laços, atributos, habilidade e a mudança de sinergias ao entrar na formação. Essa avaliação é uma sugestão baseada nas regras de composição.

## Rituais sem espera

| Cerimônia | Preço inicial em âmbar |
| --------- | ---------------------: |
| Rapé      |                     16 |
| Sananga   |                     28 |
| Kambô     |                     48 |
| Ayahuasca |                     90 |
| Cacau     |                     44 |

O preço dos ritos individuais aumenta 8% por bônus já aprendido, com arredondamento. Repetições continuam dando XP após alcançar o limite de bônus. O jogo cobra apenas na confirmação, depois da participação, e revalida saldo e requisitos. O guardião fica disponível imediatamente. Cacau concede sua bênção pelos três próximos combates concluídos; vitórias e derrotas consomem uma participação.

Caçadas automáticas, integração por vitórias e contadores de espera foram retirados. Ficar offline não produz recursos ou XP. A Caçada Eterna permanece como modo de combate após a campanha.

A interface de rituais mantém seleção e duas barras de progresso próximas às cerimônias. No celular, o botão de participação fica fixo acima da navegação. O minigame mostra o preço antes de começar.

## Composições e dificuldade

Laços com pelo menos seis personagens distintos no catálogo recebem um patamar 6. Exemplos: Caçador dá 65% de velocidade de ataque; Escamas reduz dano em 40%; Guardião começa com escudo de 55% da vida final, incluindo nível e equipamentos.

O Conselheiro gera propostas equilibradas, físicas, mágicas, resistentes, por laço e por pares de laços. Favorece núcleos completos e verifica cobertura de funções, nível e estrelas. Reúne propostas com a mesma equipe. A quantidade depende dos heróis acolhidos: um elenco completo gera mais de quinze equipes diferentes; uma tribo pequena oferece menos opções. É possível escolher uma proposta e aplicar suas posições.

Inimigos também recebem sinergias reais. Do terceiro encontro em diante, sua escala aumenta com a etapa. A partir das etapas 6, 14 e 22, recebem respectivamente um, dois e três equipamentos compatíveis com a função. Invocadores inimigos usam os bônus de sua própria formação.

## Arsenal

O Arsenal reúne seis componentes, 21 receitas e seis relíquias com efeitos de combate. As relíquias abrem nas eras III–V, por 100, 130 e 165 âmbar conforme a era. Há **18 builds**, três para cada uma das seis funções. O jogador pode explorar builds de outras funções para o mesmo herói.

Preparar uma build reaproveita itens e componentes existentes, calcula o preço das peças faltantes e equipa os três itens em uma transação. Equipamentos substituídos voltam à bolsa. Saldo insuficiente, bolsa cheia ou era incompatível impedem a operação inteira. Receitas também podem ser combinadas manualmente; componentes têm uma aba direta de compra.

## Pesquisa de TFT

Foram consultadas fontes oficiais da Riot:

- [Mecânicas: Cyber City](https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/mechanics-cyber-city/): escolhas contextualizadas, renovação individual de ofertas de aprimoramentos e equipamentos recomendados para funções. A adaptação aqui é o draft pedido pelo jogador, com três heróis inéditos e leitura do encaixe de cada carta.
- [Aprendizados de Dragonlands](https://teamfighttactics.leagueoflegends.com/en-ph/news/dev/dev-teamfight-tactics-dragonlands-learnings/): escolha de equipamentos e variedade de composições. Isso orientou a compra de componentes e as alternativas de builds.
- [Notas do TFT 14.4 de 2025](https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/teamfight-tactics-patch-14-4-notes-2025/): discussão de laços usados como complementos e como composições concentradas. Os patamares 6 de Wolf Totem usam números próprios.

Essas referências informam decisões de interface e estratégia. A aquisição por draft e o despertar por experiência e ritualística seguem as regras de Wolf Totem.

## Saves e verificação

O save v9 preserva progresso v1–v8 e concede crédito de migração de `min(400, 80 + 8 × progresso)` âmbar. Uma cerimônia antiga pendente é honrada uma única vez. Caçadas antigas são encerradas; os heróis voltam disponíveis. Um desafio de caçada já concluído recebe seu conhecimento na migração; se estiver pendente, passa a contar o próximo acolhimento. Saldo e draft são salvos sem cobrar novamente ao recarregar.

Foram executados **340 testes**, incluindo exclusão de duplicatas, filtros e pagamento do draft, migração, rituais, transações de builds, sinergias e combate. A matriz de combate compara equipes sem preparo, com builds e com núcleo de sinergia em seis chefes. Ela verifica que o preparo muda o resultado, mas não substitui ajuste de dificuldade com partidas humanas.

Na interface, foram verificados draft com renovação de uma carta, recrutamento, combate com recompensa, compra de componente, combinação, preparação de build, equipamento e importação de save antigo, além da navegação dos rituais em 390 × 700. Um elenco de QA com os 55 heróis apresentou 20 formações distintas; aplicar seis Caçadores ativou o bônus no campo. As artes PNG e os recortes de atlas foram conferidos nas telas novas. Os artefatos de QA ficam em `artifacts/tactical-3.1/`, fora do pacote publicado.
