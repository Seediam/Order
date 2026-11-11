/* ORDER V0.5 — O Pecado da Misericórdia. Prólogo solo: investigação no tabuleiro, julgamento e combate no Hells.
   Regras: Manual do Procurador v0.1. Tela de 1600×900 escalada para caber em qualquer janela. */
'use strict';
const KEY='order_prologue_v5';
const DISCORD_INVITE='https://discord.gg/xVDAPBVTTz';
const ASSETS={logo:'assets/web/logo.webp',searcher:{homem:{choice:'assets/web/man.webp',novel:'assets/web/man-visual.webp',hell:'assets/web/man-hells.webp'},mulher:{choice:'assets/web/woman.webp',novel:'assets/web/woman-visual.webp',hell:'assets/web/woman-hells.webp'}},elvira:{neutral:'assets/web/elvira.webp',transformed:'assets/web/elvira-demon.webp'},eco:'assets/web/eco.webp',guardian:'assets/web/guardiao.webp',map:'assets/web/map-igreja.webp',arena:'assets/web/arena-hells.webp',back:'assets/Cards/web/Verso.webp'};
const DEADLINE=16; // 02:00 — o prazo do contrato vence
const DEV_MODE=['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&new URLSearchParams(location.search).get('dev')==='1';
const PREVIEW_SCENE=new URLSearchParams(location.search).get('preview');
const $=q=>document.querySelector(q);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function roll(n){const a=new Uint32Array(1),max=0x100000000,limit=max-(max%n);do{crypto.getRandomValues(a)}while(a[0]>=limit);return(a[0]%n)+1}
function shuffle(a){const r=[...a];for(let i=r.length-1;i>0;i--){const j=roll(i+1)-1;[r[i],r[j]]=[r[j],r[i]]}return r}
CombatRules.setRng(roll);
const SECTORS=['INCIDÊNCIA','RELAÇÃO','SOCIALISTA','JUSTIÇA','DOUTRINA'];
const QUESTIONS=[
 {q:'Um homem confessa um crime, mas pede uma segunda chance. Qual é sua primeira reação?',o:[['Imobilizá-lo. Primeiro, ninguém se machuca.','INCIDÊNCIA'],['Ouvir o que ele oferece e confrontar a história.','RELAÇÃO'],['Proteger as pessoas ao redor antes de decidir.','SOCIALISTA'],['Buscar as provas e aplicar uma sentença proporcional.','JUSTIÇA'],['Eliminar qualquer chance de fuga.','DOUTRINA']]},
 {q:'Seu parceiro está em perigo. O suspeito está prestes a escapar. Você...',o:[['Recebe o golpe no lugar dele.','INCIDÊNCIA'],['Cria um acordo para ganhar tempo.','RELAÇÃO'],['Organiza a retirada e ajuda seu parceiro.','SOCIALISTA'],['Escolhe a atitude que cause menos vítimas.','JUSTIÇA'],['Persegue e neutraliza a ameaça.','DOUTRINA']]},
 {q:'Você recebe uma ordem injusta de alguém muito poderoso.',o:[['Recusa e sustenta as consequências.','INCIDÊNCIA'],['Encontra um meio-termo para impedir o pior.','RELAÇÃO'],['Une outras pessoas para questionar a ordem.','SOCIALISTA'],['Exige que a ordem seja julgada pelos próprios princípios.','JUSTIÇA'],['Desobedece em silêncio e age por conta própria.','DOUTRINA']]},
 {q:'Qual destas ferramentas combina melhor com você?',o:[['Um escudo marcado por cicatrizes.','INCIDÊNCIA'],['Um documento com duas assinaturas.','RELAÇÃO'],['Um rádio que mantém todos conectados.','SOCIALISTA'],['Uma balança que não pode ser comprada.','JUSTIÇA'],['Uma lâmina escondida na manga.','DOUTRINA']]},
 {q:'Ao descobrir algo terrível sobre uma pessoa querida, você...',o:[['Não permite que ela machuque mais ninguém.','INCIDÊNCIA'],['Tenta compreendê-la, sem apagar os fatos.','RELAÇÃO'],['Apoia as vítimas e busca uma saída coletiva.','SOCIALISTA'],['Aplica o mesmo critério que aplicaria a um estranho.','JUSTIÇA'],['Age imediatamente, mesmo que fique sozinho.','DOUTRINA']]}
];
/* ---------- estado ---------- */
function defaultState(){return{version:5,volume:.45,textSpeed:28,stage:'intro',introOpened:false,evidenceId:'',gender:'',name:'',quizIndex:0,scores:Object.fromEntries(SECTORS.map(x=>[x,0])),sector:'',sin:'',sinChoice:'',skills:[],instrument:'papel',audio:true,animations:true,musicVolume:.35,node:'arrival',moral:8,trust:6,sanity:10,fame:0,scars:0,clues:[],visited:[],flags:{},board:null,combat:null,outcome:''}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&d.version===5&&typeof d.stage==='string')return{...defaultState(),...d}}catch{}return defaultState()}
let S=load();if(!S.flags.v6){S.flags.v6=true;S.audio=true;S.animations=true;if(S.combat&&S.combat.v!==6){S.combat=null;if(S.stage==='combat')S.stage='veil'}}
function persist(){if(PREVIEW_SCENE||DEV_MODE)return;try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}}
function motionOK(){return S.animations!==false}
function patch(p){Object.assign(S,p);persist();render()}
let toastTimer;function flash(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3800)}
function audio(type='click'){try{AudioEngine.play(type)}catch{}}
function profile(){return{sector:S.sector,sinChoice:S.sinChoice,skills:S.skills,instrument:S.instrument,name:S.name,gender:S.gender}}
function searcherAsset(role='novel'){return(ASSETS.searcher[S.gender]||ASSETS.searcher.homem)[role]}
function portraitAsset(character,expression='neutral'){if(character==='searcher')return searcherAsset(expression==='transformed'?'hell':'novel');if(character==='eco')return ASSETS.eco;if(character==='guardian')return ASSETS.guardian;return ASSETS.elvira[expression]||ASSETS.elvira.neutral}
/* ---------- medidores ---------- */
function setSanityTier(){document.documentElement.dataset.sanity=S.sanity<=3?'critical':S.sanity<=6?'low':'ok'}
function changeSanity(delta,reason){if(!delta)return;const before=S.sanity;S.sanity=clamp(S.sanity+delta,0,10);if(delta<0)audio('heartbeat');pulseMeter('sanity',delta);
 if(S.sanity===0){S.scars++;S.sanity=2;flash('COLAPSO. Sua mente cede por um instante. Você ganha 1 Cicatriz e volta a 2 de Sanidade.');if(S.board&&S.stage==='explore')S.board.turn+=2;if(S.combat&&S.stage==='combat')S.combat.player.status.colapso=1;Cinematics.playHorrorEvent()}
 else if(before>6&&S.sanity<=6)flash('Sanidade 6: você começa a ouvir ecos. Nem tudo o que eles dizem é verdade.');
 setSanityTier();persist()}
function changeMoral(delta){S.moral=clamp(S.moral+delta,0,8);pulseMeter('moral',delta);persist()}
function changeTrust(delta){S.trust=clamp(S.trust+delta,0,10);pulseMeter('trust',delta);persist()}
function pulseMeter(name,delta){const el=document.querySelector(`[data-meter="${name}"]`);if(!el)return;el.classList.remove('bump-up','bump-down');void el.offsetWidth;el.classList.add(delta>0?'bump-up':'bump-down')}
function meter(name,label,value,max,cls=''){const pct=clamp(Math.round(value/max*100),0,100);return`<div class="meter ${cls}" data-meter="${name}"><div class="meter-row"><span>${label}</span><b>${value}<small>/${max}</small></b></div><div class="meter-bar"><i style="width:${pct}%"></i></div></div>`}
/* ---------- moldura e cabeçalho ---------- */
function fitStage(){const s=Math.min(innerWidth/1600,innerHeight/900);document.documentElement.style.setProperty('--s',s)}
addEventListener('resize',fitStage);fitStage();
function clockLabel(t){const m=22*60+t*15,h=Math.floor(m/60)%24,mm=m%60;return String(h).padStart(2,'0')+':'+String(mm).padStart(2,'0')}
function topbar(title,sub=''){const clock=S.board&&['explore','vn','evidence'].includes(S.stage)&&!S.node.startsWith('hell');const t=S.board?.turn||0;
 return`<header class="topbar"><img class="tb-logo" src="${ASSETS.logo}" alt="ORDER"><div class="tb-title"><span>${esc(sub)}</span><strong>${esc(title)}</strong></div>${clock?`<div class="tb-clock ${t>=DEADLINE-3?'is-late':''}" title="Cada lance de dado custa 15 minutos. Às 02:00 o prazo do contrato vence."><span>${clockLabel(t)}</span><div class="tb-clock-bar"><i style="width:${clamp(t/DEADLINE*100,0,100)}%"></i></div><small>PRAZO 02:00</small></div>`:''}<nav class="tb-actions"><button class="icon-btn" data-action="audio" title="Efeitos sonoros">${S.audio?'♪ SOM':'♪ MUDO'}</button>${S.clues.length?'<button class="icon-btn" data-action="journal">DOSSIÊ</button>':''}<button class="icon-btn" data-action="settings" title="Configurações">⚙</button><button class="icon-btn" data-action="restart" title="Reiniciar">↻</button></nav></header>`}
