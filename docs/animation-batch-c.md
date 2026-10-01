# Animações — grupo C

Data: 30 de setembro de 2026.

## Entrega

Foram produzidas cinco folhas de animação de personagens 1★: **Paku, Zirri, Ayo, Kalu e Viri**. Cada folha contém 12 poses, organizadas em três sequências de quatro quadros: espera com respiração, caminhada e ataque ou conjuração. O grupo totaliza **60 poses e 15 sequências**.

| Herói | ID | Arquivo PNG e JSON em `public/assets/animations/v2` | Altura de referência |
| --- | ---: | --- | ---: |
| Paku | 9 | `paku.png`, `paku.json` | 255 px |
| Zirri | 10 | `zirri.png`, `zirri.json` | 291 px |
| Ayo | 11 | `ayo.png`, `ayo.json` | 261 px |
| Kalu | 12 | `kalu.png`, `kalu.json` | 249 px |
| Viri | 13 | `viri.png`, `viri.json` | 313 px |

As imagens finais têm **1254 × 1254 pixels**, RGBA e fundo transparente. Os PNGs foram copiados byte a byte da saída da ferramenta. Nenhuma imagem foi pintada, recortada, redimensionada ou teve fundo removido por script. As artes originais de `chars` foram preservadas.

## Integração

Cada JSON contém `characterId`, `name`, `image`, `columns`, `rows`, `frameWidth`, `frameHeight`, `bodyHeight`, `anchorX`, `anchorY`, `frameRects`, `frameAnchors` e `clips`.

**O carregador deve usar os 12 retângulos explícitos de `frameRects`.** A ferramenta não respeitou exatamente o tamanho solicitado nem a altura uniforme das fileiras. Os retângulos foram definidos nos corredores transparentes entre as figuras para preservar cada pose completa. `frameWidth` e `frameHeight` são apenas valores nominais da grade; usá-los como recorte automático pode cortar pés ou incluir partes de outra fileira.

- Os retângulos usam coordenadas da imagem completa.
- Cada âncora usa pixels locais ao seu próprio retângulo.
- `bodyHeight` foi medido no primeiro quadro e serve para manter uma escala comum nas 12 poses.
- A posição horizontal da âncora foi obtida pela faixa dos pés, sem usar o centro da arma.
- `idle`: quadros 0–3.
- `walk`: quadros 4–7.
- `attack`: quadros 8–11.

## Inspeção e limites

Todas as folhas foram vistas completas, incluindo as 12 poses de cada personagem. Os passos alternam pernas, enquanto ataques e conjurações têm preparação, ação e recuperação. Identidade, roupas, armas, cabelos e paleta seguem as artes 1★ fornecidas.

Uma leitura de alfa confirmou 12 áreas ocupadas e que os retângulos selecionados não cortam conteúdo visível nem incluem um personagem vizinho. O alfa máximo encontrado nas bordas dos retângulos foi **1/255**, um resíduo quase transparente da saída gerada. Os limites do conteúdo no JSON usam limiar de alfa 16.

A revisão inicial de cada folha foi descartada porque figuras e efeitos invadiam a divisão regular. A segunda edição reduziu as poses e limitou a extensão de armas e efeitos. A duração dos ciclos e o momento do dano pertencem ao sistema de animação e combate. A inspeção do movimento dentro do jogo deve confirmar ritmo, direção e eventuais oscilações restantes; a presente validação cobre imagens e metadados.

Os quatro quadros de cada sequência são uma primeira versão curta. Reações a dano, derrota, habilidades adicionais, direções alternativas e versões de 2★/3★ não fazem parte deste grupo.

## Ferramenta e origem

Foi usada a ferramenta integrada `image_gen`, em modo de edição, com transparência solicitada. As imagens de referência foram inspecionadas antes de cada edição. Não houve uso de API externa por script.

Pasta das saídas de geração: `C:/Users/bruno/.codex/generated_images/01a0f48f-2570-7ae2-a8e1-860525eff9c0/`.

## Paku

