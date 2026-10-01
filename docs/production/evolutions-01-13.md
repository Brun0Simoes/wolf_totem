# Evoluções animadas dos personagens 01–13

Data: 30/09/2026.

## Resultado desta execução

**6 de 26 folhas aprovadas**, correspondendo a 18 clipes e 72 quadros. Foram entregues as formas de duas e três estrelas de Akru, Nima e Boru.

A geração integrada retornou HTTP 429, tipo `usage_limit_reached`, com `resets_at: 1790876541`. Nenhuma chamada nova ou nova tentativa foi iniciada após a instrução de interrupção. Não foi usado fallback de API.

As duas folhas iniciais de Sesha foram rejeitadas porque os efeitos cruzavam os limites entre poses. A revisão já solicitada não produziu saída antes do limite. Os pedidos já enviados para Kiko 2★/3★ e Muru 2★ também ficaram sem saída. As outras variantes ainda não foram solicitadas.

## Preservação e validação

- As artes originais em `chars` e todos os arquivos v2 permanecem intactos.
- As seis folhas finais foram copiadas byte a byte da saída do ImageGen para `public/assets/animations/v3`; SHA-256 comparado com a origem.
- Não houve edição, redimensionamento, montagem ou limpeza dos pixels por script.
- Cada folha foi inspecionada visualmente: quatro poses de repouso, quatro de caminhada e quatro de ataque, preservando a forma correspondente de estrelas.
- Os JSON trazem 12 retângulos personalizados e 12 âncoras locais. Os retângulos podem variar em largura e altura para preservar a pose inteira.
- A geometria é medida em pixels com alfa acima de 64, desconsiderando ruído esparso de borda apenas na medição. A transparência do PNG original é preservada.
- `portrait` é o retângulo absoluto da primeira pose visível, incluindo os efeitos da evolução. `bodyHeight` é fixo por folha e mede a altura física do personagem, do topo do cabelo ou cabeça até a sola dos pés na primeira pose de repouso. Exclui a aura, o lobo, a teia, os braços espectrais e os chifres de energia. A revisão desta métrica preservou os PNGs, retângulos, âncoras e portraits.
- Referências 2★ e 3★ dos personagens 01–08 foram abertas e inspecionadas. As referências 09–13 ainda precisam de inspeção visual antes de gerar.

### Alturas físicas revisadas

Coordenadas Y absolutas na primeira pose de repouso; o limite inferior é exclusivo. O contorno físico foi identificado visualmente e conferido pela leitura das cores dos pixels na região da cabeça.

| Variante | Topo físico Y | Sola Y | bodyHeight |
|---|---:|---:|---:|
| Akru 2★, 01-s2 | 197 | 357 | 160 |
| Akru 3★, 01-s3 | 228 | 467 | 239 |
| Nima 2★, 02-s2 | 159 | 352 | 193 |
| Nima 3★, 02-s3 | 198 | 349 | 151 |
| Boru 2★, 03-s2 | 170 | 456 | 286 |
| Boru 3★, 03-s3 | 119 | 419 | 300 |

## Estado de todas as variantes

| ID | Nome | 2★ | 3★ |
|---|---|---|---|
| 01 | Akru | Entregue | Entregue |
| 02 | Nima | Entregue | Entregue |
| 03 | Boru | Entregue | Entregue |
| 04 | Sesha | Revisão pendente | Revisão pendente |
| 05 | Kiko | Sem saída: limite | Sem saída: limite |
| 06 | Muru | Sem saída: limite | Não iniciada |
| 07 | Taka | Não iniciada | Não iniciada |
| 08 | Ena | Não iniciada | Não iniciada |
| 09 | Paku | Não iniciada | Não iniciada |
| 10 | Zirri | Não iniciada | Não iniciada |
| 11 | Ayo | Não iniciada | Não iniciada |
| 12 | Kalu | Não iniciada | Não iniciada |
| 13 | Viri | Não iniciada | Não iniciada |

## Prompts e proveniência

