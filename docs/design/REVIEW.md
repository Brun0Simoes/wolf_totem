# Jornada 2.0 — direção visual e verificação

## Referências e resultado

Os conceitos `village-concept.png` e `ritual-concept.png` foram gerados antes da implementação. Os arquivos `village-final.jpg` e `hero-final.jpg` mostram o jogo funcionando; `mobile-ritual.jpg` e `mobile-formation.jpg` registram as verificações em 390 × 844.

| Ponto do conceito | Implementação e conferência |
| --- | --- |
| Mata pintada, água e clareira central | Terreno raster próprio, com construções em frames transparentes separados. Árvores adicionais foram reduzidas para abrir a clareira. |
| Superfícies escuras com cobre e verde ritual | Tokens em `src/journey-ui.css`: fundo `#101b20`, destaque `#d9b479`, ritual `#75cfbb`. |
| Navegação horizontal com cinco destinos | Aldeia, Tribo, Expedições, Rituais e Códice. No celular, navegação fixa na base. |
| Mapa principal e uma ação contextual à direita | Painel recolhível, com construção selecionada, produção, melhoria e designação de trabalhadores. Coleta manual fica em detalhes expansíveis. |
| Faixa de objetivo e companheiros abaixo do mapa | Objetivo fora do painel, retratos dos heróis existentes e duas barras. Percentuais nos retratos mantêm os valores legíveis; o painel do herói mostra XP exato. |
| Experiência e ritualística visualmente distintas | Barras âmbar e verde, com nomes, níveis e requisitos de despertar. Conferidas no computador e no celular. |
| Uma cerimônia selecionada de cada vez | Rapé, sananga, kambô, ayahuasca e cacau em seletor, com duração, XP, custo e bloqueios explícitos. |

## Diferenças intencionais

- A ilustração grande do conceito ritual foi distribuída entre o painel animado do herói e a tela de ritos. A tela ritual mantém mais espaço para requisitos e controles; usa os personagens já produzidos no projeto.
- A marca e os ícones existentes foram preservados. Os valores de recursos e XP vêm do estado real da jornada.
- No celular, o painel da aldeia começa recolhido. Formação usa casas clicáveis e uma ação de organização por função. Quando o painel de combate está recolhido, iniciar a expedição continua disponível na faixa de objetivo.
- A geometria de ataques, áreas e linhas de habilidade continua calculada pelo Phaser. Sprites pintados acrescentam impacto, corte, projétil, escudo, cura, invocação, poeira e conjuração, com limites de 24 imagens e 48 gráficos simultâneos.

## Texto do conceito e texto final

- Preservados: “Clareira do Lobo”, “Sua tribo cresce entre a mata e os espíritos.”, “O caminho do despertar” e “Atividades fortalecem o corpo. Cerimônias aprofundam o vínculo.”
- “Próxima evolução” virou “Próximo despertar”, acompanhando a regra de duas progressões. Os níveis e números ilustrativos foram substituídos pelas regras reais: 2★ em 8/3; 3★ em 24/8 e ayahuasca concluída.
- Textos fictícios gerados nas imagens não foram usados como descrições de práticas. A interface usa os efeitos e o contexto já definidos nos dados do jogo.
- “Acolher companheiro” comunica aquisição única. O catálogo mostra era e vínculo ritual, sem renovação de ofertas ou compra de cópias.

## Validação realizada

- **254 testes em 9 arquivos passaram.** Incluem progressão independente, migração de saves, equipamento, combate, limitações de recrutamento, integração de ritos e retorno de trabalhadores.
- **Build de produção aprovado**, incluindo TypeScript e Vite.
- Teste de ritmo: duas visitas por dia, produção normal da aldeia, Akru trabalhando e ritos adequados à era. Primeiro 3★ em **6 dias**. Essa é uma rotina de referência, não uma garantia para todas as escolhas.
- Browser QA em 1440 × 960 e 390 × 844: catálogo e busca, aquisição única, painel do herói, construir Casa de Cura, iniciar cerimônia, reserva, reposicionamento e formação automática.
- Build servido separadamente em `127.0.0.1:4174`, com jornada nova: abertura do guia, Akru 1★, designação direta ao trabalho, XP avançando e requisitos 8/3 visíveis. Nenhum erro ou aviso no console de produção.
- Combate real com o Alfa Cinzento e novos efeitos; nenhum erro ou aviso observado no console. A arena conserva seus cenários procedurais.
- Na largura móvel verificada, o documento não apresentou excesso de largura: `scrollWidth` e `clientWidth` iguais. A tela de ritos usa rolagem vertical e o grupo de heróis usa rolagem horizontal.
- Arrastar no canvas foi implementado, mas esta revisão verificou o reposicionamento por casas e a organização automática. Não foi medido desempenho em aparelho físico.

## Assets

Os PNGs de produção foram copiados sem alterar pixels. Os limites de alpha foram medidos apenas para definir frames. Origem, hashes e briefs estão em `production.json`. As artes originais em `chars` permanecem intactas.

## Ampliação RTS e conselheiro — 7 de outubro de 2026

- População própria, distribuição de ofícios, reserva de construtores, fila de obras e treinamento, cinco infraestruturas, oito territórios, quatro pesquisas e seis marcos integrados à economia. A vista territorial usa terreno contínuo gerado, névoa e postos ligados ao estado persistido.
- Conselheiro com seis funções táticas, 31 laços, prioridades, formação sugerida, trocas com ganhos e perdas, itens e receitas da bolsa e orientação contra o próximo inimigo. Guia do herói e preparação da expedição também abrem esse conselho.
- 283 testes em 11 arquivos passaram; build TypeScript/Vite concluído. A referência de duas visitas diárias continua chegando ao primeiro 3★ em seis dias. As 18 verificações novas cobrem a economia RTS, filas, fronteiras, persistência e recomendações.
- Jornada nova no navegador: preparar aldeão, construir moradia, reconhecer e ocupar o bosque, pesquisar ferramentas, receber marcos, acolher companheiros e aplicar uma formação. População passou de 4/6 para 5/10 após a moradia na Era I.
- Build de produção em `127.0.0.1:4181`: importação pela interface de um cenário isolado v4 da Era II, com cinco heróis e quatro componentes. Migração inicial para quatro aldeões e oito vagas; construção de moradia, reconhecimento, posto e roça no terreno liberado, pesquisa e formação com quatro heróis. O cenário serve para QA e não representa a jornada original do usuário.
- Receita Escudo Totêmico criada com Couro Curtido e Pena Sagrada; item equipado e confirmado no painel de Akru. Durante uma expedição real, aplicar formação, trocar companheiros, equipar e combinar ficaram desativados. Ao terminar a luta, o conselho atualizou e liberou os comandos automaticamente. Nenhum erro ou aviso observado no console do build final.
- Seleção direta do igarapé no canvas abriu seus comandos. Controles equivalentes também funcionam no painel. Desktop e largura de 390 px verificados; largura do documento igual à largura disponível no celular, sem transbordamento horizontal. Trocar o laço manteve a rolagem do guia em 1.688 px.
- As figuras dos aldeões e parte das construções novas reaproveitam desenho procedural e props existentes. Expansão usa setores e terrenos definidos; não há movimentação livre de exércitos ou combate de unidades no mapa territorial.

Regras, limitações e prompt do novo terreno: [Aldeia RTS](../ALDEIA-RTS.md). Evidências: [território](rts-territory.png), [aldeia](rts-village.png), [conselheiro](rts-coach.png), [guia móvel](rts-coach-mobile.png).