- Referência aprovada: `chars/Paku-1star.png`.
- Primeira tentativa, descartada: `exec-60bdf666-e283-46ed-aaca-d0a8a20c1727.png`.
- Revisão selecionada: `exec-f771f87d-d7be-41dd-ac57-0547d1454c60.png`.
- Entrega: `public/assets/animations/v2/paku.png` e `paku.json`.

### Prompt inicial

```text
Use case: identity-preserve.
EDIT the attached approved Paku 1-star character into ONE transparent 2D GAME SPRITESHEET.
Canvas exactly 1536 by 1536 pixels, square. EXACTLY FOUR equal columns and THREE equal rows, making TWELVE cells of 384 by 512 pixels. Exactly one COMPLETE MINIATURE character pose in each cell; all twelve cells occupied. No extra pose. Invisible cell boundaries only; no visible grid.
Identity: A short sturdy tan-skinned male warrior with brown tied-up hair, white tribal paint, green leaves, bone ornaments, leather wraps and a huge round mossy wood-and-stone shield with a spiral central stone. Preserve shield geometry and original proportions.
Lock same character identity, same 1-star outfit, weapons, hair, skin, colors, anatomy and proportions in every cell. All poses three-quarter facing RIGHT, never mirrored. Full body including feet, head and every weapon extremity. Preserve crisp painted pixel-art appearance of the source.
CELL LAYOUT IS CRITICAL: draw every character quite SMALL, using at most 60% of its cell height and at most 68% of its cell width INCLUDING weapons and effects. Leave generous transparent margins. Each grounded foot baseline exactly at 85% of its own cell height; body center at 50% of its own cell width. All twelve poses exactly the SAME body size and same shared ground anchor. Keep weapons compact with foreshortening if necessary. Do not enlarge figures to fill empty space. No pixels cross any cell boundary, no adjacent pose touches, no cropping.
ROW 1, frames 1 to 4: IDLE BREATHING LOOP. Four subtly distinct breathing poses, shoulder rise then settle and small clothing movement. Feet planted.
ROW 2, frames 5 to 8: WALK CYCLE in place. Obvious alternating steps: left foot forward, passing pose, right foot forward, passing pose. Legs and arms actually change. Same facing right, same body position in cell, no sliding across the row.
ROW 3, frames 9 to 12: ATTACK/CAST sequence. Compact shield bash: draw back the shield slightly, drive shield forward toward the right, hold impact, recover. No giant turtle spirit and no transformation.
Background true transparent RGBA. No black background, no painted checkerboard, no scenery, no ground plane, no shadows, no text, labels, numbers, borders or separators. Deliver all TWELVE poses at once, perfectly organized into the four-by-three cell layout.
```

### Prompt da revisão selecionada

```text
Use case: identity-preserve.
EDIT second input Paku animation sheet: the pose silhouettes currently are TOO LARGE and cross the imaginary cell boundaries. Fix ONLY layout and scale, preserve the 12 animation poses, identity and artwork from the sheet. First input is the approved original character for identity.
CRITICAL: SHRINK EVERY ONE OF THE TWELVE FIGURES TO HALF ITS CURRENT SIZE. All twelve must look like SMALL MINIATURE ICONS surrounded by LARGE EMPTY TRANSPARENT MARGINS. Do not fill unused space. This layout repair needs much smaller figures, not another full-page illustration.
Square canvas, keep exactly FOUR EQUAL COLUMNS and THREE EQUAL ROWS. Twelve sprites in total. Their centers in each row are at 12.5%,37.5%,62.5%,87.5% of canvas width. Foot baselines at 26%,59%,92% of the TOTAL canvas height, respectively for first,second,third rows. Each full character INCLUDING WEAPONS occupies at most 14% of TOTAL CANVAS HEIGHT and 13% of TOTAL CANVAS WIDTH. All characters same scale across rows. This means each sprite is only around 175 pixels tall on a 1254-pixel canvas. Abundant transparency is desired. Place each character body on its own column center; feet share the row baseline.
Same Paku 1-star identity, same face, same original outfit, same weapons, same colors, same hair and proportions. Three-quarter facing RIGHT throughout.
Keep row1 four breathing/idle poses. Row2 four different walking poses with alternate legs stepping. Row3 four poses of Compact shield bash: draw back the shield slightly, drive shield forward toward the right, hold impact, recover. No giant turtle spirit and no transformation. Keep every weapon entirely within its small sprite footprint, using compact posing and foreshortening.
Absolutely no sprites or effects crossing any cell boundary; all twelve fully visible with no crop. Huge clear gaps between sprites. Crisp detailed pixel style matching source, no reskin.
Background genuinely transparent RGBA. No black fill, no scenery, no floor, no shadows, no labels or text, no numbers, no grid lines. Return one whole 4-column by 3-row sheet.
```

