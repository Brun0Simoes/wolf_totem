# Wolf Totem 5.0 — Travessias do Encanto

Implementação de 12 de outubro de 2026, baseada na [pesquisa sobre variedade e progressão](PESQUISA-VARIEDADE-E-PROGRESSAO.md) e na [proposta das Travessias](PROPOSTA-TRAVESSIAS.md).

## Jogar

Abra **Travessias** na navegação ou pressione `5`. Escolha Akru, Nima ou Boru como guia e um dos três caminhos do Igarapé. O guia conduz a exploração; o elenco acolhido continua sendo a equipe de autochess.

- Clique no mapa ou em **Ir até o marco** para caminhar até a próxima interação.
- WASD ou setas permitem percorrer o caminho. `E` investiga uma pista próxima.
- Rastros e glifos apresentam sequências diferentes conforme a jornada. Não há cronômetro; a pista pode ser consultada.
- Escolhas de encontro mostram recompensas, desgaste e ameaça antes da confirmação.
- **Retornar** encerra a travessia e preserva descobertas, capítulos, XP e recompensas já recebidos.
- Pausa, redução de movimento e salvamento existentes acompanham o modo. Menus de encontro suspendem os controles de movimento.

## Conteúdo

| Sistema | Disponível |
| --- | --- |
| Exploração | Um bioma pintado, com câmera que acompanha o guia, caminhada animada, caminhos e seis marcos por rota |
| Rotas | Crista da matilha, Vozes do rio e Memória das ruínas |
| Dificuldade | Bruma desde o início; Correnteza após a expedição 5; Tormenta após a 10 |
| Interações | Dois desafios de sequência e seis eventos com escolhas |
| Afinidades | Seis efeitos possíveis, com duas vagas; uma nova escolha pode substituir a segunda |
| Combate | Dois encontros por travessia: defesa de altar e/ou ruptura de selos, com confronto final |
| Histórias | Dois capítulos por guia e seis especializações opcionais |
| Equipamento | Três receitas da margem, usando componentes existentes |
| Cenários | Quatro equipes convidadas de seis guardiões, com posições editáveis e atributos padronizados |

O tempo de 15–25 minutos da pesquisa era uma meta para uma exploração mais extensa. Este primeiro bioma tem um percurso compacto; a duração varia com leitura, preparação e confrontos. Não foram realizados testes de retenção com jogadores externos.

## Objetivos do autochess

### Proteger o altar

O altar fica atrás da primeira linha aliada. Ele pode receber ataques, cura e escudos. Invasores procuram a estrutura quando não há um defensor próximo cobrindo a passagem. A vitória acontece ao eliminar os combatentes inimigos ou preservar o altar por 45 segundos. A queda do altar encerra o confronto em derrota.

### Romper os selos

Destrua as três estruturas em até 65 segundos. A condição de vitória considera os selos; inimigos combatentes podem continuar vivos. O plano **Romper selos** muda a prioridade de alvos da equipe. O plano **Alvo próximo** permite enfrentar os defensores primeiro.

### Ameaças anunciadas

A cada 12 segundos, um conjurador prepara uma onda, com aviso de dois segundos. Interromper ou eliminar a fonte cancela o impacto. Selos restantes determinam a força da onda de seu confronto. O campo apresenta as estruturas e os adversários antes de iniciar, e o indicador mostra vida do altar, selos restantes e tempo do objetivo.

A vida das estruturas depende da dificuldade escolhida. Aumentar o nível dos guardiões ou acrescentar um aliado não aumenta a vida dos selos nem reduz a do altar. Os cenários usam valores fixos para preservar o desafio de posicionamento.

## Progressão e economia

XP individual e ritualística continuam sendo as duas barras do despertar. Estrelas, draft e limite de formação seguem as regras anteriores. As Travessias não acolhem cópias ou concedem novos heróis por fusão.

Primeiras descobertas concedem um conhecimento e uma pequena quantidade de XP para a formação. Batalhas concedem XP, âmbar e o componente da rota; derrotas concedem XP reduzido. Repetir uma dificuldade muito abaixo da fronteira reduz os ganhos, como na campanha.

O bônus da primeira vitória fica registrado por rota, dificuldade e encontro. Retornar antes do confronto final não permite receber novamente esse bônus. Recompensas de interações também exigem alcançar o marco e avançam a etapa apenas uma vez.

As histórias abrem especializações gratuitas para Akru, Nima e Boru. Cada uma tem uma vantagem e uma concessão. A escolha pode ser retirada ou trocada entre combates e aplica-se ao guardião quando acolhido. Afinidades e ameaça encerram no retorno; descobertas, capítulos, receitas, especializações e cenários vencidos permanecem após o reset. O primeiro renascimento continua liberando o Véu da Noite.

Os guias têm apoios distintos: Akru marca o primeiro adversário, Nima reduz o desgaste e Boru fortalece o altar. Eles não acrescentam uma unidade à equipe de combate.

## Receitas

