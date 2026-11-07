'use strict';
function chooseStance(value){
 const next={polite:'visitor',direct:'direct',aggressive:'aggressive',apology:'greeting',understanding:'greeting',records:'arquivo',childKind:'childKind'};
 if(value==='aggressive'&&!S.flags.aggressive){S.flags.aggressive=true;S.trust=clamp(S.trust-1,0,10)}
 if(value==='apology'){S.flags.aggressive=false;S.flags.apologized=true}
 if(['polite','understanding','records'].includes(value))S.flags.respectful=true;
 if(value==='understanding'&&!S.flags.understood){S.flags.understood=true;S.moral=clamp(S.moral+1,0,10)}
 if(value==='childKind')S.flags.childComforted=true;
 goNode(next[value]||'greeting');
}
function makeDecision(value){
 const [route,reason]=value.split(':');if(!['collect','mercy','defer'].includes(route))return;
 S.flags.route=route;S.flags.justification=reason;S.flags.decisionEvidence=[...S.clues];
 const considered=S.clues.length>=3&&(S.clues.includes('letter')||S.clues.includes('notebook'));
 if((route==='mercy'&&reason==='responsibility'&&considered)||(route==='defer'&&S.clues.length>0))S.trust=clamp(S.trust+1,0,10);
 if(route==='collect'&&S.clues.length<2)S.trust=clamp(S.trust-1,0,10);
 if(route==='mercy'&&reason==='faith'&&S.clues.length===0)S.trust=clamp(S.trust-1,0,10);
 S.flags.peace=route==='collect'&&considered&&reason==='evidence';
 persist();goNode(route==='collect'?'forced':route==='mercy'?'mercy':'deferred');
}
function openJournal(){
 let dialog=document.getElementById('journal-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='journal-dialog';document.body.append(dialog)}
 const ids=[...new Set([...S.clues,...(S.stage==='evidence'?[S.evidenceId]:[])])].filter(id=>CLUES[id]);
 const options=ids.map(id=>`<option value="${id}">${esc(CLUES[id].label)}</option>`).join('');
 dialog.innerHTML=`<form method="dialog" class="journal-header"><div><div class="eyebrow">REGISTROS ORIGINAIS</div><h2>Dossiê de investigação</h2></div><button class="btn btn-ghost" aria-label="Fechar dossiê">FECHAR ×</button></form>${ids.length?`<p>Compare os registros e anote uma pergunta. A interpretação é sua.</p><div class="journal-columns">${[0,1].map(i=>`<div><label for="journal-${i}">Registro ${i+1}</label><select id="journal-${i}">${options}</select><article id="journal-text-${i}"></article></div>`).join('')}</div><label for="deduction-note">Pergunta para confrontar com Elvira</label><select id="deduction-note"><option>As datas descrevem a mesma pessoa?</option><option>O que Elvira sabia quando decidiu fechar a porta?</option><option>Quem foi protegido e quem ficou sem resposta?</option><option>Que informação ainda preciso confirmar?</option></select><button class="btn btn-ghost" id="save-note">REGISTRAR PERGUNTA</button><div id="journal-notes"></div>`:'<p>Nenhum documento foi recolhido. Procure registros nas salas da igreja.</p>'}`;
 if(ids.length){
  const update=i=>{const id=dialog.querySelector('#journal-'+i).value,c=CLUES[id];dialog.querySelector('#journal-text-'+i).innerHTML=`<h3>${esc(c.title)}</h3><small>${esc(c.location)}</small><p>${esc(c.text)}</p>`};
  for(let i=0;i<2;i++){dialog.querySelector('#journal-'+i).value=ids[Math.min(i,ids.length-1)];dialog.querySelector('#journal-'+i).addEventListener('change',()=>update(i));update(i)}
  const notes=()=>{dialog.querySelector('#journal-notes').textContent=(S.flags.notes||[]).map(n=>CLUES[n.a].label+' / '+CLUES[n.b].label+': '+n.question).join('\n\n')};notes();
  dialog.querySelector('#save-note').onclick=()=>{const a=dialog.querySelector('#journal-0').value,b=dialog.querySelector('#journal-1').value,question=dialog.querySelector('#deduction-note').value;if(a===b){flash('Escolha dois registros diferentes.');return}S.flags.notes=S.flags.notes||[];if(!S.flags.notes.some(n=>n.a===a&&n.b===b&&n.question===question)){S.flags.notes.push({a,b,question});if(!S.flags.compared){S.flags.compared=true;S.moral=clamp(S.moral+1,0,10)}persist();notes()}audio('paper')};
 }
 dialog.showModal();
}
