# Evolução sobrenatural — 5.2

## Entrega

Os 53 personagens anteriores receberam designs próprios para 1★, 2★ e 3★. Entraram dez vampiros: Lestat, Akasha, Louis, Claudia, Armand, Marius, Maharet, Jesse, Santiago e Madeleine. O jogo contém 118 identidades; o conjunto sobrenatural contém 63.

Cada forma tem seis poses desenhadas: repouso, dois contatos de caminhada, preparação, golpe e conjuração. São 189 atlas e 1.134 poses. Respiração, recuperação, impacto, queda e vitória usam movimento programado. Os atlas dos 55 primais foram preservados.

O códice compara as três formas e permite experimentar movimentos e espelhamento. Crônicas do Sangue tem marcos 2/4/6/8. Réquiem da Noite e Selo do Primeiro Sangue são cerimônias fictícias adaptadas ao jogo; habilidades, atributos e ritos completos estão em [O Véu da Noite](../../expansions/veu-da-noite.md).

## Origem e empacotamento

- `generations.json` registra os prompts, arquivos gerados e reparos. `packaging.json` registra recortes, hashes e fontes alternativas de poses.
- As folhas originais ficam em `artifacts/night-evolution/sources`, fora do bundle. Os PNGs e manifests de runtime ficam em `public/assets/animations/night`.
- `scripts/package-night-evolution.mjs` recorta os pixels aprovados, separa vizinhos pela transparência e usa uma escala comum por forma. Na versão 5.3.1, o pós-processamento [escala e posicionamento](../sprite-layout/README.md) calibra os pontos de apoio reais de cada pose, os tamanhos na arena e o enquadramento dos retratos. Execute a normalização depois de empacotar novas folhas.
- Folhas com corpos ausentes, linhas unidas ou poses incompletas são rejeitadas. As folhas 102, 105, 111, 112 e 121 foram refeitas durante a revisão. Louis conserva o golpe da folha original e usa a conjuração completa da folha reparada.
- Ataque e conjuração usam quadros diferentes. Os seis quadros não constituem sequências extensas de animação desenhada; os movimentos do renderer fazem parte da apresentação.

## Validação — 13/10/2026

- `npm test`: 22 arquivos, **534 testes aprovados**. Cobrem todas as 63 identidades em três estrelas, combate finito, ritos, bloqueio antes do primeiro reset, draft sem duplicatas e persistência.
- `npm run build`: TypeScript e produção aprovados.
- `npm run roster:status -- --write --complete`: **354/354 formas**, sem personagens ou invocações pendentes.
- Importação pelo navegador: save v12 com 63 sobrenaturais carregado. O limite antigo de 108 foi corrigido; o teste de persistência preserva todos os 118 personagens.
- Lestat e Akasha: comparação das três estrelas e prévia de habilidade conferidas no navegador. Em 390 × 844, as três imagens carregam e a comparação cabe no modal.
- Réquiem: interação por Espaço, progressão dos oito gestos e confirmação; 52 âmbar cobrados e 320 XP ritual concedidos. Primeiro Sangue: modo assistido, 88 âmbar cobrados e 600 XP concedidos. O custo aumenta nas participações seguintes conforme a regra existente.
- Combate no navegador: os dez vampiros 3★, nível 24, enfrentaram o Primeiro Inverno, com efeitos e resumo individual de dano. A equipe perdeu para o encontro final; não houve erros de console. Uma formação completa e treinada também vence esse encontro nos testes de simulação.

Capturas e saves de QA ficam em `artifacts/night-evolution`. O endereço `localhost:5180` foi usado para testar a importação sem substituir a jornada no endereço de desenvolvimento habitual.
