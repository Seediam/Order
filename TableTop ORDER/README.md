# O R D E R — Virtual Tabletop

VTT local para o RPG ORDER: investigação, julgamento de almas, cenas narrativas e combate com cartas. Interface em português, servidor autoritativo e armazenamento no computador anfitrião. Versão **0.1**, funcional e expansível; veja os limites em [IMPLEMENTACAO.md](IMPLEMENTACAO.md).

## Novidades da V0.5

- **Cartas reais.** O catálogo demonstrativo foi trocado pelas 50 cartas ilustradas (e as 8 de Doutrina do livro), geradas de `../cards.js` em `shared/order-cards.ts`. A arte é a própria carta na mão e na biblioteca. Decks prontos do cap. 11.3. Campanhas antigas são migradas sozinhas ao abrir: recebem as cartas novas e os Searchers ganham o deck pronto do Setor.
- **Dados 3D sincronizados.** O servidor registra cada D6/D20 (ativação, acerto, ataque mascarado, iniciativa, testes) e todos os clientes veem a mesma rolagem em 3D (`public/dice3d.js`). No chat, rolagens aparecem como cartões, com botão para rever em 3D.
- **Bandeja de dados** flutuante no canto do mapa (estilo Roll20): D6, D20 com DT rápida (10/13/16/19/22) e Formação +2.
- **Iniciativa com retratos e barra de Vida** (estilo Owlbear).
- **Cena "Santa Cecília · Planta (Clue)"** na campanha demonstrativa: a arte da igreja com 9 salas, paredes, portas e corredores alinhados (as mesmas coordenadas do prólogo). Salas ficam transparentes sobre mapas com arte.
- **Pistola com alcance 2**, como na carta.

Os efeitos numéricos das cartas são automáticos; condições (Sob Julgamento, Guarda, Autos, Laços, escolhas A/B) estão no texto da carta e ficam com o Mestre.

## Artes e fontes compartilhadas com o prólogo

A criação de Searcher começa pela seleção de um personagem vertical sobre fundo preto com degradê rosa. A aparência fica salva no personagem. Nas Visual Novels, as aparências fornecidas mudam para a arte de corpo inteiro e, no território Hells, para a forma infernal. O retrato da direita olha para o centro.

A biblioteca **Escolher arquivo** inclui personagens, Elvira, Eco do Contrato, Guardião do Prazo e nove cenários. Use-a na ficha do personagem, no roteiro, nas configurações da cena ou na imagem de uma sala. Essas artes já acompanham o jogo; não precisam ser enviadas por upload.