Ferramenta utilizada: ImageGen integrada, com `transparent_background: true` e a arte original da variante em `referenced_image_paths`. Nos casos de revisão, a primeira folha foi usada como alvo da edição.

### 01-s2 — Akru, 2★

Referência: `chars/Akru-2star.png`.
Estado: entregue.
Saída aprovada: `C:\Users\bruno\.codex\generated_images\01a0f500-4bc1-7180-9f95-e59e822aff7b\exec-6d16819f-4540-4ea8-8c0d-3a69232501d4.png`.
Arquivos: `public/assets/animations/v3/01-s2.png` e `public/assets/animations/v3/01-s2.json`.

Prompt enviado:

```text
Use case: identity-preserve. Edit the attached evolved hero into a production animation sheet with genuine transparency. EXACTLY FOUR COLUMNS and THREE ROWS, 12 isolated full-body miniature poses, no text or grid. Request a square 1536 x 1536 canvas. Every equal cell is 384 x 512. Characters must be SMALL with huge empty transparent margins: total height including spirit effects only 250 pixels, total width including weapons and effects at most 250 pixels. Center each body at local x = 192, feet at local y = 390. Leave at least 60 clear pixels on each left/right side. Do not enlarge figures to fill the sheet. Each complete silhouette must remain wholly in its cell. SAME constant head and body scale in all 12 frames; same face, colors, hair, outfit, weapons, anatomy and evolved details as reference. All poses face right at three-quarter view. Fine crisp pixel-art clusters matching source. Row 1: four visibly distinct idle breathing frames with restrained hair/cloth/spirit movement, looping back. Row 2: four distinct walk frames, alternate forward leg, passing pose, opposite leg, passing pose. Row 3: four attack frames showing anticipation, action, contact and recovery. Keep head, both feet and weapons fully visible. Preserve intentional spectral anatomy from reference but add no new limbs or duplicate heroes. No scenery, borders, lettering, ground shadow, afterimages crossing cells, or checkerboard background.
Character: Akru, 2-star form. Keep larger mane and the original glowing claw bracelets. Attack action: spear jab and short forward lunge. The supplied art is the exact identity and evolution to preserve; do not revert to another star form.
```

Prompt de revisão já solicitado e concluído:

```text
Use case: identity-preserve. Correct only the spacing and scale of this 12-pose animation sheet. Preserve all twelve existing poses, character identity, star evolution, colors and effects. The silhouettes currently cross cell boundaries. Make ALL TWELVE complete silhouettes EXACTLY HALF as wide and HALF as high as now. The result must look like a mostly empty transparent page containing twelve tiny miniature sprite icons, with huge empty space between them. Keep 4 columns by 3 rows. Every entire character, weapon, wing, tail and spirit effect must fit within the central HALF of each cell's width and central HALF of its height. Keep the same body size across the entire sheet, never enlarge attack poses. The 12 positions remain evenly distributed in the same 4 by 3 arrangement. No new poses, no extra characters, no changed anatomy, no clipping. No labels, grid lines, scene or checkerboard. Real transparent background.
```

### 01-s3 — Akru, 3★

Referência: `chars/Akru-3star.png`.
Estado: entregue.
Saída aprovada: `C:\Users\bruno\.codex\generated_images\01a0f500-4bc1-7180-9f95-e59e822aff7b\exec-85ffc6d8-4a8b-4544-b6fc-c4f225f22319.png`.
Arquivos: `public/assets/animations/v3/01-s3.png` e `public/assets/animations/v3/01-s3.json`.

Prompt enviado:

```text
Use case: identity-preserve. Edit the attached evolved hero into a production animation sheet with genuine transparency. EXACTLY FOUR COLUMNS and THREE ROWS, 12 isolated full-body miniature poses, no text or grid. Request a square 1536 x 1536 canvas. Every equal cell is 384 x 512. Characters must be SMALL with huge empty transparent margins: total height including spirit effects only 250 pixels, total width including weapons and effects at most 250 pixels. Center each body at local x = 192, feet at local y = 390. Leave at least 60 clear pixels on each left/right side. Do not enlarge figures to fill the sheet. Each complete silhouette must remain wholly in its cell. SAME constant head and body scale in all 12 frames; same face, colors, hair, outfit, weapons, anatomy and evolved details as reference. All poses face right at three-quarter view. Fine crisp pixel-art clusters matching source. Row 1: four visibly distinct idle breathing frames with restrained hair/cloth/spirit movement, looping back. Row 2: four distinct walk frames, alternate forward leg, passing pose, opposite leg, passing pose. Row 3: four attack frames showing anticipation, action, contact and recovery. Keep head, both feet and weapons fully visible. Preserve intentional spectral anatomy from reference but add no new limbs or duplicate heroes. No scenery, borders, lettering, ground shadow, afterimages crossing cells, or checkerboard background.
Character: Akru, 3-star form. Keep lupine limbs, blue eyes and blue wolf spirit. The wolf stays close behind and fully inside each cell. Attack action: spear jab and short forward lunge. The supplied art is the exact identity and evolution to preserve; do not revert to another star form.
```

### 02-s2 — Nima, 2★

Referência: `chars/Nima-2star.png`.
Estado: entregue.
Saída aprovada: `C:\Users\bruno\.codex\generated_images\01a0f500-4bc1-7180-9f95-e59e822aff7b\exec-83b81d78-7e15-449f-b8a4-423297678555.png`.
Arquivos: `public/assets/animations/v3/02-s2.png` e `public/assets/animations/v3/02-s2.json`.

Prompt enviado:

```text
Use case: identity-preserve. Edit the attached evolved hero into a production animation sheet with genuine transparency. EXACTLY FOUR COLUMNS and THREE ROWS, 12 isolated full-body miniature poses, no text or grid. Request a square 1536 x 1536 canvas. Every equal cell is 384 x 512. Characters must be SMALL with huge empty transparent margins: total height including spirit effects only 250 pixels, total width including weapons and effects at most 250 pixels. Center each body at local x = 192, feet at local y = 390. Leave at least 60 clear pixels on each left/right side. Do not enlarge figures to fill the sheet. Each complete silhouette must remain wholly in its cell. SAME constant head and body scale in all 12 frames; same face, colors, hair, outfit, weapons, anatomy and evolved details as reference. All poses face right at three-quarter view. Fine crisp pixel-art clusters matching source. Row 1: four visibly distinct idle breathing frames with restrained hair/cloth/spirit movement, looping back. Row 2: four distinct walk frames, alternate forward leg, passing pose, opposite leg, passing pose. Row 3: four attack frames showing anticipation, action, contact and recovery. Keep head, both feet and weapons fully visible. Preserve intentional spectral anatomy from reference but add no new limbs or duplicate heroes. No scenery, borders, lettering, ground shadow, afterimages crossing cells, or checkerboard background.
Character: Nima, 2-star form. Keep exactly two spectral extra arms and independently floating threads. Attack action: weave silk then cast a small web forward. The supplied art is the exact identity and evolution to preserve; do not revert to another star form.
```

Prompt de revisão já solicitado e concluído:

```text
Use case: identity-preserve. Correct only the spacing and scale of this 12-pose animation sheet. Preserve all twelve existing poses, character identity, star evolution, colors and effects. The silhouettes currently cross cell boundaries. Make ALL TWELVE complete silhouettes EXACTLY HALF as wide and HALF as high as now. The result must look like a mostly empty transparent page containing twelve tiny miniature sprite icons, with huge empty space between them. Keep 4 columns by 3 rows. Every entire character, weapon, wing, tail and spirit effect must fit within the central HALF of each cell's width and central HALF of its height. Keep the same body size across the entire sheet, never enlarge attack poses. The 12 positions remain evenly distributed in the same 4 by 3 arrangement. No new poses, no extra characters, no changed anatomy, no clipping. No labels, grid lines, scene or checkerboard. Real transparent background.
```