## Zirri

- Referência aprovada: `chars/Zirri-1star.png`.
- Primeira tentativa, descartada: `exec-85c8cc56-8766-4362-90e0-06ae98b00929.png`.
- Revisão selecionada: `exec-b706a4ed-c279-46c5-bbdc-999f337d522d.png`.
- Entrega: `public/assets/animations/v2/zirri.png` e `zirri.json`.

### Prompt inicial

```text
Use case: identity-preserve.
EDIT the attached approved Zirri 1-star character into ONE transparent 2D GAME SPRITESHEET.
Canvas exactly 1536 by 1536 pixels, square. EXACTLY FOUR equal columns and THREE equal rows, making TWELVE cells of 384 by 512 pixels. Exactly one COMPLETE MINIATURE character pose in each cell; all twelve cells occupied. No extra pose. Invisible cell boundaries only; no visible grid.
Identity: A slim adult tan-skinned female warrior with a high dark ponytail, olive leaf-and-leather outfit, white tribal markings and the original two long pale serrated blades mounted along her forearms. Preserve her human anatomy, full costume and original blades.
Lock same character identity, same 1-star outfit, weapons, hair, skin, colors, anatomy and proportions in every cell. All poses three-quarter facing RIGHT, never mirrored. Full body including feet, head and every weapon extremity. Preserve crisp painted pixel-art appearance of the source.
CELL LAYOUT IS CRITICAL: draw every character quite SMALL, using at most 60% of its cell height and at most 68% of its cell width INCLUDING weapons and effects. Leave generous transparent margins. Each grounded foot baseline exactly at 85% of its own cell height; body center at 50% of its own cell width. All twelve poses exactly the SAME body size and same shared ground anchor. Keep weapons compact with foreshortening if necessary. Do not enlarge figures to fill empty space. No pixels cross any cell boundary, no adjacent pose touches, no cropping.
ROW 1, frames 1 to 4: IDLE BREATHING LOOP. Four subtly distinct breathing poses, shoulder rise then settle and small clothing movement. Feet planted.
ROW 2, frames 5 to 8: WALK CYCLE in place. Obvious alternating steps: left foot forward, passing pose, right foot forward, passing pose. Legs and arms actually change. Same facing right, same body position in cell, no sliding across the row.
ROW 3, frames 9 to 12: ATTACK/CAST sequence. Compact crossed forearm blade slash: blades poised, close controlled slash toward right, follow-through, return. Blades remain inside the cell. No insect wings and no transformation.
Background true transparent RGBA. No black background, no painted checkerboard, no scenery, no ground plane, no shadows, no text, labels, numbers, borders or separators. Deliver all TWELVE poses at once, perfectly organized into the four-by-three cell layout.
```

### Prompt da revisão selecionada

