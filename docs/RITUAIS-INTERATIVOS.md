# Participação nos rituais

As interações representam gestos simbólicos do universo do jogo. As cinco experiências usam um modelo puro em `src/game/ritualPlay.ts`, uma apresentação descartável em `src/ui/RitualExperience.ts` e efeitos Web Audio em `src/audio.ts`.

| Cerimônia | Interação | Controle | Sonoridade do jogo | Bônus máximo |
| --- | --- | --- | --- | --- |
| Rapé | Três sopros; soltar a energia na faixa iluminada | Segurar e soltar o botão ou Espaço; opção por dois toques | Vento filtrado e sementes | +18 XP ritual |
| Sananga | Alinhar quatro círculos com o anel de foco | Toque ou Espaço | Gotas e notas ressonantes | +36 XP ritual |
| Kambô | Memorizar e repetir sequências de 3, 4 e 5 pedras | Quatro botões ou teclas 1–4 | Tambor grave e madeira | +90 XP ritual |
| Ayahuasca | Manter a luz dentro do rio por 18 segundos | Arrastar, segurar botões ou setas do teclado | Notas sobrepostas e água | +180 XP ritual |
| Roda de cacau | Acertar oito pulsações | Toque ou Espaço | Batida dupla e chocalho | +12 XP ritual por membro elegível |

## Regras de progressão

- Sintonia é a média dos acertos, entre 0 e 1. Na ayahuasca, é a proporção de tempo dentro do rio.
- Bônus = arredondar(XP base × 0,2 × sintonia). Valores inválidos não concedem bônus.
- A preparação não cobra recursos nem altera o herói. Ao confirmar, a simulação verifica novamente recursos, nível, era, atividade, requisitos e integração. Se algum requisito mudou, a cerimônia não começa.
- Fechar ou recarregar durante a preparação cancela somente o minigame. É possível abrir uma nova preparação. Não há XP concedido antes da confirmação.
- Seguir automaticamente inicia uma cerimônia com o XP base. Uma preparação incompleta nunca reduz o XP base.
- O bônus individual fica em `HeroAway.participationXp` no save 4 e é concedido uma vez, ao fim da cerimônia, inclusive offline. Saves antigos sem esse campo recebem bônus zero. O carregamento limita valores ao máximo da prática.
- A roda de cacau concede o bônus imediatamente aos membros disponíveis que concluíram a integração, junto com seu XP base. A bênção ativa impede repetir a mesma roda.
- A participação não encurta a cerimônia, as 3 horas de integração ou os requisitos de 2★ e 3★.

## Controles, movimento e áudio

Modo tranquilo amplia as janelas de acerto e a largura do rio. O botão de pausa interrompe os gestos e os sons da participação; perder o foco ou esconder a página também pausa e exige retomar. Soltar um gesto ao pausar não dá pontuação. Fechar a janela remove os listeners e cancela sua animação.

O movimento reduzido retira a flutuação decorativa, mantendo os indicadores necessários ao jogo. As cerimônias continuam jogáveis com o áudio desativado. Os sons são sintetizados originais, sem gravações ou imitações de cantos tradicionais. O volume de efeitos controla a participação; a música da aldeia fica mais baixa durante o minigame e volta ao fechar.

## Verificação

`tests/ritual-play.test.ts` verifica sopros e soltura, alinhamento, memória e bloqueio durante a demonstração, pulsações perdidas, condução do rio, timeout, valores inválidos, requisitos, preservação de recursos, save antigo, limite de bônus e concessão única offline. A suíte de progressão mantém a referência de primeiro 3★ em 6 dias com duas visitas por dia, no modo automático.

Teste manual pelo navegador usa uma jornada fictícia em uma origem local separada. Evidências incluem três sopros completos, pontuação de foco pelo teclado, memória completa com 100% de sintonia e oito pulsações da roda de cacau. Ao confirmar a roda, o membro disponível recebeu 62 XP ritual (60 base + 2 de participação); o membro em cerimônia permaneceu com o XP anterior. A condução do rio foi conferida por setas e toque, e a suíte pura verifica a pontuação por tempo de alinhamento.

A versão de produção foi conferida em 390 × 844, sem transbordamento horizontal, com opções e controles acessíveis. Não foi usado microfone. O navegador não registrou erros durante os cinco fluxos. A jornada principal do usuário foi preservada. As imagens estão em `docs/design/ritual-*.png`.
