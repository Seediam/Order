/* ORDER — postura, dossiê e Ritual de Julgamento (Manual, cap. 6). */
'use strict';
function chooseStance(value){
 const next={polite:'visitor',direct:'direct',aggressive:'aggressive',apology:'greeting',understanding:'greeting',records:'arquivo',childKind:'childKind'};
 if(value==='aggressive'&&!S.flags.aggressive){S.flags.aggressive=true;changeTrust(-1,'Ameaça na igreja')}
 if(value==='apology'){S.flags.aggressive=false;S.flags.apologized=true}
 if(['polite','understanding','records'].includes(value))S.flags.respectful=true;
 if(value==='understanding'&&!S.flags.understood){S.flags.understood=true;changeMoral(1,'Escuta')}
 if(value==='childKind')S.flags.childComforted=true;
 goNode(next[value]||'greeting');
}
/* Ritual de Julgamento: 2 Provas reais + 2 Moral + D20 + Resistência (Convicção) contra DT 13 + Portão (1). */
async function makeDecision(value){
 const [route,reason]=value.split(':');if(!['collect','mercy','defer'].includes(route))return;
 const proofs=S.clues.length,dc=14+(proofs<2?3:0);
 const sentence={collect:'COLETAR',mercy:'ABSOLVER',defer:'ADIAR'}[route];
 let paid='moral';
 if(S.moral<2){paid='sanity'}
 const ok=await ritualPrompt({sentence,proofs,dc,paid});if(ok===null)return;
 if(paid==='moral')changeMoral(-2,'Ritual de Julgamento');else changeSanity(-2,'Pronunciar sem Moral');
 const r=await skillTest({skill:'Resistência',dc,title:`Ritual de Julgamento · ${sentence}`,reason:proofs<2?'Menos de 2 provas: o selo fica frágil (DT +3).':'Duas provas sustentam a sentença.',extra:S.sector==='JUSTIÇA'?Math.min(2,proofs):0,extraLabel:'Veredito',noCancel:true});
 S.flags.route=route;S.flags.justification=reason;S.flags.decisionEvidence=[...S.clues];S.flags.ritualOk=r.ok;S.flags.ritualFailed=!r.ok;
 const considered=S.clues.length>=3&&(S.clues.includes('letter')||S.clues.includes('notebook'));
 if((route==='mercy'&&reason==='responsibility'&&considered)||(route==='defer'&&S.clues.length>0))changeTrust(1,'Decisão fundamentada');
 if(route==='collect'&&S.clues.length<2)changeTrust(-1,'Cobrança sem apurar');
 if(route==='mercy'&&reason==='faith'&&S.clues.length===0)changeTrust(-1,'Absolvição sem provas');
 if(!r.ok){changeSanity(-1,'O contrato reage');flash('O selo não fecha. O contrato reage: o Portão estará mais forte.')}
 else flash('Selamento válido. O contrato aceita a sentença.');
 S.flags.peace=route==='collect'&&considered&&reason==='evidence';
 persist();goNode(route==='collect'?'forced':route==='mercy'?'mercy':'deferred');
}
function openJournal(){
 let dialog=document.getElementById('journal-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='journal-dialog';document.body.append(dialog)}
 const ids=[...new Set([...S.clues,...(S.stage==='evidence'?[S.evidenceId]:[])])].filter(id=>CLUES[id]);
 const options=ids.map(id=>`<option value="${id}">${esc(CLUES[id].label)}</option>`).join('');
 dialog.innerHTML=`<form method="dialog" class="journal-header"><div><div class="eyebrow">REGISTROS ORIGINAIS · ${ids.length}/${Object.keys(CLUES).length}</div><h2>Dossiê de investigação</h2></div><button class="btn btn-ghost" aria-label="Fechar dossiê">FECHAR ×</button></form>${ids.length?`<p class="journal-lead">Compare dois registros e anote uma pergunta. A interpretação é sua: nenhuma prova vem marcada como culpa ou inocência.</p><div class="journal-columns">${[0,1].map(i=>`<div><label for="journal-${i}">Registro ${i+1}</label><select id="journal-${i}">${options}</select><article id="journal-text-${i}"></article></div>`).join('')}</div><div class="journal-note"><label for="deduction-note">Pergunta para confrontar Elvira</label><select id="deduction-note"><option>As datas descrevem a mesma pessoa?</option><option>O que Elvira sabia quando decidiu fechar a porta?</option><option>Quem foi protegido e quem ficou sem resposta?</option><option>Que informação ainda preciso confirmar?</option></select><button type="button" class="btn btn-ghost" id="save-note">REGISTRAR PERGUNTA</button></div><div id="journal-notes"></div>`:'<p class="journal-lead">Nenhum documento foi recolhido. Procure registros nas salas da igreja.</p>'}`;
 if(ids.length){
  const update=i=>{const id=dialog.querySelector('#journal-'+i).value,c=CLUES[id];dialog.querySelector('#journal-text-'+i).innerHTML=`<h3>${esc(c.title)}</h3><small>${esc(c.location)}</small><p>${esc(c.text)}</p>`};
  for(let i=0;i<2;i++){dialog.querySelector('#journal-'+i).value=ids[Math.min(i,ids.length-1)];dialog.querySelector('#journal-'+i).addEventListener('change',()=>update(i));update(i)}
  const notes=()=>{dialog.querySelector('#journal-notes').textContent=(S.flags.notes||[]).map(n=>CLUES[n.a].label+' / '+CLUES[n.b].label+': '+n.question).join('\n\n')};notes();
  dialog.querySelector('#save-note').onclick=()=>{const a=dialog.querySelector('#journal-0').value,b=dialog.querySelector('#journal-1').value,question=dialog.querySelector('#deduction-note').value;if(a===b){flash('Escolha dois registros diferentes.');return}S.flags.notes=S.flags.notes||[];if(!S.flags.notes.some(n=>n.a===a&&n.b===b&&n.question===question)){S.flags.notes.push({a,b,question});if(!S.flags.compared){S.flags.compared=true;changeMoral(1,'Registros comparados')}persist();notes()}audio('paper')};
 }
 dialog.showModal();
}
