# Animation batch A

Generated with the built-in ImageGen tool on 2026-09-30. The original 1-star character art was inspected before editing. The source files in chars remain unchanged.

## Delivered

Four characters, three clips each, four frames per clip: idle, walk and attack. Akru uses a spear thrust, Nima a silk cast, Boru a club smash, and Sesha a paired-dagger thrust. Art identity, clothing, palette and weapons follow their original 1-star reference.

Each accepted image was copied byte-for-byte into public/assets/animations/v2. No pixel edits, resampling, compositing or transparency repair were performed. JSON supplies individual rectangles and local foot anchors, so the renderer can align different frame positions while preserving the generated pixels.

## Inspection and limitations

The first generation had insufficient spacing around weapons and was rejected. One correction was generated per character, reducing every pose and widening transparent gutters. All 12 corrected poses were visually inspected for each character. The accepted poses are isolated and complete. Boru's idle changes are subtle; his walk and smash cycles have visible changes in limbs and weapon position.

Akru and Nima outputs are 1448 × 1086 pixels. Their row boundaries are 0, 400, 740 and 1086; dividing by three equally would clip Nima's first row. Boru and Sesha are 1254 × 1254 pixels, with rounded column boundaries. Sesha's third attack frame extends beyond the nominal third column, so its custom rectangle ends at x = 970 and the fourth begins there. This preserves the entire dagger without touching the fourth character.

Geometry measurements use alpha > 32 because the generator left nearly invisible alpha noise outside the silhouettes. This threshold was used only for measurement; the source alpha channel was not edited. bodyHeight is the measured visible height of idle frame zero. Foot anchors use the lower visible foot region, with manual anatomical corrections where Nima's hanging silk or Boru's club would bias the bounding box.

Engine inspection remains the responsibility of the integrating agent; these files contain the visual assets and source geometry only.

## Exact prompt provenance

### akru

Input: chars/Akru-1star.png.
Accepted original: C:/Users/bruno/.codex/generated_images/01a0f500-4bc1-7180-9f95-e59e822aff7b/exec-c02a247f-7ef0-4751-8ae9-234fff837774.png.
Workspace: public/assets/animations/v2/akru.png and akru.json.

Initial prompt:

```text
Use case: identity-preserve. Asset type: production pixel-art game animation spritesheet. Edit the attached character into ONE transparent animation sheet. Exact layout: FOUR COLUMNS and THREE ROWS, exactly 12 full-body frames, evenly spaced equal rectangular cells on a square 1536 by1536 transparent canvas. Each cell384 by512. Each body center at50percent cellwidth, planted feet at85percent cellheight. Consistent identical body scale ALL12frames. Keep generous invisible margins so all weapons, hair and hands remain entirely inside their own cells. No overlapping neighboring frames. All frames face right in same three-quarter camera. Preserve character identity, skin, face, hair, outfit, jewelry, exact weapon design and original crisp detailed pixel clusters from reference. No redesign, no transformation. Row1 frames0-3: four distinct gentle idle breathing poses with subtle cloth movement; frame0 neutral. Row2frames4-7: complete walk cycle with clearly changing alternating legs and arms. Row3frames8-11: anticipation, swing/thrust/cast, contact/release, recovery. Frames in left-to-right order within each row. Use genuinely transparent background. No text, labels, guides, gridlines, scenery, shadows on floor, duplicate ghosts, afterimages. Every frame is a single clean isolated full-body character.
Akru is the gray-haired primitive spear hunter from reference, white facial/body paint, bone necklace, gray hide sash, dark gray and red loincloth, bare feet with wraps. Row3 attack is spear thrust toward right, windup then forward horizontal spear lunge then recovery. Spear must stay within cell boundaries.
```

Correction prompt, applied to the first result plus original character reference:

```text
Use case: identity-preserve. Image 1 is the edit target animation sheet. Image 2 is the original character identity reference. Correct ONLY frame separation and sizing in Image 1. Keep the same exact character and same twelve poses with same facing direction. It is a game texture sliced into 4 columns and 3 rows: every whole body and weapon must fit inside its own equal cell. Existing bodies and weapons extend into neighbors, which breaks the game. Redraw ALL TWELVE characters much smaller, exactly half their current height and width, retaining their detailed pixel art and identical scale across all twelve frames. Center each miniature character in its own cell, feet at 75 percent of local cell height. Leave VERY WIDE EMPTY transparent gutters: the entire silhouette INCLUDING extended spear, dagger, silk or club must fit within middle 70 percent cell width and middle 70 percent cell height. Huge transparent spacing between every isolated sprite is ESSENTIAL; this is a technical spritesheet, no poster. DO NOT fill the available canvas with large figures. Keep correct 4 by 3 arrangement with 12 equally sized rectangular cells. Exact layout rows: idle four, walk four, attack four. Preserve visible head, both feet, complete weapons, clothing and original colors in all cells. Same body size in idle, walk and attack; do not zoom attack frames. Single character per cell, no ghosts, no extra limbs, no text, no lines, no checkerboard, no labels, truly transparent background.
```