function eyeSVG(){return`<svg class="order-eye" viewBox="0 0 360 230" role="img" aria-label="Olho de ORDER"><defs><radialGradient id="eyeIris"><stop stop-color="#FF76C7"/><stop offset=".45" stop-color="#FF2F8E"/><stop offset="1" stop-color="#2A2A2F"/></radialGradient><clipPath id="eyeClip"><path d="M31 115C87 30 273 30 329 115C273 200 87 200 31 115Z"/></clipPath></defs><g class="eye-halo" fill="none" stroke="#FF76C7" opacity=".5"><circle cx="180" cy="115" r="102" stroke-dasharray="2 14"/><path d="M180 0V32M180 198V230M0 115H23M337 115H360M44 28L78 62M316 28L282 62M44 202L78 168M316 202L282 168"/></g><g class="eye-reveal"><path class="eye-outline-body" d="M31 115C87 30 273 30 329 115C273 200 87 200 31 115Z" fill="#190E19" stroke="#FF76C7" stroke-width="3"/><g clip-path="url(#eyeClip)"><g class="eye-iris-look"><circle cx="180" cy="115" r="57" fill="url(#eyeIris)" stroke="#FF76C7" stroke-width="2"/><circle cx="180" cy="115" r="43" fill="none" stroke="#D7D7DE" stroke-dasharray="2 5" opacity=".55"/><ellipse cx="180" cy="115" rx="16" ry="40" fill="#0C0C10"/><circle cx="167" cy="95" r="7" fill="white"/><circle cx="195" cy="131" r="3" fill="white" opacity=".6"/></g></g></g></svg>`}
/* ---------- abertura ---------- */
function intro(){return`<section class="stage intro ${S.introOpened?'opened':''}"><div class="intro-glow"></div><div class="intro-inner">${!S.introOpened?`<span class="eyebrow">ARQUIVO CENTRAL · DIVISÃO DE COBRANÇA</span><button class="eye-button" data-action="open-eye" aria-label="Abrir o olho de ORDER">${eyeSVG()}</button><p class="intro-whisper">ELE JÁ SABE QUE VOCÊ ESTÁ AQUI.</p><span class="intro-tip">CLIQUE NO OLHO PARA INICIAR</span>`:`<img class="intro-logo" src="${ASSETS.logo}" alt="ORDER"><p class="intro-tagline">Você morreu. O julgamento não acabou. Agora é você quem cobra.</p><div class="intro-menu"><button class="btn btn-primary" data-action="create">${S.name&&S.stage!=='intro'?'CONTINUAR':'ABRIR DOSSIÊ'} →</button>${localStorage.getItem(KEY)&&S.sector?'<button class="btn btn-ghost" data-action="resume">RETOMAR CONTRATO</button>':''}</div><span class="intro-tip">PRÓLOGO · CONTRATO 001 · RPG DE MESA · DECKBUILDER · TERROR PSICOLÓGICO</span>`}</div></section>`}
/* ---------- criação de Searcher (Manual, cap. 2) ---------- */
function dossier(step,inner,wide=false){const steps=['IDENTIDADE','SETOR','PECADO','PERÍCIAS','FICHA'];return`<section class="stage creator">${topbar('Ficha de Procurador','DIVISÃO DE COBRANÇA · ARQUIVO DE PESSOAL')}<div class="creator-steps">${steps.map((s,i)=>`<span class="${i<step?'done':i===step?'now':''}">${String(i+1).padStart(2,'0')} · ${s}</span>`).join('')}</div><div class="paper ${wide?'paper-wide':''}"><div class="paper-stamp">OR / 001</div>${S.gender?`<div class="paper-photo"><img src="${searcherAsset('choice')}" alt=""></div>`:''}${inner}</div></section>`}
function creator(){
 const st=S.stage;
 if(st==='gender')return`<section class="stage creator choose-body">${topbar('Escolha seu Searcher','ORDER · IDENTIDADE')}<div class="body-grid">${[['homem','PROCURADOR'],['mulher','PROCURADORA']].map(([id,label])=>`<button class="body-card" data-action="gender" data-value="${id}"><img src="${ASSETS.searcher[id].novel}" alt=""><span><b>${label}</b><small>SELECIONAR →</small></span></button>`).join('')}</div><p class="creator-note">O rosto é seu. A dívida também.</p></section>`;
 if(st==='name')return dossier(0,`<span class="eyebrow">01 · IDENTIDADE</span><h1>Seu nome ainda é seu?</h1><p class="lead">Há nomes riscados dos registros. O seu ainda pode ser escrito.</p><label class="field-label" for="player-name">NOME DO SEARCHER</label><input id="player-name" class="field" maxlength="24" placeholder="Escreva seu nome" autocomplete="off" value="${esc(S.name)}"><div class="paper-actions"><button class="btn btn-primary" data-action="submit-name">CONFIRMAR CREDENCIAL →</button></div>`);
 if(st==='quiz'){const q=QUESTIONS[S.quizIndex];return dossier(1,`<span class="eyebrow">02 · ANÁLISE DE SETOR · ${S.quizIndex+1}/${QUESTIONS.length}</span><h1 class="q">${esc(q.q)}</h1><div class="quiz">${q.o.map((o,i)=>`<button class="quiz-option" data-action="answer" data-value="${i}"><b>${String.fromCharCode(65+i)}</b><span>${esc(o[0])}</span></button>`).join('')}</div><p class="fine">Não existem respostas inocentes. O Setor é sua classe profissional.</p>`)}
 if(st==='sin')return dossier(2,`<span class="eyebrow">03 · PECADO · O QUE VOCÊ ERA EM VIDA</span><h1>Qual pecado gravou seu nome?</h1><div class="sin-grid">${Object.entries(SINS).map(([name,d])=>`<button class="sin-card ${S.sinChoice===name?'is-on':''}" data-action="pick-sin" data-value="${esc(name)}"><b>${esc(name)}</b><small>${Object.entries(d.bonus).map(([k,v])=>`+${v} ${k}`).join(' · ')}</small><em>${esc(d.passive)}</em><span>${esc(d.text)}</span></button>`).join('')}</div><label class="field-label" for="sin-entry">CONFISSÃO (OPCIONAL, FICCIONAL)</label><textarea id="sin-entry" class="field area" maxlength="300" placeholder="Como seu Searcher morreu? O que ainda pesa?">${esc(S.sin)}</textarea><div class="paper-actions"><button class="btn btn-primary" data-action="submit-sin" ${S.sinChoice?'':'disabled'}>ASSINAR CONFISSÃO →</button></div>`,true);
 if(st==='skills'){const n=S.sinChoice==='Invído'?3:3;return dossier(3,`<span class="eyebrow">04 · PERÍCIAS PRINCIPAIS · ${S.skills.length}/${n}</span><h1>No que você é treinado?</h1><p class="lead">Escolha 3 perícias principais. Cada uma ganha +2 cópias no seu deck de Formação (16 cartas). Jogar uma Formação num teste dá +2 no D20.</p><div class="skill-grid">${SKILLS.map(s=>`<button class="skill-card ${S.skills.includes(s)?'is-on':''}" data-action="pick-skill" data-value="${esc(s)}"><b>${esc(s)}${skillBonus(profile(),s)?` <i>+${skillBonus(profile(),s)}</i>`:''}</b><small>${esc(SKILL_INFO[s])}</small></button>`).join('')}</div><span class="eyebrow">INSTRUMENTO INICIAL</span><div class="inst-grid">${Object.entries(INSTRUMENTS).map(([id,d])=>`<button class="inst-card ${S.instrument===id?'is-on':''}" data-action="pick-inst" data-value="${id}"><b>${d.icon} ${esc(d.name)}</b><small>${esc(d.text)}</small></button>`).join('')}</div><div class="paper-actions"><button class="btn btn-primary" data-action="submit-skills" ${S.skills.length===3?'':'disabled'}>FECHAR FICHA →</button></div>`,true)}
 if(st==='class'){const sd=SECTOR_DATA[S.sector],sin=SINS[S.sinChoice],deck=starterDeck(S.sector);const uniq=[...new Set(deck)];
  return dossier(4,`<div class="sheet"><div class="sheet-head"><span class="eyebrow">FICHA DE SEARCHER · ACESSO CONCEDIDO</span><h1>${esc(S.name)}</h1><div class="sheet-tags"><span>${esc(S.sector)} · ${sd.role}</span><span>${esc(S.sinChoice)}</span><span>${INSTRUMENTS[S.instrument].name} · Pistola</span></div><p class="lead">${esc(sd.desc)}</p></div>
  <div class="sheet-cols"><div><div class="sheet-block"><b>RECURSOS</b><div class="res-grid"><span>VIDA<b>${maxHp(profile())}</b></span><span>MORAL<b>8</b></span><span>SANIDADE<b>10</b></span><span>DEFESA<b>11</b></span><span>MOVIMENTO<b>3</b></span><span>CONFIANÇA<b>6/10</b></span></div></div>
  <div class="sheet-block"><b>PASSIVA DE SETOR · ${esc(sd.passive)}</b><p>${esc(sd.passiveText)}</p></div><div class="sheet-block"><b>PASSIVA DE PECADO · ${esc(sin.passive)}</b><p>${esc(sin.text)}</p></div>
  <div class="sheet-block"><b>PERÍCIAS</b><p>${SKILLS.map(s=>`<span class="sk ${S.skills.includes(s)?'main':''}">${s}${skillBonus(profile(),s)?' +'+skillBonus(profile(),s):''}</span>`).join('')}</p></div></div>
  <div><div class="sheet-block"><b>DECK DE AÇÃO · 20 CARTAS</b><div class="deck-thumbs">${uniq.map(id=>cardFace(CARDS[id],'thumb')+`<i class="x2">×2</i>`).map(h=>`<div class="thumb-wrap">${h}</div>`).join('')}</div></div></div></div></div>
  <div class="paper-actions"><button class="btn btn-ghost" data-action="redo-sheet">REFAZER</button><button class="btn btn-primary" data-action="begin-story">ACEITAR O PRIMEIRO CONTRATO →</button></div>`,true)}
 return'';
}
/* Carta: arte ilustrada quando existe; Doutrina é desenhada em HTML no mesmo estilo. */
function cardFace(card,size='in-hand'){return CardArt.card(card,size)}
/* ---------- visual novel ---------- */
const ECHOES=['Ela trancou a menina lá embaixo.','Você já esteve nesta igreja. Você se lembra da porta.','O caderno foi escrito ontem.','Ninguém vai sentir falta dela.','A vela no portão era para você.','Você não morreu sozinho.'];
function characterHTML(id,expression='neutral'){const speaker=({elvira:'Dona Elvira',eco:'Eco do Contrato',guardian:'Guardião do Prazo'})[id]||S.name||'Searcher';return`<div class="character ${id} ${id==='searcher'?'left':'right'}" data-character="${id}" data-expression="${expression}"><img src="${portraitAsset(id,expression)}" alt="${esc(speaker)}" decoding="async"></div>`}
function vn(){const n=NODES[S.node]||NODES.arrival,choices=typeof n.choices==='function'?n.choices():n.choices||[],phrase=typeof n.text==='function'?n.text():n.text;const infernal=S.node.startsWith('hell'),guest=n.character||(n.portrait?'elvira':'');
 const echo=S.sanity<=6&&!infernal&&roll(10)<=4?ECHOES[roll(ECHOES.length)-1]:'';
 return`<section class="stage vn ${infernal?'is-hell':''}" data-scene="${esc(S.node)}"><div class="scene-bg" style="background-image:url('${n.image}')"></div><div class="scene-vignette"></div>${topbar(infernal?'Portão Zero':'Igreja de Santa Cecília',infernal?'HELLS':'CÓMUM · CONTRATO 001')}
 <div class="vn-cast">${characterHTML('searcher',infernal?'transformed':'neutral')}${guest?characterHTML(guest,S.node==='hell5'?'transformed':n.expression||'neutral'):''}</div>
 <div class="vn-hud">${meter('moral','MORAL',S.moral,8)}${meter('sanity','SANIDADE',S.sanity,10,'sanity')}${meter('trust','CONFIANÇA',S.trust,10)}<span class="vn-proofs">PROVAS ${S.clues.length}/${Object.keys(CLUES).length}</span></div>
 <div class="dialogue"><div class="who">${esc(n.speaker)}</div><div class="text typewritten" role="button" tabindex="0" data-full="${esc(phrase)}"></div>${echo?`<div class="echo" aria-hidden="true">${esc(echo)}</div>`:''}<div class="dialogue-choices is-waiting" inert>${choices.map((c,i)=>{const t=c[1]==='find'?CLUES[c[2]]?.test:null;return`<button class="choice" data-action="${c[1]}" data-value="${c[2]}"><span class="num">${i+1}</span><span>${esc(c[0])}</span>${t&&!S.clues.includes(c[2])?`<em class="test-tag">${esc(t.skill)} · DT ${t.dc}</em>`:''}</button>`}).join('')}</div><span class="dialogue-hint">CLIQUE NA FALA PARA REVELAR</span></div></section>`}
function runTypewriter(){const el=$('.typewritten'),choices=$('.dialogue-choices'),n=NODES[S.node];if(!el)return;Cinematics.startTypewriter(el,el.dataset.full,{speaker:n.speaker==='DONA ELVIRA'?'elvira':n.speaker==='SEARCHER'?'searcher':'voice',onDone:()=>{choices.classList.remove('is-waiting');choices.inert=false;const h=$('.dialogue-hint');if(h)h.textContent=choices.children.length===1?'CLIQUE NA FALA OU ESPAÇO PARA CONTINUAR':'ESCOLHA COMO AGIR · TECLAS 1–9'}})}
function advanceDialogue(){if(Cinematics.busy)return;if(Cinematics.finishTypewriter())return;const choices=$('.dialogue-choices');if(choices&&!choices.inert&&choices.children.length===1)choices.firstElementChild.click()}
function goNode(id){if(!NODES[id]){flash('Cena indisponível: '+id);return}const previous=NODES[S.node],next=NODES[id];
 const update=()=>{S.node=id;S.stage='vn';persist();render();if(['judgment','hell1'].includes(id))Cinematics.showTitle(id==='judgment'?'SEU JULGAMENTO COMEÇOU':'BEM-VINDO AO HELLS');if(id==='arrival')audio('bell');
  if(next.horror&&!S.flags['event_'+id]){S.flags['event_'+id]=true;setTimeout(async()=>{if(S.stage==='vn'&&S.node===id){await Cinematics.playHorrorEvent(next.horror);await impossibleSign('A cadeira se vira para a parede.')}},1100)}
  if(id==='nave'&&S.flags.photoSeen&&!S.flags.photoReturned){S.flags.photoReturned=true;setTimeout(()=>{if(S.stage==='vn'&&S.node===id)Cinematics.playHorrorEvent('portrait')},1100)}
  if(id==='hell4')setTimeout(()=>{if(S.stage==='vn'&&S.node===id)Cinematics.transformation()},1800)};
 if(S.stage!=='vn'||previous?.image!==next.image)Cinematics.transitionScene(update,{blink:id==='hell1'});else update()}
