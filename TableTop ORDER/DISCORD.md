# ORDER — ficha vinculada ao Discord

O servidor da mesa envia os recursos para o bot que está no mesmo computador. A interface visual do tabletop não foi reformulada nesta integração.

## Para o jogador

1. Crie sua ficha no Discord com `/criar_ficha`.
2. Na mesa, abra a ficha de um Searcher que pertence à sua conta.
3. Abra **Discord → Gerar código de vínculo**.
4. No servidor ORDER, use `/vincular_tabletop codigo:SEU_CODIGO`. A resposta é privada.
5. Volte à aba Discord da mesa e clique em **Confirmar vínculo / atualizar**.
6. Consulte `/minha_ficha` no Discord para ver os recursos atuais.

O código é de uso único, expira em dez minutos e só pode vincular um personagem cuja propriedade foi conferida pelo servidor do tabletop. Uma ficha do Discord mantém um vínculo ativo por servidor. Para mudar de campanha/personagem, gere e confirme um novo vínculo. Um personagem já vinculado a outra conta exige a desvinculação anterior.

Para interromper a sincronização, use `/desvincular_tabletop` no Discord. Os valores atuais permanecem salvos e a edição manual é liberada.

## O que acompanha a mesa

- Vida atual / máxima.
- Moral atual / máxima.
- Sanidade atual / máxima.
- Hell of Fame.
- Confiança coletiva da campanha, recebida igualmente pelos personagens vinculados dessa campanha.

Nome, história, aparência e retrato do Discord não são sobrescritos. Os valores já existentes na mesa são a referência; a integração não cria novas regras, bônus ou valores iniciais. Enquanto a ficha está vinculada, os recursos são editados na mesa.

As mudanças persistidas pelo tabletop são enviadas em segundo plano. Uma reconciliação a cada quinze segundos recupera a sincronização quando o bot retorna ou um processo reinicia. Movimentos rápidos conservam somente o snapshot mais recente pendente. Revisões antigas são ignoradas pelo bot. A indisponibilidade do bot não bloqueia as ações da mesa.

Mensagens privadas já abertas no Discord não recebem edição permanente automática. Abra **Minha ficha** novamente ou use **Atualizar** para ler a versão atual.

## Para o anfitrião

O bot e o tabletop devem permanecer ligados no mesmo computador. A configuração local já foi preenchida com uma chave aleatória compartilhada, guardada somente nos dois `.env`.

No `.env` do tabletop:

```env
DISCORD_BRIDGE_URL=http://127.0.0.1:4190
DISCORD_GUILD_ID=1568769390764105770
DISCORD_BRIDGE_SECRET=CHAVE_ALEATORIA_COM_PELO_MENOS_32_CARACTERES
```

No `.env` do bot:

```env
TABLETOP_BRIDGE_PORT=4190
TABLETOP_BRIDGE_SECRET=A_MESMA_CHAVE_DO_TABLETOP
```

O token do Discord fica exclusivamente no bot. A chave da ponte não é enviada ao navegador. A ponte escuta somente em `127.0.0.1`, exige autenticação e recusa requisições de páginas web com cabeçalho Origin. Não exponha essa porta na rede; somente a porta do tabletop atende os jogadores.

Depois de alterar a configuração, reinicie ambos os programas. Inicie o tabletop pelo `scripts/iniciar.ps1` e o bot pelo iniciador da raiz do projeto. A ativação não cadastra nem vincula contas automaticamente.

As associações, revisões e códigos temporários ficam no SQLite do bot. Os códigos são armazenados por hash. Faça backup do banco e dos retratos para preservar as fichas.
