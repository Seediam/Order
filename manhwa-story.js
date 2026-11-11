/* ORDER — O Pecado da Misericórdia. Roteiro da edição em quadrinhos (manhwa / HQ de terror).
   Cada página tem um layout de quadros; cada quadro tem cenário, personagens, balões, narração, onomatopeia e efeitos.
   Efeitos de quadro (fx): impact (tremor), blink (olhos se apagando), film (filme antigo), flash (relâmpago), transform (transformação), glitch. */
'use strict';
const MangaStory=(()=>{
 const bg={church:'assets/web/bg-igreja.webp',nave:'assets/web/bg-nave.webp',patio:'assets/web/bg-patio.webp',archive:'assets/web/bg-arquivo.webp',confession:'assets/web/bg-confessionario.webp',corridor:'assets/web/bg-corredor.webp',room:'assets/web/bg-quarto.webp',sacristy:'assets/web/bg-sacristia.webp',hell:'assets/web/bg-hells.webp',arena:'assets/web/arena-hells.webp',map:'assets/web/map-igreja.webp'};
 const art={logo:'assets/web/logo.webp',lia:'assets/web/lia.webp',elvira:'assets/web/elvira.webp',demon:'assets/web/elvira-demon.webp',echo:'assets/web/eco.webp',guardian:'assets/web/guardiao.webp',homem:{normal:'assets/web/man-visual.webp',hell:'assets/web/man-hells.webp'},mulher:{normal:'assets/web/woman-visual.webp',hell:'assets/web/woman-hells.webp'}};
 const names={lia:'Lia',elvira:'Dona Elvira',demon:'Elvira',echo:'Eco do Contrato',guardian:'Guardião do Prazo'};
 const sectors={
  'INCIDÊNCIA':{code:'I',color:'#c2384f',role:'Tank · a presença que protege',line:'Sustentar o que os outros não suportam.',text:'Você fica entre a ameaça e quem ainda pode ser salvo. No combate, segura golpes e protege aliados.',quote:'“Antes da sentença, ninguém mais se machuca.”'},
  'RELAÇÃO':{code:'R',color:'#9b5fd6',role:'Equilíbrio · a palavra que aproxima',line:'Toda palavra tem duas lâminas.',text:'Você procura o acordo possível sem esquecer o preço. Suas cartas têm duas faces: atacar ou proteger.',quote:'“Diga o que ainda não conseguiu contar.”'},
  'JUSTIÇA':{code:'J',color:'#d19a3c',role:'Carry · o peso da sentença',line:'Uma sentença também pesa em quem assina.',text:'Você confronta versões e transforma provas em força. Marca culpados e cobra com precisão.',quote:'“O bem que fez não apaga o mal que permitiu.”'},
  'SOCIALISTA':{code:'S',color:'#3fa985',role:'Suporte · quem enxerga os que ficam',line:'Nenhuma alma atravessa sozinha.',text:'Você pensa em todos que a decisão alcança. Cura, protege e mantém o grupo de pé.',quote:'“Quem vai pagar por esta decisão amanhã?”'},
  'DOUTRINA':{code:'D',color:'#7d8bb0',role:'Assassino · a certeza que age',line:'Há decisões que não admitem desvio.',text:'Você age com precisão quando chega a hora. Golpes únicos, sombras e alvos isolados.',quote:'“Quando eu assinar, sustentarei a consequência.”'}
 };
 const sins={'Apostador':'Arriscou tudo num número.','Miliciano':'Tomou o que não era seu, em nome da ordem.','Luxuosa':'Fez do desejo uma moeda.','Traidor':'Vendeu quem confiava em você.','Ganancioso':'Nunca era o bastante.','Invído':'Quis a vida de outra pessoa.','Conselho de Onça':'Seus conselhos levavam ao abismo.'};
 const skills=['Investigação','Percepção','Comunicação','Resistência'];
 const endings={
  collect:{name:'Elvira, além do véu',monster:'demon',title:'A mulher que você trouxe consigo.',voice:'Você levou a alma de Elvira ao Hells. Aqui, a culpa ganha corpo. A mão que dava abrigo agora quer guardar tudo para sempre.',last:'Elvira ainda olha para a porta que já não existe. Os dedos se abrem. Há dedos demais. Para concluir a cobrança, você terá de enfrentá-la.'},
  mercy:{name:'O Eco do Contrato',monster:'echo',title:'A dívida que você aceitou carregar.',voice:'Elvira continua viva na igreja. Lia ainda tem quem a espere. Mas o contrato que você recusou cobrar veio junto. Esta criatura é a dívida que você assumiu.',last:'O Eco repete sua sentença com a sua própria voz: “Ela fica.” Você poupou Elvira. Agora terá de enfrentar o preço.'},
  defer:{name:'O Guardião do Prazo',monster:'guardian',title:'Até o tempo exige uma garantia.',voice:'Elvira ganhou mais uma noite para procurar a família de João. Você garantiu esse prazo com o próprio nome. O Guardião veio cobrar a garantia.',last:'A passagem de volta está atrás dele. Para retornar à igreja e terminar seu julgamento, você terá de vencê-lo.'}
 };
 const A=(who,side='right',o={})=>({who,side,...o});
 const B=(who,text,at='tr',o={})=>({who,text,at,...o});
 /* ---------------- Capítulo 0 · o que é ORDER ---------------- */
 function intro(){return[
  {id:'i-death',part:'intro',chapter:'Capítulo 0 · O que é ORDER',title:'Você morreu.',layout:'strips3',rain:.2,film:true,panels:[
   {bg:'black',big:'Você morreu.',fx:'blink',caption:{text:'Não houve túnel. Não houve luz. Houve um balcão, uma fila e um nome sendo chamado.',at:'bottom'}},
   {bg:'room',shot:'wide',tint:'cold',doc:{heading:'CERTIDÃO DE CONDENAÇÃO',lines:['Pecado registrado: o seu.','Sentença: eterna.','Observação: elegível ao serviço.']},caption:{text:'Você morreu com um pecado gravado no nome. O Inferno comprou a sua condenação.',at:'top'}},
   {bg:'hell',shot:'wide',caption:{text:'E então ofereceu a pior das oportunidades: trabalhar para quem é dono da sua alma.',at:'bottom'},sfx:{text:'ASSINE',at:'tr',shake:true}}
  ]},
  {id:'i-searchers',part:'intro',chapter:'Capítulo 0 · O que é ORDER',title:'Os Searchers.',layout:'top1-bottom2',rain:.2,panels:[
   {bg:'church',shot:'wide',actors:[A('silhouette','center',{scale:.9})],caption:{text:'Em ORDER, você é um Searcher, um Procurador. Humanos mortos que voltam à Terra para cobrar contratos: almas vendidas, dívidas vencidas, pactos esquecidos.',at:'top'}},
   {bg:'archive',shot:'mid',doc:{heading:'A ORDEM É CLARA',lines:['Encontrar o devedor.','Apurar o contrato.','Cobrar a alma.']},caption:{text:'A ordem é clara.',at:'bottom'}},
   {bg:'confession',shot:'mid',tint:'red',caption:{text:'A verdade, quase nunca. Antes de cobrar, você investiga, ouve e julga.',at:'bottom'},sfx:{text:'?',at:'tc'}}
  ]},
  {id:'i-judgment',part:'intro',chapter:'Capítulo 0 · O que é ORDER',title:'Toda cobrança é um julgamento.',layout:'four',panels:[
   {bg:'nave',shot:'wide',caption:{text:'No fim de cada contrato, você escolhe uma sentença. Nenhuma é a resposta certa. Todas têm preço.',at:'top'}},
   {bg:'black',big:'COBRAR',sub:'Cumprir o contrato. Fama no Inferno. Peso na consciência.',tint:'red'},
   {bg:'black',big:'POUPAR',sub:'Deixar viver. Você carrega a dívida aberta.',tint:'cold'},
   {bg:'black',big:'ADIAR',sub:'Ganhar tempo. Seu nome vira a garantia.',tint:'gold'}
  ]},
  {id:'i-worlds',part:'intro',chapter:'Capítulo 0 · O que é ORDER',title:'Dois territórios.',layout:'stack2',rain:.3,panels:[
   {bg:'church',shot:'wide',caption:{text:'CÓMUM — o mundo dos vivos. Aqui o conflito é humano: investigação, provas, conversas, mentiras. Uma palavra certa pode destruir uma vida.',at:'top'},sfx:{text:'CÓMUM',at:'br',color:'paper'}},
   {bg:'hell',shot:'wide',tint:'red',caption:{text:'HELLS — onde a sentença ganha corpo. Aqui o conflito é luta, sobrevivência e hierarquia infernal. A força nunca prova inocência.',at:'bottom'},sfx:{text:'HELLS',at:'tr',shake:true}}
  ]},
  {id:'i-rules',part:'intro',chapter:'Capítulo 0 · O que é ORDER',title:'Cartas, dados e fama.',layout:'l-tall',panels:[
   {bg:'arena',shot:'mid',tint:'red',caption:{text:'ORDER é um RPG de mesa com deckbuilder e terror psicológico. Cada Searcher tem um deck de Ações e um deck de Formação (suas perícias).',at:'top'}},
   {bg:'black',dice:'d6',caption:{text:'O D6 diz se uma carta funciona: ela traz as faces que ativam impressas nela.',at:'bottom'}},
   {bg:'black',dice:'d20',caption:{text:'O D20 decide os testes de risco: investigar, resistir ao medo, convencer.',at:'bottom'}}
  ]},
  {id:'i-fame',part:'intro',chapter:'Capítulo 0 · O que é ORDER',title:'Sua fama é sua caçada.',layout:'top2-bottom1',rain:.15,film:true,panels:[
   {bg:'hell',shot:'close',caption:{text:'Cada contrato cumprido aumenta sua Hell of Fame. Fama abre Portões, poderes e recompensas.',at:'top'}},
   {bg:'corridor',shot:'mid',tint:'red',caption:{text:'Mas também chama rivais. Quanto mais alto o seu nome, mais perto os outros cobradores.',at:'bottom'}},
   {bg:'church',shot:'wide',caption:{text:'Esta história é o seu primeiro contrato: um prólogo para entrar no mundo de ORDER. Depois, a campanha continua na mesa, com um Mestre e outros Searchers. Agora, crie quem você é.',at:'top'},sfx:{text:'DONG',at:'br'}}
  ],end:'create'}
 ]}
 /* ---------------- Capítulo 1 em diante · o contrato ---------------- */
 function story(s){const name=s.profile.name||'Searcher',dec=s.decisions,rolls=s.rolls,route=dec.judgment||'collect',end=endings[route];const ar=rolls.archive,fr=rolls.threshold,lr=rolls.letter;const clueList=clues(s),found=clueList.filter(c=>c.found).length,knowsWanted=!!ar?.ok,knowsMother=!!lr?.ok;
  return[
  {id:'arrival',chapter:'Capítulo 1 · O contrato',title:'Santa Cecília, 22h.',layout:'top1-bottom2',rain:1,panels:[
   {bg:'church',shot:'wide',fx:'flash',caption:{text:'A chuva é fina demais para fazer barulho. Mesmo assim, você escuta a água correndo do outro lado do portão.',at:'top'},sfx:{text:'DONG',at:'br'}},
   {bg:'church',shot:'mid',actors:[A('player','left',{scale:1.05})],caption:{text:`Seu nome é ${name}. Você morreu e se tornou um Searcher.`,at:'bottom'}},
   {bg:'archive',shot:'close',doc:{heading:'ORDEM DE COBRANÇA · 001',lines:['ALMA: ELVIRA MARTINS · 70 ANOS','Conduzir a alma ao Hells.','Antes, ouvir e julgar.']},caption:{text:'O nome no contrato é Elvira.',at:'bottom'}}
  ]},
  {id:'welcome',chapter:'Capítulo 1 · O contrato',title:'Ela abre a porta.',layout:'l-tall',rain:.6,panels:[
   {bg:'nave',shot:'mid',actors:[A('elvira','right',{scale:1.1})],balloons:[B('elvira','Entre. Está molhado. Tem sopa no fogão.','tl',{tail:'r'})],caption:{text:'Ela vê mais alguém precisando de abrigo.',at:'bottom'}},
   {bg:'nave',shot:'close',actors:[A('player','left',{scale:1.2})],balloons:[B('player','A senhora deixa qualquer pessoa entrar?','tr',{tail:'l'})]},
   {bg:'nave',shot:'close',actors:[A('elvira','right',{scale:1.25})],balloons:[B('elvira','Primeiro dou um prato quente. Depois pergunto o nome.','tl',{tail:'r'})],caption:{text:'Ela separa mais uma tigela. É pequena.',at:'bottom'}}
  ],decision:{id:'arrival',prompt:'Como você entra?',choices:[{value:'kind',text:'Guardar o contrato e aceitar a sopa.'},{value:'direct',text:'Dizer que precisa fazer algumas perguntas.'}]}},
  {id:'lia',chapter:'Capítulo 1 · O contrato',title:'A tigela era de Lia.',layout:'stack2',rain:.5,panels:[
   {bg:'patio',shot:'mid',actors:[A('lia','left',{scale:1.05})],balloons:[B('lia','Você veio levar a vovó?','tr',{tail:'l',kind:'whisper'})],caption:{text:dec.arrival==='direct'?'Lia ouviu suas perguntas. Ela aperta a fotografia contra o peito.':'Lia aparece para buscar a tigela. Ao ver você, aperta a fotografia contra o peito.',at:'bottom'}},
   {bg:'patio',shot:'close',actors:[A('lia','right',{scale:1.3})],balloons:[B('lia','O homem que morava com a gente batia na porta. Ela trocou a fechadura.','tl',{tail:'r'}),B('lia','Quando ele voltou, ela não abriu.','ml',{tail:'r'})],caption:{text:'“Foi a primeira noite que eu dormi.”',at:'bottom'}}
  ],decision:{id:'lia',prompt:'O que você diz a Lia?',choices:[{value:'listen',text:'“Pode me contar. Eu vou ouvir.”'},{value:'space',text:'“Você não precisa falar se não quiser.”'}]}},
  {id:'archive',chapter:'Capítulo 2 · O motivo da cobrança',title:'O nome riscado.',layout:'four',rain:.4,film:true,panels:[
   {bg:'archive',shot:'wide',caption:{text:'Elvira entrega a chave do arquivo sem discutir. Na página de Lia, há outro nome riscado até furar o papel.',at:'top'}},
   {bg:'archive',shot:'close',doc:{heading:'LIVRO DE ACOLHIMENTO',lines:['12/jul · Lia e a mãe. Duas refeições.','19/jul · Antônio Reis. Remédios pagos.','22/jul · A. R. — protegido.','“Não entregar o nome a quem vier procurar.”']}},
   {bg:'archive',shot:'mid',tint:'cold',caption:{text:ar?(ar.ok?'Você cruza as datas e acha um recorte escondido entre as páginas.':'As datas não fecham. Onde deveria haver um recorte, só restou a marca da cola. Alguém o arrancou com cuidado.'):'Quem era Antônio? Por que Elvira escondeu o nome dele?',at:'top'},sfx:ar&&ar.ok?{text:'!',at:'br',shake:true}:null},
   {bg:'black',big:ar?(ar.ok?'PROCURADO':'PISTA PERDIDA'):'???',sub:ar?(ar.ok?'Antônio Reis · suspeito da morte de João Siqueira.':'Você não descobre quem Antônio era.'):'Role o D20 para investigar.',tint:ar&&!ar.ok?'cold':'red',fx:ar?'impact':null}
  ],roll:{id:'archive',skill:'Investigação',dc:11,title:'Descobrir quem era Antônio',text:'Role o D20 para cruzar os registros. Se falhar, você perde esta pista e vai julgar Elvira sem ela.',clue:'Antônio era procurado pela morte de João.'}},
  {id:'letter',chapter:'Capítulo 2 · O motivo da cobrança',title:'Ele escreveu para agradecer.',layout:'top1-bottom2',rain:.6,panels:[
   {bg:'confession',shot:'wide',doc:{heading:'CARTA DE A. R.',lines:['“Dona Elvira,','obrigado pelas noites em que dormi sem ouvir passos na rua.','Quando vieram me procurar, ouvi a senhora dizer que eu não estava.”']},caption:{text:'A carta estava presa sob o confessionário. A janela acima está quebrada; a chuva entra.',at:'bottom'}},
   {bg:'confession',shot:'close',actors:[A('player','left',{scale:1.25})],balloons:[B('letter','Mas o rosto de João continua na água quando lavo as mãos.','tr',{tail:'none',kind:'paper'})]},
   lr?(lr.ok?{bg:'confession',shot:'close',tint:'red',fx:'impact',balloons:[B('letter','A senhora pediu que eu começasse outra vida. Será que a mãe dele também pôde?','tc',{tail:'none',kind:'paper'})],caption:{text:'Embaixo, a lápis: “A mãe de João esperou no portão. A senhora viu.”',at:'bottom'}}
     :{bg:'confession',shot:'close',tint:'cold',caption:{text:'A chuva escorre pela folha. O fim da carta vira uma mancha. Você nunca vai saber o que ele escreveu ali.',at:'top'},big:'BORRADO',sub:'Pista perdida.'})
     :{bg:'confession',shot:'close',tint:'cold',caption:{text:'As últimas linhas já começam a borrar. Leia depressa.',at:'top'},sfx:{text:'PLIC',at:'br'}}
  ],roll:{id:'letter',skill:'Percepção',dc:12,title:'Ler antes que a chuva apague',text:'Role o D20 para ler o fim da carta. Se falhar, a chuva leva a pista embora.',clue:'A mãe de João esperou no portão, e Elvira viu.'}},
  {id:'confession',chapter:'Capítulo 2 · O motivo da cobrança',title:knowsWanted?'“Eu sabia.”':'“Eu não pergunto.”',layout:'l-tall',rain:.6,panels:[
   {bg:'nave',shot:'close',actors:[A('elvira','right',{scale:1.3})],balloons:knowsWanted?[B('elvira','Eu li o jornal. Ele me contou o que fez.','tl',{tail:'r'}),B('elvira','Achei que, se alguém ainda cuidasse dele, ele podia mudar.','ml',{tail:'r'})]:[B('elvira','Antônio? Um homem doente. Precisava de abrigo.','tl',{tail:'r'}),B('elvira','Eu não pergunto o passado de quem bate na porta.','ml',{tail:'r'})],caption:knowsWanted?null:{text:'Sem o recorte, você não tem como contestar.',at:'bottom'}},
   knowsMother?{bg:'church',shot:'wide',fx:'film',caption:{text:'A mãe de João veio ao portão. Deixou uma vela e esperou. Elvira a viu pela janela. Não desceu.',at:'bottom'}}
     :{bg:'church',shot:'wide',caption:{text:'No portão, uma vela apagada pela chuva. Você não sabe quem a deixou ali.',at:'bottom'}},
   {bg:'nave',shot:'xclose',actors:[A('elvira','center',{scale:1.6,crop:'face'})],balloons:[B('elvira',knowsWanted&&knowsMother?'Eu devia ter aberto a porta para ela também.':knowsWanted?'Fiz o que achei certo. Ainda acho, na maioria das noites.':'Você veio cobrar uma velha que dá sopa?','tc',{tail:'b',kind:'whisper'})]}
  ]},
  {id:'threshold',chapter:'Capítulo 3 · Quem cobra também deve',title:'O contrato reconhece sua mão.',layout:'strips3',rain:.3,panels:[
   {bg:'corridor',shot:'wide',caption:{text:'Elvira indica um caderno no quarto de baixo. A chave gira sozinha na sua mão.',at:'top'},sfx:{text:'CLIC',at:'br'}},
   {bg:'room',shot:'mid',doc:{heading:'CADERNO DE ELVIRA',lines:['“Se eu o entregasse, quem cuidaria dele?','Se eu não o entregasse, quem cuidaria dela?','Há noites em que só consigo responder à primeira pergunta.”']},fx:'blink'},
   {bg:'room',shot:'close',actors:[A('player','left',{scale:1.3})],tint:'red',fx:fr?null:'impact',caption:{text:fr?(fr.ok?'Seu nome aparece no lugar do dela. Você segura o caderno até as letras voltarem e lê a última página: “Antônio levou o dinheiro das passagens. Disse que ia procurar a família. Não pedi endereço.”':'Seu nome toma o lugar do dela. Você solta o caderno. Ele cai no escuro, aberto na última página, e a luz não volta a tempo.'):'A cadeira se arrasta atrás de você. No caderno, as letras começam a mudar.',at:'top'},sfx:{text:fr?(fr.ok?'TIC TAC':'PERDIDO'):'KRRR',at:'br',shake:true}}
  ],roll:{id:'threshold',skill:'Resistência',dc:12,title:'Encarar o próprio passado',text:'Role o D20 para sustentar o medo e ler até o fim. Se falhar, a última página fica no escuro.',clue:'Antônio fugiu com o dinheiro, e Elvira não perguntou para onde.'}},
  {id:'return',chapter:'Capítulo 3 · Quem cobra também deve',title:'“Amanhã ela vai estar aqui?”',layout:'stack2',rain:.5,panels:[
   {bg:'patio',shot:'close',actors:[A('lia','left',{scale:1.25})],balloons:[B('lia',dec.lia==='space'?'Ela espera minha mãe voltar do trabalho. Mesmo quando está com sono.':'A vovó põe meu cobertor perto do fogão pra ficar quentinho.','tr',{tail:'l'}),B('lia','Amanhã ela vai estar aqui?','br',{tail:'l',kind:'whisper'})]},
   {bg:'nave',shot:'mid',actors:[A('elvira','right',{scale:1.1})],balloons:[B('elvira','Deixei os remédios separados. E dinheiro para o pão. Se eu tiver que ir, diga à mãe dela onde está.','tl',{tail:'r'})],caption:{text:'Sobre a mesa, dois pratos. Elvira não tocou no dela.',at:'bottom'}}
  ]},
  {id:'judgment',chapter:'Capítulo 3 · Quem cobra também deve',title:'Você veio levá-la. Ainda vai?',layout:'four',rain:.7,panels:[
   {bg:'archive',shot:'wide',tint:'cold',doc:{heading:`SEU DOSSIÊ · ${found}/3 PISTAS`,lines:clueList.map(c=>(c.found?'✓ ':'✗ ')+(c.found?c.text:'Pista perdida.'))},caption:{text:found===3?'Você sabe o que Elvira fez, e o que deixou de fazer.':found===0?'Você vai julgar quase às cegas.':'Faltam peças. A sentença vai pesar sobre o que você não sabe.',at:'top'}},
   {bg:'nave',shot:'close',actors:[A('player','left',{scale:1.25})],balloons:[B('player',found>=2?'Eu sei o que a senhora fez. E o que ainda faz por esta casa.':'Eu não sei tudo o que a senhora fez. Mas o contrato tem seu nome.','tr',{tail:'l'})]},
   {bg:'nave',shot:'close',actors:[A('elvira','right',{scale:1.25})],balloons:[B('elvira',knowsMother?'Se me deixar ficar, vou procurar aquela mãe.':'Se me deixar ficar, a menina ainda tem onde dormir.','tl',{tail:'r'})]},
   {bg:'black',big:'SUA SENTENÇA',sub:'O contrato espera. A história de Elvira não pode assinar por você.',tint:'red',fx:'impact'}
  ],decision:{id:'judgment',prompt:found===3?'A sentença é sua.':`A sentença é sua. Você descobriu ${found} de 3 pistas.`,choices:[{value:'collect',text:'Cobrar. Levar a alma de Elvira.',detail:knowsWanted?'Ela deixará a igreja. Você concluirá o contrato no Hells.':'Você vai cobrar sem saber por que o nome dela está no contrato.'},{value:'mercy',text:'Poupar. Deixar Elvira viver.',detail:knowsMother?'Ela fica. Você carrega a dívida aberta.':'Ela fica. Você não sabe quem ainda espera uma resposta dela.'},{value:'defer',text:knowsMother?'Adiar. Mais uma noite para procurar a família de João.':'Adiar. Mais uma noite para ela explicar o que esconde.',detail:'Ela ganha um prazo. Seu nome vira a garantia.'}]}},
  {id:'signature',chapter:'Capítulo 4 · A sentença',title:route==='collect'?'Você decide levá-la.':route==='mercy'?'Você decide deixá-la ficar.':'Você concede mais uma noite.',layout:'top1-bottom2',rain:.8,panels:[
   {bg:'nave',shot:'mid',actors:[A('elvira','right',{scale:1.15})],balloons:[B('elvira',route==='collect'?'Só espere Lia dormir. Eu não quero que ela veja.':route==='mercy'?'Obrigada. Não por me achar inocente. Por me deixar fazer alguma coisa amanhã.':'Vou procurar aquela mãe de manhã. Quando voltar, pergunte se eu fui.','tl',{tail:'r'})]},
   {bg:'church',shot:'mid',actors:[A('player','left')],caption:{text:route==='collect'?'Você espera a luz do quarto se apagar. Ao assinar, sente a mão de Elvira na sua manga.':route==='mercy'?'Você risca a cobrança e assina a responsabilidade. Ao sair, sua sombra se move sem você.':'Você registra o prazo. O sino toca uma vez.',at:'top'}},
   {bg:'black',big:'ASSINADO',sub:'O contrato abre a passagem para o Hells.',tint:'red',fx:'blink'}
  ]},
  {id:'hells',chapter:'Hells · Portão Zero',title:end.title,layout:'splash',spread:true,rain:0,hell:true,ending:end,panels:[
   {bg:'hell',half:'l',fx:'blink',actors:[A('player','center',{pose:'hell',scale:.92})],caption:{text:'A primeira piscada revela pedra. A segunda, arcos que se dobram para dentro. Você ainda tenta respirar.',at:'top'},balloons:[B('voice','Aqui, até a misericórdia deixa uma dívida.','bl',{tail:'none',kind:'shout'})]},
   {bg:'hell',half:'r',fx:'transform',actors:[A(end.monster,'center',{scale:1,monster:true})],caption:{text:end.voice,at:'top'},sfx:{text:end.name.toUpperCase(),at:'mid',shake:true}}
  ]}
 ]}
 /* Pistas: cada teste esconde uma. Falhou, a pista se perde e a história muda. */
 const CLUES=[{id:'archive',label:'Quem era Antônio',text:'Antônio era procurado pela morte de João Siqueira.'},{id:'letter',label:'A vela no portão',text:'A mãe de João esperou no portão, e Elvira viu.'},{id:'threshold',label:'A última página',text:'Antônio fugiu com o dinheiro, e Elvira não perguntou para onde.'}];
 function clues(s){return CLUES.map(c=>({...c,rolled:!!s.rolls[c.id],found:!!s.rolls[c.id]?.ok}))}
 function pages(s){const st=story(s).map(p=>({part:'story',...p}));return[...intro(),...st]}
 return{bg,art,names,sectors,sins,skills,endings,pages,clues,introCount:intro().length};
})();