/* Sinal impossível (Manual, cap. 14): Resistência DT 13 ou −1 Sanidade. */
async function impossibleSign(text){const r=await skillTest({skill:'Resistência',dc:13,title:'Sinal impossível',reason:text,noCancel:true});if(!r.ok)changeSanity(-1);render()}
/* ---------- teste de perícia com D20 (Manual, cap. 3) ---------- */
function formHand(){return S.board?.fhand||[]}
function skillTest({skill,dc,title,reason='',extra=0,extraLabel='',noCancel=false,circ=0}){
 return new Promise(resolve=>{
  const base=skillBonus(profile(),skill),hand=formHand(),hasForm=hand.includes(skill);let useForm=hasForm;
  const pasta=S.board?.pasta&&['Investigação','Discernimento'].includes(skill);
  const root=$('#modal-root');
  const draw=()=>{const total=base+(useForm?2:0)+extra+circ+(pasta?2:0)+(S.sanity<=3&&skill==='Resistência'&&!S.flags.lowSanityUsed?-2:0);
   root.innerHTML=`<div class="modal-backdrop"><div class="modal test-modal"><span class="eyebrow">TESTE DE PERÍCIA · D20</span><h2>${esc(title)}</h2>${reason?`<p class="lead">${esc(reason)}</p>`:''}<div class="test-line"><div class="test-skill"><small>PERÍCIA</small><b>${esc(skill)}</b></div><div class="test-skill"><small>BÔNUS</small><b>${total>=0?'+':''}${total}</b></div><div class="test-skill dc"><small>DIFICULDADE</small><b>DT ${dc}</b></div></div>
   <ul class="test-parts"><li>Bônus permanente (Setor + Pecado): ${base>=0?'+':''}${base}</li>${extra?`<li>${esc(extraLabel)}: +${extra}</li>`:''}${circ?`<li>Circunstância: ${circ>0?'+':''}${circ}</li>`:''}${pasta?'<li>Pasta de Contratos: +2</li>':''}${S.sanity<=3&&skill==='Resistência'&&!S.flags.lowSanityUsed?'<li>Sanidade 3 ou menos: −2</li>':''}</ul>
   <button class="form-toggle ${useForm?'is-on':''}" data-t="form" ${hasForm?'':'disabled'}><span class="fchip">${esc(skill)}</span>${hasForm?(useForm?'Formação jogada: +2 (a carta será descartada)':'Jogar Formação de '+esc(skill)+' (+2)'):'Sem Formação de '+esc(skill)+' na mão'}</button>
   <p class="fine">Precisa de ${Math.max(2,dc-total)} ou mais no D20. 20 natural sempre passa; 1 natural sempre falha.</p><div class="modal-actions">${noCancel?'':'<button class="btn btn-ghost" data-t="cancel">VOLTAR</button>'}<button class="btn btn-primary" data-t="roll">ROLAR D20</button></div></div></div>`};
  draw();
  root.onclick=async e=>{const b=e.target.closest('[data-t]');if(!b||b.disabled)return;const t=b.dataset.t;
   if(t==='form'){useForm=!useForm;draw();return}
   if(t==='cancel'){root.innerHTML='';root.onclick=null;resolve({ok:false,cancelled:true});return}
   if(t==='roll'){root.onclick=null;const low=S.sanity<=3&&skill==='Resistência'&&!S.flags.lowSanityUsed;if(low)S.flags.lowSanityUsed=true;const bonus=base+(useForm?2:0)+extra+circ+(pasta?2:0)+(low?-2:0);
    if(useForm){const i=S.board.fhand.indexOf(skill);S.board.fhand.splice(i,1);S.board.fdiscard.push(skill)}if(pasta)S.board.pasta=false;
    root.innerHTML='';const n=roll(20),total=n+bonus,ok=n===20||(n!==1&&total>=dc);
    await Dice3D.roll([{sides:20,value:n,ok}],{title:`${title} · ${skill}`,result:n===20?'SUCESSO CRÍTICO':n===1?'FALHA CRÍTICA':ok?'SUCESSO':'FALHA',detail:`${n} ${bonus>=0?'+':'−'} ${Math.abs(bonus)} = ${total} contra DT ${dc}`,tone:n===20?'crit':ok?'good':'bad'});
    persist();resolve({ok,natural:n,total,crit:n===20,fumble:n===1})}};
 })}
function ritualPrompt({sentence,proofs,dc,paid}){return new Promise(resolve=>{const root=$('#modal-root');
 root.innerHTML=`<div class="modal-backdrop"><div class="modal ritual"><span class="eyebrow">RITUAL DE JULGAMENTO · MANUAL CAP. 6</span><h2>Sentença: ${esc(sentence)}</h2><ul class="ritual-req"><li class="${proofs>=2?'ok':'no'}"><b>${proofs}/2</b> Provas reais registradas${proofs<2?' — selo frágil: DT +3':''}</li><li class="${S.moral>=2?'ok':'no'}"><b>${S.moral}</b> Moral — custa 2 para pronunciar${paid==='sanity'?'. Sem Moral, você paga 2 de Sanidade.':''}</li><li class="ok"><b>D20 + Resistência</b> contra DT ${dc} (13 + Portão I${proofs<2?' + 3':''})</li></ul><p class="lead">Sucesso: o selamento é válido. Falha: o contrato reage — você perde Sanidade e o Portão fica mais forte. A decisão é registrada de qualquer forma.</p><div class="modal-actions"><button class="btn btn-ghost" data-t="no">RECONSIDERAR</button><button class="btn btn-primary" data-t="yes">PRONUNCIAR A SENTENÇA</button></div></div></div>`;
 root.onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;root.innerHTML='';root.onclick=null;resolve(b.dataset.t==='yes'?true:null)}})}
function confirmModal(title,text,yes='CONFIRMAR',no='CANCELAR'){return new Promise(resolve=>{const root=$('#modal-root');root.innerHTML=`<div class="modal-backdrop"><div class="modal"><h2>${esc(title)}</h2><p class="lead">${esc(text)}</p><div class="modal-actions">${no?`<button class="btn btn-ghost" data-t="no">${esc(no)}</button>`:''}<button class="btn btn-primary" data-t="yes">${esc(yes)}</button></div></div></div>`;root.onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;root.innerHTML='';root.onclick=null;resolve(b.dataset.t==='yes')}})}
/* ---------- provas ---------- */
async function giveClue(id){const clue=CLUES[id];if(!clue)return;
 if(clue.test&&!S.clues.includes(id)&&!S.flags['passed_'+id]){
  const circ=id==='child'&&S.flags.childComforted?2:0;
  const r=await skillTest({skill:clue.test.skill,dc:clue.test.dc,title:clue.title,reason:testReason(id),circ});
  if(r.cancelled)return;
  if(!r.ok){advanceClock(1,true);if(r.fumble){changeSanity(-1);if(S.board?.presence)S.board.presence.boost=2}flash(failText(id)+' 15 minutos se perdem.'+(r.fumble?' Algo nota sua presença.':''));render();return}
  S.flags['passed_'+id]=true;if(r.crit)changeMoral(1)}
 if(id==='photo')S.flags.photoSeen=true;S.evidenceId=id;patch({stage:'evidence'});audio('paper');
 if(['letter','notebook'].includes(id)&&!S.flags['horror_'+id]){S.flags['horror_'+id]=true;setTimeout(()=>{if(S.stage==='evidence'&&S.evidenceId===id)Cinematics.playHorrorEvent()},900)}}
function testReason(id){return({ledger:'Encontrar a página certa entre décadas de registros.',news:'Achar a matéria recortada entre jornais iguais.',keys:'Pegar o estojo sem que Elvira perceba.',letter:'Notar a folha presa sob o apoio dos joelhos.',photo:'Reparar no rosto ao fundo da fotografia.',notebook:'Ler a letra trêmula sob a luz que falha.',cellar:'Achar o que foi arrancado da caixa.',child:'Falar com Lia sem assustá-la.'+(S.flags.childComforted?' Você se ajoelhou a uma distância segura: +2.':'')})[id]||''}
function failText(id){return({ledger:'As páginas se misturam.',news:'Os recortes escorregam da pasta.',keys:'Elvira ergue os olhos para a sacristia. Melhor esperar.',letter:'A madeira estala e você recua.',photo:'A moldura reflete apenas a lâmpada.',notebook:'A luz falha antes do fim da página.',cellar:'A caixa parece mais funda do que deveria.',child:'Lia aperta o desenho contra o peito e olha para a porta.'})[id]||'Não foi desta vez.'}
function evidence(){const e=CLUES[S.evidenceId]||CLUES.ledger;const bg=e.room==='porao'?SCENERY.quarto:({escritorio:SCENERY.arquivo,nave:SCENERY.nave,sacristia:SCENERY.sacristia,arquivo:SCENERY.arquivo,confessionario:SCENERY.confessionario,patio:SCENERY.patio})[e.room]||SCENERY.arquivo;
 return`<section class="stage evidence-stage"><div class="scene-bg blur" style="background-image:url('${bg}')"></div>${topbar('Material coletado','ARQUIVO 001')}<div class="evidence-paper"><div class="paper-stamp">OR / 001</div><span class="eyebrow">${esc(e.location)}</span><h1>${esc(e.title)}</h1><p class="evidence-content">${esc(e.text)}</p><div class="evidence-note">${esc(e.description)}</div></div><div class="evidence-actions"><button class="btn btn-ghost" data-action="journal">COMPARAR REGISTROS</button><button class="btn btn-primary" data-action="store-evidence">${S.clues.includes(e.id)?'VOLTAR':'GUARDAR NO DOSSIÊ'} →</button></div></section>`}
/* ---------- tabuleiro (estilo Clue) ---------- */
const BW=944,BH=708,CW=BW/ChurchBoard.COLS,CH=BH/ChurchBoard.ROWS;
function initBoard(){const f=shuffle(formationDeck(S.skills,S.sinChoice));S.board={pos:[...ChurchBoard.START],room:null,steps:0,rolled:false,turn:0,presence:null,fhand:f.splice(0,2),fpile:f,fdiscard:[],log:['22:00 · O sino toca uma vez. A porta de Santa Cecília está entreaberta.'],pasta:false,instrumentAt:0}}
function boardLog(text){S.board.log.unshift(clockLabel(S.board.turn)+' · '+text);S.board.log=S.board.log.slice(0,14)}
function cellPx(x,y){return[(x+.5)*CW,(y+.5)*CH]}
function roomPx(id){const r=ChurchBoard.ROOMS[id];return[(r.center[0]+.5)*CW,(r.center[1]+.5)*CH]}
function tokenPos(){const b=S.board;return b.room?roomPx(b.room):cellPx(...b.pos)}
/* BFS a partir da casa atual, ou das portas da sala atual (sair pela porta custa 1). */
function boardReach(){const b=S.board,steps=b.steps;const block=b.presence?[b.presence.pos]:[];const dist=new Map(),prev=new Map(),q=[];
 const add=(c,d,p)=>{const k=ChurchBoard.key(...c);if(dist.has(k))return;dist.set(k,d);if(p)prev.set(k,p);q.push(c)};
 if(b.room)for(const d of ChurchBoard.ROOMS[b.room].doors){if(!block.some(([x,y])=>x===d[0]&&y===d[1]))add(d,1,null)}else add(b.pos,0,null);
 for(let i=0;i<q.length;i++){const [x,y]=q[i],d=dist.get(ChurchBoard.key(x,y));if(d>=steps)continue;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=ChurchBoard.key(nx,ny);if(!ChurchBoard.isCorridor(nx,ny)||dist.has(k)||block.some(([bx,by])=>bx===nx&&by===ny))continue;dist.set(k,d+1);prev.set(k,[x,y]);q.push([nx,ny])}}
 const rooms={};for(const [id,r] of Object.entries(ChurchBoard.ROOMS)){if(id===b.room)continue;for(const d of r.doors){const dd=dist.get(ChurchBoard.key(...d));if(dd!=null&&dd+1<=steps&&(rooms[id]==null||dd<rooms[id].d))rooms[id]={d:dd,door:d}}}
 return{dist,prev,rooms}}
