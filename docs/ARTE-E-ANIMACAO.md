# Wolf Totem — arte e animação

## Produção atual — LPC, 9 de outubro de 2026

Os 55 guardiões usam **165 formas LPC, sete movimentos e quatro direções**, com evolução de roupas, adornos e traços animais. Caminhada, ataque e conjuração têm quadros próprios; o campo seleciona a direção real e mantém os pontos de apoio estáveis. Os retratos ilustrados e as cinco invocações foram preservados.

Consulte a [produção LPC](production/LPC.md) para fontes, licenças, reprodução e limites das adaptações. A galeria publicada `characters.html`, acessível pelas configurações, permite comparar todos os personagens. Os créditos dos 587 arquivos utilizados também ficam disponíveis no jogo.

## Arquivo de produção pintada — 7 de outubro de 2026

Os 55 personagens têm **165 formas animadas (1★, 2★ e 3★)**. São 495 sequências e 1.980 poses desenhadas: repouso, caminhada e ataque/conjuração, quatro poses por sequência. Impacto, queda e vitória usam movimento programado; ataque e habilidade compartilham poses.

As formas usam as descrições de evolução do catálogo e mantêm a identidade das artes anteriores. PNGs gerados com Imagegen foram copiados sem editar pixels. Os JSONs registram os 12 recortes e as âncoras individuais; margens transparentes e conteúdo de cada quadro foram medidos antes da integração. As invocações têm um registro separado, em `public/assets/animations/summons`.

As cinco criaturas invocadas têm folhas próprias: cria de seda, corvo ancestral, escaravelho solar, lobo espiritual e espírito do marfim. São mais 15 sequências e 60 poses. O eco de Amaru usa a folha do próprio personagem. O campo carrega cada criatura sob demanda e conserva os desenhos procedurais como alternativa durante o carregamento.

Consulte o [inventário atual](production/STATUS.md). Para revisar as folhas em movimento, execute o servidor Vite e abra `/docs/production/preview.html`. As seções de versões abaixo registram o histórico da produção.

## Versão 1.3: campo 7 × 8 e Casa de Cura

- A arena usa um campo de 7 × 8 casas: a câmera recua um pouco, as unidades ficam menores no fundo, e os rótulos das metades vão para os lados do tabuleiro.
- A aldeia ganhou a **Casa de Cura**, uma maloca redonda de cobertura de palha:
  - paredes de palmeira rachada com uma faixa de zigue-zagues pintados;
  - ervas secando sob o beiral e o fogo da cerimônia na porta;
  - antes de construída, um canteiro com estacas e pedras.
- Heróis caçando ou em cerimônia somem da aldeia e aparecem acinzentados nos cartões, com a contagem até a volta.

## Versão 1.2: arena hexagonal e figuras refinadas

- **Arena** (`src/render/battleArena.ts`): uma vista frontal em leve perspectiva substitui o losango isométrico nas expedições.
  - Cada região tem um fundo pintado pelo código: céu, cordilheira, linha de árvores do bioma, chão com textura e névoa.
  - O tabuleiro é uma plataforma de pedra com 24 hexágonos chanfrados: tons quentes na metade inimiga e verdes na metade da tribo.
  - A linha dourada do meio segue as bordas das casas. Dois totens entalhados marcam as pontas dessa linha.
  - Unidades, zonas, efeitos e cliques passam pela mesma projeção (`project`). As unidades do fundo aparecem um pouco menores.
- **Crepúsculo:** depois de 75 s de luta o campo escurece em tom violeta, com o estandarte do Crepúsculo.
- **Lampejo de dano:** dura 0,07 s e acontece no máximo a cada 0,4 s por unidade, para que lutas cheias mantenham as cores.
- **Figuras procedurais refinadas:**
  - membros afunilados com articulações e sombreado de luz frontal;
  - cabeça de perfil com nariz, queixo, orelha, olho com brilho, sobrancelha e pintura no rosto;
  - cabelo em camadas com mechas;
  - colar de contas com dente, braçadeiras, tornozeleiras e sandálias;
  - cintos e tangas com faixa tribal em zigue-zague e franjas;
  - vestes com barra decorada, mantos com gola de pele e armaduras com rebites.

## Versão 1.0: figuras procedurais e glifos

Enquanto as folhas pintadas não chegam, o jogo completa o visual com código (`src/render/proceduralArt.ts` e `src/render/spiritGlyphs.ts`):

