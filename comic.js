/* Leitor offline de ORDER. Sem tabuleiro, baralho, backend ou dependências remotas. */
(() => {
  'use strict';
  const SAVE = 'order_comic_v1', DISCORD = 'https://discord.gg/xVDAPBVTTz';
  const app = document.getElementById('app'), dialog = document.getElementById('reader-dialog');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const SECTOR_ALBUM = {
    'INCIDÊNCIA': {photo:'I01',role:'A presença que protege',quote:'“Antes da sentença, ninguém mais se machuca.”',look:'Você repara em quem ainda precisa de proteção.',tone:'#7e343f'},
    'RELAÇÃO': {photo:'R01',role:'A palavra que aproxima',quote:'“Diga o que ainda não conseguiu contar.”',look:'Você procura o que existe entre duas versões.',tone:'#795074'},
    'JUSTIÇA': {photo:'J01',role:'O peso de uma sentença',quote:'“O bem que fez não apaga o mal que permitiu.”',look:'Você confronta o acolhimento com a responsabilidade.',tone:'#957441'},
    'SOCIALISTA': {photo:'S01',role:'Quem enxerga os que ficam',quote:'“Quem vai pagar por esta decisão amanhã?”',look:'Você pensa em Lia e nas pessoas que dependem da igreja.',tone:'#4c7060'},
    'DOUTRINA': {photo:'U01',role:'A certeza que age',quote:'“Quando eu assinar, sustentarei a consequência.”',look:'Você busca uma decisão que consiga levar até o fim.',tone:'#575e7d'},
  };
  const defaults = () => ({ version: 1, presentationVersion:2, screen: 'cover', step: 0, page: 0, panel:0, viewed:{}, furthest: 0, sectorChosen:false, albumSector:'JUSTIÇA', contractAccepted:false, diceAnimations:true, audio: false, motion: !matchMedia('(prefers-reduced-motion: reduce)').matches,
    profile: { name: '', body: '', sector: 'JUSTIÇA', sin: 'Traidor', confession: '', skills: [] }, decisions: {}, rolls: {} });
  let state = load(), busy = false, toastTimer, context;
  function load() {
    const clean = defaults();
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE));
      if (!saved || saved.version !== 1) return clean;
      const p = saved.profile || {};
      clean.profile = { name: String(p.name || '').slice(0, 40), body: ['homem','mulher'].includes(p.body) ? p.body : '', sector: Object.hasOwn(ComicBook.sectors, p.sector) ? p.sector : 'JUSTIÇA', sin: ComicBook.sins.includes(p.sin) ? p.sin : 'Traidor', confession: String(p.confession || '').slice(0, 500), skills: [...new Set(Array.isArray(p.skills) ? p.skills.filter(v => ComicBook.skills.includes(v)) : [])].slice(0, 2) };
      clean.screen = ['cover','create','read'].includes(saved.screen) ? saved.screen : 'cover';
      clean.step = clean.profile.body && Number.isInteger(saved.step) ? Math.max(0,Math.min(3,saved.step)) : 0;
      clean.sectorChosen = saved.sectorChosen === true || !!(clean.profile.name && clean.profile.skills.length === 2);
      clean.albumSector = Object.hasOwn(SECTOR_ALBUM,saved.albumSector) ? saved.albumSector : clean.profile.sector;
      clean.contractAccepted = saved.contractAccepted === true;
      clean.panel = Number.isInteger(saved.panel) ? Math.max(0,Math.min(2,saved.panel)) : 0;
      clean.viewed = Object.fromEntries(Object.entries(saved.viewed || {}).filter(([key,v]) => /^[a-z]+$/.test(key) && Number.isInteger(v) && v >= 0 && v < 3));
      clean.diceAnimations = saved.diceAnimations !== false;
      clean.furthest = Math.max(0, Math.min(10, Number.isInteger(saved.furthest) ? saved.furthest : 0));
      clean.page = Math.max(0, Math.min(clean.furthest, Number.isInteger(saved.page) ? saved.page : 0));
      clean.audio = saved.audio === true; clean.motion = saved.motion !== false;
      for (const [key, values] of Object.entries({ arrival:['kind','direct'], lia:['listen','space'], judgment:['collect','mercy','defer'] })) if (values.includes(saved.decisions?.[key])) clean.decisions[key] = saved.decisions[key];
      for (const key of ['archive','threshold']) {
        const r = saved.rolls?.[key];
        if (r && Number.isInteger(r.value) && r.value >= 1 && r.value <= 20 && [0,2].includes(r.bonus)) {
          const dc = key === 'archive' ? 11 : 12;
          clean.rolls[key] = { value: r.value, bonus: r.bonus, total: r.value + r.bonus, dc, ok: r.value + r.bonus >= dc };
        }
      }
      if (clean.screen === 'read' && (!clean.profile.body || !clean.profile.name.trim() || clean.profile.skills.length !== 2)) clean.screen = 'create';
      if (clean.screen === 'read' && (!clean.contractAccepted || saved.presentationVersion !== 2)) { clean.screen = 'create'; clean.step = 3; }
    } catch { /* Um arquivo de leitura danificado nunca impede abrir o livro. */ }
    return clean;
  }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(state)); } catch { toast('O navegador não conseguiu salvar a leitura. Você ainda pode baixar sua ficha.'); } }
  function toast(text) { const el = document.getElementById('toast'); el.textContent = text; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 4300); }
  function sound(type = 'paper') {
    if (!state.audio) return;
    try {
      context ||= new (window.AudioContext || window.webkitAudioContext)();
      if (context.state === 'suspended') void context.resume();
      const oscillator = context.createOscillator(), gain = context.createGain(), now = context.currentTime;
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(type === 'roll' ? 130 : type === 'bell' ? 220 : 340, now);
      oscillator.frequency.exponentialRampToValueAtTime(70, now + .22);
      gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.025, now + .02); gain.gain.exponentialRampToValueAtTime(.0001, now + .4);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(now); oscillator.stop(now + .42);
    } catch { /* A leitura funciona também sem suporte a áudio. */ }
  }
  window.AudioEngine = { play: sound };
  const eye = () => '<svg class="eye" viewBox="0 0 240 125" aria-hidden="true"><path d="M12 62Q120-34 228 62Q120 158 12 62Z" fill="#180d1b" stroke="currentColor" stroke-width="2"/><circle cx="120" cy="62" r="39" fill="#a73469" stroke="currentColor"/><circle cx="120" cy="62" r="30" fill="none" stroke="#eccadd" stroke-dasharray="1 5"/><ellipse cx="120" cy="62" rx="10" ry="29" fill="#09060d"/><circle cx="108" cy="46" r="5" fill="#fff0e9"/><path d="M120 0v13M120 112v13M0 62h9M231 62h9" stroke="currentColor"/></svg>';
  function ready() { return !!(state.profile.name.trim() && state.profile.body && state.profile.skills.length === 2 && state.sectorChosen); }
  function portrait(hell = false) { return ComicBook.art[state.profile.body || 'homem'][hell ? 'hell' : 'normal']; }
  function header() { return ComicViews.header(state, ready()); }
  function cover() { return ComicViews.cover(state, {ready:ready() && state.contractAccepted, legacy:!!legacyProfile()}); }
  function creator() { return ComicViews.creator(state, SECTOR_ALBUM, portrait()); }
  function actorHTML(actor) {
    const source = actor.who === 'player' ? portrait(actor.pose === 'hell') : ComicBook.art[actor.who];
    const names = { player: state.profile.name, lia: 'Lia', elvira: 'Dona Elvira', demon: 'Elvira transformada', echo: 'Eco do Contrato', guardian: 'Guardião do Prazo' };
    return `<div class="actor ${actor.side}" data-who="${actor.who}"><img src="${source}" alt="${esc(names[actor.who] || actor.who)}" decoding="async"></div>`;
  }
  function panelHTML(panel, index) { return ComicViews.panel(panel, index, actorHTML); }
  function reading() { return ComicViews.reading(state, {busy, panelHTML, finale}); }
  function finale(ending) {
    return `<section class="cliffhanger"><div><span class="eyebrow">${esc(ending.name)} / O PRIMEIRO GOLPE AINDA NÃO FOI DADO</span><h2>O que você julgou<br>agora olha de volta.</h2><blockquote>${esc(ending.last)}</blockquote><div class="end-tools"><button class="button quiet" data-action="sheet">Ler minha ficha</button><button class="button quiet" data-action="download">Guardar meu Searcher ↓</button><button class="button quiet" data-action="previous">← Rever a assinatura</button></div></div><aside class="community-invite"><span class="eyebrow">FIM DO PRÓLOGO / INÍCIO DO SEU CONTRATO</span><h2>Você não precisa atravessar sozinho.</h2><p>Entre no Discord do ORDER, crie sua ficha de campanha e encontre uma mesa para descobrir o que vem depois desta página.</p><a class="button primary" href="${DISCORD}" target="_blank" rel="noopener noreferrer">${eye()} Continuar no Discord ↗</a><p class="small muted">Seu Searcher começa aqui. A próxima história será construída com o Mestre e os outros jogadores.</p></aside></section>`;
  }
  function render(focus = false) {
    document.documentElement.classList.toggle('motion-off', !state.motion);
    window.Dice3D?.setEnabled?.(state.diceAnimations);
    app.innerHTML = header() + (state.screen === 'read' ? reading() : state.screen === 'create' ? creator() : cover()) + '<footer class="book-footer">ORDER · A DÍVIDA NÃO TERMINA COM A MORTE.</footer>';
    document.title = state.screen === 'read' ? `${ComicBook.pages(state)[state.page].title} — ORDER` : 'ORDER — O Pecado da Misericórdia';
    if (focus) { window.scrollTo({ top: 0, behavior: 'instant' }); document.getElementById('page-title')?.focus({ preventScroll: true }); }
  }

  function showMission() {
    modal('Por que você está aqui?', '<span class="label">CONTRATO 001 / ELVIRA MARTINS</span><p>Você é um <strong>Searcher</strong>, um humano morto a serviço do Inferno. Sua ordem é cobrar a alma de Elvira.</p><p>Antes de assinar, você deve ouvir sua história e investigar o que ela fez. No fim, poderá <strong>cobrar a alma, conceder misericórdia ou pedir mais tempo</strong>.</p><p>Conhecer quem ela salvou pode fazer você hesitar. Quem ela abandonou também precisa ser ouvido. A sentença será sua.</p><div class="dialog-actions"><button class="button primary" data-action="close">Entendi. Voltar à história →</button></div>');
  }
  function showDiceInfo() {
    modal('O D20 faz parte da história.', '<div class="dice-guide-mark">◇ <strong>20</strong></div><p>Quando você investigar uma pista ou encarar algo impossível, role o dado. Se tiver a perícia correspondente, some <strong>+2</strong>.</p><p>O resultado muda como você descobre algo. Ele não decide por você se Elvira merece misericórdia.</p><div class="dice-settings"><button class="button quiet" data-action="dice-toggle" aria-pressed="'+state.diceAnimations+'">Animação 3D: '+(state.diceAnimations?'ligada':'desligada')+'</button><span>O movimento dos dados é independente das páginas.</span></div><div class="dialog-actions"><button class="button primary" data-action="demo-roll">'+(state.diceAnimations?'Experimentar o D20 em 3D':'Revelar um D20')+'</button><button class="button quiet" data-action="close">Voltar</button></div>');
  }
  async function demoRoll() {
    if (busy) return;
    dialog.close(); busy = true;
    const data = new Uint32Array(1), limit = 0x100000000 - 0x100000000 % 20;
    do { crypto.getRandomValues(data); } while (data[0] >= limit);
    const value = data[0] % 20 + 1;
    try {
      window.Dice3D?.setEnabled(state.diceAnimations);
      if (window.Dice3D) await window.Dice3D.roll([{sides:20,value}], {title:'Conheça o seu D20',result:'Você tirou '+value,detail:'Esta é uma demonstração. Nenhuma escolha da sua história foi alterada.',hold:4000,forceMotion:state.diceAnimations});
    } catch { toast('Não consegui mostrar o dado. O resultado desta demonstração foi '+value+'.'); }
    finally { busy = false; render(); }
  }

  function modal(title, content) {
    dialog.innerHTML = `<div class="dialog-top"><h2>${esc(title)}</h2><button class="close-dialog" data-action="close" aria-label="Fechar janela">×</button></div>${content}`;
    if (!dialog.open) dialog.showModal();
  }
  function showSheet() {
    const p = state.profile;
    modal('Seu registro no ORDER', `<img class="dossier-portrait" src="${portrait()}" alt="Seu Searcher"><span class="label">ARQUIVO CENTRAL / SEARCHER</span><h2>${esc(p.name)}</h2><span class="stamp">CONTRATO 001</span><dl class="dossier-facts"><div><dt>SETOR</dt><dd>${esc(p.sector)}</dd></div><div><dt>PECADO EM VIDA</dt><dd>${esc(p.sin)}</dd></div><div><dt>PERÍCIAS</dt><dd>${p.skills.map(esc).join(' · ')}</dd></div><div><dt>LEITURA</dt><dd>Página ${state.page + 1} de 11</dd></div></dl><p>${esc(p.confession || ComicBook.sectors[p.sector][2])}</p><p class="small">Esta é sua identidade narrativa do prólogo. No Discord, o bot ajuda a criar a ficha da campanha com as regras adotadas pelo Mestre.</p><div class="dialog-actions"><button class="button primary" data-action="download">Baixar ficha narrativa</button><button class="button quiet" data-action="close">Voltar à leitura</button></div>`);
  }
  function showIndex() {
    modal('Páginas do contrato', `<p>Releia as páginas que já abriu. As escolhas e os dados continuam registrados.</p><div class="index-list">${ComicBook.pages(state).map((p, i) => `<button data-action="page" data-value="${i}" ${i > state.furthest ? 'disabled' : ''}><small>${String(i + 1).padStart(2,'0')} · ${esc(p.chapter)}</small>${esc(p.title)}</button>`).join('')}</div>`);
  }
  function legacyProfile() {
    try { for (const key of ['order_prologue_v5','order_prologue_v4']) { const old = JSON.parse(localStorage.getItem(key)); if (old?.name && ['homem','mulher'].includes(old.gender)) return old; } } catch {}
    return null;
  }
  function draft(form) {
    const data = new FormData(form);
    Object.assign(state.profile, { name: String(data.get('name') || '').slice(0,40), sector: data.get('sector'), sin: data.get('sin'), confession: String(data.get('confession') || '').slice(0,500), skills: data.getAll('skills') });
    save();
  }
  function rememberPanel() {
    const page = ComicBook.pages(state)[state.page];
    state.viewed[page.id] = Math.max(state.viewed[page.id] || 0, state.panel);
  }
  function previousPanel() {
    if (state.panel > 0) state.panel--;
    else if (state.page > 0) { state.page--; state.panel = ComicBook.pages(state)[state.page].panels.length - 1; }
    save(); sound('paper'); render(true);
  }
  function advance(value) {
    const page = ComicBook.pages(state)[state.page];
    if (busy || page.ending) return;
    if (state.panel < page.panels.length - 1) {
      state.panel++; rememberPanel(); save(); sound('paper'); render(true); return;
    }
    if (page.roll && !state.rolls[page.roll.id]) return;
    if (page.decision && !state.decisions[page.decision]) {
      if (!page.choices.some(c => c.value === value)) return;
      state.decisions[page.decision] = value;
    }
    state.page = Math.min(10, state.page + 1); state.panel = 0;
    state.furthest = Math.max(state.furthest, state.page);
    rememberPanel(); save(); sound('paper'); render(true);
  }
  async function rollPage() {
    const page = ComicBook.pages(state)[state.page], test = page.roll;
    if (!test || busy || state.rolls[test.id]) return;
    busy = true;
    const uint = new Uint32Array(1), limit = 0x100000000 - 0x100000000 % 20;
    do { crypto.getRandomValues(uint); } while (uint[0] >= limit);
    const value = uint[0] % 20 + 1, bonus = state.profile.skills.includes(test.skill) ? 2 : 0;
    const result = { value, bonus, dc: test.dc, total: value + bonus, ok: value + bonus >= test.dc };
    state.rolls[test.id] = result; save(); render();
    try {
      if (window.Dice3D) await window.Dice3D.roll([{ sides:20, value, ok:result.ok }], { title:test.title, result:`${value} + ${bonus} = ${result.total}`, detail:`${test.skill} · dificuldade ${test.dc} · ${result.ok ? 'O sinal se revela.' : 'A história encontra outro caminho.'}`, tone:result.ok ? 'good' : 'bad', hold:4000, forceMotion:state.diceAnimations });
    } catch { toast(`D20: ${value} + ${bonus} = ${result.total}. O resultado ficou registrado.`); }
    finally { busy = false; render(); document.querySelector('[data-action="next"]')?.focus({ preventScroll:true }); }
  }
  function download() {
    const p = state.profile, route = state.decisions.judgment;
    const lines = ['# ORDER — Meu Searcher', '', `**Nome:** ${p.name}`, `**Setor:** ${p.sector}`, `**Pecado em vida:** ${p.sin}`, `**Perícias narrativas:** ${p.skills.join(', ')}`, '', '## O que ainda pesa', p.confession || 'Ainda não registrado.', '', '## Contrato 001 — O Pecado da Misericórdia', `**Sentença:** ${({collect:'Cobrar a alma',mercy:'Conceder misericórdia',defer:'Adiar a sentença'})[route] || 'Ainda não assinada'}`, '', ...Object.entries(state.rolls).map(([key,r]) => `- ${key === 'archive' ? 'Investigação no arquivo' : 'Resistência ao impossível'}: D20 ${r.value} + ${r.bonus} = ${r.total} (DT ${r.dc}).`), '', 'Identidade narrativa do prólogo. Os valores de campanha são definidos com o Mestre.', '', `Continue sua história: ${DISCORD}`, ''];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type:'text/markdown;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `ORDER-Searcher-${p.name.replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,40) || 'registro'}.md`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  document.addEventListener('input', e => { const form = e.target.closest('#profile-form'); if (form && e.target.name !== 'skills') draft(form); });
  document.addEventListener('change', e => { const form = e.target.closest('#profile-form'); if (!form) return; if (form.querySelectorAll('[name="skills"]:checked').length > 2) { e.target.checked = false; toast('Escolha duas perícias para esta identidade.'); } draft(form); });
  document.addEventListener('submit', e => { if (e.target.id !== 'profile-form') return; e.preventDefault(); draft(e.target); state.profile.name = state.profile.name.trim(); if (state.profile.name.length < 2 || state.profile.skills.length !== 2 || !state.sectorChosen) { toast('Escreva seu nome, escolha o Setor no álbum e selecione duas perícias.'); return; } state.screen = 'create'; state.step = 3; state.contractAccepted = false; state.page = 0; state.panel = 0; state.viewed = {}; state.furthest = 0; state.decisions = {}; state.rolls = {}; save(); render(true); });
  document.addEventListener('click', e => {
    const button = e.target.closest('[data-action]'); if (!button || button.disabled || busy) return;
    const action = button.dataset.action, value = button.dataset.value;
    if (action === 'close') { dialog.close(); return; }
    if (action === 'sheet') { showSheet(); return; }
    if (action === 'mission') { showMission(); return; }
    if (action === 'dice-info') { showDiceInfo(); return; }
    if (action === 'dice-toggle') { state.diceAnimations = !state.diceAnimations; save(); window.Dice3D?.setEnabled(state.diceAnimations); showDiceInfo(); return; }
    if (action === 'demo-roll') { void demoRoll(); return; }
    if (action === 'index') { showIndex(); return; }
    if (action === 'download') { download(); return; }
    if (action === 'roll') { void rollPage(); return; }
    if (action === 'choose' || action === 'next') { advance(value); return; }
    if (action === 'restart') { modal('Reabrir este contrato?', '<p>Sua identidade será mantida. As escolhas e as duas rolagens desta leitura serão apagadas para você descobrir outra sentença.</p><div class="dialog-actions"><button class="button primary" data-action="confirm-restart">Recomeçar a história</button><button class="button quiet" data-action="close">Manter minha leitura</button></div>'); return; }
    if (action === 'confirm-restart') { state.page = 0; state.panel = 0; state.viewed = {}; state.furthest = 0; state.decisions = {}; state.rolls = {}; state.contractAccepted = false; state.screen = 'create'; state.step = 3; dialog.close(); }
    else if (action === 'page') { const i = Number(value); if (!Number.isInteger(i) || i < 0 || i > state.furthest) return; state.page = i; state.panel = 0; state.screen = 'read'; dialog.close(); }
    else if (action === 'panel') { const page = ComicBook.pages(state)[state.page]; const i = Number(value), max = state.page < state.furthest ? page.panels.length-1 : Math.max(state.panel,state.viewed[page.id] || 0); if (!Number.isInteger(i) || i < 0 || i > max || i >= page.panels.length) return; state.panel = i; }
    else if (action === 'previous') { previousPanel(); return; }
    else if (action === 'home') state.screen = 'cover';
    else if (action === 'resume') { if (ready() && state.contractAccepted) state.screen = 'read'; else { state.screen = 'create'; state.step = ready() ? 3 : state.profile.body ? 1 : 0; } }
    else if (action === 'create') { state.screen = 'create'; state.step = state.profile.body ? state.sectorChosen ? Math.max(2,Math.min(3,state.step)) : 1 : 0; }
    else if (action === 'body' && ['homem','mulher'].includes(value)) { state.profile.body = value; state.albumSector = state.profile.sector; state.step = 1; }
    else if (action === 'appearance') state.step = 0;
    else if (action === 'album-next' || action === 'album-prev') { const sectors = Object.keys(SECTOR_ALBUM), i = sectors.indexOf(state.albumSector); state.albumSector = sectors[(i + (action === 'album-next' ? 1 : -1) + sectors.length) % sectors.length]; }
    else if (action === 'album-sector') { if (!Object.hasOwn(SECTOR_ALBUM,value)) return; state.albumSector = value; }
    else if (action === 'choose-sector') { state.profile.sector = state.albumSector; state.sectorChosen = true; state.step = 2; }
    else if (action === 'change-sector') { state.screen = 'create'; state.albumSector = state.profile.sector; state.step = 1; }
    else if (action === 'start-reading') { if (!ready()) return; state.contractAccepted = true; state.screen = 'read'; rememberPanel(); }
    else if (action === 'audio') { state.audio = !state.audio; sound('bell'); }
    else if (action === 'motion') state.motion = !state.motion;
    else if (action === 'legacy') { const old = legacyProfile(); if (!old) return; Object.assign(state.profile, { name:String(old.name).slice(0,40), body:old.gender, sector:Object.hasOwn(ComicBook.sectors, old.sector) ? old.sector : 'JUSTIÇA', sin:ComicBook.sins.includes(old.sinChoice) ? old.sinChoice : 'Traidor', confession:String(old.sin || '').slice(0,500), skills:(Array.isArray(old.skills) ? old.skills : []).filter(v => ComicBook.skills.includes(v)).slice(0,2) }); state.screen = 'create'; state.step = 1; }
    save(); render(!['audio','motion'].includes(action));
  });
  document.addEventListener('keydown', e => {
    if (busy || dialog.open || state.screen !== 'read' || e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input,textarea,select,button,a')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); advance(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); previousPanel(); }
  });
  render();
})();