function boardPath(prev,to){const out=[to];let k=ChurchBoard.key(...to);while(prev.has(k)){const p=prev.get(k);out.unshift(p);k=ChurchBoard.key(...p)}return out}
function explore(){if(!S.board)initBoard();const b=S.board,reach=b.rolled?boardReach():null,inRoom=b.room?ChurchBoard.ROOMS[b.room]:null;const [tx,ty]=tokenPos();
 const cells=[];if(reach)for(const [k,d] of reach.dist){if(d===0)continue;const [x,y]=k.split(',').map(Number);cells.push(`<button class="bcell reach" style="left:${x*CW}px;top:${y*CH}px;width:${CW}px;height:${CH}px" data-action="board-cell" data-value="${k}" title="${d} passo(s)"></button>`)}
 const rooms=Object.entries(ChurchBoard.ROOMS).map(([id,r])=>{const [x1,y1,x2,y2]=r.rect;const can=reach?.rooms[id];const done=roomDone(id);return`<button class="broom ${can?'can-enter':''} ${b.room===id?'is-here':''} ${done?'is-done':''}" style="left:${x1*CW}px;top:${y1*CH}px;width:${(x2-x1+1)*CW}px;height:${(y2-y1+1)*CH}px" data-action="board-room" data-value="${id}" ${can||b.room===id?'':'tabindex="-1"'}><span class="broom-name">${esc(r.name)}</span>${roomClueBadge(id)}</button>`}).join('');
 const p=b.presence;const presence=p?`<div class="presence ${p.near?'is-near':''}" style="left:${cellPx(...p.pos)[0]}px;top:${cellPx(...p.pos)[1]}px"><img src="${ASSETS.elvira.transformed}" alt=""></div>`:'';
 const [ex,ey]=roomPx('nave');
 const secret=b.room&&ChurchBoard.SECRET[b.room]&&S.clues.includes('keys');
 return`<section class="stage explore">${topbar('Santa Cecília','CONTRATO 001 · CÓMUM · INVESTIGAÇÃO')}
 <aside class="ex-left panel">${sheetMini()}</aside>
 <main class="ex-board"><div class="board" style="width:${BW}px;height:${BH}px"><img class="board-map" src="${ASSETS.map}" alt="Planta da Igreja de Santa Cecília" draggable="false">${rooms}${cells}<div class="npc elvira-npc" style="left:${ex+40}px;top:${ey-10}px" title="Dona Elvira"><img src="${ASSETS.elvira.neutral}" alt="Dona Elvira"></div>${presence}<div class="pawn" style="left:${tx}px;top:${ty}px"><img src="${searcherAsset('novel')}" alt="${esc(S.name)}"></div></div></main>
 <aside class="ex-right panel"><div class="turn-box"><span class="eyebrow">TURNO ${b.turn+1} · ${clockLabel(b.turn)}</span>${b.rolled?`<h3>${b.steps} passo${b.steps>1?'s':''}</h3><p>Clique numa casa iluminada ou numa sala destacada. Entrar numa sala encerra o movimento.</p><button class="btn btn-ghost btn-wide" data-action="board-stay">FICAR PARADO</button>`:`<h3>${inRoom?esc(inRoom.name):'Corredor'}</h3><p>${inRoom?'Investigue a sala ou role o D6 para sair por uma das portas.':'Role o D6 para andar pelos corredores.'}</p><button class="btn btn-primary btn-wide" data-action="board-roll">🎲 ROLAR D6 PARA ANDAR</button>${inRoom?`<button class="btn btn-ghost btn-wide" data-action="board-investigate">INVESTIGAR ${esc(inRoom.name.toUpperCase())}</button>`:''}${secret?`<button class="btn btn-ghost btn-wide secret" data-action="board-secret">PASSAGEM SOB O ALTAR →</button>`:''}`}</div>
 <div class="side-actions"><button class="btn btn-ghost btn-wide" data-action="talk">CONVERSAR COM ELVIRA</button><button class="btn btn-blood btn-wide" data-action="confront">DECIDIR O JULGAMENTO →</button></div>
 <div class="board-log"><span class="eyebrow">REGISTRO DA NOITE</span>${b.log.map(l=>`<p>${esc(l)}</p>`).join('')}</div></aside></section>`}
function roomDone(id){const map={nave:['photo'],sacristia:['keys'],arquivo:['ledger','news'],confessionario:['letter'],porao:['notebook','cellar'],patio:['child']};const list=map[id];return list&&list.every(c=>S.clues.includes(c))}
function roomClueBadge(id){const map={nave:['photo'],sacristia:['keys'],arquivo:['ledger','news'],confessionario:['letter'],porao:['notebook','cellar'],patio:['child']};const list=map[id];if(!list)return'';const got=list.filter(c=>S.clues.includes(c)).length;return`<span class="broom-clues">${'◆'.repeat(got)}${'◇'.repeat(list.length-got)}</span>`}
function sheetMini(){const sd=SECTOR_DATA[S.sector]||{};const f=formHand();const inst=INSTRUMENTS[S.instrument];return`<div class="sheet-mini"><div class="sm-portrait"><img src="${searcherAsset('novel')}" alt=""></div><div class="sm-name"><b>${esc(S.name)}</b><small>${esc(S.sector)} · ${esc(S.sinChoice)}</small></div></div>
 ${meter('moral','MORAL',S.moral,8)}${meter('sanity','SANIDADE',S.sanity,10,'sanity')}${meter('trust','CONFIANÇA',S.trust,10)}
 <div class="mini-stats"><span>FAME <b>${S.fame}</b></span><span>PROVAS <b>${S.clues.length}/8</b></span><span>CICATRIZES <b>${S.scars}</b></span></div>
 <div class="form-hand"><span class="eyebrow">FORMAÇÃO NA MÃO · ${f.length}/4</span><div>${f.map(s=>`<span class="fchip" title="${esc(SKILL_INFO[s])}">${esc(s)}</span>`).join('')||'<small class="muted">Vazia. Compre 1 por turno.</small>'}</div><small class="muted">Jogue uma Formação num teste para +2 no D20.</small></div>
 ${S.instrument==='pasta'?`<button class="btn btn-ghost btn-wide" data-action="board-pasta" ${S.board.pasta||S.board.turn<S.board.instrumentAt?'disabled':''}>▤ PASTA DE CONTRATOS ${S.board.pasta?'· PRONTA (+2)':S.board.turn<S.board.instrumentAt?'· RECARGA':''}</button>`:''}
 <div class="dossier-list"><span class="eyebrow">DOSSIÊ</span>${S.clues.map(id=>`<button class="dl-item" data-action="reread" data-value="${id}">◆ ${esc(CLUES[id].label)}</button>`).join('')||'<small class="muted">Nenhum registro ainda.</small>'}</div>`}
async function boardRoll(){const b=S.board;if(b.rolled||Cinematics.busy)return;const v=roll(6);await Dice3D.roll([{sides:6,value:v}],{title:'Movimento pelos corredores',result:v+' PASSO'+(v>1?'S':''),detail:'Entrar numa sala encerra o movimento.'});b.steps=v;b.rolled=true;persist();render()}
async function walkPawn(points){const pawn=$('.pawn');if(!pawn)return;await Cinematics.walkToTile(points.map(([x,y])=>({x,y})),{element:pawn,stepMs:150})}
async function boardMoveTo(cell){const b=S.board;const {dist,prev}=boardReach();const k=ChurchBoard.key(...cell);if(!dist.has(k))return;const path=boardPath(prev,cell).map(c=>cellPx(...c));const start=tokenPos();await walkPawn([start,...path]);b.pos=cell;b.room=null;b.steps=0;b.rolled=false;await endBoardTurn()}
async function boardEnterRoom(id){const b=S.board;const {prev,rooms}=boardReach();const r=rooms[id];if(!r)return;const path=boardPath(prev,r.door).map(c=>cellPx(...c));await walkPawn([tokenPos(),...path,roomPx(id)]);b.room=id;b.pos=[...r.door];b.steps=0;b.rolled=false;if(!S.visited.includes(id))S.visited.push(id);boardLog('Você entra em '+ChurchBoard.ROOMS[id].name+'.');const alive=await endBoardTurn(true);if(alive)goNode(id)}
function advanceClock(n=1,silent=false){if(!S.board)return;S.board.turn+=n;for(let i=0;i<n;i++)drawFormation();if(!silent)persist()}
function drawFormation(){const b=S.board;if(b.fhand.length>=4)return;if(!b.fpile.length){b.fpile=shuffle(b.fdiscard);b.fdiscard=[]}const f=b.fpile.pop();if(f)b.fhand.push(f)}
/* Fim de turno no tabuleiro: relógio, eventos da noite e a Presença. Devolve false se a noite interrompeu. */
async function endBoardTurn(enteringRoom=false){const b=S.board;advanceClock(1);render();
 const t=b.turn;
 if(t===4&&!S.flags.bell){S.flags.bell=true;boardLog('O sino toca sozinho. Ninguém está na torre.');audio('bell');await Cinematics.playLightFlicker();await impossibleSign('O sino toca sem ninguém na torre. A corda ainda balança.')}
 if(t===3&&!b.presence){b.presence={pos:[16,21],wait:0};boardLog('Algo entrou pela porta principal depois de você.');await Cinematics.playHorrorEvent();}
 if(t===8&&!S.flags.midnight){S.flags.midnight=true;boardLog('Meia-noite. As velas apagam todas de uma vez.');audio('bell');await Cinematics.playHorrorEvent('door');flash('MEIA-NOITE. A Presença ficou mais rápida.')}
 if(t===12&&!S.flags.candle){S.flags.candle=true;boardLog('Uma vela acesa aparece no portão. Ninguém a trouxe.');flash('01:00 · Falta uma hora para o prazo vencer.')}
 await presenceStep(enteringRoom);
 persist();render();
 if(t>=DEADLINE&&!S.flags.deadline){S.flags.deadline=true;await confirmModal('O prazo venceu','São 02:00. O contrato queima no seu bolso. Elvira está na nave, esperando. Não há mais tempo para investigar.','IR AO JULGAMENTO',null);goNode('confrontation');return false}
 return true}
