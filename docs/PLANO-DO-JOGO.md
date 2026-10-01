# Wolf Totem — plano de desenvolvimento

## A experiência

O jogador guia um pequeno clã numa floresta ancestral. Reúne recursos, desenvolve uma aldeia e atrai pessoas ligadas a espíritos animais. O crescimento permanente da aldeia sustenta a preparação de formações que lutam automaticamente em expedições.

O ciclo inicial dura poucos minutos: observar a produção, escolher uma melhoria, recrutar ou combinar um herói, organizar a formação, vencer uma expedição e investir a recompensa. A derrota deve incentivar outra composição sem destruir o progresso permanente.

## O que já funciona

| Sistema | Implementação inicial |
|---|---|
| Economia | Madeira, alimento, pedra e espírito; coleta manual e produção por segundo |
| Aldeia | Quatro construções fixas com dez níveis; cinco níveis da aldeia |
| Recrutamento | 55 viajantes em cinco custos liberados pelo nível da aldeia, reserva, renovação e fusão de três cópias |
| Formação | Doze casas disponíveis; capacidade aumenta de três a sete heróis |
| Combate | Vida, armadura, resistência mágica, mana, alcance, ataques e habilidades automáticas |
| Características | Regras para todas as 31 características (povos, funções e espíritos), em até dois níveis, com números de protótipo |
| Campanha | Doze expedições temáticas; as últimas trazem custos 4 e um lendário |
| Persistência | Save local versionado, importação/exportação e produção offline limitada |
| Arte | Trinta e nove ilustrações originais e sequência de ataque de Akru |
| Elenco | Cinquenta e cinco fichas completas no códice; os 55 jogáveis com habilidades, invocações e zonas |

## Produção em etapas

### 1. Validar o início do jogo

Jogar a primeira sessão inteira com o elenco completo. Ajustar o tempo até a primeira melhoria, a frequência de recrutamento e o benefício de cada construção. Dar peso ao posicionamento e explicar as sinergias sem exigir leitura do plano.

Critério: um jogador novo deve conseguir melhorar a aldeia, recrutar, posicionar e concluir uma expedição sem instruções externas. Nenhum recurso essencial pode causar bloqueio permanente.

### 2. Consolidar a linguagem visual

Escolher a escala definitiva dos personagens no campo e produzir ciclos de repouso, deslocamento, ataque, habilidade, dano e derrota para um pequeno grupo representativo. Validar Akru, um guardião, uma unidade à distância e um xamã antes de multiplicar o processo pelo elenco.

Preservar as quatro formas de relação com os espíritos: manifestadores, marcados, híbridos e metamorfos. Manter a intenção do plano de aproximadamente 8–12 metamorfos verdadeiros. O elenco completo ainda precisa de uma classificação explícita, aprovada pelo autor; o protótipo não deduz essa classificação.

Critério: quadros com identidade, escala, direção e ponto de apoio consistentes. Transformações de 3 estrelas devem continuar legíveis no tamanho de jogo.

### 3. Abrir as primeiras progressões de elenco

Implementar o custo 2, seus requisitos de descoberta e as primeiras invocações reais. Definir se desbloqueios vêm de níveis de aldeia, expedições, construções ou uma combinação. Depois expandir custos 3, 4 e 5, preservando o papel de cada lendário.

O modelo atual usa espírito como moeda de recrutamento. Os custos 1–5 do plano representam categorias de poder no códice; ainda não são preços definitivos da economia incremental.

### 4. Dar profundidade à aldeia

Introduzir alocação de trabalhadores, escolhas entre produção e exploração, novas áreas e construções que alterem estratégias. Decidir se a colocação de construções será livre ou em lotes. Acrescentar ameaças e eventos somente depois de estabilizar o crescimento básico.

### 5. Consolidar combate e campanha

Definir o tabuleiro final, incluindo a possível troca para hexágonos mencionados nas habilidades. Completar deslocamentos especiais, invocações, efeitos em área, controles, metamorfoses e interações entre habilidades. Criar encontros que exijam funções diferentes em vez de apenas aumentar números.

### 6. Preparar distribuição

Otimizar texturas, acrescentar áudio final, testar em celulares reais, versionar migrações de save e ampliar testes de campanhas e longas ausências. Escolher distribuição web ou empacotamento desktop depois de validar o jogo. Contas, sincronização e multiplayer exigem desenho próprio de servidor e ficam para uma decisão posterior.

## Decisões abertas

- Sessão desejada: gerenciamento relaxado de longa duração ou partidas com início e fim?
- Progressão dos heróis: cópias permanentes, experiência própria ou ambas?
- Papel da exploração: expedições escolhidas por menu ou mapa navegável?
- Direção de arte final: ilustrações detalhadas reduzidas ou sprites redesenhados para campo?
- Equilíbrio das características e regras dos espíritos individuais.

Essas decisões não impedem experimentar a versão atual. O código mantém economia, elenco e desenho separados para permitir mudanças sem refazer todo o projeto.