### nima

Input: chars/Nima-1star.png.
Accepted original: C:/Users/bruno/.codex/generated_images/01a0f500-4bc1-7180-9f95-e59e822aff7b/exec-df4bb9e2-1510-43be-b51e-33c589d44282.png.
Workspace: public/assets/animations/v2/nima.png and nima.json.

Initial prompt:

```text
Use case: identity-preserve. Asset type: production pixel-art game animation spritesheet. Edit the attached character into ONE transparent animation sheet. Exact layout: FOUR COLUMNS and THREE ROWS, exactly 12 full-body frames, evenly spaced equal rectangular cells on a square 1536 by1536 transparent canvas. Each cell384 by512. Each body center at50percent cellwidth, planted feet at85percent cellheight. Consistent identical body scale ALL12frames. Keep generous invisible margins so all weapons, hair and hands remain entirely inside their own cells. No overlapping neighboring frames. All frames face right in same three-quarter camera. Preserve character identity, skin, face, hair, outfit, jewelry, exact weapon design and original crisp detailed pixel clusters from reference. No redesign, no transformation. Row1 frames0-3: four distinct gentle idle breathing poses with subtle cloth movement; frame0 neutral. Row2frames4-7: complete walk cycle with clearly changing alternating legs and arms. Row3frames8-11: anticipation, swing/thrust/cast, contact/release, recovery. Frames in left-to-right order within each row. Use genuinely transparent background. No text, labels, guides, gridlines, scenery, shadows on floor, duplicate ghosts, afterimages. Every frame is a single clean isolated full-body character.
Nima is the brown braided-haired silk weaver from reference, green eyes, leaf and ivory woven clothing with blue hanging teardrops and blue/cream silk threads held in hands. Row3 attack is weaving and releasing glowing blue silk strands toward right. Animate arms and threads naturally while preserving dress, hair and body shape.
```

Correction prompt, applied to the first result plus original character reference:

```text
Use case: identity-preserve. Image 1 is the edit target animation sheet. Image 2 is the original character identity reference. Correct ONLY frame separation and sizing in Image 1. Keep the same exact character and same twelve poses with same facing direction. It is a game texture sliced into 4 columns and 3 rows: every whole body and weapon must fit inside its own equal cell. Existing bodies and weapons extend into neighbors, which breaks the game. Redraw ALL TWELVE characters much smaller, exactly half their current height and width, retaining their detailed pixel art and identical scale across all twelve frames. Center each miniature character in its own cell, feet at 75 percent of local cell height. Leave VERY WIDE EMPTY transparent gutters: the entire silhouette INCLUDING extended spear, dagger, silk or club must fit within middle 70 percent cell width and middle 70 percent cell height. Huge transparent spacing between every isolated sprite is ESSENTIAL; this is a technical spritesheet, no poster. DO NOT fill the available canvas with large figures. Keep correct 4 by 3 arrangement with 12 equally sized rectangular cells. Exact layout rows: idle four, walk four, attack four. Preserve visible head, both feet, complete weapons, clothing and original colors in all cells. Same body size in idle, walk and attack; do not zoom attack frames. Single character per cell, no ghosts, no extra limbs, no text, no lines, no checkerboard, no labels, truly transparent background.
```

### boru

Input: chars/Boru-1star.png.
Accepted original: C:/Users/bruno/.codex/generated_images/01a0f500-4bc1-7180-9f95-e59e822aff7b/exec-990c8e7a-6911-4d93-bdc2-b7fbc4246ba0.png.
Workspace: public/assets/animations/v2/boru.png and boru.json.

Initial prompt:

```text
Use case: identity-preserve. Asset type: production pixel-art game animation spritesheet. Edit the attached character into ONE transparent animation sheet. Exact layout: FOUR COLUMNS and THREE ROWS, exactly 12 full-body frames, evenly spaced equal rectangular cells on a square 1536 by1536 transparent canvas. Each cell384 by512. Each body center at50percent cellwidth, planted feet at85percent cellheight. Consistent identical body scale ALL12frames. Keep generous invisible margins so all weapons, hair and hands remain entirely inside their own cells. No overlapping neighboring frames. All frames face right in same three-quarter camera. Preserve character identity, skin, face, hair, outfit, jewelry, exact weapon design and original crisp detailed pixel clusters from reference. No redesign, no transformation. Row1 frames0-3: four distinct gentle idle breathing poses with subtle cloth movement; frame0 neutral. Row2frames4-7: complete walk cycle with clearly changing alternating legs and arms. Row3frames8-11: anticipation, swing/thrust/cast, contact/release, recovery. Frames in left-to-right order within each row. Use genuinely transparent background. No text, labels, guides, gridlines, scenery, shadows on floor, duplicate ghosts, afterimages. Every frame is a single clean isolated full-body character.
Boru is the broad bald stocky stone warrior from reference, rocky skin patches, white body paint, bone necklace, leather loincloth and heavy stone-headed club. Row3 attack is raising his stone club and smashing it downward toward right then recovery. Preserve heavy broad body proportions and club design.
```

