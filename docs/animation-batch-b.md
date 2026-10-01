# Lote de animações B — Kiko, Muru, Taka e Ena

Data: 30 de setembro de 2026.

## Entrega

Quatro folhas RGBA de 1254 × 1254, com 12 poses cada: quatro de repouso, quatro de caminhada e quatro de ataque. Total: 48 quadros e 12 clipes. Os arquivos PNG e JSON estão em `public/assets/animations/v2/`.

As folhas foram geradas pela ferramenta integrada **imagegen**, a partir das artes originais de uma estrela em `chars/`. Cada resultado passou por uma única edição para reduzir as figuras e afastá-las das bordas. Os PNGs finais foram copiados sem alterar pixels. Pillow foi usado somente para ler dimensões, transparência e coordenadas.

## Validação e integração

- Inspeção visual: 12 figuras completas por folha; identidades, roupas, armas e paletas reconhecíveis. A caminhada alterna pernas. Os ataques têm antecipação, ação e retorno.
- Transparência RGBA confirmada. Todos os 48 recortes têm margem transparente com limiar alfa > 64.
- Os limites das colunas são `[0,314,627,940,1254]`. Os limites das linhas são `[0,460,850,1254]`; esses recortes preservam os pés da primeira linha, que ultrapassavam o terço matemático da imagem em Kiko e Taka.
- Usar `frameRects` e `frameAnchors` do JSON; os campos médios `frameWidth` e `frameHeight` são apenas fallback.
- As âncoras são coordenadas locais dos pés, estimadas pela faixa inferior de 49 pixels. Em Muru, a medição exclui o cajado à direita. `bodyHeight` é a altura visível do quadro zero e inclui o cajado de Muru.
- Menores folgas horizontais: 5 px no ataque de Taka, 6 px no projétil de Kiko, 14 px no feitiço de Muru e 27 px no ataque de Ena.
- Animações limitadas à aparência de uma estrela. O sistema do jogo deve decidir como apresentar heróis de duas ou três estrelas. A validação em movimento dentro do jogo pertence à integração principal.

## Proveniência e prompts completos

Origem dos arquivos gerados: `C:/Users/bruno/.codex/generated_images/01a0f500-9462-7491-9a13-5342eaec1d5b/`.

### Kiko

- Referência: `chars/Kiko-1star.png`.
- Primeira geração: `exec-7635e5ca-4695-43c1-b05c-0c4ae318b93c.png`.
- Resultado final: `exec-e226ed35-a0d3-4616-94b9-59c4789b961e.png` → `public/assets/animations/v2/kiko.png`.

**Prompt inicial:**

```text
Use case: identity-preserve. Asset type: production pixel-art animated character spritesheet for Wolf Totem. EDIT the supplied one-star character into ONE complete transparent sheet with EXACTLY 12 isolated full-body frames, evenly arranged in EXACTLY 4 columns by 3 rows. Square 1536 x 1536 canvas, equal cells 384 wide x 512 high. No visible grid, no text, no labels, no ground, no scenery, no shadows outside character, NO EXTRA ROWS. Every cell has exactly ONE copy of SAME character at SAME scale, 3/4 view facing RIGHT. Body center x=50% of cell; feet baseline y=85% of cell. Head-to-feet height about 65% of cell, leaving generous transparent margins on every side for weapon motion. Keep the original character's identity, age, body proportions, face, skin, original colors, hairstyle, clothing, jewelry, shoes, and weapon exactly recognizable. Match crisp pixel-art shading of reference. No redesign, no evolution or spiritual transformation. All 12 frames clear and visually distinct but stable identity. Everything INCLUDING every weapon and accessory fits wholly within its own cell, at least 15px away from any cell edge, no overlap between cells. Row1 frames1-4: looping idle breathing, chest rise and fall and subtle cloth movement, fixed feet. Row2 frames5-8: looping walk right in place with obvious alternating bent knees, feet and coordinated arm motion, contact/pass/contact/pass, no translation within cell. Row3 frames9-12: readable action with anticipation, striking/casting moment, follow through, return. Output real transparent alpha, no checkerboard pixels.
Character lock and action: Kiko is the brown spiky-haired youthful tribal staff wielder with red/white feathers, green/rust clothing, white arm paint, wrapped short wooden staff. Row3 action: bring staff back, thrust staff forward to right, release a tiny amber projectile wholly inside cell, return. Keep STAFF short, preserve all clothing.
```

