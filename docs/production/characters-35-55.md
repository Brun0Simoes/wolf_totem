# Produção dos personagens 35–55

## Estado final desta rodada

**9 de 63 folhas entregues**, com 108 poses e 27 sequências. **54 folhas permanecem pendentes.** As nove entregas foram inspecionadas visualmente e passaram na leitura de alfa, limites de quadros, âncoras e recorte de retrato. São aprovadas para integração no protótipo; a revisão de movimento no motor ainda define o acabamento final.

Lista exata aprovada em `public/assets/animations/v3`: `35-s1`, `35-s2`, `36-s1`, `37-s1`, `38-s1`, `39-s1`, `40-s1`, `41-s1`, `42-s1`, cada uma com PNG e JSON.

A ferramenta integrada interrompeu o lote com **HTTP 429 — `usage_limit_reached`**, plano Plus. Retorno informado: `resets_at=1790876541`, `resets_in_seconds=57206`, com reinício indicado para **1º de outubro de 2026, às 14h42min21s de Brasília**. Nenhuma chamada nova foi iniciada após esse erro. Não foi usado fallback de API/CLI. O número restante é trabalho pendente, sem ativos fictícios.

O lote interrompido pretendia gerar Mako 3★, Sava 2★/3★ e Nilo 2★/3★ após as três saídas que retornaram. Essas cinco variantes não produziram arquivo retornado. As pastas de saídas foram conferidas após a interrupção. Os demais personagens 43–55 e demais evoluções nem chegaram a ser enviados.

As tentativas anteriores rejeitadas de Yara e Makara estão preservadas em `artifacts/production-35-55`, fora do diretório que o runtime importa. As revisões aprovadas estão em `public/assets/animations/v3`.

| ID | Personagem | 1★ | 2★ | 3★ |
| --- | --- | --- | --- | --- |
| 35 | Mako | Pronta | Pronta | Pendente |
| 36 | Sava | Pronta | Pendente | Pendente |
| 37 | Nilo | Pronta | Pendente | Pendente |
| 38 | Yara | Pronta | Pendente | Pendente |
| 39 | Fenra | Pronta | Pendente | Pendente |
| 40 | Koru | Pronta | Pendente | Pendente |
| 41 | Makara | Pronta | Pendente | Pendente |
| 42 | Nyala | Pronta | Pendente | Pendente |
| 43 | Vahara | Pendente | Pendente | Pendente |
| 44 | Zyri | Pendente | Pendente | Pendente |
| 45 | Orun | Pendente | Pendente | Pendente |
| 46 | Sakar | Pendente | Pendente | Pendente |
| 47 | Aruun | Pendente | Pendente | Pendente |
| 48 | Boro | Pendente | Pendente | Pendente |
| 49 | Uruq | Pendente | Pendente | Pendente |
| 50 | Akh'ra | Pendente | Pendente | Pendente |
| 51 | Mahari | Pendente | Pendente | Pendente |
| 52 | Veyra | Pendente | Pendente | Pendente |
| 53 | Ssar'ka | Pendente | Pendente | Pendente |
| 54 | N'Goro | Pendente | Pendente | Pendente |
| 55 | Karkun | Pendente | Pendente | Pendente |

A imagem gerada foi preservada integralmente em todas as entregas. Cada folha mede 1254 × 1254 pixels; os retângulos explícitos acomodam o espaçamento irregular. O alfa máximo nas bordas selecionadas foi 1/255. Nenhum original em `chars` ou dado canônico foi alterado.

As entradas a seguir são o histórico de produção. A tabela acima representa o estado atual; uma tentativa antiga com estado pendente/reprovado foi substituída quando existe revisão pronta do mesmo ID/estágio.



Escopo: 21 personagens, três estágios por personagem, 63 folhas previstas. Cada folha contém 12 poses: espera, caminhada e ataque/conjuração, quatro quadros em cada sequência.

Fonte canônica: `src/data/characters.ts` e `docs/plano-original.txt`. As referências de estilo aprovadas em `chars` foram inspecionadas. Novos desenhos usam couro, fibras, madeira, osso, pedra e pintura corporal dentro da direção primitiva pintada/pixel do projeto. Os estágios 2★ e 3★ usam a folha 1★ do mesmo herói como referência de identidade.

Ferramenta: `image_gen` integrada. Imagens são copiadas intactas. Scripts apenas leem geometria/alfa e escrevem JSON; não editam pixels. Estado inicial: produção em andamento.

As folhas devem ser carregadas pelos `frameRects` explícitos. Âncoras usam coordenadas locais a cada quadro, e `portrait` fornece o limite absoluto da primeira pose dentro da imagem. A escala usa `bodyHeight` da primeira pose. Quando há uma transformação exclusiva de conjuração ou renascimento, ela não deve substituir indevidamente a aparência de espera.

## Entregas e prompts

## Requisições interrompidas pela cota

Não houve imagem retornada para as cinco requisições abaixo. Os prompts ficam registrados para retomada; isso não representa entrega nem execução agendada.

### Pendente: 35 — Mako, 3★

Referência de identidade prevista: `public/assets/animations/v3/35-s1.png`.