async function presenceStep(enteringRoom){const b=S.board,p=b.presence;if(!p)return;if(p.wait>0){p.wait--;return}
 const target=b.room?ChurchBoard.ROOMS[b.room].doors.map(d=>({d,path:ChurchBoard.shortest(p.pos,d)})).filter(o=>o.path).sort((a,c)=>a.path.length-c.path.length)[0]?.d:b.pos;if(!target)return;
 const path=ChurchBoard.shortest(p.pos,target);if(!path)return;let steps=Math.ceil(roll(6)/2)+(b.turn>=8?1:0)+(p.boost||0);p.boost=0;
 const moveTo=path[Math.min(steps,path.length-1)];const el=$('.presence');
 if(el&&motionOK()){const pts=path.slice(0,Math.min(steps,path.length-1)+1).map(c=>{const [x,y]=cellPx(...c);return{x,y}});await Cinematics.walkToTile(pts,{element:el,stepMs:200})}
 p.pos=moveTo;const d=Math.abs(p.pos[0]-b.pos[0])+Math.abs(p.pos[1]-b.pos[1]);
 if(b.room){if(ChurchBoard.ROOMS[b.room].doors.some(([x,y])=>x===p.pos[0]&&y===p.pos[1])){boardLog('Batidas na porta. Três. Depois, silêncio.');audio('door');flash('Algo bate na porta da sala. Ele sabe onde você está.');p.wait=1}return}
 if(d<=1){boardLog('A Presença alcança você no corredor.');await presenceEncounter()}
 else if(d<=4){p.near=true;audio('whisper')}else p.near=false}
async function presenceEncounter(){const b=S.board;audio('whisper');await Cinematics.playHorrorEvent();const r=await skillTest({skill:'Resistência',dc:13,title:'A Presença',reason:'Um vulto com o rosto de Elvira para a um palmo de você. Ele usa a sua voz para dizer o seu nome.',noCancel:true});
 if(!r.ok){changeSanity(-1);if(r.fumble)changeSanity(-1);boardLog('Você ouviu seu nome. −1 Sanidade.')}else boardLog('Você não responde. O vulto se desfaz.');
 const far=[...ChurchBoard.corridor].map(k=>k.split(',').map(Number)).filter(([x,y])=>Math.abs(x-b.pos[0])+Math.abs(y-b.pos[1])>=12);b.presence={pos:far[roll(far.length)-1]||[16,21],wait:1};render()}
async function boardSecret(){const b=S.board;const to=ChurchBoard.SECRET[b.room];if(!to)return;await Cinematics.transitionScene(()=>{b.room=to;b.pos=[...ChurchBoard.ROOMS[to].doors[0]];boardLog('Você desce pela passagem sob o altar.');persist();render()});const alive=await endBoardTurn(true);if(alive)goNode(to)}
/* ---------- telas finais e véu ---------- */
function veil(){return`<section class="stage veil"><div class="veil-inner"><span class="eyebrow">CONTRATO REGISTRADO · RETORNO</span><h1>Sua assinatura<br>atravessou o véu.</h1><p>A próxima voz já conhece sua decisão.</p><button class="btn btn-primary" data-action="wake-hell">ABRIR OS OLHOS →</button></div></section>`}
function victoryEye(){return`<section class="stage intro victory-eye"><div class="intro-glow"></div><div class="intro-inner"><span class="eyebrow">PRÓLOGO CONCLUÍDO</span><button class="eye-button" data-action="reveal-community" aria-label="Continuar">${eyeSVG()}</button><h1>O contrato foi encerrado.</h1><p class="intro-whisper">O PRÓXIMO PASSO ESTÁ DO OUTRO LADO.</p><span class="intro-tip">CLIQUE NO OLHO PARA CONTINUAR</span></div></section>`}
function community(){return`<section class="stage community"><img class="intro-logo small" src="${ASSETS.logo}" alt="ORDER"><div class="paper community-paper"><span class="eyebrow">SEU PRIMEIRO CONTRATO TERMINOU</span><h1>A Ordem espera por você.</h1><p class="lead">Entre no grupo do Discord para conhecer a comunidade, acompanhar o projeto e continuar essa história.</p><div class="paper-actions"><a class="btn btn-primary" href="${DISCORD_INVITE}" target="_blank" rel="noopener noreferrer">ENTRAR NO DISCORD ↗</a><button class="btn btn-ghost" data-action="view-ending">LER O RESULTADO DO JULGAMENTO</button></div></div><button class="btn btn-ghost" data-action="postgame-eye">VOLTAR AO OLHO</button></section>`}
function ending(){const won=S.outcome==='victory',route=S.flags.route||'collect';const title=!won?'Sua assinatura ainda pesa.':route==='mercy'?'Elvira continua na Terra.':route==='defer'?'Uma noite a mais.':'Contrato encerrado.';
 const desc=!won?'O Portão o derrubou. Sua decisão permanece no arquivo. Você pode tentar novamente com o mesmo compromisso.':route==='mercy'?'O Eco se desfaz; a dívida não. Na igreja, Elvira abre o caderno diante da mãe de Lia. O que fará com os nomes ainda depende dela. Você assumiu a suspensão, e uma parcela passa a constar sob a sua assinatura.':route==='defer'?'O Guardião cede. O contrato volta à sua pasta com um novo prazo. Ao amanhecer, Elvira deverá apresentar as cartas que faltam. Não houve absolvição nem cobrança. Seu próximo retorno decidirá o que a espera comprou.':'O véu de Elvira se desfaz. As mãos deixam de prender. Não há aplauso nem voz dizendo que você julgou bem. Na Terra, alguém encontrará a sopa fria. O arquivo registra a parcela recebida.';
 return`<section class="stage ending"><div class="scene-bg blur" style="background-image:url('${SCENERY.hell}')"></div><div class="paper ending-paper"><div class="paper-stamp">${won?'REGISTRADO':'INTERROMPIDO'}</div><span class="eyebrow">ORDER V0.5 · PROCESSO 001</span><h1>${esc(title)}</h1><p class="lead">${desc}</p><p class="fine">${S.clues.includes('child')?'Lia foi ouvida e permanece sob proteção.':'O testemunho de Lia não consta no processo.'} ${S.flags.ritualOk?'O selamento foi válido.':S.flags.ritualFailed?'O selo não fechou: o contrato reagiu.':''} ${S.flags.aggressive?'Elvira se lembrará da ameaça na igreja.':''} ${S.scars?`Você carrega ${S.scars} cicatriz(es).`:''}</p><div class="res-grid end"><span>MORAL<b>${S.moral}/8</b></span><span>CONFIANÇA<b>${S.trust}/10</b></span><span>SANIDADE<b>${S.sanity}/10</b></span><span>HELL OF FAME<b>${S.fame}</b></span><span>PROVAS<b>${S.clues.length}/8</b></span><span>PORTÃO<b>I · RECRUTA</b></span></div><div class="paper-actions">${!won?'<button class="btn btn-primary" data-action="retry-boss">TENTAR NOVAMENTE</button>':'<button class="btn btn-primary" data-action="postgame-eye">CONTINUAR →</button>'}<button class="btn btn-ghost" data-action="journal">REVER DOSSIÊ</button><button class="btn btn-ghost" data-action="restart">REINICIAR</button></div><p class="fine center">FIM DO PRÓLOGO · O JULGAMENTO DOS OUTROS NÃO ABSOLVE O SEU.</p></div></section>`}
/* ---------- combate (v6): arena isométrica de papel, cartas viradas ao mesmo tempo, revelação por iniciativa ---------- */
const ISO={TW:96,TH:48,D:20,PILLAR:46,PAD:30,TOP:200};
const UI={sel:null,mode:null,option:null,guess:null,busy:false,log:[]};
function isoPos(x,y){const ox=ISO.PAD+CombatRules.H*ISO.TW/2;return[ox+(x-y)*ISO.TW/2,ISO.TOP+(x+y)*ISO.TH/2]}
const ISO_W=ISO.PAD*2+(CombatRules.W+CombatRules.H)*ISO.TW/2,ISO_H=ISO.TOP+(CombatRules.W+CombatRules.H)*ISO.TH/2+ISO.D+30;
function enemyName(){const c=S.combat;return c?.enemies.find(e=>e.boss)?.name||'Portão'}
function combatLog(t){UI.log.unshift(t);UI.log=UI.log.slice(0,10)}
function startBattle(){S.combat=CombatRules.create(profile(),S.flags.route||'collect',{proofs:S.sector==='JUSTIÇA'?S.clues.length:0,harder:!!S.flags.ritualFailed});S.combat.sanity=S.sanity;UI.log=[];UI.sel=null;UI.mode=null;patch({stage:'combat'});setTimeout(async()=>{await playEvents(CombatRules.begin(S.combat));persist();render()},500)}
function committedCard(c){const k=c.player.committed;if(!k)return null;return k.kind==='pistol'?WEAPON:CARDS[k.ref.id]}
function enemyCardData(key){const k=CombatRules.ENEMY_CARDS[key];return{...k,id:'',sector:'INIMIGO'}}
function blockSVG(x,y,h,cls,extra=''){const [sx,sy]=isoPos(x,y),tw=ISO.TW/2,th=ISO.TH/2,D=ISO.D+h,top=sy-h;
 return`<g class="blk ${cls}" ${extra}><polygon class="side-l" points="${sx-tw},${top} ${sx},${top+th} ${sx},${sy+th+ISO.D} ${sx-tw},${sy+ISO.D}"/><polygon class="side-r" points="${sx},${top+th} ${sx+tw},${top} ${sx+tw},${sy+ISO.D} ${sx},${sy+th+ISO.D}"/><polygon class="top" points="${sx},${top-th} ${sx+tw},${top} ${sx},${top+th} ${sx-tw},${top}"/></g>`}
function headCard(u,isPlayer){const c=S.combat;let inner='';
 if(isPlayer){const k=c.player.committed;if(c.player.reaction)inner=`<g class="head-card is-reaction" title="Reação armada"><rect x="-15" y="-21" width="30" height="42" rx="3"/><text y="5">R</text></g>`;else if(k&&!c.player.revealed)inner=`<g class="head-card"><rect x="-15" y="-21" width="30" height="42" rx="3"/><text y="5">✦</text></g>`}
 else if(u.committed){inner=u.known?`<g class="head-card is-known"><rect x="-36" y="-14" width="72" height="28" rx="4"/><text y="5">${esc(CombatRules.ENEMY_CARDS[u.committed.key].name)}</text></g>`:`<g class="head-card"><rect x="-15" y="-21" width="30" height="42" rx="3"/><text y="5">?</text></g>`}
 return inner}
function unitSVG(u,isPlayer){const c=S.combat;const [sx,sy]=isoPos(u.x,u.y);const art=isPlayer?searcherAsset('hell'):u.art;const h=isPlayer?150:u.boss?178:110,w=h*(art.includes('eco')||art.includes('guardiao')?.75:.667);
 const targetable=UI.mode&&UI.mode!=='trap'&&!isPlayer&&currentTargets().includes(u.uid);const pct=clamp(u.hp/u.maxHp*100,0,100);
 const st=Object.keys(u.status||{}).filter(k=>u.status[k]);
 return`<g class="unit ${isPlayer?'player':'enemy'} ${u.boss?'boss':''} ${targetable?'targetable':''} ${S.combat.order[S.combat.turnIdx]===(isPlayer?'player':u.uid)&&c.phase!=='plan'?'acting':''}" data-unit="${isPlayer?'player':u.uid}" style="transform:translate(${sx}px,${sy}px)" ${targetable?`data-action="combat-target" data-value="${u.uid}"`:''}>
 <ellipse class="u-base" rx="30" ry="15"/><g class="u-stand"><image href="${art}" x="${-w/2}" y="${-h+6}" width="${w}" height="${h}" filter="url(#paperCut)" class="${isPlayer?'':'flip'}"/></g>
 <g transform="translate(0,${-h-6})"><rect class="u-bar-bg" x="-34" y="-7" width="68" height="11" rx="5"/><rect class="u-bar ${isPlayer?'pl':''}" x="-33" y="-6" width="${66*pct/100}" height="9" rx="4"/><text class="u-bar-t" y="1.5">${u.hp}/${u.maxHp}${u.shield?' ⛨'+u.shield:''}</text>${st.length?`<text class="u-st" y="-12">${st.map(s=>s.slice(0,3).toUpperCase()).join(' · ')}</text>`:''}</g>
 <g transform="translate(0,${-h-46})">${headCard(u,isPlayer)}</g></g>`}