### 02-s3 — Nima, 3★

Referência: `chars/Nima-3star.png`.
Estado: entregue.
Saída aprovada: `C:\Users\bruno\.codex\generated_images\01a0f500-4bc1-7180-9f95-e59e822aff7b\exec-18f2d011-89f8-4f14-bd58-cf70f6d9b9af.png`.
Arquivos: `public/assets/animations/v3/02-s3.png` e `public/assets/animations/v3/02-s3.json`.

Prompt enviado:

```text
Use case: identity-preserve. Edit the attached evolved hero into a production animation sheet with genuine transparency. EXACTLY FOUR COLUMNS and THREE ROWS, 12 isolated full-body miniature poses, no text or grid. Request a square 1536 x 1536 canvas. Every equal cell is 384 x 512. Characters must be SMALL with huge empty transparent margins: total height including spirit effects only 250 pixels, total width including weapons and effects at most 250 pixels. Center each body at local x = 192, feet at local y = 390. Leave at least 60 clear pixels on each left/right side. Do not enlarge figures to fill the sheet. Each complete silhouette must remain wholly in its cell. SAME constant head and body scale in all 12 frames; same face, colors, hair, outfit, weapons, anatomy and evolved details as reference. All poses face right at three-quarter view. Fine crisp pixel-art clusters matching source. Row 1: four visibly distinct idle breathing frames with restrained hair/cloth/spirit movement, looping back. Row 2: four distinct walk frames, alternate forward leg, passing pose, opposite leg, passing pose. Row 3: four attack frames showing anticipation, action, contact and recovery. Keep head, both feet and weapons fully visible. Preserve intentional spectral anatomy from reference but add no new limbs or duplicate heroes. No scenery, borders, lettering, ground shadow, afterimages crossing cells, or checkerboard background.
Character: Nima, 3-star form. Keep the six spectral spider arms, luminous forehead marks and web halo, all compact within the cell. Attack action: weave silk then cast a small web forward. The supplied art is the exact identity and evolution to preserve; do not revert to another star form.
```

Prompt de revisão já solicitado e concluído:

```text
Use case: identity-preserve. Correct only the spacing and scale of this 12-pose animation sheet. Preserve all twelve existing poses, character identity, star evolution, colors and effects. The silhouettes currently cross cell boundaries. Make ALL TWELVE complete silhouettes EXACTLY HALF as wide and HALF as high as now. The result must look like a mostly empty transparent page containing twelve tiny miniature sprite icons, with huge empty space between them. Keep 4 columns by 3 rows. Every entire character, weapon, wing, tail and spirit effect must fit within the central HALF of each cell's width and central HALF of its height. Keep the same body size across the entire sheet, never enlarge attack poses. The 12 positions remain evenly distributed in the same 4 by 3 arrangement. No new poses, no extra characters, no changed anatomy, no clipping. No labels, grid lines, scene or checkerboard. Real transparent background.
```

### 03-s2 — Boru, 2★

Referência: `chars/Boru-2star.png`.
Estado: entregue.
Saída aprovada: `C:\Users\bruno\.codex\generated_images\01a0f500-4bc1-7180-9f95-e59e822aff7b\exec-84f6fbcd-4c2e-49b4-9fca-725f01dcdbf8.png`.
Arquivos: `public/assets/animations/v3/03-s2.png` e `public/assets/animations/v3/03-s2.json`.

Prompt enviado:

```text
Use case: identity-preserve. Edit the attached evolved hero into a production animation sheet with genuine transparency. EXACTLY FOUR COLUMNS and THREE ROWS, 12 isolated full-body miniature poses, no text or grid. Request a square 1536 x 1536 canvas. Every equal cell is 384 x 512. Characters must be SMALL with huge empty transparent margins: total height including spirit effects only 250 pixels, total width including weapons and effects at most 250 pixels. Center each body at local x = 192, feet at local y = 390. Leave at least 60 clear pixels on each left/right side. Do not enlarge figures to fill the sheet. Each complete silhouette must remain wholly in its cell. SAME constant head and body scale in all 12 frames; same face, colors, hair, outfit, weapons, anatomy and evolved details as reference. All poses face right at three-quarter view. Fine crisp pixel-art clusters matching source. Row 1: four visibly distinct idle breathing frames with restrained hair/cloth/spirit movement, looping back. Row 2: four distinct walk frames, alternate forward leg, passing pose, opposite leg, passing pose. Row 3: four attack frames showing anticipation, action, contact and recovery. Keep head, both feet and weapons fully visible. Preserve intentional spectral anatomy from reference but add no new limbs or duplicate heroes. No scenery, borders, lettering, ground shadow, afterimages crossing cells, or checkerboard background.
Character: Boru, 2-star form. Keep hard clay armor and the two little spirit horns. Attack action: raise the club then smash it down and recover. The supplied art is the exact identity and evolution to preserve; do not revert to another star form.
```

### 03-s3 — Boru, 3★

Referência: `chars/Boru-3star.png`.
Estado: entregue.
Saída aprovada: `C:\Users\bruno\.codex\generated_images\01a0f500-4bc1-7180-9f95-e59e822aff7b\exec-14606c12-e400-4ae9-9879-5282d57fca88.png`.
Arquivos: `public/assets/animations/v3/03-s3.png` e `public/assets/animations/v3/03-s3.json`.

Prompt enviado:

```text
Use case: identity-preserve. Edit the attached evolved hero into a production animation sheet with genuine transparency. EXACTLY FOUR COLUMNS and THREE ROWS, 12 isolated full-body miniature poses, no text or grid. Request a square 1536 x 1536 canvas. Every equal cell is 384 x 512. Characters must be SMALL with huge empty transparent margins: total height including spirit effects only 250 pixels, total width including weapons and effects at most 250 pixels. Center each body at local x = 192, feet at local y = 390. Leave at least 60 clear pixels on each left/right side. Do not enlarge figures to fill the sheet. Each complete silhouette must remain wholly in its cell. SAME constant head and body scale in all 12 frames; same face, colors, hair, outfit, weapons, anatomy and evolved details as reference. All poses face right at three-quarter view. Fine crisp pixel-art clusters matching source. Row 1: four visibly distinct idle breathing frames with restrained hair/cloth/spirit movement, looping back. Row 2: four distinct walk frames, alternate forward leg, passing pose, opposite leg, passing pose. Row 3: four attack frames showing anticipation, action, contact and recovery. Keep head, both feet and weapons fully visible. Preserve intentional spectral anatomy from reference but add no new limbs or duplicate heroes. No scenery, borders, lettering, ground shadow, afterimages crossing cells, or checkerboard background.
Character: Boru, 3-star form. Keep giant broad boar-like face, curved spirit tusks and massive clay-plated body. Attack action: raise the club then smash it down and recover. The supplied art is the exact identity and evolution to preserve; do not revert to another star form.
```

### 04-s2 — Sesha, 2★

Referência: `chars/Sesha-2star.png`.
Estado: revisão necessária, bloqueada pelo limite.
Saída rejeitada: `C:\Users\bruno\.codex\generated_images\01a0f500-4bc1-7180-9f95-e59e822aff7b\exec-cfb02c83-6a63-405f-98da-c3e958042bb6.png`.

Prompt enviado:

```text
Use case: identity-preserve. Edit the attached evolved hero into a production animation sheet with genuine transparency. EXACTLY FOUR COLUMNS and THREE ROWS, 12 isolated full-body miniature poses, no text or grid. Request a square 1536 x 1536 canvas. Every equal cell is 384 x 512. Characters must be SMALL with huge empty transparent margins: total height including spirit effects only 250 pixels, total width including weapons and effects at most 250 pixels. Center each body at local x = 192, feet at local y = 390. Leave at least 60 clear pixels on each left/right side. Do not enlarge figures to fill the sheet. Each complete silhouette must remain wholly in its cell. SAME constant head and body scale in all 12 frames; same face, colors, hair, outfit, weapons, anatomy and evolved details as reference. All poses face right at three-quarter view. Fine crisp pixel-art clusters matching source. Row 1: four visibly distinct idle breathing frames with restrained hair/cloth/spirit movement, looping back. Row 2: four distinct walk frames, alternate forward leg, passing pose, opposite leg, passing pose. Row 3: four attack frames showing anticipation, action, contact and recovery. Keep head, both feet and weapons fully visible. Preserve intentional spectral anatomy from reference but add no new limbs or duplicate heroes. No scenery, borders, lettering, ground shadow, afterimages crossing cells, or checkerboard background.
Character: Sesha, 2-star form. Keep slit pupils, green scales, long braids, curved green daggers. Attack action: coiled dagger preparation then fast paired dagger slash. The supplied art is the exact identity and evolution to preserve; do not revert to another star form.
```

Prompt de revisão já solicitado, sem saída retornada:

```text
Use case: identity-preserve. Correct only the spacing and scale of this 12-pose animation sheet. Preserve all twelve existing poses, character identity, star evolution, colors and effects. The silhouettes currently cross cell boundaries. Make ALL TWELVE complete silhouettes EXACTLY HALF as wide and HALF as high as now. The result must look like a mostly empty transparent page containing twelve tiny miniature sprite icons, with huge empty space between them. Keep 4 columns by 3 rows. Every entire character, weapon, wing, tail and spirit effect must fit within the central HALF of each cell's width and central HALF of its height. Keep the same body size across the entire sheet, never enlarge attack poses. The 12 positions remain evenly distributed in the same 4 by 3 arrangement. No new poses, no extra characters, no changed anatomy, no clipping. No labels, grid lines, scene or checkerboard. Real transparent background.
```

### 04-s3 — Sesha, 3★

Referência: `chars/Sesha-3star.png`.
Estado: revisão necessária, bloqueada pelo limite.
Saída rejeitada: `C:\Users\bruno\.codex\generated_images\01a0f500-4bc1-7180-9f95-e59e822aff7b\exec-0a36d836-03bc-4c9b-a57e-6c86c45c503e.png`.

Prompt enviado:

```text
Use case: identity-preserve. Edit the attached evolved hero into a production animation sheet with genuine transparency. EXACTLY FOUR COLUMNS and THREE ROWS, 12 isolated full-body miniature poses, no text or grid. Request a square 1536 x 1536 canvas. Every equal cell is 384 x 512. Characters must be SMALL with huge empty transparent margins: total height including spirit effects only 250 pixels, total width including weapons and effects at most 250 pixels. Center each body at local x = 192, feet at local y = 390. Leave at least 60 clear pixels on each left/right side. Do not enlarge figures to fill the sheet. Each complete silhouette must remain wholly in its cell. SAME constant head and body scale in all 12 frames; same face, colors, hair, outfit, weapons, anatomy and evolved details as reference. All poses face right at three-quarter view. Fine crisp pixel-art clusters matching source. Row 1: four visibly distinct idle breathing frames with restrained hair/cloth/spirit movement, looping back. Row 2: four distinct walk frames, alternate forward leg, passing pose, opposite leg, passing pose. Row 3: four attack frames showing anticipation, action, contact and recovery. Keep head, both feet and weapons fully visible. Preserve intentional spectral anatomy from reference but add no new limbs or duplicate heroes. No scenery, borders, lettering, ground shadow, afterimages crossing cells, or checkerboard background.
Character: Sesha, 3-star form. Keep green serpentine spirit tail and shed-skin effect close to her body, curved daggers, scales and long braids. Attack action: coiled dagger preparation then fast paired dagger slash. The supplied art is the exact identity and evolution to preserve; do not revert to another star form.
```

Prompt de revisão já solicitado, sem saída retornada:

```text
Use case: identity-preserve. Correct only the spacing and scale of this 12-pose animation sheet. Preserve all twelve existing poses, character identity, star evolution, colors and effects. The silhouettes currently cross cell boundaries. Make ALL TWELVE complete silhouettes EXACTLY HALF as wide and HALF as high as now. The result must look like a mostly empty transparent page containing twelve tiny miniature sprite icons, with huge empty space between them. Keep 4 columns by 3 rows. Every entire character, weapon, wing, tail and spirit effect must fit within the central HALF of each cell's width and central HALF of its height. Keep the same body size across the entire sheet, never enlarge attack poses. The 12 positions remain evenly distributed in the same 4 by 3 arrangement. No new poses, no extra characters, no changed anatomy, no clipping. No labels, grid lines, scene or checkerboard. Real transparent background.
```

### 05-s2 — Kiko, 2★

Referência: `chars/Kiko-2star.png`.
Estado: pedido iniciado, sem imagem retornada após atingir o limite.

Prompt enviado:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Kiko, 2-star form. Keep his orange spirit tail and original outfit. Attack: lean, leap with baton, strike, land.
```

### 05-s3 — Kiko, 3★

Referência: `chars/Kiko-3star.png`.
Estado: pedido iniciado, sem imagem retornada após atingir o limite.

Prompt enviado:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Kiko, 3-star form. Keep three golden spectral copies close behind the original central character and the energy tail. Attack: lean, small leap with baton, strike, land. All copies and hero stay strictly inside the central half-cell.
```

### 06-s2 — Muru, 2★

Referência: `chars/Muru-2star.png`.
Estado: pedido iniciado, sem imagem retornada após atingir o limite.

Prompt enviado:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Muru, 2-star form. Keep wet skin, mushrooms, blue water vessels on wooden staff and original leaf mantle. Attack: raise staff, chant with a small water drop, cast, recover.
```

### 06-s3 — Muru, 3★

Referência: `chars/Muru-3star.png`.
Estado: geração ainda não iniciada.

Prompt preparado para continuação:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Muru, 3-star form. Preserve luminous amphibian eyes, webbed hands, large blue amphibian spirit, leaf cloak and water-vessel staff. Raise staff, chant, cast a compact rain burst, recover.
```

### 07-s2 — Taka, 2★

Referência: `chars/Taka-2star.png`.
Estado: geração ainda não iniciada.

Prompt preparado para continuação:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Taka, 2-star form. Preserve black jaw marks, high shoulders, spectral hyena echoes, red and tan primitive clothing and paired serrated daggers. Anticipate, slash both daggers, strike, recover.
```

### 07-s3 — Taka, 3★

Referência: `chars/Taka-3star.png`.
Estado: geração ainda não iniciada.

Prompt preparado para continuação:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Taka, 3-star form. Preserve giant luminous spectral hyena jaw and golden hyena spirits, black facial marks and serrated daggers. Anticipate, slash and bite with compact spirit jaw, strike, recover.
```

### 08-s2 — Ena, 2★

Referência: `chars/Ena-2star.png`.
Estado: geração ainda não iniciada.

Prompt preparado para continuação:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Ena, 2-star form. Preserve circular owl mask with luminous eye discs, spectral forearm feathers and wooden bow. Nock arrow, draw string, release toward right, lower bow.
```

### 08-s3 — Ena, 3★

Referência: `chars/Ena-3star.png`.
Estado: geração ainda não iniciada.

Prompt preparado para continuação:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Ena, 3-star form. Preserve enormous translucent owl wings, glowing spiritual eyes around head, circular owl mask and bow. Wings stay compactly folded near body. Nock arrow, draw, release with wings opening within cell, recover.
```

### 09-s2 — Paku, 2★

Referência: `chars/Paku-2star.png`.
Estado: geração ainda não iniciada.

Prompt preparado para continuação:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Paku, 2-star form. Preserve original evolved turtle guardian silhouette, shell-like shield enclosing shoulders and back, moss and stone. Brace, raise round shield, shield bash, recover.
```

### 09-s3 — Paku, 3★

Referência: `chars/Paku-3star.png`.
Estado: geração ainda não iniciada.

Prompt preparado para continuação:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Paku, 3-star form. Preserve complete spiritual turtle shell and tiny plants from the original three-star art. Brace inside shell, shield forward, compact energy pulse, recover.
```