```text
Use case: identity-preserve. EDIT this approved first-star spritesheet into STAR 3 of the SAME Mako, "Arraia de Água Negra", character 35.
Identity lock: keep the same person, face, age, hair color, costume motifs, weapons and palette so this is clearly an evolution of the reference, not a new character.
Original appearance: sacerdotisa de rio com manto muito largo e achatado.
Apply the canonical second-star changes: manto começa a flutuar como se estivesse submerso e duas extensões de água surgem nos braços.
Additionally apply the THIRD-STAR evolution exactly: corpo desliza levemente acima do chão e o manto espiritual assume a forma inteira de uma gigantesca arraia.
Distinguish base appearance from transformations that happen only during an ability: idle and walk show the allowed BASE at this star; attack/cast may briefly show the explicitly described ability form. A spirit outside the body is not a replacement animal head. Never turn a manifesting human into a generic animal-person. Keep full human identity where the brief says so.
Ability: Véu de Água Negra: cria região que protege aliados e danifica inimigos.. Attack four phases: raise the wide river cloak, sweep a compact dark-blue water veil close to the body, release the shielding spell, recover.
Polished primitive fantasy painted pixel-art game sprites, warm hand-painted material shading with crisp readable pixel edges, strong silhouettes, expressive faces, detailed leather/leaf/fiber/bone/wood/stone outfits, consistent 3/4 right-facing viewpoint. No modern armor, firearms, machinery or scenery.
Layout: ONE square transparent sheet of EXACTLY TWELVE MINIATURE full-body poses, FOUR columns by THREE rows. Compared with the reference, REDUCE ALL FIGURES TO ABOUT HALF THE HEIGHT to leave ample empty space for new spiritual features. Entire figure INCLUDING wings, tail, weapon, aura and all spirits stays inside a small footprint no more14% of total image width and16% of total image height. Large empty transparent gutters! If a spirit is described as colossal, show a compact complete spiritual silhouette in that same footprint, not a gigantic backdrop stretching into another cell.
Centers x12.5%,37.5%,62.5%,87.5%; foot baseline y27%,60%,93%. Same body scale across all12; full head, feet and accessories visible. Row1 idle breathing4; row2 walking4 with obvious alternating left and right steps (or canonical gliding locomotion if legs replaced); row3 attack/cast4 with preparation/action/follow-through/recovery. All facing right3/4. No touching neighbors or clipping. True transparent RGBA, no floor, scenery, shadows, text, labels, numbers or grid.
```

### Pendente: 36 — Sava, 2★

Referência de identidade prevista: `public/assets/animations/v3/36-s1.png`.

```text
Use case: identity-preserve. EDIT this approved first-star spritesheet into STAR 2 of the SAME Sava, "Tigresa Dourada", character 36.
Identity lock: keep the same person, face, age, hair color, costume motifs, weapons and palette so this is clearly an evolution of the reference, not a new character.
Original appearance: guerreira musculosa com duas manoplas e linhas douradas pintadas no corpo.
Apply the canonical second-star changes: dentes, garras e olhos tornam-se felinos; cabelo cresce como pequena juba.
DO NOT add third-star changes, full transformations or unrelated anatomy.
Distinguish base appearance from transformations that happen only during an ability: idle and walk show the allowed BASE at this star; attack/cast may briefly show the explicitly described ability form. A spirit outside the body is not a replacement animal head. Never turn a manifesting human into a generic animal-person. Keep full human identity where the brief says so.
Ability: Frenesi Dourado: transforma-se, ganhando sustain e ataques em cone.. Attack four phases: draw both gauntlets back, execute a compact fierce claw-like punch toward the right, follow through, recover.
Polished primitive fantasy painted pixel-art game sprites, warm hand-painted material shading with crisp readable pixel edges, strong silhouettes, expressive faces, detailed leather/leaf/fiber/bone/wood/stone outfits, consistent 3/4 right-facing viewpoint. No modern armor, firearms, machinery or scenery.
Layout: ONE square transparent sheet of EXACTLY TWELVE MINIATURE full-body poses, FOUR columns by THREE rows. Compared with the reference, REDUCE ALL FIGURES TO ABOUT HALF THE HEIGHT to leave ample empty space for new spiritual features. Entire figure INCLUDING wings, tail, weapon, aura and all spirits stays inside a small footprint no more14% of total image width and16% of total image height. Large empty transparent gutters! If a spirit is described as colossal, show a compact complete spiritual silhouette in that same footprint, not a gigantic backdrop stretching into another cell.
Centers x12.5%,37.5%,62.5%,87.5%; foot baseline y27%,60%,93%. Same body scale across all12; full head, feet and accessories visible. Row1 idle breathing4; row2 walking4 with obvious alternating left and right steps (or canonical gliding locomotion if legs replaced); row3 attack/cast4 with preparation/action/follow-through/recovery. All facing right3/4. No touching neighbors or clipping. True transparent RGBA, no floor, scenery, shadows, text, labels, numbers or grid.
```

### Pendente: 36 — Sava, 3★

Referência de identidade prevista: `public/assets/animations/v3/36-s1.png`.

```text
Use case: identity-preserve. EDIT this approved first-star spritesheet into STAR 3 of the SAME Sava, "Tigresa Dourada", character 36.
Identity lock: keep the same person, face, age, hair color, costume motifs, weapons and palette so this is clearly an evolution of the reference, not a new character.
Original appearance: guerreira musculosa com duas manoplas e linhas douradas pintadas no corpo.
Apply the canonical second-star changes: dentes, garras e olhos tornam-se felinos; cabelo cresce como pequena juba.
Additionally apply the THIRD-STAR evolution exactly: fora do cast já possui traços híbridos; durante Frenesi transforma-se numa tigresa humanoide dourada quase completa.
Distinguish base appearance from transformations that happen only during an ability: idle and walk show the allowed BASE at this star; attack/cast may briefly show the explicitly described ability form. A spirit outside the body is not a replacement animal head. Never turn a manifesting human into a generic animal-person. Keep full human identity where the brief says so.
Ability: Frenesi Dourado: transforma-se, ganhando sustain e ataques em cone.. Attack four phases: draw both gauntlets back, execute a compact fierce claw-like punch toward the right, follow through, recover.
Polished primitive fantasy painted pixel-art game sprites, warm hand-painted material shading with crisp readable pixel edges, strong silhouettes, expressive faces, detailed leather/leaf/fiber/bone/wood/stone outfits, consistent 3/4 right-facing viewpoint. No modern armor, firearms, machinery or scenery.
Layout: ONE square transparent sheet of EXACTLY TWELVE MINIATURE full-body poses, FOUR columns by THREE rows. Compared with the reference, REDUCE ALL FIGURES TO ABOUT HALF THE HEIGHT to leave ample empty space for new spiritual features. Entire figure INCLUDING wings, tail, weapon, aura and all spirits stays inside a small footprint no more14% of total image width and16% of total image height. Large empty transparent gutters! If a spirit is described as colossal, show a compact complete spiritual silhouette in that same footprint, not a gigantic backdrop stretching into another cell.
Centers x12.5%,37.5%,62.5%,87.5%; foot baseline y27%,60%,93%. Same body scale across all12; full head, feet and accessories visible. Row1 idle breathing4; row2 walking4 with obvious alternating left and right steps (or canonical gliding locomotion if legs replaced); row3 attack/cast4 with preparation/action/follow-through/recovery. All facing right3/4. No touching neighbors or clipping. True transparent RGBA, no floor, scenery, shadows, text, labels, numbers or grid.
```

