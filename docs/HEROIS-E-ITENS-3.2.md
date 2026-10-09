# Heróis, draft e equipamentos — 3.2

## Nova jornada

Cada nova jornada sorteia um dos 13 guardiões da Era I, com chances iguais. Ele começa em campo, com 1★, nível de experiência 1 e nível ritualístico 1. O navegador fornece uma nova semente aleatória; a simulação recebe essa semente para permitir reproduzir partidas em testes. Carregar uma jornada conserva o herói e a sequência de sorteios. O renascimento também sorteia um guardião da Era I usando a sequência salva.

## Draft

Abrir o chamado continua custando `24 + 12 × era` âmbar. Escolhe-se um entre até três guardiões inéditos. Cada posição tem **uma troca gratuita**, com resultado aleatório, sem seleção de função, laço ou personagem. A troca preserva as outras cartas e exclui o herói substituído, os demais oferecidos e os que já pertencem à tribo.

A troca funciona mesmo com zero âmbar. Uma tentativa sem alternativa disponível conserva sua utilização. Pausa, combate e posição inválida bloqueiam a ação. O draft mantém o conjunto de sua era original até ser concluído; escolher um herói encerra as ofertas. Um novo chamado pago recebe novas utilizações.

## Recomendações de equipamentos

**Arsenal → Para a formação** e **Conselho de Guerra → Equipamentos** mostram o mesmo plano. Ele usa apenas os heróis presentes no campo e considera:

- função do portador, experiência e estrelas;
- laços ativos e o adversário selecionado;
- resistência mágica removida em favor dos conjuradores;
- vizinhos que podem receber o Escudo Totêmico;
- passivas já equipadas, que não se acumulam no combate;
- os três espaços de cada herói e todas as peças disponíveis.

As sugestões são avaliadas por regras de pontuação; não garantem uma formação ideal nem vitória. Cada ação reserva entradas específicas da bolsa, incluindo componentes iguais. Itens prontos, receitas com duas peças da bolsa e receitas com um componente já equipado disputam o mesmo plano. O herói pode completar um componente mesmo com três espaços ocupados, preservando os outros dois itens.

**Combinar e equipar** executa uma recomendação. **Aplicar plano** executa todas, sem compras nem gasto de âmbar. A ação verifica se a formação, a bolsa ou o encontro mudou antes de consumir qualquer peça. Os próximos objetivos mostram alternativas, peças faltantes e custos; comprar um componente é uma decisão separada e atualiza as sugestões.

## Jornadas existentes

O formato de save passa de v9 para **v10**. Saves v1–v9 continuam aceitos. A migração de v9 conserva heróis, moedas, itens, ofertas e progresso. Como v9 não registrava a utilização por posição, suas cartas em aberto recebem uma troca gratuita cada, uma vez. O save v10 registra a utilização individual e recarregar não a restaura. Campos v10 ausentes ou inválidos não liberam uma utilização adicional.

## Validação

Testes cobrem todos os 13 possíveis guardiões iniciais, persistência, renascimento, migração, limites por carta, ausência de duplicados, reserva de componentes, conservação dos itens, aplicação individual e completa, receitas equipadas e rejeição de planos desatualizados. A revisão no navegador inclui desktop, celular e ações reais de compra, forja e distribuição.
