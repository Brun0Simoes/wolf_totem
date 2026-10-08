# Wolf Totem

Jogo incremental de estratégia e combate automático, em português. A tribo avança por cinco eras e pelos Caminhos Ancestrais: desafios de combate, caçada e cerimônia rendem conhecimento para legados permanentes. Ofícios produzem provisões para acolher companheiros, conduzir rituais e preparar a próxima batalha. Heróis ligados a espíritos animais despertam novas formas com experiência de atividades e nível ritual. A formação estratégica luta automaticamente até o Primeiro Inverno, a Caçada Eterna e o renascimento no Grande Totem.

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

## Caminhos Ancestrais e conselho de guerra

Escolha um desafio e realize as atividades depois de aceitá-lo. Duas vitórias, uma caçada concluída ou uma cerimônia concluída rendem conhecimento. Os três caminhos — Matilha, Raízes e Encanto — oferecem 12 legados com três níveis cada, para combate, produção e aprendizado. Conhecimento e legados atravessam o renascimento.

Os seis ofícios têm melhorias imediatas e produção offline por até 12 horas. Companheiros da reserva podem ajudar para ganhar XP. Prepare até cinco cargas de cada um dos seis preparativos e selecione até dois para a próxima expedição; cada partida válida consome uma carga dos selecionados. A gestão de aldeões, terrenos e filas de obras foi removida.

O **Conselheiro** tem quatro áreas: formação com prévia das 28 casas e justificativa por herói; distribuição de equipamentos e receitas com os componentes da bolsa; buffs, rituais e momento dos poderes espirituais; seis funções táticas e 31 laços. Ele mostra ganhos e perdas de sinergia, respeita as vagas e reserva cada item uma vez. Escolha até duas prioridades e aplique o plano exibido, ou ajuste as casas manualmente. A análise usa regras e estimativas do inimigo.

Regras, migração de saves e verificações: [Caminhos Ancestrais e conselheiro](docs/CAMINHOS-ANCESTRAIS.md).

## Combate e animações

Ataques têm preparação, recuperação e projéteis com tempo de viagem. Os 55 heróis e suas formas usam perfis de movimento, arma e efeitos; habilidades combinam partículas, rastros e sequências pintadas. Estados, escudos, transformações e derrotas têm resposta visual, com sons por arma e poder. Pausa, velocidade e movimento reduzido acompanham o combate.

Detalhes, verificações e limites artísticos: [Combate e animações](docs/COMBATE-ANIMACOES.md).

## Jornada 2.1

- Navegação por Jornada, Tribo, Expedições, Rituais e Códice, com painel contextual recolhível no combate.
- Experiência e ritualística têm barras independentes. Trabalho concede 40 XP/min; rituais concedem XP ritual e pedem 3 horas de integração antes do próximo rito.
- Caçadas duram de 10 minutos a 8 horas; rituais individuais, de 20 minutos a 6 horas. Ajudantes encurtam cerimônias em até 1,5×.
- Um trabalhador retorna ao posto após sua cerimônia, se a vaga continua livre. O tempo offline é dividido no momento de retorno para contabilizar apenas o trabalho efetivamente realizado.
- Um teste determinístico de duas visitas por dia alcança o primeiro avatar em **6 dias**, com trabalho contínuo, recursos produzidos pela aldeia e uma sequência de ritos. É uma referência de balanceamento; outras rotinas mudam o tempo.
- Saves anteriores preservam formas já despertas e equipamentos. Cópias antigas são consolidadas sem gerar novas estrelas.
- Cenário e construções pintados, efeitos de combate com atlas próprio, limites de efeitos simultâneos e atualização de barras sem substituir os controles a cada tick.

Direção visual e verificação: [revisão de design](docs/design/REVIEW.md).

## Rituais interativos

Antes de iniciar uma cerimônia, participe de um minigame curto: três sopros no rapé, quatro alinhamentos de foco na sananga, três sequências de memória no kambô, 18 segundos conduzindo uma luz na ayahuasca ou oito pulsações na roda de cacau. Cada experiência tem cores, controles e efeitos sonoros próprios.