### Pendente: 37 — Nilo, 2★

Referência de identidade prevista: `public/assets/animations/v3/37-s1.png`.

```text
Use case: identity-preserve. EDIT this approved first-star spritesheet into STAR 2 of the SAME Nilo, "Quebra-Cupins", character 37.
Identity lock: keep the same person, face, age, hair color, costume motifs, weapons and palette so this is clearly an evolution of the reference, not a new character.
Original appearance: guerreiro alto com antebraços enormes e uma arma flexível enrolada na cintura.
Apply the canonical second-star changes: mãos tornam-se grandes garras e rosto ganha linhas alongadas.
DO NOT add third-star changes, full transformations or unrelated anatomy.
Distinguish base appearance from transformations that happen only during an ability: idle and walk show the allowed BASE at this star; attack/cast may briefly show the explicitly described ability form. A spirit outside the body is not a replacement animal head. Never turn a manifesting human into a generic animal-person. Keep full human identity where the brief says so.
Ability: Língua de Guerra: atinge inimigos em linha e puxa o primeiro.. Attack four phases: uncoil a short section of the flexible waist weapon, whip it compactly toward the right, pull it back, recover; magical tongue visual only if allowed by this star.
Polished primitive fantasy painted pixel-art game sprites, warm hand-painted material shading with crisp readable pixel edges, strong silhouettes, expressive faces, detailed leather/leaf/fiber/bone/wood/stone outfits, consistent 3/4 right-facing viewpoint. No modern armor, firearms, machinery or scenery.
Layout: ONE square transparent sheet of EXACTLY TWELVE MINIATURE full-body poses, FOUR columns by THREE rows. Compared with the reference, REDUCE ALL FIGURES TO ABOUT HALF THE HEIGHT to leave ample empty space for new spiritual features. Entire figure INCLUDING wings, tail, weapon, aura and all spirits stays inside a small footprint no more14% of total image width and16% of total image height. Large empty transparent gutters! If a spirit is described as colossal, show a compact complete spiritual silhouette in that same footprint, not a gigantic backdrop stretching into another cell.
Centers x12.5%,37.5%,62.5%,87.5%; foot baseline y27%,60%,93%. Same body scale across all12; full head, feet and accessories visible. Row1 idle breathing4; row2 walking4 with obvious alternating left and right steps (or canonical gliding locomotion if legs replaced); row3 attack/cast4 with preparation/action/follow-through/recovery. All facing right3/4. No touching neighbors or clipping. True transparent RGBA, no floor, scenery, shadows, text, labels, numbers or grid.
```

### Pendente: 37 — Nilo, 3★

Referência de identidade prevista: `public/assets/animations/v3/37-s1.png`.

```text
Use case: identity-preserve. EDIT this approved first-star spritesheet into STAR 3 of the SAME Nilo, "Quebra-Cupins", character 37.
Identity lock: keep the same person, face, age, hair color, costume motifs, weapons and palette so this is clearly an evolution of the reference, not a new character.
Original appearance: guerreiro alto com antebraços enormes e uma arma flexível enrolada na cintura.
Apply the canonical second-star changes: mãos tornam-se grandes garras e rosto ganha linhas alongadas.
Additionally apply the THIRD-STAR evolution exactly: focinho espiritual se sobrepõe ao rosto e sua língua energética pode alcançar vários metros.
Distinguish base appearance from transformations that happen only during an ability: idle and walk show the allowed BASE at this star; attack/cast may briefly show the explicitly described ability form. A spirit outside the body is not a replacement animal head. Never turn a manifesting human into a generic animal-person. Keep full human identity where the brief says so.
Ability: Língua de Guerra: atinge inimigos em linha e puxa o primeiro.. Attack four phases: uncoil a short section of the flexible waist weapon, whip it compactly toward the right, pull it back, recover; magical tongue visual only if allowed by this star.
Polished primitive fantasy painted pixel-art game sprites, warm hand-painted material shading with crisp readable pixel edges, strong silhouettes, expressive faces, detailed leather/leaf/fiber/bone/wood/stone outfits, consistent 3/4 right-facing viewpoint. No modern armor, firearms, machinery or scenery.
Layout: ONE square transparent sheet of EXACTLY TWELVE MINIATURE full-body poses, FOUR columns by THREE rows. Compared with the reference, REDUCE ALL FIGURES TO ABOUT HALF THE HEIGHT to leave ample empty space for new spiritual features. Entire figure INCLUDING wings, tail, weapon, aura and all spirits stays inside a small footprint no more14% of total image width and16% of total image height. Large empty transparent gutters! If a spirit is described as colossal, show a compact complete spiritual silhouette in that same footprint, not a gigantic backdrop stretching into another cell.
Centers x12.5%,37.5%,62.5%,87.5%; foot baseline y27%,60%,93%. Same body scale across all12; full head, feet and accessories visible. Row1 idle breathing4; row2 walking4 with obvious alternating left and right steps (or canonical gliding locomotion if legs replaced); row3 attack/cast4 with preparation/action/follow-through/recovery. All facing right3/4. No touching neighbors or clipping. True transparent RGBA, no floor, scenery, shadows, text, labels, numbers or grid.
```


### 38 — Yara, 1★

- Estado: ready.
- Imagem gerada: `C:/Users/bruno/.codex/generated_images/01a0f48f-2570-7ae2-a8e1-860525eff9c0/exec-324be5db-101c-447d-965b-7bb8fd36bae3.png`.
- Destino previsto/aprovado: `public/assets/animations/v3/38-s1.png` e JSON de mesmo nome.
- Geometria: {"id":38,"stars":1,"status":"ready","image":"/assets/animations/v3/38-s1.png","width":1254,"height":1254,"bodyHeight":257,"maxBorder":1}.
- Tentativas anteriores: `C:/Users/bruno/.codex/generated_images/01a0f48f-2570-7ae2-a8e1-860525eff9c0/exec-e4d9918f-64b6-4542-80c2-6f988224f654.png` (needs-visual-correction).

