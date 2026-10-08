# Interface e progressão 3.0

## O que mudou

A interface anterior combinava navegação, objetivos, acampamento e vários painéis na mesma tela. A versão 3.0 usa uma folha de estilos nova e quatro áreas permanentes:

- **Campo:** arena, controles de combate, formação e acesso ao Conselho de Guerra. O botão de iniciar fica no topo do painel; detalhes e análises ficam em superfícies próprias.
- **Guardiões:** coleção, catálogo, prévia animada grande e abas Evolução, Provas e Equipar. As duas barras e os requisitos do próximo despertar aparecem juntos.
- **Rituais:** seleção de companheiro e cerimônia, participação interativa, requisito de desbloqueio e alternativa offline.
- **Jornada:** legados, desafios ancestrais, bênçãos, diário, atividades offline e Grande Totem.

A navegação vira uma barra inferior em celulares. Controles de foco, som, movimento reduzido, importação e exportação permanecem disponíveis. A identidade visual usa fundos em verde escuro, espaços maiores, títulos em serifas, dourado para ações e roxo para ritualística. Os atlas e as regras do combate foram preservados.

## Evoluir jogando

### Experiência de combate

Cada participante recebe XP quando o combate termina, inclusive uma quantidade menor em derrotas. A base passa a ser `80 + 28 × nível da expedição²`, limitada ao nível de expedição 60. Multiplicadores:

| Resultado | Multiplicador |
| --- | --- |
| Primeira vitória | 2 |
| Vitória repetida | 0,8 |
| Derrota | 0,25 |
| Presença de chefe | × 1,3 |

Legados, mentoria e memórias continuam aplicando seus bônus. Exemplo: a primeira expedição concede 216 XP base por herói; repetir a expedição 20 concede 9.024 XP base. Isso torna o combate uma fonte útil de experiência na curva existente. Não há energia consumível ou recompensa de batalha por apenas deixar o navegador aberto.

### Provas pessoais

Os 55 guardiões recebem oito objetivos com progresso próprio. Cada recompensa pertence ao guardião que participou e pode ser recebida uma vez por jornada.

| Prova | Objetivo | XP base |
| --- | --- | ---: |
| Primeiro chamado | Uma vitória | 400 |
| Novos horizontes | Três expedições diferentes | 1.200 |
| Voz do espírito | Três vitórias com a habilidade usada | 2.400 |
| Armas da jornada | Duas vitórias com equipamento | 2.500 |
| Força dos laços | Três vitórias com um laço do guardião ativo | 4.500 |
| Além da clareira | Cinco expedições diferentes | 10.000 |
| Diante dos gigantes | Cinco vitórias contra chefes | 18.000 |
| Memória das terras | Dez expedições diferentes | 30.000 |

Total disponível: 69.000 XP base por guardião. Reservas não recebem progresso de provas. Repetir uma expedição não aumenta o número de lugares explorados. Habilidades precisam ser usadas durante a luta, e o laço precisa pertencer ao guardião. Uma batalha abandonada ao recarregar não dá recompensa. Receber uma prova é bloqueado durante combate e pausa.

### Rituais e integração

Rapé, sananga, kambô e ayahuasca concedem o XP ritual **ao confirmar a participação**, com até 20% extra pela sintonia. O guardião permanece disponível para lutar. O botão de auxílio concede o XP base, preservando uma alternativa de controle acessível.

Após a cerimônia, a integração termina por uma das rotas:

1. **Duas vitórias com esse guardião:** na expedição mais avançada já alcançada, ou contra inimigos cujo nível esperado seja pelo menos o nível do herói menos três.
2. **Três horas de tempo da jornada:** a alternativa offline existente.

A regra da expedição mais avançada evita bloquear um herói que acabou de receber muito XP de uma prova. Um veterano com campanha avançada não integra repetindo as primeiras expedições triviais. Derrotas e vitórias de outros heróis não contam para sua integração.

A roda de cacau também pode ser integrada com duas vitórias elegíveis. Sua bênção termina após essas duas vitórias ou dez minutos; a integração offline continua disponível. Quem ainda integra outra cerimônia não recebe o XP ritual da roda.

