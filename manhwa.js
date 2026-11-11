/* ORDER — leitor de quadrinhos (HQ / manhwa / visual novel de terror).
   Livro aberto com virada de página 3D, leitura guiada quadro a quadro, texto rolando nos balões,
   cenas de impacto, olhos se apagando, filme antigo, chuva, trovões, música, D20 em 3D e álbuns de fotos. */
(()=>{
'use strict';
const SAVE='order_manhwa_v1',DISCORD='https://discord.gg/xVDAPBVTTz';
const $=q=>document.querySelector(q);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ST=MangaStory;
/* ---------------- estado ---------------- */
const fresh=()=>({v:1,screen:'cover',page:0,panel:0,furthest:0,step:0,albumSector:'JUSTIÇA',profile:{name:'',body:'',sector:'',sin:'',confession:'',skills:[]},decisions:{},rolls:{},audio:true,music:.4,motion:true,dice:true,contract:false});
let S=load(),busy=false,typing=null,toastT;
function load(){const s=fresh();try{const d=JSON.parse(localStorage.getItem(SAVE));if(d&&d.v===1)return Object.assign(s,d,{profile:{...s.profile,...d.profile}})}catch{}return s}
function save(){try{localStorage.setItem(SAVE,JSON.stringify(S))}catch{}}
function legacy(){try{const c=JSON.parse(localStorage.getItem('order_comic_v1'));if(c?.profile?.name&&c.profile.body)return{name:c.profile.name,body:c.profile.body,sector:c.profile.sector,sin:c.profile.sin,confession:c.profile.confession||'',skills:c.profile.skills||[]};for(const k of['order_prologue_v5','order_prologue_v4']){const o=JSON.parse(localStorage.getItem(k));if(o?.name&&['homem','mulher'].includes(o.gender))return{name:o.name,body:o.gender,sector:o.sector,sin:o.sinChoice||'',confession:o.sin||'',skills:[]}}}catch{}return null}
const ready=()=>!!(S.profile.name.trim().length>=2&&S.profile.body&&S.profile.sector&&S.profile.sin&&S.profile.skills.length===2);
const pages=()=>ST.pages(S);
const motion=()=>S.motion!==false;
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),3800)}
function portrait(hell){return ST.art[S.profile.body||'homem'][hell?'hell':'normal']}
/* ---------------- som: virada de página, coração, trovão, sussurro, chuva, música ---------------- */
const Sound=(()=>{let ac=null,rain=null,rainGain=null,music=null;
 const ctx=()=>{try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume()}catch{}return ac};
 function noise(sec,shape,filter,vol){const a=ctx();if(!a||!S.audio)return;const len=Math.floor(a.sampleRate*sec),b=a.createBuffer(1,len,a.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;last=(last+.04*w)/1.04;d[i]=shape(i/len,w,last)}const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type=filter[0];f.frequency.value=filter[1];const g=a.createGain();g.gain.value=vol;s.connect(f);f.connect(g);g.connect(a.destination);s.start();return s}
 const fx={
  flip(){noise(.55,(t,w)=>w*Math.sin(Math.PI*t)**2*(.6+.4*Math.sin(t*40)),['bandpass',2600],.18)},
  paper(){noise(.18,(t,w)=>w*(1-t),['highpass',3000],.08)},
  heart(){const a=ctx();if(!a||!S.audio)return;for(const [at,v] of [[0,.5],[.22,.35]]){const o=a.createOscillator(),g=a.createGain(),n=a.currentTime+at;o.frequency.setValueAtTime(70,n);o.frequency.exponentialRampToValueAtTime(38,n+.18);g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(v*S.music+.05,n+.02);g.gain.exponentialRampToValueAtTime(.0001,n+.25);o.connect(g);g.connect(a.destination);o.start(n);o.stop(n+.3)}},
  thunder(){noise(4,(t,w,l)=>l*4*Math.exp(-t*3.2)*(t<.03?t/.03:1),['lowpass',230],.9)},
  whisper(){noise(1.2,(t,w)=>w*Math.sin(Math.PI*t)*(.5+.5*Math.sin(t*90)),['bandpass',900],.12)},
  bell(){const a=ctx();if(!a||!S.audio)return;const n=a.currentTime;for(const [f,v] of [[220,.12],[440,.05],[587,.03]]){const o=a.createOscillator(),g=a.createGain();o.frequency.value=f;g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.0001,n+3);o.connect(g);g.connect(a.destination);o.start(n);o.stop(n+3)}},
  hit(){noise(.35,(t,w,l)=>(w*.4+l*3)*Math.exp(-t*9),['lowpass',900],.6)},
  type(){noise(.03,(t,w)=>w*(1-t),['highpass',4000],.025)}
 };
 function setRain(level){const a=S.audio?ctx():null;if(!a){if(rainGain)rainGain.gain.value=0;return}
  if(!rain){const len=a.sampleRate*6,b=a.createBuffer(2,len,a.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);let b0=0,b1=0,b2=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;b0=.99765*b0+w*.099;b1=.963*b1+w*.2965;b2=.57*b2+w*1.0526;d[i]=(b0+b1+b2+w*.18)*.05}for(let k=0;k<1500;k++){const at=Math.floor(Math.random()*len),amp=.04+Math.random()*.2,dec=.0015+Math.random()*.005,n=Math.floor(a.sampleRate*dec*6),f=1800+Math.random()*4000;let ph=0;for(let j=0;j<n&&at+j<len;j++){d[at+j]+=Math.sin(ph)*Math.exp(-j/(a.sampleRate*dec))*amp;ph+=6.283*f/a.sampleRate}}for(let i=0;i<2000;i++){d[i]*=i/2000;d[len-1-i]*=i/2000}}
   rain=a.createBufferSource();rain.buffer=b;rain.loop=true;const hp=a.createBiquadFilter();hp.type='highpass';hp.frequency.value=380;rainGain=a.createGain();rainGain.gain.value=0;rain.connect(hp);hp.connect(rainGain);rainGain.connect(a.destination);rain.start()}
  rainGain.gain.setTargetAtTime(level*.5,a.currentTime,.8)}
 function setMusic(){if(!S.audio||S.music<=0){if(music)music.pause();return}if(!music){music=new Audio('assets/background_music.mp4');music.loop=true;music.preload='auto';music.setAttribute('playsinline','');music.volume=0}music.volume=Math.min(1,S.music);if(music.paused){const p=music.play();p&&p.catch(()=>{})}}
 /* desbloqueio de áudio: o Safari/iOS só aceita toque completo (touchend/click), não pointerdown; toca um silêncio para liberar o contexto */
 function unlock(){const a=ctx();if(a&&!unlock.done){try{const s=a.createBufferSource();s.buffer=a.createBuffer(1,1,22050);s.connect(a.destination);s.start(0);unlock.done=true}catch{}}setMusic()}
 try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch{}
 for(const ev of['pointerdown','touchend','click','keydown'])document.addEventListener(ev,unlock,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){music&&music.pause()}else if(S.audio)setMusic()});
 return{...fx,setRain,setMusic,play:(t)=>fx[t]?.()};
})();
window.AudioEngine={play:t=>Sound.play(t==='roll'?'paper':t)};
/* ---------------- chuva / brasas (canvas) e filme antigo ---------------- */
const Weather=(()=>{let cv,cx,drops=[],level=0,target=0,hell=false,raf=0;
 function ensure(){if(cv)return;cv=document.createElement('canvas');cv.id='weather';document.body.append(cv);cx=cv.getContext('2d');const rs=()=>{cv.width=innerWidth;cv.height=innerHeight};addEventListener('resize',rs);rs()}
 function drop(any){const w=cv.width,h=cv.height;if(hell)return{x:Math.random()*w,y:any?Math.random()*h:h+10,v:.4+Math.random()*1.2,r:1+Math.random()*2.4,a:.3+Math.random()*.6,ph:Math.random()*6};const v=13+Math.random()*15;return{x:Math.random()*(w+200)-200,y:any?Math.random()*h:-30-Math.random()*120,v,len:1+Math.random(),a:.1+Math.random()*.25,lw:.7+Math.random()}}
 function frame(){raf=0;level+=(target-level)*.05;const w=cv.width,h=cv.height;cx.clearRect(0,0,w,h);if(level<.01&&target===0)return;
  const want=Math.floor((hell?90:420)*level*(w*h)/(1440*900));while(drops.length<want)drops.push(drop(true));drops.length=Math.min(drops.length,want);
  for(const d of drops){if(hell){d.y-=d.v;d.x+=Math.sin((d.ph+=.03))*.4;if(d.y<-10)Object.assign(d,drop(false));cx.fillStyle=`rgba(255,${80+Math.floor(d.r*30)},90,${d.a*level})`;cx.beginPath();cx.arc(d.x,d.y,d.r,0,7);cx.fill()}else{d.y+=d.v;d.x+=d.v*.2;if(d.y>h)Object.assign(d,drop(false));cx.strokeStyle=`rgba(215,215,235,${d.a*level})`;cx.lineWidth=d.lw;cx.beginPath();cx.moveTo(d.x,d.y);cx.lineTo(d.x-d.v*.2*d.len,d.y-d.v*d.len);cx.stroke()}}
  raf=requestAnimationFrame(frame)}
 function set(l,isHell){ensure();if(isHell!==hell){hell=isHell;drops=[]}target=motion()?l:0;if(!raf)raf=requestAnimationFrame(frame)}
 return{set};
})();
let thunderT=0;function thunderLoop(on){clearTimeout(thunderT);if(!on)return;thunderT=setTimeout(()=>{flash();Sound.thunder();thunderLoop(true)},25000+Math.random()*35000)}
function flash(color='#eef'){const el=$('#flash');if(!el||!motion())return;el.style.background=color;el.animate([{opacity:0},{opacity:.7,offset:.06},{opacity:0,offset:.16},{opacity:.4,offset:.24},{opacity:0}],{duration:900})}
async function blink(times=2){const lids=$('#eyelids');if(!lids)return;Sound.heart();if(!motion()){await sleep(150);return}lids.classList.add('on');for(let i=0;i<times;i++){await lids.animate([{'--lid':'0%'},{'--lid':'51%'}],{duration:i?260:420,easing:'cubic-bezier(.6,0,.4,1)',fill:'forwards'}).finished;await sleep(i===times-1?520:140);await lids.animate([{'--lid':'51%'},{'--lid':i===times-1?'0%':'12%'}],{duration:i===times-1?700:300,easing:'ease-out',fill:'forwards'}).finished}lids.classList.remove('on')}
function shake(el=$('#book'),ms=520){if(!el||!motion())return;el.animate([{transform:'translate(0,0)'},{transform:'translate(-9px,4px) rotate(-.4deg)'},{transform:'translate(8px,-5px) rotate(.3deg)'},{transform:'translate(-6px,-3px)'},{transform:'translate(4px,5px)'},{transform:'translate(0,0)'}],{duration:ms,composite:'add'})}
/* ---------------- tamanho do livro ---------------- */
function fit(){const single=innerWidth<980,a=.72,w=innerWidth-(single?24:60),h=innerHeight-(single?118:132);const ph=Math.max(300,Math.min(h,single?w/a:w/(2*a)));document.documentElement.style.setProperty('--ph',ph+'px');document.documentElement.classList.toggle('single',single);document.documentElement.classList.toggle('wide-margins',!single&&(innerWidth-2*ph*a)/2>=190)}
addEventListener('resize',fit);
/* ---------------- quadros ---------------- */
const actorName=w=>w==='player'?S.profile.name||'Searcher':ST.names[w]||w;
function actorHTML(a){let src,cls='';if(a.who==='player')src=portrait(a.pose==='hell');else if(a.who==='silhouette'){src=portrait(false)||ST.art.homem.normal;cls='silhouette'}else src=ST.art[a.who];
 return`<div class="actor side-${a.side} ${a.monster?'monster':''} ${a.crop==='face'?'face':''} ${cls}" style="--as:${a.scale||1}"><img src="${src}" alt="${esc(actorName(a.who))}" draggable="false"></div>`}