```text
Use case: identity-preserve.
EDIT second input Zirri animation sheet: the pose silhouettes currently are TOO LARGE and cross the imaginary cell boundaries. Fix ONLY layout and scale, preserve the 12 animation poses, identity and artwork from the sheet. First input is the approved original character for identity.
CRITICAL: SHRINK EVERY ONE OF THE TWELVE FIGURES TO HALF ITS CURRENT SIZE. All twelve must look like SMALL MINIATURE ICONS surrounded by LARGE EMPTY TRANSPARENT MARGINS. Do not fill unused space. This layout repair needs much smaller figures, not another full-page illustration.
Square canvas, keep exactly FOUR EQUAL COLUMNS and THREE EQUAL ROWS. Twelve sprites in total. Their centers in each row are at 12.5%,37.5%,62.5%,87.5% of canvas width. Foot baselines at 26%,59%,92% of the TOTAL canvas height, respectively for first,second,third rows. Each full character INCLUDING WEAPONS occupies at most 14% of TOTAL CANVAS HEIGHT and 13% of TOTAL CANVAS WIDTH. All characters same scale across rows. This means each sprite is only around 175 pixels tall on a 1254-pixel canvas. Abundant transparency is desired. Place each character body on its own column center; feet share the row baseline.
Same Zirri 1-star identity, same face, same original outfit, same weapons, same colors, same hair and proportions. Three-quarter facing RIGHT throughout.
Keep row1 four breathing/idle poses. Row2 four different walking poses with alternate legs stepping. Row3 four poses of Compact crossed forearm blade slash: blades poised, close controlled slash toward right, follow-through, return. Blades remain inside the cell. No insect wings and no transformation. Keep every weapon entirely within its small sprite footprint, using compact posing and foreshortening.
Absolutely no sprites or effects crossing any cell boundary; all twelve fully visible with no crop. Huge clear gaps between sprites. Crisp detailed pixel style matching source, no reskin.
Background genuinely transparent RGBA. No black fill, no scenery, no floor, no shadows, no labels or text, no numbers, no grid lines. Return one whole 4-column by 3-row sheet.
```

## Ayo

- Referência aprovada: `chars/Ayo-1star.png`.
- Primeira tentativa, descartada: `exec-efa19830-456a-41df-a006-47d4c6048c18.png`.
- Revisão selecionada: `exec-e2ac2abb-ebd1-4b20-86cb-7b69e5a114f4.png`.
- Entrega: `public/assets/animations/v2/ayo.png` e `ayo.json`.

### Prompt inicial

```text
Use case: identity-preserve.
EDIT the attached approved Ayo 1-star character into ONE transparent 2D GAME SPRITESHEET.
Canvas exactly 1536 by 1536 pixels, square. EXACTLY FOUR equal columns and THREE equal rows, making TWELVE cells of 384 by 512 pixels. Exactly one COMPLETE MINIATURE character pose in each cell; all twelve cells occupied. No extra pose. Invisible cell boundaries only; no visible grid.
Identity: The original young male shaman with messy dark hair and red-white feathers, white cheek paint, turquoise beads, patterned cream-and-red tribal clothing, bare feet, ornate wooden turquoise-glowing staff and small carved wooden face totem carried on his back. Preserve outfit and totem exactly.
Lock same character identity, same 1-star outfit, weapons, hair, skin, colors, anatomy and proportions in every cell. All poses three-quarter facing RIGHT, never mirrored. Full body including feet, head and every weapon extremity. Preserve crisp painted pixel-art appearance of the source.
CELL LAYOUT IS CRITICAL: draw every character quite SMALL, using at most 60% of its cell height and at most 68% of its cell width INCLUDING weapons and effects. Leave generous transparent margins. Each grounded foot baseline exactly at 85% of its own cell height; body center at 50% of its own cell width. All twelve poses exactly the SAME body size and same shared ground anchor. Keep weapons compact with foreshortening if necessary. Do not enlarge figures to fill empty space. No pixels cross any cell boundary, no adjacent pose touches, no cropping.
ROW 1, frames 1 to 4: IDLE BREATHING LOOP. Four subtly distinct breathing poses, shoulder rise then settle and small clothing movement. Feet planted.
ROW 2, frames 5 to 8: WALK CYCLE in place. Obvious alternating steps: left foot forward, passing pose, right foot forward, passing pose. Legs and arms actually change. Same facing right, same body position in cell, no sliding across the row.
ROW 3, frames 9 to 12: ATTACK/CAST sequence. Totem spell cast: lift the staff slightly, focus turquoise light, emit a tiny contained turquoise spiral from the staff, recover. Keep the totem on the back and the effect within the cell. No huge totem, animal projection or transformation.
Background true transparent RGBA. No black background, no painted checkerboard, no scenery, no ground plane, no shadows, no text, labels, numbers, borders or separators. Deliver all TWELVE poses at once, perfectly organized into the four-by-three cell layout.
```

### Prompt da revisão selecionada

