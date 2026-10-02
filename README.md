# Wolf Totem

Jogo incremental de estratégia e combate automático, em português. Uma tribo cresce ao redor de uma fogueira: a aldeia produz recursos e avança por cinco eras, como em *Age of Mythology*, honrando um espírito protetor em cada uma. Heróis ligados a espíritos animais são recrutados, fundidos e equipados como num *auto chess/TFT*. Depois partem em expedições automáticas até o Primeiro Inverno, a Caçada Eterna e o renascimento no Grande Totem.

## Jogar localmente

Requer Node.js 22.12 ou posterior.

```powershell
npm install
npm run dev
```

Abra **http://127.0.0.1:5173**. O servidor funciona enquanto esse terminal estiver aberto. Não abra `index.html` diretamente.

## Jogar online (GitHub Pages)

A cada envio para `main`, o workflow `.github/workflows/pages.yml` testa, gera o build e publica o jogo em **https://brun0simoes.github.io/wolf_totem/**. Para ativar, uma única vez: em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**. Depois, envie algo para `main` ou rode o workflow em **Actions → Publish on GitHub Pages → Run workflow**.

### Salvar e carregar a jornada

- O progresso é salvo sozinho no navegador a cada poucos segundos. Ao reabrir o site no mesmo navegador, é só **Continuar jornada**.
- Para guardar uma cópia ou trocar de navegador ou aparelho:
  - em **Configurações → Exportar progresso**, o jogo baixa `wolf-totem-jornada-AAAA-MM-DD.json`;
  - em outro lugar, use **Carregar jornada salva** na tela inicial ou **Importar progresso** nas configurações.
- Importar substitui a jornada daquele navegador. Exporte antes se quiser manter as duas.
- Limpar os dados do site ou usar uma janela anônima apaga o progresso local. O arquivo exportado continua valendo.

## O jogo

| Pilar | O que existe |
| --- | --- |
| **Aldeia (incremental)** | Madeira, alimento, pedra e espírito com produção automática e offline (até 2 h). Seis construções até o nível 15, incluindo a Forja de Osso e a Casa de Cura. Heróis da reserva trabalham nas construções e aumentam a produção, com bônus de afinidade. |
| **Eras (Age of Mythology)** | Cinco eras. A cada nova era a tribo escolhe 1 de 3 Espíritos Protetores (12 no total): um bônus permanente e um **Poder Espiritual** acionado uma vez por expedição. |
| **Heróis (auto chess)** | Os 55 personagens do Set 1, cada era abrindo um custo na fogueira. Três cópias formam 2★ e três 2★ formam 3★. As 55 habilidades funcionam em combate, com invocações, zonas, metamorfoses e renascimento. |
| **Itens e laços (TFT)** | 6 componentes e 21 itens, até 3 por herói; dois componentes no mesmo herói se combinam sozinhos. As 31 características (povos, funções e espíritos animais) ativam laços em dois níveis. |
| **Campanha** | 6 regiões com 5 expedições cada, sempre fechadas por um chefe. Expedições vencidas podem ser repetidas para farmar, com velocidade 1–3× e repetição automática. |
| **Fim de jogo** | Caçada Eterna sem fim e o Grande Totem (maravilha em 5 partes). Completo o Totem, a tribo renasce com brasas ancestrais, gastas em 6 Memórias permanentes. |
| **Vida da aldeia (1.1)** | Diário com 31 objetivos (tutorial guiado até o renascimento); eventos a cada poucos minutos: mercador, presságio, viajante perdido e incursões de saqueadores para defender. |
| **Combate (1.1)** | Chefes com uma mecânica própria abaixo de 50% da vida e resumo de cada batalha (dano causado, recebido, cura e escudo, com destaque para o melhor da luta). |
| **Campo hexagonal (1.2)** | Tabuleiro de casas hexagonais em vista frontal, com cenário próprio em cada região. Depois de 75 s de luta vem o Crepúsculo: a cura enfraquece e os golpes ficam mais fortes, para nenhuma batalha empacar. |
| **Heróis que crescem (1.3)** | A jornada começa com Akru sozinho. Heróis sobem até o nível 10 com batalhas e **caçadas** em cinco trilhas, que correm mesmo com o jogo fechado. Caçadas sem sucesso trazem **panema**, o azar do caçador. |
| **Casa de Cura (1.3)** | A maloca do pajé, com cerimônias de rapé, sananga, kambô e ayahuasca para cada herói e a roda de cacau para a tribo. Os textos foram pesquisados e tratam as práticas com respeito. |
| **Campo maior e combates difíceis (1.3)** | Campo de 7 × 8 casas como no TFT, inimigos posicionados por função e mais fortes, crescendo com o nível esperado da tribo. |
| **Tela inicial e configurações (1.2)** | A história da tribo e o resumo da jornada na abertura. Volume de efeitos e música, movimento reduzido, números de dano e apagar a jornada com confirmação. |

