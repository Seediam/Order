/* Solo rules shared by the live UI and the deterministic balance simulations. */
'use strict';
const CombatRules={
 tutorial:{version:1,bossHp:6,bossShield:1,hitThreshold:2},
 pistol:{range:2,damage:2},
 plan(round,player){
  const kind=['strike','area','psych','guard'][(round-1)%4];
  return{kind,cells:kind==='area'?Array.from({length:5},(_,y)=>Array.from({length:9},(_,x)=>({x,y}))).flat().filter(p=>Math.abs(p.x-player.x)+Math.abs(p.y-player.y)<=1):[]};
 },
 intent(c){return({strike:'Mãos que prendem · golpe de alcance 2',area:'Acolhimento sufocante · saia das células marcadas',psych:'Vozes sob o véu · 2 de escudo protegem a Sanidade',guard:'Véu de abrigo · prepara 1 de escudo'})[c.intent.kind]},
 resolve(c,state){
  const near=Math.abs(c.player.x-c.boss.x)+Math.abs(c.player.y-c.boss.y)<=2;
  let harm=0,message='';
  switch(c.intent.kind){
   case'strike':harm=near?1:0;message=harm?'As mãos alcançam seu Searcher.':'As mãos fecham no vazio. Fora do alcance.';break;
   case'area':harm=c.intent.cells.some(p=>p.x===c.player.x&&p.y===c.player.y)?2:0;message=harm?'O véu cai sobre as células anunciadas.':'Você saiu das células anunciadas. O véu não o alcança.';break;
   case'psych':if(c.shield>=2){c.shield-=2;message='Seu escudo sustenta a mente. As vozes se afastam.'}else{state.sanity=Math.max(0,state.sanity-1);message='As vozes usam seu nome. −1 Sanidade.'}break;
   case'guard':c.bossShield=1;message='O véu se fecha. A inimiga recebe 1 de escudo.';break;
  }
  harm=Math.max(0,harm-c.weak);const blocked=Math.min(c.shield,harm);c.shield-=blocked;const received=Math.min(c.hp,harm-blocked);c.hp=Math.max(0,c.hp-received);c.weak=0;
  return message+(harm?' '+received+' de dano; '+blocked+' bloqueado.':'');
 },
 hit(c,natural,bonus=0){const protection=Math.min(6,(c.badRolls||0)*2),hit=natural+bonus+protection>=CombatRules.tutorial.hitThreshold;c.badRolls=hit?0:(c.badRolls||0)+1;return{hit,protection,total:natural+bonus+protection}},
 activate(c,card,die){const active=card.dice.includes(die);if(!active){c.badRolls=(c.badRolls||0)+1;if(c.badRolls>=2){c.action++;c.shield+=2}}return active},
 damage(c,amount){const blocked=Math.min(c.bossShield||0,amount);c.bossShield=(c.bossShield||0)-blocked;const actual=Math.min(c.bossHp,Math.max(0,amount-blocked));c.bossHp=Math.max(0,c.bossHp-actual);return actual}
};