function dieHTML(kind){return kind==='d6'?`<div class="pdie d6"><i></i><i></i><i></i><i></i><i></i></div>`:`<div class="pdie d20"><svg viewBox="0 0 100 100"><polygon points="50,4 93,28 93,72 50,96 7,72 7,28" fill="#c81d5d" stroke="#ffd1e8" stroke-width="2"/><polygon points="50,20 78,66 22,66" fill="#e8467f" stroke="#ffd1e8" stroke-width="1.5"/><text x="50" y="58" text-anchor="middle" font-size="20" fill="#fff" font-family="Cinzel Decorative,Georgia" font-weight="700">20</text></svg></div>`}
function panelHTML(p,i,state){const bgUrl=ST.bg[p.bg];const live=state==='now';
 const t=v=>live?`data-type="${esc(v)}"`:'';const tx=v=>live?'':esc(v);
 let h=`<div class="pbg ${p.bg==='black'?'black':''} shot-${p.shot||'mid'} ${p.half?'half-'+p.half:''}" ${bgUrl?`style="background-image:url('${bgUrl}')"`:''}></div>`;
 if(p.tint)h+=`<div class="ptint ${p.tint}"></div>`;
 for(const a of p.actors||[])h+=actorHTML(a);
 if(p.doc)h+=`<div class="pdoc ${p.caption?.at==='top'?'low':''}"><b>${esc(p.doc.heading)}</b>${p.doc.lines.map(l=>`<p ${t(l)}>${tx(l)}</p>`).join('')}</div>`;
 if(p.big)h+=`<div class="pbig ${p.tint||''}" style="--n:${Math.max(6,p.big.length)}"><b>${esc(p.big)}</b>${p.sub?`<small ${t(p.sub)}>${tx(p.sub)}</small>`:''}</div>`;
 if(p.dice)h+=dieHTML(p.dice);
 if(p.caption)h+=`<div class="cap at-${p.caption.at||'top'}"><span ${t(p.caption.text)}>${tx(p.caption.text)}</span></div>`;
 for(const b of p.balloons||[]){const who=b.who==='letter'?'':b.who==='voice'?'A voz do contrato':actorName(b.who);h+=`<div class="bal at-${b.at} tail-${b.tail||'none'} k-${b.kind||'speech'}">${who?`<em>${esc(who)}</em>`:''}<span ${t(b.text)}>${tx(b.text)}</span></div>`}
 if(p.sfx)h+=`<div class="sfx at-${p.sfx.at} ${p.sfx.shake?'shaky':''} ${p.sfx.small?'small':''} ${p.sfx.color||''}" style="--n:${Math.max(4,p.sfx.text.length)}">${esc(p.sfx.text)}</div>`;
 const film=(p.fx==='film'||p.film)?'film':'';
 return`<div class="panel p${i+1} ${state} ${film} ${p.fx==='transform'?'transform':''}" data-panel="${i}">${state==='future'?'<div class="pfuture"><span>?</span></div>':h}</div>`}
