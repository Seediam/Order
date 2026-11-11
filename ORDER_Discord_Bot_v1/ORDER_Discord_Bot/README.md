# ORDER — Bot do Discord (v1.2 · ficha visual e tabletop)

Bot funcional de criação de personagens para o RPG **ORDER**. É um assistente guiado por menus e formulários. Entrega a ficha visual em PNG e o prompt oficial em `.txt`, preenchido com os dados do jogador. A ilustração do personagem deve ser enviada pelo jogador; o bot não usa IA para conversar ou desenhá-la.

## Ficha visual

- **`/minha_ficha`** abre um cartão de dossiê em PNG com a logo e as fontes do ORDER, papel antigo, retrato, identificação e recursos.
- O menu abre **Visão geral**, **Identidade**, **Pecado e visual**, **História** e **Recursos e baralhos**. A consulta troca a seção na mesma mensagem privada.
- **Editar ficha** altera as seções sem obrigar o jogador a repetir o restante da criação.
- **Retrato** abre um formulário de envio da arte. O comando **`/retrato_order imagem:`** também aceita o anexo. PNG, JPG ou WebP, até 8 MB e 24 megapixels. O retrato é salvo localmente, sem depender de uma URL temporária do Discord.
- **Recursos** permite registrar Moral, Sanidade, Confiança coletiva e Hell of Fame conforme os valores definidos pelo Mestre. Os campos começam em **A definir** e não calculam efeitos de jogo. A confiança coletiva é um registro por ficha; não é sincronizada entre jogadores.
- **Baixar ficha** entrega Markdown, JSON e o cartão PNG. O JSON preserva os dados textuais; o retrato fica separadamente em `data/portraits/`.
- Os controles do dossiê e do painel têm identificadores persistentes. Depois desta atualização, abra uma nova ficha com `/minha_ficha` para receber os controles novos.

O cartão é desenhado localmente com Pillow. A arte do personagem continua sendo enviada pelo jogador; o prompt não cria essa arte automaticamente. As fichas anteriores continuam no mesmo banco SQLite, sem mudança de formato.

## Instalação no Windows

1. Instale **Python 3.11 ou superior** (marque **Add Python to PATH**).
2. Entre em https://discord.com/developers/applications e crie **New Application** com nome `ORDER`.
3. Na aba **Bot**, copie o token e **nunca publique esse token**.
4. Em **Installation**, configure o uso no servidor. Adicione os escopos `bot` e `applications.commands`. O bot precisa das permissões de **Enviar mensagens**, **Inserir links** e **Anexar arquivos** no canal do painel. Você NÃO precisa habilitar `Message Content Intent`.
5. Na instalação do aplicativo, use o link de convite gerado pelo Portal e adicione-o ao seu servidor.
6. Extraia a pasta deste ZIP, e abra `iniciar_windows.bat` uma primeira vez. Ele instala dependências e cria `.env`.
7. Abra `.env` e cole `DISCORD_TOKEN=SEU_TOKEN`. Recomendo preencher também `GUILD_ID=SEU_ID_DO_SERVIDOR` para sincronização imediata dos comandos. Para copiar o ID: Discord → Configurações avançadas → Modo Desenvolvedor → clique direito no servidor → Copiar ID.
8. Rode `iniciar_windows.bat` novamente. Mantenha a janela aberta enquanto o bot estiver em uso.
9. No Discord, no canal `#criar-personagem`, digite **`/painel_order`** com uma conta que tenha permissão de Gerenciar servidor.
10. Os jogadores clicam **Criar / retomar ficha** e seguem as etapas privadas. Também podem usar `/criar_ficha`.

> Se os comandos não aparecerem logo de início, confira se o GUILD_ID está correto, se o bot tem escopo `applications.commands` e se a janela do bot mostrou sincronização sem erros. Com GUILD_ID definido, os comandos são registrados naquele servidor.

## Comandos

