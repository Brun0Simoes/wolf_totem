# Wolf Totem — catálogo de personagens

## Fonte e fidelidade

O texto recebido está preservado integralmente em `docs/plano-original.txt`. Os 55 personagens foram transcritos para `src/data/characters.ts`, mantendo nomes, títulos, custos, traits, tipo, atributos, habilidade e as três descrições de evolução.

Os vetores `hp`, `attack` e `evolution` seguem a ordem 1★, 2★, 3★. A velocidade de ataque foi convertida de vírgula decimal para número JavaScript; nenhum valor foi recalculado. `art` guarda o nome usado nos arquivos existentes, ou `null` quando não há arte na pasta `chars`.

Qualquer balanceamento provisório do combate deve ficar separado desse catálogo, para não substituir os dados do plano por valores inventados.

## Produção atual

Novas formas e animações são entregues em `public/assets/animations/v3`. O [inventário de produção](production/STATUS.md) registra as 165 formas planejadas e distingue as prontas das pendentes; hoje são **41 prontas e 124 pendentes**. Para personagens novos, o retrato do códice é um recorte da primeira pose; o PNG permanece intacto.

## Integração ao jogo (versões 0.4 e 1.0)

Os 55 personagens são recrutáveis e lutam com suas habilidades. As regras abaixo são **decisões de protótipo**, separadas do catálogo canônico: `src/game/roster.ts`, `src/game/skills.ts` e `src/game/synergies.ts`.

### Recrutamento

| Nível da aldeia | Custo liberado | Chances na fogueira (custo 1 / 2 / 3 / 4 / 5) |
| --- | --- | --- |
| 1 | 1 | 100 / 0 / 0 / 0 / 0 |
| 2 | 2 | 70 / 30 / 0 / 0 / 0 |
| 3 | 3 | 45 / 35 / 20 / 0 / 0 |
| 4 | 4 | 30 / 32 / 25 / 13 / 0 |
| 5 | 5 | 22 / 27 / 26 / 17 / 8 |

- Preço: **15 × custo de alimento e 30 × custo de espírito**. Liberar um herói devolve metade do espírito gasto em todas as cópias (15 × custo × 3^(estrelas − 1)).
- A visita é sorteada por um gerador determinístico guardado no save (`shopSeed`): recarregar a página não troca os viajantes. Uma visita não repete o mesmo personagem.
- Evoluir a aldeia traz uma visita nova e gratuita, já com o custo recém-liberado.

### Combate