### 10-s2 — Zirri, 2★

Referência: `chars/Zirri-2star.png`.
Estado: geração ainda não iniciada.

Prompt preparado para continuação:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Zirri, 2-star form. Preserve green chitin elbow and forearm plates and two long attached forearm blades. Prepare blades, first slash, crossing second slash, recover.
```

### 10-s3 — Zirri, 3★

Referência: `chars/Zirri-3star.png`.
Estado: geração ainda não iniciada.

Prompt preparado para continuação:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Zirri, 3-star form. Preserve partially serrated-blade arms and leaf-like wings. Prepare, slash, compact wing-assisted critical strike, recover.
```

### 11-s2 — Ayo, 2★

Referência: `chars/Ayo-2star.png`.
Estado: geração ainda não iniciada.

Prompt preparado para continuação:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Ayo, 2-star form. Preserve floating wooden totem and wind inscriptions on arms. Hold hands ready, raise totem, cast a compact breeze, recover.
```

### 11-s3 — Ayo, 3★

Referência: `chars/Ayo-3star.png`.
Estado: geração ainda não iniciada.

Prompt preparado para continuação:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Ayo, 3-star form. Preserve enormous original totem and abstract winged spirit above Ayo, kept compact within cell. Prepare, raise totem, pulse wind magic, recover.
```

### 12-s2 — Kalu, 2★

Referência: `chars/Kalu-2star.png`.
Estado: geração ainda não iniciada.

Prompt preparado para continuação:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Kalu, 2-star form. Preserve muscular legs, spectral forehead horns and two light spears. Ready spear, draw arm back, short throw gesture toward right with compact projectile, recover.
```

### 12-s3 — Kalu, 3★

Referência: `chars/Kalu-3star.png`.
Estado: geração ainda não iniciada.

Prompt preparado para continuação:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Kalu, 3-star form. Preserve partially hoofed legs and large energy horns from original art. Ready spear, swift short lunge, piercing thrust, recover; keep spirit trail inside cell.
```

### 13-s2 — Viri, 2★

Referência: `chars/Viri-2star.png`.
Estado: geração ainda não iniciada.

Prompt preparado para continuação:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Viri, 2-star form. Preserve elongated ears, original dark clothing and sleeves behaving like energy membranes. Breathe in, raise sleeves, emit a compact sonic ring, recover.
```

### 13-s3 — Viri, 3★

Referência: `chars/Viri-3star.png`.
Estado: geração ainda não iniciada.

Prompt preparado para continuação:

```text
Use case: identity-preserve. Production animation sprite texture. This is a mostly EMPTY transparent square page with TWELVE TINY MINATURE CHARACTER ICONS: FOUR COLUMNS and THREE ROWS. Frame cells are equal. EACH ENTIRE SILHOUETTE including all weapons, wings and spirit effects must fit within the CENTRAL HALF of its cell's width and CENTRAL HALF of its cell's height. Huge empty transparent margins on ALL sides. Do not zoom in or make characters large. Keep exactly the attached character identity and evolved details, costume, colors, face, hair, weapons, body proportions and fine crisp pixel clusters. All frames face right in three-quarter view. Constant body scale across all twelve poses. Row 1 contains four distinct breathing idle poses. Row 2 contains four walking poses with alternating legs and passing poses. Row 3 contains anticipation, action, contact and recovery for the attack described below. All feet, heads and equipment are fully visible and remain inside their own frame. No text, lines, borders, scenery, checkerboard or extra figures beyond those integral to the source evolution. Preserve real transparency.
Viri, 3-star form. Preserve huge spiritual bat wings and visible sonic waves around body. Fold wings near body for spacing. Breathe in, open wings within cell, emit a compact sonic ring, recover.
```
