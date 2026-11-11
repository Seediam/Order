'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const box={};vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(root,'combat-rules.js'),'utf8')+'\nglobalThis.rules=CombatRules;',box);
const rules=box.rules;
function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
function run(seed){
 const random=seeded(seed),die=n=>Math.floor(random()*n)+1;
 const c={hp:34,maxHp:34,shield:0,bossHp:18,bossMax:18,bossShield:0,player:{x:1,y:2},boss:{x:7,y:2},badRolls:0,weak:0,action:1},state={sanity:10};let rounds=0;
 // Conservative baseline: only the persistent pistol, no cards, no healing, no sector benefit.
 while(c.hp>0&&c.bossHp>0&&rounds<100){
  rounds++;c.intent=rules.plan(rounds,c.player);
  if(c.intent.kind==='area'){const escape={x:c.player.x,y:c.player.y===2?0:2};c.player=escape}
  else{let steps=2;while(steps--&&Math.abs(c.player.x-c.boss.x)+Math.abs(c.player.y-c.boss.y)>2){if(c.player.y!==2)c.player.y+=Math.sign(2-c.player.y);else c.player.x+=Math.sign(c.boss.x-c.player.x)}}
  if(Math.abs(c.player.x-c.boss.x)+Math.abs(c.player.y-c.boss.y)<=2){const hit=rules.hit(c,die(20));if(hit.hit)rules.damage(c,rules.pistol.damage)}
  if(c.bossHp<=0)break;
  if(Math.abs(c.player.x-c.boss.x)+Math.abs(c.player.y-c.boss.y)>1){if(c.boss.y!==2)c.boss.y+=Math.sign(2-c.boss.y);else if(c.boss.x!==c.player.x)c.boss.x+=Math.sign(c.player.x-c.boss.x);else c.boss.y+=Math.sign(c.player.y-c.boss.y)}
  rules.resolve(c,state);
 }
 return{won:c.bossHp<=0,rounds,hp:c.hp};
}
const games=Array.from({length:2000},(_,i)=>run(i+1)),wins=games.filter(g=>g.won);
const report={simulations:games.length,wins:wins.length,winRate:wins.length/games.length,averageRounds:games.reduce((n,g)=>n+g.rounds,0)/games.length,minRemainingHp:Math.min(...wins.map(g=>g.hp)),strategy:'Pistola sem cartas, sem cura e sem bônus de Setor; sai da área anunciada.'};
assert.ok(report.winRate>=.9,'A estratégia conservadora deve vencer ao menos 90% das sementes');
const c={badRolls:0};assert.equal(rules.hit(c,1).hit,false);assert.equal(rules.hit(c,1).hit,false);assert.equal(rules.hit(c,1).hit,false);assert.equal(rules.hit(c,1).hit,true);
for(let die=1;die<=6;die++){const state={action:0,shield:0,badRolls:0};assert.equal(rules.activate(state,{dice:[1,3,6]},die),[1,3,6].includes(die),'D6 respeita valores da carta')}
fs.mkdirSync(path.join(__dirname,'evidence'),{recursive:true});fs.writeFileSync(path.join(__dirname,'evidence','balance.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