- Cada habilidade tem uma nota "Efeito nesta versão" no códice com os números usados.
- Mecânicas novas: invocações com duração (crias de seda, corvos, escaravelhos explosivos, ecos de aliados caídos, espíritos do marfim), zonas que acompanham o conjurador ou ficam no chão, provocação, furtividade, presa coletiva (Fenra), inimigos molhados (Rio/Aruun), redução de cura, roubo de vida, golpes em área, metamorfoses temporárias, noite que pune conjurações (Veyra) e renascimento único (Ssar'ka).
- Invocações não decidem a batalha: a vitória ou derrota considera apenas os heróis.
- Na versão 1.0 as 12 ondas viraram 6 regiões com 5 expedições e chefes; a lista e as fórmulas estão em [SISTEMAS.md](SISTEMAS.md). Inimigos de custo maior recebem uma escala menor, porque seus atributos canônicos já são mais altos.

### Características

Todas as 31 características têm regra. Povos e funções ativam com 2 e com 4 personagens distintos (Invocador e Trapaceiro com 2 e 3; Necrófago com 2). Espíritos com três ou mais portadores ativam com 2 e 3; espíritos com dois portadores, com 2; **Espírito do Urso e Espírito do Cervo, que têm um único portador, ativam sozinhos**. Os efeitos ficam visíveis ao passar o cursor sobre cada laço no painel da expedição.

## Animalidade dos 55

O plano define os exemplos de cada categoria e pede cerca de 8–12 Metamorfos. A tabela completa a classificação a partir das descrições de 3★: **16 Manifestadores, 14 Marcados, 16 Híbridos e 9 Metamorfos**. Os seis Metamorfos do plano recebem três propostas — Thari, Nyala e Sakar — porque suas habilidades descrevem uma transformação durante a ação. Linhas marcadas como "Proposta" aguardam aprovação do autor antes de orientar a arte.

| ID | Personagem | Custo | Categoria | Origem |
| --- | --- | --- | --- | --- |
| 1 | Akru | 1 | Híbrido | Proposta |
| 2 | Nima | 1 | Manifestador | Proposta |
| 3 | Boru | 1 | Híbrido | Proposta |
| 4 | Sesha | 1 | Marcado | Proposta |
| 5 | Kiko | 1 | Marcado | Proposta |
| 6 | Muru | 1 | Marcado | Proposta |
| 7 | Taka | 1 | Marcado | Proposta |
| 8 | Ena | 1 | Marcado | Plano |
| 9 | Paku | 1 | Manifestador | Proposta |
| 10 | Zirri | 1 | Híbrido | Proposta |
| 11 | Ayo | 1 | Manifestador | Proposta |
| 12 | Kalu | 1 | Marcado | Plano |
| 13 | Viri | 1 | Marcado | Proposta |
| 14 | Jara | 2 | Híbrido | Proposta |
| 15 | Grom | 2 | Híbrido | Proposta |
| 16 | Ilya | 2 | Marcado | Proposta |
| 17 | Nask | 2 | Híbrido | Proposta |
| 18 | Rava | 2 | Manifestador | Plano |
| 19 | Tembu | 2 | Manifestador | Proposta |
| 20 | Zakka | 2 | Marcado | Proposta |
| 21 | Omi | 2 | Manifestador | Proposta |
| 22 | Suri | 2 | Híbrido | Proposta |
| 23 | Kesh | 2 | Híbrido | Proposta |
| 24 | Brak | 2 | Manifestador | Proposta |
| 25 | Sena | 2 | Marcado | Plano |
| 26 | Uru | 2 | Manifestador | Proposta |
| 27 | Amaru | 3 | Metamorfo | Plano |
| 28 | Duma | 3 | Híbrido | Plano |
| 29 | Roko | 3 | Híbrido | Proposta |
| 30 | Khepri | 3 | Manifestador | Proposta |
| 31 | Vesh | 3 | Marcado | Proposta |
| 32 | Toru | 3 | Híbrido | Proposta |
| 33 | Asha | 3 | Marcado | Proposta |
| 34 | Thari | 3 | Metamorfo | Proposta |
| 35 | Mako | 3 | Manifestador | Proposta |
| 36 | Sava | 3 | Metamorfo | Plano |
| 37 | Nilo | 3 | Manifestador | Proposta |
| 38 | Yara | 3 | Manifestador | Plano |
| 39 | Fenra | 4 | Híbrido | Plano |
| 40 | Koru | 4 | Híbrido | Plano |
| 41 | Makara | 4 | Híbrido | Proposta |
| 42 | Nyala | 4 | Metamorfo | Proposta |
| 43 | Vahara | 4 | Manifestador | Proposta |
| 44 | Zyri | 4 | Híbrido | Proposta |
| 45 | Orun | 4 | Manifestador | Proposta |
| 46 | Sakar | 4 | Metamorfo | Proposta |
| 47 | Aruun | 4 | Marcado | Proposta |
| 48 | Boro | 4 | Híbrido | Proposta |
| 49 | Uruq | 5 | Metamorfo | Plano |
| 50 | Akh'ra | 5 | Metamorfo | Plano |
| 51 | Mahari | 5 | Manifestador | Proposta |
| 52 | Veyra | 5 | Marcado | Proposta |
| 53 | Ssar'ka | 5 | Metamorfo | Plano |
| 54 | N'Goro | 5 | Manifestador | Plano |
| 55 | Karkun | 5 | Metamorfo | Plano |

## Inventário inicial das artes recebidas

| Custo | Personagens | Com arte nas três estrelas | Sem arte |
| --- | ---: | ---: | ---: |
| 1 | 13 | 13 | 0 |
| 2 | 13 | 0 | 13 |
| 3 | 12 | 0 | 12 |
| 4 | 10 | 0 | 10 |
| 5 | 7 | 0 | 7 |
| **Total** | **55** | **13** | **42** |

Existem **39 arquivos PNG**: três imagens para cada um dos 13 personagens de custo 1. Os nomes seguem `chars/Nome-1star.png`, `chars/Nome-2star.png` e `chars/Nome-3star.png`. Não há sequência de animação identificada pelos nomes dos arquivos. Essas imagens são referências de aparência por estrela.

Mantendo três artes por personagem, faltam **126 artes** para completar os outros 42 personagens. Refinamentos das 39 artes existentes e animações constituem trabalho adicional; essa contagem não pressupõe que uma imagem está pronta para produção.

### Artes existentes

Akru, Nima, Boru, Sesha, Kiko, Muru, Taka, Ena, Paku, Zirri, Ayo, Kalu e Viri. Todos possuem 1★, 2★ e 3★.

### Artes pendentes por custo

- **Custo 2:** Jara, Grom, Ilya, Nask, Rava, Tembu, Zakka, Omi, Suri, Kesh, Brak, Sena e Uru.
- **Custo 3:** Amaru, Duma, Roko, Khepri, Vesh, Toru, Asha, Thari, Mako, Sava, Nilo e Yara.
- **Custo 4:** Fenra, Koru, Makara, Nyala, Vahara, Zyri, Orun, Sakar, Aruun e Boro.
- **Custo 5:** Uruq, Akh'ra, Mahari, Veyra, Ssar'ka, N'Goro e Karkun.

## Categorias de transformação explicitadas no plano

As categorias abaixo reproduzem somente os exemplos atribuídos pelo texto. Os demais personagens permanecem sem classificação fechada, mesmo quando suas descrições sugerem uma categoria.

| Categoria | Regra fornecida | Exemplos explícitos |
| --- | --- | --- |
| Manifestador | Continua humano; animal aparece externamente. | N'Goro, Rava, Yara |
| Marcado | Olhos, garras, escamas, penas etc., mas continua majoritariamente humano. | Ena, Kalu, Sena |
| Híbrido | Partes significativas do corpo mudam. | Fenra, Koru, Duma |
| Metamorfo | A habilidade permite assumir outra forma. | Amaru, Sava, Uruq, Akh'ra, Ssar'ka, Karkun |

O plano sugere aproximadamente **8 a 12 metamorfos verdadeiros** no elenco. Há **seis exemplos explicitamente classificados**; os demais candidatos ainda precisam ser escolhidos. Não foram atribuídas categorias adicionais durante a transcrição.

## Pontos a decidir antes do balanceamento completo

- **Parâmetros das habilidades:** boa parte dos efeitos informa a intenção, sem fornecer dano, duração, área, escudo, cura ou escalamento numérico. Akru, por exemplo, tem percentuais de ataque e duração da marca; vários outros personagens só têm uma descrição. A execução completa de cada habilidade exige completar essa especificação.
- **Traits e sinergias:** o plano fornece as tags de cada personagem, mas não define quantidades de unidades para ativação, bônus ou interação entre povo, função e espírito. A versão 0.4 usa os números de protótipo descritos acima.
- **Tipo de Kiko:** o campo original é `Ranged 2`, enquanto os demais usam `Ranged` ou `Melee`. O alcance separado é 2. O texto foi mantido como recebido; sistemas que verificam o tipo devem considerar esse caso.
- **Sena:** o título é “Guardiã da Gazela”, enquanto o trait é “Espírito do Cervo” e a evolução menciona galhadas e pernas cervídeas. Os três elementos foram preservados; vale confirmar essa direção visual antes da arte.
- **Orun:** o trait é “Espírito do Macaco”, e a habilidade alterna máscaras de Jaguar, Elefante e Coruja. Isso pode ser intencional; foi mantido sem substituição.
- **Evolução e progressão:** o plano não estabelece a regra para subir estrelas, recrutar heróis, desbloquear custos ou avançar a vila. A versão 0.4 adota um custo por nível de aldeia e as chances acima; continuam sendo decisões de protótipo até serem aprovadas.
- **Animalidade:** os exemplos de categoria e as descrições de evolução podem admitir leituras diferentes. A classificação explícita do autor foi preservada; nenhuma aparência foi reinterpretada automaticamente.

## Verificações da transcrição

- 55 IDs consecutivos, de 1 a 55, sem duplicação.
- Três valores de HP, três valores de ataque e três descrições de evolução por personagem.
- 13 personagens com os três arquivos de arte encontrados em disco.
- Distribuição de custos conferida: 13 / 13 / 12 / 10 / 7.
- Texto original copiado sem conversão de conteúdo.