function currentTargets(){const c=S.combat;if(!c||c.phase!=='player')return[];const k=c.player.committed;if(!k)return[];if(UI.mode==='shot'||k.kind==='pistol')return CombatRules.validTargets(c,'pistol');const card=CARDS[k.ref.id],opt=card.kind==='choice'?card.options[k.option??0]:null;return CombatRules.validTargets(c,card,opt)}
function arenaSVG(){const c=S.combat,p=c.player;const W=CombatRules.W,H=CombatRules.H;
 const reach=c.phase==='player'&&!UI.busy&&!UI.mode?new Set(CombatRules.reachable(c)):new Set();
 const trapSet=UI.mode==='trap'?new Set(CombatRules.trapCells(c)):new Set();
 let range=new Set();if(UI.mode==='target'||UI.mode==='shot'){const k=p.committed;const r=UI.mode==='shot'||k.kind==='pistol'?WEAPON.range:(()=>{const card=CARDS[k.ref.id];return card.id==='I09'?3:CombatRules.cardRange(card,card.kind==='choice'?card.options[k.option??0]:null)})();for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(Math.abs(x-p.x)+Math.abs(y-p.y)<=r)range.add(x+','+y)}
 const units=[{...p,uid:'player',name:S.name,isPlayer:true},...c.enemies.filter(e=>e.hp>0)];
 const cells=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)cells.push([x,y]);cells.sort((a,b)=>a[0]+a[1]-(b[0]+b[1])||a[0]-b[0]);
 let out='';for(const [x,y] of cells){const k=x+','+y,pil=c.blocked.some(([bx,by])=>bx===x&&by===y);const cls=[(x+y)%2?'alt':'',pil?'pillar':'',reach.has(k)?'reach':'',trapSet.has(k)?'trapok':'',range.has(k)?'inrange':''].join(' ');
  const act=reach.has(k)?`data-action="combat-move" data-value="${k}"`:trapSet.has(k)?`data-action="combat-trap" data-value="${k}"`:'';
  out+=blockSVG(x,y,pil?ISO.PILLAR:0,cls,`data-cell="${k}" ${act}`);
  const trap=c.traps.find(t=>t.x===x&&t.y===y);if(trap){const [sx,sy]=isoPos(x,y);out+=`<g class="trap-mark" style="transform:translate(${sx}px,${sy}px)"><path d="M0 -14 6 -6 16 -9 12 0 18 6 8 7 6 16 0 9 -6 16 -8 7 -18 6 -12 0 -16 -9 -6 -6z"/><text y="4">${CARDS[trap.ref.id].id}</text></g>`}
  for(const u of units)if(u.x===x&&u.y===y)out+=unitSVG(u,!!u.isPlayer)}
 return`<svg class="iso" viewBox="0 0 ${ISO_W} ${ISO_H}" preserveAspectRatio="xMidYMid meet">${out}</svg>`}
function initiativeBar(){const c=S.combat;if(!c.order.length)return`<div class="init-bar"><span class="eyebrow">RODADA ${c.round} · PLANEJAMENTO</span></div>`;
 return`<div class="init-bar"><span class="eyebrow">RODADA ${c.round} · ORDEM</span>${c.order.map((id,i)=>{const isP=id==='player',e=isP?null:c.enemies.find(x=>x.uid===id);if(!isP&&(!e||e.hp<=0))return'';return`<span class="init-chip ${i===c.turnIdx?'now':i<c.turnIdx?'done':''} ${isP?'pl':''}"><img src="${isP?searcherAsset('hell'):e.art}" alt=""><b>${esc(isP?S.name:e.name)}</b></span>`}).join('<i>›</i>')}</div>`}
function actionBar(){const c=S.combat,p=c.player;if(c.result)return'';
 if(c.phase==='plan'){const card=committedCard(c);return`<div class="act-bar"><div class="act-slot">${card?`<div class="slot-card">${CardArt.back('mini')}</div><div><small>SUA CARTA VIRADA</small><b>${esc(card.name)}</b><em>${esc(card.type)}</em></div><button class="btn btn-ghost btn-sm" data-action="combat-uncommit">TROCAR</button>`:`<div class="slot-empty">?</div><div><small>PLANEJAMENTO</small><b>Escolha uma carta da mão ou a Pistola</b><em>Os inimigos já viraram as deles.</em></div>`}</div><button class="btn btn-primary" data-action="combat-confirm" ${UI.busy||c.hand.length>5?'disabled':''}>${card?'VIRAR TODAS · INICIATIVA →':'SEGUIR SEM CARTA →'}</button></div>`}
 if(c.phase==='player'){if(UI.mode){const label={target:'Escolha um inimigo destacado',shot:'Disparo: escolha um inimigo a até 2 casas',trap:'Escolha uma casa verde para armar'}[UI.mode];return`<div class="act-bar"><div class="act-slot"><div><small>REVELANDO</small><b>${label}</b></div></div><button class="btn btn-ghost" data-action="combat-cancel">CANCELAR</button></div>`}
  const card=committedCard(c),reaction=p.reaction?CARDS[p.reaction.id]:null;const canRev=CombatRules.canReveal(c);
  return`<div class="act-bar"><div class="act-slot"><div><small>SUA VEZ · ${p.moveLeft} PASSO${p.moveLeft===1?'':'S'}</small><b>${canRev?esc(card.name):reaction?`Reação armada: ${esc(reaction.name)}`:p.revealed?'Carta revelada':'Sem carta nesta rodada'}</b><em>${canRev?(card.type==='Armadilha'?'Ande, depois arme numa casa a até 2.':'Ande, depois revele.'):reaction?'Ela vira sozinha quando você for atacado.':'Ande ou encerre a vez.'}</em></div></div>
  ${canRev?`<button class="btn btn-primary" data-action="combat-reveal">REVELAR ${card.type==='Armadilha'?'E ARMAR':''}</button>${p.committed.kind==='card'&&card.type==='Ação'?'<button class="btn btn-ghost btn-sm" data-action="combat-asshot" title="Vira a carta de lado e dispara com a Pistola">USAR COMO DISPARO</button>':''}`:''}<button class="btn ${canRev?'btn-ghost':'btn-primary'}" data-action="combat-end">ENCERRAR VEZ →</button></div>`}
 return`<div class="act-bar"><div class="act-slot"><div><small>RESOLVENDO</small><b>${esc(UI.log[0]||'…')}</b></div></div></div>`}
function combat(){const c=S.combat;if(!c)return'';const p=c.player,sd=SECTOR_DATA[S.sector];
 const plan=c.phase==='plan',myTurn=c.phase==='player';
 const hand=c.hand.map((r,i)=>{const n=c.hand.length,t=i-(n-1)/2;return`<button class="hcard ${UI.sel===r.uid?'is-sel':''}" style="--r:${t*5}deg;--y:${Math.abs(t)*9}px;--i:${i}" data-action="combat-select" data-value="${r.uid}" aria-label="${esc(CARDS[r.id].name)}">${CardArt.card(CARDS[r.id])}</button>`}).join('');
 const instR=CombatRules.instrumentReady(c),inst=INSTRUMENTS[S.instrument],pas=CombatRules.passiveAvailable(c),pistolOk=CombatRules.pistolReady(c);
 const st=Object.keys(p.status).filter(k=>p.status[k]);
 return`<section class="stage combat ${myTurn?'my-turn':''} ${plan?'is-plan':''}"><div class="scene-bg" style="background-image:url('${SCENERY.hell}')"></div><div class="scene-vignette"></div>${topbar(enemyName(),'HELLS · PORTÃO ZERO · RODADA '+c.round)}
 <aside class="cb-left panel"><div class="sheet-mini"><div class="sm-portrait hell"><img src="${searcherAsset('hell')}" alt=""></div><div class="sm-name"><b>${esc(S.name)}</b><small>${esc(S.sector)} · ${esc(S.sinChoice)}</small></div></div>
  ${meter('hp','VIDA',p.hp,p.maxHp,'hp')}<div class="shield-row" data-meter="shield"><span>PROTEÇÃO</span><b>${p.shield}</b></div>${meter('sanity','SANIDADE',S.sanity,10,'sanity')}
  <div class="econ"><span class="${myTurn&&p.moveLeft?'on':''}">MOVIMENTO<b>${myTurn?p.moveLeft:p.moveBase}</b></span><span>${esc(sd.resource).toUpperCase()}<b>${p.res}</b></span><span>VEREDITO<b>${p.verdict}</b></span></div>
  ${st.length?`<div class="status-row">${st.map(s=>`<i title="${esc(STATUS_INFO[s]||s)}">${esc(STATUS_INFO[s]?.split(':')[0]||s)}</i>`).join('')}</div>`:''}
  <div class="equip"><button class="equip-card ${p.committed?.kind==='pistol'?'is-on':''}" data-action="combat-pistol" ${plan&&pistolOk&&!UI.busy?'':'disabled'} title="${esc(WEAPON.text)}">${CardArt.card(WEAPON,'mini')}</button><div class="equip-info"><b>PISTOLA</b><small>${plan?(pistolOk?'Clique para virar a Pistola como sua carta da rodada.':'Recarregando: volta na próxima rodada.'):'Alcance 2 · D6 1·3·5·6 · 1+2 de dano.'}</small><button class="btn btn-ghost btn-sm" data-action="combat-instrument" ${!instR||!myTurn||S.instrument==='espelho'?'disabled':''}>${inst.icon} ${esc(inst.name)} ${instR?'':'· RECARGA'}</button>${pas?`<button class="btn btn-ghost btn-sm" data-action="combat-passive">✧ ${esc(pas)}</button>`:''}</div></div>
  <div class="form-hand"><span class="eyebrow">FORMAÇÃO · ${c.fhand.length+(c.armed?1:0)}/4</span><div>${c.armed?`<button class="fchip is-armed" data-action="combat-arm" data-value="${c.armed.uid}">${esc(c.armed.skill)} +2</button>`:''}${c.fhand.map(f=>`<button class="fchip ${['Percepção','Resistência'].includes(f.skill)?'':'dim'}" data-action="combat-arm" data-value="${f.uid}">${esc(f.skill)}</button>`).join('')}</div><small class="muted">Percepção: +2 na iniciativa. Resistência: +2 contra as vozes.</small></div></aside>
 <main class="arena">${initiativeBar()}${arenaSVG()}${actionBar()}${focusPanel()}</main>
 <aside class="cb-right panel"><span class="eyebrow">INIMIGOS · CARTAS VIRADAS</span>${c.enemies.filter(e=>e.hp>0).map(e=>`<div class="foe ${e.boss?'boss':''}"><div class="foe-pic"><img src="${e.art}" alt=""></div><div class="foe-info"><b>${esc(e.name)}</b><small>${esc(e.title)}</small><div class="foe-bar"><i style="width:${e.hp/e.maxHp*100}%"></i><span>${e.hp}/${e.maxHp}${e.shield?' · ⛨'+e.shield:''}</span></div><p class="foe-intent">${e.committed?(e.known?`Carta: <b>${esc(CombatRules.ENEMY_CARDS[e.committed.key].name)}</b> — ${esc(CombatRules.ENEMY_CARDS[e.committed.key].text)}`:'Carta virada. Você não sabe o que vem.'):'Sem carta nesta rodada.'}</p>${Object.keys(e.status).filter(k=>e.status[k]).map(s=>`<i class="tag" title="${esc(STATUS_INFO[s]||s)}">${esc(STATUS_INFO[s]?.split(':')[0]||s)}</i>`).join('')}</div></div>`).join('')}
  <div class="cb-log"><span class="eyebrow">REGISTRO</span>${UI.log.map(l=>`<p>${esc(l)}</p>`).join('')}</div>
  <div class="piles"><span>COMPRA <b>${c.pile.length}</b></span><span>DESCARTE <b>${c.discard.length}</b></span><span>BANIDAS <b>${c.banned.length}</b></span>${c.lastResort?'<span class="lr">ÚLTIMO RECURSO <b>1</b></span>':''}</div></aside>
 <section class="hand-zone"><div class="hand">${hand}</div><div class="hand-meta">${c.hand.length}/5 AÇÕES${c.hand.length>5?' · DESCARTE ATÉ 5':''}</div></section></section>`}
