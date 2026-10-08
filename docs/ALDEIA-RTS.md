# Aldeia RTS e conselheiro

> Registro histórico da versão 2.0. A mecânica de RTS foi removida na versão 2.1 e substituída pelos [Caminhos Ancestrais](CAMINHOS-ANCESTRAIS.md). As regras abaixo descrevem a implementação anterior.

## Ciclo da aldeia

A aldeia possui uma população própria. Heróis continuam com experiência, ritualística, caçadas, cerimônias e trabalho especializado. Os aldeões cuidam da economia e da expansão.

1. Distribua os quatro aldeões iniciais entre madeira, alimento, pedra, espírito, construção e disponibilidade.
2. Reserve construtores, prepare novos aldeões e construa moradias.
3. Escolha uma infraestrutura e um terreno livre. A obra cobra recursos ao entrar na fila e aplica o efeito ao terminar.
4. Reconheça um território adjacente, estabeleça um posto e ocupe o terreno liberado.
5. Pesquise ferramentas, rastreamento, defesa e táticas. Complete os seis marcos para receber recursos.
6. Expedições e avanço de era abrem fronteiras mais distantes.

A barra da aldeia abre População, Construir, Territórios, Pesquisas e Conselheiro. Aldeões, construções e fronteiras também podem ser selecionados no cenário. Os controles do painel oferecem as mesmas ações sem exigir precisão no canvas. Atalhos: **G**, **B**, **V**, **R** e **A**, respectivamente.

## População e ordens

- Capacidade: `mínimo(40, 4 + 2 × era + 4 × moradias)`. Era I começa com quatro aldeões e seis vagas.
- Preparar um aldeão custa 45 alimento e leva 30 segundos. Ele chega disponível; só uma preparação fica na fila por vez.
- Cada obra, melhoria de construção ou posto reserva um construtor. Há obras paralelas quando há mais construtores. Um construtor reservado não pode abandonar seu ofício.
- Melhorar uma construção existente leva `25 + 12 × nível atual` segundos e usa os custos existentes. Limite: nível 15; a Forja exige Era II.
- Reconhecimento reserva um aldeão que não seja construtor. Ele deixa de produzir durante a missão e retoma o ofício ao voltar. Só um reconhecimento ocorre por vez.
- Pesquisas diferentes podem ocorrer em paralelo; o mesmo conhecimento não pode ser enfileirado duas vezes.
- Máximo de 12 ordens simultâneas. Cancelar uma ordem incompleta devolve 80% do custo e libera o trabalhador; cancelar novamente não concede recursos.
- Pausa impede novas ordens e para o relógio. O progresso offline continua limitado a 12 horas. A produção é dividida na conclusão de obras, pesquisas e atividades dos heróis, para usar os modificadores corretos antes e depois.

## Infraestruturas

Há três terrenos na clareira e um terreno adicional por posto avançado. Cada terreno recebe uma construção.

| Construção | Era | Madeira / alimento / pedra / espírito | Tempo | Efeito |
| --- | --- | --- | --- | --- |
| Moradia da tribo | I | 65 / 0 / 20 / 0 | 35 s | +4 vagas de população |
| Armazém de provisões | I | 95 / 0 / 45 / 0 | 45 s | +10% de produção dos aldeões por depósito |
| Roça comunitária | I | 70 / 35 / 15 / 0 | 40 s | +0,6 alimento/s antes dos modificadores |
| Torre de vigia | II | 120 / 0 / 90 / 0 | 60 s | 12% menos perdas por incursões ignoradas ou perdidas |
| Casa de trocas | II | 150 / 50 / 75 / 0 | 65 s | Troca 100 de um recurso material por 65 de outro |

Espírito não participa das trocas. As construções novas reaproveitam os props pintados existentes; roças acrescentam sulcos desenhados. Os aldeões usam figuras animadas pelo Phaser.

## Produção

Cada aldeão ativo produz 0,35 madeira, 0,30 alimento, 0,23 pedra ou 0,12 espírito por segundo, conforme seu ofício. A parcela dos aldeões é multiplicada por:

`(1 + 0,15 × ferramentas) × (1 + 0,10 × depósitos) × (1 + 0,12 × postos do recurso)`.

Cada posto acrescenta também 0,15/s do recurso local. Roças somam `0,6 × (1 + 0,15 × ferramentas)` alimento/s. Essa parcela é somada à produção das construções antigas e recebe os modificadores existentes de era, espíritos, memórias e afinidade dos heróis trabalhadores. Aldeões comuns não recebem XP de herói e não produzem estrelas.

## Territórios

Reconhecer custa `20 × era do território` alimento. A descoberta entrega uma única recompensa de `35 × era` do recurso local. Um posto leva `45 + 15 × era` segundos, precisa de construtor e custa os recursos mostrados no painel. Um território exige um vizinho já ocupado.

| Território | Recurso | Era | Expedições vencidas | Reconhecimento base | Vizinho ocupado |
| --- | --- | --- | --- | --- | --- |
| Bosque do cedro | Madeira | I | 0 | 35 s | Clareira |
| Curva do igarapé | Alimento | I | 0 | 45 s | Clareira |
| Clareira das antas | Alimento | I | 1 | 50 s | Clareira |
| Pedras do nascente | Pedra | II | 5 | 65 s | Igarapé |
| Mata dos antigos | Madeira | II | 4 | 70 s | Bosque |
| Brejo dos espíritos | Espírito | II | 3 | 75 s | Clareira |
| Pedras da memória | Espírito | III | 10 | 90 s | Clareira das antas ou brejo |
| Passagem do inverno | Pedra | IV | 15 | 110 s | Pedras do nascente ou mata dos antigos |