function pageHTML(page,idx,panelNow,mode){const n=page.panels.length;const total=pages().length;
 const states=page.panels.map((_,i)=>mode==='static'?'seen':i<panelNow?'seen':i===panelNow?'now':'future');
 return`<article class="mpage lay-${page.layout} ${page.hell?'hell':''} ${page.part==='intro'?'intro':''}"><header class="phead" style="--n:${Math.max(14,page.title.length)}"><span>${esc(page.chapter)}</span><b>${esc(page.title)}</b></header><div class="pgrid">${page.panels.map((p,i)=>panelHTML(p,i,states[i])).join('')}</div><footer class="pfoot"><span>ORDER · O PECADO DA MISERICÓRDIA</span><b>${idx+1}</b></footer></article>`}
/* Página dupla: cada lado do livro mostra um quadro. Em tela estreita, só o quadro atual. */
function spreadHalf(page,idx,which,panelNow,mode){const state=mode==='static'?'seen':which<panelNow?'seen':which===panelNow?'now':'future';return`<article class="mpage lay-splash spread-${which?'r':'l'} ${page.hell?'hell':''}"><header class="phead" style="--n:${Math.max(14,page.title.length*(which?1:.6))}">${which?`<b>${esc(page.title)}</b>`:`<span>${esc(page.chapter)}</span>`}</header><div class="pgrid">${panelHTML(page.panels[which],0,state)}</div><footer class="pfoot"><span>ORDER · O PECADO DA MISERICÓRDIA</span><b>${idx+1}</b></footer></article>`}
const isSingle=()=>document.documentElement.classList.contains('single');
function rightHTML(i,panel,mode){const P=pages(),page=P[i];if(page.spread)return spreadHalf(page,i,isSingle()?panel:1,panel,mode);return pageHTML(page,i,panel,mode)}
function leftHTML(i,panel,mode){const P=pages(),page=P[i];if(page?.spread)return spreadHalf(page,i,0,panel,mode);return i>0?pageHTML(P[i-1],i-1,0,'static'):blankPage('endpaper')}
function blankPage(kind){if(kind==='endpaper')return`<article class="mpage endpaper"><div class="endpaper-art"><img src="${ST.art.logo}" alt="ORDER"><p>Você morreu.<br>O julgamento não acabou.<br>Agora é você quem cobra.</p><small>RPG DE MESA · DECKBUILDER · TERROR PSICOLÓGICO</small></div></article>`;return`<article class="mpage endpaper"></article>`}
/* ---------------- contracapa ---------------- */
function backCoverArt(){return`<div class="cb-cover back-cover-face"><div class="bc-glow"></div><img class="bc-logo" src="${ST.art.logo}" alt="ORDER"><div class="cb-eye bc-eye"><svg viewBox="0 0 240 125"><path d="M12 62Q120-34 228 62Q120 158 12 62Z" fill="#180d1b" stroke="#ff76c7" stroke-width="3"/><circle cx="120" cy="62" r="36" fill="#c81d5d"/><ellipse class="cb-pupil" cx="120" cy="62" rx="9" ry="28" fill="#09060d"/></svg></div><span class="bc-kicker">FIM DO PRÓLOGO</span><h2>A próxima página<br>é escrita na mesa.</h2><p>Entre no Discord do ORDER, crie sua ficha de campanha e encontre um Mestre. Seu Searcher continua de onde você parou.</p><a class="btn primary bc-discord" href="${DISCORD}" target="_blank" rel="noopener noreferrer">Continuar no Discord ↗</a><small class="bc-code">RPG DE MESA · DECKBUILDER · TERROR PSICOLÓGICO</small></div>`}
function endScreen(){const page=pages().find(p=>p.ending),e=page?.ending;return`<main class="cover-desk end-desk"><div class="desk-light"></div><div class="closed-book back-book">${backCoverArt()}<div class="cb-pages"></div></div><aside class="cover-copy"><span class="eyebrow">${esc(e?.name||'')} · O PRIMEIRO GOLPE AINDA NÃO FOI DADO</span><h2>O que você julgou<br><em>agora olha de volta.</em></h2><p>${esc(e?.last||'')}</p>${(()=>{const c=ST.clues(S),f=c.filter(x=>x.found).length;return`<p class="end-clues"><b>Pistas: ${f} de 3.</b> ${f===3?'Você julgou sabendo de tudo.':'Você assinou sem saber de tudo. Releia o livro e tente outra vez.'}</p>`})()}<div class="cover-actions"><a class="btn primary" href="${DISCORD}" target="_blank" rel="noopener noreferrer">Continuar no Discord ↗</a><button class="btn ghost" data-a="sheet">Minha ficha</button><button class="btn ghost" data-a="download">Guardar meu Searcher ↓</button></div><div class="cover-actions"><button class="btn ghost" data-a="reopen">← Reabrir o livro</button><button class="btn ghost" data-a="album">Álbum de cenas</button><button class="btn ghost" data-a="restart">Ler outra sentença</button></div></aside></main>`}
async function closeBook(){if(busy)return;busy=true;document.querySelector('.sheet')?.remove();const bookEl=$('#book');Sound.flip();
 if(motion()&&bookEl&&!isSingle()){const leaf=document.createElement('div');leaf.className='flip-leaf closing';leaf.innerHTML=`<div class="face front">${$('#leaf-left').innerHTML}</div><div class="face back">${backCoverArt()}</div>`;bookEl.append(leaf);$('#leaf-left').innerHTML=`<article class="mpage endpaper"></article>`;
  await leaf.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],{duration:1100,easing:'cubic-bezier(.45,.05,.25,1)',fill:'forwards'}).finished.catch(()=>{});
  Sound.hit();await bookEl.animate([{transform:'translateX(0) scale(1)'},{transform:'translateX(calc(var(--pw)*-.5)) scale(.92)',opacity:.4}],{duration:600,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{})}
 S.screen='end';save();busy=false;render()}