**Prompt da correção de layout:**

```text
Use case: precise-object-edit. Repair ONLY the layout of this transparent 12-frame Kiko spritesheet for the game. Preserve all twelve original poses, character identity, colors, clothes, staff, hair, feathers and exact style. Keep a square transparent canvas, exactly 4 columns x 3 rows, 12 identical rectangular grid cells. SHRINK every character and its whole weapon/effect group TO 70 PERCENT current size, ALL frames the same shared shrink scale. Place the reduced figure into its corresponding cell with body centered horizontally, bottom feet at 82% of cell height. The output must have wide empty transparent gutters separating EVERY cell. Whole staff and projectile of frames10 and11 currently cross columns: make them fully inside their own column after shrinking. Exactly 12 figures, no additions. Preserve 4 idle frames top row, 4 walking frames middle row, 4 attack frames bottom row; preserve the differences between poses. No visible grid, no text, no scenery. TRUE TRANSPARENT alpha. Weapons and effects nowhere touch or cross the mathematical quarter-width and third-height boundaries.
```

### Muru

- Referência: `chars/Muru-1star.png`.
- Primeira geração: `exec-45d09307-5f26-4dca-baad-93dc61ab6a6c.png`.
- Resultado final: `exec-d9a4868d-4c73-4bab-9b0f-69ecdbbbc2ad.png` → `public/assets/animations/v2/muru.png`.

**Prompt inicial:**

```text
Use case: identity-preserve. Asset type: production pixel-art animated character spritesheet for Wolf Totem. EDIT the supplied one-star character into ONE complete transparent sheet with EXACTLY 12 isolated full-body frames, evenly arranged in EXACTLY 4 columns by 3 rows. Square 1536 x 1536 canvas, equal cells 384 wide x 512 high. No visible grid, no text, no labels, no ground, no scenery, no shadows outside character, NO EXTRA ROWS. Every cell has exactly ONE copy of SAME character at SAME scale, 3/4 view facing RIGHT. Body center x=50% of cell; feet baseline y=85% of cell. Head-to-feet height about 65% of cell, leaving generous transparent margins on every side for weapon motion. Keep the original character's identity, age, body proportions, face, skin, original colors, hairstyle, clothing, jewelry, shoes, and weapon exactly recognizable. Match crisp pixel-art shading of reference. No redesign, no evolution or spiritual transformation. All 12 frames clear and visually distinct but stable identity. Everything INCLUDING every weapon and accessory fits wholly within its own cell, at least 15px away from any cell edge, no overlap between cells. Row1 frames1-4: looping idle breathing, chest rise and fall and subtle cloth movement, fixed feet. Row2 frames5-8: looping walk right in place with obvious alternating bent knees, feet and coordinated arm motion, contact/pass/contact/pass, no translation within cell. Row3 frames9-12: readable action with anticipation, striking/casting moment, follow through, return. Output real transparent alpha, no checkerboard pixels.
Character lock and action: Muru is the stocky heavyset smiling rain shaman with dark tied hair, green leafy mantle, white and blue skirt, bead necklace, water drop pendant, and tall wooden rain staff with gourds. Row3 action: lower stance, raise rain staff slightly, cast a small blue water swirl around hand and staff (fully inside cell), return. Keep heavyset proportions, leafy green mantle, staff gourds, blue water theme.
```

**Prompt da correção de layout:**

