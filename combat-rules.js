/* ORDER — motor de combate do Hells (v6).
   Rodada: todos escolhem uma carta virada ao mesmo tempo (o verso fica sobre a cabeça do token);
   a iniciativa (D20 + Percepção) decide a ordem em que cada um revela e resolve.
   Ação: vira na sua vez. Reação: fica armada a rodada toda e vira quando você é atacado.
   Armadilha: é armada numa casa na sua vez e dispara em quem pisar.
   Acerto: se o D6 cair numa das faces impressas na carta, ela funciona. Não há D20 de ataque.
   Regras puras, sem DOM: cada ação devolve eventos para a interface animar. */
'use strict';
const CombatRules=(()=>{
 const W=10,H=7;
 const BLOCKED=[[3,1],[6,5],[2,5],[7,1]];
 const ENEMY_CARDS={
  golpe:{name:'Golpe',type:'Ação',kind:'attack',dice:[1,2,3,4],range:1,dmg:3,icon:'fist',text:'Avança e golpeia: 3 de dano em alcance 1.'},
  maos:{name:'Mãos que prendem',type:'Ação',kind:'attack',dice:[1,2,3,5],range:2,dmg:2,contido:true,icon:'hand',text:'2 de dano em alcance 2 e você fica Contido (não anda no seu próximo turno).'},
  acolher:{name:'Acolhimento sufocante',type:'Ação',kind:'area',dice:[1,2,4,5,6],radius:2,dmg:2,icon:'spiral',text:'2 de dano em todas as casas a até 2 dela.'},
  vozes:{name:'Vozes sob o véu',type:'Ação',kind:'psych',dice:[1,2,3,4,5,6],icon:'mask',text:'Teste de Resistência DT 13 ou −1 Sanidade. 2 de Proteção sua absorvem as vozes.'},
  veu:{name:'Véu de abrigo',type:'Reação',kind:'guard',dice:[1,2,3,4,5],shield:3,icon:'shield',text:'Reação: quando atacada, recebe 3 de Proteção antes do dano.'},
  badalada:{name:'Badalada',type:'Ação',kind:'area',dice:[1,3,5],radius:3,dmg:3,icon:'bell',text:'3 de dano em todas as casas a até 3 dele.'},
  carimbo:{name:'Carimbo',type:'Ação',kind:'attack',dice:[1,2,3],range:1,dmg:1,stamp:true,icon:'document',text:'1 de dano e carimba uma carta da sua mão (fora por 1 rodada).'},
  giz:{name:'Risco de giz',type:'Ação',kind:'attack',dice:[1,2,3],range:1,dmg:1,slow:true,icon:'quill',text:'1 de dano e −1 movimento no seu próximo turno.'}
 };
 const ENEMIES={
  elvira:{name:'Dona Elvira',title:'A Misericórdia Corrompida',art:'assets/web/elvira-demon.webp',hp:13,init:2,move:2,boss:true,deck:['maos','golpe','acolher','vozes','veu','golpe'],summon:'escrevente'},
  eco:{name:'Eco do Contrato',title:'A dívida que você sustentou',art:'assets/web/eco.webp',hp:12,init:2,move:2,boss:true,deck:['golpe','vozes','acolher','veu','golpe','maos'],summon:'giz'},
  guardiao:{name:'Guardião do Prazo',title:'O tempo exige garantia',art:'assets/web/guardiao.webp',hp:14,init:1,move:1,boss:true,deck:['golpe','badalada','veu','vozes','golpe','maos'],summon:'escrevente'},
  escrevente:{name:'Escrevente Sem Boca',title:'Fragmento · Portão I',art:'assets/web/eco.webp',hp:4,init:0,move:2,deck:['carimbo']},
  giz:{name:'Cobrador de Giz',title:'Fragmento · Portão I',art:'assets/web/guardiao.webp',hp:4,init:0,move:2,deck:['giz']}
 };
 let rng=n=>1+Math.floor(Math.random()*n);
 const setRng=f=>{rng=f};
 const d=n=>rng(n);
 const key=(x,y)=>x+','+y;
 const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
 const blocked=(c,x,y)=>x<0||y<0||x>=W||y>=H||c.blocked.some(([bx,by])=>bx===x&&by===y);
 function occupied(c,x,y,ignore){if(c.player.x===x&&c.player.y===y&&ignore!=='player')return true;return c.enemies.some(e=>e.hp>0&&e.x===x&&e.y===y&&e.uid!==ignore)}
 function lineClear(c,a,b){const n=Math.max(Math.abs(b.x-a.x),Math.abs(b.y-a.y))*3;for(let i=1;i<n;i++){const x=Math.round(a.x+(b.x-a.x)*i/n),y=Math.round(a.y+(b.y-a.y)*i/n);if((x!==a.x||y!==a.y)&&(x!==b.x||y!==b.y)&&c.blocked.some(([bx,by])=>bx===x&&by===y))return false}return true}
 function bfs(c,start,maxSteps,who){const seen=new Map([[key(start.x,start.y),null]]),depth=new Map([[key(start.x,start.y),0]]),q=[start];for(let i=0;i<q.length;i++){const p=q[i],dd=depth.get(key(p.x,p.y));if(dd>=maxSteps)continue;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,k=key(x,y);if(seen.has(k)||blocked(c,x,y)||occupied(c,x,y,who))continue;seen.set(k,p);depth.set(k,dd+1);q.push({x,y})}}return{seen,depth}}
 function pathTo(c,start,end,maxSteps,who){const {seen}=bfs(c,start,maxSteps,who),k=key(end.x,end.y);if(!seen.has(k))return null;const out=[];let p={x:end.x,y:end.y};while(p){out.unshift(p);p=seen.get(key(p.x,p.y))}return out}
 const shuffleArr=a=>{const r=[...a];for(let i=r.length-1;i>0;i--){const j=d(i+1)-1;[r[i],r[j]]=[r[j],r[i]]}return r};
 let uidN=0;const uid=()=>'k'+(Date.now()%100000)+'_'+(uidN++);
 function spawn(kind,x,y){const t=ENEMIES[kind];return{uid:uid(),kind,name:t.name,title:t.title,art:t.art,x,y,hp:t.hp,maxHp:t.hp,move:t.move,init:t.init,boss:!!t.boss,shield:0,status:{},deck:shuffleArr(t.deck),committed:null,known:false,summoned:false}}
 /* ---------- criação ---------- */
 function create(profile,route,opts={}){
  const bossKind=route==='mercy'?'eco':route==='defer'?'guardiao':'elvira';
  const hp=maxHp(profile);
  const c={v:6,route,round:0,phase:'plan',order:[],turnIdx:0,blocked:BLOCKED.map(p=>[...p]),
   profile:{sector:profile.sector,sinChoice:profile.sinChoice,skills:profile.skills||[],instrument:profile.instrument||'papel',name:profile.name||'Searcher',gender:profile.gender||'homem'},
   player:{x:1,y:3,hp,maxHp:hp,shield:0,moveBase:3,moveLeft:0,status:{},res:0,nextAtk:0,reduce:0,retaliate:0,thorns:0,verdict:Math.min(2,opts.proofs||0),usedBastion:false,usedReciprocity:false,usedGamble:false,usedEncanto:false,usedNet:false,usedTraitor:false,usedEnvy:false,firstStrike:false,attackedThisRound:false,instrumentAt:0,pistolAt:0,miliciaAt:0,pasta:false,sanityLost:0,guardOnBlock:false,autoOnBlock:false,committed:null,revealed:false,reaction:null,burned:false},
   hand:[],pile:[],discard:[],banned:[],stamped:[],fhand:[],fpile:[],fdiscard:[],armed:null,traps:[],lastResort:true,pending:null,
   enemies:[spawn(bossKind,8,3)],result:null,sanity:10};
  if(opts.harder){c.enemies[0].hp+=3;c.enemies[0].maxHp+=3}
  c.pile=shuffleArr(starterDeck(profile.sector).map(id=>({uid:uid(),id})));
  c.fpile=shuffleArr(formationDeck(profile.skills||[],profile.sinChoice).map(s=>({uid:uid(),skill:s})));
  return c;
 }
 function drawAction(c,n,ev){for(let i=0;i<n;i++){if(!c.pile.length){if(!c.discard.length)break;c.pile=shuffleArr(c.discard);c.discard=[];ev&&ev.push({t:'log',text:'O descarte foi reembaralhado.'})}const card=c.pile.pop();if(card)c.hand.push(card)}}
 function drawForm(c,n){for(let i=0;i<n;i++){if(c.fhand.length+(c.armed?1:0)>=4)return;if(!c.fpile.length){c.fpile=shuffleArr(c.fdiscard);c.fdiscard=[]}const f=c.fpile.pop();if(f)c.fhand.push(f)}}
 function begin(c){const ev=[];drawAction(c,3,ev);drawForm(c,2);ev.push(...startRound(c,true));return ev}
 /* ---------- rodada: planejamento ---------- */
 function startRound(c,first=false){const ev=[];c.round++;c.phase='plan';c.order=[];c.turnIdx=0;const p=c.player;
  p.committed=null;p.revealed=false;p.attackedThisRound=false;p.usedBastion=false;p.usedReciprocity=false;p.usedGamble=false;p.usedEncanto=false;
  if(!first){drawAction(c,1,ev);drawForm(c,1)}
  if(c.stamped.length){c.hand.push(...c.stamped);c.stamped=[];ev.push({t:'log',text:'As cartas carimbadas voltam à sua mão.'})}
  for(const e of c.enemies){if(e.hp<=0)continue;if(!e.deck.length)e.deck=shuffleArr(ENEMIES[e.kind].deck);e.committed={key:e.deck.pop()};e.known=false}
  ev.push({t:'round',round:c.round,text:`Rodada ${c.round}: escolha uma carta. Todos viram a sua ao mesmo tempo.`});return ev}
 function pistolReady(c){return c.round>=c.player.pistolAt}
 /* Escolher (ou trocar) a carta virada do Searcher. 'pistol' usa a Pistola. */
 function commit(c,choice,option=null){if(c.phase!=='plan')return{error:'Só é possível escolher a carta no planejamento.'};const p=c.player;
  if(p.committed?.ref){c.hand.push(p.committed.ref)}p.committed=null;
  if(choice===null)return{ev:[]};
  if(choice==='pistol'){if(!pistolReady(c))return{error:'A Pistola está recarregando.'};p.committed={kind:'pistol'};return{ev:[]}}
  const i=c.hand.findIndex(x=>x.uid===choice);if(i<0)return{error:'Carta fora da mão.'};const ref=c.hand[i],card=CARDS[ref.id];
  if(card.kind==='choice'&&option==null)return{error:'Escolha a face A ou B.'};
  c.hand.splice(i,1);p.committed={kind:'card',ref,option};return{ev:[]}}
 /* Todos viraram: rola iniciativa e começa a resolver em ordem. */
 function confirm(c){if(c.phase!=='plan')return{error:'Agora não.'};const p=c.player;if(c.hand.length>5)return{error:`Mão máxima: 5 Ações. Descarte ${c.hand.length-5} antes de virar.`};
  const ev=[];
  if(p.committed?.kind==='card'&&CARDS[p.committed.ref.id].type==='Reação'){p.reaction=p.committed.ref;ev.push({t:'log',text:'Sua Reação fica armada a rodada toda. Ela vira quando você for atacado.'})}
  let pb=skillBonus(c.profile,'Percepção');const parts=[];if(pb)parts.push('Percepção +'+pb);if(c.armed&&c.armed.skill==='Percepção'){pb+=2;parts.push('Formação +2');c.fdiscard.push(c.armed);c.armed=null}
  const rolls=[{id:'player',n:d(20),bonus:pb}];for(const e of c.enemies)if(e.hp>0)rolls.push({id:e.uid,n:d(20),bonus:e.init});
  for(const r of rolls)r.total=r.n+r.bonus;
  rolls.sort((a,b)=>b.total-a.total||(a.id==='player'?-1:b.id==='player'?1:0));c.order=rolls.map(r=>r.id);
  ev.push({t:'initiative',rolls:rolls.map(r=>({id:r.id,n:r.n,bonus:r.bonus,total:r.total,name:r.id==='player'?c.profile.name:c.enemies.find(e=>e.uid===r.id).name})),detail:parts.join(', ')});
  c.phase='turn';c.turnIdx=0;ev.push(...advance(c));return{ev}}
 /* Avança pela ordem até a vez do Searcher, ou até o fim da rodada. */
 function advance(c){const ev=[];while(c.turnIdx<c.order.length&&!c.result){const id=c.order[c.turnIdx];
   if(id==='player'){if(c.player.hp<=0){c.turnIdx++;continue}ev.push(...startPlayerTurn(c));if(c.player.status.colapso){delete c.player.status.colapso;ev.push({t:'log',text:'Colapso: sua mente não responde. Você perde este turno.'});c.turnIdx++;continue}c.phase='player';return ev}
   const e=c.enemies.find(x=>x.uid===id);if(e&&e.hp>0){ev.push({t:'turn',who:e.uid,text:`Vez de ${e.name}.`});ev.push(...enemyTurn(c,e));ev.push(...checkEnd(c))}c.turnIdx++}
  if(c.result)return ev;ev.push(...endRound(c));return ev}
 function endRound(c){const ev=[],p=c.player;
  if(p.reaction){c.hand.push(p.reaction);ev.push({t:'log',text:`${CARDS[p.reaction.id].name} não foi usada e volta à sua mão.`});p.reaction=null}
  for(const e of c.enemies)e.committed=null;
  c.enemies=c.enemies.filter(e=>e.hp>0||e.boss);
  if(p.defenseRight&&!p.attackedThisRound)ev.push(gain(c,1,'Autos'));p.defenseRight=false;
  ev.push(...startRound(c));return ev}
 function startPlayerTurn(c){const p=c.player,ev=[{t:'turn',who:'player',text:'Sua vez: ande e revele sua carta.'}];
  p.shield=0;p.moveLeft=p.status.contido?0:Math.max(0,p.moveBase-(p.status.lento?1:0));delete p.status.lento;p.burned=false;p.firstStrike=false;
  if(p.status.contido)ev.push({t:'log',text:'Contido: você não consegue andar neste turno.'});
  if(p.status.sangramento){p.status.sangramento--;if(!p.status.sangramento)delete p.status.sangramento;ev.push(...hurtPlayer(c,1,'Sangramento',null,true))}
  return ev}
 /* ---------- movimento ---------- */
 function reachable(c){const p=c.player;if(c.phase!=='player')return[];const {depth}=bfs(c,p,p.moveLeft,'player');return [...depth.entries()].filter(([,v])=>v>0).map(([k])=>k)}
 function move(c,x,y){const p=c.player;if(c.phase!=='player')return null;const path=pathTo(c,p,{x,y},p.moveLeft,'player');if(!path||path.length<2)return null;p.moveLeft-=path.length-1;p.x=x;p.y=y;if(p.status.oculto&&c.enemies.some(e=>e.hp>0&&dist(e,p)<=1))delete p.status.oculto;return[{t:'move',who:'player',path}]}
 function enemyAt(c,u){return c.enemies.find(e=>e.uid===u&&e.hp>0)}
 function cardRange(card,opt){if(card==='pistol')return WEAPON.range;if(opt?.range!=null)return opt.range;if(card.range==='weapon')return WEAPON.range;return card.range??0}
 function needsTarget(card,opt){if(!card)return false;if(card==='pistol')return true;if(card.type&&card.type!=='Ação')return false;if(card.kind==='choice')return!!(opt&&(opt.attack||opt.target));return card.kind==='attack'||card.kind==='mark'}
 function validTargets(c,card,opt){if(card==='pistol')return c.enemies.filter(e=>e.hp>0&&dist(c.player,e)<=WEAPON.range&&lineClear(c,c.player,e)).map(e=>e.uid);if(!needsTarget(card,opt))return[];const r=card.id==='I09'?3:cardRange(card,opt);return c.enemies.filter(e=>e.hp>0&&dist(c.player,e)<=r&&(r<=1||lineClear(c,c.player,e))).map(e=>e.uid)}
 function trapCells(c){const p=c.player,out=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(Math.abs(x-p.x)+Math.abs(y-p.y)>2||blocked(c,x,y)||occupied(c,x,y)||c.traps.some(t=>t.x===x&&t.y===y))continue;out.push(key(x,y))}return out}
 function isolated(c,e){return!c.enemies.some(o=>o!==e&&o.hp>0&&dist(o,e)<=1)}
 /* ---------- dano ---------- */
 function enemyReact(c,e,ev){if(e.committed?.key!=='veu'||e.hp<=0)return;const card=ENEMY_CARDS.veu;e.committed=null;e.known=true;const n=d(6),ok=card.dice.includes(n);ev.push({t:'enemyReveal',who:e.uid,key:'veu',text:`${e.name} vira uma Reação: ${card.name}.`});ev.push({t:'d6',card:`${e.name} · ${card.name}`,value:n,dice:card.dice,ok,enemy:true});if(ok){e.shield+=card.shield;ev.push({t:'shield',who:e.uid,amount:card.shield,text:`${e.name}: +${card.shield} Proteção.`})}}
 function damageEnemy(c,e,amount,{weapon=false}={}){const p=c.player,ev=[],notes=[];enemyReact(c,e,ev);let dmg=amount;
  if(weapon){dmg+=WEAPON.damage;notes.push('Pistola +2')}
  if(p.nextAtk){dmg+=p.nextAtk;notes.push(`preparo +${p.nextAtk}`);p.nextAtk=0}
  if(p.pasta){dmg+=1;notes.push('Pasta +1');p.pasta=false}
  if(p.verdict>0){dmg+=1;p.verdict--;notes.push('Veredito +1')}
  if(e.status.exposto){dmg+=1;notes.push('Exposto +1');delete e.status.exposto}
  if(e.status.observado){dmg+=1;notes.push('Observado +1');delete e.status.observado}
  if(c.profile.sinChoice==='Ganancioso'&&c.banned.length){const g=Math.min(3,c.banned.length);dmg+=g;notes.push(`Tudo Meu +${g}`)}
  if(c.profile.sector==='DOUTRINA'&&!p.firstStrike&&isolated(c,e)){dmg+=2;notes.push('Sentença Solitária +2')}
  if(p.status.oculto){dmg+=2;notes.push('Oculto +2');delete p.status.oculto}
  p.firstStrike=true;p.attackedThisRound=true;
  const blockedAmt=Math.min(e.shield,dmg);e.shield-=blockedAmt;const real=Math.min(e.hp,dmg-blockedAmt);e.hp-=real;
  ev.push({t:'hit',from:'player',to:e.uid,amount:real,blocked:blockedAmt,hpAfter:e.hp,text:`${e.name} sofre ${real} de dano${blockedAmt?` (${blockedAmt} bloqueado)`:''}${notes.length?' · '+notes.join(', '):''}.`});
  if(e.hp<=0)ev.push({t:'down',who:e.uid,text:`${e.name} cai.`});
  return ev}
 function protect(c,n,label){const p=c.player;p.shield+=n;const ev=[{t:'shield',who:'player',amount:n,text:`${label}: +${n} Proteção.`}];if(c.profile.sector==='RELAÇÃO'&&!p.usedReciprocity){p.usedReciprocity=true;p.shield+=1;ev.push({t:'shield',who:'player',amount:1,text:'Reciprocidade: +1 Proteção.'})}return ev}
 function heal(c,n,label){const p=c.player,real=Math.min(n,p.maxHp-p.hp);p.hp+=real;const ev=[{t:'heal',who:'player',amount:real,hpAfter:p.hp,text:`${label}: +${real} Vida.`}];if(c.profile.sector==='RELAÇÃO'&&!p.usedReciprocity&&real>0){p.usedReciprocity=true;p.shield+=1;ev.push({t:'shield',who:'player',amount:1,text:'Reciprocidade: +1 Proteção.'})}return ev}
 const gain=(c,n,name)=>{c.player.res+=n;return{t:'res',amount:n,text:`+${n} ${name||SECTOR_DATA[c.profile.sector].resource}.`}};
 /* ---------- efeitos Hells (cartas de Ação) ---------- */
 function effect(c,card,opt,target){
  const p=c.player,e=target?enemyAt(c,target):null,ev=[];const A=opt===0;
  const atk=(n,o={})=>{if(!e||e.hp<=0)return;ev.push(...damageEnemy(c,e,n,o))};
  switch(card.id){
   case'U01':atk(1,{weapon:true});break;
   case'U04':p.moveLeft+=2;ev.push({t:'buff',text:'+2 de movimento.'});break;
   case'U05':e.status.exposto=1;ev.push({t:'status',who:e.uid,text:`${e.name} fica Exposto (+1 no próximo dano).`});break;
   case'U06':ev.push(...heal(c,2,card.name));break;
   case'U08':p.moveLeft+=3;ev.push({t:'buff',text:'+3 de movimento para se afastar.'});break;
   case'U09':ev.push(...protect(c,1,card.name));c.enemies.forEach(x=>{if(x.committed)x.known=true});ev.push({t:'log',text:'Pressentimento: você vê as cartas viradas dos inimigos.'});break;
   case'U10':{atk(3);const real=Math.min(1,p.hp-1);p.hp-=real;ev.push({t:'self',amount:real,hpAfter:p.hp,text:'Último Recurso cobra 1 de Vida.'});break}
   case'I02':atk(2);if(e&&e.hp>0){const nx=e.x+Math.sign(e.x-p.x)*(Math.abs(e.x-p.x)>=Math.abs(e.y-p.y)?1:0),ny=e.y+Math.sign(e.y-p.y)*(Math.abs(e.x-p.x)<Math.abs(e.y-p.y)?1:0);if(!blocked(c,nx,ny)&&!occupied(c,nx,ny)){e.x=nx;e.y=ny;ev.push({t:'push',who:e.uid,to:[nx,ny],text:`${e.name} é empurrado.`})}}break;
   case'I04':atk(3);if(e&&e.hp>0){e.status.lento=1;ev.push({t:'status',who:e.uid,text:`${e.name} perde 1 de movimento.`})}break;
   case'I07':if(p.res>=2){p.res-=2;atk(4)}else{ev.push({t:'log',text:'Sem 2 Guarda: o golpe sai fraco (1 de dano).'});atk(1)}break;
   case'I08':ev.push(...protect(c,3,card.name));break;
   case'I09':{if(dist(p,e)>1){const adj=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:e.x+dx,y:e.y+dy})).filter(q=>!blocked(c,q.x,q.y)&&!occupied(c,q.x,q.y,'player')).map(q=>({q,path:pathTo(c,p,q,2,'player')})).filter(o=>o.path).sort((a,b)=>a.path.length-b.path.length)[0];if(!adj){ev.push({t:'log',text:'Não há caminho de 2 casas até o alvo.'});break}p.x=adj.q.x;p.y=adj.q.y;ev.push({t:'move',who:'player',path:adj.path})}atk(2);break}
   case'J03':e.status.exposto=1;ev.push({t:'status',who:e.uid,text:`${e.name} fica Exposto.`});if(e.status.julgamento)ev.push(gain(c,1));break;
   case'J05':atk(e.status.julgamento?4:2);break;
   case'J07':ev.push(...protect(c,2,card.name));p.defenseRight=true;break;
   case'J09':if(p.res>=2&&e.status.julgamento){p.res-=2;atk(4)}else atk(1);break;
   case'J10':if(e?.status.julgamento)atk(2);else ev.push(...protect(c,2,card.name));break;
   case'R01':A?atk(2):ev.push(...protect(c,2,card.name));break;
   case'R02':A?ev.push(...heal(c,2,card.name)):(p.moveLeft+=2,ev.push({t:'buff',text:'+2 de movimento.'}));break;
   case'R03':if(A){atk(1);drawAction(c,1,ev);ev.push({t:'draw',n:1,text:'Você compra 1 carta.'})}else ev.push(...protect(c,2,card.name));break;
   case'R04':if(A)atk(2);else{const nx=e.x+Math.sign(e.x-p.x),ny=e.y+(e.x===p.x?Math.sign(e.y-p.y):0);if(!blocked(c,nx,ny)&&!occupied(c,nx,ny)){e.x=nx;e.y=ny;ev.push({t:'push',who:e.uid,to:[nx,ny],text:`${e.name} é empurrado.`})}ev.push(...protect(c,1,card.name))}break;
   case'R05':if(A){drawAction(c,1,ev);ev.push({t:'draw',n:1,text:'Você compra 1 carta.'})}else{if(e.committed){e.committed=null;ev.push({t:'status',who:e.uid,text:`${e.name} perde a carta virada.`})}else{e.status.enfraquecido=1;ev.push({t:'status',who:e.uid,text:`${e.name}: −2 no próximo dano.`})}}break;
   case'R06':if(A)ev.push(...heal(c,1,card.name));else{atk(2);p.hp=Math.max(1,p.hp-1);ev.push({t:'self',amount:1,hpAfter:p.hp,text:'Troca Justa cobra 1 de Vida.'})}break;
   case'R07':if(A){p.moveLeft+=2;ev.push({t:'buff',text:'+2 de movimento.'},...protect(c,1,card.name))}else{atk(1);ev.push(...heal(c,1,card.name))}break;
   case'R08':if(A){e.status.exposto=1;ev.push({t:'status',who:e.uid,text:`${e.name} fica Exposto.`})}else ev.push(...heal(c,2,card.name));break;
   case'R09':if(A){p.nextAtk+=1;ev.push({t:'buff',text:'+1 de dano no próximo ataque.'})}else{drawAction(c,1,ev);ev.push({t:'draw',n:1,text:'Você compra 1 carta.'})}break;
   case'R10':if(p.res>=2){p.res-=2;atk(3);ev.push(...protect(c,2,card.name))}else atk(1);break;
   case'S02':ev.push(...heal(c,2,card.name));break;
   case'S04':ev.push(...protect(c,1,card.name));p.nextAtk+=1;ev.push({t:'buff',text:'+1 de dano no próximo ataque.'});break;
   case'S05':ev.push(...protect(c,2,card.name));break;
   case'S07':if(p.res>=1){p.res-=1;ev.push(...heal(c,3,card.name));for(const s of['sangramento','abalado','contido'])delete p.status[s]}else ev.push({t:'log',text:'Sem Laços para se reerguer.'});break;
   case'S08':ev.push(...protect(c,2,card.name));if(p.sanityLost>0){p.sanityLost--;ev.push({t:'sanity',amount:1,text:'Palavra de Amparo: +1 Sanidade.'})}break;
   case'S10':if(p.hp<=p.maxHp/2){ev.push(...heal(c,3,card.name),...protect(c,2,card.name))}else ev.push({t:'log',text:'Todos Voltam só responde com metade ou menos da Vida.'});break;
   case'D01':atk(isolated(c,e)?4:2);break;
   case'D02':p.moveLeft+=4;ev.push({t:'buff',text:'+4 de movimento, ignorando controle.'});break;
   case'D03':atk(3);break;
   case'D06':atk(3);if(e&&e.hp>0){e.status.sangramento=2;ev.push({t:'status',who:e.uid,text:`${e.name} sangra por 2 rodadas.`})}break;
   case'D07':p.moveLeft+=3;p.nextAtk+=1;ev.push({t:'buff',text:'+3 de movimento e +1 de dano no próximo ataque.'});break;
   case'D08':atk(isolated(c,e)?5:3);break;
   default:ev.push({t:'log',text:`${card.name} não tem efeito em Ação.`});
  }
  if(card.sector==='RELAÇÃO'&&card.kind==='choice'){if(p.lastOption!=null&&p.lastOption!==opt)ev.push(gain(c,1,'Equilíbrio'));p.lastOption=opt}
  return ev}
 /* ---------- revelar na sua vez ---------- */
 function canReveal(c){const p=c.player;return c.phase==='player'&&!p.revealed&&!c.pending&&!!p.committed&&!(p.committed.kind==='card'&&CARDS[p.committed.ref.id].type==='Reação')}
 function reveal(c,{target=null,cell=null,asShot=false,guess=null}={}){
  const p=c.player;if(!canReveal(c))return{error:'Não há carta para revelar agora.'};const com=p.committed;
  if(com.kind==='pistol'||asShot){if(!validTargets(c,'pistol').includes(target))return{error:`A Pistola alcança ${WEAPON.range} casas com linha de visão.`};p.revealed=true;p.pistolAt=c.round+2;if(com.kind==='card')c.discard.push(com.ref);return activateShot(c,target,guess,com.kind==='card'?CARDS[com.ref.id].name:null)}
  const card=CARDS[com.ref.id],opt=card.kind==='choice'?card.options[com.option??0]:null;
  if(card.type==='Armadilha'){if(!cell||!trapCells(c).includes(cell))return{error:'Arme a armadilha numa casa livre a até 2 de você.'};const [x,y]=cell.split(',').map(Number);if(c.traps.length>=2){const old=c.traps.shift();c.discard.push(old.ref)}c.traps.push({ref:com.ref,x,y});p.revealed=true;return{ev:[{t:'trap',x,y,id:card.id,text:`${card.name} armada. Quem pisar ali dispara.`}]}}
  if(needsTarget(card,opt)&&!validTargets(c,card,opt).includes(target))return{error:'Escolha um alvo ao alcance e na linha de visão.'};
  p.revealed=true;return activate(c,com.ref,{option:com.option,target,guess});
 }
 function activateShot(c,target,guess,fromCard){const ev=[];const n=d(6),ok=WEAPON.dice.includes(n);ev.push({t:'reveal',id:'PIS',text:fromCard?`${fromCard} vira de lado: disparo com a Pistola.`:'Disparo com a Pistola.'});ev.push({t:'d6',card:'Pistola',value:n,dice:WEAPON.dice,ok,guess});
  if(!ok){ev.push({t:'miss',from:'player',to:target,text:'O disparo erra.'});return{ev}}
  const e=enemyAt(c,target);if(!e)return{ev};ev.push(...damageEnemy(c,e,1,{weapon:true}));
  if(c.profile.sinChoice==='Conselho de Onça'&&e.hp>0){e.shield=0;e.status.enfraquecido=1;ev.push({t:'status',who:e.uid,text:'Conselho de Onça: o alvo perde a Proteção e causa 2 a menos no próximo ataque.'})}
  ev.push(...checkEnd(c));return{ev}}
 function activate(c,ref,{option,target,guess},rerolled=false){
  const card=CARDS[ref.id],p=c.player,ev=[];if(!rerolled)ev.push({t:'reveal',id:card.id,text:`Você revela ${card.name}.`});
  const n=d(6),ok=card.dice.includes(n);ev.push({t:'d6',card:card.name,value:n,dice:card.dice,ok,guess});
  if(c.profile.sinChoice==='Apostador'&&guess&&!p.usedGamble&&guess===n){p.usedGamble=true;const t=c.enemies.find(e=>e.hp>0&&dist(p,e)<=WEAPON.range&&lineClear(c,p,e));ev.push({t:'log',text:`Jogada Marcada: você cantou o ${n}.`});if(t)ev.push(...activateShot(c,t.uid,null,null).ev);else ev.push(...protect(c,1,'Jogada Marcada'))}
  if(!ok){const canResort=c.lastResort&&!rerolled,canMirror=c.profile.instrument==='espelho'&&c.round>=p.instrumentAt&&!rerolled;
   if(canResort||canMirror){c.pending={ref,option,target,guess,mirror:canMirror,resort:canResort};ev.push({t:'pending',text:'A carta falhou no D6.'});return{ev}}
   c.discard.push(ref);ev.push({t:'fizzle',text:`${card.name} não ativou (D6 ${n}).`});return{ev}}
  c.discard.push(ref);ev.push(...effect(c,card,option,target));ev.push(...checkEnd(c));return{ev}}
 /* Último Recurso (1×/Cena): 1 Sanidade para rolar o D6 de novo. Espelho de Bolso: sem custo. */
 function resolvePending(c,choice){const pend=c.pending;if(!pend)return{ev:[]};c.pending=null;const ev=[];
  if(choice==='resort'&&pend.resort){c.lastResort=false;c.player.sanityLost++;ev.push({t:'sanity',amount:-1,text:'Último Recurso: −1 Sanidade. O novo D6 é obrigatório.'})}
  else if(choice==='mirror'&&pend.mirror){c.player.instrumentAt=c.round+INSTRUMENTS.espelho.recharge;ev.push({t:'log',text:'Espelho de Bolso: você vê outro resultado.'})}
  else{c.discard.push(pend.ref);ev.push({t:'fizzle',text:`${CARDS[pend.ref.id].name} não ativou.`});return{ev}}
  const r=activate(c,pend.ref,pend,true);return{ev:[...ev,...r.ev]}}
 /* Encerrar a vez do Searcher. Uma Ação não revelada é perdida. */
 function endTurn(c){if(c.phase!=='player'||c.pending)return{error:'Agora não.'};const p=c.player,ev=[];
  if(p.committed&&!p.revealed&&p.committed.kind==='card'&&CARDS[p.committed.ref.id].type!=='Reação'){c.discard.push(p.committed.ref);ev.push({t:'log',text:`${CARDS[p.committed.ref.id].name} não foi revelada e se perde.`})}
  delete p.status.contido;c.phase='turn';c.turnIdx++;ev.push(...advance(c));return{ev}}
 function burn(c,u){const p=c.player;if(c.phase!=='player'||p.burned)return{error:'Queime 1 carta por turno, na sua vez.'};const i=c.hand.findIndex(x=>x.uid===u);if(i<0)return{error:'Carta fora da mão.'};const ref=c.hand.splice(i,1)[0];p.burned=true;c.banned.push(ref);p.moveLeft+=3;return{ev:[{t:'burn',text:`${CARDS[ref.id].name} queimada: +3 de movimento. Banida até a próxima Cena.`}]}}
 function discard(c,u){const i=c.hand.findIndex(x=>x.uid===u);if(i<0)return{error:'Carta fora da mão.'};const ref=c.hand.splice(i,1)[0];c.discard.push(ref);return{ev:[{t:'log',text:`${CARDS[ref.id].name} descartada.`}]}}
 function arm(c,fu){if(c.armed&&c.armed.uid===fu){c.fhand.push(c.armed);c.armed=null;return{ev:[]}}const i=c.fhand.findIndex(f=>f.uid===fu);if(i<0)return{error:'Formação fora da mão.'};if(!['Percepção','Resistência'].includes(c.fhand[i].skill))return{error:'No combate, Formação ajuda na iniciativa (Percepção) e contra as vozes (Resistência).'};if(c.armed)c.fhand.push(c.armed);c.armed=c.fhand.splice(i,1)[0];return{ev:[{t:'log',text:`Formação preparada: ${c.armed.skill} (+2 no próximo teste).`}]}}
 function instrumentReady(c){return c.round>=c.player.instrumentAt}
 function useInstrument(c){const p=c.player,inst=c.profile.instrument;if(c.phase!=='player'||!instrumentReady(c))return{error:'Instrumento em recarga ou fora da sua vez.'};if(inst==='espelho')return{error:'O Espelho é usado quando um D6 seu falha.'};const ev=[];p.instrumentAt=c.round+INSTRUMENTS[inst].recharge;
  if(inst==='papel'){drawAction(c,1,ev);ev.push({t:'draw',n:1,text:'Papel e Caneta: +1 Ação na mão.'})}
  if(inst==='pasta'){p.pasta=true;ev.push({t:'buff',text:'Pasta de Contratos: +1 de dano no próximo ataque.'})}
  if(inst==='distintivo')ev.push(...protect(c,2,'Distintivo Morto'));
  return{ev}}
 function usePassive(c,target){const p=c.player,ev=[];
  if(c.profile.sector==='SOCIALISTA'&&!p.usedNet){p.usedNet=true;p.shield+=2;ev.push({t:'shield',who:'player',amount:2,text:'Rede de Apoio: +2 Proteção.'});return{ev}}
  if(c.profile.sinChoice==='Miliciano'&&c.round>=p.miliciaAt){const t=enemyAt(c,target);const e=t&&t.committed?t:c.enemies.find(x=>x.hp>0&&x.committed);if(!e)return{error:'Nenhum inimigo com carta virada.'};p.miliciaAt=c.round+3;const name=ENEMY_CARDS[e.committed.key].name;e.committed=null;ev.push({t:'status',who:e.uid,text:`Apreender: você toma ${name} de ${e.name}.`});return{ev}}
  if(c.profile.sinChoice==='Traidor'&&!p.usedTraitor&&c.phase==='player'){p.usedTraitor=true;drawAction(c,2,ev);p.moveLeft+=3;p.sanityLost++;ev.push({t:'draw',n:2,text:'Por Trinta: +2 Ações e +3 de movimento.'},{t:'sanity',amount:-1});return{ev}}
  if(c.profile.sinChoice==='Invído'&&!p.usedEnvy&&c.fdiscard.length){p.usedEnvy=true;c.fhand.push(c.fdiscard.pop());ev.push({t:'log',text:'Inveja Formada: a última Formação descartada volta.'});return{ev}}
  return{error:'Nenhuma passiva ativável agora.'}}
 function passiveAvailable(c){const p=c.player;if(c.profile.sector==='SOCIALISTA'&&!p.usedNet)return'Rede de Apoio · +2 Proteção';if(c.profile.sinChoice==='Miliciano'&&c.round>=p.miliciaAt&&c.enemies.some(e=>e.hp>0&&e.committed))return'Apreender · tomar carta virada';if(c.profile.sinChoice==='Traidor'&&!p.usedTraitor&&c.phase==='player')return'Por Trinta · +2 Ações, +3 mov.';if(c.profile.sinChoice==='Invído'&&!p.usedEnvy&&c.fdiscard.length)return'Inveja Formada · recuperar Formação';return''}
 /* ---------- Reação do Searcher ---------- */
 function playerReact(c,e,ev){const p=c.player,ref=p.reaction;if(!ref)return{};p.reaction=null;const card=CARDS[ref.id];ev.push({t:'reveal',id:card.id,text:`Sua Reação vira: ${card.name}.`});const n=d(6),ok=card.dice.includes(n);ev.push({t:'d6',card:card.name,value:n,dice:card.dice,ok});c.discard.push(ref);
  if(!ok){ev.push({t:'fizzle',text:`${card.name} não ativou.`});return{}}
  switch(card.id){
   case'U02':case'U07':ev.push(...protect(c,2,card.name));break;
   case'I01':ev.push(...protect(c,3,card.name));p.guardOnBlock=true;break;
   case'I03':case'S03':p.reduce+=2;ev.push({t:'shield',who:'player',amount:2,text:`${card.name}: −2 neste dano.`});break;
   case'I05':p.reduce+=2;p.guardOnBlock=true;ev.push({t:'shield',who:'player',amount:2,text:'Não Recuo: −2 neste dano.'});break;
   case'I10':if(p.hp<=p.maxHp/2){ev.push(...protect(c,5,card.name));p.retaliate=2}else ev.push({t:'log',text:'Última Linha só responde com metade da Vida ou menos.'});break;
   case'J02':ev.push(...protect(c,2,card.name),gain(c,1));break;
   case'J04':if(p.res>=1){p.res-=1;ev.push(...protect(c,3,card.name));p.thorns=1}else ev.push({t:'log',text:'Sem Autos para a Balança.'});break;
   case'J06':ev.push(...protect(c,1,card.name));p.autoOnBlock=true;break;
   case'S01':ev.push(...protect(c,2,card.name));break;
   case'S09':if(p.res>=2){p.res-=2;ev.push(...protect(c,4,card.name))}else ev.push({t:'log',text:'Sem 2 Laços para o Pacto.'});break;
   case'D04':p.status.oculto=1;ev.push({t:'status',who:'player',text:'Vulto de Serviço: o ataque erra e você fica Oculto.'});return{dodge:true};
  }
  return{}}
 function hurtPlayer(c,amount,source,enemy,ignoreShield=false){const p=c.player,ev=[];let dmg=amount;const notes=[];
  if(!ignoreShield&&p.reduce){const r=Math.min(p.reduce,dmg);dmg-=r;if(r)notes.push(`−${r}`);if(r&&p.guardOnBlock){ev.push(gain(c,1,'Guarda'));p.guardOnBlock=false}}p.reduce=0;
  if(!ignoreShield&&c.profile.sector==='INCIDÊNCIA'&&!p.usedBastion&&dmg>0){p.usedBastion=true;dmg-=1;notes.push('Bastião −1')}
  let blockedAmt=0;if(!ignoreShield){blockedAmt=Math.min(p.shield,dmg);p.shield-=blockedAmt;dmg-=blockedAmt}
  if(blockedAmt>0){if(c.profile.sector==='SOCIALISTA')ev.push(gain(c,1,'Laços'));if(p.guardOnBlock){ev.push(gain(c,1,'Guarda'));p.guardOnBlock=false}if(p.autoOnBlock&&dmg<=0){ev.push(gain(c,1,'Autos'));p.autoOnBlock=false}}
  const real=Math.min(p.hp,Math.max(0,dmg));p.hp-=real;
  ev.push({t:'hit',from:enemy?.uid||'env',to:'player',amount:real,blocked:blockedAmt,hpAfter:p.hp,text:`${source}: ${real} de dano${blockedAmt?`, ${blockedAmt} bloqueado`:''}${notes.length?' ('+notes.join(', ')+')':''}.`});
  if(enemy&&p.retaliate&&enemy.hp>0){const r=Math.min(enemy.hp,p.retaliate);enemy.hp-=r;ev.push({t:'hit',from:'player',to:enemy.uid,amount:r,hpAfter:enemy.hp,text:`Última Linha revida: ${r} de dano.`});p.retaliate=0}
  if(enemy&&p.thorns&&enemy.hp>0){enemy.hp-=1;ev.push({t:'hit',from:'player',to:enemy.uid,amount:1,hpAfter:enemy.hp,text:'Balança de Ferro: 1 de dano no atacante.'});p.thorns=0}
  return ev}
 /* ---------- turno inimigo ---------- */
 function enemyRoll(c,e,card,ev){let n=d(6),ok=card.dice.includes(n);ev.push({t:'d6',card:`${e.name} · ${card.name}`,value:n,dice:card.dice,ok,enemy:true});
  if(ok&&c.profile.sinChoice==='Luxuosa'&&!c.player.usedEncanto){c.player.usedEncanto=true;n=d(6);ok=card.dice.includes(n);ev.push({t:'log',text:'Encanto: o D6 do inimigo rola de novo.'});ev.push({t:'d6',card:`${e.name} · Encanto`,value:n,dice:card.dice,ok,enemy:true})}
  return ok}
 function triggerTrap(c,e,trap,ev){const card=CARDS[trap.ref.id];c.traps=c.traps.filter(t=>t!==trap);c.discard.push(trap.ref);ev.push({t:'trapHit',x:trap.x,y:trap.y,who:e.uid,text:`${e.name} pisa em ${card.name}!`});const n=d(6),ok=card.dice.includes(n);ev.push({t:'d6',card:`Armadilha · ${card.name}`,value:n,dice:card.dice,ok});if(!ok){ev.push({t:'fizzle',text:'A armadilha não dispara.'});return}
  switch(card.id){
   case'U03':e.status.exposto=1;e.status.observado=1;ev.push({t:'status',who:e.uid,text:`${e.name} fica Exposto e Observado.`});break;
   case'I06':e.status.contido=1;e.status.exposto=1;ev.push({t:'status',who:e.uid,text:`${e.name} fica Contido e Exposto.`});break;
   case'J01':e.status.julgamento=2;ev.push({t:'status',who:e.uid,text:`${e.name} está Sob Julgamento.`},gain(c,1));break;
   case'J08':e.status.julgamento=2;e.status.enfraquecido=1;ev.push({t:'status',who:e.uid,text:`${e.name}: Sob Julgamento e −2 no próximo ataque.`});break;
   case'S06':if(e.boss){e.status.enfraquecido=1;ev.push({t:'status',who:e.uid,text:`Trégua: ${e.name} causa 2 a menos.`})}else{e.status.trégua=1;ev.push({t:'status',who:e.uid,text:`Trégua: ${e.name} não ataca.`})}break;
   case'D05':{const r=Math.min(e.hp,2);e.hp-=r;e.status.enfraquecido=1;ev.push({t:'hit',from:'env',to:e.uid,amount:r,hpAfter:e.hp,text:`${e.name} sofre 2 de dano e fica enfraquecido.`});if(e.hp<=0)ev.push({t:'down',who:e.uid,text:`${e.name} cai.`});break}
  }}
 function enemyWalk(c,e,wantRange){const p=c.player,ev=[];if(e.status.contido){delete e.status.contido;ev.push({t:'log',text:`${e.name} está Contido.`});return ev}if(dist(e,p)<=wantRange&&lineClear(c,e,p))return ev;
  const steps=Math.max(0,e.move-(e.status.lento?1:0));delete e.status.lento;if(!steps)return ev;
  const {depth}=bfs(c,e,steps,e.uid);let best=null,bestScore=1e9;for(const [k,dd] of depth){const [x,y]=k.split(',').map(Number);if(x===p.x&&y===p.y)continue;const dp=Math.abs(x-p.x)+Math.abs(y-p.y);const score=Math.max(0,dp-wantRange)*10+dd;if(score<bestScore){bestScore=score;best={x,y}}}
  if(!best||(best.x===e.x&&best.y===e.y))return ev;let path=pathTo(c,e,best,steps,e.uid);if(!path)return ev;
  const ti=path.findIndex((q,i)=>i>0&&c.traps.some(t=>t.x===q.x&&t.y===q.y));if(ti>0)path=path.slice(0,ti+1);
  const last=path[path.length-1];e.x=last.x;e.y=last.y;ev.push({t:'move',who:e.uid,path});
  const trap=c.traps.find(t=>t.x===e.x&&t.y===e.y);if(trap)triggerTrap(c,e,trap,ev);return ev}
 function enemyTurn(c,e){const p=c.player,ev=[];e.shield=0;
  if(e.status.sangramento){e.status.sangramento--;if(!e.status.sangramento)delete e.status.sangramento;const r=Math.min(e.hp,1);e.hp-=r;ev.push({t:'hit',from:'env',to:e.uid,amount:r,hpAfter:e.hp,text:`${e.name} sangra: 1 de dano.`});if(e.hp<=0){ev.push({t:'down',who:e.uid,text:`${e.name} cai.`});return ev}}
  if(e.status.julgamento){e.status.julgamento--;if(!e.status.julgamento)delete e.status.julgamento}
  if(e.boss&&!e.summoned&&e.hp<=Math.ceil(e.maxHp/2)){e.summoned=true;const spots=[[e.x,e.y-1],[e.x,e.y+1],[e.x-1,e.y],[e.x+1,e.y],[e.x-1,e.y-1],[e.x-1,e.y+1]].filter(([x,y])=>!blocked(c,x,y)&&!occupied(c,x,y));if(spots.length){const m=spawn(ENEMIES[e.kind].summon,spots[0][0],spots[0][1]);c.enemies.push(m);ev.push({t:'summon',who:m.uid,text:`${e.name} chama ${m.name}. Ele age a partir da próxima rodada.`})}}
  const k=e.committed?.key,card=ENEMY_CARDS[k];
  if(!card){ev.push(...enemyWalk(c,e,1));return ev}
  if(card.type==='Reação'){ev.push(...enemyWalk(c,e,1));ev.push({t:'log',text:`${e.name} mantém a carta virada.`});return ev}
  const want=card.kind==='attack'?card.range:card.kind==='area'?Math.max(1,card.radius-1):2;
  ev.push(...enemyWalk(c,e,want));if(e.hp<=0)return ev;
  e.committed=null;ev.push({t:'enemyReveal',who:e.uid,key:k,text:`${e.name} revela ${card.name}.`});
  if(e.status.trégua){delete e.status.trégua;ev.push({t:'log',text:`${e.name} hesita: Trégua.`});return ev}
  const weak=()=>{if(e.status.enfraquecido){delete e.status.enfraquecido;return 2}return 0};
  if(card.kind==='attack'){if(dist(e,p)>card.range||!lineClear(c,e,p)){ev.push({t:'log',text:`${e.name} não alcança você.`});return ev}
   const r=playerReact(c,e,ev);if(r.dodge){ev.push({t:'miss',from:e.uid,to:'player',text:'O golpe passa por um vulto.'});return ev}
   if(!enemyRoll(c,e,card,ev)){p.reduce=0;ev.push({t:'miss',from:e.uid,to:'player',text:`${card.name} erra.`});return ev}
   ev.push(...hurtPlayer(c,Math.max(0,card.dmg-weak()),`${e.name} · ${card.name}`,e));
   if(card.contido&&p.hp>0){p.status.contido=1;ev.push({t:'status',who:'player',text:'As mãos prendem você: Contido.'})}
   if(card.stamp&&c.hand.length){const i=d(c.hand.length)-1,ref=c.hand.splice(i,1)[0];c.stamped.push(ref);ev.push({t:'log',text:`Carimbo: ${CARDS[ref.id].name} fica fora da mão por 1 rodada.`})}
   if(card.slow){p.status.lento=1;ev.push({t:'status',who:'player',text:'Giz nas botas: −1 movimento no próximo turno.'})}
   return ev}
  if(card.kind==='area'){const cells=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(Math.abs(x-e.x)+Math.abs(y-e.y)<=card.radius&&!blocked(c,x,y))cells.push([x,y]);const inside=dist(e,p)<=card.radius;ev.push({t:'area',who:e.uid,cells,hit:inside});
   if(!inside){ev.push({t:'log',text:'Você está fora do alcance. A onda não chega.'});return ev}
   const r=playerReact(c,e,ev);if(r.dodge){ev.push({t:'miss',from:e.uid,to:'player',text:'A onda atravessa um vulto.'});return ev}
   if(!enemyRoll(c,e,card,ev)){p.reduce=0;ev.push({t:'miss',from:e.uid,to:'player',text:`${card.name} falha.`});return ev}
   ev.push(...hurtPlayer(c,Math.max(0,card.dmg-weak()),`${e.name} · ${card.name}`,e));return ev}
  if(card.kind==='psych'){if(p.shield>=2){p.shield-=2;ev.push({t:'log',text:'Sua Proteção sustenta a mente: as vozes se afastam (−2 Proteção).'});return ev}
   let bonus=skillBonus(c.profile,'Resistência');const parts=[];if(c.armed&&c.armed.skill==='Resistência'){bonus+=2;parts.push('Formação +2');c.fdiscard.push(c.armed);c.armed=null}if(c.sanity<=3){bonus-=2;parts.push('Sanidade baixa −2')}
   const n=d(20),total=n+bonus,ok=n===20||(n!==1&&total>=13);ev.push({t:'d20',label:'Resistência contra as vozes',natural:n,bonus,total,dc:13,hit:ok,detail:`${n}${bonus?(bonus>0?' + ':' − ')+Math.abs(bonus):''} = ${total} contra DT 13${parts.length?' · '+parts.join(', '):''}`});
   if(!ok){p.sanityLost++;ev.push({t:'sanity',amount:-1,text:'As vozes usam seu nome. −1 Sanidade.'})}else ev.push({t:'log',text:'Você não responde às vozes.'});return ev}
  return ev}
 function checkEnd(c){if(c.result)return[];const boss=c.enemies.find(e=>e.boss);if(boss&&boss.hp<=0){c.result='victory';c.phase='over';return[{t:'end',result:'victory'}]}if(c.player.hp<=0){c.result='defeat';c.phase='over';return[{t:'end',result:'defeat'}]}return[]}
 return{W,H,ENEMIES,ENEMY_CARDS,create,begin,commit,confirm,reveal,canReveal,move,endTurn,resolvePending,burn,discard,arm,useInstrument,usePassive,passiveAvailable,reachable,validTargets,needsTarget,cardRange,trapCells,dist,lineClear,instrumentReady,pistolReady,setRng,blocked:(c,x,y)=>blocked(c,x,y)};
})();
if(typeof module!=='undefined')module.exports=CombatRules;