function focusPanel(){const c=S.combat;if(!UI.sel||UI.mode)return'';const ref=c.hand.find(r=>r.uid===UI.sel);if(!ref)return'';const card=CARDS[ref.id],plan=c.phase==='plan',myTurn=c.phase==='player';
 const opts=card.kind==='choice'?`<div class="opt-row">${card.options.map((o,i)=>`<button class="opt ${UI.option===i?'is-on':''}" data-action="combat-option" data-value="${i}">${esc(o.label)}</button>`).join('')}</div>`:'';
 const gamble=S.sinChoice==='Apostador'&&!c.player.usedGamble&&plan&&card.type==='Ação'?`<div class="gamble"><small>JOGADA MARCADA · cante um número:</small>${[1,2,3,4,5,6].map(n=>`<button class="g ${UI.guess===n?'is-on':''}" data-action="combat-guess" data-value="${n}">${n}</button>`).join('')}</div>`:'';
 const chance=Math.round(card.dice.length/6*100);
 const how={'Ação':'Vira na sua vez, depois que você andar.','Reação':'Fica armada a rodada inteira e vira sozinha quando você for atacado.','Armadilha':'Na sua vez, arme numa casa a até 2. Dispara em quem pisar.'}[card.type];
 return`<div class="focus"><div class="focus-card">${CardArt.card(card,'big')}</div><div class="focus-body"><span class="eyebrow">${esc(card.type)} · ${esc(card.sector)} · ${card.id}</span><h3>${esc(card.name)}</h3><p>${esc(card.hells)}</p><p class="d6line">Funciona se o D6 cair em <b>${card.dice.join(' · ')}</b> (${chance}%). ${esc(how)}</p>${plan?opts:''}${gamble}
 <div class="focus-actions">${plan?`<button class="btn btn-primary" data-action="combat-commit" ${card.kind==='choice'&&UI.option==null?'disabled':''}>VIRAR ESTA CARTA</button>`:''}<button class="btn btn-ghost" data-action="combat-burn" ${myTurn&&!c.player.burned&&!UI.busy?'':'disabled'} title="Bane a carta até a próxima Cena e dá +3 de movimento (1×/turno).">QUEIMAR · +3 MOV</button><button class="btn btn-ghost" data-action="combat-discard" ${!UI.busy?'':'disabled'}>DESCARTAR</button></div></div><button class="focus-close" data-action="combat-select" data-value="${UI.sel}">✕</button></div>`}
function unitNode(uid){return document.querySelector(`[data-unit="${uid}"]`)}
function unitEl(uid){return document.querySelector(`[data-unit="${uid}"] image`)}
async function animateUnit(uid,path){const el=unitNode(uid);if(!el||path.length<2)return;for(let i=1;i<path.length;i++){const [ax,ay]=isoPos(path[i-1].x,path[i-1].y),[bx,by]=isoPos(path[i].x,path[i].y);const an=el.animate([{transform:`translate(${ax}px,${ay}px)`},{transform:`translate(${(ax+bx)/2}px,${(ay+by)/2-10}px)`,offset:.5},{transform:`translate(${bx}px,${by}px)`}],{duration:300,easing:'ease-in-out',fill:'forwards'});audio('step');await an.finished.catch(()=>{});el.style.transform=`translate(${bx}px,${by}px)`;an.cancel()}}
function setBar(uid,hp){const c=S.combat;const u=uid==='player'?c.player:c.enemies.find(e=>e.uid===uid);const el=unitNode(uid);if(!u||!el)return;const bar=el.querySelector('.u-bar'),t=el.querySelector('.u-bar-t');if(bar)bar.setAttribute('width',66*clamp(hp/u.maxHp,0,1));if(t)t.textContent=hp+'/'+u.maxHp}
async function flipOverHead(uid,card){const el=unitNode(uid);const hc=el?.querySelector('.head-card');if(!hc)return;hc.classList.add('flip');await sleep(350);hc.innerHTML=`<rect x="-44" y="-16" width="88" height="32" rx="4" class="revealed"/><text y="5" class="revealed-t">${esc(card)}</text>`;hc.classList.remove('flip');await sleep(500)}
/* Toca os eventos do motor: dados 3D, cartas virando, projéteis, números e deslize. */
async function playEvents(ev){UI.busy=true;document.body.classList.add('is-resolving');const c=S.combat;render();
 try{for(const e of ev){if(e.text)combatLog(e.text);
  switch(e.t){
   case'round':render();await sleep(300);break;
   case'initiative':render();await Dice3D.roll(e.rolls.slice(0,3).map(r=>({sides:20,value:r.n,color:r.id==='player'?undefined:'#4a3a46'})),{title:'Iniciativa · D20 + Percepção',result:e.rolls.map(r=>`${r.name.split(' ')[0]} ${r.total}`).join(' · '),detail:'Ordem: '+e.rolls.map(r=>r.name).join(' → ')+(e.detail?' · '+e.detail:''),tone:e.rolls[0].id==='player'?'good':'bad'});render();break;
   case'turn':render();await sleep(250);break;
   case'reveal':{const card=e.id==='PIS'?WEAPON:CARDS[e.id];await flipOverHead('player',card?.name||'');await showCard(card);break}
   case'enemyReveal':{const card=CombatRules.ENEMY_CARDS[e.key];await flipOverHead(e.who,card.name);await showCard(enemyCardData(e.key));break}
   case'd6':await Dice3D.roll([{sides:6,value:e.value,ok:e.ok,color:e.enemy?'#4a3a46':undefined}],{title:e.card+' · D6',result:e.ok?'ACERTOU':'FALHOU',detail:`Faces da carta: ${e.dice.join(' · ')}${e.guess?` · você cantou ${e.guess}`:''}`,tone:e.enemy?(e.ok?'bad':'good'):(e.ok?'good':'bad')});combatLog(`${e.card}: D6 ${e.value} ${e.ok?'✓':'✗'}`);break;
   case'd20':await Dice3D.roll([{sides:20,value:e.natural,ok:e.hit}],{title:e.label,result:e.hit?'SUCESSO':'FALHA',detail:e.detail,tone:e.hit?'good':'bad'});break;
   case'move':await animateUnit(e.who,e.path);break;
   case'push':render();await sleep(250);break;
   case'hit':if(e.amount>0||e.blocked){await BattleFX.cast(()=>unitEl(e.from==='env'?e.to:e.from),()=>unitEl(e.to),{kind:'attack',hit:true,amount:e.amount});setBar(e.to,e.hpAfter);if(e.to==='player')audio('bad')}break;
   case'miss':await BattleFX.cast(()=>unitEl(e.from),()=>unitEl(e.to),{kind:'attack',hit:false});break;
   case'self':setBar('player',e.hpAfter);BattleFX.damage(()=>unitEl('player'),e.amount);await sleep(500);break;
   case'heal':await BattleFX.cast(()=>unitEl('player'),()=>unitEl('player'),{kind:'heal',amount:e.amount});setBar('player',e.hpAfter);break;
   case'shield':await BattleFX.cast(()=>unitEl(e.who),()=>unitEl(e.who),{kind:'shield'});break;
   case'fizzle':await BattleFX.cast(()=>unitEl('player'),null,{kind:'fizzle'});break;
   case'area':{for(const [x,y] of e.cells)document.querySelector(`[data-cell="${x},${y}"]`)?.classList.add('blast');audio('attack');await sleep(800);break}
   case'trap':render();audio('paper');await sleep(400);break;
   case'trapHit':render();audio('attack');await sleep(300);break;
   case'sanity':changeSanity(e.amount);break;
   case'summon':render();await BattleFX.cast(()=>unitEl(e.who),()=>unitEl(e.who),{kind:'psych'});break;
   case'down':render();await sleep(300);break;
   default:await sleep(e.t==='log'?120:220);
  }}}
 finally{UI.busy=false;document.body.classList.remove('is-resolving')}
 c.sanity=S.sanity;persist();render();
 if(c.result)await finishCombat()}
/* Mostra a carta revelada no centro por um instante. */
async function showCard(card){if(!card)return;const el=document.createElement('div');el.className='card-reveal';el.innerHTML=CardArt.card(card,'big');$('#modal-root').append(el);audio('paper');await sleep(1300);el.classList.add('out');await sleep(260);el.remove()}
async function finishCombat(){const c=S.combat;if(c.result==='victory'){if(S.outcome!=='victory'){S.fame+=1+(S.clues.length>=2&&S.flags.ritualOk?1:0);if(S.flags.route==='collect'&&S.clues.includes('child'))changeTrust(1);changeSanity(-1)}S.outcome='victory';persist();await Cinematics.showTitle('CONTRATO SELADO');Cinematics.transitionScene(()=>{S.stage='victory-eye';persist();render()})}else{S.outcome='defeat';persist();await sleep(600);Cinematics.transitionScene(()=>{S.stage='ending';persist();render()})}}
async function combatAction(type,v){const c=S.combat;if(!c||UI.busy)return;let r;
 switch(type){
  case'combat-select':UI.sel=UI.sel===v?null:v;UI.mode=null;UI.option=null;render();return;
  case'combat-option':UI.option=Number(v);render();return;
  case'combat-guess':UI.guess=UI.guess===Number(v)?null:Number(v);render();return;
  case'combat-cancel':UI.mode=null;render();return;
  case'combat-commit':r=CombatRules.commit(c,UI.sel,UI.option);if(!r.error){UI.sel=null;UI.option=null;audio('paper');persist();render();return}break;
  case'combat-pistol':r=CombatRules.commit(c,c.player.committed?.kind==='pistol'?null:'pistol');if(!r.error){UI.sel=null;audio('paper');persist();render();return}break;
  case'combat-uncommit':r=CombatRules.commit(c,null);if(!r.error){persist();render();return}break;
  case'combat-confirm':r=CombatRules.confirm(c);break;
  case'combat-move':{const [x,y]=v.split(',').map(Number);const m=CombatRules.move(c,x,y);if(m){UI.sel=null;await playEvents(m)}return}
  case'combat-reveal':{const k=c.player.committed;const card=committedCard(c);if(card.type==='Armadilha'){UI.mode='trap';render();return}
   const opt=k.kind==='card'&&card.kind==='choice'?card.options[k.option??0]:null;
   if(k.kind==='pistol'||CombatRules.needsTarget(card,opt)){if(!currentTargets().length){flash(`Nenhum inimigo ao alcance (${k.kind==='pistol'?WEAPON.range:(card.id==='I09'?3:CombatRules.cardRange(card,opt))} casas, com linha de visão). Aproxime-se.`);return}UI.mode=k.kind==='pistol'?'shot':'target';render();return}
   r=CombatRules.reveal(c,{guess:UI.guess});break}
  case'combat-asshot':if(!CombatRules.validTargets(c,'pistol').length){flash(`A Pistola alcança ${WEAPON.range} casas. Aproxime-se.`);return}UI.mode='shot';render();return;
  case'combat-target':r=UI.mode==='shot'?CombatRules.reveal(c,{target:v,asShot:true,guess:UI.guess}):CombatRules.reveal(c,{target:v,guess:UI.guess});UI.mode=null;break;
  case'combat-trap':r=CombatRules.reveal(c,{cell:v});UI.mode=null;break;
  case'combat-burn':r=CombatRules.burn(c,UI.sel);break;
  case'combat-discard':r=CombatRules.discard(c,UI.sel);break;
  case'combat-arm':r=CombatRules.arm(c,v);if(!r.error){render();return}break;
  case'combat-instrument':r=CombatRules.useInstrument(c);break;
  case'combat-passive':r=CombatRules.usePassive(c,c.enemies.find(e=>e.hp>0&&e.committed)?.uid);break;
  case'combat-end':r=CombatRules.endTurn(c);break;
 }
 if(!r)return;if(r.error){flash(r.error);return}
 UI.sel=null;UI.guess=null;UI.option=null;await playEvents(r.ev);
 if(c.pending)await pendingPrompt()}