```text
Use case: identity-preserve.
EDIT second input Ayo animation sheet: the pose silhouettes currently are TOO LARGE and cross the imaginary cell boundaries. Fix ONLY layout and scale, preserve the 12 animation poses, identity and artwork from the sheet. First input is the approved original character for identity.
CRITICAL: SHRINK EVERY ONE OF THE TWELVE FIGURES TO HALF ITS CURRENT SIZE. All twelve must look like SMALL MINIATURE ICONS surrounded by LARGE EMPTY TRANSPARENT MARGINS. Do not fill unused space. This layout repair needs much smaller figures, not another full-page illustration.
Square canvas, keep exactly FOUR EQUAL COLUMNS and THREE EQUAL ROWS. Twelve sprites in total. Their centers in each row are at 12.5%,37.5%,62.5%,87.5% of canvas width. Foot baselines at 26%,59%,92% of the TOTAL canvas height, respectively for first,second,third rows. Each full character INCLUDING WEAPONS occupies at most 14% of TOTAL CANVAS HEIGHT and 13% of TOTAL CANVAS WIDTH. All characters same scale across rows. This means each sprite is only around 175 pixels tall on a 1254-pixel canvas. Abundant transparency is desired. Place each character body on its own column center; feet share the row baseline.
Same Ayo 1-star identity, same face, same original outfit, same weapons, same colors, same hair and proportions. Three-quarter facing RIGHT throughout.
Keep row1 four breathing/idle poses. Row2 four different walking poses with alternate legs stepping. Row3 four poses of Totem spell cast: lift the staff slightly, focus turquoise light, emit a tiny contained turquoise spiral from the staff, recover. Keep the totem on the back and the effect within the cell. No huge totem, animal projection or transformation. REMOVE the large outward magic projectiles. Show only a small glow directly on the hand or staff, contained within the character's silhouette.
Absolutely no sprites or effects crossing any cell boundary; all twelve fully visible with no crop. Huge clear gaps between sprites. Crisp detailed pixel style matching source, no reskin.
Background genuinely transparent RGBA. No black fill, no scenery, no floor, no shadows, no labels or text, no numbers, no grid lines. Return one whole 4-column by 3-row sheet.
```

## Kalu

- Referência aprovada: `chars/Kalu-1star.png`.
- Primeira tentativa, descartada: `exec-90340aba-a56b-4361-b89a-3e20c9acdcc4.png`.
- Revisão selecionada: `exec-28a92ac9-80dd-4c3c-8a8d-2ef357648216.png`.
- Entrega: `public/assets/animations/v2/kalu.png` e `kalu.json`.

### Prompt inicial

```text
Use case: identity-preserve.
EDIT the attached approved Kalu 1-star character into ONE transparent 2D GAME SPRITESHEET.
Canvas exactly 1536 by 1536 pixels, square. EXACTLY FOUR equal columns and THREE equal rows, making TWELVE cells of 384 by 512 pixels. Exactly one COMPLETE MINIATURE character pose in each cell; all twelve cells occupied. No extra pose. Invisible cell boundaries only; no visible grid.
Identity: The original tall athletic adult tan-skinned male hunter with dark braided hair, curved horn headdress with a small skull, white face/body paint, teal-red-cream feathered garments, leather leg wraps, bare toes and two lightweight short wooden stone-tipped spears. Preserve both spears and head ornaments exactly.
Lock same character identity, same 1-star outfit, weapons, hair, skin, colors, anatomy and proportions in every cell. All poses three-quarter facing RIGHT, never mirrored. Full body including feet, head and every weapon extremity. Preserve crisp painted pixel-art appearance of the source.
CELL LAYOUT IS CRITICAL: draw every character quite SMALL, using at most 60% of its cell height and at most 68% of its cell width INCLUDING weapons and effects. Leave generous transparent margins. Each grounded foot baseline exactly at 85% of its own cell height; body center at 50% of its own cell width. All twelve poses exactly the SAME body size and same shared ground anchor. Keep weapons compact with foreshortening if necessary. Do not enlarge figures to fill empty space. No pixels cross any cell boundary, no adjacent pose touches, no cropping.
ROW 1, frames 1 to 4: IDLE BREATHING LOOP. Four subtly distinct breathing poses, shoulder rise then settle and small clothing movement. Feet planted.
ROW 2, frames 5 to 8: WALK CYCLE in place. Obvious alternating steps: left foot forward, passing pose, right foot forward, passing pose. Legs and arms actually change. Same facing right, same body position in cell, no sliding across the row.
ROW 3, frames 9 to 12: ATTACK/CAST sequence. Short spear throw: draw throwing arm back, cast the right-hand spear forward in a compact motion, follow-through, recover with spear ready. Keep the spear within its cell; projectile travel is separate in-engine. Spare spear remains visible. No antelope spirit or transformed legs.
Background true transparent RGBA. No black background, no painted checkerboard, no scenery, no ground plane, no shadows, no text, labels, numbers, borders or separators. Deliver all TWELVE poses at once, perfectly organized into the four-by-three cell layout.
```