| Equipamento | Descoberta | Componentes | Funcionamento |
| --- | --- | --- | --- |
| Presa do Igarapé | Forja da Crista | Presa + Arco | O terceiro ataque marca o alvo |
| Eco do Igarapé | Forja do Rio | Pena + Raiz | Cura excedente vira escudo, com limite |
| Pedra da Vigília | Forja das Ruínas | Couro + Manto | Absorver dano com escudo protege um aliado próximo |

Forjar exige os componentes na mochila e a receita descoberta. O resultado é equipado no Arsenal. As 21 combinações básicas e as seis relíquias existentes continuam disponíveis.

## Cenários táticos

**A última margem**, **Três selos, uma saída**, **A vigília da seda** e **As ruínas silenciosas** estão disponíveis permanentemente. O jogador posiciona seis personagens convidados em 28 casas; casas ocupadas trocam unidades.

Níveis, legados, memórias, rituais, itens e poderes do elenco permanente não aumentam a força dessas equipes. Os cenários preservam os heróis, a formação principal, o inventário e a carteira. A primeira vitória concede um conhecimento; repetições permitem experimentar posições.

## Interface e arte

O modo usa uma paisagem própria, materiais de floresta e pedra, tipografia com hierarquia e controles contextuais. A câmera preenche o campo e acompanha o guia. No celular, os controles são compactos e as informações secundárias ficam nas abas. O conselheiro do confronto apresenta três sugestões relacionadas ao objetivo, e a recomendação existente recebe os adversários da travessia durante a preparação.

Os personagens reutilizam seus atlas e ilustrações atuais. A paisagem foi gerada com a ferramenta integrada **image_gen**, inspecionada e copiada para `public/assets/travessias/igarape.webp`. Nenhuma arte de personagem foi substituída.

### Prompt da paisagem

> Use case: stylized-concept. Asset type: production background for the Wolf Totem 2D exploration game, landscape 1536x1024 or similar landscape. Create an exquisite hand-painted semi-realistic top-down forest adventure map, fixed high bird's-eye camera, no horizon, like a premium illustrated strategy game environment, not pixel art. An ancient tropical igarape river runs vertically near the center, dense olive and emerald tropical forest frames the edges, beautiful mossy rocks, warm amber sun shafts, shallow turquoise water. Walkable pale earthy paths weave through broad clearings on both sides, linked by one weathered log footbridge around the middle. Three distinct routes: forest ridge left, riverbank middle, mossy stone ruins right. A large clearing bottom center for the expedition starting point; a sacred circular stone clearing upper center for the final encounter, three smaller stone/wood landmarks throughout. Composition must provide unobstructed walkable open ground and visible branch paths for an animated player sprite and interactable markers. Painterly brushwork, detailed vegetation, atmospheric mist, restrained mystical golden glimmers, strong ground readability. Environment only, no characters, no UI, no symbols floating in air, no labels, no letters, no text, no watermark. Entire rectangular image filled, opaque background. Fantasy primal spiritual theme. Avoid modern buildings, castles, HUDs or generic clip art.

## Saves e validação

O formato passa a **v12**. Saves v1–v11 continuam migrando. A rota, a semente, as escolhas, as afinidades e a posição ficam no save. Um combate interrompido retorna à preparação; vitórias já recebidas e interações concluídas não são concedidas novamente.

Os testes cobrem decisões inválidas, distância das pistas, retomada, recompensas únicas, objetivos reais, cenários padronizados, receitas, especializações e persistência após renascimento. Simulações completas verificam as três rotas com uma formação inicial equilibrada e diferentes posições para os quatro cenários.

### Verificação da entrega

- `npm test`: **20 arquivos e 450 testes passaram**.
- `npm run build`: TypeScript e compilação de produção passaram.
- As três rotas foram concluídas pela simulação real. Os quatro cenários têm posições vencedoras; a mesma equipe pode vencer ou perder conforme a distribuição nas casas.
- Pela interface, uma jornada nova concluiu pistas, eventos, defesa de altar e ruptura de selos. Recarregar preservou recompensas, receita e capítulo concluído. A escolha de especialização e um cenário com equipe convidada também foram verificados.
- Desktop de 1280 × 720 e celular de 390 × 844: sem corte horizontal; três afinidades visíveis; seis atalhos na navegação móvel; ações principais de combate e cenário acessíveis sem procurar no fim da página.
- O teste encontrou um erro WebGL ao iniciar o mapa oculto. O mapa agora inicia quando visível e ignora redimensionamentos de tamanho zero. As trocas de tela verificadas após a correção não geraram novos erros.

Capturas: [mapa](qa/travessias/mapa-desktop.jpg), [afinidades no desktop](qa/travessias/afinidades-desktop.jpg), [afinidades no celular](qa/travessias/afinidades-mobile.jpg), [combate por objetivo](qa/travessias/combate-objetivo.jpg), [cenário completo](qa/travessias/cenarios-desktop.jpg), [preparação móvel](qa/travessias/preparacao-mobile.jpg) e [cenário móvel](qa/travessias/cenarios-mobile.jpg).

O escopo entregue é o Igarapé e sua biblioteca de cenários. Ondas como condição de vitória própria, escolta, outros biomas e histórias de todo o elenco são expansões posteriores; o combate atual já utiliza ondas anunciadas como ameaça dos objetivos implementados.