Prompt desta entrega:

```text
Use case: identity-preserve. EDIT this Yara STAR 1 spritesheet to fix layout and canonical details. Preserve same face, body, clothing identity, hair and all TWELVE animation poses, FOUR columns by THREE rows. Yara 1-star must have a SIMPLE PLAIN WHITE MASK and PLAIN CLOTH cloak, without the additional feather growth specified only for 2-star. Replace feathered mantle textures with simple pale primitive woven cloth. Remove giant white magic bubbles: lunar spell is only a tiny glow at staff/head and hand, never a broad backdrop.
CRITICAL LAYOUT REPAIR: SHRINK every complete pose to HALF its current size, including all props, weapons and VFX. Render miniature figures with enormous transparent gutters, exactly one complete figure within each cell. No magical field, cloak or weapon crosses a cell edge. At 1254-square image each sprite is at most150px wide and180px tall. Figures should look SMALL. Feet baselines y27%,60%,93%; column centers x12.5%,37.5%,62.5%,87.5%. Keep same scale all12.
Retain row1 four breathing poses, row2 four alternating stepping poses, row3 four attack/cast poses. True transparent RGBA, no text, labels, grids, scenery, shadows or floor. Same primitive painted pixel game style.
```

### 41 — Makara, 1★

- Estado: ready.
- Imagem gerada: `C:/Users/bruno/.codex/generated_images/01a0f48f-2570-7ae2-a8e1-860525eff9c0/exec-f23e34e1-263e-4a54-81ef-45af59440d7f.png`.
- Destino previsto/aprovado: `public/assets/animations/v3/41-s1.png` e JSON de mesmo nome.
- Geometria: {"id":41,"stars":1,"status":"ready","image":"/assets/animations/v3/41-s1.png","width":1254,"height":1254,"bodyHeight":215,"maxBorder":1}.
- Tentativas anteriores: `C:/Users/bruno/.codex/generated_images/01a0f48f-2570-7ae2-a8e1-860525eff9c0/exec-8bb7a507-f23a-401a-b471-ea7119ba401c.png` (failed).

Prompt desta entrega:

```text
Use case: identity-preserve. EDIT this Makara STAR 1 spritesheet to fix layout and canonical details. Preserve same face, body, clothing identity, hair and all TWELVE animation poses, FOUR columns by THREE rows. Makara must remain human at 1-star. Remove broad motion arcs and energy trails; keep the toothed weapon close and foreshortened during the attack. The two middle attack poses currently collide; isolate all twelve with very wide transparent gutters.
CRITICAL LAYOUT REPAIR: SHRINK every complete pose to HALF its current size, including all props, weapons and VFX. Render miniature figures with enormous transparent gutters, exactly one complete figure within each cell. No magical field, cloak or weapon crosses a cell edge. At 1254-square image each sprite is at most150px wide and180px tall. Figures should look SMALL. Feet baselines y27%,60%,93%; column centers x12.5%,37.5%,62.5%,87.5%. Keep same scale all12.
Retain row1 four breathing poses, row2 four alternating stepping poses, row3 four attack/cast poses. True transparent RGBA, no text, labels, grids, scenery, shadows or floor. Same primitive painted pixel game style.
```

### 35 — Mako, 2★

- Estado: ready.
- Imagem gerada: `C:/Users/bruno/.codex/generated_images/01a0f48f-2570-7ae2-a8e1-860525eff9c0/exec-238bcde7-ebfa-46e3-8971-cc2111a49473.png`.
- Destino previsto/aprovado: `public/assets/animations/v3/35-s2.png` e JSON de mesmo nome.
- Geometria: {"id":35,"stars":2,"status":"ready","image":"/assets/animations/v3/35-s2.png","width":1254,"height":1254,"bodyHeight":249,"maxBorder":1}.

Prompt desta entrega:

```text
Use case: identity-preserve. EDIT this approved first-star spritesheet into STAR 2 of the SAME Mako, "Arraia de Água Negra", character 35.
Identity lock: keep the same person, face, age, hair color, costume motifs, weapons and palette so this is clearly an evolution of the reference, not a new character.
Original appearance: sacerdotisa de rio com manto muito largo e achatado.
Apply the canonical second-star changes: manto começa a flutuar como se estivesse submerso e duas extensões de água surgem nos braços.
DO NOT add third-star changes, full transformations or unrelated anatomy.
Distinguish base appearance from transformations that happen only during an ability: idle and walk show the allowed BASE at this star; attack/cast may briefly show the explicitly described ability form. A spirit outside the body is not a replacement animal head. Never turn a manifesting human into a generic animal-person. Keep full human identity where the brief says so.
Ability: Véu de Água Negra: cria região que protege aliados e danifica inimigos.. Attack four phases: raise the wide river cloak, sweep a compact dark-blue water veil close to the body, release the shielding spell, recover.
Polished primitive fantasy painted pixel-art game sprites, warm hand-painted material shading with crisp readable pixel edges, strong silhouettes, expressive faces, detailed leather/leaf/fiber/bone/wood/stone outfits, consistent 3/4 right-facing viewpoint. No modern armor, firearms, machinery or scenery.
Layout: ONE square transparent sheet of EXACTLY TWELVE MINIATURE full-body poses, FOUR columns by THREE rows. Compared with the reference, REDUCE ALL FIGURES TO ABOUT HALF THE HEIGHT to leave ample empty space for new spiritual features. Entire figure INCLUDING wings, tail, weapon, aura and all spirits stays inside a small footprint no more14% of total image width and16% of total image height. Large empty transparent gutters! If a spirit is described as colossal, show a compact complete spiritual silhouette in that same footprint, not a gigantic backdrop stretching into another cell.
Centers x12.5%,37.5%,62.5%,87.5%; foot baseline y27%,60%,93%. Same body scale across all12; full head, feet and accessories visible. Row1 idle breathing4; row2 walking4 with obvious alternating left and right steps (or canonical gliding locomotion if legs replaced); row3 attack/cast4 with preparation/action/follow-through/recovery. All facing right3/4. No touching neighbors or clipping. True transparent RGBA, no floor, scenery, shadows, text, labels, numbers or grid.
```