### Prompt da revisão selecionada

```text
Use case: identity-preserve.
EDIT second input Kalu animation sheet: the pose silhouettes currently are TOO LARGE and cross the imaginary cell boundaries. Fix ONLY layout and scale, preserve the 12 animation poses, identity and artwork from the sheet. First input is the approved original character for identity.
CRITICAL: SHRINK EVERY ONE OF THE TWELVE FIGURES TO HALF ITS CURRENT SIZE. All twelve must look like SMALL MINIATURE ICONS surrounded by LARGE EMPTY TRANSPARENT MARGINS. Do not fill unused space. This layout repair needs much smaller figures, not another full-page illustration.
Square canvas, keep exactly FOUR EQUAL COLUMNS and THREE EQUAL ROWS. Twelve sprites in total. Their centers in each row are at 12.5%,37.5%,62.5%,87.5% of canvas width. Foot baselines at 26%,59%,92% of the TOTAL canvas height, respectively for first,second,third rows. Each full character INCLUDING WEAPONS occupies at most 14% of TOTAL CANVAS HEIGHT and 13% of TOTAL CANVAS WIDTH. All characters same scale across rows. This means each sprite is only around 175 pixels tall on a 1254-pixel canvas. Abundant transparency is desired. Place each character body on its own column center; feet share the row baseline.
Same Kalu 1-star identity, same face, same original outfit, same weapons, same colors, same hair and proportions. Three-quarter facing RIGHT throughout.
Keep row1 four breathing/idle poses. Row2 four different walking poses with alternate legs stepping. Row3 four poses of Short spear throw: draw throwing arm back, cast the right-hand spear forward in a compact motion, follow-through, recover with spear ready. Keep the spear within its cell; projectile travel is separate in-engine. Spare spear remains visible. No antelope spirit or transformed legs. Keep every weapon entirely within its small sprite footprint, using compact posing and foreshortening.
Absolutely no sprites or effects crossing any cell boundary; all twelve fully visible with no crop. Huge clear gaps between sprites. Crisp detailed pixel style matching source, no reskin.
Background genuinely transparent RGBA. No black fill, no scenery, no floor, no shadows, no labels or text, no numbers, no grid lines. Return one whole 4-column by 3-row sheet.
```

## Viri

- Referência aprovada: `chars/Viri-1star.png`.
- Primeira tentativa, descartada: `exec-3062d6b8-f7a1-44af-9503-9ecdc8a152ee.png`.
- Revisão selecionada: `exec-adb8f6b1-ffed-40d0-a8c8-a3d47280bc25.png`.
- Entrega: `public/assets/animations/v2/viri.png` e `viri.json`.

### Prompt inicial

