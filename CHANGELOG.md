# ORDER V0.4.3 — Mini tutorial e comunidade

- Chefe: 6 de Vida, ataques de 1–2 e escudo de 1. Mais próximo no início do combate.
- D6 ativa em qualquer face; D20 acerta a partir de 2. Dificuldade ajustada também no save de combate em andamento.
- Vitória retorna ao olho. Clique revela convite do Discord; o julgamento pode ser relido a partir dessa tela.
- Convite: https://discord.gg/xVDAPBVTTz. Abertura somente por clique no botão.
- Pequenas correções de compra com mão cheia, dano exibido, timers de cena e texto vazio.
- Alterações somente no offline; animações lentas mantidas. Apenas conferência de sintaxe, sem executar testes de jogo.

## Ajuste do ritmo do combate

- Preparação de 420 ms antes do lançamento; projétil de 1,1 s.
- Flash de dano de 1,2 s e números/resultado visíveis por 2 s, com pausa antes da próxima ação.
- Erros e falhas também aguardam a leitura; feedback de texto mantém o tempo de leitura com movimento reduzido.
- Cartas, compra, passos e início do turno inimigo desacelerados. Mudanças apenas no offline; nenhum teste executado.

# ORDER V0.4.2 — Offline: arquivo, mapas e combate visual

- Fonte das fichas ajustada à referência “Estojo de chaves”; logo PNG na abertura e cabeçalho.
- Cadastro e documentos com papel envelhecido, retrato, carimbo e campos pautados; retirada de altura forçada e de rolagem horizontal no formulário.
- Mapa da igreja alinhado a nove cômodos clicáveis, com rotas pelos corredores e três áreas de exploração adicionais.
- Novo background da arena do Hells; arena aberta e grade discreta sobre a arte.
- Efeito mágico sai do personagem ao atacar; auras de cura, defesa e movimento; falhas e bloqueios diferenciados.
- Flash vermelho e número de dano apenas quando há perda de Vida. Efeitos externos ao render da cena; resolução de combate protegida contra cliques concorrentes.
- Atalhos manuais de Ataque e Dano no laboratório local.
- Alterações restritas ao offline. Tabletop e suas campanhas não foram alterados nesta etapa. Nenhum teste executado, conforme solicitado.

# ORDER V0.4.1 — Integração visual

- Personagem à direita voltado para o centro nas Visual Novels; camada de espelhamento separada da respiração.
- Seleção por retratos verticais sobre preto com degradê rosa, sem painel externo no prólogo; criação equivalente no Tabletop.
- Fontes locais Cinzel Decorative, IM Fell English SC e Cormorant Garamond integradas aos dois projetos.
- Backgrounds PNG específicos por área da igreja e do Hells no prólogo; biblioteca de cenários e personagens disponível nos editores do RPG.
- Eco e Guardião com sprites na narrativa, no combate e nos tokens. Searchers usam suas artes infernais no Hells.
- Remoção da opção e do mecanismo de voz sintetizada do prólogo.
- Recorte dos rostos dos tokens no Tabletop; aparência escolhida salva no personagem e convertida para arte de Visual Novel conforme o território.
- Build do cliente e servidor do Tabletop gerado. Testes de jogo não executados nesta atualização a pedido do usuário.

# ORDER V0.4 — O Pecado da Misericórdia

## Animações e interface

- SVG do olho com contorno aberto, recorte da íris, reflexos e cursor. A abertura anima o recorte; o desenho inteiro conserva a proporção.
- Controlador `Cinematics` em `animations.js`: olho, digitação, foco do personagem, respiração, luz, fade, transições, caminhada e eventos de terror.
- Texto por caractere com pausas, suporte a acentos e reticências. Primeiro clique completa a fala; o segundo avança quando há uma única continuação. Escolhas ficam `inert` durante a digitação.
- Som, voz e efeitos atualizam o cabeçalho sem recriar o diálogo. A respiração conserva seu tempo entre falas com o mesmo retrato.
- Caminhada por caminho válido, uma célula por vez; atualiza posição e custo após cada passo e bloqueia ações concorrentes.
- Transições de escurecimento; piscadas na chegada ao Hells; eventos narrativos de luz, silhueta e porta.
- Layout de uma viewport, cartas em leque sobre a borda inferior e indicadores de Vida, Moral e Sanidade. Telas de documento e dossiê usam rolagem interna para leitura.
- Preferência de movimento reduzido, opção de ativar efeitos, volume e velocidade do texto.
- Mão com sete cartas mantém o botão de encerrar turno acessível; leque cabe no celular.
- Tratamento legível de erros críticos de script e inicialização.

## Imagens fornecidas

- Seleção e tokens: `assets/Man.png` / `assets/Woman.png`.
- Visual Novel: `assets/Man_Visual.png` / `assets/Woman_Visual.png`.
- Elvira: `assets/Euvira.png`; transformação e combate: `assets/Euvira_Demon.png`.
- Arquivos originais preservados. Recorte dos rostos dos tokens feito por CSS. Expressões sem arte própria usam apenas luz e enquadramento; o sistema aceita novos caminhos em `ASSETS`.

## Campanha

- 44 cenas com chegada, hospitalidade, conversa, criança protegida, arquivos, contradições, quarto fechado, julgamento e Hells.
- Oito registros originais com identificação, local, pessoas, conteúdo, contradições e flags. Comparação lado a lado e perguntas registradas no dossiê.
- Postura agressiva, desculpas, escuta e testemunho influenciam respostas. Compaixão fundamentada pode aumentar Confiança.
- Cobrar, poupar e adiar geram encontros e desfechos próprios. Poupar preserva Elvira na Terra: o combate é contra o Eco do Contrato. Adiar leva ao Guardião do Prazo.
- Retorno ao Hells reconhece o Searcher como humano morto e condenado ao serviço. A identidade da voz permanece oculta.
- Save V0.4 separado do save anterior, mantido intacto no navegador. Prévias e laboratório não gravam progresso.

## Combate e entrega

- Deck de 20 cartas; três na mão inicial (Relação: quatro); compra por turno, descarte, limite de sete e queima que bane a carta até o fim do encontro.
- D6 ativa somente os resultados impressos; D20 resolve acertos. Pistola persistente de alcance 2 e dano fixo +2; configuração própria para futuras armas.
- Papel e Caneta retorna após dois turnos próprios.
- Chefe com golpe, área anunciada, defesa, ataque psicológico e manifestação visual na fase final. Proteção progressiva após falhas, sem ativar resultados inválidos de D6.
- Laboratório somente em localhost com `?dev=1`.
- Testes de navegador e simulações em `tests/`. Publicação estática exclui dependências e evidências de testes.