Números e regras completas: [Sistemas do jogo](docs/SISTEMAS.md).

## Como jogar

1. **Aldeia:** a jornada começa com Akru sozinho. Melhore construções, colete à mão no começo e avance de era. Cada era abre uma vaga na formação, heróis de custo maior e a escolha de um Espírito Protetor.
2. **Caçadas e Casa de Cura:** mande heróis caçar (`C`) para ganharem experiência e alimento, e leve-os às cerimônias da Casa de Cura para fortalecê-los e limpar a panema.
3. **Fogueira:** recrute viajantes, que custam 15 de alimento e 30 de espírito por ponto de custo. Junte três cópias para evoluir e renove os viajantes por 8 de espírito.
4. **Expedição:** escolha a expedição no mapa (`M`), selecione um herói e uma casa da sua metade do campo e entregue itens da bolsa. Os inimigos da próxima expedição já aparecem no tabuleiro.
5. **Combate:** é automático. Use os poderes espirituais na barra do campo, troque a velocidade e ligue a repetição para farmar.
6. **Totem:** depois do Primeiro Inverno, erga o Grande Totem, renasça e compre memórias.

Atalhos: `1` aldeia, `2` expedição, `3` códice, `4` totem, `C` caçadas, `M` mapa, `P` pausar e `Esc` fechar.

## Arte

**41 das 165 formas** têm folhas pintadas (32 personagens; Akru, Nima, Boru e Jara completos). O jogo escolhe automaticamente, nesta ordem:

1. a folha pintada da estrela;
2. a ilustração original (personagens de custo 1);
3. a folha pintada mais próxima, com o animal espiritual em aura atrás (2★ e 3★);
4. uma **figura desenhada pelo código**, com poses de repouso, caminhada e ataque e com a progressão 1★ humano, 2★ vínculo e 3★ avatar.

Quando uma folha pintada nova entra em `public/assets/animations/v3`, ela substitui a figura sem mudar código. O [inventário de arte](docs/production/STATUS.md) lista as 124 formas pendentes. Detalhes em [Arte e animação](docs/ARTE-E-ANIMACAO.md).

Os espíritos, invocações, estandartes e o Grande Totem usam glifos de máscara de totem (27 animais) desenhados em SVG/Canvas. A arena de cada região e as figuras provisórias, com sombreado, rosto e roupas detalhadas, também são pintadas pelo código. Som e música são sintetizados com WebAudio: ative-os no ícone de volume ou nas configurações.

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
src/game/quests.ts         Diário de objetivos
src/game/events.ts         Eventos da aldeia e incursões
src/game/board.ts          Campo hexagonal: casas, limites e vizinhança
src/game/tribe.ts          Níveis, caçadas, panema e cerimônias da Casa de Cura
src/render/                Phaser: aldeia, arena, efeitos, figuras procedurais e glifos
src/prefs.ts               Preferências do aparelho (som, movimento, números)
src/audio.ts               Efeitos e música sintetizados
src/main.ts                Interface e ciclo do jogo
tests/                     Regras, elenco, sistemas, campanha e atlas
docs/                      Plano, sistemas, personagens e arte
```

A simulação é pura e determinística (inclusive loja e saques, com sementes salvas) e não depende do desenho. O Phaser desenha o mundo e o DOM, os menus. A base usa [Phaser, TypeScript e Vite](https://phaser.io/news/2024/01/phaser-vite-typescript-template).

## Verificação e distribuição

Os envios para `main` e os pull requests executam os testes e o build pelo GitHub Actions; os envios para `main` também publicam no GitHub Pages.

```powershell
npm test
npm run build
npm run preview
```

O build gera `dist/` com uma cópia das imagens e usa caminhos relativos, então funciona na raiz de um domínio ou num subcaminho como o do GitHub Pages. O progresso fica no armazenamento deste navegador e deste endereço; exporte o save antes de trocar de navegador, de porta ou de site. Saves das versões 0.x são convertidos automaticamente: cada onda vencida vira uma expedição vencida.

- [Sistemas do jogo](docs/SISTEMAS.md)
- [Plano de desenvolvimento](docs/PLANO-DO-JOGO.md)
- [Inventário dos personagens](docs/PERSONAGENS.md)
- [Arte, animações e origem das folhas](docs/ARTE-E-ANIMACAO.md)
- [Plano original preservado](docs/plano-original.txt)
