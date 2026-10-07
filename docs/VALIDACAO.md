# Verificação

## Produção visual completa — 7 de outubro de 2026

- `npm test`: **242 testes passaram em oito arquivos**. A cobertura exige os 55 IDs nas três estrelas e as cinco criaturas invocadas; verifica registro, PNGs, dimensões, retratos, 12 quadros, âncoras e clipes de cada folha.
- `npm run build`: TypeScript e Vite concluíram sem erros.
- `npm run roster:status -- --write --complete`: **165/165 formas, 55/55 personagens completos, 5/5 criaturas**, sem pendências.
- No códice: Sesha 3★ em caminhada e ataque, espelhamento, pausa e retomada; Akh'ra 3★ em habilidade; Karkun 3★ em caminhada. A prévia de Karkun foi conferida em viewport de 390 × 844; as demais, em 1280 × 900.
- Na galeria de produção: Nilo 3★ com o tamanduá espiritual e as cinco criaturas em movimento, com transparência e âncoras no chão. Caminhada, ataque e espelhamento conferidos.
- Na arena: formação de invocadores importada pela interface em `localhost`, separada da jornada em `127.0.0.1`. Os atlas PNG de aranha, escaravelho, elefante e corvo foram carregados durante a luta em Mãe das mil teias. O lobo foi conferido na galeria.
- Console das abas de QA sem erros. A captura de tela registra o campo com invocações; a galeria permite revisar cada folha individualmente.

Evidências: [Karkun no celular](production/qa-2026-10-07-karkun-mobile.jpg), [galeria](production/qa-2026-10-07-gallery.jpg), [campo](production/qa-2026-10-07-summons-battle.jpg). Procedimento e proveniência no [relatório do lote](production/visual-2026-10-07.md).

As animações continuam com quatro poses por ciclo. Ataque e habilidade compartilham desenhos; impacto, queda e vitória usam movimento programado. A geometria de todas as folhas foi validada, mas a revisão no navegador foi por amostragem. Fluidez, transições e fidelidade fina às descrições de evolução ainda podem ser refinadas artisticamente.

## Histórico: versão 0.3 — expansão do elenco e prévia

- `npm test`: 112 testes passaram, incluindo 54 atlas e o registro por personagem/estrela.
- `npm run build`: TypeScript e Vite concluíram sem erros.
- Prévia de Jara testada no códice: caminhada, ataque, espelhamento e pausa. Akru 3★ também foi carregado e observado em movimento. Nima 3★ conferida com sua silhueta espiritual; Jara 3★ conferida em tela de 390 × 844.
- Formas evoluídas conferidas no campo com uma jornada de teste em origem separada; o save da prévia principal foi preservado.
- Registro novo carrega folhas por personagem e estrela; imagens da cena são carregadas sob demanda. Os testes conferem resolução do registro, recortes, âncoras, dimensões, retrato e clipes.
- Os arquivos de arte foram revisados pelos lotes de produção. O total é 54 formas para 45 personagens; quatro personagens têm as três formas. As novas folhas 1★ de Vahara, Zyri, Orun, Sakar, Aruun, Boro, Uruq, Akh'ra, Mahari, Veyra, Ssar'ka, N'Goro e Karkun foram medidas e integradas; 111 formas continuam pendentes.
- Impacto, queda e vitória usam movimento programado; ataque e habilidade compartilham poses. O trabalho entregue é de protótipo: ainda há refinamentos artísticos e de transição a fazer.

Detalhes por lote e prompts completos em `docs/production/`.

## Versão 0.2 — animações

- `npm test`: 29 testes passaram em três arquivos.
- `npm run build`: TypeScript e Vite concluíram sem erros com os 13 atlas integrados.
- Os testes novos cobrem transições de ataque, morte, pausa, reação a dano e movimento reduzido. Também verificam os 13 IDs numéricos, 156 recortes e âncoras, dimensões PNG e cobertura dos clipes.
- Repouso, caminhada, golpes e projéteis observados na arena, com Akru, Boru, Ena e adversários. Duas expedições concluídas pela interface.
- Heróis circulando e trabalhando na aldeia; pausa e retomada conferidas.
- Revisão visual dos 13 PNGs e das margens registrada nos três documentos de produção.
- Corrigidos o deslocamento da âncora ao espelhar e a reprodução de eventos antigos ao voltar à batalha.
- Os testes de atlas verificam integridade geométrica; a fluidez artística de cada ciclo ainda precisa de refinamento em sessões de jogo.

## Registro da versão 0.1

## Regras e compilação

- `npm test`: dez testes passaram.
- `npm run build`: TypeScript e Vite concluíram sem erros.
- Dependências instaladas com lockfile; `npm audit` retornou zero vulnerabilidades depois da atualização do Vitest.

Os testes cobrem produção e pausa, custos, fusão com preservação da formação, troca de casas, contagem de características por herói distinto, teto de produção offline, saves malformados, vitória com recompensa única, derrota e nova tentativa. Exercitam também as 13 habilidades com valores finitos e uma formação evoluída concluindo a última expedição.

## Navegador

- Coleta manual, melhoria de construção, evolução da aldeia e recrutamento executados pela interface.
- Primeiras expedições vencidas no navegador; recompensa e fechamento do resultado confirmados.
- Códice mostra 55 fichas; filtro de custo 5 retorna sete heróis e abre os detalhes por clique e teclado.
- Interface inspecionada em desktop e em viewport de 390 × 844.
- Posicionamento por casa e pelo seletor numérico confirmado; Nima foi movida para a posição 12.
- Pausa persistiu ao abrir novamente o jogo.
- Importação de `tests/fixtures/journey.json` restaurou a aldeia, a pausa e os estágios dos heróis, confirmando que o save anterior não sobrescreve o importado.
- Artes de Akru com três estrelas e Boru com duas estrelas conferidas no tabuleiro.
- Sequência de ataque de Akru de uma estrela observada na primeira batalha.
- Console da aba de verificação sem erros ou avisos após as correções.

## Correções encontradas no teste

- Impedir que cliques em painéis sobrepostos atinjam o canvas e modifiquem a formação.
- Evitar reconstrução contínua dos ícones, que podia interromper cliques no códice.
- Manter preços e quantidades apresentados na interface iguais aos valores da simulação.
- Aumentar o espaço do painel lateral e manter os botões dentro da sua área.
- Carregar as artes evoluídas sob demanda no campo, em vez de ampliar apenas a ilustração de uma estrela.
- Preservar o save importado durante o recarregamento.

## Limites da verificação

O equilíbrio foi verificado como protótipo e ainda precisa de sessões reais de jogo. O teste de celular usa emulação de tamanho, não um aparelho físico. A exportação gera um arquivo JSON no código; a confirmação automatizada de download ficou inconclusiva nesta sessão. O fluxo de importação e a serialização foram verificados.