Correction prompt, applied to the first result plus original character reference:

```text
Use case: identity-preserve. Image 1 is the edit target animation sheet. Image 2 is the original character identity reference. Correct ONLY frame separation and sizing in Image 1. Keep the same exact character and same twelve poses with same facing direction. It is a game texture sliced into 4 columns and 3 rows: every whole body and weapon must fit inside its own equal cell. Existing bodies and weapons extend into neighbors, which breaks the game. Redraw ALL TWELVE characters much smaller, exactly half their current height and width, retaining their detailed pixel art and identical scale across all twelve frames. Center each miniature character in its own cell, feet at 75 percent of local cell height. Leave VERY WIDE EMPTY transparent gutters: the entire silhouette INCLUDING extended spear, dagger, silk or club must fit within middle 70 percent cell width and middle 70 percent cell height. Huge transparent spacing between every isolated sprite is ESSENTIAL; this is a technical spritesheet, no poster. DO NOT fill the available canvas with large figures. Keep correct 4 by 3 arrangement with 12 equally sized rectangular cells. Exact layout rows: idle four, walk four, attack four. Preserve visible head, both feet, complete weapons, clothing and original colors in all cells. Same body size in idle, walk and attack; do not zoom attack frames. Single character per cell, no ghosts, no extra limbs, no text, no lines, no checkerboard, no labels, truly transparent background.
```

### sesha

Input: chars/Sesha-1star.png.
Accepted original: C:/Users/bruno/.codex/generated_images/01a0f500-4bc1-7180-9f95-e59e822aff7b/exec-0d50f567-1138-4366-a560-8cf2ac3b68fe.png.
Workspace: public/assets/animations/v2/sesha.png and sesha.json.

Initial prompt:

```text
Use case: identity-preserve. Asset type: production pixel-art game animation spritesheet. Edit the attached character into ONE transparent animation sheet. Exact layout: FOUR COLUMNS and THREE ROWS, exactly 12 full-body frames, evenly spaced equal rectangular cells on a square 1536 by1536 transparent canvas. Each cell384 by512. Each body center at50percent cellwidth, planted feet at85percent cellheight. Consistent identical body scale ALL12frames. Keep generous invisible margins so all weapons, hair and hands remain entirely inside their own cells. No overlapping neighboring frames. All frames face right in same three-quarter camera. Preserve character identity, skin, face, hair, outfit, jewelry, exact weapon design and original crisp detailed pixel clusters from reference. No redesign, no transformation. Row1 frames0-3: four distinct gentle idle breathing poses with subtle cloth movement; frame0 neutral. Row2frames4-7: complete walk cycle with clearly changing alternating legs and arms. Row3frames8-11: anticipation, swing/thrust/cast, contact/release, recovery. Frames in left-to-right order within each row. Use genuinely transparent background. No text, labels, guides, gridlines, scenery, shadows on floor, duplicate ghosts, afterimages. Every frame is a single clean isolated full-body character.
Sesha is the dark braided-haired dagger huntress from reference, olive-green fitted wraps and skirt, green tattoos, gold jewelry and paired curved green daggers. Row3 attack is a distinctive rightward dagger thrust/slash then recovery. Preserve her two daggers, facial identity and outfit.
```

Correction prompt, applied to the first result plus original character reference:

```text
Use case: identity-preserve. Image 1 is the edit target animation sheet. Image 2 is the original character identity reference. Correct ONLY frame separation and sizing in Image 1. Keep the same exact character and same twelve poses with same facing direction. It is a game texture sliced into 4 columns and 3 rows: every whole body and weapon must fit inside its own equal cell. Existing bodies and weapons extend into neighbors, which breaks the game. Redraw ALL TWELVE characters much smaller, exactly half their current height and width, retaining their detailed pixel art and identical scale across all twelve frames. Center each miniature character in its own cell, feet at 75 percent of local cell height. Leave VERY WIDE EMPTY transparent gutters: the entire silhouette INCLUDING extended spear, dagger, silk or club must fit within middle 70 percent cell width and middle 70 percent cell height. Huge transparent spacing between every isolated sprite is ESSENTIAL; this is a technical spritesheet, no poster. DO NOT fill the available canvas with large figures. Keep correct 4 by 3 arrangement with 12 equally sized rectangular cells. Exact layout rows: idle four, walk four, attack four. Preserve visible head, both feet, complete weapons, clothing and original colors in all cells. Same body size in idle, walk and attack; do not zoom attack frames. Single character per cell, no ghosts, no extra limbs, no text, no lines, no checkerboard, no labels, truly transparent background.
```

