/* ORDER — ambiente: chuva (visual em canvas + som sintetizado), trovões e música de fundo (assets/background_music.mp4).
   O áudio só começa depois do primeiro clique (regra dos navegadores). */
'use strict';
const Ambience=(()=>{
 let music=null,rainSrc=null,rainGain=null,canvas=null,ctx2d=null,drops=[],raf=0,intensity=0,target=0,thunderTimer=0,mode='';
 /* Onde chove: Cómum (igreja). Fora no exterior, mais forte; dentro, ouvida pelas janelas. */
 function wanted(){if(typeof S==='undefined')return 0;const st=S.stage;if(st==='vn'){if(S.node.startsWith('hell'))return 0;return['arrival','threshold','patio','childKind','childWait','childSafety'].includes(S.node)?1:.55}if(st==='explore')return .45;if(st==='evidence')return .35;if(['intro','gender','name','quiz','sin','skills','class'].includes(st))return .25;return 0}
 function musicWanted(){return typeof S!=='undefined'&&S.audio!==false&&(S.musicVolume??.35)>0}
 /* --- música --- */
 function syncMusic(){if(!musicWanted()){if(music&&!music.paused)fade(music,0,600,()=>music.pause());return}
  if(!music){music=new Audio('assets/background_music.mp4');music.loop=true;music.preload='auto';music.volume=0}
  const vol=Math.min(1,(S.musicVolume??.35)*(S.combat&&S.stage==='combat'?1:.8));
  if(music.paused){const p=music.play();if(p)p.then(()=>fade(music,vol,1500)).catch(()=>{})}else fade(music,vol,800)}
 function fade(a,to,ms,done){const from=a.volume,t0=performance.now();const step=t=>{const k=Math.min(1,(t-t0)/ms);a.volume=Math.max(0,Math.min(1,from+(to-from)*k));if(k<1)requestAnimationFrame(step);else done&&done()};requestAnimationFrame(step)}
 /* --- som da chuva: ruído rosado + gotas, pré-renderizado num laço de 6 s --- */
 function rainBuffer(ac){const len=Math.floor(ac.sampleRate*6),buf=ac.createBuffer(2,len,ac.sampleRate);
  for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);let b0=0,b1=0,b2=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;b0=.99765*b0+w*.099;b1=.963*b1+w*.2965;b2=.57*b2+w*1.0526;d[i]=(b0+b1+b2+w*.1848)*.05}
   const drops=Math.floor(6*260);for(let k=0;k<drops;k++){const at=Math.floor(Math.random()*len),amp=.05+Math.random()*.22,dec=.0015+Math.random()*.006,n=Math.floor(ac.sampleRate*dec*6);let ph=Math.random()*6;const f=1800+Math.random()*4200;for(let j=0;j<n&&at+j<len;j++){const env=Math.exp(-j/(ac.sampleRate*dec));d[at+j]+=Math.sin(ph)*env*amp*(Math.random()*.6+.4);ph+=2*Math.PI*f/ac.sampleRate}}
   // fade nas pontas para o laço não estalar
   for(let i=0;i<2000;i++){const k=i/2000;d[i]*=k;d[len-1-i]*=k}}
  return buf}
 function syncRainAudio(level){const on=typeof S!=='undefined'&&S.audio!==false&&level>0;const ac=on?AudioEngine.ctx():null;
  if(!on){if(rainGain&&rainGain.context.state==='running')rainGain.gain.setTargetAtTime(0,rainGain.context.currentTime,.6);return}
  if(!ac||ac.state!=='running')return;
  if(!rainSrc){rainSrc=ac.createBufferSource();rainSrc.buffer=rainBuffer(ac);rainSrc.loop=true;const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=380;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=7500;rainGain=ac.createGain();rainGain.gain.value=0;rainSrc.connect(hp);hp.connect(lp);lp.connect(rainGain);rainGain.connect(ac.destination);rainSrc.start()}
  const vol=(S.volume??.45)*1.4*level;rainGain.gain.setTargetAtTime(vol,ac.currentTime,.8);
  // dentro da igreja a chuva fica abafada
  }
 function thunder(){if(typeof S==='undefined'||intensity<.4)return;const ac=S.audio!==false?AudioEngine.ctx():null;
  const light=document.getElementById('cinema-light');if(light&&motionOK())light.animate([{opacity:0,background:'#e8e6ff'},{opacity:.35,offset:.05},{opacity:0,offset:.12},{opacity:.22,offset:.18},{opacity:0}],{duration:900});
  if(!ac||ac.state!=='running')return;const len=Math.floor(ac.sampleRate*4.5),buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);let last=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;last=(last+.02*w)/1.02;const t=i/ac.sampleRate;d[i]=last*3.2*Math.exp(-t*.9)*(t<.08?t/.08:1)*(1+.5*Math.sin(t*7))}
  const src=ac.createBufferSource();src.buffer=buf;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=220;const g=ac.createGain();g.gain.value=(S.volume??.45)*1.6*intensity;src.connect(lp);lp.connect(g);g.connect(ac.destination);setTimeout(()=>src.start(),400+Math.random()*900)}
 function scheduleThunder(){clearTimeout(thunderTimer);thunderTimer=setTimeout(()=>{thunder();scheduleThunder()},22000+Math.random()*40000)}
 /* --- chuva visual --- */
 function ensureCanvas(){if(canvas)return;canvas=document.createElement('canvas');canvas.id='rain-canvas';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);ctx2d=canvas.getContext('2d');const resize=()=>{canvas.width=innerWidth;canvas.height=innerHeight};addEventListener('resize',resize);resize()}
 function frame(){raf=0;intensity+=(target-intensity)*.04;if(intensity<.01&&target===0){ctx2d.clearRect(0,0,canvas.width,canvas.height);canvas.style.opacity=0;return}
  canvas.style.opacity=1;const w=canvas.width,h=canvas.height,want=Math.floor(380*intensity*(w*h)/(1600*900));while(drops.length<want)drops.push(newDrop(w,h,true));if(drops.length>want)drops.length=want;
  ctx2d.clearRect(0,0,w,h);ctx2d.lineCap='round';
  for(const d of drops){d.y+=d.v;d.x+=d.v*.18;if(d.y>h||d.x>w){Object.assign(d,newDrop(w,h,false))}ctx2d.strokeStyle=`rgba(${d.pink?'255,170,210':'210,215,235'},${d.a*Math.min(1,intensity*1.4)})`;ctx2d.lineWidth=d.lw;ctx2d.beginPath();ctx2d.moveTo(d.x,d.y);ctx2d.lineTo(d.x-d.v*.18*d.len,d.y-d.v*d.len);ctx2d.stroke()}
  raf=requestAnimationFrame(frame)}
 function newDrop(w,h,anywhere){const v=14+Math.random()*16;return{x:Math.random()*(w+200)-200,y:anywhere?Math.random()*h:-40-Math.random()*200,v,len:1.2+Math.random()*.9,a:.12+Math.random()*.25,lw:.8+Math.random()*1.1,pink:Math.random()<.12}}
 function update(){const level=wanted();target=motionOK()?level:0;ensureCanvas();if(!raf)raf=requestAnimationFrame(frame);syncRainAudio(level);syncMusic();if(level>0)scheduleThunder();else clearTimeout(thunderTimer)}
 document.addEventListener('pointerdown',()=>setTimeout(update,30));
 return{update};
})();
