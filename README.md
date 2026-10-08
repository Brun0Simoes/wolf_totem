# Wolf Totem

Jogo de estratégia e combate automático, em português. A tribo acolhe heróis ligados a espíritos animais, desenvolve experiência e vínculo ritual e desperta as formas 1★, 2★ e 3★. As expedições combinam posicionamento, equipamentos, laços, bênçãos e poderes espirituais.

A versão **2.2** concentra a jornada em **autochess e rituais**. O campo de combate é a tela principal. Eras, caçadas, Caminhos Ancestrais e consagrações do Totem orientam a progressão ao longo de dias.

## Jogar

[Abrir Wolf Totem no GitHub Pages](https://brun0simoes.github.io/wolf_totem/).

Para executar localmente, use Node.js 22.12 ou posterior:

```powershell
npm install
npm run dev
```

Abra **http://127.0.0.1:5173** enquanto o servidor estiver funcionando.

## Como jogar

1. **Tribo:** acolha gratuitamente companheiros conforme a era e o vínculo ritual. Cada personagem tem sua própria experiência e ritualística.
2. **Formação:** posicione combatentes, atiradores e suportes no campo hexagonal. Abra o **Conselheiro** para ver posições, laços, equipamentos e buffs recomendados.
3. **Expedições:** escolha o encontro no mapa. O combate é automático; use poderes espirituais, pausa, velocidade e repetição entre partidas.
4. **Caçadas:** envie heróis às cinco trilhas para ganhar XP e encontrar componentes. Um herói em atividade mantém a posição e volta a lutar quando retorna.
5. **Rituais:** participe dos minigames de rapé, sananga, kambô, ayahuasca e cacau. Cerimônias concedem XP ritual e efeitos aprendidos; há integração de três horas entre ritos.
6. **Bênçãos:** ative até duas das seis bênçãos desbloqueadas pelos rituais. Elas acompanham as próximas batalhas.
7. **Caminhos e eras:** conclua desafios para aprender legados. Avance de era quando um herói cumprir os marcos de experiência e ritualística.
8. **Grande Totem:** consagre suas cinco partes por conquistas, vença a Caçada Eterna e renasça com memórias ancestrais.

Atalhos: `J` caminhos, `R` bênçãos, `A` conselheiro, `1` jornada, `2` campo, `3` códice, `4` totem, `C` caçadas, `M` mapa, `P` pausar e `Esc` fechar.

## O que existe

| Pilar | Conteúdo |
| --- | --- |
| Heróis | 55 personagens, cada um com formas 1★–3★. Recrutamento por era e vínculo ritual. |
| Despertar | 2★ exige experiência 8 e ritualística 3; 3★ exige experiência 24, ritualística 8 e ayahuasca concluída. |
| Combate | Campo hexagonal 7 × 8, 55 habilidades, invocações, zonas, chefes, escudos e resumo da batalha. |
| Equipamentos | 6 componentes, 21 receitas e até três itens por herói. Combinação disponível desde a primeira era. |
| Conselho de guerra | Formação com justificativas, distribuição de itens, receitas, buffs, seis funções e 31 laços. |
| Rituais | Cinco experiências interativas com sons e controles próprios, modo tranquilo e opção automática. Até 20% de XP ritual extra pela sintonia. |
| Bênçãos | Seis escolhas reutilizáveis, até duas ativas, abertas por era e ritos concluídos. |
| Caminhos Ancestrais | Três caminhos, 12 legados e desafios de combate, caçada e cerimônia. |
| Eras e espíritos | Cinco eras, 12 Espíritos Protetores e poderes acionáveis em combate. |
| Campanha | Seis regiões, 30 expedições, Caçada Eterna e renascimento no Grande Totem. |
| Atividades offline | Caçadas e cerimônias iniciadas avançam por até 12 horas. |

Regras atuais, migração e evidências: [Reformulação 2.2](docs/REFORMULACAO-2.2.md).

## Próxima atividade pesquisada

**Travessias do Encanto:** exploração 2D com um herói guia, pistas ambientais, escolhas de rota, histórias pessoais e afinidades temporárias que modificam os encontros de autochess. A proposta inclui referências oficiais e uma primeira área compacta para implementação e teste.

Esse modo ainda é uma proposta. Leia [Travessias do Encanto](docs/PROPOSTA-TRAVESSIAS.md).

## Salvar e carregar

O progresso é salvo automaticamente no navegador. Use **Configurações → Exportar progresso** para baixar uma cópia e **Importar progresso** ou **Carregar jornada salva** para restaurá-la em outro aparelho. Importar substitui a jornada local; exporte antes para guardar as duas.

O formato atual é **v7**. Saves anteriores preservam heróis, XP, ritos, estrelas, equipamentos, eras e campanha. Investimentos econômicos registrados rendem conhecimento na conversão, até o limite de 60 pontos adicionais. Madeira, alimento, pedra, estoque espiritual, ofícios e trabalho foram retirados. As formas já despertas continuam válidas.

O progresso pertence ao navegador e ao endereço usado. Exporte antes de limpar dados do site ou trocar de porta, navegador ou domínio.

## Combate e animações

Ataques têm preparação, recuperação e projéteis com tempo de viagem. Movimentos e poderes combinam atlas, partículas, rastros, efeitos e som. Pausa, velocidade e movimento reduzido acompanham o combate.

Detalhes e limites artísticos: [Combate e animações](docs/COMBATE-ANIMACOES.md).

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
chars/                       Artes originais
public/assets/animations/    Atlas dos heróis e criaturas
src/data/                    Elenco e animalidade
src/game/simulation.ts       Estado, combate, atividades e saves v7
src/game/ancestralJourney.ts  Desafios, legados, bênçãos e migração
src/game/armyAdvisor.ts       Formação, equipamentos, receitas e buffs
src/game/tribe.ts             XP, caçadas, ritualística e despertar
src/game/skills.ts            Habilidades dos 55 heróis
src/game/synergies.ts         Regras dos laços
src/game/campaign.ts          Expedições e Caçada Eterna
src/game/items.ts             Componentes e equipamentos
src/game/spirits.ts           Eras, espíritos e memórias
src/ui/                      Menus, Conselheiro e rituais interativos
src/render/                  Phaser: arena, heróis e efeitos
src/main.ts                  Interface e ciclo do jogo
tests/                       Regras, progressão, combate e assets
docs/                        Regras atuais, pesquisa, arte e histórico
```

A simulação é pura e determinística, com sementes salvas, e funciona separada do Phaser e dos menus. A interface usa TypeScript, Vite e Phaser.

## Verificação e publicação

```powershell
npm test
npm run build
npm run preview
```

O build gera `dist/` e usa caminhos relativos para funcionar no GitHub Pages. Os envios para `main` executam testes, build e publicação pelo workflow `.github/workflows/pages.yml`.

- [Regras atuais — versão 2.2](docs/REFORMULACAO-2.2.md)
- [Pesquisa e proposta de exploração](docs/PROPOSTA-TRAVESSIAS.md)
- [Inventário dos personagens](docs/PERSONAGENS.md)
- [Arte e animação](docs/ARTE-E-ANIMACAO.md)
- [Plano original preservado](docs/plano-original.txt)