| Comando | Efeito |
|---|---|
| `/painel_order` | Admin publica painel fixo com botões de criação |
| `/criar_ficha` | Cria ou retoma uma ficha |
| `/minha_ficha` | Exibe a ficha privadamente |
| `/retrato_order` | Salva a arte enviada no dossiê do personagem |
| `/vincular_tabletop` | Confirma o código temporário gerado na ficha da mesa |
| `/desvincular_tabletop` | Interrompe a sincronização e libera recursos manuais |
| `/editar_ficha` | Altera Setor, identidade, pecado/visual ou história |
| `/prompt_order` | Gera o arquivo de prompt preenchido |
| `/baixar_ficha` | Exporta ficha em `.md`, `.json` e cartão `.png` |
| `/apagar_ficha` | Remove a ficha deste servidor após confirmação |

## Como o personagem é criado

A integração local com o tabletop está descrita em [DISCORD.md](../../TableTop%20ORDER/DISCORD.md). Ela recebe Vida, Moral, Sanidade, Confiança coletiva e Hell of Fame dos personagens vinculados pelo próprio jogador. Consulte a ficha novamente para ler os recursos atuais.

## Organização do servidor

`organizar_servidor.py --apply` aplica a estrutura de canais, salas, cargos e guias do ORDER. O comando sem `--apply` apenas lista o plano. O mapa de IDs em `data/server_setup.json` permite retomar e editar as mensagens criadas sem duplicar canais. O script reutiliza os canais originais de texto/voz e não apaga mensagens ou canais anteriores.

A área **Arquivo do Mestre** é privada. O dono do servidor atribui o cargo **⚖ Mestre** às pessoas que devem acessá-la. Os cargos dos Setores são identificadores visuais e não concedem administração.

## Etapas da ficha

- Escolha o **Setor**: Incidência, Relação, Justiça, Socialista ou Doutrina.
- **Etapa 1 — Identidade**: nome, idade aparente, aparência, cabelo e olhos.
- **Etapa 2 — Pecado e visual**: personalidade, roupas, equipamentos, pecado da vida e marcas sobrenaturais.
- **Etapa 3 — História**: pose para ilustração, passado, objetivo, medo e vínculo (esses quatro últimos opcionais).
- Após a conclusão, o bot compõe a ficha e o prompt usando exatamente o estilo definido em `PROMPT.txt`.

## Arte do personagem

O `PROMPT.txt` entregue é o texto artístico fornecido para o ORDER, com os campos substituídos. Ele exige **imagens de referência oficiais** para manter a identidade visual. O bot **não incorpora essas imagens no prompt**. O jogador deve anexá-las junto com o texto na ferramenta que fará a ilustração. Você pode adicionar a URL da mensagem com as referências em `ORDER_REFERENCES_URL` no `.env`.

## Onde ficam as fichas

Em `data/order_fichas.sqlite3`, separadas por **servidor** e **jogador**. Os formulários e arquivos são enviados como respostas efêmeras (apenas o jogador vê). A ficha é privada no Discord, mas o administrador que tem acesso ao computador/servidor do bot também pode ter acesso ao arquivo do banco. Faça backup do banco se desejar preservar as fichas.

## Regras em desenvolvimento

As mecânicas de **Moral**, **Sanidade**, **Confiança coletiva**, **Hell of Fame**, a passiva por pecado e a distribuição de decks **ainda não têm cálculos implementados**. Os recursos podem ser registrados manualmente conforme as regras do Mestre. A ficha documenta que o deck de ações terá **20 cartas**, e que a Formação/perícias será separada. O código não atribui atributos ou efeitos numéricos que não tenham sido validados pelo mestre.

## Dicas de personalização

- Edite `PROMPT.txt` se o estilo artístico oficial mudar. Não remova os campos entre colchetes se desejar preencher o prompt automaticamente.
- Altere `SECTORS` em `bot.py` para mudar o texto descritivo do menu.
- Mantenha `.env` fora de GitHub ou de mensagens públicas.
- Para manter o bot sempre online, execute-o em uma máquina ou hospedagem que fique ligada; o arquivo `.bat` sozinho não hospeda o bot em nuvem.

