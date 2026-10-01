# Wolf Totem — catálogo de personagens

## Fonte e fidelidade

O texto recebido está preservado integralmente em `docs/plano-original.txt`. Os 55 personagens foram transcritos para `src/data/characters.ts`, mantendo nomes, títulos, custos, traits, tipo, atributos, habilidade e as três descrições de evolução.

Os vetores `hp`, `attack` e `evolution` seguem a ordem 1★, 2★, 3★. A velocidade de ataque foi convertida de vírgula decimal para número JavaScript; nenhum valor foi recalculado. `art` guarda o nome usado nos arquivos existentes, ou `null` quando não há arte na pasta `chars`.

Qualquer balanceamento provisório do combate deve ficar separado desse catálogo, para não substituir os dados do plano por valores inventados.

## Produção atual

Novas formas e animações são entregues em `public/assets/animations/v3`. O [inventário de produção](production/STATUS.md) registra as 165 formas planejadas e distingue as prontas das pendentes. Para personagens novos, o retrato do códice é um recorte da primeira pose; o PNG permanece intacto.

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
- **Traits e sinergias:** o plano fornece as tags de cada personagem, mas não define quantidades de unidades para ativação, bônus ou interação entre povo, função e espírito.
- **Tipo de Kiko:** o campo original é `Ranged 2`, enquanto os demais usam `Ranged` ou `Melee`. O alcance separado é 2. O texto foi mantido como recebido; sistemas que verificam o tipo devem considerar esse caso.
- **Sena:** o título é “Guardiã da Gazela”, enquanto o trait é “Espírito do Cervo” e a evolução menciona galhadas e pernas cervídeas. Os três elementos foram preservados; vale confirmar essa direção visual antes da arte.
- **Orun:** o trait é “Espírito do Macaco”, e a habilidade alterna máscaras de Jaguar, Elefante e Coruja. Isso pode ser intencional; foi mantido sem substituição.
- **Evolução e progressão:** há três aparências e três valores de HP e ataque, mas o plano não estabelece a regra para subir estrelas, recrutar heróis, desbloquear custos ou avançar a vila. Essas regras pertencem ao desenho do jogo e devem ser identificadas como decisões de protótipo até serem aprovadas.
- **Animalidade:** os exemplos de categoria e as descrições de evolução podem admitir leituras diferentes. A classificação explícita do autor foi preservada; nenhuma aparência foi reinterpretada automaticamente.

## Verificações da transcrição

- 55 IDs consecutivos, de 1 a 55, sem duplicação.
- Três valores de HP, três valores de ataque e três descrições de evolução por personagem.
- 13 personagens com os três arquivos de arte encontrados em disco.
- Distribuição de custos conferida: 13 / 13 / 12 / 10 / 7.
- Texto original copiado sem conversão de conteúdo.