As fontes são locais: **Cinzel Decorative** para títulos e Setores, **IM Fell English SC** para habilidades/documentos e **Cormorant Garamond** para narrativa. Os arquivos ficam em **public/art/order/** e acompanham a compilação em **dist/art/order/**.

Cliente e servidor foram recompilados para esta integração. Não foram executados testes de jogo nesta atualização, conforme solicitado. Reinicie o servidor para carregar o build atualizado.

## Início rápido

Requer Node.js 22 LTS no computador anfitrião. Na pasta do projeto:

```powershell
npm install
npm run dev
```

Abra **http://localhost:3000**. O banco é preparado automaticamente no primeiro início. Não existe conta ou senha pessoal predefinida. Clique no olho, cadastre suas credenciais e selecione **Mestre**. O código inicial de autorização é **4053**; a senha pessoal deve ter pelo menos 10 caracteres, letras e números. O código é verificado exclusivamente no servidor e pode ser trocado ou desativado em Configurações.

Para produção local, sem compilação durante a partida:

```powershell
npm run build
npm start
```

No Windows, também é possível abrir **INICIAR_ORDER.cmd**. O iniciador reconhece o Node instalado e o runtime portátil preparado nesta máquina, instala dependências ausentes, compila e inicia o servidor. Mantenha seu terminal aberto durante a sessão. `Ctrl+C` encerra o servidor.

Não precisa de Firebase, nuvem, assinatura ou banco externo. Só o anfitrião instala o projeto. Para jogar pela rede, consulte [HAMACHI_SETUP.md](HAMACHI_SETUP.md).

## Primeira operação

1. Crie uma sessão no Dashboard e mantenha marcada a campanha demonstrativa **O Fabricante de Brinquedos**.
2. Na mesa, crie seu Searcher. Cada um começa com 20 Ações, Formação independente e equipamentos iniciais.
3. Peça ao segundo jogador para criar a própria conta e entrar na sessão. Cada pessoa recebe a própria mão pelo Socket.IO.
4. O Mestre troca cenas pela lateral esquerda. A demonstração inclui uma planta original de 9 salas, Augusto Vilar e 7 cenas.
5. Use `M` para mover seu token. Fora de combate, o deslocamento continua respeitando paredes. Em combate, também consome os quadrados disponíveis.
6. O Mestre inicia o combate. A iniciativa é rolada no servidor. Cada participante recebe 3 Ações e 2 Formações; a compra seguinte é feita no início do próximo turno próprio.
7. Clique em uma carta ou arraste-a para o centro para escolher um alvo, confirmar, queimar ou descartar. Ataques abertos fazem d6 de ativação e, quando ofensivos, d20 de acerto. Ataques mascarados são resolvidos ao encerrar o turno.
8. Papel e Caneta compra uma Ação extra e fica indisponível por 2 turnos próprios completos; volta no início do quarto turno contado a partir do uso. Pistola equipada concede alcance 3 e +2 de dano fixo em ataques com arma.
9. No escritório ou julgamento, as escolhas alteram Fame, Sanidade e Confiança. Recusar a oferta inicia um encontro real.

Para editar um mapa: crie uma cena de Tabuleiro, escolha a quantidade de salas, abra Configurações da cena e envie um background. Selecione uma sala na lateral, use retângulo (arrastar) ou polígono (cliques nos vértices, duplo clique para concluir). Edite nome, descrição e imagem interna pelo painel direito. Paredes são desenhadas arrastando; portas são colocadas clicando na parede horizontal. A ferramenta de células bloqueadas alterna o bloqueio da célula clicada. A ferramenta de visibilidade revela ou oculta a sala clicada.

## Comandos

| Comando                           | Função                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `npm install`                     | Instala dependências e gera Prisma Client                                      |
| `npm run dev`                     | Express + Vite + Socket.IO, uma porta, recarga de frontend                     |
| `npm run build`                   | Verificação TypeScript e compilação de cliente e servidor                      |
| `npm start`                       | Serve a compilação pela mesma porta                                            |
| `npm test`                        | Regras e integração HTTP/Socket.IO/SQLite                                      |
| `npx playwright install chromium` | Instala navegador de teste, opcional                                           |
| `npm run test:e2e`                | Testa duas contas em contextos de navegador separados; exige servidor de teste |

Os testes de integração criam um banco temporário e verificam reconexão e reinício. O teste de navegador cadastra contas; execute-o contra um servidor com `DATA_DIR` separado. Exemplo:

```powershell
$env:DATA_DIR='./.runtime/e2e'
$env:PORT='3100'
npm run dev
# Em outro terminal:
$env:ORDER_TEST_URL='http://127.0.0.1:3100'
npm run test:e2e
```

## Configuração e backup

Copie `.env.example` para `.env` se quiser alterar porta, pasta de dados, código inicial e cookies. `MASTER_SETUP_CODE` só inicializa a configuração na primeira execução; após isso, a configuração persistida no painel prevalece. `COOKIE_SECURE=false` é necessário para HTTP local/Hamachi. Use `true` quando servir por HTTPS.

Pare o servidor e copie **toda a pasta `data/`**, incluindo banco e `uploads/`. Restaure ambos juntos. `DATABASE_URL` relativo segue o diretório `prisma/`; `DATA_DIR` relativo segue a raiz do projeto. Mantenha-os coerentes quando personalizar os caminhos. Os livros originais foram preservados.

## Arquitetura

- `src/`: React, TypeScript, Tailwind, Motion, Zustand, Lucide e React Konva.
- `server/`: Express, autenticação, autorização, uploads, visualizações privadas e motor de regras.
- `shared/`: tipos de eventos, modelos e catálogo demonstrativo.
- `prisma/`: schema SQLite; estado de cada campanha armazenado como documento JSON versionado.
- `tests/`: regras, integração e teste de navegador.
- `docs/DECISOES.md`: decisões e diferenças entre o pedido e o livro de regras.

Documentação de referência: [Prisma SQLite](https://www.prisma.io/docs/orm/v6/overview/databases/sqlite), [Socket.IO: autenticação](https://socket.io/docs/v4/middlewares), [Socket.IO: salas](https://socket.io/docs/v4/rooms/).
# Integração com Discord

Consulte [DISCORD.md](DISCORD.md) para vincular o Searcher pelo código privado e sincronizar os recursos da mesa com o bot ORDER. A ficha do personagem ganhou a aba **Discord**. A configuração local da ponte já está nos arquivos `.env` do tabletop e do bot.

