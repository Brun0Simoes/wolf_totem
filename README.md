# Wolf Totem

Jogo de estratégia e combate automático, em português. A tribo acolhe heróis ligados a espíritos animais, desenvolve experiência e vínculo ritual e desperta as formas 1★, 2★ e 3★. As expedições combinam posicionamento, equipamentos, laços, bênçãos e poderes espirituais.

A versão **5.2 — Crônicas do Sangue** dá aos 63 sobrenaturais roupas, equipamentos e silhuetas distintas em 1★, 2★ e 3★, com poses desenhadas de caminhada, ataque e habilidade. Acrescenta Lestat, Akasha, Louis, Claudia, Armand, Marius, Maharet, Jesse, Santiago e Madeleine, em interpretações próprias para o jogo. A expansão abre após o primeiro renascimento; XP e ritualística continuam responsáveis pelas estrelas. O mapa construído das Travessias, seus caminhos e cenários táticos continuam disponíveis.

A versão **5.3 — Quatro Nações** acrescenta 63 personagens de Aang e Korra: dobradores, guerreiros, Avatares, companheiros e espíritos. Cada um possui formas 1★, 2★ e 3★ com roupas e silhuetas evolutivas, seis poses desenhadas por estrela, habilidade própria e treinos compatíveis. A expansão abre após o segundo renascimento, com nove laços e sete práticas interativas. O elenco total chega a 181 personagens. XP de atividades e vínculo ritual continuam independentes.

## Jogar

