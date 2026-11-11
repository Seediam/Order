# Decisões técnicas e de regras

## Hospedagem e dados

O pedido exige um anfitrião Windows, Hamachi e dados locais; por isso o projeto usa Express, SQLite e Socket.IO no mesmo processo e na mesma porta. Não foi criado serviço hospedado, banco remoto ou dependência de autenticação externa. Vite é middleware no desenvolvimento; produção serve `dist/`.

Usuários, sessões autenticadas, membros, arquivos e configurações são entidades Prisma. Cada campanha mantém um documento JSON com cenas, personagens, instâncias por zona, equipamentos, combate e registros. Essa decisão mantém as atualizações de uma ação atômicas em SQLite. Uma fila por campanha impede atualizações concorrentes perdidas dentro da instância do servidor. A revisão aumenta a cada gravação. Rode uma única instância por banco.

O schema é aplicado automaticamente no início. No Windows, o arquivo SQLite vazio é criado exclusivamente se ainda não existe, antes do schema engine. Nenhum banco existente é truncado. Mudanças futuras de schema com risco de perda devem usar migrações revisadas e backup.

## Segurança e privacidade

Senhas e código de autorização usam bcrypt com custo 12. Sessões usam tokens aleatórios de 256 bits, armazenados no banco apenas como SHA-256, com expiração. Cookies são HttpOnly e SameSite=Lax; Secure é configurável para compatibilidade com Hamachi HTTP. HTTP mutável e handshakes Socket.IO conferem a origem. Login/cadastro e ações possuem limites de frequência.

O papel da conta vem do banco. Ser Mestre global não permite administrar campanhas de outro Mestre. A adesão a campanhas abertas é explícita. O servidor confirma cada ação, incluindo dono do personagem, turno, saldo, alcance, paredes, carta na mão, custo e recarga. Dados usam `crypto.randomInt`; resultados fornecidos pelo cliente são ignorados.

Cada socket recebe uma visualização calculada para o usuário autenticado. Mãos, pilhas e decks alheios são removidos do objeto antes da emissão. Ataques mascarados públicos contêm apenas ator e alvo até a resolução. O Mestre vê automaticamente somente seus personagens/NPCs; a inspeção de outro jogador exige configuração explícita e cria registro de auditoria. Reconexões passam pela autenticação e recebem nova visualização filtrada.

Imagens são validadas pelo conteúdo, limitadas a 20 MB / 40 megapixels, normalizadas para WebP e recebem thumbnails. São armazenadas em `data/uploads`, fora do frontend público; acesso exige autenticação e propriedade ou referência autorizada na campanha. A biblioteca não aceita SVG enviado pelo usuário. Áudio aceita cabeçalhos MP3/Ogg/WAV. URLs de recursos declarativos são restritas a arquivos locais da biblioteca e às ilustrações originais incorporadas.

## Fontes de regras e diferenças

O pedido colado é a especificação principal. O DOCX local foi lido como material de referência; suas instruções narrativas não foram tratadas como novas instruções operacionais. A extração de texto está em `docs/regras-extraidas.txt`; PDFs/DOCX originais foram preservados.

O livro usa Confronto, Reflexos e Convicção em um catálogo de dez perícias diferente do pedido. A interface segue **as dez perícias expressamente pedidas**. Formação concede +2 quando consumida em um teste; bônus permanentes e equivalências com o livro ainda precisam de configuração posterior. O livro pede exatamente três principais; o pedido permite até três, então Formação possui 10, 12, 14 ou 16 cartas.

São implementadas as restrições adicionais do livro: mínimo de 12 cartas de Setor, até 8 Universais e máximo de duas cópias por carta; mão máxima de 5 Ações e 4 Formações ao terminar o turno. A primeira compra é 3+2; o primeiro turno não compra outra vez; os turnos próprios seguintes compram 1+1.

Pistola usa alcance 3 no ataque mascarado e +2 de dano fixo ao acertar. Cartas abertas com tag `Arma` aplicam o bônus da arma equipada. Papel e Caneta define disponibilidade pelo contador de turnos próprios: usado no turno 1, indisponível nos turnos 2 e 3, pronto no turno 4. Cartas banidas voltam ao preparar a próxima cena. A\* não é necessário para custo uniforme; BFS ortogonal fornece caminho mínimo e respeita paredes, portas e ocupação.

As quatro cartas universais iniciais implementam seus efeitos básicos. As cartas de Setor são **variantes demonstrativas simplificadas**, identificadas na descrição/tag; não representam implementação integral de cada habilidade do livro. Passivas, reações gerais, duração de estados, diferenças entre Defesa física e argumentativa e rituais de Julgamento continuam sob adjudicação do Mestre. Veja o registro de pendências.

## Identidade e recursos

Paleta base: #0C0C10, #2A2A2F, #FF2F8E, #FF76C7, #D7D7DE e branco, com transparências e tons derivados. Ilustrações de fábrica, escritório, Inferno e cartas foram criadas em SVG/CSS para este projeto; o tabuleiro de referência não foi copiado. O mapa é uma planta original de nove regiões conectadas por corredores.

O olho é SVG, com movimento de íris, dilatação e pulso de abertura. Motion e CSS respeitam `prefers-reduced-motion`. Áudio sintetizado e arquivos só começam após interação; o ambiente compartilha referência de início, com compensação de posição ao carregar o arquivo. A precisão depende do relógio e buffering dos dispositivos; não há relógio de áudio amostrado comum.

Dependências foram fixadas pelo lockfile. Prisma 6 foi mantido para evitar compilação nativa adicional no Windows; overrides de `deepmerge-ts` e `effect` aplicam versões corrigidas, verificadas pela geração do client e testes. Os overrides devem ser reavaliados em uma migração futura para Prisma 7+.
