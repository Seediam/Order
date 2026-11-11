/* ORDER — dados 3D em CSS puro (D6 e D20). Sem dependências.
   Uso: await Dice3D.roll([{sides:20,value:14},{sides:6,value:3}],{title:'Ataque',detail:'14 + 2 = 16 vs Defesa 12',tone:'good'})
   O resultado é decidido por quem chama (jogo ou servidor); o dado apenas mostra a face sorteada. */
(function(){
'use strict';
const PHI=(1+Math.sqrt(5))/2;
const v=(x,y,z)=>({x,y,z});
const add=(a,b)=>v(a.x+b.x,a.y+b.y,a.z+b.z),sub=(a,b)=>v(a.x-b.x,a.y-b.y,a.z-b.z),mul=(a,k)=>v(a.x*k,a.y*k,a.z*k);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z,len=a=>Math.sqrt(dot(a,a)),norm=a=>mul(a,1/len(a));
const cross=(a,b)=>v(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const f=n=>Number(n.toFixed(6));

/* Icosaedro: 12 vértices, 20 faces triangulares. Numeração com faces opostas somando 21. */
function icosahedron(radius){
 const raw=[[0,1,PHI],[0,-1,PHI],[0,1,-PHI],[0,-1,-PHI],[1,PHI,0],[-1,PHI,0],[1,-PHI,0],[-1,-PHI,0],[PHI,0,1],[-PHI,0,1],[PHI,0,-1],[-PHI,0,-1]].map(p=>v(...p));
 const r0=len(raw[0]),pts=raw.map(p=>mul(p,radius/r0));
 const faces=[];
 for(let a=0;a<12;a++)for(let b=a+1;b<12;b++)for(let c=b+1;c<12;c++){
  const ab=len(sub(raw[a],raw[b])),bc=len(sub(raw[b],raw[c])),ca=len(sub(raw[c],raw[a]));
  if(Math.abs(ab-2)<1e-6&&Math.abs(bc-2)<1e-6&&Math.abs(ca-2)<1e-6)faces.push([pts[a],pts[b],pts[c]]);
 }
 const centers=faces.map(t=>mul(add(add(t[0],t[1]),t[2]),1/3));
 // ordena faces do topo para baixo e pareia com a oposta
 const order=faces.map((_,i)=>i).sort((i,j)=>centers[i].y-centers[j].y||Math.atan2(centers[i].z,centers[i].x)-Math.atan2(centers[j].z,centers[j].x));
 const number=new Array(20).fill(0);let next=1;
 for(const i of order){if(number[i])continue;const opp=centers.findIndex(c=>len(add(c,centers[i]))<1e-6);number[i]=next;number[opp]=21-next;next++;if(next>10)break}
 return faces.map((t,i)=>{
  const c=centers[i],n=norm(c);
  const apex=t[0];const down=norm(sub(c,apex));const right=cross(down,n);
  return{n,c,e1:right,e2:down,side:len(sub(t[0],t[1])),value:number[i]};
 });
}
/* Cubo: faces 1-6 com opostas somando 7. */
function cube(half){
 const data=[[1,v(0,0,1),v(0,1,0)],[6,v(0,0,-1),v(0,1,0)],[2,v(0,-1,0),v(0,0,1)],[5,v(0,1,0),v(0,0,-1)],[3,v(1,0,0),v(0,1,0)],[4,v(-1,0,0),v(0,1,0)]];
 return data.map(([value,n,down])=>({n,c:mul(n,half),e1:cross(down,n),e2:down,side:half*2,value}));
}
function placeMatrix(face){const {e1,e2,n,c}=face;return`matrix3d(${f(e1.x)},${f(e1.y)},${f(e1.z)},0,${f(e2.x)},${f(e2.y)},${f(e2.z)},0,${f(n.x)},${f(n.y)},${f(n.z)},0,${f(c.x)},${f(c.y)},${f(c.z)},1)`}
function showMatrix(face){const {e1,e2,n}=face;return`matrix3d(${f(e1.x)},${f(e2.x)},${f(n.x)},0,${f(e1.y)},${f(e2.y)},${f(n.y)},0,${f(e1.z)},${f(e2.z)},${f(n.z)},0,0,0,0,1)`}
const PIPS={1:[[50,50]],2:[[28,28],[72,72]],3:[[26,26],[50,50],[74,74]],4:[[28,28],[72,28],[28,72],[72,72]],5:[[27,27],[73,27],[50,50],[27,73],[73,73]],6:[[28,24],[72,24],[28,50],[72,50],[28,76],[72,76]]};
const cache={};
function geometry(sides,size){const key=sides+':'+size;if(!cache[key])cache[key]=sides===6?cube(size*.5):icosahedron(size*.62);return cache[key]}
function buildDie(sides,size){
 const die=document.createElement('div');die.className='d3-die d3-d'+sides;die.style.setProperty('--d3-size',size+'px');
 for(const face of geometry(sides,size)){
  const el=document.createElement('div');el.className='d3-face';
  if(sides===6){el.style.width=el.style.height=face.side+'px';el.style.left=el.style.top=-face.side/2+'px';el.innerHTML=PIPS[face.value].map(([x,y])=>`<i style="left:${x}%;top:${y}%"></i>`).join('');}
  else{const w=face.side,h=w*Math.sqrt(3)/2;el.style.width=w+'px';el.style.height=h+'px';el.style.left=-w/2+'px';el.style.top=-h*2/3+'px';el.style.transformOrigin=`50% ${h*2/3}px`;el.innerHTML=`<b style="font-size:${Math.round(w*.34)}px;top:${h*2/3}px">${face.value}${face.value===6||face.value===9?'<u>.</u>':''}</b>`;}
  if(sides===6)el.style.transformOrigin='50% 50%';
  el.style.transform=placeMatrix(face);el.dataset.value=face.value;die.append(el);
 }
 return die;
}
function finalTransform(sides,size,value,tilt){const face=geometry(sides,size).find(x=>x.value===value)||geometry(sides,size)[0];return`rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotateZ(${tilt.z}deg) ${showMatrix(face)}`}
const rnd=(a,b)=>a+Math.random()*(b-a);
function tumble(){return`rotateX(${rnd(-360,360)|0}deg) rotateY(${rnd(-360,360)|0}deg) rotateZ(${rnd(-360,360)|0}deg)`}
function reduced(){try{if(typeof motionOK==='function')return!motionOK()}catch{}return matchMedia('(prefers-reduced-motion: reduce)').matches}
let tray=null,enabled=true,queue=Promise.resolve();
function ensureTray(){
 if(tray?.isConnected)return tray;
 tray=document.createElement('div');tray.className='d3-tray';tray.setAttribute('aria-live','polite');
 tray.innerHTML='<div class="d3-felt"></div><div class="d3-stage"></div><div class="d3-caption"><span class="d3-title"></span><strong class="d3-result"></strong><span class="d3-detail"></span><small class="d3-skip">CLIQUE PARA CONTINUAR</small></div>';
 document.body.append(tray);return tray;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function play(dice,opts={}){
 const t=ensureTray(),stage=t.querySelector('.d3-stage');stage.innerHTML='';
 t.querySelector('.d3-title').textContent=opts.title||'';
 t.querySelector('.d3-result').textContent='';
 t.querySelector('.d3-detail').textContent='';
 t.dataset.tone='';t.classList.remove('is-done');
 const fast=reduced()||!enabled;
 const size=opts.size||(dice.length>2?110:140);
 const runs=dice.map((d,i)=>{
  const holder=document.createElement('div');holder.className='d3-holder';
  const spread=(i-(dice.length-1)/2)*(size*1.7);
  holder.style.setProperty('--x',spread+'px');
  const die=buildDie(d.sides,size);if(d.color)die.style.setProperty('--d3-color',d.color);
  if(d.highlight)die.dataset.highlight=d.highlight.join(',');
  holder.append(die);stage.append(holder);
  const tilt={x:rnd(-16,-6),y:rnd(-14,14),z:rnd(-10,10)};
  const end=finalTransform(d.sides,size,d.value,tilt);
  if(fast){die.style.transform=end;return Promise.resolve()}
  const dur=1300+i*180+rnd(0,250);
  const frames=[{transform:tumble()},{transform:tumble(),offset:.3},{transform:tumble(),offset:.58},{transform:tumble(),offset:.8},{transform:end}];
  const spin=die.animate(frames,{duration:dur,easing:'cubic-bezier(.15,.6,.25,1)',fill:'forwards'});
  const fromX=(i%2?1:-1)*rnd(260,420);
  holder.animate([{transform:`translate(calc(var(--x) + ${fromX}px),-260px) scale(.6)`,opacity:0},{transform:`translate(calc(var(--x) + ${fromX*.35}px),20px) scale(1.05)`,opacity:1,offset:.45},{transform:`translate(calc(var(--x) + ${fromX*.1}px),-26px) scale(1)`,offset:.68},{transform:'translate(var(--x),0) scale(1)'}],{duration:dur,easing:'ease-out',fill:'forwards'});
  return spin.finished.catch(()=>{});
 });
 t.classList.add('is-open');
 try{if(typeof AudioEngine!=='undefined')AudioEngine.play('roll')}catch{}
 await Promise.all(runs);
 dice.forEach((d,i)=>{const face=stage.children[i]?.querySelector(`.d3-face[data-value="${d.value}"]`);face?.classList.add('is-up');if(d.ok===true)stage.children[i].classList.add('is-ok');if(d.ok===false)stage.children[i].classList.add('is-fail')});
 t.querySelector('.d3-result').textContent=opts.result||dice.map(d=>d.value).join(' · ');
 t.querySelector('.d3-detail').textContent=opts.detail||'';
 t.dataset.tone=opts.tone||'';t.classList.add('is-done');
 try{if(typeof AudioEngine!=='undefined')AudioEngine.play(opts.tone==='bad'?'bad':opts.tone==='good'?'good':'click')}catch{}
 let skip;const clicked=new Promise(r=>{skip=r;t.addEventListener('pointerdown',r,{once:true})});
 await Promise.race([sleep(fast?650:(opts.hold||1250)),clicked]);
 t.classList.remove('is-open');await sleep(fast?60:220);
}
function roll(dice,opts){const run=queue.then(()=>play(dice,opts));queue=run.catch(()=>{});return run}
const css=`
.d3-tray{position:fixed;inset:0;z-index:900;display:grid;place-items:center;pointer-events:none;opacity:0;transition:opacity .2s}
.d3-tray.is-open{opacity:1;pointer-events:auto;cursor:pointer}
.d3-felt{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,rgba(60,8,30,.72),rgba(8,4,8,.86) 70%);backdrop-filter:blur(2px)}
.d3-stage{position:relative;width:1px;height:1px;perspective:1100px;perspective-origin:50% 40%;transform:translateY(-30px)}
.d3-holder{position:absolute;left:0;top:0;transform-style:preserve-3d}
.d3-holder:after{content:"";position:absolute;left:calc(var(--d3-size,140px) * -.5);top:calc(var(--d3-size,140px) * .55);width:var(--d3-size,140px);height:22px;border-radius:50%;background:radial-gradient(rgba(0,0,0,.65),transparent 70%);transform:translateZ(-200px)}
.d3-die{--d3-color:#c81d5d;position:absolute;left:0;top:0;transform-style:preserve-3d;width:0;height:0}
.d3-face{position:absolute;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.d3-d6 .d3-face{border-radius:16%;background:radial-gradient(circle at 30% 25%,#fff3f7,#f1d9e2 55%,#cfaab9);box-shadow:inset 0 0 0 2px rgba(120,20,60,.25),inset 0 -8px 18px rgba(90,10,40,.25)}
.d3-d6 .d3-face i{position:absolute;width:17%;height:17%;margin:-8.5% 0 0 -8.5%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff4f9c,#8c0b3c);box-shadow:inset 0 2px 3px rgba(0,0,0,.5)}
.d3-d20 .d3-face{clip-path:polygon(50% 0,100% 100%,0 100%);background:linear-gradient(160deg,color-mix(in srgb,var(--d3-color) 70%,#fff 30%),var(--d3-color) 45%,color-mix(in srgb,var(--d3-color) 55%,#000 45%))}
.d3-d20 .d3-face:before{content:"";position:absolute;inset:0;clip-path:polygon(50% 3%,97% 98%,3% 98%);background:linear-gradient(200deg,rgba(255,255,255,.18),rgba(0,0,0,.18))}
.d3-d20 .d3-face b{position:absolute;left:0;right:0;transform:translateY(-55%);text-align:center;font:700 1em/1 "Cinzel Decorative","Cinzel",Georgia,serif;color:#fff4f8;text-shadow:0 2px 3px rgba(0,0,0,.6)}
.d3-d20 .d3-face b u{text-decoration:none;font-size:.5em}
.d3-face.is-up{filter:brightness(1.12)}
.d3-holder.is-ok .d3-face.is-up{filter:brightness(1.25) drop-shadow(0 0 6px #ff76c7)}
.d3-holder.is-fail .d3-face{filter:grayscale(.55) brightness(.8)}
.d3-caption{position:absolute;left:50%;top:calc(50% + 120px);transform:translateX(-50%);display:grid;justify-items:center;gap:6px;min-width:320px;text-align:center;color:#f3e6ec;opacity:0;transition:opacity .25s,transform .25s}
.d3-tray.is-done .d3-caption{opacity:1;transform:translateX(-50%) translateY(-4px)}
.d3-title{font:600 13px/1.2 "IM Fell English SC",Georgia,serif;letter-spacing:.24em;color:#ff9ad0;text-transform:uppercase}
.d3-result{font:700 44px/1 "Cinzel Decorative",Georgia,serif;letter-spacing:.06em;text-shadow:0 0 18px rgba(255,47,142,.55)}
.d3-tray[data-tone=bad] .d3-result{color:#c9c2c6;text-shadow:none}
.d3-tray[data-tone=good] .d3-result{color:#ffd1e8}
.d3-tray[data-tone=crit] .d3-result{color:#ffe7a8;text-shadow:0 0 22px rgba(255,200,90,.8)}
.d3-detail{font:500 19px/1.35 "Cormorant Garamond",Georgia,serif;max-width:560px}
.d3-skip{font:600 10px/1 "IM Fell English SC",Georgia,serif;letter-spacing:.2em;color:rgba(255,255,255,.4)}
`;
function injectCSS(){if(document.getElementById('d3-style'))return;const s=document.createElement('style');s.id='d3-style';s.textContent=css;document.head.append(s)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectCSS);else injectCSS();
window.Dice3D={roll,setEnabled(x){enabled=!!x},get enabled(){return enabled}};
})();