A sintonia concede até **20% de XP ritual extra**. Confirmar inicia a cerimônia e cobra os recursos uma única vez; fechar a preparação preserva os recursos. **Seguir automaticamente** inicia com o XP base. Tempos de cerimônia, integração e requisitos de despertar continuam valendo. Os sons são composições sintetizadas para o jogo e usam os controles de volume existentes.

Há controles por toque e teclado, pausa, margem ampliada no modo tranquilo e uma alternativa de dois toques para o sopro. A participação pausa ao sair da janela; a aldeia continua sua jornada. Regras e evidências: [rituais interativos](docs/RITUAIS-INTERATIVOS.md).

## O jogo

| Pilar | O que existe |
| --- | --- |
| **Caminhos e provisões** | Desafios rendem conhecimento para 12 legados permanentes. Madeira, alimento, pedra e espírito com produção automática e offline (até 12 h). Seis ofícios até o nível 15; heróis da reserva ajudam e ganham XP. Seis preparativos, até dois por expedição. |
| **Eras (Age of Mythology)** | Cinco eras. A cada nova era a tribo escolhe 1 de 3 Espíritos Protetores (12 no total): um bônus permanente e um **Poder Espiritual** acionado uma vez por expedição. |
| **Heróis (auto chess)** | Os 55 personagens do Set 1, com catálogo liberado por era e vínculo ritual. 2★ exige experiência 8 e ritual 3; 3★ exige experiência 24, ritual 8 e ayahuasca concluída. As 55 habilidades funcionam em combate, com invocações, zonas, metamorfoses e renascimento. |
| **Itens e laços (TFT)** | 6 componentes e 21 itens, até 3 por herói; dois componentes no mesmo herói se combinam sozinhos. As 31 características (povos, funções e espíritos animais) ativam laços em dois níveis. |
| **Campanha** | 6 regiões com 5 expedições cada, sempre fechadas por um chefe. Expedições vencidas podem ser repetidas para farmar, com velocidade 1–3× e repetição automática. |
| **Fim de jogo** | Caçada Eterna sem fim e o Grande Totem (maravilha em 5 partes). Completo o Totem, a tribo renasce com brasas ancestrais, gastas em 6 Memórias permanentes. |
| **Vida da aldeia (1.1)** | Diário com 31 objetivos (tutorial guiado até o renascimento); eventos a cada poucos minutos: mercador, presságio, viajante perdido e incursões de saqueadores para defender. |
| **Combate (1.1)** | Chefes com uma mecânica própria abaixo de 50% da vida e resumo de cada batalha (dano causado, recebido, cura e escudo, com destaque para o melhor da luta). |
| **Campo hexagonal (1.2)** | Tabuleiro de casas hexagonais em vista frontal, com cenário próprio em cada região. Depois de 75 s de luta vem o Crepúsculo: a cura enfraquece e os golpes ficam mais fortes, para nenhuma batalha empacar. |
| **Heróis que crescem (1.3)** | A jornada começa com Akru sozinho. Heróis sobem até o nível 30 com batalhas e **caçadas** em cinco trilhas, que correm mesmo com o jogo fechado. Caçadas sem sucesso trazem **panema**, o azar do caçador. |
| **Casa de Cura (1.3)** | A maloca do pajé, com cerimônias de rapé, sananga, kambô e ayahuasca para cada herói e a roda de cacau para a tribo. Os textos foram pesquisados e tratam as práticas com respeito. |
| **Campo maior e combates difíceis (1.3)** | Campo de 7 × 8 casas como no TFT, inimigos posicionados por função e mais fortes, crescendo com o nível esperado da tribo. |
| **Tela inicial e configurações (1.2)** | A história da tribo e o resumo da jornada na abertura. Volume de efeitos e música, movimento reduzido, números de dano e apagar a jornada com confirmação. |

Números e regras completas: [Sistemas do jogo](docs/SISTEMAS.md).