async function pendingPrompt(){const c=S.combat,pd=c.pending;if(!pd)return;const card=CARDS[pd.ref.id];const root=$('#modal-root');
 const choice=await new Promise(res=>{root.innerHTML=`<div class="modal-backdrop"><div class="modal"><span class="eyebrow">A CARTA FALHOU NO D6</span><h2>${esc(card.name)}</h2><p class="lead">Você pode insistir. Persistir no Hells cobra da mente.</p><div class="modal-actions col">${pd.resort?'<button class="btn btn-blood" data-t="resort">ÚLTIMO RECURSO · −1 SANIDADE · ROLAR DE NOVO</button>':''}${pd.mirror?'<button class="btn btn-ghost" data-t="mirror">◐ ESPELHO DE BOLSO · ROLAR DE NOVO</button>':''}<button class="btn btn-ghost" data-t="none">ACEITAR A FALHA</button></div></div></div>`;root.onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;root.innerHTML='';root.onclick=null;res(b.dataset.t)}});
 const r=CombatRules.resolvePending(c,choice);await playEvents(r.ev);if(c.pending)await pendingPrompt()}

/* ---------- render ---------- */
function render(){Cinematics.cancelTypewriter();document.documentElement.dataset.motion=S.animations!==false?'full':'auto';setSanityTier();
 const stages={intro,gender:creator,name:creator,quiz:creator,sin:creator,skills:creator,class:creator,vn,explore,evidence,veil,combat,ending,'victory-eye':victoryEye,community};
 $('#app').innerHTML=(stages[S.stage]||intro)();document.title='ORDER — O Pecado da Misericórdia';
 Cinematics.playCharacterBreathing();Ambience.update();if(S.stage==='vn')runTypewriter();if(S.stage==='intro'&&!S.introOpened||S.stage==='victory-eye')Cinematics.playEyeIntro();if(DEV_MODE&&typeof mountDevPanel==='function')mountDevPanel()}
function determineSector(sin){const scores={...S.scores};const low=(sin||'').toLocaleLowerCase('pt-BR');const tags=[[/viol[eê]ncia|agress|for[cç]a|prote[gç]/,'INCIDÊNCIA'],[/mentir|negoci|manipul|trapace/,'RELAÇÃO'],[/ajuda|abandono|ego[ií]sm/,'SOCIALISTA'],[/injust|culp|ju[ií]zo|omiss[aã]o/,'JUSTIÇA'],[/vingan[cç]|matar|assassin|ódio/,'DOUTRINA']];for(const [pattern,s] of tags)if(pattern.test(low)){scores[s]+=.25;break}return SECTORS.slice().sort((a,b)=>scores[b]-scores[a])[0]}
async function restart(){if(!await confirmModal('Reiniciar o prólogo?','Isto apaga o progresso salvo neste navegador.','APAGAR E REINICIAR','CANCELAR'))return;S=defaultState();persist();render()}
function resume(){if(S.stage==='intro'||!S.sector){patch({stage:'gender'});return}render()}
async function action(type,v){
 if(type.startsWith('combat-')){combatAction(type,v);return}
 if(UI.busy&&!['audio','settings'].includes(type))return;if(Cinematics.busy&&!['audio','settings'].includes(type))return;
 switch(type){
  case'open-eye':Cinematics.playEyeIntro(true);break;
  case'create':patch({stage:S.sector&&S.stage==='intro'?'class':'gender'});break;
  case'resume':S.introOpened=true;if(S.stage==='intro')S.stage=S.board?'explore':'gender';persist();render();break;
  case'reveal-community':if(S.outcome==='victory'){audio('eye');Cinematics.transitionScene(()=>{S.flags.communitySeen=true;patch({stage:'community'})})}break;
  case'view-ending':patch({stage:'ending'});break;
  case'postgame-eye':Cinematics.transitionScene(()=>patch({stage:'victory-eye'}));break;
  case'settings':$('#volume').value=S.volume;$('#text-speed').value=S.textSpeed;$('#dice-anim').checked=Dice3D.enabled;$('#motion-full').checked=S.animations!==false;$('#music-volume').value=S.musicVolume??.35;$('#settings-dialog').showModal();break;
  case'gender':patch({gender:v,stage:'name'});break;
  case'submit-name':{const name=$('#player-name')?.value.trim().replace(/\s+/g,' ');if(!name){flash('Informe um nome para seu Searcher.');return}patch({name:name.slice(0,24),stage:'quiz',quizIndex:0,scores:Object.fromEntries(SECTORS.map(x=>[x,0]))});break}
  case'answer':{const i=Number(v),q=QUESTIONS[S.quizIndex];if(!q?.o[i])return;S.scores[q.o[i][1]]++;S.quizIndex++;S.stage=S.quizIndex>=QUESTIONS.length?'sin':'quiz';persist();render();break}
  case'pick-sin':S.sin=$('#sin-entry')?.value||S.sin;patch({sinChoice:v});break;
  case'submit-sin':{const sin=$('#sin-entry')?.value.slice(0,300)||'';patch({sin,sector:determineSector(sin),stage:'skills',skills:[]});break}
  case'pick-skill':{const sk=[...S.skills];const i=sk.indexOf(v);if(i>=0)sk.splice(i,1);else if(sk.length<3)sk.push(v);else{flash('Escolha apenas 3. Desmarque uma antes.');return}patch({skills:sk});break}
  case'pick-inst':patch({instrument:v});break;
  case'submit-skills':if(S.skills.length===3)patch({stage:'class'});break;
  case'redo-sheet':patch({stage:'quiz',quizIndex:0,scores:Object.fromEntries(SECTORS.map(x=>[x,0]))});break;
  case'begin-story':S.moral=8;S.trust=6;S.sanity=10;initBoard();goNode('arrival');break;
  case'node':goNode(v);break;
  case'explore':Cinematics.transitionScene(()=>patch({stage:'explore'}));break;
  case'room':{if(!S.board)initBoard();const b=S.board;if(b.room===v){goNode(v);break}flash('Vá até '+(ChurchBoard.ROOMS[v]?.name||'a sala')+' pelo tabuleiro.');patch({stage:'explore'});break}
  case'find':giveClue(v);break;
  case'store-evidence':{const id=S.evidenceId,clue=CLUES[id];if(clue&&!S.clues.includes(id)){S.clues.push(id);if(clue.moral)changeMoral(clue.moral);S.flags.lastEvidence=id;for(const f of clue.flags||[])S.flags[f]=true;audio('good');if(S.board)boardLog('Prova registrada: '+clue.label+'.');flash('PROVA REGISTRADA · '+clue.label)}
   if(id==='child'&&!S.flags.childProtected){S.flags.childProtected=true;goNode('childProtect');break}
   const room=S.board?.room;if(room&&NODES[room])goNode(room);else patch({stage:'explore'});break}
  case'reread':S.evidenceId=v;patch({stage:'evidence'});break;
  case'talk':goNode('greeting');break;
  case'confront':goNode('confrontation');break;
  case'journal':openJournal();break;
  case'stance':chooseStance(v);break;
  case'decision':makeDecision(v);break;
  case'force-door':if(S.moral<1){flash('Você precisa de 1 Moral para forçar a porta.');break}{const r=await skillTest({skill:'Intimidação',dc:12,title:'Forçar a porta',reason:'Custa 1 Moral. A fechadura é velha; a madeira, não.'});if(r.cancelled)break;changeMoral(-1);if(!r.ok){advanceClock(1);flash('A porta resiste. Elvira ouviu o barulho.');changeTrust(-1);render();break}S.flags.forcedDoor=true;goNode('lockedRoom')}break;
  case'collect':Cinematics.transitionScene(()=>patch({stage:'veil'}));audio('breath');break;
  case'wake-hell':goNode('hell1');break;
  case'battle':startBattle();break;
  case'retry-boss':startBattle();break;
  case'board-roll':boardRoll();break;
  case'board-cell':boardMoveTo(v.split(',').map(Number));break;
  case'board-room':if(S.board.room===v&&!S.board.rolled){goNode(v)}else if(S.board.rolled)boardEnterRoom(v);break;
  case'board-investigate':goNode(S.board.room);break;
  case'board-stay':S.board.rolled=false;S.board.steps=0;endBoardTurn();break;
  case'board-secret':boardSecret();break;
  case'board-pasta':S.board.pasta=true;S.board.instrumentAt=S.board.turn+3;persist();render();flash('Pasta de Contratos: +2 no próximo teste de Investigação ou Discernimento.');break;
  case'audio':S.audio=!S.audio;persist();render();Ambience.update();if(S.audio)audio('good');break;
  case'restart':restart();break;
 }}
document.addEventListener('click',e=>{if(e.target.closest('.typewritten')){advanceDialogue();return}const b=e.target.closest('[data-action]');if(!b||b.disabled||b.closest('[inert]'))return;if(b.tagName==='INPUT'&&b.type==='checkbox'){action(b.dataset.action,b.checked);return}const a=b.dataset.action;if(a!=='audio'&&a!=='open-eye')audio('click');action(a,b.dataset.value||'')});
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||$('#modal-root').children.length)return;if(S.stage==='vn'&&(e.key===' '||e.key==='Enter')&&!['BUTTON','INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();advanceDialogue();return}if(e.key==='Enter'&&S.stage==='name'){e.preventDefault();action('submit-name','')}if(S.stage==='vn'&&/^[1-9]$/.test(e.key)){const box=$('.dialogue-choices');if(box&&!box.inert)box.children[Number(e.key)-1]?.click()}if(S.stage==='explore'&&(e.key==='r'||e.key==='R')&&!S.board.rolled)boardRoll();if(S.stage==='combat'&&e.key==='Escape'){UI.sel=null;UI.mode=null;render()}});
document.addEventListener('pointermove',e=>{const x=(e.clientX/innerWidth-.5)*9,y=(e.clientY/innerHeight-.5)*8;document.documentElement.style.setProperty('--eye-x',x+'px');document.documentElement.style.setProperty('--eye-y',y+'px')});
$('#settings-dialog').addEventListener('close',()=>{S.volume=Number($('#volume').value);S.textSpeed=Number($('#text-speed').value);Dice3D.setEnabled($('#dice-anim').checked);S.animations=$('#motion-full').checked;S.diceAnim=$('#dice-anim').checked;S.musicVolume=Number($('#music-volume').value);persist();Ambience.update();render()});
if(S.diceAnim===false)Dice3D.setEnabled(false);
/* prévias de desenvolvimento */
if(PREVIEW_SCENE){S.name=S.name||'Procurador';S.sector=S.sector||'JUSTIÇA';S.sinChoice=S.sinChoice||'Apostador';S.skills=S.skills.length?S.skills:['Investigação','Percepção','Resistência'];S.gender=S.gender||'homem';
 if(PREVIEW_SCENE==='intro'){S.stage='intro';S.introOpened=false}
 if(PREVIEW_SCENE==='dialogue'){S.stage='vn';S.node='hell4'}
 if(PREVIEW_SCENE==='explore'){initBoard();S.stage='explore'}
 if(PREVIEW_SCENE==='sheet'){S.stage='class'}
 if(PREVIEW_SCENE==='combat'){S.flags.route=new URLSearchParams(location.search).get('route')||'collect';S.stage='combat';S.combat=null;setTimeout(startBattle,50)}}
if(S.stage==='combat'&&!S.combat&&!PREVIEW_SCENE)S.stage='veil';
render();
