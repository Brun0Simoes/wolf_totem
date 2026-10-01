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

- Aldeia isométrica com bosque, caça, pedreira e círculo dos espíritos.
- Madeira, alimento, pedra e espírito: produção automática e coleta manual.
- Cinco níveis de aldeia e dez níveis de cada construção.
- Treze heróis de custo 1 recrutáveis, usando as 39 artes originais.
- Três cópias com as mesmas estrelas se combinam até 3 estrelas.
- Formação de até sete heróis, sinergias e 12 expedições com combate automático.
- Os 13 heróis de 1 estrela possuem repouso, caminhada e ataque em quatro quadros cada: 39 sequências e 156 poses.
- Habilidades com efeitos próprios, reação a dano, queda, vitória e heróis circulando e trabalhando na aldeia.
- Códice com os 55 personagens e seus atributos, habilidades e estágios originais.
- Salvamento automático local, exportação/importação e até duas horas de produção offline.
- Pausa, sons opcionais e interface adaptada a telas menores.

## Como jogar

1. Melhore uma construção ou evolua a aldeia. A aldeia de nível 2 comporta quatro heróis.
2. Recrute viajantes ao redor da fogueira. Recrutar custa 15 alimentos e 30 de espírito; renovar os viajantes custa 8 de espírito.
3. Na aba **Expedição**, selecione um herói e uma casa na metade próxima do tabuleiro. Também é possível escolher a posição pelo seletor numérico e clicar em **Posicionar**. Posicionar numa casa ocupada troca os heróis.
4. Inicie a expedição. As habilidades são automáticas; uma derrota preserva os heróis.
5. Combine cópias, altere a formação e use as recompensas para continuar.

Atalhos: `1` aldeia, `2` expedição, `3` códice, `P` pausar e `Esc` fechar diálogo. O ícone `−` devolve um herói à reserva. Os ícones de construção também podem ser selecionados no painel lateral.

## Escopo e próximos passos

Esta é a primeira versão para validar o ciclo de jogo. Os 42 heróis de custos 2–5 estão no códice e ainda não são recrutáveis. Há 126 artes de evolução restantes para completar três estágios de todos os 55 personagens. As artes atuais foram preservadas em `chars/`.

Os atributos e textos originais permanecem em `src/data/characters.ts`. Como o plano não define todos os números de habilidades e sinergias, `src/game/simulation.ts` contém adaptações explícitas para o protótipo em `SKILL_NOTES`. O códice mostra o efeito implementado separadamente da descrição original. Por exemplo, as manifestações de Nima são representadas por dano periódico; unidades invocadas independentes ainda precisam ser implementadas.

Não há multiplayer, servidor de contas, construção livre no mapa, exploração RTS nem animações completas de todos os personagens. Os estágios 2 e 3 mantêm suas artes próprias e usam movimentos programados; suas folhas de poses ainda serão produzidas. O tabuleiro inicial usa células quadradas em perspectiva isométrica; a migração para hexágonos deve acompanhar o desenho definitivo das habilidades.

- [Plano de desenvolvimento](docs/PLANO-DO-JOGO.md)
- [Inventário dos personagens](docs/PERSONAGENS.md)
- [Artes, animações e origem das folhas](docs/ARTE-E-ANIMACAO.md)
- [Plano original preservado](docs/plano-original.txt)

## Estrutura

```text
chars/                     Artes originais, intactas
public/assets/animations/  Folhas dos 13 heróis, recortes e âncoras
src/data/characters.ts     Os 55 personagens do plano original
src/game/simulation.ts     Economia, combate, formação e saves
src/render/WorldScene.ts   Cenário e animações em Phaser
src/main.ts                Interface, ações e salvamento no navegador
tests/simulation.test.ts   Testes das regras e progressão
docs/                      Plano, inventário e processo de arte
```

A simulação é independente do desenho. Phaser desenha o mundo; o DOM apresenta os menus. A estrutura usa [Phaser, TypeScript e Vite](https://phaser.io/news/2024/01/phaser-vite-typescript-template).

## Verificação e distribuição

```powershell
npm test
npm run build
npm run preview
```

O build gera `dist/` incluindo uma cópia das imagens. O progresso fica no armazenamento deste navegador e desta origem; trocar a porta ou o navegador cria outra jornada. Exporte o save antes de mudar de origem ou limpar os dados do navegador. Uma batalha interrompida por recarregamento é abandonada sem recompensas. As fontes externas possuem alternativas locais.
