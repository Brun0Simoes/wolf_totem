# Os 55 personagens LPC — versão 3.3

Os 55 guardiões têm folhas próprias nas formas 1★, 2★ e 3★: **165 PNGs e 165 manifestos**, em `public/assets/animations/lpc`. A galeria publicada fica em [`characters.html`](../../public/characters.html); também pode ser aberta em **Configurações → Galeria dos 55 guardiões**. O códice do jogo permite selecionar a estrela, o movimento e virar cada personagem.

## Arte e movimentos

- Cada personagem tem um perfil de corpo, pele, cabelo, roupa, arma e espírito em [`scripts/lpc-profiles.json`](../../scripts/lpc-profiles.json).
- As formas 2★ recebem contas, braçadeiras e marcas rituais. As formas 3★ acrescentam cabeças animais, máscaras, galhadas, asas, caudas, carapaças ou membros espirituais conforme o tema.
- Há sete sequências por direção: repouso, caminhada, ataque, conjuração, impacto, queda e celebração. Caminhada e combate têm poses próprias de membros, e o ataque acompanha a arma: corte, estocada ou disparo.
- São **4.620 sequências direcionais e 26.568 quadros armazenados**. Essas contagens incluem repetições intencionais de repouso, impacto/queda nas quatro direções e os braços erguidos compartilhados entre celebração e conjuração. Não são 26.568 desenhos originais distintos.
- O LPC fornece queda em uma orientação. Ela é usada nas quatro direções; o impacto utiliza os dois primeiros quadros dessa sequência. Celebração utiliza os braços erguidos da conjuração.
- As evoluções são adaptações estilizadas em corpos LPC humanoides. Os efeitos espirituais e de metamorfose existentes continuam no combate. Esta entrega não inclui novos esqueletos quadrúpedes para as transformações descritas no catálogo.
- Armas de 128/192 pixels são compostas no mesmo centro do corpo de 64 pixels, sem reduzir a arma separadamente. O atlas guarda recortes e pontos de apoio por quadro.
- A simulação permanece independente da animação. Direção, escolha de quadro, filtros de pixel art e efeitos pertencem à apresentação.

As ilustrações de `chars` e os atlas pintados `v2`/`v3` continuam disponíveis e são usados nos retratos. As cinco invocações também preservam seus atlas anteriores.

## Fontes e créditos

Fonte: [Universal LPC Spritesheet Character Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator), revisão **58ce1aa479e4df32845a73a5d0afc221c3a893c2**.

Foram utilizados **587 arquivos de origem**, com créditos por peça. [`public/credits/lpc-credits.html`](../../public/credits/lpc-credits.html), CSV e JSON contêm os arquivos exatos, autores, referências e a licença escolhida entre as alternativas da origem. Variantes de paleta herdam os créditos do arquivo original; quando necessário, o gerador consulta os créditos da definição da peça. As folhas adaptadas são distribuídas sob **CC BY-SA 4.0**, com as alterações descritas em `lpc-license.txt`. Os créditos são acessíveis nas configurações e na galeria publicada.

## Reproduzir os assets

Requer Git, Python, Pillow e NumPy. O checkout LPC é uma fonte de imagens e metadados; seus scripts não são executados.

```powershell
rtk proxy git clone --filter=blob:none --sparse https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator.git artifacts/lpc/upstream
rtk proxy git -C artifacts/lpc/upstream checkout 58ce1aa479e4df32845a73a5d0afc221c3a893c2
rtk proxy git -C artifacts/lpc/upstream sparse-checkout set sheet_definitions palette_definitions sources
rtk proxy python -m pip install -r scripts/requirements-lpc.txt
rtk proxy python scripts/generate-lpc.py --fetch
rtk proxy python scripts/generate-lpc.py --check
rtk proxy npm run roster:status -- --write --complete
```

`--fetch` baixa somente as peças selecionadas. `--ids 1,3,8` permite iterar em um lote; execute novamente sem `--ids` para renovar o relatório completo. O gerador valida cores, compatibilidade dos movimentos, transparência, margens, pivôs, ausência de quadros vazios e identidade das 165 folhas. Não substitui ataques ausentes por repouso.

As cinco folhas de revisão por era e os perfis com os hashes das imagens estão em [`lpc`](lpc). A galeria carrega folhas à medida que entram na tela. O combate carrega e descarta texturas sob demanda; os PNGs das 165 formas totalizam aproximadamente **15,7 MB**, sem serem carregados todos no início.

## Validação

- `npm test`: **523 testes em 18 arquivos passaram**, com cobertura de todas as formas, direções, sequências, recortes, pivôs, PNGs, créditos e reprodução no renderizador.
- `npm run build`: TypeScript e pacote de produção; metadados compactados em um módulo separado.
- `python scripts/generate-lpc.py --check`: valida pixels, quadros e cobertura completa.
- As **165 formas carregaram na galeria do navegador sem falhas**, incluindo todas as eras em 1★, 2★ e 3★. Sete movimentos e quatro direções foram exercitados pelos controles.
- Combate completo no desktop, prévia ampliada no códice e layout de combate/galeria a **390 × 700**, sem transbordamento horizontal ou erros no console.