```text
Use case: identity-preserve.
EDIT the attached approved Viri 1-star character into ONE transparent 2D GAME SPRITESHEET.
Canvas exactly 1536 by 1536 pixels, square. EXACTLY FOUR equal columns and THREE equal rows, making TWELVE cells of 384 by 512 pixels. Exactly one COMPLETE MINIATURE character pose in each cell; all twelve cells occupied. No extra pose. Invisible cell boundaries only; no visible grid.
Identity: The original adult female nocturnal healer with long dark purple hair, bat-ear-shaped hair ornaments, golden eyes, purple-magenta wing-shaped robe sleeves, leafy berry decorations, shell ornaments, sandals and gnarled wooden staff with a glowing orange fruit lantern. Preserve the exact original costume and human body.
Lock same character identity, same 1-star outfit, weapons, hair, skin, colors, anatomy and proportions in every cell. All poses three-quarter facing RIGHT, never mirrored. Full body including feet, head and every weapon extremity. Preserve crisp painted pixel-art appearance of the source.
CELL LAYOUT IS CRITICAL: draw every character quite SMALL, using at most 60% of its cell height and at most 68% of its cell width INCLUDING weapons and effects. Leave generous transparent margins. Each grounded foot baseline exactly at 85% of its own cell height; body center at 50% of its own cell width. All twelve poses exactly the SAME body size and same shared ground anchor. Keep weapons compact with foreshortening if necessary. Do not enlarge figures to fill empty space. No pixels cross any cell boundary, no adjacent pose touches, no cropping.
ROW 1, frames 1 to 4: IDLE BREATHING LOOP. Four subtly distinct breathing poses, shoulder rise then settle and small clothing movement. Feet planted.
ROW 2, frames 5 to 8: WALK CYCLE in place. Obvious alternating steps: left foot forward, passing pose, right foot forward, passing pose. Legs and arms actually change. Same facing right, same body position in cell, no sliding across the row.
ROW 3, frames 9 to 12: ATTACK/CAST sequence. Sonic sleeve spell: draw sleeves close, open one sleeve in a compact wing-like arc toward right, release a small contained purple sound ripple, recover. Keep staff and sleeve silhouette fully inside the cell. No large external spirit wings and no transformation.
Background true transparent RGBA. No black background, no painted checkerboard, no scenery, no ground plane, no shadows, no text, labels, numbers, borders or separators. Deliver all TWELVE poses at once, perfectly organized into the four-by-three cell layout.
```

### Prompt da revisão selecionada

```text
Use case: identity-preserve.
EDIT second input Viri animation sheet: the pose silhouettes currently are TOO LARGE and cross the imaginary cell boundaries. Fix ONLY layout and scale, preserve the 12 animation poses, identity and artwork from the sheet. First input is the approved original character for identity.
CRITICAL: SHRINK EVERY ONE OF THE TWELVE FIGURES TO HALF ITS CURRENT SIZE. All twelve must look like SMALL MINIATURE ICONS surrounded by LARGE EMPTY TRANSPARENT MARGINS. Do not fill unused space. This layout repair needs much smaller figures, not another full-page illustration.
Square canvas, keep exactly FOUR EQUAL COLUMNS and THREE EQUAL ROWS. Twelve sprites in total. Their centers in each row are at 12.5%,37.5%,62.5%,87.5% of canvas width. Foot baselines at 26%,59%,92% of the TOTAL canvas height, respectively for first,second,third rows. Each full character INCLUDING WEAPONS occupies at most 14% of TOTAL CANVAS HEIGHT and 13% of TOTAL CANVAS WIDTH. All characters same scale across rows. This means each sprite is only around 175 pixels tall on a 1254-pixel canvas. Abundant transparency is desired. Place each character body on its own column center; feet share the row baseline.
Same Viri 1-star identity, same face, same original outfit, same weapons, same colors, same hair and proportions. Three-quarter facing RIGHT throughout.
Keep row1 four breathing/idle poses. Row2 four different walking poses with alternate legs stepping. Row3 four poses of Sonic sleeve spell: draw sleeves close, open one sleeve in a compact wing-like arc toward right, release a small contained purple sound ripple, recover. Keep staff and sleeve silhouette fully inside the cell. No large external spirit wings and no transformation. REMOVE the large outward magic projectiles. Show only a small glow directly on the hand or staff, contained within the character's silhouette.
Absolutely no sprites or effects crossing any cell boundary; all twelve fully visible with no crop. Huge clear gaps between sprites. Crisp detailed pixel style matching source, no reskin.
Background genuinely transparent RGBA. No black fill, no scenery, no floor, no shadows, no labels or text, no numbers, no grid lines. Return one whole 4-column by 3-row sheet.
```