```text
Use case: precise-object-edit. Repair ONLY the layout of this transparent 12-frame Muru spritesheet for the game. Preserve all twelve original poses, exact character identity, proportions, colors, clothes, weapon, hair, face and exact pixel-art style. Keep square transparent canvas, exactly 4 columns x 3 rows, 12 equal rectangular grid cells. SHRINK every character and its whole weapon/effect group TO 65 PERCENT current size, ALL frames using the same shrink scale. Place each reduced figure into its corresponding cell with body centered horizontally, bottom feet at 82% of cell height. Wide empty transparent gutters must separate EVERY cell. All weapons and casting effects fully inside their own cell with at least 20px blank margin. Exactly 12 figures, no additions. Preserve 4 idle frames top row, 4 walking frames middle row, 4 attack/cast frames bottom row; preserve differences between poses. No visible grid, no text, no scenery. TRUE TRANSPARENT alpha. No bodypart, weapon or effect may touch/cross the mathematical quarter-width and third-height boundaries. No anatomy changes.
```

### Taka

- Referência: `chars/Taka-1star.png`.
- Primeira geração: `exec-1575d4d8-801f-4d01-b7c5-0cabbe45eb01.png`.
- Resultado final: `exec-de15f13c-8a3a-486b-a624-74ec6ae7f0a4.png` → `public/assets/animations/v2/taka.png`.

**Prompt inicial:**

```text
Use case: identity-preserve. Asset type: production pixel-art animated character spritesheet for Wolf Totem. EDIT the supplied one-star character into ONE complete transparent sheet with EXACTLY 12 isolated full-body frames, evenly arranged in EXACTLY 4 columns by 3 rows. Square 1536 x 1536 canvas, equal cells 384 wide x 512 high. No visible grid, no text, no labels, no ground, no scenery, no shadows outside character, NO EXTRA ROWS. Every cell has exactly ONE copy of SAME character at SAME scale, 3/4 view facing RIGHT. Body center x=50% of cell; feet baseline y=85% of cell. Head-to-feet height about 65% of cell, leaving generous transparent margins on every side for weapon motion. Keep the original character's identity, age, body proportions, face, skin, original colors, hairstyle, clothing, jewelry, shoes, and weapon exactly recognizable. Match crisp pixel-art shading of reference. No redesign, no evolution or spiritual transformation. All 12 frames clear and visually distinct but stable identity. Everything INCLUDING every weapon and accessory fits wholly within its own cell, at least 15px away from any cell edge, no overlap between cells. Row1 frames1-4: looping idle breathing, chest rise and fall and subtle cloth movement, fixed feet. Row2 frames5-8: looping walk right in place with obvious alternating bent knees, feet and coordinated arm motion, contact/pass/contact/pass, no translation within cell. Row3 frames9-12: readable action with anticipation, striking/casting moment, follow through, return. Output real transparent alpha, no checkerboard pixels.
Character lock and action: Taka is the lean muscular brown-skinned adult dual-blade fighter, dread mohawk, spotted fur on shoulder/hip, dark red/ochre rags, skull belt and two serrated short bone blades. Remove reference dark glow entirely. Row3 action: crouch and wind two knives back, slash one knife to right, slash second knife in crossed follow-through to right, recover. Always exactly two hands holding two short blades; keep body and both blades wholly inside each cell.
```

**Prompt da correção de layout:**

```text
Use case: precise-object-edit. Repair ONLY the layout of this transparent 12-frame Taka spritesheet for the game. Preserve all twelve original poses, exact adult fighter identity, body proportions, skin, fur clothes, red/ochre palette, dual knives, hair, face and pixel-art style. Keep square transparent canvas, exactly 4 columns x 3 rows, 12 equal rectangular grid cells. SHRINK every character and both knives TO 60 PERCENT current size, ALL frames using exactly the same shrink scale. Place each reduced figure into corresponding cell with body centered horizontally, feet at 82% of cell height. Wide empty transparent gutters must separate EVERY cell. All knives and bodyparts fully inside their own cell with at least 20px blank margin. Exactly 12 figures, no additions. Preserve 4 idle frames top row, 4 walking frames middle row, 4 attack frames bottom row; preserve pose differences. Preserve exactly TWO ARMS and TWO HANDS with one short blade in each hand. No visible grid, no text, no scenery. TRUE TRANSPARENT alpha. No bodypart or weapon may touch/cross mathematical quarter-width and third-height boundaries.
```

