# ORDER V0.4.3 — O Pecado da Misericórdia

Prólogo solo de investigação, terror psicológico e combate com cartas. HTML, CSS e JavaScript estáticos; sem backend e sem instalação para jogar.

## Encerramento do mini tutorial — V0.4.3

- Chefe com 6 de Vida, dano reduzido e no máximo 1 de escudo. O adversário começa mais perto para ensinar movimento e ataque rapidamente.
- Todas as faces do D6 ativam as cartas nesta demonstração. No D20, o acerto começa em 2, com proteção após uma falha. As faces válidas estão indicadas nas cartas.
- Após a vitória, o olho retorna. Clicar no olho revela o convite da comunidade, com botão para abrir **https://discord.gg/xVDAPBVTTz** em outra aba. O jogo não abre o Discord automaticamente.
- O resultado do julgamento continua acessível pela tela do convite.
- Encontros em andamento recebem o ajuste de dificuldade ao recarregar, preservando personagem, evidências e decisões.
- Corrigidos consumo de recarga com a mão cheia, números de dano acima da Vida restante, efeitos atrasados em cenas já fechadas e digitação de texto vazio.

O ritmo mais lento das animações foi mantido. Nesta atualização foi feita apenas conferência de sintaxe; não foi executada a suíte de testes de jogo.

## Atualização offline V0.4.2

Esta etapa altera apenas o prólogo offline. O Tabletop fica para a próxima etapa.

- A fonte das fichas segue a referência do título “Estojo de chaves”: Cormorant Garamond, em maiúsculas e minúsculas.
- Fichas de Procurador com papel envelhecido, retrato de identificação, número de registro, carimbo e campos de escrita. O cadastro ocupa a altura do conteúdo; a rolagem horizontal foi removida.
- A logo PNG fornecida aparece na abertura e no cabeçalho.
- O mapa ilustrado da igreja tem nove cômodos clicáveis, com percursos passando pelos corredores. Escritório da Ordem, sala de reuniões e corredor dos fundos foram conectados à exploração.
- A arena usa o novo background, com grade discreta e área aberta.
- Cartas ofensivas e Pistola lançam um efeito mágico do token do Searcher até o alvo. Perda de Vida produz flash vermelho e número flutuante; erro, bloqueio e falha de D6 têm indicações distintas. Defesa, cura e movimento têm auras próprias.
- Efeitos respeitam movimento reduzido e ficam fora da árvore redesenhada do jogo. Ações de combate ficam bloqueadas durante a resolução visual.
- O laboratório local possui botões de Ataque e Dano para demonstração manual.

Abra **index.html** novamente para carregar os arquivos atualizados. **battle-fx.js** precisa acompanhar os outros scripts. Não foram executados testes nesta atualização, conforme solicitado. Os relatórios antigos não validam esta versão.

## Atualização visual V0.4.1

- Seleção com personagens verticais, clique sobre a arte e fundo preto com degradê rosa.
- Personagem à direita espelhado para olhar para o centro; respiração em uma camada independente.
- Cinzel Decorative nos títulos e Setores; IM Fell English SC nos documentos e habilidades; Cormorant Garamond na narrativa. Todas carregadas da pasta **Fonts**, sem depender de Google Fonts.
- Cenários PNG do exterior da igreja, nave, sacristia, arquivo, confessionário, pátio, corredor, quarto trancado e Hells associados às cenas.
- Sprites próprios do Eco do Contrato, Guardião do Prazo e Searchers no Hells.
- Narração por voz removida; efeitos sonoros e volume continuam disponíveis.

