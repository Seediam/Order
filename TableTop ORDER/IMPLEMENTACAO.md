# Registro de implementação — ORDER 0.1

Esta entrega é uma base jogável com funcionalidades reais, não a implementação integral de todas as regras avançadas do escopo. O código está organizado para continuar o trabalho sem reconstruir a fundação. Os livros originais permanecem intactos.

## Implementado

| Etapa           | Estado desta versão                                                                                                                                                                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Fundação     | React/TypeScript/Vite, Express, SQLite/Prisma, cadastro e login, cookies HttpOnly, código de Mestre no servidor, intro SVG animada, dashboard persistido e campanhas independentes.                                                                                           |
| 2. Multiplayer  | Socket.IO autenticado, membros de campanhas, presença, chat, ações serializadas, estado filtrado por usuário, reconexão e recuperação do estado.                                                                                                                              |
| 3. VTT          | React Konva, backgrounds proporcionais, quantidade inicial de salas, regiões retangulares/poligonais, paredes, portas horizontais, células bloqueadas, desenho e marcações persistidos, tokens, caminho ortogonal mínimo, zoom/pan, minimapa, visibilidade por sala e hotbar. |
| 4. Visual Novel | Backgrounds e retratos próprios, falas com digitação, avanço pelo Mestre, editor de sequência, escolhas com condições simples, consequências persistidas e transição entre cenas.                                                                                             |
| 5. Deckbuilder  | Fichas de Searcher, setores e pecados, 20 Ações validadas, mínimo de 12 do Setor, máximo de 2 cópias, Formação separada, compra/descartes, banimento, equipamentos e recarga. Editor de cartas e teste isolado em cópia da cena.                                              |
| 6. Combate      | Iniciativa d20, turnos, compra 3+2 inicial e 1+1 nos turnos seguintes, movimento e queima, d6 de ativação, d20 de acerto, efeitos declarativos Hells/Cómum, dano/escudo/cura/Incisão, ataque mascarado e leitura no fim do turno, pausa e encerramento.                       |
| 7. Conteúdo     | O Fabricante de Brinquedos, sete cenas, mapa original de nove salas, Augusto Vilar, escolhas com custo real, catálogo demonstrativo dos cinco Setores, ranking e referências de Portões.                                                                                      |
| 8. Acabamento   | Design system, animações reduzíveis, sons sintetizados, ambiente compartilhado por upload, biblioteca persistente com thumbnails, documentação Hamachi, iniciador Windows, testes de regras/integração/navegador.                                                             |

Mãos de outros jogadores são removidas antes de gerar respostas HTTP e eventos Socket.IO. O Mestre só pode inspecioná-las por uma rota específica, com autorização explícita da campanha e auditoria. O modo de passar dispositivo cobre a mesa e exige troca real de conta.

Desfazer/refazer mantém até 20 edições administrativas consecutivas na memória do servidor. Uma ação de jogo ou outra operação encerra esse histórico para evitar restaurar um snapshot que apague ações posteriores. O histórico de desfazer não sobrevive a reinício; o estado da campanha sobrevive.

## Verificação executada

- `npm run build`: TypeScript, frontend e backend compilados.
- `npm test`: 22 testes aprovados. Cobrem decks, Formação, preparação/compra, dados, paredes/portas, ocupação, movimento, queima, Pistola, Papel e Caneta, personagens caídos, permissões, privacidade, escolhas, API, dois clientes Socket.IO, reconexão, uploads e reinício com o mesmo banco.
- `npm run test:e2e`: um fluxo aprovado com dois contextos de Chromium independentes. Cobre introdução, contas Mestre/Procurador, campanha, ficha, mão privada, criação de cena com nove salas, desenho da região no canvas, upload de imagem interna e escolha narrativa que altera Sanidade/Fame/Confiança no segundo navegador.
- Auditoria de dependências: zero vulnerabilidades conhecidas no momento da instalação/verificação.
- A conexão com uma rede Hamachi real e as regras de firewall da máquina **não foram verificadas**. O manual inclui o teste TCP que o grupo deve executar.

Os testes usam dados temporários ou `.runtime/e2e`; nenhuma conta demonstrativa é pré-instalada no banco principal. A senha pessoal deve ser definida no primeiro cadastro real.

## Pendências explícitas

1. **Regras completas do livro:** passivas de Setores/Pecados, equivalências das perícias, bônus permanentes, Último Recurso, socorro, morte em duas rodadas, cicatrizes, condições temporárias e rituais de Julgamento. Efeitos digitados na ficha são registros; sua duração e consequências ainda são adjudicadas pelo Mestre.
2. **Catálogo integral:** as cartas de Setor são variantes simplificadas identificadas como demonstração. Falta automatizar as habilidades específicas do livro, gatilhos, cancelamentos, empurrões, trocas de posição, área de efeito, múltiplos alvos, cooldowns de cartas e reações gerais. O inventário ainda se limita à seleção dos equipamentos iniciais na ficha, sem catálogo de posse ou trocas. O ataque mascarado já aplica automaticamente Antecipar quando a leitura acerta; a escolha manual de reação e sua configuração ainda não existem.
3. **Mapas avançados:** portas verticais/rotacionáveis, travas e arrombamento, paredes com edição por vértices, corredores com custos diferentes, regiões especiais, seleção múltipla, borracha de desenhos/paredes e fog por campo de visão. A ferramenta atual de borracha alterna células bloqueadas; o fog atual é por sala.
4. **Cenas e narrativa:** editor por grafo, condições compostas, teste de roteiro sem salvar, expressões de retrato, objetos/eventos interativos, fichas próprias de NPC e posições independentes por cena. Atualmente os personagens e suas posições são compartilhados entre cenas.
5. **Combate avançado:** reordenar iniciativa pela interface, inserir participante após iniciar encontro, cronômetro, controle mais amplo de NPCs/inimigos e automação de vitória/contrato/recompensa. O Mestre controla os NPCs selecionando seus tokens. Um personagem a 0 Vida não pode agir, mas pode encerrar o turno.
6. **Progressão:** Portões e ameaças aparecem como referências; editar patamares, desbloquear encontros/contratos e aplicar melhorias de promoção ainda precisam de interface e regras.
7. **Áudio:** um canal de ambiente sincronizado e controle de efeitos estão ativos. Música independente, múltiplas trilhas simultâneas, mixagem de zonas e sincronização precisa por relógio do servidor estão pendentes.
8. **Operação:** testes reais em Hamachi, múltiplas máquinas, acessibilidade com leitor de tela e carga prolongada. O layout móvel compacto oculta painéis laterais; a experiência completa de edição é destinada a desktop.
9. **Manutenção:** migrações versionadas do documento de campanha, exportação/importação pela interface, recuperação de senha, gestão de membros/convites fechados e testes mais extensos de todos os editores.

## Próxima sequência recomendada

Concluir as regras determinísticas do livro com testes antes de adicionar novos efeitos; depois melhorar edição geométrica e fluxo de reações. Validar em duas máquinas Hamachi antes de uma sessão longa. Preserve `data/` e o contrato de filtragem em `server/view.ts` em qualquer continuação.