[Abrir Wolf Totem no GitHub Pages](https://brun0simoes.github.io/wolf_totem/).

Para executar localmente, use Node.js 22.12 ou posterior:

```powershell
npm install
npm run dev
```

Abra **http://127.0.0.1:5173** enquanto o servidor estiver funcionando.

## Como jogar

1. **Guardiões:** comece com um herói sorteado da Era I. Pague âmbar para abrir um draft de até três heróis inéditos e escolha um. Cada carta tem uma troca gratuita, sem filtros; a troca usada fica salva. A era libera os custos 1–5; heróis já acolhidos não aparecem.
2. **Formação:** compre níveis em **Jornada → Progressão** ou no Campo. Cada nível abre uma vaga, até as 28 casas da sua metade do tabuleiro. As eras abrem nos níveis 1, 4, 8, 13 e 18. O **Conselheiro** recomenda posições, laços, equipamentos e buffs.
3. **Expedições:** escolha o encontro no mapa. O combate é automático; use poderes espirituais, pausa, velocidade e repetição entre partidas.
4. **Estrelas:** batalhas dão XP individual e cerimônias dão XP ritual. 2★ pede nível 8 e rito 3; 3★ pede nível 24, rito 8 e a cerimônia principal do personagem. Recrutar cópias não faz parte do despertar.
5. **Rituais:** os primais mantêm rapé, sananga, kambô, ayahuasca e cacau. Os sobrenaturais têm oito cerimônias fictícias próprias, incluindo Réquiem da Noite e Selo do Primeiro Sangue. Os personagens de Avatar têm sete treinos: ar, água, terra, fogo, guerreiro, equilíbrio espiritual e convergência dos elementos. Cada personagem mostra apenas os ritos compatíveis. Confirme para pagar âmbar e receber XP ritual imediatamente.
6. **Bênçãos:** ative até duas das seis bênçãos desbloqueadas pelos rituais. Elas acompanham as próximas batalhas.
7. **Legados:** vitórias concedem conhecimento diretamente: três no primeiro triunfo de uma expedição e um nas repetições. Invista nos caminhos ancestrais; legados e conhecimento atravessam o reset.
8. **Grande Totem:** pague pelas cinco consagrações e cumpra seus requisitos. O primeiro renascimento pede formação nível 28, Totem 5/5, campanha 30/30, Abismo 10, três heróis 3★ com XP 24 e rito 8 e 2.400 âmbar. O reset reinicia heróis, carteira, itens, formação e avanço atual; libera permanentemente O Véu da Noite. O segundo renascimento também libera Quatro Nações. Renascimentos seguintes exigem mais âmbar e profundidade.
9. **Arsenal:** abra **Para a formação** para combinar e equipar itens recomendados individualmente ou aplicar o plano inteiro. Ele considera os heróis em campo, laços, adversários e itens existentes. Complete também componentes já equipados. Confira os próximos objetivos e compre apenas as peças desejadas.
10. **Travessias:** escolha um guia, uma rota e uma dificuldade. Clique no terreno livre para escolher o destino, caminhe com WASD/setas ou use **Ir até o marco**. Atravesse o rio pelas pontes; árvores, rochas e ruínas bloqueiam a passagem. Use os controles de zoom e centralização para observar o cenário. Investigue pistas e escolha até duas afinidades. Prepare a equipe para proteger um altar ou destruir três selos. Descobertas, capítulos e especializações permanecem após renascimentos; a equipe mantém XP e recompensas ao retornar.
11. **Descobertas e cenários:** nas Travessias, abra **Descobertas** para selecionar especializações e forjar as três receitas do Igarapé. **Cenários táticos** oferece quatro equipes convidadas de seis guardiões, com atributos padronizados e posições editáveis. Eles não alteram seu elenco ou inventário; a primeira vitória concede um conhecimento.

Atalhos: `J` caminhos, `R` bênçãos, `A` conselheiro, `1` jornada, `2` campo, `3` códice, `4` totem, `5` travessias, `C` Arsenal, `M` mapa, `P` pausar e `Esc` fechar. Na exploração, WASD/setas caminham e `E` interage.

## O que existe

| Pilar               | Conteúdo                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Heróis              | 55 primais + 63 sobrenaturais + 63 de Avatar, cada um com estados 1★–3★. Draft pago, até três ofertas inéditas e uma troca aleatória gratuita por carta. |
| Despertar           | 2★ exige XP 8 e rito 3; 3★ exige XP 24, rito 8 e a cerimônia principal do guardião. |
| Combate             | Campo hexagonal 7 × 8, 181 habilidades nomeadas, invocações, zonas, chefes, escudos e resumo da batalha. Formação de até 28 unidades. |
| Equipamentos        | 6 componentes, 21 receitas, 6 relíquias e 18 builds por função. Até três itens por herói. Compra, combinação e preparação de builds no Arsenal. |
| Conselho de guerra  | Composições geradas a partir do elenco acolhido, com núcleos de 2/4/6, posições, itens e buffs. Propostas iguais são reunidas.                  |
| Rituais             | Cinco medicinas primais, oito cerimônias sobrenaturais e sete treinos de Avatar. Minigames, sons, modo tranquilo e conclusão com auxílio. Até 20% de XP ritual extra. |
| Bênçãos             | Seis escolhas reutilizáveis, até duas ativas, abertas por era e ritos concluídos.                                                               |
| Caminhos Ancestrais | Três caminhos e 12 legados, aprendidos com conhecimento das vitórias. |
| Eras e espíritos    | Cinco eras, 12 Espíritos Protetores e poderes acionáveis em combate.                                                                            |
| Campanha            | Seis regiões, 30 expedições e Abismo. Grupos inimigos maiores, com sinergias e equipamentos. Renascimentos aumentam a pressão. |
| Economia            | Âmbar por vitória; derrotas dão apenas XP reduzido. Combates muito abaixo da fronteira rendem até 85% menos moeda e XP. |

Regras e elenco da nova expansão: [Quatro Nações 5.3](docs/expansions/quatro-nacoes.md). Elenco sobrenatural: [O Véu da Noite 5.2](docs/expansions/veu-da-noite.md). Draft e Arsenal: [Herói inicial, draft e itens 3.2](docs/HEROIS-E-ITENS-3.2.md). Pesquisa anterior: [Draft e combate 3.1](docs/DRAFT-E-COMBATE-3.1.md), [Interface e progressão 3.0](docs/UI-E-PROGRESSAO-3.0.md) e [Reformulação 2.2](docs/REFORMULACAO-2.2.md).

## Travessias do Encanto

O Igarapé está implementado com três guias, três rotas e dificuldades, seis marcos por percurso, dois desafios de sequência, seis eventos e seis afinidades. Altar e selos são estruturas do combate, com condições de vitória próprias e ondas anunciadas. Três histórias abrem seis especializações com vantagens e concessões; três receitas usam os componentes existentes. A biblioteca tem quatro cenários táticos permanentes.

Mapa, navegação e validação atuais: [Igarapé construído 5.1](docs/MAPA-IGARAPE-5.1.md). Conteúdo e progressão: [Travessias 5.0](docs/TRAVESSIAS-5.0.md). A [proposta original](docs/PROPOSTA-TRAVESSIAS.md) registra a pesquisa que orientou a implementação.

A [pesquisa sobre variedade e progressão](docs/PESQUISA-VARIEDADE-E-PROGRESSAO.md) analisa caminhos alternativos, objetivos de combate, afinidades temporárias e especializações persistentes, com uma ordem de desenvolvimento para reduzir a dependência dos resets.

## Salvar e carregar

O progresso é salvo automaticamente no navegador. Use **Configurações → Exportar progresso** para baixar uma cópia e **Importar progresso** ou **Carregar jornada salva** para restaurá-la em outro aparelho. Importar substitui a jornada local; exporte antes para guardar as duas.

O formato atual é **v13**. Saves v12 preservam a jornada e passam a aceitar os personagens de Avatar, respeitando o desbloqueio após o segundo reset. Saves v11 recebem as Travessias preservando o progresso existente. O percurso e suas escolhas são salvos; fechar durante um confronto retorna à preparação, sem conceder recompensas de uma luta inacabada. Saves v10 preservam heróis, saldo, estrelas, itens, legados e as 3–7 vagas anteriores, convertidas em nível da formação sem cobrança. Saves v1–v9 continuam migrando; recursos e atividades de produção antigos permanecem retirados.

O progresso pertence ao navegador e ao endereço usado. Exporte antes de limpar dados do site ou trocar de porta, navegador ou domínio.

## Combate e animações

Ataques têm preparação, recuperação e projéteis com tempo de viagem. Movimentos e poderes combinam atlas, partículas, rastros, efeitos e som. Pausa, velocidade e movimento reduzido acompanham o combate.

Detalhes e limites artísticos: [Combate e animações](docs/COMBATE-ANIMACOES.md).

## Arte

Os **55 primais mantêm seus 165 atlas, 495 sequências e 1.980 poses desenhadas**. Cada forma tem repouso, caminhada e ataque/conjuração. Impacto, queda e vitória usam movimento programado; ataque e habilidade compartilham as poses do atlas.

**63 sobrenaturais:** 189 atlas exclusivos e 1.134 poses desenhadas. Cada estrela evolui roupa, equipamento e silhueta. Cada forma tem repouso, dois contatos de caminhada, preparação de ataque, golpe e conjuração. Ataque e habilidade usam poses independentes. Respiração, recuperação, impacto, queda e vitória usam movimento programado. Prompts, origem e recortes estão em `docs/production/night-evolution`; folhas geradas de origem são preservadas em `artifacts/night-evolution/sources`, fora do bundle.

**63 personagens de Avatar:** 189 atlas, 189 retratos e 1.134 poses desenhadas, com a mesma separação de caminhada, ataque e conjuração. As três estrelas têm mudanças visuais próprias. Respiração, recuperação, impacto, queda e vitória usam movimento programado. Proveniência e empacotamento: [produção de Avatar](docs/production/avatar/README.md). A cobertura total é de 543 formas.

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
src/game/simulation.ts       Estado, combate, transações e saves v13
src/game/crossings.ts        Rotas, eventos, afinidades, histórias e descobertas
src/game/battleObjectives.ts Altar, selos e conselhos conforme o objetivo
src/render/CrossingScene.ts  Exploração, caminhada, câmera e marcos do Igarapé
src/game/formationProgression.ts Níveis pagos, eras e requisitos de reset
src/data/avatar.ts            63 personagens de Aang e Korra, atributos e formas
src/data/avatarTraits.ts      Nove laços e seus marcos
src/data/avatarRituals.ts     Sete treinos compatíveis
src/data/collections.ts      Desbloqueio das três coleções
src/game/avatarSkills.ts     Habilidades e efeitos dos 63 personagens
src/game/avatarProgression.ts Buffs de laços e treinos
src/data/nocturne.ts          63 identidades e perfis sobrenaturais
src/data/vampireChronicles.ts dez vampiros, habilidades e formas evolutivas
src/data/nightEvolution.ts    roupas e equipamentos das três formas originais
src/game/nightSkills.ts       Poderes e efeitos específicos da expansão
src/game/nightRituals.ts       Cerimônias compatíveis por personagem
src/game/formationItems.ts   Plano de itens para a formação e peças faltantes
src/game/economy.ts          Âmbar, custos e sorteio do draft
src/game/builds.ts           18 builds e preparação de equipamentos
src/game/ancestralJourney.ts  Legados, bênçãos e migração
src/game/armyAdvisor.ts       Formação, equipamentos, receitas e buffs
src/game/tribe.ts             XP, ritualística e despertar
src/game/heroMastery.ts       Histórico das antigas provas para migração
src/game-shell.css           Estrutura da interface responsiva
src/tactical-ui.css          Draft, Arsenal, composições e rituais 3.2
src/game/skills.ts            Habilidades dos primais e despacho das expansões
src/game/synergies.ts         Regras dos laços
src/game/campaign.ts          Expedições e Abismo
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

- [Travessias do Encanto — versão 5.0](docs/TRAVESSIAS-5.0.md)
- [Expansão sobrenatural — versão 5.2](docs/expansions/veu-da-noite.md)
- [Quatro Nações — versão 5.3](docs/expansions/quatro-nacoes.md)
- [Draft e Arsenal — versão 3.2](docs/HEROIS-E-ITENS-3.2.md)
- [Draft e combate — versão 3.1](docs/DRAFT-E-COMBATE-3.1.md)
- [Pesquisa e proposta de exploração](docs/PROPOSTA-TRAVESSIAS.md)
- [Inventário dos personagens](docs/PERSONAGENS.md)
- [Arte e animação](docs/ARTE-E-ANIMACAO.md)
- [Plano original preservado](docs/plano-original.txt)