### 35 — Mako, 1★

- Estado: ready.
- Imagem gerada: `C:/Users/bruno/.codex/generated_images/01a0f48f-2570-7ae2-a8e1-860525eff9c0/exec-d47814c9-055b-4f3a-bf26-02ba73a1c601.png`.
- Destino previsto/aprovado: `public/assets/animations/v3/35-s1.png` e JSON de mesmo nome.
- Geometria: {"id":35,"stars":1,"status":"ready","image":"/assets/animations/v3/35-s1.png","width":1254,"height":1254,"bodyHeight":301,"maxBorder":1}.

Prompt desta entrega:

```text
Use case: stylized-concept. Asset: Wolf Totem character 35, Mako, "Arraia de Água Negra", STAR 1.
Create a NEW coherent character design from this canonical brief. Traits: Rio, Místico. STAR-1 APPEARANCE, in the author's Portuguese: sacerdotisa de rio com manto muito largo e achatado. Ability: Véu de Água Negra: cria região que protege aliados e danifica inimigos.
Strictly use this first-stage appearance. The character is human; animal influences are expressed only through primitive motifs and equipment unless the star-1 brief explicitly says otherwise. Do NOT add later-star mutations, animal heads, extra limbs or external giant spirit avatars.
Polished primitive fantasy painted pixel-art game sprites, warm hand-painted material shading with crisp readable pixel edges, strong silhouettes, expressive faces, detailed leather/leaf/fiber/bone/wood/stone outfits, consistent 3/4 right-facing viewpoint. No modern armor, firearms, machinery or scenery.
Deliver ONE SQUARE transparent PNG spritesheet with EXACTLY TWELVE SMALL MINIATURE FULL-BODY POSES, arranged FOUR columns by THREE rows. All 12 are the SAME character, outfit, age, face, hair, skin, proportions and palette. Large generous empty space between every pose is essential. At 1254-square scale, each entire sprite INCLUDING weapons and effects is only about 150 pixels wide and 180 pixels tall. Never larger than 14% of total canvas width or 16% total canvas height. Do not expand the figures to fill the canvas.
Invisible equal grid: centers x12.5%,37.5%,62.5%,87.5%; feet baselines y27%,60%,93% of total canvas. Each character stays centered within its own slot. Keep all weapons, robes, tails and magic inside the small footprint using compact poses or foreshortening. No pose may touch, overlap or cross into another cell. Complete head, full feet, all held objects visible. SAME scale throughout.
ROW1 idle loop: four breathing poses, planted feet, shoulders gently rise then settle.
ROW2 walk loop in place: clear left step, passing pose, right step, passing pose. Legs alternate, clothing moves, no horizontal translation.
ROW3 attack/cast: raise the wide river cloak, sweep a compact dark-blue water veil close to the body, release the shielding spell, recover. Four distinct sequential poses preparation/action/follow-through/recovery. Effects small and close to body, never a separate giant figure.
True RGBA transparency. No background fill, no floor or shadow, no text, labels, borders, grid or UI. All 12 poses at once.
```

### 36 — Sava, 1★

- Estado: ready.
- Imagem gerada: `C:/Users/bruno/.codex/generated_images/01a0f48f-2570-7ae2-a8e1-860525eff9c0/exec-aa79e1dc-752d-44fb-b1b0-e3959b1f254c.png`.
- Destino previsto/aprovado: `public/assets/animations/v3/36-s1.png` e JSON de mesmo nome.
- Geometria: {"id":36,"stars":1,"status":"ready","image":"/assets/animations/v3/36-s1.png","width":1254,"height":1254,"bodyHeight":357,"maxBorder":1}.

Prompt desta entrega:

```text
Use case: stylized-concept. Asset: Wolf Totem character 36, Sava, "Tigresa Dourada", STAR 1.
Create a NEW coherent character design from this canonical brief. Traits: Presas, Espreitador. STAR-1 APPEARANCE, in the author's Portuguese: guerreira musculosa com duas manoplas e linhas douradas pintadas no corpo. Ability: Frenesi Dourado: transforma-se, ganhando sustain e ataques em cone.
Strictly use this first-stage appearance. The character is human; animal influences are expressed only through primitive motifs and equipment unless the star-1 brief explicitly says otherwise. Do NOT add later-star mutations, animal heads, extra limbs or external giant spirit avatars.
Polished primitive fantasy painted pixel-art game sprites, warm hand-painted material shading with crisp readable pixel edges, strong silhouettes, expressive faces, detailed leather/leaf/fiber/bone/wood/stone outfits, consistent 3/4 right-facing viewpoint. No modern armor, firearms, machinery or scenery.
Deliver ONE SQUARE transparent PNG spritesheet with EXACTLY TWELVE SMALL MINIATURE FULL-BODY POSES, arranged FOUR columns by THREE rows. All 12 are the SAME character, outfit, age, face, hair, skin, proportions and palette. Large generous empty space between every pose is essential. At 1254-square scale, each entire sprite INCLUDING weapons and effects is only about 150 pixels wide and 180 pixels tall. Never larger than 14% of total canvas width or 16% total canvas height. Do not expand the figures to fill the canvas.
Invisible equal grid: centers x12.5%,37.5%,62.5%,87.5%; feet baselines y27%,60%,93% of total canvas. Each character stays centered within its own slot. Keep all weapons, robes, tails and magic inside the small footprint using compact poses or foreshortening. No pose may touch, overlap or cross into another cell. Complete head, full feet, all held objects visible. SAME scale throughout.
ROW1 idle loop: four breathing poses, planted feet, shoulders gently rise then settle.
ROW2 walk loop in place: clear left step, passing pose, right step, passing pose. Legs alternate, clothing moves, no horizontal translation.
ROW3 attack/cast: draw both gauntlets back, execute a compact fierce claw-like punch toward the right, follow through, recover. Four distinct sequential poses preparation/action/follow-through/recovery. Effects small and close to body, never a separate giant figure.
True RGBA transparency. No background fill, no floor or shadow, no text, labels, borders, grid or UI. All 12 poses at once.
```

