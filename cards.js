/* ORDER — catálogo de regras do Manual do Procurador v0.1 e das cartas ilustradas.
   Textos das cartas transcritos das artes em assets/Cards. Doutrina não tem arte: usa o catálogo do livro (cap. 11). */
'use strict';
const SKILLS=['Intimidação','Percepção','Investigação','Discernimento','Persuasão','Enganação','Comunicação','Flerte','Furtividade','Resistência'];
const SKILL_INFO={
 'Intimidação':'Armas, luta e pressão física. Usada no D20 de ataque (Confronto no livro).',
 'Percepção':'Iniciativa, armadilhas, sinais e presenças (Reflexos no livro).',
 'Investigação':'Analisar registros, reconstruir cenas, cruzar documentos.',
 'Discernimento':'Perceber mentiras, avaliar alegações e contradições.',
 'Persuasão':'Convencer com razões, oferecer acordos.',
 'Enganação':'Mentir, blefar, esconder a intenção.',
 'Comunicação':'Acalmar, interrogar, conduzir uma conversa.',
 'Flerte':'Conquistar confiança pessoal e ler desejos.',
 'Furtividade':'Ocultar-se, esgueirar-se, furtar pequenos objetos.',
 'Resistência':'Resistir ao medo, a pactos e à pressão moral (Convicção no livro).'
};
const SECTOR_DATA={
 'INCIDÊNCIA':{code:'I',role:'Tank',hp:2,bonus:{'Intimidação':1,'Percepção':1},resource:'Guarda',passive:'Bastião',passiveText:'1 vez por rodada, reduz em 1 o dano que você sofre.',desc:'Você suporta a pressão para que os outros possam continuar. Sua autoridade começa na resistência.'},
 'RELAÇÃO':{code:'R',role:'Equilíbrio',hp:0,bonus:{'Comunicação':1,'Persuasão':1},resource:'Equilíbrio',passive:'Reciprocidade',passiveText:'1 vez por rodada, quando uma carta sua cura ou protege, ganhe +1 Proteção. Alternar as faces A e B ganha Equilíbrio.',desc:'Toda palavra possui duas lâminas. Você sabe quando negociar e quando agir.'},
 'JUSTIÇA':{code:'J',role:'Carry',hp:0,bonus:{'Investigação':1,'Resistência':1},resource:'Autos',passive:'Veredito',passiveText:'Cada Prova verdadeira registrada vira uma carga: +1 de dano num ataque (máx. 2 cargas por Cena).',desc:'O poder não lhe interessa tanto quanto o veredito. Suas decisões têm peso.'},
 'SOCIALISTA':{code:'S',role:'Suporte',hp:0,bonus:{'Comunicação':1,'Flerte':1},resource:'Laços',passive:'Rede de Apoio',passiveText:'1 vez por Cena, receba 2 de Proteção sem gastar Ação. Quando sua Proteção impede dano, ganhe 1 Laço.',desc:'Você vê a força no coletivo. Proteger alguém pode mudar a sentença de todos.'},
 'DOUTRINA':{code:'D',role:'Assassino',hp:-2,bonus:{'Furtividade':1,'Intimidação':1},resource:'Sombra',passive:'Sentença Solitária',passiveText:'O primeiro ataque por rodada contra um inimigo isolado causa +2 de dano.',desc:'Quando a verdade exige precisão, você prefere terminar o conflito antes que ele cresça.'}
};
const SINS={
 'Apostador':{bonus:{'Persuasão':1,'Enganação':1},passive:'Jogada Marcada',text:'Antes do D6, cante um número. Acertando exatamente, ganhe um disparo extra da Pistola (1 vez por rodada).'},
 'Miliciano':{bonus:{'Intimidação':1},passive:'Apreender',text:'Apreenda a carta virada de um inimigo antes que ela seja revelada. Recarga: 3 rodadas.'},
 'Luxuosa':{bonus:{'Flerte':1,'Comunicação':1},passive:'Encanto',text:'1 vez por rodada, quando o D6 de um inimigo ativar contra você, ele rola de novo.'},
 'Traidor':{bonus:{'Enganação':1,'Furtividade':1},passive:'Por Trinta',text:'1 vez por Cena, compre 2 Ações e ganhe +3 de movimento no seu turno. No Hells custa 1 Sanidade.'},
 'Ganancioso':{bonus:{'Comunicação':1},passive:'Tudo Meu',text:'Cada carta sua Banida nesta Cena dá +1 de dano aos seus ataques (máx. +3).'},
 'Invído':{bonus:{'Discernimento':1},passive:'Inveja Formada',text:'Sua Formação tem 13 cartas. 1 vez por Cena, reutilize a última Formação descartada.'},
 'Conselho de Onça':{bonus:{'Enganação':1},passive:'Conselho de Onça',text:'Quando um disparo da Pistola acerta, o alvo perde a Proteção e causa 2 a menos no próximo ataque.'}
};
const INSTRUMENTS={
 papel:{name:'Papel e Caneta',text:'VIRE: compre 1 Ação extra. Volta 3 rodadas depois.',recharge:3,icon:'✎'},
 pasta:{name:'Pasta de Contratos',text:'VIRE: +2 no próximo teste de Investigação ou Discernimento (no combate: +1 de dano no próximo ataque). Recarga 3 rodadas.',recharge:3,icon:'▤'},
 espelho:{name:'Espelho de Bolso',text:'VIRE: role de novo um D6 seu que falhou. Recarga 2 rodadas.',recharge:2,icon:'◐'},
 distintivo:{name:'Distintivo Morto',text:'VIRE: receba 2 de Proteção até o seu próximo turno. Recarga 3 rodadas.',recharge:3,icon:'✠'}
};
const WEAPON={id:'PIS',name:'Pistola',type:'Equipamento',sector:'EQUIPAMENTO',range:2,damage:2,dice:[1,3,5,6],icon:'pistol',art:'',hells:'Disparo: alcance 2. Acertou no D6, causa 1 + 2 de dano. Também é o bônus de arma das cartas de ataque com arma.',comum:'Ameaça com arma: +1 em Intimidação.',text:'Alcance 2. Acertou no D6 (1 · 3 · 5 · 6): 1 + 2 de dano.'};
const STATUS_INFO={
 exposto:'Exposto: o próximo dano contra ele causa +1.',abalado:'Abalado: −2 no próximo D20.',contido:'Contido: não se move neste turno.',
 sangramento:'Sangramento: 1 de dano no início de dois turnos.',julgamento:'Sob Julgamento: marcado pela Justiça.',observado:'Observado: o próximo ataque contra ele causa +1.',
 oculto:'Oculto: o próximo ataque causa +2 de dano.',provocado:'Provocado: prioriza você.',enfraquecido:'Enfraquecido: o próximo golpe causa −2.'
};
const C=(id,name,sector,dice,hells,comum,extra={})=>({id,name,sector,dice,hells,comum,art:sector==='DOUTRINA'?'':`assets/Cards/web/${id}.webp`,...extra});
const CARDS=Object.fromEntries([
 C('U01','Disparo Cauteloso','UNIVERSAL',[1,2,3,5,6],'Ataque com arma. Causa 1 de dano base, além do bônus da arma equipada.','Realiza um ataque de 1 de dano base ou concede +1 ao próximo teste de Intimidação contra o alvo.',{kind:'attack',range:'weapon'}),
 C('U02','Cobrir-se','UNIVERSAL',[1,2,4,6],'Recebe 2 de Proteção.','Recupera 1 de Moral ou reduz em 1 a Suspeita de um NPC.',{kind:'guard'}),
 C('U03','Observação Silenciosa','UNIVERSAL',[2,3,4,6],'O próximo ataque contra o inimigo observado recebe +1 de dano.','Recebe +1 no próximo teste de Percepção ou Investigação relacionado à cena.',{kind:'mark',range:4}),
 C('U04','Passo Lateral','UNIVERSAL',[1,3,5,6],'Movimenta até 2 quadrados adicionais sem atacar.','Movimenta até 2 quadrados adicionais durante exploração.',{kind:'move'}),
 C('U05','Interrogar','UNIVERSAL',[1,2,3,6],'Aplica Exposto a um inimigo ao alcance de visão.','Permite formular uma pergunta adicional e concede +1 ao teste de Comunicação associado.',{kind:'mark',range:5}),
 C('U06','Primeiros Socorros','UNIVERSAL',[1,2,5,6],'Recupera 2 de Vida de um alvo adjacente ou de si mesmo.','Recupera 2 de Vida durante uma situação física de perigo.',{kind:'heal'}),
 C('U07','Documento de Guarda','UNIVERSAL',[1,3,4,5],'Recebe 2 de Proteção contra o próximo ataque.','Recupera 1 de Moral ao organizar uma evidência já obtida. Não cria novas provas.',{kind:'guard'}),
 C('U08','Fuga Calculada','UNIVERSAL',[2,3,5,6],'Movimenta até 3 quadrados para longe de um inimigo.','Abandona uma posição perigosa. A consequência narrativa depende do contexto.',{kind:'move'}),
 C('U09','Pressentimento','UNIVERSAL',[1,2,4,6],'Revela a direção do próximo ataque anunciado e recebe 1 de Proteção.','Permite observar uma reação corporal de um NPC antes de escolher a próxima resposta.',{kind:'guard'}),
 C('U10','Último Recurso','UNIVERSAL',[2,4,5],'Causa 3 de dano em alcance 1. O personagem perde 1 de Vida após o ataque.','Recebe +2 em um teste de Intimidação e perde 1 de Moral.',{kind:'attack',range:1}),
 C('I01','Interposição','INCIDÊNCIA',[1,2,3,5],'Concede 3 de Proteção a si mesmo ou a um aliado. Se impedir dano real, ganha 1 Guarda.','Assume uma consequência física destinada a outra pessoa. Recebe 2 de Proteção durante a ação.',{kind:'guard'}),
 C('I02','Arrombamento','INCIDÊNCIA',[2,3,4,5],'Causa 2 de dano e empurra o alvo 1 quadrado.','Força uma porta ou obstáculo físico. Pode aumentar a Suspeita de testemunhas.',{kind:'attack',range:1}),
 C('I03','Escudo Humano','INCIDÊNCIA',[1,4,5,6],'Redireciona para si o próximo ataque contra um aliado adjacente e reduz o dano em 2. No jogo solo, reduz em 2 o próximo dano contra si.','Intervém fisicamente para impedir uma agressão a alguém próximo.',{kind:'guard'}),
 C('I04','Pisada de Ferro','INCIDÊNCIA',[1,2,6],'Causa 3 de dano em alcance 1. O alvo perde 1 quadrado de movimentação no próximo turno.','Bloqueia fisicamente uma passagem durante um turno.',{kind:'attack',range:1}),
 C('I05','Não Recuo','INCIDÊNCIA',[1,2,3,4,6],'Reduz em 2 o próximo dano recebido. Se realmente impedir dano, ganha 1 Guarda.','Recebe +2 em um teste de Resistência para manter uma posição ou suportar intimidação.',{kind:'guard'}),
 C('I06','Ameaça Visível','INCIDÊNCIA',[1,3,4,6],'Um inimigo próximo é provocado a priorizar o Searcher no próximo ataque, quando possível.','Recebe +2 em Intimidação, mas pode aumentar Suspeita se usar a ameaça contra alguém vulnerável.',{kind:'mark',range:3}),
 C('I07','Resposta Brutal','INCIDÊNCIA',[2,3,6],'Gasta 2 Guarda para causar 4 de dano em alcance 1.','Pode pressionar fisicamente um suspeito para receber +2 em Intimidação, perdendo 1 de Moral.',{kind:'attack',range:1}),
 C('I08','Barreira da Culpa','INCIDÊNCIA',[1,2,5,6],'Concede 2 de Proteção aos aliados adjacentes. Sem aliados, recebe 3 de Proteção.','Protege um testemunho ou uma pessoa ameaçada, impedindo uma interrupção física imediata.',{kind:'guard'}),
 C('I09','Avanço Demolidor','INCIDÊNCIA',[2,4,5],'Avança até 2 quadrados e causa 2 de dano a um inimigo adjacente.','Força passagem por um obstáculo simples, gastando 1 de Moral se houver resistência.',{kind:'attack',range:3}),
 C('I10','Última Linha','INCIDÊNCIA',[1,5,6],'Se estiver com metade ou menos da Vida, recebe 5 de Proteção. Se for atingido, revida com 2 de dano.','Se estiver com 3 ou menos de Moral, recupera 2 de Moral e não pode atacar na mesma ação.',{kind:'guard'}),
 C('J01','Abrir Inquérito','JUSTIÇA',[1,2,3,5],'Marca um inimigo como Sob Julgamento por 2 turnos e ganha 1 Auto.','Abre uma nova linha de questionamento. Ganha 1 Auto somente ao verificar uma informação relevante.',{kind:'mark',range:5,cost:1}),
 C('J02','Presunção','JUSTIÇA',[1,2,4,6],'Recebe 2 de Proteção. Se um inimigo atacar durante o efeito, ganha 1 Auto.','Protege alguém de coerção injustificada. Recupera 1 de Moral quando evita uma agressão desnecessária.',{kind:'guard',cost:1}),
 C('J03','Confrontar Testemunha','JUSTIÇA',[1,3,4,5],'Aplica Exposto. Se o inimigo estiver Sob Julgamento, ganha 1 Auto.','Recebe +2 em Discernimento ao confrontar um depoimento com uma evidência real. Se confirmar uma contradição, ganha 1 Auto.',{kind:'mark',range:4,cost:1}),
 C('J04','Balança de Ferro','JUSTIÇA',[1,3,5,6],'Gasta 1 Auto para receber 3 de Proteção e causar 1 de dano ao próximo atacante.','Gasta 1 Auto para repetir um teste de Persuasão ou Discernimento.',{kind:'guard',cost:2}),
 C('J05','Sentença Condicional','JUSTIÇA',[2,3,5,6],'Causa 2 de dano, recebendo +2 contra um alvo Sob Julgamento.','Recebe +2 em um julgamento argumentado com pelo menos duas evidências independentes.',{kind:'attack',range:2,cost:1}),
 C('J06','Registro Irrefutável','JUSTIÇA',[1,3,4,6],'Recebe 1 de Proteção. Se bloquear um ataque anunciado, ganha 1 Auto.','Compara dois documentos. Se encontrar uma contradição verificável, ganha 1 Auto e +1 Investigação.',{kind:'guard',cost:1}),
 C('J07','Direito de Defesa','JUSTIÇA',[1,2,3,6],'Recebe 2 de Proteção. Se decidir não atacar neste turno, ganha 1 Auto.','Permite ouvir uma defesa adicional do acusado e pode reduzir 1 de Suspeita.',{kind:'guard',cost:1}),
 C('J08','Ônus da Prova','JUSTIÇA',[1,3,5,6],'O próximo ataque de um inimigo Sob Julgamento causa 2 de dano a menos.','Recebe +2 em Discernimento para avaliar uma alegação não comprovada.',{kind:'mark',range:5,cost:1}),
 C('J09','Veredito','JUSTIÇA',[2,4,6],'Gasta 2 Autos para causar 4 de dano a um inimigo Sob Julgamento. Sem ambos os requisitos, causa 1 de dano.','Gasta 2 Autos para repetir um teste decisivo de julgamento fundamentado em evidências.',{kind:'attack',range:3,cost:1}),
 C('J10','Justiça Cega','JUSTIÇA',[1,5,6],'Causa 2 de dano a um alvo Sob Julgamento. Se o alvo não estiver marcado, recebe 2 de Proteção em vez de atacar.','Permite resistir à pressão para emitir um julgamento sem evidências suficientes, preservando 1 de Moral.',{kind:'attack',range:3,cost:1}),
 C('R01','Dois Lados','RELAÇÃO',[1,2,3,5,6],'A: causa 2 de dano. B: recebe 2 de Proteção.','A: +1 Persuasão. B: +1 Enganação.',{kind:'choice',options:[{label:'A · 2 de dano',attack:true,range:2},{label:'B · 2 de Proteção'}]}),
 C('R02','Acordo Provisório','RELAÇÃO',[1,2,4,6],'A: recupera 2 de Vida. B: movimenta 2 quadrados adicionais.','A: recupera 1 de Moral. B: reduz 1 de Suspeita.',{kind:'choice',options:[{label:'A · +2 Vida'},{label:'B · +2 movimento'}]}),
 C('R03','Espelho Social','RELAÇÃO',[1,3,4,6],'A: causa 1 de dano e compra 1 carta. B: recebe 2 de Proteção.','A: +1 Discernimento. B: +1 Comunicação.',{kind:'choice',options:[{label:'A · 1 de dano e compra 1',attack:true,range:2},{label:'B · 2 de Proteção'}]}),
 C('R04','Voz Suave, Mão Firme','RELAÇÃO',[1,2,3,6],'A: causa 2 de dano. B: empurra 1 quadrado e recebe 1 de Proteção.','A: +2 Persuasão. B: +2 Intimidação.',{kind:'choice',options:[{label:'A · 2 de dano',attack:true,range:1},{label:'B · empurrar e +1 Proteção',target:true,range:1}]}),
 C('R05','Termos Ocultos','RELAÇÃO',[2,3,4,5],'A: compra 1 carta. B: faz o inimigo descartar 1 carta, se possuir mão.','A: permite uma pergunta extra. B: concede +1 ao teste para perceber evasivas.',{kind:'choice',options:[{label:'A · comprar 1'},{label:'B · enfraquecer intenção',target:true,range:5}]}),
 C('R06','Troca Justa','RELAÇÃO',[1,2,5,6],'A: transfere 2 de sua Vida para recuperar 3 de um aliado. Sozinho, recupera 1. B: causa 2 de dano e perde 1 de Vida.','A: gasta 1 de Moral para proteger uma relação ameaçada. B: ganha 1 de Moral, aumentando 1 de Suspeita.',{kind:'choice',options:[{label:'A · recuperar 1 Vida'},{label:'B · 2 de dano, perde 1 Vida',attack:true,range:1}]}),
 C('R07','Caminho do Meio','RELAÇÃO',[1,2,4,5],'A: move 2 quadrados e recebe 1 de Proteção. B: causa 1 de dano e recupera 1 de Vida.','A: +1 Investigação. B: +1 Comunicação.',{kind:'choice',options:[{label:'A · +2 movimento, +1 Proteção'},{label:'B · 1 de dano, +1 Vida',attack:true,range:2}]}),
 C('R08','Oferta e Cobrança','RELAÇÃO',[1,2,3,6],'A: aplica Exposto. B: recupera 2 de Vida.','A: abre uma possibilidade de negociação. B: recupera 1 de Moral e aumenta 1 de Suspeita.',{kind:'choice',options:[{label:'A · Exposto',target:true,range:4},{label:'B · +2 Vida'}]}),
 C('R09','Contrato de Duas Vias','RELAÇÃO',[1,3,4,5],'A: concede +1 de dano ao próximo ataque. B: compra 1 carta.','A: +2 no próximo teste que utilize uma evidência citada. B: adia uma decisão imediata, gastando 1 de Moral.',{kind:'choice',options:[{label:'A · +1 dano no próximo ataque'},{label:'B · comprar 1'}]}),
 C('R10','Equilíbrio Perfeito','RELAÇÃO',[2,5,6],'Gasta 2 Equilíbrios para causar 3 de dano e receber 2 de Proteção. Sem recurso, escolhe causar 1 de dano ou receber 1 de Proteção.','Gasta 2 Equilíbrios para repetir um teste social. Sem recurso, concede +1 a um teste.',{kind:'attack',range:2}),
 C('S01','Escuta Atenta','SOCIALISTA',[1,2,3,5,6],'Concede 2 de Proteção a si mesmo ou a um aliado. Ganha 1 Laço se impedir dano.','Faz uma pergunta empática e recupera 1 de Moral se obtiver um testemunho relevante.',{kind:'guard'}),
 C('S02','Rede de Apoio','SOCIALISTA',[1,2,4,6],'Recupera 2 de Vida. Quando utilizada em outro personagem, recupera 3.','Reduz 1 de Suspeita e recupera 1 de Moral durante uma conversa cooperativa.',{kind:'heal'}),
 C('S03','Dividir o Peso','SOCIALISTA',[1,3,4,6],'Divide com um aliado o próximo dano recebido por ele e reduz o dano total em 2. Sozinho, reduz seu próximo dano em 2.','Gasta 1 de Moral para impedir uma perda imediata de 1 de Confiança causada por uma falha de comunicação.',{kind:'guard'}),
 C('S04','Vínculo','SOCIALISTA',[1,2,3,6],'Um aliado recebe 2 de Proteção e +1 no próximo ataque. Sozinho, recebe 1 de Proteção e +1 no próximo ataque.','Concede +2 em Comunicação ao ajudar alguém durante um diálogo.',{kind:'guard'}),
 C('S05','Círculo Seguro','SOCIALISTA',[1,3,5,6],'Todos os aliados adjacentes, incluindo o usuário, recebem 2 de Proteção.','Cria uma oportunidade de conversar com uma pessoa assustada sem pressioná-la.',{kind:'guard'}),
 C('S06','Trégua','SOCIALISTA',[1,2,4,5],'Impede o próximo ataque de um inimigo comum. Contra chefes, reduz em 2 o dano anunciado.','Reduz 2 de Suspeita. O personagem não pode realizar ataque físico na mesma ação.',{kind:'mark',range:5}),
 C('S07','Reerguer','SOCIALISTA',[1,3,4,6],'Gasta 1 Laço para recuperar 3 de Vida e remover um efeito negativo simples.','Gasta 1 Laço para recuperar 2 de Moral de um personagem.',{kind:'heal'}),
 C('S08','Palavra de Amparo','SOCIALISTA',[1,2,5,6],'Recebe 2 de Proteção e remove 1 de dano recente à Sanidade, se houver.','Recupera 2 de Moral e interrompe um estado narrativo de pânico imediato.',{kind:'guard'}),
 C('S09','Pacto de Proteção','SOCIALISTA',[2,4,6],'Gasta 2 Laços para conceder 5 de Proteção a um aliado. Sozinho, recebe 4.','Gasta 2 Laços para repetir um teste social e impedir perda de Confiança causada por esse teste.',{kind:'guard'}),
 C('S10','Todos Voltam','SOCIALISTA',[1,5,6],'Se estiver com metade ou menos da Vida, recupera 3 de Vida e recebe 2 de Proteção.','Após proteger efetivamente uma pessoa vulnerável, pode recuperar 1 de Confiança, uma vez por sessão.',{kind:'heal'}),
 C('D01','Corte Único','DOUTRINA',[1,3,5,6],'Causa 4 de dano a um alvo isolado em alcance 1.','Causa 2 de dano e, se estava oculto, obtém prova material acessível.',{kind:'attack',range:1,glyph:'†'}),
 C('D02','Passagem Cega','DOUTRINA',[1,2,4,6],'Mova até 4 casas ignorando controle de passagem.','Atravesse área vigiada com +2 em Furtividade.',{kind:'move',glyph:'⟿'}),
 C('D03','Punhal do Segredo','DOUTRINA',[1,3,4,6],'Cause 3 de dano; +2 se o alvo não o percebeu (você está Oculto).','Custa 1 Moral; cause 2 Incisão por Enganação, sem revelar a fonte.',{kind:'attack',range:1,glyph:'⸸'}),
 C('D04','Vulto de Serviço','DOUTRINA',[2,3,5,6],'Fique Oculto até atacar ou ser visto de perto.','Infiltração: adversário recebe −2 Percepção para notá-lo.',{kind:'guard',glyph:'◑'}),
 C('D05','Assinatura Falsa','DOUTRINA',[1,2,5,6],'Cause 2 de dano e faça o alvo errar o foco: −2 no próximo ataque dele.','Custa 1 Moral; falsifique 1 documento menor; Percepção adversária DT 16 revela.',{kind:'attack',range:2,glyph:'✍'}),
 C('D06','Execução Precisa','DOUTRINA',[1,2,3,5],'Cause 3 de dano e marque Sangramento por 2 turnos.','Cause 3 de dano físico a um único alvo; testemunhas geram suspeita.',{kind:'attack',range:1,glyph:'✕'}),
 C('D07','Fora do Registro','DOUTRINA',[1,3,4,5],'Mova 3 casas sem provocar reação e ganhe +1 no próximo D20 de ataque.','Apague vestígio menor; +2 em Enganação ao justificar sua ausência.',{kind:'move',glyph:'∅'}),
 C('D08','Assassino de Sombras','DOUTRINA',[1,2,4,5],'Cause 5 de dano em alvo isolado; se falhar no D20, sofra 1 de dano.','Cause 2 Incisão por Furtividade após revelar segredo obtido sem autorização.',{kind:'attack',range:1,glyph:'☠'})
].map(c=>[c.id,c]));
/* Tipos (pedido do autor): Ação vira na sua vez; Reação vira quando você é atacado; Armadilha é armada numa casa e dispara em quem pisar. */
const CARD_TYPE={U02:'Reação',U07:'Reação',I01:'Reação',I03:'Reação',I05:'Reação',I10:'Reação',J02:'Reação',J04:'Reação',J06:'Reação',S01:'Reação',S03:'Reação',S09:'Reação',D04:'Reação',U03:'Armadilha',J01:'Armadilha',J08:'Armadilha',S06:'Armadilha',D05:'Armadilha',I06:'Armadilha'};
const CARD_ICON={U01:'pistol',U02:'shield',U03:'eye',U04:'boot',U05:'lantern',U06:'cross',U07:'document',U08:'arrow',U09:'lantern',U10:'heart',I01:'shield',I02:'hammer',I03:'shield',I04:'boot',I05:'flag',I06:'eye',I07:'fist',I08:'wall',I09:'arrow',I10:'heart',J01:'book',J02:'scales',J03:'document',J04:'scales',J05:'sword',J06:'book',J07:'shield',J08:'scales',J09:'sword',J10:'sword',R01:'mask',R02:'hand',R03:'mirror',R04:'hand',R05:'document',R06:'rings',R07:'arrow',R08:'hand',R09:'quill',R10:'scales',S01:'hand',S02:'cross',S03:'scales',S04:'rings',S05:'shield',S06:'hand',S07:'cross',S08:'heart',S09:'chain',S10:'lantern',D01:'dagger',D02:'arrow',D03:'dagger',D04:'mask',D05:'quill',D06:'dagger',D07:'boot',D08:'skull'};
/* Sem D20 no combate: o D6 nas faces impressas decide se a carta funciona. Textos Hells reescritos para isso. */
const HELLS_TEXT={
 U02:'Reação · quando for atacado: receba 2 de Proteção antes do dano.',U07:'Reação · quando for atacado: receba 2 de Proteção contra este ataque.',
 U03:'Armadilha · arme numa casa a até 2. Quem pisar fica Exposto e Observado (+2 no próximo dano contra ele).',
 U05:'Aplique Exposto a um inimigo à vista: +1 no próximo dano contra ele.',U09:'Revele as cartas viradas dos inimigos e receba 1 de Proteção.',
 I01:'Reação · quando for atacado: receba 3 de Proteção. Se impedir dano, ganhe 1 Guarda.',I03:'Reação · quando for atacado: o dano deste ataque cai 2.',I05:'Reação · quando for atacado: o dano cai 2. Se impedir dano, ganhe 1 Guarda.',
 I06:'Armadilha · quem pisar fica Contido (para ali e não anda na próxima rodada) e Exposto.',I10:'Reação · quando for atacado com metade da Vida ou menos: receba 5 de Proteção e revide 2 de dano.',
 J01:'Armadilha · quem pisar fica Sob Julgamento por 2 rodadas. Você ganha 1 Auto.',J02:'Reação · quando for atacado: receba 2 de Proteção e ganhe 1 Auto.',
 J03:'Aplique Exposto (+1 no próximo dano). Se o alvo estiver Sob Julgamento, ganhe 1 Auto.',J04:'Reação · quando for atacado: gaste 1 Auto para receber 3 de Proteção e causar 1 de dano no atacante.',
 J06:'Reação · quando for atacado: receba 1 de Proteção. Se bloquear todo o dano, ganhe 1 Auto.',J07:'Receba 2 de Proteção. Se não atacar nesta rodada, ganhe 1 Auto.',
 J08:'Armadilha · quem pisar fica Sob Julgamento e causa 2 de dano a menos no próximo ataque.',
 S01:'Reação · quando for atacado: receba 2 de Proteção. Ganhe 1 Laço se impedir dano.',S03:'Reação · quando for atacado: o dano deste ataque cai 2.',S04:'Receba 1 de Proteção e cause +1 de dano no próximo ataque.',
 S06:'Armadilha · quem pisar perde o próximo ataque. Chefes causam 2 a menos.',S09:'Reação · quando for atacado: gaste 2 Laços para receber 4 de Proteção.',
 D03:'Cause 3 de dano; +2 se você estiver Oculto.',D04:'Reação · quando for atacado: o ataque erra e você fica Oculto (+2 de dano no seu próximo ataque).',
 D05:'Armadilha · quem pisar sofre 2 de dano e causa 2 a menos no próximo ataque.',D07:'Mova 3 casas e cause +1 de dano no próximo ataque.',D08:'Cause 5 de dano a um alvo isolado (3 se ele tiver companhia).'
};
for(const c of Object.values(CARDS)){c.type=CARD_TYPE[c.id]||'Ação';c.icon=CARD_ICON[c.id]||'eye';if(HELLS_TEXT[c.id])c.hells=HELLS_TEXT[c.id];c.art=''}
/* Decks prontos (cap. 11.3): 2× seis cartas do Setor + 2× quatro Universais = 20 Ações. */
const STARTER={
 'INCIDÊNCIA':{sector:['I04','I09','I07','I01','I05','I10'],universal:['U01','U02','U06','U04']},
 'JUSTIÇA':{sector:['J01','J03','J05','J09','J10','J02'],universal:['U01','U10','U06','U02']},
 'RELAÇÃO':{sector:['R01','R04','R03','R08','R07','R10'],universal:['U01','U10','U06','U02']},
 'SOCIALISTA':{sector:['S01','S02','S04','S05','S07','S10'],universal:['U01','U10','U06','U05']},
 'DOUTRINA':{sector:['D01','D03','D04','D05','D06','D08'],universal:['U01','U02','U06','U04']}
};
function starterDeck(sector){const s=STARTER[sector]||STARTER['JUSTIÇA'];return [...s.sector,...s.universal].flatMap(id=>[id,id])}
function formationDeck(main,sin){if(sin==='Invído')return [...SKILLS,...main.slice(0,3)];return [...SKILLS,...main.flatMap(s=>[s,s])]}
function skillBonus(profile,skill){const a=SECTOR_DATA[profile.sector]?.bonus?.[skill]||0,b=SINS[profile.sinChoice]?.bonus?.[skill]||0;return Math.min(3,a+b)}
/* Regra de mesa do prólogo: o D20 de ataque usa a melhor perícia entre Intimidação e a perícia-assinatura do Setor. */
const ATTACK_SKILL={'INCIDÊNCIA':'Intimidação','RELAÇÃO':'Persuasão','JUSTIÇA':'Investigação','SOCIALISTA':'Comunicação','DOUTRINA':'Furtividade'};
function attackSkill(profile){const alt=ATTACK_SKILL[profile.sector]||'Intimidação';return skillBonus(profile,alt)>skillBonus(profile,'Intimidação')?alt:'Intimidação'}
function maxHp(profile){return 12+(SECTOR_DATA[profile.sector]?.hp||0)}
if(typeof module!=='undefined')module.exports={CARD_TYPE,CARD_ICON,SKILLS,SKILL_INFO,SECTOR_DATA,SINS,INSTRUMENTS,WEAPON,STATUS_INFO,CARDS,STARTER,starterDeck,formationDeck,skillBonus,maxHp,attackSkill,ATTACK_SKILL};