- **Escolha da arte** (`src/render/artSource.ts`): folha pintada da estrela → ilustração original → folha pintada mais próxima com aura do animal espiritual (2★ pequena, 3★ grande) → figura procedural.
- **Figuras procedurais** dos 10 personagens sem nenhuma folha pintada. Cada um tem descrição tirada do plano (porte, pele, cabelo, roupa, arma, adereço) e uma folha 4 × 3 no mesmo formato das pintadas: repouso, caminhada e ataque, quatro poses cada. A evolução segue a regra do plano: 1★ humano; 2★ marcas brilhando, orelhas, chifres, cauda, asas ou braços espirituais conforme o animal; 3★ avatar do animal atrás da figura.
- **Glifos de 27 animais** em estilo máscara de totem: espíritos protetores, poderes, estandartes da aldeia, partes do Grande Totem, auras e prévias de inimigos.
- **Aldeia:** forja (canteiro antes de construída), Grande Totem em 6 estágios, estandartes dos espíritos escolhidos e trabalhadores andando até a construção onde trabalham.
- **Campo:** cor do tabuleiro por região e inimigos visíveis na preparação.

As figuras são provisórias e sempre perdem para uma folha pintada da mesma forma.

## Expansão 0.3

A produção abrange os 55 personagens e suas três estrelas. Consulte o [estado atualizado](production/STATUS.md) para a cobertura atual; os lotes desta seção descrevem a expansão inicial.

O códice agora oferece uma prévia animada com seleção de estrelas, repouso, caminhada, ataque, habilidade, impacto, queda, vitória, pausa e espelhamento. As folhas novas ficam em `v3`; as 13 folhas anteriores permanecem em `v2`. Cada personagem/estrela tem seu próprio registro. O retrato dos novos personagens usa a primeira pose da folha, preservando o arquivo gerado.

O campo carrega folhas sob demanda e descarta texturas antigas que não estão em uso. As formas 2★/3★ usam seus atlas próprios quando disponíveis. O carregamento não precisa trazer as 165 imagens ao abrir o jogo. A pausa da prévia do códice é independente da pausa da economia.

Desde a versão 0.4 os 55 personagens são recrutáveis e suas habilidades funcionam em combate, independentemente da arte. Quando falta a folha de uma estrela, o campo usa a ilustração original (custo 1) ou a folha pronta mais próxima do mesmo personagem. Personagens sem nenhuma arte usam uma silhueta tingida pela cor do custo; invocações usam silhuetas luminosas programadas e metamorfoses aumentam e iluminam a figura enquanto duram.

### Prioridades registradas na expansão inicial — concluídas

1. **1★ dos 10 personagens sem nenhuma folha pintada** — são os únicos que ainda aparecem como silhueta: Suri, Kesh, Brak, Sena, Uru, Amaru, Vesh, Toru, Asha e Thari.
2. **3★ dos Metamorfos** — a transformação é o momento mais visível do combate.
3. **2★ e 3★ restantes**, por custo, do menor para o maior.

## Atualização 0.2: primeiro grupo animado

Os 13 personagens de uma estrela têm três sequências desenhadas: repouso, caminhada e ataque/conjuração. Cada sequência usa quatro poses: **39 sequências e 156 quadros**, em `public/assets/animations/v2` (caminho relativo ao projeto).

As folhas são edições das artes originais aprovadas. Os PNGs gerados foram copiados sem alterações de pixels. O atlas utiliza recortes `frameRects` e âncoras locais nos pés por quadro, porque as dimensões e os espaços entre as fileiras variam. A escala usa uma altura corporal fixa por personagem; espelhamento preserva o ponto de apoio.

### Comportamento no jogo

- Repouso e caminhada em ciclos; ataques e conjurações terminam antes de voltar ao repouso.
- Ataques corpo a corpo com arcos de golpe, projéteis para ataques à distância e efeitos distintos para as 13 habilidades.
- Impacto com recuo e brilho breve, cura, escudo, queda e dissipação ao morrer, celebração ao vencer.
- Até seis heróis da tribo percorrem rotas na aldeia e executam movimentos de trabalho nos edifícios.
- Árvores, fogueira, brasas e partículas animadas; melhorias de edifícios emitem um pulso.
- A pausa congela os ciclos, movimentos e efeitos. A preferência do sistema por movimento reduzido diminui efeitos e remove oscilações ambientais.

Ataques e habilidades compartilham a terceira fileira de poses, com ritmos e efeitos diferentes. Impacto, queda e vitória são movimentos programados sobre essas imagens, sem folhas exclusivas. Os estágios de duas e três estrelas preservam suas artes originais e usam movimentos programados, enquanto aguardam suas próprias folhas. O cálculo de dano continua exclusivamente na simulação.