/* ---------------- anotações nas margens ---------------- */
function notesHTML(){const page=pages()[S.page];if(!page)return'';const intro=page.part==='intro',p=S.profile;
 const left=intro?`<div class="mnote paper" style="--r:-3deg"><i class="tape"></i><b>GLOSSÁRIO</b><dl><dt>Searcher</dt><dd>Humano morto que cobra contratos para o Inferno.</dd><dt>Cómum</dt><dd>O mundo dos vivos. Investigação e provas.</dd><dt>Hells</dt><dd>Onde a sentença ganha corpo. Luta.</dd><dt>Hell of Fame</dt><dd>Sua fama. Abre portas e atrai rivais.</dd></dl></div>`
  :`<div class="mnote paper" style="--r:-3deg"><i class="tape"></i><b>CONTRATO 001</b><p><em>Alvo:</em> Elvira Martins, 70 anos.</p><p><em>Ordem:</em> cobrar a alma.</p><p><em>Antes:</em> ouvir e julgar.</p><p class="sig">${esc(p.name||'—')}<small>${esc(p.sector||'')}${p.sin?' · '+esc(p.sin):''}</small></p></div>`;
 const c=ST.clues(S);
 const right=(!intro?`<div class="mnote paper yellow" style="--r:2.5deg"><i class="tape"></i><b>PISTAS · ${c.filter(x=>x.found).length}/3</b><ul>${c.map(x=>`<li class="${x.found?'ok':x.rolled?'lost':''}">${x.found?'✓':x.rolled?'✗':'·'} ${esc(x.found?x.text:x.rolled?x.label+' — perdida':x.label+'?')}</li>`).join('')}</ul></div>`:'')+`<div class="mnote dark" style="--r:-1.5deg"><b>COMO LER</b><p>Clique na página ou → para avançar.</p><p>← volta um quadro.</p><p>▣ Álbum de cenas: reler qualquer página.</p></div>`;
 return`<aside class="mnotes left">${left}</aside><aside class="mnotes right">${right}</aside>`}
/* ---------------- telas ---------------- */
function hud(){const p=pages()[S.page];return`<header class="hud"><button class="hud-logo" data-a="home" aria-label="Capa"><img src="${ST.art.logo}" alt="ORDER"></button><div class="hud-title">${S.screen==='book'&&p?`<span>${esc(p.chapter)}</span><b>${esc(p.title)}</b>`:S.screen==='create'?'<span>ARQUIVO DOS SEARCHERS</span><b>Álbum de identidade</b>':''}</div><nav>${S.screen==='book'?'<button data-a="album">▣ Álbum de cenas</button>':''}${ready()?'<button data-a="sheet">✦ Minha ficha</button>':''}<button data-a="dice-demo">◇ D20</button><button data-a="audio" aria-pressed="${S.audio}">${S.audio?'♪ Som':'♪ Mudo'}</button><button data-a="settings" aria-label="Configurações">⚙</button></nav></header>`}
function cover(){const lg=legacy();const started=S.furthest>0||S.contract;return`<main class="cover-desk"><div class="desk-light"></div><div class="closed-book" data-a="${started?'resume':'open-book'}" role="button" tabindex="0" aria-label="Abrir o livro"><div class="cb-cover"><img class="cb-elvira" src="${ST.art.demon}" alt=""><div class="cb-shade"></div><img class="cb-logo" src="${ST.art.logo}" alt="ORDER"><h1>O Pecado<br>da Misericórdia</h1><p>CONTRATO 001</p><div class="cb-eye"><svg viewBox="0 0 240 125"><path d="M12 62Q120-34 228 62Q120 158 12 62Z" fill="#180d1b" stroke="#ff76c7" stroke-width="3"/><circle cx="120" cy="62" r="36" fill="#c81d5d"/><ellipse class="cb-pupil" cx="120" cy="62" rx="9" ry="28" fill="#09060d"/></svg></div></div><div class="cb-pages"></div><div class="cb-spine"></div></div><aside class="cover-copy"><span class="eyebrow">UMA HISTÓRIA EM QUADRINHOS INTERATIVA · TERROR</span><h2>Ela abriu a porta para quem precisava.<br><em>Você veio cobrar a alma dela.</em></h2><p>Leia, decida e role os dados. Antes de tudo, o livro explica o que é <b>ORDER</b>, o RPG em que você é um morto a serviço do Inferno.</p><div class="cover-actions"><button class="btn primary" data-a="${started?'resume':'open-book'}">${started?'Continuar a leitura':'Abrir o livro'} →</button>${started?'<button class="btn ghost" data-a="restart">Recomeçar</button>':''}${!ready()&&lg?'<button class="btn ghost" data-a="legacy">Usar meu Searcher anterior</button>':''}</div><small>Use fones. Clique ou → para avançar · ← para voltar.</small></aside></main>`}
function book(){const P=pages(),i=S.page,page=P[i];const left=leftHTML(i,S.panel,'live');
 return`<main class="reader"><div class="book-wrap"><div id="book" class="book"><div class="leaf left" id="leaf-left">${left}</div><div class="leaf right" id="leaf-right" data-a="advance">${rightHTML(i,S.panel,'live')}</div><div class="spine-shadow"></div></div><div class="notes-wrap">${notesHTML()}</div>${overlayHTML()}</div><div class="reader-bar"><button class="nav-btn" data-a="back" aria-label="Voltar">←</button><div class="progress"><i style="width:${(i+1)/P.length*100}%"></i></div><span class="pcount">PÁGINA ${i+1} / ${P.length} · QUADRO ${S.panel+1}/${page.panels.length}</span><button class="nav-btn primary" data-a="advance" aria-label="Avançar">→</button></div></main>`}
