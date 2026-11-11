# ORDER — instalação local e conexão concluídas

Python 3.13 e as dependências foram instalados em um ambiente virtual exclusivo desta pasta. O banco SQLite está em data/order_fichas.sqlite3.

Servidor identificado: **Order - RPG**, ID **1568769390764105770**.
Canal do painel: **criar-personagem**, ID **1568769393813618750**.

## Conectar ao Discord

1. No [Portal de Desenvolvedores do Discord](https://discord.com/developers/applications), abra ou crie o aplicativo do bot ORDER.
2. Copie o token do bot para a linha DISCORD_TOKEN do arquivo **.env** desta pasta, sem enviá-lo ao chat. GUILD_ID já foi configurado.
3. Em Installation, use Guild Install com os escopos **bot** e **applications.commands**. As permissões necessárias são ver canal, enviar mensagens, inserir links e anexar arquivos. Message Content Intent não é necessário.
4. Use o link de instalação fornecido pelo Portal para adicionar o bot ao servidor **Order - RPG**.
5. Execute **INICIAR_BOT_ORDER.cmd**, na raiz do projeto, ou **iniciar_windows.bat**, nesta pasta. Mantenha a janela aberta enquanto o bot estiver em uso.
6. No canal **criar-personagem**, use **/painel_order** com uma conta que gerencia o servidor para publicar o painel.

Conexão inicial validada em **11/11/2026**: **Order#9065** entrou no servidor **Order - RPG** e conectou ao Gateway do Discord. A versão atual registra dez comandos, incluindo **/retrato_order**, **/vincular_tabletop** e **/desvincular_tabletop**.

O processo foi iniciado em segundo plano nesta sessão do Windows. Não é necessário abrir o iniciador novamente enquanto ele estiver funcionando. O computador precisa continuar ligado, com conexão à internet e sem suspender. Não foi configurada inicialização automática com o Windows.

Os registros da execução ficam em **logs/bot.stderr.log** e **logs/bot.stdout.log**. O PID do processo iniciado fica em **data/bot.pid**. Depois de reiniciar o computador, use **INICIAR_BOT_ORDER.cmd** para ligar o bot novamente; nesse modo manual, mantenha a janela aberta.

O painel de criação foi publicado no canal **criar-personagem**, com os botões persistentes do bot. O comando **/painel_order** continua disponível para uma conta que gerencia o servidor publicar outros painéis quando necessário.

A atualização visual adiciona o cartão de dossiê, cinco seções de consulta, envio de retrato, edição manual de recursos e exportação PNG. Abra **/minha_ficha** novamente para receber a interface atualizada. Os botões do painel de entrada existente continuam funcionando; uma nova publicação com **/painel_order** inclui a logo.

Depois da autorização do dono, o bot recebeu **Administrador** no servidor. Foram preparados **6 categorias, 15 canais de texto, 4 salas de voz e 7 cargos**, com 15 guias/painéis. A área **Arquivo do Mestre** nega visualização ao cargo padrão; o dono pode atribuir **⚖ Mestre** a quem deve acessá-la. O canal original de criação e a sala de voz original foram reaproveitados.

A ponte do tabletop está configurada em **127.0.0.1:4190**, com chave compartilhada guardada nos `.env`. Os comandos **/vincular_tabletop** e **/desvincular_tabletop** completam o conjunto de **10 comandos**. O vínculo depende do código gerado pelo próprio jogador na ficha da mesa. Consulte **TableTop ORDER/DISCORD.md** para o fluxo completo.
