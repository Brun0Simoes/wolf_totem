# Produção de Duma a Thari

Pedido: criar e animar os personagens restantes, preservando as três descrições de evolução do plano original.

## Entregas aprovadas

| ID | Nome | Forma | Arquivos |
| --- | --- | --- | --- |
| 28 | Duma | 1★ | `public/assets/animations/v3/28-s1.png` e `.json` |
| 29 | Roko | 1★ | `public/assets/animations/v3/29-s1.png` e `.json` |
| 30 | Khepri | 1★ | `public/assets/animations/v3/30-s1.png` e `.json` |

Cada folha contém quatro poses de repouso, quatro de caminhada e quatro de ataque/conjuração. Os resultados foram inspecionados visualmente. Duma usa bastão e adornos claros nos ombros; Roko mantém cabelo avermelhado, braços longos e cajado; Khepri usa placas solares arredondadas e manifesta escaravelhos.

Ferramenta: geração integrada de imagens. Boru e Muru foram usados como referências de estilo; as identidades vieram das descrições em `src/data/characters.ts`. Os prompts exatos e os caminhos das saídas estão em [characters-28-34.jobs.json](characters-28-34.jobs.json).

Os PNGs foram copiados sem alteração de pixels. A medição leu a transparência para separar as 12 poses em regiões próprias, encontrar os pés e identificar o retrato. Os recortes não precisam ter larguras ou alturas iguais. A escala corporal permanece fixa por folha. Todas as regiões passaram na leitura de margens e nos testes de integridade do projeto.

## Pendências e interrupção

As formas 2★/3★ de Duma, Roko e Khepri permanecem pendentes. Vesh, Toru, Asha e Thari não tiveram saídas retornadas. A ferramenta encerrou o lote com `HTTP 429 usage_limit_reached` antes desses resultados. Nenhuma folha foi inventada ou duplicada para preencher a ausência.

Os [18 prompts pendentes](characters-28-34-pending.json) estão preparados. Cada evolução deve usar a folha 1★ aprovada como referência de identidade; os novos personagens sem base devem ser criados e inspecionados primeiro.

O serviço informou liberação em **1 de outubro de 2026, às 14h42, no horário de Brasília** (`resets_at=1790876540`). Esse é o horário informado no erro, sujeito ao serviço. As tarefas podem ser retomadas usando o mesmo catálogo e os prompts preservados. Nenhuma API paga alternativa foi acionada.