### Produção e inspeção

- [Akru, Nima, Boru e Sesha](animation-batch-a.md): referências, prompts e revisão dos recortes.
- [Kiko, Muru, Taka e Ena](animation-batch-b.md): referências, prompts e revisão dos recortes.
- [Paku, Zirri, Ayo, Kalu e Viri](animation-batch-c.md): referências, prompts e revisão dos recortes.

Refinamentos possíveis: aumentar a fluidez com poses intermediárias e desenhar reações e derrotas específicas. A produção posterior completou os estágios 2★/3★ e os 42 personagens restantes. Os ciclos atuais têm quatro poses.

## Registro da primeira experiência de ataque

A documentação abaixo registra a faixa inicial de Akru. O jogo agora carrega as folhas da pasta v2; a faixa inicial foi preservada como referência do processo.

## Estado dos arquivos

- As **39 artes originais** de `chars` foram preservadas. Elas representam 13 personagens, com três estrelas cada.
- Na inspeção inicial, o catálogo tinha 55 personagens e faltavam as três artes dos outros 42: **126 aparências**. A produção posterior completou essas lacunas em atlas animados.
- Foi criada uma **primeira animação de ataque de Akru 1★**, com quatro poses desenhadas e transparência real.
- Arquivo: `public/assets/animations/akru-attack.png`.
- Metadados: `public/assets/animations/akru-attack.json`.
- A animação foi integrada e observada no combate do protótipo. Escala e âncora foram ajustadas ao campo; o refinamento do ritmo e da passagem entre poses continua sendo uma etapa da arte final.

## Especificação da faixa de Akru

| Propriedade | Valor |
| --- | --- |
| Imagem | 2172 × 724 pixels, RGBA |
| Organização | Uma linha, quatro colunas iguais |
| Quadro | 543 × 724 pixels |
| Ordem | Preparação, recuo, golpe, recuperação |
| Referência de chão | y = 570 em todos os quadros; variação máxima de 1 pixel |
| Âncora sugerida | x = 271,5; y = 570, em coordenadas locais do quadro |
| Altura de referência do corpo | Aproximadamente 320 pixels |
| Ritmo provisório | 120 / 100 / 140 / 200 ms; total de 560 ms |
| Repetição | Desativada; disparar ao atacar |
| Fundo | Alfa zero fora dos desenhos |

O arquivo final tem proporção 3:1. A divisão em quatro colunas continua exata; cada quadro é retangular. A solicitação inicial de tela 4:1 não foi reproduzida pelo gerador.

O personagem ocupa parte do quadro porque o golpe precisa de espaço para a lança. A escala de exibição deve usar a altura visível do corpo, e não preencher a célula com um ajuste independente a cada pose. Todos os quadros precisam compartilhar escala e âncora. Os limites alfa de cada pose estão no JSON para inspeção; não devem causar redimensionamento diferente por quadro.

Os tempos são decisões provisórias de apresentação. Não alteram a velocidade de ataque nem os atributos canônicos do catálogo.

## Inspeção realizada

1. Foram comparados o desenho aprovado `chars/Akru-1star.png` e a primeira faixa de seis poses.
2. A primeira edição para quatro poses foi rejeitada: o golpe invadia a coluna seguinte e a pose de recuo exibia duas pontas de lança.
3. A segunda edição reduziu o tamanho dos personagens e a extensão do golpe.
4. O resultado final foi inspecionado visualmente: quatro figuras completas, isoladas, com o mesmo personagem, roupa, cabelo e pintura facial.
5. Uma leitura dos pixels confirmou RGBA, alfa de 0 a 255, largura divisível por quatro e bordas verticais inteiramente transparentes em todos os quadros.
6. A cópia para o projeto foi comparada byte a byte com a imagem gerada. Não houve recorte, pintura, remoção de fundo ou alteração da imagem por script.
7. A sequência foi observada no jogo durante a primeira expedição. O renderer usa a altura visível de 320 pixels e a âncora de chão de 570 pixels; heróis de duas e três estrelas mantêm suas artes correspondentes.

A fluidez ainda é a de uma sequência curta de quatro poses. Quadros intermediários, arco da arma, eventuais diferenças pequenas de anatomia e a transição com a pose parada fazem parte do refinamento posterior.

## Origem e ferramenta