function needs(){const page=pages()[S.page];const last=S.panel>=page.panels.length-1;if(!last)return null;if(page.roll&&!S.rolls[page.roll.id])return'roll';if(page.decision&&!S.decisions[page.decision.id])return'decision';if(page.ending)return'ending';if(page.end==='create'&&!ready())return'create';return null}
function overlayHTML(){const page=pages()[S.page],n=needs();if(!n||typing)return'';
 if(n==='roll'){const r=page.roll;const bonus=S.profile.skills.includes(r.skill)?2:0;return`<section class="sheet roll-sheet"><div class="sheet-note"><span>TESTE DE ${esc(r.skill.toUpperCase())} · DT ${r.dc}</span><b>${esc(r.title)}</b><p>${esc(r.text)} ${bonus?`Sua perícia soma <b>+2</b>.`:'Você não tem essa perícia: sem bônus.'}</p></div><button class="btn primary big" data-a="roll">◇ Rolar o D20</button></section>`}
 if(n==='decision'){const d=page.decision;return`<section class="sheet choice-sheet"><span class="sheet-q">${esc(d.prompt)}</span><div class="choices">${d.choices.map((c,k)=>`<button class="choice-card" data-a="choose" data-v="${c.value}" style="--r:${(k-(d.choices.length-1)/2)*2}deg"><b>${esc(c.text)}</b>${c.detail?`<small>${esc(c.detail)}</small>`:''}</button>`).join('')}</div></section>`}
 if(n==='create')return`<section class="sheet create-sheet"><span class="sheet-q">Agora, você.</span><p>Abra o álbum dos Searchers e monte sua identidade: rosto, Setor, pecado e perícias.</p><button class="btn primary big" data-a="go-create">Abrir o álbum de identidade →</button></section>`;
 if(n==='ending')return`<section class="sheet finale-teaser"><button class="btn primary big" data-a="close-book">Fechar o livro →</button></section>`;
 if(n==='ending'){const e=page.ending;return`<section class="sheet finale"><div class="finale-text"><span class="eyebrow">${esc(e.name)} · O PRIMEIRO GOLPE AINDA NÃO FOI DADO</span><h2>O que você julgou agora olha de volta.</h2><blockquote>${esc(e.last)}</blockquote><div class="finale-tools"><button class="btn ghost" data-a="sheet">Minha ficha</button><button class="btn ghost" data-a="download">Guardar meu Searcher ↓</button><button class="btn ghost" data-a="album">Álbum de cenas</button></div></div><div class="finale-invite"><b>Fim do prólogo. Início do seu contrato.</b><p>A próxima página é escrita na mesa. Entre no Discord do ORDER, crie sua ficha e encontre um Mestre.</p><a class="btn primary" href="${DISCORD}" target="_blank" rel="noopener noreferrer">Continuar no Discord ↗</a></div></section>`}
 return''}
/* ---------------- álbum de criação ---------------- */
function polaroid(img,caption,{note='',tint='',cls='',a='',v='',rot=0,locked=false,style=''}={}){return`<button class="polaroid ${cls} ${locked?'locked':''}" ${a?`data-a="${a}"`:''} ${v?`data-v="${esc(v)}"`:''} style="--rot:${rot}deg;${tint?`--tint:${tint};`:''}${style}" ${locked?'disabled':''}><i class="tape"></i><span class="photo">${locked?'<em>?</em>':`<img src="${img}" alt="" loading="lazy">`}${tint?'<span class="duotone"></span>':''}</span><b>${esc(caption)}</b>${note?`<small>${esc(note)}</small>`:''}</button>`}
function create(){const p=S.profile,step=S.step,steps=['Rosto','Setor','Identidade','Contrato'];
 const tabs=`<ol class="album-steps">${steps.map((n,i)=>`<li class="${i===step?'now':i<step?'done':''}">${String(i+1).padStart(2,'0')} · ${n}</li>`).join('')}</ol>`;
 let L='',R='';
 if(step===0){L=`<h2 class="hand">Primeiro, o seu rosto.</h2><p class="album-p">Escolha a foto que vai para o seu arquivo. É esse rosto que Elvira vai ver abrir a porta.</p><p class="album-p small">Você poderá trocar depois.</p>`;R=`<div class="pol-row">${[['homem','Searcher I'],['mulher','Searcher II']].map(([k,c],i)=>polaroid(ST.art[k].normal,c,{a:'body',v:k,rot:i?4:-5,cls:'tall '+(p.body===k?'chosen':'')})).join('')}</div>`}
 if(step===1){const s=S.albumSector,d=ST.sectors[s];L=`<h2 class="hand">O seu Setor.</h2><p class="album-p">O Setor é sua classe profissional no Inferno: define seu estilo de luta e suas cartas.</p><div class="pol-grid">${Object.entries(ST.sectors).map(([k,x],i)=>polaroid(portrait(false),k,{a:'album-sector',v:k,tint:x.color,rot:[-4,3,-2,5,-3][i],cls:'small '+(k===s?'chosen':'')})).join('')}</div>`;R=`<div class="sector-page" style="--tint:${d.color}">${polaroid(portrait(false),s,{tint:d.color,rot:2,cls:'big'})}<div class="sector-text"><span class="eyebrow">${esc(d.role)}</span><h3>${esc(d.line)}</h3><p>${esc(d.text)}</p><blockquote>${esc(d.quote)}</blockquote><button class="btn primary" data-a="choose-sector">Este é o meu Setor →</button></div></div>`}
 if(step===2){L=`<div class="id-photo">${polaroid(portrait(false),p.name||'Sem nome',{tint:ST.sectors[p.sector]?.color,rot:-3,cls:'big'})}<span class="stamp">${esc(p.sector)}</span></div><button class="link" data-a="step" data-v="1">← trocar Setor</button>`;R=`<form id="idform" class="dossier"><span class="eyebrow">FICHA DE SEARCHER · ARQUIVO CENTRAL</span><label>Nome<input name="name" maxlength="32" value="${esc(p.name)}" placeholder="Como você era chamado em vida?" autocomplete="off"></label><fieldset><legend>Pecado: o que você era em vida</legend><div class="chips">${Object.entries(ST.sins).map(([k,t])=>`<button type="button" class="chip ${p.sin===k?'on':''}" data-a="sin" data-v="${esc(k)}" title="${esc(t)}">${esc(k)}</button>`).join('')}</div>${p.sin?`<small class="hint">${esc(ST.sins[p.sin])}</small>`:''}</fieldset><fieldset><legend>Duas perícias (+2 no D20)</legend><div class="chips">${ST.skills.map(k=>`<button type="button" class="chip ${p.skills.includes(k)?'on':''}" data-a="skill" data-v="${k}">${k}</button>`).join('')}</div></fieldset><label>O que ainda pesa? <small>(opcional)</small><textarea name="confession" maxlength="300" placeholder="Uma frase sobre o seu passado.">${esc(p.confession)}</textarea></label><button class="btn primary" data-a="identity-done" type="button">Assinar a ficha →</button></form>`}
 if(step===3){L=`<div class="contract-doc"><span class="eyebrow">ORDEM DE COBRANÇA · 001</span><h2>Sua ordem é cobrar uma alma.</h2><p>O nome no contrato é <b>Elvira Martins</b>, 70 anos. Ela acolhe pessoas numa igreja. Também protegeu um homem que matou alguém.</p><ol><li><b>Ouça</b> Elvira e Lia.</li><li><b>Investigue</b> os documentos. Role o D20 quando a história pedir.</li><li><b>Julgue:</b> cobrar, poupar ou adiar.</li></ol><p class="sign">${esc(p.name)}<small>SEARCHER · ${esc(p.sector)} · ${esc(p.sin)}</small></p></div>`;R=`<div class="pol-row">${polaroid(ST.art.elvira,'Elvira Martins',{note:'Aguarda sua sentença',rot:4,cls:'tall'})}</div><button class="btn primary big" data-a="start-story">Entrar na história →</button>`}
 return`<main class="album-screen">${tabs}<div class="album"><div class="album-page left">${L}</div><div class="album-ring"><i></i><i></i><i></i><i></i></div><div class="album-page right">${R}</div></div>${step>0?'<button class="link back-step" data-a="step" data-v="'+(step-1)+'">← voltar</button>':''}</main>`}