**Meditar offline** mantém a cerimônia temporizada original: o herói fica ausente e recebe XP ao terminar. Caçadas continuam como escolha para períodos fora do jogo. Não são necessárias para avançar as provas ou realizar a rota ativa dos rituais.

Estrelas continuam exigindo as duas progressões: 2★ pede experiência 8 e ritualística 3; 3★ pede experiência 24, ritualística 8 e ayahuasca concluída. Não há fusão de cópias. O teste antigo de duas visitas offline por dia mantém o resultado de 9,5 dias até o primeiro 3★; a rota ativa não tem prazo mínimo em dias.

## Pesquisa e aplicação

### Objetivos variados: Guild Wars 2

A ArenaNet descreve progressão de maestrias por experiência e pontos obtidos em conteúdos variados; pontos associados a conquistas são recebidos uma vez. A aplicação em Wolf Totem é premiar participação e exploração por objetivos pessoais, com recompensa única, sem substituir as duas barras de evolução. [Artigo oficial sobre maestrias](https://www.guildwars2.com/en/news/reimagining-progression-the-mastery-system/).

A descrição oficial de Adventures enfatiza desafios curtos de habilidade, reinício rápido e recompensas por desempenho. A aplicação aqui é permitir participação curta nos rituais e conceder XP ao confirmar, evitando adicionar espera obrigatória depois do minigame. [Artigo oficial sobre Adventures](https://www.guildwars2.com/en/news/adventuring-forth/).

### Incentivo a experimentar: Hades

As notas oficiais de Hades registram profecias que incentivam experimentar talentos, aspectos e diferentes atividades. A aplicação em Wolf Totem é usar provas de habilidades, equipamentos, laços e expedições distintas, em vez de premiar apenas um contador de partidas. Trata-se de inspiração de estrutura; não há reprodução de personagens ou conteúdo de Hades. [Notas oficiais do Long Winter Update](https://www.supergiantgames.com/blog/hades-long-winter-update-patch-notes/).

### Próxima atividade complementar

**Travessias do Encanto** continua sendo a proposta para uma atividade fora do autochess: explorar uma área com um guardião, interpretar pistas e escolher rotas que alterem encontros e afinidades temporárias. As provas implementadas já dão uma estrutura de objetivos pessoais que essa exploração poderá alimentar depois.

Esse modo de exploração **ainda não foi implementado**. O documento [Proposta de Travessias](PROPOSTA-TRAVESSIAS.md) contém o escopo anterior e referências. A versão 3.0 implementa a nova interface, provas e progressão ritual ativa descritas acima.

## Saves e verificação

O formato passa a **v8**, mantendo a chave de armazenamento do navegador. Formatos v1–v7 continuam sendo importados. Saves sem provas começam com contadores zerados; não recebem conquistas retroativas inventadas. Integrações pendentes passam a oferecer a alternativa de duas vitórias. Estrelas, níveis, equipamentos, rituais e campanha existentes são preservados.

As verificações incluem:

- XP imediato, confirmação única, requisitos de cerimônias e alternativa offline.
- Integração por participante, por expedição avançada e por dificuldade; derrotas e reservas não contam.
- Contagem de habilidades, laços, equipamentos, chefes e expedições distintas.
- Recompensas únicas após salvar e carregar; validação de contadores e IDs corrompidos.
- Sequência de combates reais que alcança Era II e 2★ sem avanço de tempo offline.
- Testes existentes de combate, habilidades, sprites, equipamentos, progressão e migrações.
- Teste no navegador de acolhimento, formação, batalha, prova, equipamento, avanço de era, minigame, navegação e layout móvel.
- Importação pela interface de um save v7 e exportação em v8: nove guardiões, campanha, era, estrelas, níveis, itens e ritos preservados. A exportação da jornada jogada também preservou a prova recebida, o equipamento e as duas vitórias.

Verificação local: **313 testes em 14 arquivos aprovados** e build de produção concluído. A interface foi conferida no computador e em larguras de celular de 390 pixels.

O balanceamento desta versão tem testes de regras e uma sequência inicial real. Tempos médios de progressão e satisfação de jogadores ainda precisam de sessões humanas de playtest.