- Data: 30 de setembro de 2026.
- Ferramenta: geração de imagem integrada, em modo de edição; não foi utilizada API externa por script.
- Referência principal fornecida pelo usuário: `E:/Wolf_totem/chars/Akru-1star.png`.
- Faixa inicial de seis poses: `exec-1fef0651-3ff2-44ac-b834-89f94344fcc7.png`.
- Primeira revisão, descartada: `exec-a981de3d-17bd-40ca-ab3a-83409c2f113d.png`.
- Revisão selecionada: `exec-eb1f5661-d7c5-4693-afc2-101fbc228431.png`.
- Origem da revisão selecionada: `C:/Users/bruno/.codex/generated_images/01a0f48f-2570-7ae2-a8e1-860525eff9c0/exec-eb1f5661-d7c5-4693-afc2-101fbc228431.png`.

### Prompt final utilizado

```text
Use case: identity-preserve.
EDIT the second input image into a machine-readable four-cell game attack spritesheet. First input is approved Akru design; lock that identity, clothing, gray hair, tan skin, white face paint, bare toes and primitive SINGLE POINT stone spear.
CRITICAL CHANGE: Zoom ALL FOUR characters out dramatically to miniature size, about HALF the height they have in the second image. Make the entire canvas have abundant unused transparent space. Do NOT fill the canvas with large figures.
Layout: exactly FOUR equal-width columns in one row. Centers at exactly 12.5%, 37.5%, 62.5%, 87.5% of canvas width. Each figure and every pixel of its spear fits in a small centered box that is at most 16% of total canvas WIDTH and at most 45% of total canvas HEIGHT. At least 9% of total canvas width of completely transparent gap between adjacent figures. All grounded feet at 80% canvas height. All four figures same scale, head size and anchor. No overlap and no clipping anywhere. The four miniature sprites must look evenly spaced, like four evenly spaced icons.
Four compact attack poses in order: ready stance, short backswing, short spear jab toward right, recovery. Keep torso upright and feet close; no broad lunges. The wooden spear is short, 55% of the character's body height, with ONE stone spearhead at its forward end only. The rear end is plain wood. Spear does not grow between poses. Slight foreshortening is allowed to keep jab compact.
Retain same painted pixel style as first input. Same three-quarter right-facing viewpoint for every pose, same costume and colors. Background truly transparent, not black. NO scenery, NO ground, NO shadow, NO labels, NO visible boxes or grid, NO other characters, NO captions. Deliver the whole four-pose strip at once. Smaller sprites with generous empty space are essential.
```

## Roteiro proposto para completar a arte

### 1. Fechar o padrão com Akru

Validar no jogo o ataque criado, a escala de unidade e o ponto de contato com o chão. Produzir depois um ciclo de espera, caminhada, reação a dano, habilidade e derrota. Manter a leitura da pintura branca, do cabelo cinza e da lança curta no tamanho real usado em combate.

### 2. Completar o primeiro grupo jogável

Aplicar o mesmo padrão aos 13 personagens que já possuem artes. Cada personagem precisa de poses adequadas à arma e à função; o ataque de Akru não substitui as animações dos demais. Para as versões 2★ e 3★, preservar as mudanças específicas de silhueta descritas no plano.

### 3. Produzir as 126 aparências restantes

Avançar por grupos de custo conforme os desbloqueios da vila. Para cada herói: confirmar o desenho 1★, derivar 2★ e 3★ com as diferenças canônicas e então produzir as animações. A lista completa de nomes e lacunas está em `docs/PERSONAGENS.md`.

### 4. Habilidades, criaturas e cenário

Criar efeitos de veneno, cura, escudo, chuva, marcas, penas, totens e invocações conforme cada habilidade. As manifestações de aranha, escaravelho e animais ancestrais precisam de ativos próprios. O cenário também necessita de construções em estágios, recursos coletáveis e detalhes da vila coerentes com a direção primitiva.

### 5. Revisar a legibilidade de cada entrega

Verificar movimento no tamanho do jogo, contraste contra a arena, cores de seleção, silhueta em grupos, transparência, consistência de escala e âncora, limites de cada quadro e desempenho em tela. Manter arquivos originais e versões de trabalho separados dos ativos selecionados.

## Regras visuais herdadas do plano

As quatro categorias são Manifestador, Marcado, Híbrido e Metamorfo. A atribuição permanece restrita aos exemplos explícitos do texto original; a relação está em `docs/PERSONAGENS.md`. O plano sugere aproximadamente 8 a 12 metamorfos verdadeiros, preservando outras formas de expressão animal para o restante do elenco. Não transformar automaticamente todos os heróis em animais no terceiro estágio.
