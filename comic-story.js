/* ORDER — O Pecado da Misericórdia. Roteiro da edição em quadrinhos. */
'use strict';
const ComicBook = (() => {
  // Para usar novos cenários, altere somente os caminhos abaixo. Os prompts estão em PROMPTS_CENARIOS_HQ.md.
  const backgrounds = {
    church: 'assets/web/bg-igreja.webp', nave: 'assets/web/bg-nave.webp', patio: 'assets/web/bg-patio.webp',
    archive: 'assets/web/bg-arquivo.webp', confession: 'assets/web/bg-confessionario.webp',
    corridor: 'assets/web/bg-corredor.webp', room: 'assets/web/bg-quarto.webp', hell: 'assets/web/bg-hells.webp',
  };
  const art = {
    logo: 'assets/web/logo.webp', lia: 'assets/Lia.png', elvira: 'assets/web/elvira.webp',
    demon: 'assets/web/elvira-demon.webp', echo: 'assets/web/eco.webp', guardian: 'assets/web/guardiao.webp',
    homem: { normal: 'assets/web/man-visual.webp', hell: 'assets/web/man-hells.webp' },
    mulher: { normal: 'assets/web/woman-visual.webp', hell: 'assets/web/woman-hells.webp' },
  };
  const sectors = {
    'INCIDÊNCIA': ['I', 'Sustentar o que os outros não suportam.', 'Você permanece entre a ameaça e quem ainda pode ser salvo.'],
    'RELAÇÃO': ['R', 'Toda palavra tem duas lâminas.', 'Você procura o acordo possível, sem esquecer o que ele custa.'],
    'JUSTIÇA': ['J', 'Uma sentença também pesa em quem assina.', 'Você confronta versões antes de decidir qual consequência defender.'],
    'SOCIALISTA': ['S', 'Nenhuma alma atravessa sozinha.', 'Você enxerga o que uma decisão faz com todos os que ficam.'],
    'DOUTRINA': ['D', 'Há decisões que não admitem desvio.', 'Você age com precisão quando chega a hora de sustentar uma escolha.'],
  };
  const sins = ['Apostador', 'Miliciano', 'Luxuosa', 'Traidor', 'Ganancioso', 'Invído', 'Conselho de Onça'];
  const skills = ['Investigação', 'Percepção', 'Comunicação', 'Resistência'];
  const endings = {
    collect: { name: 'Elvira, além do véu', monster: 'demon', title: 'A mulher que você trouxe consigo.',
      voice: 'Você levou a alma de Elvira ao Hells. Aqui, seu pecado ganhou um corpo. A mão que dava abrigo agora tenta guardar tudo para sempre.',
      last: 'Elvira ainda olha para a porta que já não existe. Depois, os dedos se abrem. Há dedos demais. Para concluir a cobrança, você terá de enfrentá-la.' },
    mercy: { name: 'O Eco do Contrato', monster: 'echo', title: 'A dívida que você aceitou carregar.',
      voice: 'Elvira continua viva na igreja. Lia ainda tem quem a espere. O contrato que você recusou cobrar, porém, veio com você. Esta criatura é a dívida que assumiu.',
      last: 'O Eco repete sua sentença com a sua própria voz: “Ela fica.” Você poupou Elvira. Agora terá de enfrentar o preço dessa escolha.' },
    defer: { name: 'O Guardião do Prazo', monster: 'guardian', title: 'Até o tempo exige uma garantia.',
      voice: 'Elvira recebeu mais uma noite para procurar a família de João. Você garantiu esse prazo com o próprio nome. O Guardião veio exigir a garantia.',
      last: 'A passagem de volta está atrás dele. Para retornar à igreja e terminar seu julgamento, você terá de vencer o Guardião do Prazo.' },
  };
  const A = (who, side = 'right', pose = 'normal') => ({ who, side, pose });
  const say = (who, text) => ({ who, text });
  function pages(s) {
    const name = s.profile.name || 'Searcher';
    const archiveRoll = s.rolls.archive, fearRoll = s.rolls.threshold;
    const route = s.decisions.judgment || 'collect';
    const ending = endings[route];
    return [
      { id: 'contract', chapter: '01 / Sua missão', title: 'Esta noite, você veio cobrar uma alma.',
        objective: 'Entenda quem você é e quem precisa julgar.', mission: 'Você deve cobrar a alma de Elvira. Pode poupá-la ou adiar, assumindo as consequências.', layout: 'opening', panels: [
        { bg: 'church', actors: [A('player', 'left')], caption: `Seu nome é ${name}. Você morreu e se tornou um Searcher: alguém que cumpre contratos para o Inferno. Esta noite, o nome no seu contrato é Elvira Martins.`, kicker: 'SANTA CECÍLIA · SEU PRIMEIRO CONTRATO', sfx: 'DONG' },
        { bg: 'archive', document: { heading: 'ORDEM DE COBRANÇA / 001', lines: ['ALMA DESIGNADA: ELVIRA MARTINS · 70 ANOS', 'Ordem: conduzir sua alma ao Hells.', 'Antes da cobrança, o Searcher deverá ouvir e julgar.', 'Misericórdia ou adiamento transferem a responsabilidade ao Procurador.', 'Retorno: Portão Zero, no Hells.'] }, caption: 'Você veio levá-la. Mas o contrato exige que a conheça antes de decidir.' },
      ], continuation: 'Conhecer Elvira' },
      { id: 'welcome', chapter: '01 / A mulher do contrato', title: 'Ela abre a porta para você.',
        objective: 'Conheça a pessoa que você foi enviado para levar.', mission: 'Elvira Martins é a mulher nomeada no seu contrato.', layout: 'triptych', panels: [
        { bg: 'nave', actors: [A('elvira')], speech: [say('Dona Elvira', 'Entre. Está molhado. Tem sopa no fogão.')], caption: 'Ela vê mais uma pessoa precisando de abrigo. Você vê a mulher que foi enviado para julgar.' },
        { bg: 'nave', actors: [A('player', 'left')], speech: [say(name, 'A senhora deixa qualquer pessoa entrar?')] },
        { bg: 'nave', actors: [A('elvira')], speech: [say('Dona Elvira', 'Primeiro dou um prato quente. Depois pergunto o nome.')], caption: 'Antes de se sentar, ela separa mais uma tigela. É pequena.' },
      ], decision: 'arrival', choices: [{ value: 'kind', text: 'Guardar o contrato e aceitar a sopa.' }, { value: 'direct', text: 'Dizer que precisa fazer algumas perguntas.' }] },
      { id: 'lia', chapter: '01 / Quem precisa dela', title: 'A tigela pequena era de Lia.',
        objective: 'Ouça Lia antes de tirar uma conclusão.', mission: 'Lia e a mãe vivem sob a proteção de Elvira.', layout: 'duo', panels: [
        { bg: 'patio', actors: [A('lia')], caption: s.decisions.arrival === 'direct' ? 'Enquanto Elvira recolhe os pratos, Lia se aproxima. Ela ouviu suas perguntas.' : 'Lia aparece para buscar a tigela. Ao ver você, aperta a fotografia contra o peito.', speech: [say('Lia', 'Você veio levar a vovó?')] },
        { bg: 'patio', actors: [A('lia', 'left')], speech: [say('Lia', 'O homem que morava com a gente batia na porta. Ela trocou a fechadura.'), say('Lia', 'Quando ele voltou, ela não abriu.')], caption: '“Foi a primeira noite que eu dormi”, Lia diz. Para ela, Elvira é a pessoa que ficou do lado de dentro.' },
      ], decision: 'lia', choices: [{ value: 'listen', text: '“Pode me contar. Eu vou ouvir.”' }, { value: 'space', text: '“Você não precisa falar se não quiser.”' }] },
      { id: 'archive', chapter: '02 / O motivo da cobrança', title: 'Elvira também protegeu Antônio Reis.',
        objective: 'Descubra por que o nome de Elvira chegou ao Inferno.', mission: 'Descubra por que o acolhimento de Antônio se tornou uma dívida de Elvira.', layout: 'triptych', panels: [
        { bg: 'archive', caption: 'Você pede os registros de hóspedes. Elvira entrega a chave sem discutir. Na página de Lia, há outro nome riscado.', kicker: 'ARQUIVO PAROQUIAL' },
        { bg: 'archive', document: { heading: 'LIVRO DE ACOLHIMENTO', lines: ['12 de julho · Lia e a mãe. Duas refeições.', '19 de julho · Antônio Reis. Remédios pagos.', '22 de julho · A. R. — protegido.', '“Não entregar o nome a quem vier procurar.”'] } },
        { bg: 'archive', actors: archiveRoll && !archiveRoll.ok ? [A('lia')] : [], caption: archiveRoll ? (archiveRoll.ok ? 'Você encontra a notícia entre as páginas: Antônio é procurado pela morte de João Siqueira. Elvira o abrigou depois do crime.' : 'Você não consegue cruzar as datas. Lia vem buscar Elvira e aponta um recorte no livro: “Esse homem ficou aqui.” A notícia diz que Antônio é procurado pela morte de João Siqueira.') : 'Quem era Antônio? E por que Elvira quis esconder seu nome? Procure a ligação entre os registros.' },
      ], roll: { id: 'archive', skill: 'Investigação', dc: 11, title: 'Descobrir quem era Antônio', description: 'Role o D20 para investigar os registros. Mesmo se falhar, a história seguirá por outro caminho.' }, continuation: 'Procurar o que Antônio deixou' },
      { id: 'letter', chapter: '02 / Uma segunda chance', title: 'Ele escreveu para agradecer.',
        objective: 'Leia a carta de Antônio e o que ele admite nela.', mission: 'Elvira mentiu para proteger Antônio depois da morte de João.', layout: 'duo', panels: [
        { bg: 'confession', document: { heading: 'CARTA DE ANTÔNIO REIS', lines: ['“Dona Elvira,”', '“Obrigado pelas noites em que dormi sem ouvir passos na rua.”', '“Quando vieram me procurar, ouvi a senhora dizer que eu não estava.”', '“Eu disse que me arrependia. Ainda digo.”'] }, caption: 'Ela guardou a carta numa caixa do confessionário. Você quase a fecha antes de ler o final.' },
        { bg: 'confession', actors: [A('player', 'left')], speech: [say('A carta', 'Mas o rosto de João continua na água quando lavo as mãos.'), say('A carta', 'A senhora pediu que eu começasse outra vida. Será que a mãe dele também pôde?')], caption: 'João morreu. Sua mãe ficou procurando respostas. Elvira sabia onde Antônio estava.' },
      ], continuation: 'Perguntar a Elvira o que ela sabia' },
      { id: 'elvira', chapter: '02 / A porta que ela não abriu', title: '“Eu sabia.”',
        objective: 'Ouça a resposta de Elvira.', mission: 'Elvira admite que sabia do crime quando escondeu Antônio.', layout: 'triptych', panels: [
        { bg: 'nave', actors: [A('elvira')], speech: [say('Dona Elvira', 'Eu li o jornal. Ele me contou o que fez.'), say('Dona Elvira', 'Achei que, se alguém ainda cuidasse dele, ele podia mudar.')] },
        { bg: 'church', caption: 'A mãe de João veio ao portão. Deixou uma vela e esperou. Elvira a viu pela janela. Não desceu.' },
        { bg: 'nave', actors: [A('elvira')], speech: [say('Dona Elvira', 'Eu devia ter aberto a porta para ela também.')], caption: 'Ela não pede que você esqueça João. Pede licença para tirar a sopa do fogo. A menina ainda não comeu.' },
      ], continuation: 'Ler o caderno que Elvira lhe oferece' },
      { id: 'threshold', chapter: '03 / Quem cobra também deve', title: 'O contrato reconhece sua mão.',
        objective: 'Leia a última prova e encare o que ela desperta.', mission: 'Você conhece a culpa de Elvira. O contrato também conhece a sua.', layout: 'triptych', panels: [
        { bg: 'corridor', caption: 'Elvira indica um caderno no quarto inferior. “Escrevi o que não conseguia dizer. Pode levar.” A chave gira sozinha na sua mão.', sfx: 'CLIC' },
        { bg: 'room', document: { heading: 'CADERNO DE ELVIRA', lines: ['“Se eu o entregasse, quem cuidaria dele?”', '“Se eu não o entregasse, quem cuidaria dela?”', '“Há noites em que só consigo responder à primeira pergunta.”'] } },
        { bg: 'room', actors: [A('player', 'left')], caption: fearRoll ? (fearRoll.ok ? 'A luz falha. Seu nome aparece no lugar do nome de Elvira. Você segura o contrato até as letras voltarem. O Inferno ainda se lembra do que você fez em vida.' : 'Seu nome toma o lugar do nome de Elvira. Você solta a folha. Quando a recolhe, a ordem está como antes. Mesmo tremendo, ainda será você quem assinará.') : 'A cadeira se arrasta atrás de você. Ao olhar o contrato, percebe que as letras começaram a mudar.', sfx: fearRoll ? 'TIC' : '' },
      ], roll: { id: 'threshold', skill: 'Resistência', dc: 12, title: 'Encarar o próprio passado', description: 'Role o D20 para sustentar o medo. O resultado muda sua reação; a sentença de Elvira continua sendo sua escolha.' }, continuation: 'Voltar para decidir' },
      { id: 'return', chapter: '03 / Quem vai ficar', title: '“Amanhã ela vai estar aqui?”',
        objective: 'Considere quem será afetado pela sua sentença.', mission: 'Lia depende de Elvira. A família de João ainda espera uma resposta.', layout: 'duo', panels: [
        { bg: 'patio', actors: [A('lia')], speech: [say('Lia', s.decisions.lia === 'space' ? 'Eu queria contar mais uma coisa. Ela espera minha mãe voltar do trabalho. Mesmo quando está com sono.' : 'A vovó põe meu cobertor perto do fogão para ficar quentinho.'), say('Lia', 'Amanhã ela vai estar aqui?')] },
        { bg: 'nave', actors: [A('elvira')], speech: [say('Dona Elvira', 'Deixei os remédios separados. E dinheiro para o pão.'), say('Dona Elvira', 'Se eu tiver que ir, diga à mãe dela onde está.')], caption: 'Sobre a mesa há dois pratos. Elvira não tocou no dela.' },
      ], continuation: 'Escrever sua sentença' },
      { id: 'judgment', chapter: '03 / Seu julgamento', title: 'Você veio levá-la. Ainda vai?',
        objective: 'Escolha a sentença de Elvira.', mission: 'Sua ordem é levar Elvira. Poupar ou adiar também terá um preço.', layout: 'duo', panels: [
        { bg: 'nave', actors: [A('player', 'left')], speech: [say(name, 'Eu sei o que a senhora fez. E o que ainda faz por esta casa.')], caption: 'O contrato espera uma resposta. A história de Elvira não pode assinar por você.' },
        { bg: 'nave', actors: [A('elvira')], speech: [say('Dona Elvira', 'Se me deixar ficar, vou procurar aquela mãe.'), say('Dona Elvira', 'Não sei se ela vai querer me ouvir. Eu vou mesmo assim.')], caption: 'Ela devolve a chave à mesa e espera.' },
      ], decision: 'judgment', choices: [
        { value: 'collect', text: 'Cumprir a cobrança. Levar a alma de Elvira.', detail: 'Ela deixará a igreja. Você concluirá o contrato no Hells.' },
        { value: 'mercy', text: 'Conceder misericórdia. Deixar Elvira viver.', detail: 'Ela ficará. Você assumirá a consequência da dívida aberta.' },
        { value: 'defer', text: 'Dar mais uma noite. Exigir que ela procure a família de João.', detail: 'Ela receberá um prazo. Você responderá por ele no Hells.' },
      ] },
      { id: 'signature', chapter: '04 / A sentença assinada', title: route === 'collect' ? 'Você decide levá-la.' : route === 'mercy' ? 'Você decide deixá-la ficar.' : 'Você concede mais uma noite.',
        objective: 'Veja o que sua escolha mudou.', mission: route === 'collect' ? 'Você cobrou a alma de Elvira. Ela retornará ao Hells com você.' : route === 'mercy' ? 'Você deixou Elvira viver. Agora responderá por ela no Hells.' : 'Você deu mais uma noite a Elvira. Seu nome garante esse prazo no Hells.', layout: 'duo', panels: [
        { bg: 'nave', actors: [A('elvira')], speech: [say('Dona Elvira', route === 'collect' ? 'Só espere Lia dormir. Eu não quero que ela veja.' : route === 'mercy' ? 'Obrigada. Não por me achar inocente. Por me deixar fazer alguma coisa amanhã.' : 'Vou procurar aquela mãe de manhã. Quando voltar, pergunte se eu fui.')] },
        { bg: 'church', actors: [A('player', 'left')], caption: route === 'collect' ? 'Você espera a luz do quarto se apagar. Ao assinar, sente a mão de Elvira segurando sua manga. O contrato abre a passagem para o Hells.' : route === 'mercy' ? 'Você risca a cobrança e assina a responsabilidade. Elvira fica na igreja. Ao sair, sua sombra se move sem você. O contrato abre a passagem para o Hells.' : 'Você registra o prazo e promete retornar. Elvira fica na igreja. O sino toca uma vez. O contrato abre a passagem para o Hells.', kicker: 'DESTINO: PORTÃO ZERO · HELLS' },
      ], continuation: 'Retornar ao Hells' },
      { id: 'hells', chapter: 'HELLS / O preço da sentença', title: ending.title,
        objective: 'Seu primeiro contrato ainda não terminou.', mission: 'Sua sentença despertou uma ameaça. O primeiro confronto será no Hells.', layout: 'splash', ending, panels: [
        { bg: 'hell', actors: [A('player', 'left', 'hell'), A(ending.monster)], kicker: 'TODO HUMANO CARREGA UM DEMÔNIO.', caption: ending.voice, speech: [say('A voz do contrato', 'Aqui, até a misericórdia deixa uma dívida.')], sfx: '' },
      ] },
    ];
  }
  return { backgrounds, art, sectors, sins, skills, endings, pages };
})();
