# Wolf Totem: variedade e progressão além dos resets

Pesquisa e análise — 12 de outubro de 2026. **Proposta de design; os recursos deste documento ainda não foram implementados.**

## Recomendação

Fazer de Wolf Totem uma jornada de exploração e preparação tática: escolher um caminho, descobrir algo no mundo, adaptar a formação, enfrentar um objetivo diferente e voltar com progresso que permanece. O autochess e os rituais continuam no centro. O renascimento ocupa um lugar opcional na progressão posterior.

A melhor direção é desenvolver as **Travessias do Encanto**, já propostas em [outro documento](PROPOSTA-TRAVESSIAS.md), junto de objetivos de combate e especializações dos heróis. Primeiro testar as decisões em um mapa com caminhos; depois acrescentar exploração controlável. Assim podemos avaliar a variedade antes de produzir muitos cenários e animações.

## 1. Diagnóstico da versão atual

Esta análise usa o README e os módulos de campanha, formação, economia, rituais e simulação. Não inclui um novo teste com jogadores.

| O que já existe | Limite que ainda vejo |
| --- | --- |
| 108 guardiões, laços, receitas, builds e recomendações | A quantidade de combinações aumenta, mas as atividades disponíveis continuam próximas das mesmas. |
| Seis regiões e 30 encontros de campanha | A sequência é fixa. Há pouca escolha sobre o percurso e suas consequências. |
| Abismo com grupos inimigos variados | Muda o adversário e a pressão, enquanto a condição de vitória continua eliminar a equipe inimiga. |
| Chefes com fases e poderes espirituais acionáveis | Já há intervenções em combate. Falta relacioná-las a objetivos e ameaças mais diversos. |
| Duas barras por herói: XP e ritualística | São uma boa base para o despertar, mas preencher barras acaba sendo uma parte grande da motivação. |
| Níveis, drafts, itens e cerimônias pagos em âmbar | Gastos competem pela mesma reserva. Sem outra atividade interessante, uma compra pode virar repetição de batalhas para levantar saldo. |
| Reset exigente e expansão aberta no primeiro renascimento | Tornar o reset mais difícil prolonga a preparação; isso sozinho não acrescenta novas decisões. |

Minha conclusão: o próximo investimento deve aumentar os **tipos de decisão** e os motivos para revisitar lugares. Mais personagens, números maiores e mais requisitos de reset têm retorno menor para esse problema.

## 2. Referências pesquisadas

As referências abaixo são fontes dos próprios desenvolvedores ou páginas publicadas por eles. A adaptação para Wolf Totem é uma proposta própria; não há evidência de que os mesmos resultados ocorreriam aqui.