/* ---------------- álbum de cenas ---------------- */
function sceneAlbum(){const P=pages();return`<div class="scene-album"><div class="sa-head"><span class="eyebrow">ÁLBUM DE CENAS</span><h2 class="hand">Onde você quer voltar?</h2><button class="x" data-a="close">×</button></div><div class="sa-grid">${P.map((p,i)=>{const f=p.panels.find(x=>ST.bg[x.bg])||p.panels[0];const img=ST.bg[f.bg]||ST.bg.church;return polaroid(img,p.title,{note:`${String(i+1).padStart(2,'0')} · ${p.chapter}`,a:'goto',v:String(i),rot:((i*37)%9)-4,locked:i>S.furthest||(p.part!=='intro'&&!S.contract),cls:i===S.page?'chosen':''})}).join('')}</div></div>`}
/* ---------------- modais ---------------- */
function modal(html,cls=''){const m=$('#modal');m.className='modal-wrap on '+cls;m.innerHTML=`<div class="modal-card">${html}</div>`}
function closeModal(){const m=$('#modal');m.className='modal-wrap';m.innerHTML=''}
function sheetModal(){const p=S.profile,d=ST.sectors[p.sector]||{};modal(`<div class="sheet-card"><div>${polaroid(portrait(false),p.name,{tint:d.color,rot:-3,cls:'big'})}</div><div><span class="eyebrow">ARQUIVO CENTRAL · SEARCHER</span><h2>${esc(p.name)}</h2><dl><dt>Setor</dt><dd>${esc(p.sector)} · ${esc(d.role||'')}</dd><dt>Pecado</dt><dd>${esc(p.sin)} · ${esc(ST.sins[p.sin]||'')}</dd><dt>Perícias</dt><dd>${p.skills.map(esc).join(' · ')}</dd><dt>Pistas</dt><dd>${ST.clues(S).map(c=>(c.found?'✓ ':c.rolled?'✗ ':'· ')+esc(c.found?c.label:c.rolled?'perdida':'ainda não investigada')).join('<br>')}</dd><dt>Sentença</dt><dd>${({collect:'Cobrar',mercy:'Poupar',defer:'Adiar'})[S.decisions.judgment]||'Ainda não assinada'}</dd></dl>${p.confession?`<p class="quote">“${esc(p.confession)}”</p>`:''}<div class="row"><button class="btn primary" data-a="download">Baixar ficha ↓</button><button class="btn ghost" data-a="close">Voltar</button></div></div></div>`)}
function settingsModal(){modal(`<h2>Configurações</h2><label class="set">Música<input type="range" min="0" max="1" step=".05" value="${S.music}" data-set="music"></label><label class="chk"><input type="checkbox" ${S.motion?'checked':''} data-set="motion"> Animações, chuva e efeitos</label><label class="chk"><input type="checkbox" ${S.dice?'checked':''} data-set="dice"> Dados em 3D</label><label class="chk"><input type="checkbox" ${S.audio?'checked':''} data-set="audio"> Som (chuva, trovões, efeitos e música)</label><div class="row"><button class="btn primary" data-a="close">Voltar à leitura</button></div>`)}
/* ---------------- render ---------------- */
function render(){fit();document.documentElement.classList.toggle('no-motion',!motion());window.Dice3D?.setEnabled?.(S.dice);
 $('#app').innerHTML=hud()+(S.screen==='book'?book():S.screen==='create'?create():S.screen==='end'?endScreen():cover());
 const page=S.screen==='book'?pages()[S.page]:null;
 const rainLevel=S.screen==='end'?.45:S.screen==='cover'?.35:S.screen==='create'?.2:page?(page.hell?0:page.rain??.3):0;
 Weather.set(page?.hell?.8:rainLevel,!!page?.hell);Sound.setRain(page?.hell?0:rainLevel);thunderLoop(rainLevel>.4);
 document.body.classList.toggle('film',!!(page&&(page.film||page.panels[S.panel]?.fx==='film'||page.panels[S.panel]?.film)));
 document.body.classList.toggle('hells',!!page?.hell);
 if(S.screen==='book')startTyping()}
