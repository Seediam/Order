# ORDER V0.4 — Relatório de verificação

Validação executada em 7 de novembro de 2026, com Playwright 1.65.0 e Chromium 158.0.8127.18 headless real.

**Resultado:** 27 verificações da campanha e 14 verificações adicionais aprovadas. Nenhum erro crítico de JavaScript ou asset ausente no percurso completo.

## Animações executadas

- Olho aberto com contorno, íris e pupila; movimento real da pupila conforme o mouse; clique com abertura e dois fechamentos curtos antes do título.
- Letras de ORDER com atrasos individuais e opacidades intermediárias medidas até o estado final visível.
- Texto começando vazio e crescendo por caractere; primeiro clique revela a fala sem mudar a cena; segundo clique avança. Escolhas ficam inacessíveis durante a digitação.
- Alternar som mantém o mesmo elemento de diálogo e o progresso do texto.
- Respiração com matrizes de transformação diferentes no decorrer do tempo; iluminação distinta para personagem ativo e ouvinte.
- Amostras de opacidade durante os flashes e o fade, incluindo tela escura e retorno à cena. Silhueta observada durante evento e removida ao final.
- Token observado entre origem e destino, com posição intermediária no primeiro segmento e atualização de estado ao concluir cada célula.
- Hover levanta e amplia a carta. Laboratório executa transformação, compra e caminhada.

## Interface e regras

As telas de Visual Novel, exploração e combate foram verificadas em **1920×1080**, **1366×768** e **390×844**, sem rolagem externa. No desktop, a mão sobrepõe a borda inferior do tabuleiro. Com sete cartas, o botão de encerrar turno continua recebendo cliques; no celular, todas as cartas permanecem dentro da largura disponível.

Foram verificados também: deck de 20 cartas, todos os resultados D6 das seis cartas, resolução de uma carta de defesa com D6 controlado, descarte, queima e banimento, compra com Papel e Caneta e retorno após dois turnos, área anunciada e fase final do chefe. O modo de movimento reduzido conserva o olho e o título visíveis. Prévias preservam o save; o laboratório exige localhost e dev=1. Bloquear script.js deliberadamente produz uma mensagem legível de diagnóstico.

## Campanha completa e finais

O teste percorreu a criação de uma Searcher, a chegada, as conversas, a criança, os oito documentos, a comparação e o confronto usando os controles da página. Depois, ramificou a partir do save do julgamento para executar as três decisões e seus encontros. As falas foram reveladas com o controle de completar texto; cada documento foi aberto e guardado manualmente pelo teste.

Nos três combates abaixo, o teste usou somente a **Pistola**, movimento e esquiva das áreas anunciadas. As rolagens de campanha foram reais, sem forçar os dados.

| Julgamento | Rodadas | Vida restante | Confiança | Desfecho |
| --- | ---: | ---: | ---: | --- |
| Cobrar a alma | 27 | 20 | 8/10 | Contrato encerrado. |
| Conceder misericórdia | 34 | 16 | 9/10 | Elvira continua na Terra. |
| Adiar o julgamento | 44 | 10 | 9/10 | Uma noite a mais. |

A misericórdia enfrentou o Eco do Contrato; o adiamento, o Guardião do Prazo. A decisão de poupar Elvira foi preservada.

## Equilíbrio

**2000/2000 vitórias** nas simulações determinísticas, com média de **27.39 rodadas** e mínimo de **3 de Vida** entre as vitórias. Estratégia: Pistola, sem cartas, cura ou bônus de Setor, saindo das áreas anunciadas.

As simulações chamam as mesmas regras de dano, intenções, defesa e proteção contra falhas usadas pelo jogo. A taxa mede essa estratégia e essas sementes; não representa toda forma possível de jogar.

## Evidências

- [Registro completo do navegador](evidence/browser-report.json)
- [Verificações adicionais e quadros intermediários](evidence/systems-report.json)
- [2.000 simulações](evidence/balance.json)
- [Gravação de 19 segundos: abertura, diálogo, luz, caminhada e cartas](evidence/cinematics.webm)
- [Olho](evidence/eye.png) · [Visual Novel](evidence/novel.png) · [Dossiê](evidence/dossier.png)
- [Combate 1920](evidence/combat-1920.png) · [Combate 1366](evidence/combat-1366.png) · [Sete cartas no celular](evidence/hand-seven-mobile.png)
- [Transformação no laboratório](evidence/transformation.png)
- [Final: cobrança](evidence/ending-collect.png) · [Final: misericórdia](evidence/ending-mercy.png) · [Final: adiamento](evidence/ending-defer.png)

## Correções encontradas durante a validação

O modo de movimento reduzido conservava atrasos nas letras: agora os remove e deixa o título visível. A mão com sete cartas interceptava o botão de encerrar turno: as camadas da mesa e dos controles foram corrigidas e o clique foi testado novamente. O leque no celular recebeu espaço para a rotação das cartas nas extremidades.

## Limites e publicação

Não restaram falhas críticas conhecidas no percurso testado. Firefox, Safari e dispositivos físicos não foram validados. Sons são sintetizados; não foram fornecidos arquivos de áudio nem retratos próprios para todas as expressões ou formas infernais dos Searchers. Os capítulos futuros sugeridos pelos finais estão fora do prólogo.

A execução sob **/order/** verificou os caminhos relativos para hospedagem em subdiretório. A publicação externa não foi executada. O [README](../README.md) contém as instruções de GitHub Pages e repetição dos testes. O workflow publica somente os arquivos do jogo e assets, excluindo ferramentas e evidências.