### Ena

- Referência: `chars/Ena-1star.png`.
- Primeira geração: `exec-3e7ab119-64aa-49f0-85bd-d273bd7a8320.png`.
- Resultado final: `exec-d4489f3f-2c1c-43cc-b698-e02cf621a0e6.png` → `public/assets/animations/v2/ena.png`.

**Prompt inicial:**

```text
Use case: identity-preserve. Asset type: production pixel-art animated character spritesheet for Wolf Totem. EDIT the supplied one-star character into ONE complete transparent sheet with EXACTLY 12 isolated full-body frames, evenly arranged in EXACTLY 4 columns by 3 rows. Square 1536 x 1536 canvas, equal cells 384 wide x 512 high. No visible grid, no text, no labels, no ground, no scenery, no shadows outside character, NO EXTRA ROWS. Every cell has exactly ONE copy of SAME character at SAME scale, 3/4 view facing RIGHT. Body center x=50% of cell; feet baseline y=85% of cell. Head-to-feet height about 65% of cell, leaving generous transparent margins on every side for weapon motion. Keep the original character's identity, age, body proportions, face, skin, original colors, hairstyle, clothing, jewelry, shoes, and weapon exactly recognizable. Match crisp pixel-art shading of reference. No redesign, no evolution or spiritual transformation. All 12 frames clear and visually distinct but stable identity. Everything INCLUDING every weapon and accessory fits wholly within its own cell, at least 15px away from any cell edge, no overlap between cells. Row1 frames1-4: looping idle breathing, chest rise and fall and subtle cloth movement, fixed feet. Row2 frames5-8: looping walk right in place with obvious alternating bent knees, feet and coordinated arm motion, contact/pass/contact/pass, no translation within cell. Row3 frames9-12: readable action with anticipation, striking/casting moment, follow through, return. Output real transparent alpha, no checkerboard pixels.
Character lock and action: Ena is the brown-skinned owl masked adult archer with large golden eyes, long dark ponytail, white-red-teal owl mask, green leaf-and-feather outfit, decorated wooden bow and quiver. Row3 action: raise bow aiming right and nock arrow, clearly pull bowstring back to face, release arrow toward right with compact bow recoil, lower bow and recover. Keep exact owl mask in all frames, right-facing 3/4, complete bow stays inside each cell.
```

**Prompt da correção de layout:**

```text
Use case: precise-object-edit. Repair ONLY the layout of this transparent 12-frame Ena spritesheet for the game. Preserve all twelve original poses, exact character identity, proportions, colors, clothes, weapon, hair, face and exact pixel-art style. Keep square transparent canvas, exactly 4 columns x 3 rows, 12 equal rectangular grid cells. SHRINK every character and its whole weapon/effect group TO 65 PERCENT current size, ALL frames using the same shrink scale. Place each reduced figure into its corresponding cell with body centered horizontally, bottom feet at 82% of cell height. Wide empty transparent gutters must separate EVERY cell. All weapons and casting effects fully inside their own cell with at least 20px blank margin. Exactly 12 figures, no additions. Preserve 4 idle frames top row, 4 walking frames middle row, 4 attack/cast frames bottom row; preserve differences between poses. No visible grid, no text, no scenery. TRUE TRANSPARENT alpha. No bodypart, weapon or effect may touch/cross the mathematical quarter-width and third-height boundaries. No anatomy changes.
```