O mapa mostra névoa, recursos revelados, caminhos ocupados, postos e o reconhecimento em andamento. A expansão usa setores definidos, com terrenos próprios. O combate continua nas expedições automáticas; a população é comandada por ofícios e ordens, sem movimentação livre ou combate direto de unidades no mapa territorial.

## Pesquisas

Cada conhecimento tem três níveis. Custos crescem `1,9 ×` por nível; o tempo base cresce `1 + 0,5 × nível atual`.

| Pesquisa | Era | Tempo base | Efeito por nível |
| --- | --- | --- | --- |
| Ferramentas de osso | I | 55 s | +15% de produção dos aldeões e roças |
| Leitura de rastros | II | 75 s | +3 pontos percentuais de sucesso em caçadas; −15% de duração do reconhecimento |
| Vigília da mata | II | 85 s | 10% menos perdas em incursões |
| Táticas de matilha | II | 100 s | +4% de vida e ataque dos heróis na próxima batalha |

Sucesso de caçadas é limitado a 98%. Torres e vigília somam proteção até 80%; não eliminam a necessidade de defender a aldeia. Táticas são aplicadas ao criar uma batalha, sem alterar uma luta já em andamento.

## Conselheiro de combate

O conselheiro usa os dados reais da jornada e do próximo adversário:

- **Seis funções:** linha de frente, ataque à distância, conjuração, apoio, flanqueamento e invocação. O guia explica posição, habilidade e equipamento de cada herói.
- **31 laços:** descrição dos dois limiares, contagem atual, membros na formação, reserva, trabalho e catálogo. Até dois laços podem orientar o plano.
- **Formação sugerida:** escolhe heróis disponíveis, respeita a capacidade da era e coloca frente e flanqueadores nas primeiras casas. Heróis trabalhando ou em atividade ficam fora da seleção. Aplicar exige uma ação explícita.
- **Trocas sugeridas:** mostram quais laços aumentam e quais diminuem. Os próximos limiares indicam companheiros que podem ser acolhidos agora.
- **Itens:** ordena itens realmente presentes na bolsa, respeita três espaços por herói e usa índices reais dos componentes para mostrar receitas disponíveis. Combinar exige Forja de Osso.
- **Inimigo:** resume funções da expedição selecionada e oferece orientações para proteger a retaguarda ou atingir conjuradores.
- **Avisos:** vagas vazias, falta de frente, posições vulneráveis, experiência média e itens sem uso.

A avaliação é uma heurística de atributos, funções e sinergias; não estima probabilidade de vitória. Mudanças de formação e equipamento ficam bloqueadas durante uma batalha. O despertar continua exigindo XP normal e ritualística: 2★ em 8/3; 3★ em 24/8 com ayahuasca concluída.

## Persistência e verificação

O save v5 acrescenta população, terrenos, ordens, pesquisas, fronteiras, marcos, diário e prioridades de laços. Jornadas v1–v4 recebem a população inicial e preservam heróis, itens e progresso. Dados desconhecidos e ordens duplicadas são descartados na leitura.

`tests/settlement.test.ts` cobre reserva de trabalhadores, obras paralelas, produção nos limites de conclusão offline, terrenos, cancelamento, pesquisa, efeitos em batalha, marcos, trocas, migração e recomendações com inventário real. A simulação de referência de duas visitas por dia continua alcançando o primeiro 3★ em seis dias; outras rotinas mudam o tempo.

## Origem do terreno

Arquivo: [`public/assets/environment/frontier-terrain.png`](../public/assets/environment/frontier-terrain.png). Gerado nesta implementação com a ferramenta integrada `image_gen.imagegen`, com fundo opaco, sem imagem de referência. Copiado sem edição de pixels. Edifícios, aldeões, rótulos, névoa e recursos são sobrepostos pelo jogo.

Prompt completo:

```text
Use case: stylized-concept. Asset type: production terrain background for a primitive-themed RTS browser game, Wolf Totem. Generate ONE wide landscape game map, top-down with a slight isometric angle, continuous connected land across the whole frame, richly painted stylized game art with readable terrain, muted moss greens, warm sandy earth, deep teal water, soft late afternoon lighting. Main central empty grass clearing at normalized x50%, y49%, open grass land extending into neighboring regions. Empty resource clearings at west x23% y45%, east x76% y45%, northwest x34% y20%, northeast x64% y20%, southwest x32% y75%, southeast x69% y75%, far southeast x87% y74%, and south x50% y88%. Frame these spaces with lush forest clusters, cedar trees and palms, rocks and mineral outcrops toward east, a winding narrow river near east, marsh with mist at southeast and scattered ancient stones in south, distant cold highland rock in northeast. Clear, walkable earthen paths smoothly connect the central clearing to surrounding clearings. Terrain only: absolutely NO huts, NO people, NO animals, NO banners, NO interface, NO text, NO icons, NO painted grid, NO borders, NO floating islands, NO hexagonal cutouts. Buildings, villagers and fog will be overlaid by the game at runtime. Entire frame is connected real landscape viewed as a playable Age-of-Empires style terrain, not a decorative hub or diagram. Keep all nine clearing centers unobstructed for runtime clickable locations. Wide 3:2 composition.
```
