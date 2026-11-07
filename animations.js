/* ORDER V0.4 — one owner for cinematic timing and motion. No game-state mutation. */
'use strict';
const Cinematics=(()=>{
 let typing=null,transitioning=false,walking=false;
 const reduced=()=>!motionOK();
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function animate(el,frames,ms,options={}){
  if(!el)return;
  const a=el.animate(frames,{duration:reduced()?1:ms,easing:'ease-in-out',...options});
  try{await a.finished}catch{}return a;
 }
 function curtain(){let el=document.getElementById('cinema-fade');if(!el){el=document.createElement('div');el.id='cinema-fade';el.setAttribute('aria-hidden','true');document.body.append(el)}return el}
 async function fadeToBlack(ms=440){const el=curtain();el.style.pointerEvents='auto';await animate(el,[{opacity:getComputedStyle(el).opacity},{opacity:1}],ms,{fill:'forwards'})}
 async function fadeFromBlack(ms=580){const el=curtain();await animate(el,[{opacity:1},{opacity:0}],ms,{fill:'forwards'});el.style.pointerEvents='none'}
 async function transitionScene(update,{blink=false}={}){
  if(transitioning||walking)return false;transitioning=true;
  try{await fadeToBlack();await update();await wait(60);await fadeFromBlack();if(blink&&!reduced()){await fadeToBlack(130);await fadeFromBlack(680)}}finally{transitioning=false}
  return true;
 }
 async function playEyeIntro(open=false){
  const el=document.querySelector('.intro'),eye=el?.querySelector('.order-eye');if(!eye)return;
  if(!open){animate(eye,[{opacity:0},{opacity:1}],1300);animate(eye.querySelector('.eye-reveal'),[{transform:'scaleY(.04)'},{transform:'scaleY(1)'}],1100);return}
  if(el.dataset.opening)return;el.dataset.opening='true';el.querySelector('button').disabled=true;audio('eye');
  await animate(eye.querySelector('.eye-iris-look'),[{transform:'translate(0px,0px) scale(1)'},{transform:'translate(0px,0px) scale(1.16)'}],400,{fill:'forwards'});
  if(!reduced())for(let i=0;i<2;i++){await animate(eye.querySelector('.eye-reveal'),[{transform:'scaleY(1)'},{transform:'scaleY(.03)'},{transform:'scaleY(1)'}],220)}
  await animate(eye,[{opacity:1,filter:'brightness(1)'},{opacity:0,filter:'brightness(1.7)'}],550,{fill:'forwards'});
  await transitionScene(()=>{S.introOpened=true;persist();render()});
 }
 function setActiveSpeaker(speaker,active=true){
  document.querySelectorAll('.character').forEach(el=>{const match=active&&el.dataset.character===speaker;el.classList.toggle('is-speaking',match);el.classList.toggle('is-listening',active&&!match)});
 }
 function playCharacterBreathing(){document.querySelectorAll('.character img,.boss-portrait img,.unit img').forEach(el=>el.classList.add('is-breathing'))}
 function startTypewriter(el,text,{onDone=()=>{},speaker='',speed=S.textSpeed||32}={}){
  cancelTypewriter();const chars=Array.from(text);let index=0,timer;el.textContent='';el.classList.add('is-typing');
  let resolve;const finished=new Promise(r=>resolve=r);
  const done=()=>{clearTimeout(timer);el.textContent=text;el.classList.remove('is-typing');setActiveSpeaker(speaker,false);typing=null;onDone();resolve()};
  const tick=()=>{if(!el.isConnected){cancelTypewriter();return}el.textContent+=chars[index++];el.scrollTop=el.scrollHeight;if(index>=chars.length){done();return}const c=chars[index-1],ellipsis=c==='…'||(c==='.'&&chars[index]==='.');timer=setTimeout(tick,c===','||c===';'?speed+100:ellipsis?speed+360:/[.!?]/.test(c)?speed+210:speed)};
  typing={finish:done,cancel:()=>{clearTimeout(timer);resolve()}};if(!chars.length){done();return finished}setActiveSpeaker(speaker,true);timer=setTimeout(tick,speed);return finished;
 }
 function cancelTypewriter(){if(typing){typing.cancel();typing=null}}
 function finishTypewriter(){if(!typing)return false;typing.finish();return true}
 async function playLightFlicker(){const el=document.getElementById('cinema-light');audio('lamp');await animate(el,[{opacity:0},{opacity:.8,offset:.24},{opacity:.08,offset:.45},{opacity:.65,offset:.65},{opacity:0}],850)}
 async function playHorrorEvent(kind='silhouette'){
  if(reduced()){await animate(document.getElementById('cinema-light'),[{opacity:0},{opacity:.35},{opacity:0}],400);return}
  const stage=document.querySelector('.stage');stage?.classList.add('horror-event');audio(kind==='door'?'door':'whisper');
  await playLightFlicker();stage?.classList.remove('horror-event');
 }
 async function walkToTile(points,{element,onStep=()=>{},stepMs=310}={}){
  if(walking||!element||points.length<2)return false;walking=true;element.classList.add('is-traveling');document.body.classList.add('is-walking');
  try{for(let i=1;i<points.length;i++){const from=points[i-1],to=points[i];await animate(element,[{left:from.x+'px',top:from.y+'px'},{left:to.x+'px',top:to.y+'px'}],stepMs,{fill:'forwards'});onStep(i);audio('step')}}finally{walking=false;element.classList.remove('is-traveling');document.body.classList.remove('is-walking')}return true;
 }
 async function transformation(){const el=document.querySelector('.character.elvira img');if(!el)return;await playLightFlicker();await animate(el,[{opacity:1,filter:'brightness(1)'},{opacity:.1,filter:'brightness(.1)'}],450);el.src='assets/Euvira_Demon.png';await animate(el,[{opacity:.15,filter:'brightness(2)'},{opacity:1,filter:'brightness(1)'}],950)}
 async function showTitle(text){const el=document.createElement('div');el.className='milestone';el.innerHTML='<div class="cinematic-title">'+Array.from(text).map((c,i)=>'<span style="--letter:'+i*.22+'">'+(c===' '?'&nbsp;':c)+'</span>').join('')+'</div>';document.body.append(el);await wait(reduced()?450:2100);await animate(el,[{opacity:1},{opacity:0}],400);el.remove()}
 return{showTitle,playEyeIntro,startTypewriter,cancelTypewriter,finishTypewriter,setActiveSpeaker,playCharacterBreathing,playLightFlicker,fadeToBlack,fadeFromBlack,walkToTile,transitionScene,playHorrorEvent,transformation,get busy(){return transitioning||walking}};
})();
