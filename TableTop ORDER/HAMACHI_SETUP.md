# ORDER pela rede Hamachi — Windows

## 1. Preparar o anfitrião

Instale Node.js 22 LTS no computador que hospedará a mesa. Abra PowerShell na pasta ORDER e execute:

```powershell
npm install
npm run build
npm start
```

O iniciador `INICIAR_ORDER.cmd` faz essas etapas quando necessário. Apenas o anfitrião precisa dos arquivos e do Node.js. O terminal exibe `Local: http://localhost:3000`. Teste esse endereço primeiro no navegador do próprio anfitrião.

Crie a conta de Mestre com o código inicial **4053** e uma senha pessoal. Depois do primeiro cadastro, abra Configurações para trocar ou desativar o código de autorização. Esse código não é a senha de login.

## 2. Preparar a rede Hamachi

Todos instalam o Hamachi e entram na mesma rede virtual. O anfitrião cria a rede ou usa uma já existente. Os jogadores precisam enxergar o anfitrião conectado no Hamachi.

No aplicativo Hamachi do anfitrião, identifique o IPv4 exibido junto ao nome da máquina. Copie **o IPv4**, não o IPv6. O endereço costuma começar com `25.`, mas use o endereço real da máquina. Também é possível consultar `ipconfig` no terminal e procurar o adaptador Hamachi.

Exemplo ilustrativo de endereço para os jogadores: `http://25.x.x.x:3000`. Substitua `25.x.x.x` pelo IPv4 real. Não use `localhost` no computador dos jogadores, pois esse nome aponta para o próprio computador de quem acessa.

## 3. Permitir a porta no Firewall do Windows

No anfitrião, procure **Firewall do Windows Defender com Segurança Avançada**:

1. Abra Regras de Entrada → Nova Regra → Porta.
2. Selecione TCP e a porta local específica `3000` (ou a porta definida no `.env`).
3. Permita a conexão e selecione os perfis aplicáveis ao adaptador Hamachi.
4. Dê o nome `ORDER VTT — Hamachi` à regra.
5. Em Propriedades → Escopo, limite os endereços remotos aos IPv4 dos integrantes da sua rede virtual, se possível.

Não é necessário desligar todo o firewall nem configurar redirecionamento de portas do roteador para uma conexão pela rede Hamachi. Não altere regras de outros aplicativos.

## 4. Testar a conexão

No computador de um jogador, em PowerShell:

```powershell
Test-NetConnection -ComputerName IP_REAL_DO_ANFITRIAO -Port 3000
```

Troque `IP_REAL_DO_ANFITRIAO` pelo IPv4 copiado. `TcpTestSucceeded: True` confirma que a porta é alcançável. Então abra `http://IP_REAL_DO_ANFITRIAO:3000` no navegador. A rota `/api/health` retorna `ok: true` se o servidor estiver ativo.

Esse teste de rede precisa ser feito com as máquinas reais conectadas ao Hamachi. Os testes automatizados do projeto verificam o multiplayer local, mas não confirmam as configurações da sua rede virtual ou do firewall.

## 5. Jogadores e campanha

Cada jogador cadastra uma conta **Procurador**, com senha própria. O código de Mestre não é necessário para jogar. As campanhas abertas aparecem no Dashboard. Clique em Entrar na sessão e crie sua ficha. O Mestre pode preparar a campanha demonstrativa ou iniciar uma vazia.

Todos usam a mesma origem e porta para frontend, API e Socket.IO. Não edite URLs no código do cliente. Se mudar a porta em `.env`, reinicie o servidor e atualize a regra do firewall e o endereço usado pelo grupo.

## 6. Recuperar uma sessão

Fichas, mãos privadas, pilhas, turnos, mapas, roteiros, chat e recursos são gravados após cada ação aceita. Se a conexão cair, mantenha a página aberta: Socket.IO tenta reconectar e envia o estado autorizado novamente. Uma ação sem confirmação não deve ser reenviada repetidamente; aguarde a atualização.

Se o anfitrião reiniciar o computador, execute `npm start` ou o iniciador outra vez, preservando a pasta `data/`. O jogador entra com as mesmas credenciais e abre a mesma campanha. O anfitrião precisa manter o computador ligado e o servidor em execução durante a partida.

Para backup, desligue o servidor e copie a pasta `data/` inteira. Para restauração, coloque a cópia no lugar da pasta de dados com o servidor parado. Nunca apague o banco como solução para um problema de conexão.

## 7. Problemas comuns

| Sintoma                                     | Verificação                                                                                         |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `npm` não reconhecido                       | Instale Node.js 22 e abra um novo terminal; nesta máquina, use o iniciador para o runtime portátil. |
| Funciona no anfitrião, mas não no jogador   | Confira IPv4, rede Hamachi, porta e regra de entrada do firewall.                                   |
| `TcpTestSucceeded: False`                   | Servidor desligado, IP incorreto, porta errada ou bloqueio do firewall.                             |
| Hamachi indica relé ou conexão indisponível | Resolva a conectividade no próprio Hamachi e repita o teste TCP.                                    |
| `EADDRINUSE`                                | A porta já está ocupada. Encerre a outra instância do ORDER ou escolha outra porta.                 |
| Tela reconectando continuamente             | Confira servidor e rede; recarregue e entre novamente se a sessão de login expirou.                 |
| Login parece não persistir                  | Em HTTP, mantenha `COOKIE_SECURE=false` e use sempre o mesmo host/IP.                               |
| Código 4053 deixou de funcionar             | O código foi trocado/desativado pelo painel; a configuração salva prevalece sobre `.env`.           |
| Banco vazio após mover a pasta              | Confira `DATA_DIR` e `DATABASE_URL`; restaure banco e uploads do mesmo backup.                      |
| Carta ou token recusado                     | Confira turno, movimento restante, alcance, paredes, Moral e recarga. O servidor valida a ação.     |

HTTP sobre Hamachi atende à rede virtual local solicitada. Para acesso por internet pública, configure HTTPS e cookies seguros antes de expor o serviço.
