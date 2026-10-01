# Wolf Totem

Protótipo jogável de estratégia incremental e combate automático, em português. A aldeia produz recursos, construções aumentam a produção e expedições dão recursos para recrutar e evoluir a tribo.

## Jogar localmente

Requer Node.js 22.12 ou posterior.

```powershell
npm install
npm run dev
```

Abra **http://127.0.0.1:5173**. O servidor funciona enquanto esse terminal estiver aberto. Não abra `index.html` diretamente.

## Nesta versão

**Os 55 personagens são jogáveis.** Cada nível da aldeia abre um custo na fogueira (nível 1 → custo 1 … nível 5 → custo 5), as 55 habilidades funcionam em combate, todas as características têm sinergias e as 12 expedições usam o elenco completo.

A arte segue em produção: **32 personagens têm alguma forma animada; 41 das 165 formas estão prontas**, totalizando 123 sequências e 492 poses. Akru, Nima, Boru e Jara têm as três estrelas animadas. A geração parou pelo limite de uso da ferramenta. Enquanto uma forma não tem arte própria, o jogo usa a forma pronta mais próxima do mesmo personagem; os 23 personagens ainda sem nenhuma arte aparecem como silhuetas na cor do custo.

O [inventário de arte](docs/production/STATUS.md) lista cada entrega e as 124 formas pendentes. No códice, abra um personagem para escolher a estrela, experimentar seus movimentos, ler o efeito implementado e ver sua categoria de animalidade. As folhas são carregadas sob demanda, com um limite para manter texturas antigas na memória.

- Aldeia isométrica com bosque, caça, pedreira e círculo dos espíritos.
- Madeira, alimento, pedra e espírito: produção automática e coleta manual.
- Cinco níveis de aldeia e dez níveis de cada construção.
- 55 heróis recrutáveis em cinco custos, com chances por nível da aldeia, preços por custo e visitas determinísticas salvas no progresso.
- Três cópias com as mesmas estrelas se combinam até 3 estrelas.
- Formação de até sete heróis, sinergias em dois níveis para todas as características e 12 expedições temáticas com combate automático.
- Invocações reais (crias de seda, corvos, escaravelhos, ecos e espíritos do marfim), zonas (teia, remanso, véu, domínio, gelo), provocação, furtividade, presa coletiva, metamorfoses e o renascimento de Ssar'ka.
- Os 13 heróis de 1 estrela possuem repouso, caminhada e ataque em quatro quadros cada: 39 sequências e 156 poses.
- Habilidades com efeitos visuais próprios para os 55, reação a dano, queda, vitória e heróis circulando e trabalhando na aldeia.
- Códice com os 55 personagens e seus atributos, habilidades e estágios originais.
- Salvamento automático local, exportação/importação e até duas horas de produção offline.
- Pausa, sons opcionais e interface adaptada a telas menores.

## Como jogar

1. Melhore uma construção ou evolua a aldeia. A aldeia de nível 2 comporta quatro heróis.
2. Recrute viajantes ao redor da fogueira. Recrutar custa 15 de alimento e 30 de espírito por ponto de custo do herói (custo 3: 45 e 90); renovar os viajantes custa 8 de espírito. Cada nível da aldeia libera um custo maior.
3. Na aba **Expedição**, selecione um herói e uma casa na metade próxima do tabuleiro. Também é possível escolher a posição pelo seletor numérico e clicar em **Posicionar**. Posicionar numa casa ocupada troca os heróis.
4. Inicie a expedição. As habilidades são automáticas; uma derrota preserva os heróis.
5. Combine cópias, altere a formação e use as recompensas para continuar.

Atalhos: `1` aldeia, `2` expedição, `3` códice, `P` pausar e `Esc` fechar diálogo. O ícone `−` devolve um herói à reserva. Os ícones de construção também podem ser selecionados no painel lateral.

## Escopo e próximos passos

Esta versão valida o ciclo de jogo com o elenco completo. Faltam **124 formas animadas** para completar as três estrelas dos 55 personagens; a lista está em [STATUS.md](docs/production/STATUS.md). As artes originais foram preservadas em `chars/`.

Os atributos e textos originais permanecem em `src/data/characters.ts`. Como o plano não define todos os números de habilidades e sinergias, `src/game/skills.ts` e `src/game/synergies.ts` contêm adaptações explícitas para o protótipo; o códice mostra o efeito implementado separadamente da descrição original. A classificação de animalidade completa os exemplos do plano com uma **proposta** para os demais, marcada como tal no códice e em [PERSONAGENS.md](docs/PERSONAGENS.md).

Não há multiplayer, servidor de contas, construção livre no mapa, exploração RTS nem animações completas de todos os personagens. Invocações e metamorfoses usam silhuetas e efeitos programados até receberem folhas próprias. O tabuleiro inicial usa células quadradas em perspectiva isométrica; a migração para hexágonos deve acompanhar o desenho definitivo das habilidades.

- [Plano de desenvolvimento](docs/PLANO-DO-JOGO.md)
- [Inventário dos personagens](docs/PERSONAGENS.md)
- [Artes, animações e origem das folhas](docs/ARTE-E-ANIMACAO.md)
- [Plano original preservado](docs/plano-original.txt)

## Estrutura

```text
chars/                     Artes originais, intactas
public/assets/animations/  Folhas de animação (v2: 13 heróis 1★; v3: novas formas)
src/data/characters.ts     Os 55 personagens do plano original
src/data/animality.ts      Categoria de animalidade (plano + proposta)
src/game/simulation.ts     Economia, combate, formação e saves
src/game/skills.ts         As 55 habilidades e suas notas no códice
src/game/synergies.ts      Regras de todas as características
src/game/roster.ts         Desbloqueios, chances da fogueira, preços e expedições
src/render/WorldScene.ts   Cenário e animações em Phaser
src/main.ts                Interface, ações e salvamento no navegador
tests/                     Regras, elenco completo, progressão e atlas
docs/                      Plano, inventário e processo de arte
```

A simulação é independente do desenho. Phaser desenha o mundo; o DOM apresenta os menus. A estrutura usa [Phaser, TypeScript e Vite](https://phaser.io/news/2024/01/phaser-vite-typescript-template).

## Verificação e distribuição

Os envios para `main` e os pull requests executam os testes e o build pelo GitHub Actions.

```powershell
npm test
npm run build
npm run preview
```

O build gera `dist/` incluindo uma cópia das imagens. O progresso fica no armazenamento deste navegador e desta origem; trocar a porta ou o navegador cria outra jornada. Exporte o save antes de mudar de origem ou limpar os dados do navegador. Uma batalha interrompida por recarregamento é abandonada sem recompensas. As fontes externas possuem alternativas locais.
