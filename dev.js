/* Controls exist only on loopback with ?dev=1. Preview links never write campaign saves. */
'use strict';
function mountDevPanel(){
 if(!DEV_MODE||document.getElementById('dev-panel'))return;
 const panel=document.createElement('details');panel.id='dev-panel';
 panel.innerHTML='<summary>LAB · ANIMAÇÕES</summary><div>'+['Olho','Digitação','Respiração','Iluminação','Fade','Caminhada','Compra','Transformação','Terror','Ataque','Dano'].map((label,i)=>`<button type="button" data-demo="${i}">${label}</button>`).join('')+'</div>';
 document.body.append(panel);
 panel.addEventListener('click',async e=>{const b=e.target.closest('[data-demo]');if(!b||Cinematics.busy)return;
  switch(Number(b.dataset.demo)){
   case 0:S.stage='intro';S.introOpened=false;render();break;
   case 1:case 2:S.stage='vn';S.node='welcome';render();break;
   case 3:await Cinematics.playLightFlicker();break;
   case 4:await Cinematics.fadeToBlack();await Cinematics.fadeFromBlack();break;
   case 5:S.stage='combat';S.combat=initialCombat();render();move(3,2);break;
   case 6:if(S.stage!=='combat'||S.combat.hand.length>=7){S.stage='combat';S.combat=initialCombat()}drawCard(S.combat);render();break;
   case 7:S.stage='vn';S.node='hell4';render();await Cinematics.transformation();break;
   case 8:await Cinematics.playHorrorEvent();break;
   case 9:S.stage='combat';S.combat=initialCombat();S.combat.boss={x:3,y:2};S.combat.bossHp-=2;render();await BattleFX.cast(()=>combatToken('player'),()=>combatToken('boss'),{kind:'attack',amount:2,hit:true});break;
   case 10:if(S.stage!=='combat'){S.stage='combat';S.combat=initialCombat()}S.combat.hp=Math.max(1,S.combat.hp-2);render();BattleFX.damage(()=>combatToken('player'),2);break;
  }
 });
}
document.addEventListener('input',e=>{if(e.target.id==='volume'){S.volume=Number(e.target.value);persist()}if(e.target.id==='text-speed'){S.textSpeed=Number(e.target.value);persist()}});