function renderRight(){const P=pages(),page=P[S.page];const nw=document.querySelector('.notes-wrap');if(nw)nw.innerHTML=notesHTML();$('#leaf-right').innerHTML=rightHTML(S.page,S.panel,'live');if(page.spread)$('#leaf-left').innerHTML=leftHTML(S.page,S.panel,'live');const ov=document.querySelector('.sheet');ov?.remove();document.querySelector('.book-wrap').insertAdjacentHTML('beforeend',overlayHTML());const bar=$('.pcount');if(bar)bar.textContent=`PÁGINA ${S.page+1} / ${P.length} · QUADRO ${S.panel+1}/${page.panels.length}`;document.body.classList.toggle('film',!!(page.film||page.panels[S.panel]?.fx==='film'||page.panels[S.panel]?.film));startTyping()}
/* texto rolando: legenda, depois balões, depois documento */
function startTyping(){const els=[...document.querySelectorAll('#book .leaf .panel.now [data-type]')];if(!els.length){typing=null;return}
 let cancel=false;const done=()=>{for(const el of els){el.textContent=el.dataset.type;el.classList.remove('typing')}typing=null;const ov=document.querySelector('.sheet');if(!ov){const html=overlayHTML();if(html)document.querySelector('.book-wrap')?.insertAdjacentHTML('beforeend',html)}};
 typing={finish(){cancel=true;done()}};document.querySelector('.sheet')?.remove();
 (async()=>{for(const el of els){const text=el.dataset.type;el.textContent='';el.classList.add('typing');const box=el.closest('.bal,.cap,.pdoc,.pbig');box?.classList.add('pop');for(let k=0;k<text.length;k++){if(cancel)return;el.textContent+=text[k];if(k%3===0)Sound.type();const c=text[k];await sleep(!motion()?0:c===','?110:/[.!?…]/.test(c)?240:22)}el.classList.remove('typing');await sleep(motion()?160:0)}if(!cancel){typing=null;const html=overlayHTML();if(html&&!document.querySelector('.sheet'))document.querySelector('.book-wrap')?.insertAdjacentHTML('beforeend',html)}})()}
/* efeitos ao entrar num quadro */
async function panelFx(p){if(!p)return;if(p.fx==='blink')await blink(2);if(p.fx==='flash'){flash();Sound.thunder()}if(p.fx==='impact'){Sound.hit();Sound.heart();setTimeout(()=>{shake();flash('#a0102c')},80)}
 if(p.fx==='transform'){await blink(1);flash('#ff2f4e');Sound.hit();Sound.whisper();shake($('#book'),900)}if(p.sfx?.shake&&p.fx!=='impact')Sound.hit();if(p.sfx&&!p.sfx.shake)Sound.paper()}
/* ---------------- virar a página ---------------- */
async function flipTo(next){const P=pages();if(next<0||next>=P.length||busy)return;busy=true;const dir=next>S.page?1:-1;const bookEl=$('#book');
 const fromRight=$('#leaf-right').innerHTML,fromLeft=$('#leaf-left').innerHTML;Sound.flip();
 if(!motion()||!bookEl){S.page=next;S.panel=dir>0?0:P[next].panels.length-1;S.furthest=Math.max(S.furthest,S.page);save();busy=false;render();await panelFx(P[S.page].panels[S.panel]);return}
 S.page=next;S.panel=dir>0?0:P[next].panels.length-1;S.furthest=Math.max(S.furthest,S.page);save();
 const single=document.documentElement.classList.contains('single');
 // monta a folha que gira
 const leaf=document.createElement('div');leaf.className='flip-leaf '+(dir>0?'fwd':'back');
 S.showFinale=false;const prevStatic=leftHTML(S.page,S.panel,'static');
 if(dir>0){leaf.innerHTML=`<div class="face front">${fromRight}</div><div class="face back">${prevStatic}</div>`;$('#leaf-right').innerHTML=rightHTML(S.page,S.panel,'live');$('#leaf-right').classList.add('dim')}
 else{leaf.innerHTML=`<div class="face front">${rightHTML(S.page,S.panel,'static')}</div><div class="face back">${fromLeft}</div>`;$('#leaf-left').innerHTML=prevStatic}
 document.querySelector('.sheet')?.remove();bookEl.append(leaf);
 const frames=dir>0?[{transform:'rotateY(0deg)'},{transform:`rotateY(${single?-110:-180}deg)`}]:[{transform:'rotateY(-180deg)'},{transform:'rotateY(0deg)'}];
 const shade=leaf.animate([{'--shade':0},{'--shade':.55,offset:.5},{'--shade':0}],{duration:900});
 await leaf.animate(frames,{duration:900,easing:'cubic-bezier(.45,.05,.25,1)',fill:'forwards'}).finished.catch(()=>{});
 leaf.remove();busy=false;render();await panelFx(P[S.page].panels[S.panel])}
/* ---------------- avançar / voltar ---------------- */
function swapSheet(){document.querySelector('.sheet')?.remove();const h=overlayHTML();if(h)document.querySelector('.book-wrap')?.insertAdjacentHTML('beforeend',h)}

async function advance(){if(busy)return;if(typing){typing.finish();return}const P=pages(),page=P[S.page];
 if(S.panel<page.panels.length-1){S.panel++;save();Sound.paper();const p=page.panels[S.panel];if(p.fx==='blink'||p.fx==='transform'){busy=true;await panelFx(p);busy=false;renderRight()}else{renderRight();panelFx(p)}const el=document.querySelector('#book .leaf .panel.now');if(el&&motion())el.animate([{transform:'scale(.96)',filter:'brightness(2)'},{transform:'scale(1)',filter:'brightness(1)'}],{duration:420,easing:'ease-out'});return}
 const n=needs();if(n==='ending'){closeBook();return}if(n==='roll'||n==='decision'||n==='ending'){document.querySelector('.sheet')?.animate([{transform:'translateY(0)'},{transform:'translateY(-8px)'},{transform:'translateY(0)'}],{duration:300});return}
 if(n==='create'){goCreate();return}
 if(page.part==='intro'&&P[S.page+1]?.part==='story'&&!S.contract){goCreate();return}
 await flipTo(S.page+1)}
