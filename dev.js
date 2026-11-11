/* Laboratório: só em localhost com ?dev=1. Prévias não gravam a campanha. */
'use strict';
function mountDevPanel(){
 if(!DEV_MODE||document.getElementById('dev-panel'))return;
 const panel=document.createElement('details');panel.id='dev-panel';
 const items=[['Olho',()=>{S.stage='intro';S.introOpened=false;render()}],['Ficha',()=>{S.stage='class';render()}],['Tabuleiro',()=>{if(!S.board)initBoard();S.stage='explore';render()}],['Visual Novel',()=>{S.stage='vn';S.node='welcome';render()}],['Combate',()=>{S.flags.route='collect';startBattle()}],['D20',()=>Dice3D.roll([{sides:20,value:1+Math.floor(Math.random()*20)}],{title:'Teste'})],['D6',()=>Dice3D.roll([{sides:6,value:1+Math.floor(Math.random()*6)}],{title:'Teste'})],['Terror',()=>Cinematics.playHorrorEvent()],['−Sanidade',()=>{changeSanity(-2);render()}],['Presença',()=>{if(S.board){S.board.presence={pos:[...S.board.pos],wait:0};presenceEncounter()}}]];
 panel.innerHTML='<summary>LAB</summary><div>'+items.map(([l],i)=>`<button type="button" data-demo="${i}">${l}</button>`).join('')+'</div>';
 document.body.append(panel);
 panel.addEventListener('click',e=>{const b=e.target.closest('[data-demo]');if(b)items[Number(b.dataset.demo)][1]()});
}
