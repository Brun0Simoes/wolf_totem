# Verificação

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