async function back(){if(busy)return;if(typing){typing.finish();return}if(S.showFinale){S.showFinale=false;save();swapSheet();return}if(S.panel>0){S.panel--;save();Sound.paper();renderRight();return}await flipTo(S.page-1)}
function goCreate(){S.screen='create';if(!S.profile.body)S.step=0;else if(!S.profile.sector)S.step=1;else if(!ready())S.step=2;else S.step=3;S.albumSector=S.profile.sector||'JUSTIÇA';save();Sound.flip();render()}
/* ---------------- dados ---------------- */
function d20(){const a=new Uint32Array(1),lim=0x100000000-0x100000000%20;do crypto.getRandomValues(a);while(a[0]>=lim);return a[0]%20+1}
async function roll(){const page=pages()[S.page],r=page.roll;if(!r||S.rolls[r.id]||busy)return;busy=true;document.querySelector('.sheet')?.remove();
 const v=d20(),bonus=S.profile.skills.includes(r.skill)?2:0,total=v+bonus,ok=v===20||(v!==1&&total>=r.dc);if(!ok)Sound.whisper();S.rolls[r.id]={value:v,bonus,total,dc:r.dc,ok};save();
 try{await window.Dice3D?.roll([{sides:20,value:v,ok}],{title:`${r.title} · ${r.skill}`,result:ok?(v===20?'SUCESSO CRÍTICO':'SUCESSO'):(v===1?'FALHA CRÍTICA':'FALHA'),detail:`${v}${bonus?' + 2':''} = ${total} contra DT ${r.dc} · ${ok?'Pista descoberta.':'Pista perdida.'}`,tone:ok?'good':'bad',hold:2600,forceMotion:S.dice})}catch{}
 busy=false;Sound[ok?'bell':'heart']();renderRight();const p=page.panels[S.panel];panelFx(p)}
async function demo(){if(busy)return;busy=true;const v=d20();try{await window.Dice3D?.roll([{sides:20,value:v}],{title:'Seu D20',result:'Você tirou '+v,detail:'Demonstração. Nada na história mudou.',hold:2400,forceMotion:true})}catch{}busy=false}
function download(){const p=S.profile;const lines=['# ORDER — Meu Searcher','',`**Nome:** ${p.name}`,`**Setor:** ${p.sector}`,`**Pecado:** ${p.sin}`,`**Perícias:** ${p.skills.join(', ')}`,'',p.confession?`> ${p.confession}`:'','',`**Sentença do Contrato 001:** ${({collect:'Cobrar',mercy:'Poupar',defer:'Adiar'})[S.decisions.judgment]||'—'}`,'## Pistas',...ST.clues(S).map(c=>`- ${c.found?'[x] '+c.text:'[ ] '+c.label+' (perdida)'}`),'',...Object.entries(S.rolls).map(([k,r])=>`- ${({archive:'Investigação',letter:'Percepção',threshold:'Resistência'})[k]}: D20 ${r.value} + ${r.bonus} = ${r.total} (DT ${r.dc})`),'',`Continue: ${DISCORD}`];const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/markdown'}));const a=document.createElement('a');a.href=url;a.download=`ORDER-${(p.name||'searcher').replace(/[^\w-]/g,'-')}.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
/* ---------------- ações ---------------- */
async function act(a,v){
 switch(a){
  case'advance':return advance();
  case'back':return back();
  case'home':S.screen='cover';break;
  case'open-book':case'resume':{if(S.screen==='cover'){const b=$('.closed-book');if(b&&motion()){Sound.flip();b.classList.add('opening');await sleep(1000)}}S.screen=S.furthest>=ST.introCount&&!S.contract?'create':'book';if(S.screen==='create')return goCreate();save();render();return panelFx(pages()[S.page].panels[S.panel])}
  case'restart':S.page=ST.introCount;S.panel=0;S.furthest=ST.introCount;S.decisions={};S.rolls={};S.showFinale=false;S.screen=ready()?'book':'cover';break;
  case'legacy':Object.assign(S.profile,legacy()||{});break;
  case'go-create':return goCreate();
  case'step':S.step=Number(v);break;
  case'body':S.profile.body=v;S.step=1;Sound.paper();break;
  case'album-sector':S.albumSector=v;Sound.paper();if(innerWidth<760)setTimeout(()=>document.querySelector('.sector-page')?.scrollIntoView({behavior:'smooth',block:'start'}),60);break;
  case'choose-sector':S.profile.sector=S.albumSector;S.step=2;break;
  case'sin':syncForm();S.profile.sin=v;break;
  case'skill':{syncForm();const k=S.profile.skills,i=k.indexOf(v);if(i>=0)k.splice(i,1);else if(k.length<2)k.push(v);else{toast('Escolha só duas perícias. Desmarque uma antes.');return}break}
  case'identity-done':syncForm();if(!ready()){toast('Falta: '+[S.profile.name.trim().length<2&&'nome',!S.profile.sin&&'pecado',S.profile.skills.length!==2&&'duas perícias'].filter(Boolean).join(', ')+'.');return}S.step=3;break;
  case'start-story':S.contract=true;S.screen='book';S.page=ST.introCount;S.panel=0;S.furthest=Math.max(S.furthest,S.page);save();Sound.bell();render();return panelFx(pages()[S.page].panels[0]);
  case'choose':{const page=pages()[S.page];S.decisions[page.decision.id]=v;save();Sound.paper();if(page.decision.id==='judgment'){await blink(1)}return flipTo(S.page+1)}
  case'roll':return roll();
  case'close-book':return closeBook();
  case'reopen':S.screen='book';break;
  case'dice-demo':return demo();
  case'album':modal(sceneAlbum(),'album-modal');return;
  case'goto':{const i=Number(v);closeModal();if(S.screen!=='book'){S.screen='book';S.page=i;S.panel=0;save();render();return}if(i===S.page)return;return flipTo(i)}
  case'sheet':if(ready())sheetModal();return;
  case'settings':settingsModal();return;
  case'close':closeModal();return;
  case'download':download();return;
  case'audio':S.audio=!S.audio;save();Sound.setMusic();break;
 }
 save();render()}
function syncForm(){const f=$('#idform');if(!f)return;S.profile.name=f.name.value.slice(0,32);S.profile.confession=f.confession.value.slice(0,300);save()}
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t||t.disabled)return;if(t.closest('#leaf-right')&&t.id!=='leaf-right'&&t.dataset.a==='advance')return;e.preventDefault();act(t.dataset.a,t.dataset.v)});
document.addEventListener('input',e=>{const k=e.target.dataset.set;if(k==='music'){S.music=Number(e.target.value);save();Sound.setMusic()}if(e.target.closest('#idform'))syncForm()});
document.addEventListener('change',e=>{const k=e.target.dataset.set;if(!k||k==='music')return;S[k]=e.target.checked;save();Sound.setMusic();render()});
document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea')||$('#modal').classList.contains('on'))return;if(S.screen==='book'){if(['ArrowRight',' ','Enter'].includes(e.key)){e.preventDefault();advance()}if(e.key==='ArrowLeft'){e.preventDefault();back()}}if(S.screen==='cover'&&e.key==='Enter')act('open-book')});
/* ganchos para conferência automática de layout */
window.ORDER_DEBUG={pages,pageHTML,leftHTML,rightHTML,get state(){return S}};
render();
})();