| Fonte | Mecanismo observado | Aplicação proposta |
| --- | --- | --- |
| [The Last Flame](https://store.steampowered.com/app/1830970/The_Last_Flame/) | Combates automáticos cercados por escolhas de caminho, recursos, equipamentos e posicionamento. | Expedições com decisões que mudam a preparação do encontro seguinte. |
| [TFT: apresentação dos Aprimoramentos Hextec](https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/gizmos-gadgets-set-mechanic-overview-hextech-augments/) | Escolha entre três efeitos; alguns modificam posicionamento, itens e relações entre unidades. | Afinidades temporárias que favorecem estratégias diferentes em cada travessia. |
| [Into the Breach](https://store.steampowered.com/app/590380/Into_the_Breach/) | Proteção de construções e ataques inimigos anunciados permitem preparar respostas táticas. | Objetivos de proteção e ameaças legíveis no autochess. |
| [Monster Train: desafios](https://www.themonstertrain.com/challenges) | Modificadores alteram as regras das jornadas; desafios podem ser personalizados e compartilhados. | Biblioteca permanente de cenários táticos com regras especiais. |
| [Monster Train: The Last Divinity](https://www.themonstertrain.com/dlc/the-last-divinity) | Benefícios escolhidos durante a jornada também aumentam a ameaça dos inimigos. | Risco opcional anunciado, com recompensa associada à decisão. |
| [Hades: FAQ da Supergiant](https://www.supergiantgames.com/blog/hades-faq/) | Diferentes combinações de poderes convivem com descobertas de história e personagens entre jornadas. | Capítulos persistentes e motivos narrativos para revisitar regiões. |
| [Heaven's Vault, da inkle](https://www.inklestudios.com/heavensvault/) | Exploração, interpretação de pistas e personagens que lembram das escolhas. | Investigar rastros e glifos fictícios altera rotas e encontros futuros. |
| [Slay the Spire 2: diário de eventos da Mega Crit](https://www.megacrit.com/news/2025-6-12-neowsletter-issue-11/) | Eventos consideram o estado da jornada e apresentam decisões com consequências. | Ofertas que consideram a formação, a região e o histórico do jogador. |

A referência de TFT descreve o sistema de 2021. O diário da Mega Crit é de junho de 2025. São referências de design, sem intenção de reproduzir o balanceamento atual desses jogos.

## 3. Ideias prioritárias

### A. Travessias com caminhos e descobertas

Uma região oferece três caminhos possíveis, com pistas sobre ameaças e recompensas. Escolher a margem do rio pode levar a um combate de proteção; entrar nas ruínas pode revelar uma receita e despertar um adversário opcional. A formação é reorganizada entre encontros.

Depois de validar essas decisões, o jogador passa a conduzir um guia pelo cenário, observar rastros, conversar e interagir. Cada trecho precisa conter uma descoberta, escolha ou desafio. Caminhar longas distâncias entre pontos acrescentaria trabalho sem melhorar a experiência.

**Valor:** amplia a interação fora do tabuleiro e dá contexto ao combate e aos rituais.

**Custo e risco:** alto para cenários percorríveis, controles, colisões, pistas e apresentação. O mapa inicial com caminhos tem custo menor, mas pode parecer outro menu se os encontros não tiverem presença visual.

### B. Batalhas com condições de vitória diferentes

| Objetivo proposto | O que muda na estratégia |
| --- | --- |
| Proteger um altar | Tanques, cura, controle e cobertura dos flancos ganham importância. |
| Destruir os selos de um ritual inimigo | Alcance, mobilidade e prioridade de alvos podem valer mais que dano total. |
| Resistir a ondas | Exige reservar poderes e preparar defesa para entradas anunciadas. |
| Conduzir um aliado até uma saída | A formação precisa acompanhar um objetivo móvel; deixar toda a equipe parada pode falhar. |

Começar por altar e selos. Escolta exige mais trabalho de movimento e inteligência dos aliados. Não é necessário criar todos os objetivos ao mesmo tempo.

Os chefes atuais já têm fases. Melhorar a antecipação: mostrar a área ameaçada, o momento da mudança e o alvo prioritário. Os poderes existentes passam a servir como resposta a uma situação reconhecível. A dificuldade deve exigir adaptação, com sinais visuais e sonoros que permitam entender a derrota.

**Valor:** alto, porque reutiliza o combate e muda a utilidade das formações.

**Custo e risco:** médio a alto. São necessárias regras de alvo, vitória, derrota e recomendações que entendam o objetivo. O número de unidades também pode esconder informações importantes.

### C. Afinidades temporárias com escolhas entre três opções

Usar as afinidades da proposta anterior, com duas vagas por travessia. Em momentos definidos, o jogador escolhe entre três efeitos adequados ao percurso e ao seu elenco. Exemplos propostos:

- **Guarda dispersa:** proteger aliados que começam sem vizinhos incentiva outro posicionamento.
- **Eco da cura:** parte da cura excedente vira escudo e favorece uma equipe de sustentação.
- **Caçada marcada:** ataques coordenados contra um alvo marcado recebem uma vantagem e favorecem foco de dano.

São efeitos da jornada, com regras visíveis. As bênçãos já aprendidas nos rituais continuam reutilizáveis. Mostrar ambas na mesma preparação, com duração e origem claras, evita criar mais telas.

Ofertas devem conter alternativas viáveis. Sorteio que oferece três efeitos inúteis para a equipe causa frustração; oferecer sempre a combinação perfeita transforma a escolha em confirmação automática.

**Valor:** alto para variar posicionamento e builds usando o elenco atual.

**Custo e risco:** médio. Combinações multiplicam o trabalho de balanceamento e podem criar uma opção dominante.

### D. Especializações e equipamentos que mudam o papel do herói

Acrescentar progressão horizontal: desbloquear uma maneira diferente de jogar com um personagem. Exemplos propostos são escolher entre cura concentrada e escudo em área, ou entre marcar um alvo e aplicar controle. Cada variante tem uma vantagem e uma concessão explícitas.

Desbloquear variantes por capítulos e descobertas, aproveitando marcos das duas barras existentes. Experimentar uma variante deve ser simples, com troca livre fora da batalha. Uma terceira barra de experiência aumentaria a manutenção do elenco.

Os itens atuais já têm receitas e efeitos. A expansão deve priorizar efeitos que conectam ações: bloquear protege um aliado próximo; uma primeira conjuração espalha uma marca; sacrificar alcance melhora uma função de proteção. Componentes e âmbar existentes podem continuar sendo usados, com receitas descobertas em lugares específicos.

**Valor:** dá uma razão para revisitar heróis e testar composições durante a mesma jornada.

**Custo e risco:** médio no protótipo, alto para os 108 personagens. Começar com três heróis e seis variantes; aplicar famílias de regras e depois preservar diferenças individuais.

### E. Histórias curtas e um mundo que guarda consequências

Um guia encontra alguém na travessia, decide como ajudar e depois revisita o lugar transformado. O próximo capítulo pode abrir uma passagem, uma interação de grupo ou uma variante de habilidade. Uma história pode reunir vários guardiões, evitando produzir 108 campanhas isoladas.

O códice registra descobertas, personagens encontrados e pistas ainda abertas. O jogador consegue retomar após alguns dias. O progresso é uma mudança concreta no mundo, sem exigir contadores como “vença 30 vezes com este herói”.

**Valor:** constrói vínculo com o elenco e objetivos que sobrevivem ao crescimento de atributos.

**Custo e risco:** alto em escrita, arte e continuidade. Diálogos repetidos e escolhas sem consequência perderiam o efeito rapidamente.

### F. Cenários táticos permanentes

Uma biblioteca de pequenos desafios oferece formações preparadas e regras claras: seis guardiões contra uma equipe de atiradores, cura limitada, flancos perigosos ou um altar vulnerável. Usar níveis padronizados permite vencer pela preparação, mesmo sem ter a equipe mais evoluída.

Esse limite pequeno pertence ao modo de desafio; a formação principal continua crescendo até 28 vagas. Os cenários ficam disponíveis para repetir, sem prazo diário. Variantes de cenário, registros e elementos visuais podem ser recompensas de conclusão. Sementes compartilháveis são uma evolução possível após o modo local funcionar.

**Valor:** entrega situações variadas com produção menor de cenários e ensina laços, itens e posicionamento.

**Custo e risco:** médio. Precisa de curadoria para oferecer soluções diferentes e evitar depender de uma combinação secreta.

## 4. Progressão longa com conquistas durante a jornada

Organizar o avanço em três escalas:

| Escala | Exemplos de progresso | Persistência proposta |
| --- | --- | --- |
| Um encontro | Ajustar posição, responder ao objetivo e aprender uma ameaça | Aprendizado e registro do resultado |
| Uma travessia | Escolher rotas, obter afinidades e decidir enfrentar um risco opcional | Descobertas e recompensas ficam; afinidades encerram no retorno |
| Várias sessões | Evoluir XP e ritualística, abrir capítulos, receitas e especializações | Descobertas, capítulos e desbloqueios atravessam renascimentos |

A referência de ritmo continua sendo chegar ao primeiro 3★ em alguns dias. Cada sessão deve permitir outra conquista reconhecível antes disso. O tempo real precisa ser medido com jogadores.

Manter a abertura do Véu da Noite no primeiro reset, conforme a regra solicitada anteriormente. As travessias e os cenários devem estar disponíveis antes dele. Capítulos posteriores e especializações precisam ter caminhos de desbloqueio dentro da jornada, sem exigir o segundo, terceiro ou quarto renascimento.

As recompensas dos novos modos precisam entrar no orçamento da economia. Primeiras descobertas podem conceder progresso maior; repetições precisam continuar úteis sem virar a forma obrigatória de obter âmbar. Oferecer componentes desejados em rotas identificáveis ajuda o jogador a perseguir uma build. Não há necessidade inicial de outra moeda.

## 5. Uma sessão possível

Exemplo proposto, com duração alvo de 15–25 minutos, ainda sem medição:

1. Escolher um guia e ver três percursos, cada um com uma ameaça e uma descoberta possível.
2. Investigar uma pista que revela um evento e modifica o próximo confronto.
3. Escolher uma afinidade entre três opções e ajustar itens e posições.
4. Defender um altar em um encontro de autochess.
5. Encontrar um personagem, avançar um capítulo e decidir entre retornar ou aceitar um risco opcional anunciado.
6. Concluir o confronto final, registrar a descoberta e usar um ritual para avançar o vínculo de um guardião.

Ao voltar, a história avançou, uma receita ou variante ficou mais próxima e a equipe ganhou experiência. O próximo percurso oferece outra combinação de objetivo e preparação. Salvar entre interações permite jogar essa sessão em partes.

## 6. Interface e conselheiro

- Um mapa principal mostra a jornada, os caminhos conhecidos e descobertas possíveis. Detalhes abrem junto ao ponto escolhido.
- Antes do combate, mostrar objetivo, ameaças, equipe, itens e afinidades em uma preparação única. Rituais continuam acessíveis com poucos passos.
- O conselheiro explica propostas situacionais: “proteger o altar”, “alcançar os selos” e “sustentar as ondas”, com vantagens e concessões.
- A comparação entre duas ou três alternativas ajuda a aprender. Aplicar uma recomendação não deve esconder o motivo da escolha.
- Cor, ícone, texto curto e som indicam objetivos; ataques anunciados precisam continuar legíveis em telas pequenas e com muitos personagens.

## 7. Ordem de desenvolvimento recomendada

| Etapa | Entrega | Razão |
| --- | --- | --- |
| 1 | Uma travessia em mapa com três rotas, seis eventos, seis afinidades e objetivos de altar e selos | Testa variedade usando o combate e os assets disponíveis. |
| 2 | Exploração controlável do Igarapé, três guias primais e dois desafios ambientais | Acrescenta uma atividade com movimento e observação. |
| 3 | Seis especializações para esses guias, capítulos curtos e receitas ligadas a descobertas | Faz o progresso da mesma jornada mudar as opções do jogador. |
| 4 | Biblioteca de cenários e variações de outros biomas | Amplia conteúdo após validar as regras e a apresentação. |

Os três guias primais permitem aproveitar atlas de caminhada existentes. Os sobrenaturais ainda compartilham a mesma ilustração entre poses e estrelas, com movimento programado; incluir muitos como guias aumenta o trabalho artístico. Não começar com histórias e exploração completas para os 108 guardiões.

Preservar a separação atual entre simulação e Phaser. Rotas, sementes, consequências e aplicação das recompensas precisam ficar no estado salvo. Cada recompensa é aplicada uma vez, inclusive ao fechar e retomar o navegador.

## 8. Como avaliar o protótipo

Em três visitas ao mesmo bioma, observar se o jogador muda pelo menos duas decisões relevantes: caminho, afinidade, posição, build ou escolha de risco. Isso é uma meta de teste, não um resultado observado.

Verificar também:

- O jogador explica por que escolheu uma rota e entende sua consequência?
- Formações diferentes conseguem resolver o mesmo objetivo?
- Existe uma afinidade escolhida quase sempre, mesmo em contextos diferentes?
- A exploração exige observar e decidir ou apenas caminhar até um marcador?
- Uma sessão termina com progresso reconhecível sem precisar de reset?
- A recompensa incentiva variedade ou faz uma rota fácil dominar o ganho de recursos?
- Salvar e retomar preserva escolhas, sem perda ou duplicação de recompensas?

Mais rotas não resolvem repetição quando todas exigem a mesma resposta. Expandir o conteúdo depois que essas escolhas produzirem estratégias distintas.

## Conclusão

A combinação com maior potencial é **travessias + objetivos variados de combate + especializações persistentes**. Afinidades e cenários táticos complementam essa base com custo de produção menor. A prioridade inicial é provar que uma região oferece decisões interessantes ao ser revisitada. O reset permanece disponível, enquanto a jornada passa a ter seus próprios motivos para continuar.