### 37 — Nilo, 1★

- Estado: ready.
- Imagem gerada: `C:/Users/bruno/.codex/generated_images/01a0f48f-2570-7ae2-a8e1-860525eff9c0/exec-4da39f60-cd1f-4c6e-82d1-c50cd6bd9f8f.png`.
- Destino previsto/aprovado: `public/assets/animations/v3/37-s1.png` e JSON de mesmo nome.
- Geometria: {"id":37,"stars":1,"status":"ready","image":"/assets/animations/v3/37-s1.png","width":1254,"height":1254,"bodyHeight":311,"maxBorder":1}.

Prompt desta entrega:

```text
Use case: stylized-concept. Asset: Wolf Totem character 37, Nilo, "Quebra-Cupins", STAR 1.
Create a NEW coherent character design from this canonical brief. Traits: Copa, Guardião. STAR-1 APPEARANCE, in the author's Portuguese: guerreiro alto com antebraços enormes e uma arma flexível enrolada na cintura. Ability: Língua de Guerra: atinge inimigos em linha e puxa o primeiro.
Strictly use this first-stage appearance. The character is human; animal influences are expressed only through primitive motifs and equipment unless the star-1 brief explicitly says otherwise. Do NOT add later-star mutations, animal heads, extra limbs or external giant spirit avatars.
Polished primitive fantasy painted pixel-art game sprites, warm hand-painted material shading with crisp readable pixel edges, strong silhouettes, expressive faces, detailed leather/leaf/fiber/bone/wood/stone outfits, consistent 3/4 right-facing viewpoint. No modern armor, firearms, machinery or scenery.
Deliver ONE SQUARE transparent PNG spritesheet with EXACTLY TWELVE SMALL MINIATURE FULL-BODY POSES, arranged FOUR columns by THREE rows. All 12 are the SAME character, outfit, age, face, hair, skin, proportions and palette. Large generous empty space between every pose is essential. At 1254-square scale, each entire sprite INCLUDING weapons and effects is only about 150 pixels wide and 180 pixels tall. Never larger than 14% of total canvas width or 16% total canvas height. Do not expand the figures to fill the canvas.
Invisible equal grid: centers x12.5%,37.5%,62.5%,87.5%; feet baselines y27%,60%,93% of total canvas. Each character stays centered within its own slot. Keep all weapons, robes, tails and magic inside the small footprint using compact poses or foreshortening. No pose may touch, overlap or cross into another cell. Complete head, full feet, all held objects visible. SAME scale throughout.
ROW1 idle loop: four breathing poses, planted feet, shoulders gently rise then settle.
ROW2 walk loop in place: clear left step, passing pose, right step, passing pose. Legs alternate, clothing moves, no horizontal translation.
ROW3 attack/cast: uncoil a short section of the flexible waist weapon, whip it compactly toward the right, pull it back, recover; magical tongue visual only if allowed by this star. Four distinct sequential poses preparation/action/follow-through/recovery. Effects small and close to body, never a separate giant figure.
True RGBA transparency. No background fill, no floor or shadow, no text, labels, borders, grid or UI. All 12 poses at once.
```

### 38 — Yara, 1★

- Estado: needs-visual-correction.
- Imagem gerada: `C:/Users/bruno/.codex/generated_images/01a0f48f-2570-7ae2-a8e1-860525eff9c0/exec-e4d9918f-64b6-4542-80c2-6f988224f654.png`.
- Destino previsto/aprovado: `public/assets/animations/v3/38-s1.png` e JSON de mesmo nome.
- Geometria: {"id":38,"stars":1,"status":"ready","image":"/assets/animations/v3/38-s1.png","width":1254,"height":1254,"bodyHeight":331,"maxBorder":1}.

Prompt desta entrega:

```text
Use case: stylized-concept. Asset: Wolf Totem character 38, Yara, "Voz da Lua Branca", STAR 1.
Create a NEW coherent character design from this canonical brief. Traits: Totêmico, Místico, Espírito da Coruja. STAR-1 APPEARANCE, in the author's Portuguese: sacerdotisa com máscara branca lisa e cajado lunar. Ability: Ritual da Lua: cria escudos e resistência mágica para aliados.
Strictly use this first-stage appearance. The character is human; animal influences are expressed only through primitive motifs and equipment unless the star-1 brief explicitly says otherwise. Do NOT add later-star mutations, animal heads, extra limbs or external giant spirit avatars.
Polished primitive fantasy painted pixel-art game sprites, warm hand-painted material shading with crisp readable pixel edges, strong silhouettes, expressive faces, detailed leather/leaf/fiber/bone/wood/stone outfits, consistent 3/4 right-facing viewpoint. No modern armor, firearms, machinery or scenery.
Deliver ONE SQUARE transparent PNG spritesheet with EXACTLY TWELVE SMALL MINIATURE FULL-BODY POSES, arranged FOUR columns by THREE rows. All 12 are the SAME character, outfit, age, face, hair, skin, proportions and palette. Large generous empty space between every pose is essential. At 1254-square scale, each entire sprite INCLUDING weapons and effects is only about 150 pixels wide and 180 pixels tall. Never larger than 14% of total canvas width or 16% total canvas height. Do not expand the figures to fill the canvas.
Invisible equal grid: centers x12.5%,37.5%,62.5%,87.5%; feet baselines y27%,60%,93% of total canvas. Each character stays centered within its own slot. Keep all weapons, robes, tails and magic inside the small footprint using compact poses or foreshortening. No pose may touch, overlap or cross into another cell. Complete head, full feet, all held objects visible. SAME scale throughout.
ROW1 idle loop: four breathing poses, planted feet, shoulders gently rise then settle.
ROW2 walk loop in place: clear left step, passing pose, right step, passing pose. Legs alternate, clothing moves, no horizontal translation.
ROW3 attack/cast: lift the lunar staff, gather a small white lunar shield glow around the upper body, cast, recover. Four distinct sequential poses preparation/action/follow-through/recovery. Effects small and close to body, never a separate giant figure.
True RGBA transparency. No background fill, no floor or shadow, no text, labels, borders, grid or UI. All 12 poses at once.
```

