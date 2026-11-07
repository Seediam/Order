/* ORDER: visual effects live outside #app, so a state render does not cancel them. */
'use strict';
const BattleFX=(()=>{
 let layer;
 const timing={charge:420,projectile:1100,ring:1300,sparks:850,damage:1200,number:2000,result:2000,support:1500};
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const reduced=()=>typeof motionOK==='function'?!motionOK():matchMedia('(prefers-reduced-motion: reduce)').matches;
 function root(){if(!layer?.isConnected){layer=document.createElement('div');layer.className='battle-fx-layer';layer.setAttribute('aria-hidden','true');document.body.append(layer)}return layer}
 function point(value){value=typeof value==='function'?value():value;if(!value)return null;if(value instanceof Element){const r=value.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,radius:Math.max(17,r.width/2)}}return value}
 function effect(className,p,color='#FF76C7'){const el=document.createElement('span');el.className=className;el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.setProperty('--fx-color',color);root().append(el);return el}
 async function animate(el,frames,duration,readable=false){const animation=el.animate(frames,{duration:reduced()&&!readable?Math.min(duration,180):duration,easing:'ease-out',fill:'forwards'});try{await animation.finished}catch{}el.remove()}
 function number(at,text,color){const p=point(at);if(!p)return;const el=effect('battle-fx-number',p,color);el.textContent=text;const stationary='translate(-50%,-80%)';const frames=reduced()?[{opacity:0,transform:stationary},{opacity:1,offset:.12,transform:stationary},{opacity:1,offset:.8,transform:stationary},{opacity:0,transform:stationary}]:[{opacity:0,transform:'translate(-50%,-20%) scale(.9)'},{opacity:1,offset:.14,transform:'translate(-50%,-80%) scale(1)'},{opacity:1,offset:.76,transform:'translate(-50%,-100%) scale(1)'},{opacity:0,transform:'translate(-50%,-145%) scale(.97)'}];void animate(el,frames,timing.number,true)}

 function ring(at,kind='cast'){const p=point(at);if(!p)return;const el=effect('battle-fx-ring '+kind,p,kind==='damage'?'#ec414f':kind==='shield'?'#D7D7DE':'#FF76C7');const size=(p.radius||24)*2.2;el.style.width=size+'px';el.style.height=size+'px';void animate(el,[{opacity:.9,transform:'translate(-50%,-50%) scale(.35) rotate(-30deg)'},{opacity:.6,offset:.4,transform:'translate(-50%,-50%) scale(1) rotate(10deg)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.6) rotate(40deg)'}],timing.ring)}
 function sparks(at,color='#FF76C7'){const p=point(at);if(!p||reduced())return;for(let i=0;i<9;i++){const angle=i*Math.PI*2/9,dist=26+(i%3)*15,el=effect('battle-fx-spark',p,color);void animate(el,[{opacity:1,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:`translate(calc(-50% + ${Math.cos(angle)*dist}px),calc(-50% + ${Math.sin(angle)*dist}px)) scale(.1)`}],timing.sparks+i*40)}}
 function damage(at,amount){const p=point(at);if(!p||amount<=0)return;const token=typeof at==='function'?at():at;const portrait=token instanceof Element?token.querySelector('img'):null;if(portrait&&!reduced()){portrait.animate([{filter:'none'},{filter:'sepia(1) saturate(8) hue-rotate(315deg) brightness(1.6)',offset:.15},{filter:'none',offset:.35},{filter:'sepia(1) saturate(8) hue-rotate(315deg) brightness(1.5)',offset:.55},{filter:'none'}],{duration:timing.damage,easing:'linear'})}const flash=effect('battle-fx-damage',p,'#ec414f');const size=(p.radius||24)*2.1;flash.style.width=size+'px';flash.style.height=size+'px';void animate(flash,reduced()?[{opacity:.45},{opacity:0}]:[{opacity:0},{opacity:.85,offset:.12},{opacity:.12,offset:.3},{opacity:.7,offset:.43},{opacity:0,offset:.65},{opacity:.45,offset:.76},{opacity:0}],timing.damage);sparks(p,'#ec414f');number(p,'−'+amount,'#ff6876')}
 async function cast(from,to,{kind='attack',amount=0,hit=true}={}){
  const a=point(from),b=point(to)||a;if(!a||!b)return;ring(a,kind==='fizzle'?'fizzle':'cast');
  if(kind==='fizzle'){number(a,'FALHOU','#D7D7DE');return pause(timing.result)}
  if(!reduced())await pause(timing.charge);
  if(kind==='attack'||kind==='psych'){
   if(!reduced()){const dx=b.x-a.x,dy=b.y-a.y,angle=Math.atan2(dy,dx)*180/Math.PI,bolt=effect('battle-fx-bolt',a);await animate(bolt,[{opacity:0,transform:`translate(-50%,-50%) rotate(${angle}deg) scale(.4)`},{opacity:1,offset:.15,transform:`translate(${dx*.15-20}px,${dy*.15-4}px) rotate(${angle}deg) scale(1)`},{opacity:1,offset:.75,transform:`translate(${dx*.75-20}px,${dy*.75-4-12}px) rotate(${angle}deg) scale(1.2)`},{opacity:0,transform:`translate(${dx-20}px,${dy-4}px) rotate(${angle}deg) scale(.7)`}],timing.projectile)}
   if(!hit){number(to,'ERROU','#D7D7DE');sparks(b);await pause(timing.result);return}
   ring(to,kind==='psych'?'psych':'impact');sparks(point(to)||b);if(amount>0)damage(to,amount);else if(kind!=='psych')number(to,'BLOQUEADO','#D7D7DE');
  }else{ring(to,kind);sparks(point(to)||b);if(kind==='heal'&&amount>0)number(to,'+'+amount,'#FFB1DC')}
  await pause(kind==='attack'||kind==='psych'||kind==='heal'?timing.result:timing.support);
 }
 return{cast,damage,ring};
})();
