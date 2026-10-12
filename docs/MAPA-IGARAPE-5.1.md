# Wolf Totem 5.1 — Igarapé construído

O cenário das Travessias foi refeito como um mapa do jogo. A imagem única da versão 5.0 foi retirada do pacote publicado. Terreno, pontes, árvores, rochas, ruínas e marcos agora são construídos em Phaser a partir de dados próprios. Os personagens mantêm seus sprites e animações existentes.

## Explorar

- Clique numa área livre para escolher seu destino. O guia procura uma passagem ao redor dos obstáculos.
- Use WASD ou setas para caminhar manualmente. Os mesmos limites de terreno se aplicam.
- Água profunda, penhascos, troncos, rochas e estruturas bloqueiam a movimentação. As pontes unem as margens.
- **Ir até o marco** calcula um caminho até a próxima interação. Aproximar-se libera a ação contextual; `E` interage.
- Os controles **+**, **−** e **Centralizar no guia** ajustam a câmera.
- Clicar na água ou num obstáculo apresenta uma indicação de passagem bloqueada.

O mundo contém as três rotas do Igarapé. A rota escolhida determina os encontros, as recompensas e os seis marcos ativos. O jogador pode caminhar pelas áreas transitáveis do cenário.

## Construção e apresentação

O nível mede 1536 × 1024 unidades e tem uma grade de 48 × 32 células. Cada célula registra seu tipo de terreno e se permite passagem. Grama, terra, caminho, pedra, penhasco, água e ponte possuem aparência própria. A distribuição é determinística e permanece igual após recarregar.

As árvores, pedras e paredes das ruínas são objetos independentes. A posição no chão determina a ordem de desenho; o guia passa na frente ou atrás deles. Objetos altos ficam transparentes quando encobrem o personagem. Tendas, oferendas, pegadas, altares e pedras gravadas identificam as interações. O mapa possui 16 locais físicos, incluindo o destino final compartilhado pelas três rotas.

A água tem correnteza animada; fogueiras, faíscas e vaga-lumes dão movimento ao ambiente. Pausa e movimento reduzido acompanham o modo. Nenhuma foto ou ilustração de fundo compõe o mapa.

No celular, a altura do campo mantém a ação contextual acima da navegação. As três afinidades continuam visíveis juntas. Os controles da câmera têm nomes acessíveis e o campo descreve o marco atual.

## Navegação e saves

A busca A* usa vizinhos nas oito direções e impede atalhos diagonais entre células bloqueadas. A movimentação percorre o segmento em passos pequenos; comandos longos também param na borda dos obstáculos.

Saves continuam no formato v12. A posição livre é preservada. Se uma posição antiga cair dentro de uma estrutura nova, o carregamento coloca o guia no terreno livre mais próximo. Histórias, receitas, afinidades, etapas e recompensas permanecem.

## Validação

`npm test`: **21 arquivos e 455 testes passaram**. `npm run build`: TypeScript e compilação de produção passaram.

- A suíte verifica todos os marcos das três rotas, percorrendo os caminhos reais e conferindo cada posição.
- Testes de rio, ponte e canto bloqueado confirmam que o personagem não atravessa água nem corta obstáculos.
- Saves com posições livres e posições antigas na água foram carregados e verificados.
- Pela interface, foram testados destino livre, aviso ao clicar na água, zoom, rastros, evento, navegação pela ponte e chegada ao altar.
- Desktop de 1280 × 720 e celular de 390 × 844 foram inspecionados. O campo móvel não tem corte horizontal e a ação contextual fica acima da barra de navegação.
- Capturas: [desktop](qa/mapa-construido/desktop.jpg) e [celular](qa/mapa-construido/mobile.jpg).

Código: `src/game/crossingLayout.ts` define o desenho do nível; `src/game/crossingMap.ts` contém terreno, colisão e navegação; `src/render/CrossingEnvironment.ts` constrói os elementos visuais; `src/render/CrossingScene.ts` liga câmera, entrada e animações ao mapa.