### 39 — Fenra, 1★

- Estado: ready.
- Imagem gerada: `C:/Users/bruno/.codex/generated_images/01a0f48f-2570-7ae2-a8e1-860525eff9c0/exec-b56f3d35-1558-4c6d-b8f2-25e99dae8e47.png`.
- Destino previsto/aprovado: `public/assets/animations/v3/39-s1.png` e JSON de mesmo nome.
- Geometria: {"id":39,"stars":1,"status":"ready","image":"/assets/animations/v3/39-s1.png","width":1254,"height":1254,"bodyHeight":371,"maxBorder":1}.

Prompt desta entrega:

```text
Use case: stylized-concept. Asset: Wolf Totem character 39, Fenra, "Matriarca da Matilha", STAR 1.
Create a NEW coherent character design from this canonical brief. Traits: Presas, Caçador, Espírito do Lobo. STAR-1 APPEARANCE, in the author's Portuguese: líder veterana de cabelos grisalhos, lança longa e cicatrizes antigas. Ability: A Grande Caçada: marca uma presa e inicia uma caçada coletiva.
Strictly use this first-stage appearance. The character is human; animal influences are expressed only through primitive motifs and equipment unless the star-1 brief explicitly says otherwise. Do NOT add later-star mutations, animal heads, extra limbs or external giant spirit avatars.
Polished primitive fantasy painted pixel-art game sprites, warm hand-painted material shading with crisp readable pixel edges, strong silhouettes, expressive faces, detailed leather/leaf/fiber/bone/wood/stone outfits, consistent 3/4 right-facing viewpoint. No modern armor, firearms, machinery or scenery.
Deliver ONE SQUARE transparent PNG spritesheet with EXACTLY TWELVE SMALL MINIATURE FULL-BODY POSES, arranged FOUR columns by THREE rows. All 12 are the SAME character, outfit, age, face, hair, skin, proportions and palette. Large generous empty space between every pose is essential. At 1254-square scale, each entire sprite INCLUDING weapons and effects is only about 150 pixels wide and 180 pixels tall. Never larger than 14% of total canvas width or 16% total canvas height. Do not expand the figures to fill the canvas.
Invisible equal grid: centers x12.5%,37.5%,62.5%,87.5%; feet baselines y27%,60%,93% of total canvas. Each character stays centered within its own slot. Keep all weapons, robes, tails and magic inside the small footprint using compact poses or foreshortening. No pose may touch, overlap or cross into another cell. Complete head, full feet, all held objects visible. SAME scale throughout.
ROW1 idle loop: four breathing poses, planted feet, shoulders gently rise then settle.
ROW2 walk loop in place: clear left step, passing pose, right step, passing pose. Legs alternate, clothing moves, no horizontal translation.
ROW3 attack/cast: draw spear back, make a compact forward hunting spear jab toward right, signal the pack with the other hand, recover. Four distinct sequential poses preparation/action/follow-through/recovery. Effects small and close to body, never a separate giant figure.
True RGBA transparency. No background fill, no floor or shadow, no text, labels, borders, grid or UI. All 12 poses at once.
```

### 41 — Makara, 1★

- Estado: failed.
- Imagem gerada: `C:/Users/bruno/.codex/generated_images/01a0f48f-2570-7ae2-a8e1-860525eff9c0/exec-8bb7a507-f23a-401a-b471-ea7119ba401c.png`.
- Destino previsto/aprovado: `public/assets/animations/v3/41-s1.png` e JSON de mesmo nome.
- Geometria: {"id":41,"stars":1,"status":"failed","error":"('no transparent corridor', 0, 627.0)"}.

Prompt desta entrega:

```text
Use case: stylized-concept. Asset: Wolf Totem character 41, Makara, "Mandíbula Antiga", STAR 1.
Create a NEW coherent character design from this canonical brief. Traits: Rio, Escamas, Brigão, Espírito do Crocodilo. STAR-1 APPEARANCE, in the author's Portuguese: guerreiro ancestral enorme com arma dentada e pele marcada. Ability: Giro Ancestral: imobiliza brutalmente um inimigo e causa dano percentual.
Strictly use this first-stage appearance. The character is human; animal influences are expressed only through primitive motifs and equipment unless the star-1 brief explicitly says otherwise. Do NOT add later-star mutations, animal heads, extra limbs or external giant spirit avatars.
Polished primitive fantasy painted pixel-art game sprites, warm hand-painted material shading with crisp readable pixel edges, strong silhouettes, expressive faces, detailed leather/leaf/fiber/bone/wood/stone outfits, consistent 3/4 right-facing viewpoint. No modern armor, firearms, machinery or scenery.
Deliver ONE SQUARE transparent PNG spritesheet with EXACTLY TWELVE SMALL MINIATURE FULL-BODY POSES, arranged FOUR columns by THREE rows. All 12 are the SAME character, outfit, age, face, hair, skin, proportions and palette. Large generous empty space between every pose is essential. At 1254-square scale, each entire sprite INCLUDING weapons and effects is only about 150 pixels wide and 180 pixels tall. Never larger than 14% of total canvas width or 16% total canvas height. Do not expand the figures to fill the canvas.
Invisible equal grid: centers x12.5%,37.5%,62.5%,87.5%; feet baselines y27%,60%,93% of total canvas. Each character stays centered within its own slot. Keep all weapons, robes, tails and magic inside the small footprint using compact poses or foreshortening. No pose may touch, overlap or cross into another cell. Complete head, full feet, all held objects visible. SAME scale throughout.
ROW1 idle loop: four breathing poses, planted feet, shoulders gently rise then settle.
ROW2 walk loop in place: clear left step, passing pose, right step, passing pose. Legs alternate, clothing moves, no horizontal translation.
ROW3 attack/cast: brace the toothed weapon, sweep it in a compact clockwise strike toward right, follow through, recover. Four distinct sequential poses preparation/action/follow-through/recovery. Effects small and close to body, never a separate giant figure.
True RGBA transparency. No background fill, no floor or shadow, no text, labels, borders, grid or UI. All 12 poses at once.
```

