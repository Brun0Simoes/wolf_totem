# Wolf Totem

Jogo incremental de estratégia e combate automático, em português. Uma tribo cresce ao redor de uma fogueira: a aldeia produz recursos e avança por cinco eras, como em *Age of Mythology*, honrando um espírito protetor em cada uma. Heróis ligados a espíritos animais são recrutados, fundidos e equipados como num *auto chess/TFT*. Depois partem em expedições automáticas até o Primeiro Inverno, a Caçada Eterna e o renascimento no Grande Totem.

## Jogar localmente

Requer Node.js 22.12 ou posterior.

```powershell
npm install
npm run dev
```

Abra **http://127.0.0.1:5173**. O servidor funciona enquanto esse terminal estiver aberto. Não abra `index.html` diretamente.

## O jogo

| Pilar | O que existe |
| --- | --- |
| **Aldeia (incremental)** | Madeira, alimento, pedra e espírito com produção automática e offline (até 2 h). Cinco construções até o nível 15, incluindo a Forja de Osso. Heróis da reserva trabalham nas construções e aumentam a produção, com bônus de afinidade. |
| **Eras (Age of Mythology)** | Cinco eras. A cada nova era a tribo escolhe 1 de 3 Espíritos Protetores (12 no total): um bônus permanente e um **Poder Espiritual** acionado uma vez por expedição. |
| **Heróis (auto chess)** | Os 55 personagens do Set 1, cada era abrindo um custo na fogueira. Três cópias formam 2★ e três 2★ formam 3★. As 55 habilidades funcionam em combate, com invocações, zonas, metamorfoses e renascimento. |
| **Itens e laços (TFT)** | 6 componentes e 21 itens, até 3 por herói; dois componentes no mesmo herói se combinam sozinhos. As 31 características (povos, funções e espíritos animais) ativam laços em dois níveis. |
| **Campanha** | 6 regiões com 5 expedições cada, sempre fechadas por um chefe. Expedições vencidas podem ser repetidas para farmar, com velocidade 1–3× e repetição automática. |
| **Fim de jogo** | Caçada Eterna sem fim e o Grande Totem (maravilha em 5 partes). Completo o Totem, a tribo renasce com brasas ancestrais, gastas em 6 Memórias permanentes. |

Números e regras completas: [Sistemas do jogo](docs/SISTEMAS.md).

## Como jogar

1. **Aldeia:** melhore construções, colete à mão no começo e avance de era. Cada era abre uma vaga na formação, heróis de custo maior e a escolha de um Espírito Protetor.
2. **Fogueira:** recrute viajantes, que custam 15 de alimento e 30 de espírito por ponto de custo. Junte três cópias para evoluir e renove os viajantes por 8 de espírito.
3. **Expedição:** escolha a expedição no mapa (`M`), selecione um herói e uma casa da sua metade do campo e entregue itens da bolsa. Os inimigos da próxima expedição já aparecem no tabuleiro.
4. **Combate:** é automático. Use os poderes espirituais na barra do campo, troque a velocidade e ligue a repetição para farmar.
5. **Totem:** depois do Primeiro Inverno, erga o Grande Totem, renasça e compre memórias.

Atalhos: `1` aldeia, `2` expedição, `3` códice, `4` totem, `M` mapa, `P` pausar e `Esc` fechar.

## Arte

**41 das 165 formas** têm folhas pintadas (32 personagens; Akru, Nima, Boru e Jara completos). O jogo escolhe automaticamente, nesta ordem:

1. a folha pintada da estrela;
2. a ilustração original (personagens de custo 1);
3. a folha pintada mais próxima, com o animal espiritual em aura atrás (2★ e 3★);
4. uma **figura desenhada pelo código**, com poses de repouso, caminhada e ataque e com a progressão 1★ humano, 2★ vínculo e 3★ avatar.

Quando uma folha pintada nova entra em `public/assets/animations/v3`, ela substitui a figura sem mudar código. O [inventário de arte](docs/production/STATUS.md) lista as 124 formas pendentes. Detalhes em [Arte e animação](docs/ARTE-E-ANIMACAO.md).

Os espíritos, invocações, estandartes e o Grande Totem usam glifos de máscara de totem (27 animais) desenhados em SVG/Canvas. Som e música são sintetizados com WebAudio; ative-os no ícone de volume.

## Estrutura

```text
chars/                     Artes originais, intactas
public/assets/animations/  Folhas pintadas (v2: 13 heróis 1★; v3: novas formas)
src/data/                  Os 55 personagens do plano e a animalidade
src/game/simulation.ts     Estado, economia, combate, saves (v2) e ações
src/game/skills.ts         As 55 habilidades
src/game/synergies.ts      Regras das 31 características
src/game/roster.ts         Desbloqueios, chances da fogueira e preços
src/game/campaign.ts       Regiões, expedições, chefes e Caçada Eterna
src/game/items.ts          Componentes e itens
src/game/spirits.ts        Eras, espíritos protetores e memórias
src/render/                Phaser: aldeia, campo, efeitos, figuras procedurais e glifos
src/audio.ts               Efeitos e música sintetizados
src/main.ts                Interface e ciclo do jogo
tests/                     Regras, elenco, sistemas, campanha e atlas
docs/                      Plano, sistemas, personagens e arte
```

A simulação é pura e determinística (inclusive loja e saques, com sementes salvas) e não depende do desenho. O Phaser desenha o mundo e o DOM, os menus. A base usa [Phaser, TypeScript e Vite](https://phaser.io/news/2024/01/phaser-vite-typescript-template).

## Verificação e distribuição

Os envios para `main` e os pull requests executam os testes e o build pelo GitHub Actions.

```powershell
npm test
npm run build
npm run preview
```

O build gera `dist/` com uma cópia das imagens. O progresso fica no armazenamento deste navegador e desta origem; exporte o save antes de trocar de navegador ou porta. Saves das versões 0.x são convertidos automaticamente: cada onda vencida vira uma expedição vencida.

- [Sistemas do jogo](docs/SISTEMAS.md)
- [Plano de desenvolvimento](docs/PLANO-DO-JOGO.md)
- [Inventário dos personagens](docs/PERSONAGENS.md)
- [Arte, animações e origem das folhas](docs/ARTE-E-ANIMACAO.md)
- [Plano original preservado](docs/plano-original.txt)
