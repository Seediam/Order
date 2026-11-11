# ORDER — O Pecado da Misericórdia

História em quadrinhos interativa de terror (HQ + manhwa + visual novel + álbum de fotos) que apresenta o RPG **ORDER** e coloca o leitor no papel de um Searcher. HTML, CSS e JavaScript estáticos: abra e leia, sem instalar nada.

## Abrir

Abra **index.html** no Chrome ou Edge (ou publique pelo GitHub Pages). Use fones: há chuva, trovões, efeitos e a trilha `assets/background_music.mp4`. O som começa depois do primeiro clique, por regra dos navegadores.

Controles: clique na página, **→**, Espaço ou Enter para avançar; **←** para voltar.

## A experiência

- **Livro aberto** com duas páginas. Ao virar, a folha gira em 3D e cai do outro lado.
- **Páginas de quadrinho** em papel envelhecido, com quadros cortados em diagonal, balões com rabicho (fala, sussurro, grito, carta), caixas de narração e onomatopeias que tremem.
- **Leitura guiada** quadro a quadro, como num manhwa: os próximos quadros ficam escondidos até você chegar neles, o texto rola letra por letra, o cenário anda devagar e os personagens respiram.
- **Cenas de impacto**: tela tremendo, clarão vermelho e batida de coração. Há também olhos que se apagam (pálpebras fecham a tela), filme antigo (sépia, granulação, riscos e tremulação), relâmpagos e a transformação no Hells.
- **Chuva** na igreja e **brasas** no Hells.
- **Capítulo 0 — O que é ORDER**: seis páginas explicam o RPG (Searchers, contratos, as três sentenças, Cómum e Hells, cartas e dados, Hell of Fame) antes de criar o personagem.
- **Álbum de identidade**: rosto, Setor (polaroides tingidas com a cor de cada Setor), pecado, duas perícias e o contrato.
- **Álbum de cenas** para voltar a qualquer página já lida.
- **Testes com D20 em 3D** (Investigação e Resistência; a perícia soma +2) e **decisões** em notas de papel. São 3 sentenças com 3 finais diferentes no Hells.
- O fim convida para o Discord do ORDER, mostra a ficha e permite baixá-la em Markdown.

## Arquivos

- **index.html** — entrada.
- **manhwa-story.js** — roteiro: páginas, layout dos quadros, balões, narração, efeitos, testes e escolhas.
- **manhwa.js** — leitor: livro, virada de página, leitura guiada, texto rolando, efeitos, som, chuva, álbuns, D20 e salvamento (`order_manhwa_v1`).
- **manhwa.css** — visual completo.
- **dice3d.js** — dados 3D.
- **assets/web/** — artes em WebP.

Versões anteriores continuam na pasta (`comic*.js`, `script.js`, `OFFLINE_RPG_LEGADO.html`), mas o `index.html` não as carrega. O Tabletop fica em **TableTop ORDER/** e o bot em **ORDER_Discord_Bot_v1/**.

## Publicar

O workflow **.github/workflows/pages.yml** publica no GitHub Pages ao enviar para a branch **main** (em Settings → Pages, escolha *GitHub Actions*). Os arquivos `.env` e o `assets.rar` (116 MB, acima do limite do GitHub) ficam fora do repositório pelo `.gitignore`.