### 40 — Koru, 1★

- Estado: ready.
- Imagem gerada: `C:/Users/bruno/.codex/generated_images/01a0f48f-2570-7ae2-a8e1-860525eff9c0/exec-f24e8f6e-60a2-4bd1-89fe-57a8141cfaf8.png`.
- Destino previsto/aprovado: `public/assets/animations/v3/40-s1.png` e JSON de mesmo nome.
- Geometria: {"id":40,"stars":1,"status":"ready","image":"/assets/animations/v3/40-s1.png","width":1254,"height":1254,"bodyHeight":313,"maxBorder":1}.

Prompt desta entrega:

```text
Use case: stylized-concept. Asset: Wolf Totem character 40, Koru, "Costas de Prata", STAR 1.
Create a NEW coherent character design from this canonical brief. Traits: Copa, Brigão, Espírito do Gorila. STAR-1 APPEARANCE, in the author's Portuguese: guerreiro gigantesco, cabelos grisalhos e braços desproporcionalmente grandes. Ability: Domínio: cria território onde fica muito mais poderoso.
Strictly use this first-stage appearance. The character is human; animal influences are expressed only through primitive motifs and equipment unless the star-1 brief explicitly says otherwise. Do NOT add later-star mutations, animal heads, extra limbs or external giant spirit avatars.
Polished primitive fantasy painted pixel-art game sprites, warm hand-painted material shading with crisp readable pixel edges, strong silhouettes, expressive faces, detailed leather/leaf/fiber/bone/wood/stone outfits, consistent 3/4 right-facing viewpoint. No modern armor, firearms, machinery or scenery.
Deliver ONE SQUARE transparent PNG spritesheet with EXACTLY TWELVE SMALL MINIATURE FULL-BODY POSES, arranged FOUR columns by THREE rows. All 12 are the SAME character, outfit, age, face, hair, skin, proportions and palette. Large generous empty space between every pose is essential. At 1254-square scale, each entire sprite INCLUDING weapons and effects is only about 150 pixels wide and 180 pixels tall. Never larger than 14% of total canvas width or 16% total canvas height. Do not expand the figures to fill the canvas.
Invisible equal grid: centers x12.5%,37.5%,62.5%,87.5%; feet baselines y27%,60%,93% of total canvas. Each character stays centered within its own slot. Keep all weapons, robes, tails and magic inside the small footprint using compact poses or foreshortening. No pose may touch, overlap or cross into another cell. Complete head, full feet, all held objects visible. SAME scale throughout.
ROW1 idle loop: four breathing poses, planted feet, shoulders gently rise then settle.
ROW2 walk loop in place: clear left step, passing pose, right step, passing pose. Legs alternate, clothing moves, no horizontal translation.
ROW3 attack/cast: raise heavy fists, pound downward in a compact territorial strike, hold the empowered stance, recover. Four distinct sequential poses preparation/action/follow-through/recovery. Effects small and close to body, never a separate giant figure.
True RGBA transparency. No background fill, no floor or shadow, no text, labels, borders, grid or UI. All 12 poses at once.
```

### 42 — Nyala, 1★

- Estado: ready.
- Imagem gerada: `C:/Users/bruno/.codex/generated_images/01a0f48f-2570-7ae2-a8e1-860525eff9c0/exec-a47f26e4-d8c9-4d4b-8153-9571d56ccd82.png`.
- Destino previsto/aprovado: `public/assets/animations/v3/42-s1.png` e JSON de mesmo nome.
- Geometria: {"id":42,"stars":1,"status":"ready","image":"/assets/animations/v3/42-s1.png","width":1254,"height":1254,"bodyHeight":318,"maxBorder":1}.

Prompt desta entrega:

```text
Use case: stylized-concept. Asset: Wolf Totem character 42, Nyala, "Pantera do Eclipse", STAR 1.
Create a NEW coherent character design from this canonical brief. Traits: Noturno, Espreitador, Espírito do Jaguar. STAR-1 APPEARANCE, in the author's Portuguese: assassina completamente vestida em preto, apenas olhos violetas visíveis. Ability: Passo do Eclipse: desaparece e realiza múltiplos golpes entre inimigos.
Strictly use this first-stage appearance. The character is human; animal influences are expressed only through primitive motifs and equipment unless the star-1 brief explicitly says otherwise. Do NOT add later-star mutations, animal heads, extra limbs or external giant spirit avatars.
Polished primitive fantasy painted pixel-art game sprites, warm hand-painted material shading with crisp readable pixel edges, strong silhouettes, expressive faces, detailed leather/leaf/fiber/bone/wood/stone outfits, consistent 3/4 right-facing viewpoint. No modern armor, firearms, machinery or scenery.
Deliver ONE SQUARE transparent PNG spritesheet with EXACTLY TWELVE SMALL MINIATURE FULL-BODY POSES, arranged FOUR columns by THREE rows. All 12 are the SAME character, outfit, age, face, hair, skin, proportions and palette. Large generous empty space between every pose is essential. At 1254-square scale, each entire sprite INCLUDING weapons and effects is only about 150 pixels wide and 180 pixels tall. Never larger than 14% of total canvas width or 16% total canvas height. Do not expand the figures to fill the canvas.
Invisible equal grid: centers x12.5%,37.5%,62.5%,87.5%; feet baselines y27%,60%,93% of total canvas. Each character stays centered within its own slot. Keep all weapons, robes, tails and magic inside the small footprint using compact poses or foreshortening. No pose may touch, overlap or cross into another cell. Complete head, full feet, all held objects visible. SAME scale throughout.
ROW1 idle loop: four breathing poses, planted feet, shoulders gently rise then settle.
ROW2 walk loop in place: clear left step, passing pose, right step, passing pose. Legs alternate, clothing moves, no horizontal translation.
ROW3 attack/cast: crouch with black-clad body still readable, make a compact violet-shadow blink slash toward right, reappear, recover. Four distinct sequential poses preparation/action/follow-through/recovery. Effects small and close to body, never a separate giant figure.
True RGBA transparency. No background fill, no floor or shadow, no text, labels, borders, grid or UI. All 12 poses at once.
```