## Como jogar

1. **Aldeia:** distribua os quatro aldeões em **População**. Em **Construir**, selecione uma infraestrutura e um terreno; mantenha construtores livres. Prepare mais aldeões, reconheça **Territórios**, estabeleça postos e invista em **Pesquisas**. A evolução de era continua exigindo experiência e ritualística de um herói.
2. **Caçadas e Casa de Cura:** mande heróis caçar (`C`) para ganharem experiência e alimento, e leve-os às cerimônias da Casa de Cura para fortalecê-los e limpar a panema.
3. **Tribo:** escolha um companheiro no catálogo, conforme a era e o vínculo ritual. Cada personagem pertence à tribo uma única vez. Acompanhe suas duas barras e os requisitos de despertar no painel do herói.
4. **Expedição:** escolha a expedição no mapa (`M`). Abra o **Conselheiro** (`A`) para analisar o inimigo, as funções, os laços e os itens. Aplique uma formação sugerida ou selecione um herói e uma casa da sua metade do campo. Os inimigos da próxima expedição já aparecem no tabuleiro.
5. **Combate:** é automático. Use os poderes espirituais na barra do campo, troque a velocidade e ligue a repetição para farmar.
6. **Totem:** depois do Primeiro Inverno, erga o Grande Totem, renasça e compre memórias.

Atalhos: `G` população, `B` construir, `V` territórios, `R` pesquisas, `A` conselheiro, `1` aldeia, `2` expedição, `3` códice, `4` totem, `C` caçadas, `M` mapa, `P` pausar e `Esc` fechar.

## Arte

Os **55 personagens têm as formas 1★, 2★ e 3★ animadas: 165 atlas, 495 sequências e 1.980 poses desenhadas**. Cada forma tem repouso, caminhada e ataque/conjuração. Impacto, queda e vitória usam movimento programado; ataque e habilidade compartilham as poses do atlas.

O jogo escolhe automaticamente, nesta ordem:

1. a folha pintada da estrela;
2. a ilustração original (personagens de custo 1);
3. a folha pintada mais próxima, com o animal espiritual em aura atrás (2★ e 3★);
4. uma **figura desenhada pelo código**, com poses de repouso, caminhada e ataque e com a progressão 1★ humano, 2★ vínculo e 3★ avatar.

Quando uma folha pintada entra em `public/assets/animations/v3`, ela é registrada por personagem e estrela. O [inventário de arte](docs/production/STATUS.md) mostra a cobertura completa e o estado das criaturas invocadas. Detalhes em [Arte e animação](docs/ARTE-E-ANIMACAO.md).

As cinco criaturas invocadas (aranha, corvo, escaravelho, lobo e elefante) também têm folhas pintadas de repouso, caminhada e ataque, carregadas sob demanda no campo. O eco de Amaru usa a arte do próprio herói. Os espíritos, estandartes e o Grande Totem usam glifos de máscara de totem (27 animais) desenhados em SVG/Canvas. A arena de cada região e as figuras provisórias, com sombreado, rosto e roupas detalhadas, também são pintadas pelo código. Som e música são sintetizados com WebAudio: ative-os no ícone de volume ou nas configurações.

## Estrutura

```text
chars/                     Artes originais, intactas
public/assets/animations/  Folhas pintadas (v2/v3: 165 formas; summons: 5 criaturas)
src/data/                  Os 55 personagens do plano e a animalidade
src/game/simulation.ts     Estado, economia, combate, saves (v6) e ações
src/game/ancestralJourney.ts Desafios, legados, preparativos e migração de RTS
src/game/armyAdvisor.ts    Formação, laços, equipamentos, receitas e buffs
src/ui/AncestralJourney.ts Página de caminhos, ofícios e preparativos
src/ui/ArmyCoach.ts        Conselho de guerra em quatro áreas
src/game/skills.ts         As 55 habilidades
src/game/synergies.ts      Regras das 31 características
src/game/roster.ts         Desbloqueios, preços e compatibilidade de visitas antigas
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
