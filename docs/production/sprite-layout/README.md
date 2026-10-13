# Escala e posicionamento das expansões — 5.3.1

126 personagens, 378 formas de 1★ a 3★ e 2.268 poses desenhadas. A correção usa os atlas já aprovados e acrescenta geometria de apresentação aos manifests.

## Problema e correção

O empacotamento centralizava cada pose pelo retângulo completo dos pixels visíveis. Capas, armas e efeitos deslocavam o corpo entre os quadros. Além disso, a arena dimensionava animais largos pela altura de um humano.

- `frameBounds` registra o retângulo opaco de cada pose, sem a margem transparente do quadro de 320 × 320.
- `frameAnchors` registra o ponto de apoio de cada pose. O cálculo pondera duas faixas próximas ao chão; `overrides.json` contém correções revisadas para 24 personagens, aplicadas às três estrelas. Espíritos flutuantes conservam uma referência de altura acima do chão.
- `arenaHeight` e `arenaWidth` dão proporções próprias a crianças, animais, criaturas e espíritos. A escala é única por forma: a silhueta em repouso cabe na largura indicada, e poses com armas ou efeitos podem ocupar até 1,5 vez essa largura. Agachamentos e saltos mantêm suas proporções.
- Retratos são reenquadrados a partir da pose em repouso, com apoio comum e espaço para a silhueta inteira.
- A prévia calcula o espaço ocupado pelas seis poses nos dois sentidos. O canvas cabe no painel e a coluna fica visível durante a rolagem da descrição em telas largas.
- A seleção e o arraste usam a região do corpo. As casas ficam abaixo dos sprites na ordem de seleção, para permitir pegar o personagem pelo corpo e escolher terreno livre.

Os PNGs dos atlas, as regras de combate e o formato de save v13 permanecem iguais. O script altera apenas manifests e retratos das duas expansões; os arquivos dos 55 primais e das invocações permanecem iguais.

## Reproduzir

Depois de empacotar novas folhas das expansões, execute:

```powershell
node scripts/normalize-expansion-layout.mjs
npm test
npm run build
```

O script requer `sharp`, disponível no ambiente de produção de arte. Pode ser instalado como ferramenta local com `npm install --no-save --package-lock=false sharp`. Ele lê os atlas publicados, conserva seus pixels e recria os retratos; não precisa das fontes de geração. `layout.json` registra limites, pontos de apoio e tamanhos de todas as formas. Os testes exigem `layoutVersion: 1`, evitando publicar um novo empacotamento sem a normalização.

## Validação

- 25 arquivos e **799 testes aprovados**. As 378 formas são verificadas com o movimento real de repouso, caminhada, preparação, ataque e habilidade nos dois sentidos.
- TypeScript e bundle de produção aprovados.
- Revisão visual das seis poses de todos os 126 personagens em 3★ e revisão adicional das formas e espécies com maior deslocamento.
- Navegador: formação mista com 28 integrantes, incluindo vampiros, dobradores, crianças, companheiros e espíritos. Lestat e Appa conferidos em movimento, ataque, habilidade e espelhamento.
- Seleção pelo corpo de Appa e arraste para a posição de Naga confirmados no tabuleiro, com troca das duas posições.
- Em 390 × 844, a prévia cabe na largura e altura do painel. A captura do navegador nessa resolução apresenta uma limitação de escala; as dimensões também foram conferidas pelo DOM.

Capturas, auditoria e saves de QA ficam em `artifacts/sprite-alignment`, fora do bundle e do Git.