O RPG em **TableTop ORDER/** recebeu a mesma tipografia, seleção, artes e orientação dos retratos. Sua compilação foi atualizada. Esta atualização visual não passou por novos testes de jogo, conforme solicitado.

## Abrir o jogo

Abra **index.html** com Chrome ou Edge. Para uma execução com servidor local, na pasta do projeto use qualquer servidor estático; por exemplo, com Node instalado:

```powershell
npx --yes http-server . -p 4173 -c-1
```

Acesse http://localhost:4173. Para o laboratório, abra **index.html?preview=dialogue&dev=1** nesse servidor. O painel só existe em localhost/127.0.0.1. Abra **PREVIEW_CENAS.html** para atalhos de olho, Visual Novel, mapa e combate.

## Controles

- Clique no olho para iniciar; crie o Searcher e aceite o contrato.
- O primeiro clique na fala revela o texto completo. O próximo clique avança quando há uma única continuação. Quando há respostas, selecione uma.
- Espaço/Enter também revela ou continua; 1–9 escolhe uma resposta depois que a fala termina.
- Clique nas salas para caminhar. Leia e guarde documentos; o dossiê permite reler, comparar dois registros e registrar uma pergunta.
- No combate, clique numa célula iluminada para andar. Selecione uma carta para inspecioná-la; use o botão ou clique no alvo destacado. Hover/foco levanta a carta.
- A Pistola tem alcance 2 e dano fixo +2; usa D20 para acertar. Cartas usam somente os valores válidos de D6 impressos nelas.
- Papel e Caneta compra uma carta e volta a estar disponível após dois turnos próprios. Queimar bane a carta até o fim do encontro e concede dois passos.
- A área hachurada anuncia um ataque: saia dela antes de encerrar o turno. Leia a intenção do inimigo; escudo também ajuda contra o ataque psicológico.
- Os efeitos sonoros começam desligados. A engrenagem ajusta volume e velocidade do texto. EFEITOS AUTO respeita o sistema; EFEITOS ON ativa movimento por escolha do jogador.

## O que há nesta versão

A campanha contém 44 cenas e oito registros. A chegada, a conversa com Elvira, o testemunho de Lia e as contradições precedem o julgamento. Cobrar, poupar e adiar levam a encontros e finais diferentes. O dossiê apresenta documentos originais, sem rótulos de culpa ou inocência. Moral sustenta ações; Confiança responde à responsabilidade pelas decisões.

As imagens fornecidas estão integradas com seus nomes e capitalização originais:

| Uso | Arquivos |
| --- | --- |
| Seleção e token do Searcher | assets/Man.png, assets/Woman.png |
| Searcher na Visual Novel | assets/Man_Visual.png, assets/Woman_Visual.png |
| Searchers no Hells | assets/Man_Hells_Visual.png, assets/Womans_Hells_Visual.png |
| Eco do Contrato / Guardião | assets/ORDER_Eco_do_Contrato_Sprite.png, assets/ORDER_Guardiao_do_Prazo_Sprite.png |
| Elvira | assets/Euvira.png |
| Transformação de Elvira e combate | assets/Euvira_Demon.png |

O recorte dos tokens usa CSS. Para expressões futuras, acrescente os caminhos correspondentes em **ASSETS**, em script.js. Na ausência de imagem específica, o jogo altera luz e enquadramento. As formas infernais fornecidas são usadas no Hells. Expressões sem arte específica continuam usando luz e enquadramento.

## Arquivos

- **index.html**: entrada, overlays, configurações e diagnóstico de inicialização.
- **style.css**: direção visual, layouts e keyframes.
- **script.js**: estado, renderização, entradas e integração das regras.
- **animations.js**: controlador Cinematics para transições e movimentos.
- **battle-fx.js**: projéteis, auras, flashes de dano e números flutuantes.
- **story.js**: cenas e documentos.
- **investigation.js**: comparação, perguntas, postura e julgamento.
- **combat-rules.js**: regras puras usadas pelo jogo e pelas simulações.
- **sound.js**: efeitos curtos com Web Audio; silêncio entre eventos.
- **dev.js**: laboratório restrito ao desenvolvimento.
- **assets/**: imagens originais PNG e fundos SVG preservados.
- **tests/**: automação de navegador, simulações e evidências.

O save V0.4 usa a chave **order_prologue_v4**. O save anterior continua armazenado separadamente; não é convertido para uma narrativa incompatível. As prévias e o laboratório não gravam a campanha. Reiniciar pede confirmação antes de apagar o progresso V0.4.

## Verificação

Os relatórios existentes correspondem à V0.4, anterior à atualização visual V0.4.1. Não foram executados novos testes nesta atualização, conforme solicitado. Na versão anterior, os testes usaram um Chromium real, posições intermediárias e valores de animação do DOM. Leia **tests/TEST_REPORT.md**, **tests/evidence/browser-report.json** e **tests/evidence/balance.json**. As capturas finais estão em **tests/evidence/**.

Para repetir em outra máquina, instale somente as ferramentas de teste:

```powershell
cd tests
npm install
npx playwright install chromium
npm test
npm run balance
npm run systems
```

O jogo não precisa dessas dependências. O teste de navegador abre um servidor próprio na porta 4180 e o encerra ao terminar; feche outro processo nessa porta antes de repetir. As simulações são determinísticas e executam 2.000 sementes usando as mesmas regras do jogo, com uma estratégia conservadora de Pistola e esquiva das áreas anunciadas.

## Publicar no GitHub Pages

1. Envie os arquivos do projeto, incluindo todos os JavaScripts e a pasta **assets**, ao seu repositório, na branch **main**.
2. Em **Settings → Pages → Source**, escolha **GitHub Actions**.
3. O workflow **.github/workflows/pages.yml** prepara **_site/** somente com o jogo e os assets, sem dependências ou evidências dos testes.
4. Após a execução da Action, abra a URL mostrada no ambiente **github-pages**.

Todos os caminhos são relativos e foram testados sob um subdiretório **/order/**. Não renomeie os PNGs: GitHub Pages distingue maiúsculas de minúsculas. Não há dependência de Supabase, Hamachi, conta ou servidor de aplicação.

## Limites desta entrega

As consequências futuras de poupar ou adiar são estabelecidas no desfecho do prólogo; capítulos posteriores não fazem parte desta versão. Os sons são sintetizados, pois não foram fornecidos arquivos de áudio. A validação foi feita em Chromium; outros motores de navegador e dispositivos físicos ainda precisam de teste específico. A hospedagem externa não foi executada nesta entrega local.
