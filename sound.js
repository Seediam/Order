/* Short procedural cues, triggered by actions. Silence is the ambient track. */
'use strict';
const AudioEngine=(()=>{
 let context=null;
 function unlock(){try{context=context||new(window.AudioContext||window.webkitAudioContext)();if(context.state==='suspended')context.resume()}catch{}}
 function play(type){
  if(!S.audio||S.volume<=0)return;unlock();if(!context||context.state!=='running')return;
  const now=context.currentTime,volume=S.volume;
  const pitches={click:440,hover:530,roll:160,good:650,bad:95,eye:48,attack:78,turn:270,bell:220,breath:48,creak:115,door:65,wind:72,whisper:135,step:70,paper:410,lamp:82,distant:55,heartbeat:52};
  const duration={bell:1.7,whisper:.85,wind:1,breath:.8,eye:.7,creak:.45,distant:1}[type]||.2;
  const gain=context.createGain();gain.connect(context.destination);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume*(type==='bell'?.08:.055),now+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  if(['paper','step','lamp','wind','whisper','breath','creak','door'].includes(type)){
   const buffer=context.createBuffer(1,Math.floor(context.sampleRate*duration),context.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.5;
   const source=context.createBufferSource(),filter=context.createBiquadFilter();filter.type='bandpass';filter.frequency.value={paper:2100,step:180,lamp:1100,wind:240,whisper:850,breath:400,creak:180,door:100}[type];filter.Q.value=.6;source.buffer=buffer;source.connect(filter);filter.connect(gain);source.start();
  }else{const osc=context.createOscillator();osc.type=type==='roll'?'triangle':'sine';osc.frequency.setValueAtTime(pitches[type]||200,now);osc.frequency.exponentialRampToValueAtTime((pitches[type]||200)*.7,now+duration);osc.connect(gain);osc.start(now);osc.stop(now+duration)}
 }
 document.addEventListener('pointerdown',unlock,{once:true});document.addEventListener('keydown',unlock,{once:true});
 return{play,ctx:()=>{unlock();return context}};
})();
