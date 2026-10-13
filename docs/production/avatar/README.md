# Quatro Nações — produção 5.3

63 personagens de Aang e Korra, IDs 201–263. Cada identidade recebeu uma folha original com três colunas de evolução e seis poses por forma, gerada pela ferramenta de imagens integrada. Foram 63 gerações principais e uma correção da conjuração de Korra. São **189 atlas, 189 retratos e 1.134 poses desenhadas**.

## Proveniência e empacotamento

- `generations.json`: prompts, referências de origem e correções por personagem.
- `roster.json` e `designs.json`: identidade, atributos, habilidade, traços, método de evolução e descrição visual de cada estrela.
- `packaging.json`: SHA-256 das fontes, dimensões e divisão das poses.
- `scripts/package-night-evolution.mjs --collection=avatar`: isola os pixels gerados, normaliza escala e pés por estrela e exporta seis quadros de 320 × 320, com transparência. O empacotador não redesenha os personagens.

Korra recebeu uma fonte complementar de conjuração com três poses inteiras; a proporção dessa fonte é normalizada antes do recorte final. Raava usa limiar de opacidade 200 para conectar suas asas translúcidas à silhueta sem perder extremidades. As fontes de produção ficam em `artifacts/avatar-evolution/sources`, fora do bundle. Os atlas anteriores dos 55 primais e 63 sobrenaturais foram preservados.

## Movimento

Cada estrela tem repouso, dois contatos de caminhada, preparação, ataque e conjuração. Ataque e habilidade usam poses independentes. O renderizador acrescenta respiração, recuperação, impacto, queda e vitória por movimento programado. Essas poses não equivalem a longas sequências desenhadas quadro a quadro.

## Integração e validação

- 181 personagens no jogo; cobertura completa de **543/543 formas**.
- 24 arquivos de testes, **671 testes aprovados**, incluindo todos os 63 personagens em três estrelas, habilidades, atributos finitos, nove laços, sete treinos, draft, save e bloqueio até o segundo reset.
- Revalidação final dos assets: **63 testes aprovados** após corrigir Raava.
- `npm run build`: TypeScript e bundle de produção aprovados.
- Importação normal no navegador: save v13 com os 63 personagens carregado e 28 posições válidas.
- Treino no navegador: Aang nível 24 e rito 8 concluiu Convergência dos Elementos com auxílio. O custo foi descontado (20.000 → 19.880 âmbar), 900 XP ritual foram aplicados e a forma passou de 2★ para 3★.
- Sokka apresenta exclusivamente Caminho do Guerreiro. Avatares apresentam os quatro elementos, equilíbrio espiritual e convergência.
- Códice: filtros acessíveis, busca e coleção preservados ao voltar da ficha, comparação das três formas e prévias de habilidade. Korra tem pés completos na conjuração; Raava mantém asas e cauda.
- Combate no navegador: a formação de 28 personagens 3★ treinados venceu o Primeiro Inverno no segundo renascimento, abriu campanha 30/30 e recebeu 257 âmbar. O resumo exibiu dano individual dos 28 integrantes. Sem erros de console.
- Tela de 390 × 844: filtros em duas colunas e prévia dentro da largura disponível, sem transbordamento horizontal. A captura do navegador nessa resolução apresentou limitação; as dimensões foram verificadas pelo DOM.

Capturas e saves de QA ficam em `artifacts/avatar-evolution`. O playtest usa `127.0.0.1:5190`, separado do endereço habitual do usuário. Regras e elenco completos: [Quatro Nações](../../expansions/quatro-nacoes.md).
