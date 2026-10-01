# Produção de personagens 14–34

Data: 30 de setembro de 2026. Ferramenta: imagegen integrada.

## Resultado

Foram entregues 10 folhas RGBA, 120 quadros e 30 clipes: Jara nas três estrelas, mais Grom, Ilya, Nask, Rava, Tembu, Zakka e Omi em uma estrela. PNGs e JSONs estão em public/assets/animations/v3/.

A responsabilidade por Duma até Thari (IDs 28–34) foi transferida ao agente principal antes de qualquer geração desses IDs neste lote. O escopo restante deste lote é 14–27: 10 das 42 variantes entregues, 32 pendentes.

## Bloqueio confirmado

A ferramenta retornou HTTP 429, usage_limit_reached, plano plus. Reinício informado: 1 de outubro de 2026, às 14:42:20, horário de São Paulo (resets_at=1790876540). As chamadas já iniciadas foram recolhidas; nenhuma nova chamada ou API alternativa foi usada após o bloqueio. Grom 2/3 estrelas e IDs22–27 não retornaram imagens utilizáveis neste lote.

## Status por personagem

| ID | Personagem | 1 estrela | 2 estrelas | 3 estrelas |
| --- | --- | --- | --- | --- |
| 14 | Jara | entregue | entregue | entregue |
| 15 | Grom | entregue | pendente: limite | pendente: limite |
| 16 | Ilya | entregue | pendente: limite | pendente: limite |
| 17 | Nask | entregue | pendente: limite | pendente: limite |
| 18 | Rava | entregue | pendente: limite | pendente: limite |
| 19 | Tembu | entregue | pendente: limite | pendente: limite |
| 20 | Zakka | entregue | pendente: limite | pendente: limite |
| 21 | Omi | entregue | pendente: limite | pendente: limite |
| 22 | Suri | pendente: limite | pendente: limite | pendente: limite |
| 23 | Kesh | pendente: limite | pendente: limite | pendente: limite |
| 24 | Brak | pendente: limite | pendente: limite | pendente: limite |
| 25 | Sena | pendente: limite | pendente: limite | pendente: limite |
| 26 | Uru | pendente: limite | pendente: limite | pendente: limite |
| 27 | Amaru | pendente: limite | pendente: limite | pendente: limite |
| 28 | Duma | agente principal | agente principal | agente principal |
| 29 | Roko | agente principal | agente principal | agente principal |
| 30 | Khepri | agente principal | agente principal | agente principal |
| 31 | Vesh | agente principal | agente principal | agente principal |
| 32 | Toru | agente principal | agente principal | agente principal |
| 33 | Asha | agente principal | agente principal | agente principal |
| 34 | Thari | agente principal | agente principal | agente principal |

## Fontes, método e validação

- Desenho canônico: src/data/characters.ts e docs/plano-original.txt. Kiko-1star.png foi referência de estilo para personagens novos. As evoluções de Jara usaram sua própria folha de uma estrela como referência de identidade.
- Ilya, Nask, Rava, Tembu e Zakka precisaram de uma edição de layout para afastar figuras e armas das bordas. As imagens finais foram copiadas sem editar pixels.
- Cada folha foi inspecionada visualmente: quatro poses de repouso, quatro de caminhada e quatro de ataque/conjuração, direção predominante para a direita.
- Os JSONs contêm 12 frameRects, 12 frameAnchors, imageWidth, imageHeight, portrait absoluto e os três clipes. Recortes seguem corredores transparentes, podendo variar por linha.
- measure-atlas-b.py usa Pillow e NumPy somente para medir pixels. Cortes preferem corredores com cinco pixels vazios (alfa > 8), aceitando três quando necessário. Limites visíveis e retratos usam alfa > 32.
- Foram conferidos os limites e as âncoras dos 120 quadros, a transparência nas bordas dos recortes e hashes SHA-256 idênticos entre originais gerados e PNGs copiados.
- A apresentação no jogo e os testes de renderização são responsabilidade da integração principal.

## Observação artística

Jara 3 estrelas apresenta postura mais baixa, olhos luminosos e garras/aura. As características de mandíbula e membros de puma ficaram sutis; convém reforçá-las numa próxima revisão canônica. A folha tem 12 poses completas e foi integrada como versão inicial.

## Arquivos para retomada

- characters-14-27-delivered.json: dez resultados aprovados e caminhos exatos das imagens originais.
- characters-14-27-pending.json: 32 variantes pendentes, referências planejadas e prompts completos. As folhas de uma estrela ausentes precisam ser geradas e inspecionadas antes das evoluções.
- characters-14-34.jobs.json: prompts completos e proveniência do primeiro lote, correções e evoluções de Jara/Grom.
- batch-b-03.json: prompts completos do lote Omi até Amaru; apenas Omi foi entregue.
- measure-atlas-b.py: medição de recortes e âncoras. Executar com um JSON contendo lista de objetos {id,name,stars,path}.

Validação final: 14-s1, 15-s1, 16-s1, 17-s1, 18-s1, 19-s1, 20-s1, 14-s2, 21-s1, 14-s3.
