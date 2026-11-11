/* ORDER — arte provisória das cartas, desenhada em SVG (estilo papel recortado).
   Cada carta = moldura do Setor + faixa de tipo (Ação / Reação / Armadilha) + ilustração em camadas + texto + faces do D6. */
'use strict';
const CardArt=(()=>{
 const ICONS={
  pistol:'M10 36h54l6-7h18v16H72l-5 6H48l-7 26H25l7-26H10z',
  shield:'M50 8 84 21v25c0 22-15 37-34 44C31 83 16 68 16 46V21z',
  fist:'M26 42h48v28c0 12-9 20-20 20H42c-9 0-16-7-16-16zM26 42v-9a6 6 0 0 1 12 0v9zM38 42V28a6 6 0 0 1 12 0v14zM50 42V28a6 6 0 0 1 12 0v14zM62 42v-9a6 6 0 0 1 12 0v9z',
  boot:'M30 10h24v42l26 11c7 3 10 9 10 16v7H20V70l10-7z',
  hammer:'M14 18h52v24H14zM42 42h12v48H42z',
  flag:'M22 8h7v84h-7zM29 12h52L70 28l11 16H29z',
  heart:'M50 88 14 52C1 39 9 13 29 13c11 0 17 8 21 15 4-7 10-15 21-15 20 0 28 26 15 39z',
  scales:'M47 10h6v70h-6zM28 84h44v8H28zM14 26h72v5H14zM18 31 6 58h24zM82 31 70 58h24zM4 58a14 9 0 0 0 28 0zM68 58a14 9 0 0 0 28 0z',
  eye:'M4 50C18 24 82 24 96 50 82 76 18 76 4 50z',
  document:'M22 6h40l18 18v70H22z',
  mask:'M8 32c15-9 32-9 42 0 10-9 27-9 42 0 0 24-11 42-26 42-9 0-13-7-16-13-3 6-7 13-16 13C19 74 8 56 8 32z',
  hand:'M34 92V54L20 40c-5-5 2-12 8-7l8 8V16a6 6 0 0 1 11 0v28V12a6 6 0 0 1 11 0v32V16a6 6 0 0 1 11 0v30V26a6 6 0 0 1 11 0v40c0 15-11 26-26 26z',
  rings:'M34 30a22 22 0 1 0 .1 0zm0 8a14 14 0 1 1-.1 0zM66 30a22 22 0 1 0 .1 0zm0 8a14 14 0 1 1-.1 0z',
  mirror:'M50 6c18 0 30 14 30 32S68 70 50 70 20 56 20 38 32 6 50 6zM45 70h10v24H45z',
  lantern:'M38 16h24v6H38zM44 8h12v8H44zM32 22h36l-4 54H36zM28 76h44v10H28z',
  cross:'M38 10h24v28h28v24H62v28H38V62H10V38h28z',
  sword:'M47 4h6v62h-6zM30 64h40v7H30zM45 71h10v18H45zM42 89h16v6H42z',
  dagger:'M46 10l4-6 4 6 3 52H43zM30 62h40v7H30zM45 69h10v16H45zM42 85h16v7H42z',
  skull:'M50 10c23 0 36 15 36 33 0 13-6 21-15 25v16H29V68c-9-4-15-12-15-25 0-18 13-33 36-33z',
  arrow:'M8 42h50V24l34 26-34 26V58H8z',
  book:'M10 20c15-5 28-3 40 6 12-9 25-11 40-6v64c-15-5-28-3-40 6-12-9-25-11-40-6z',
  chain:'M20 34h20a12 12 0 0 1 0 24H20a12 12 0 0 1 0-24zm0 7a5 5 0 0 0 0 10h20a5 5 0 0 0 0-10zM60 42h20a12 12 0 0 1 0 24H60a12 12 0 0 1 0-24zm0 7a5 5 0 0 0 0 10h20a5 5 0 0 0 0-10z',
  quill:'M84 6C52 14 30 38 26 74l-8 20 12-12c32-6 50-32 54-76z',
  wall:'M8 20h40v18H8zM52 20h40v18H52zM8 42h20v18H8zM32 42h36v18H32zM72 42h20v18H72zM8 64h40v18H8zM52 64h40v18H52z',
  spiral:'M50 50m-6 0a6 6 0 1 1 12 0 12 12 0 1 1-24 0 18 18 0 1 1 36 0 24 24 0 1 1-48 0 30 30 0 1 1 60 0h-6a24 24 0 1 0-48 0 18 18 0 1 0 36 0 12 12 0 1 0-24 0 6 6 0 1 0 12 0z',
  bell:'M50 8c4 0 6 3 6 6 14 4 22 18 22 34v18l10 12H12l10-12V48c0-16 8-30 22-34 0-3 2-6 6-6zM40 82h20a10 10 0 0 1-20 0z'
 };
 const DETAIL={eye:'<circle cx="50" cy="50" r="15" fill="var(--ink)"/><circle cx="50" cy="50" r="6" fill="var(--glow)"/>',skull:'<circle cx="38" cy="44" r="8" fill="var(--ink)"/><circle cx="62" cy="44" r="8" fill="var(--ink)"/><path d="M50 54l-5 9h10z" fill="var(--ink)"/>',mask:'<ellipse cx="32" cy="42" rx="9" ry="6" fill="var(--ink)"/><ellipse cx="68" cy="42" rx="9" ry="6" fill="var(--ink)"/>',document:'<path d="M32 40h36M32 52h36M32 64h26" stroke="var(--ink)" stroke-width="5"/>',book:'<path d="M50 26v62" stroke="var(--ink)" stroke-width="4"/>',shield:'<path d="M50 24v52M32 44h36" stroke="var(--ink)" stroke-width="5" opacity=".6"/>',lantern:'<path d="M50 32c8 10 8 22 0 30-8-8-8-20 0-30z" fill="var(--glow)"/>',mirror:'<ellipse cx="50" cy="38" rx="20" ry="24" fill="var(--ink)" opacity=".55"/>',heart:'<path d="M50 30v40M40 44l20 12" stroke="var(--ink)" stroke-width="4" opacity=".5"/>',bell:'<circle cx="50" cy="56" r="4" fill="var(--ink)"/>'};
 const SECTOR={'INCIDÊNCIA':{c:'#d9485f',d:'#5a1220',code:'I'},'RELAÇÃO':{c:'#b46cff',d:'#2f1450',code:'R'},'JUSTIÇA':{c:'#e8b25a',d:'#4a3010',code:'J'},'SOCIALISTA':{c:'#4fc6a0',d:'#0f3a2e',code:'S'},'DOUTRINA':{c:'#8f9bb3',d:'#1a1f2b',code:'D'},'UNIVERSAL':{c:'#ff76c7',d:'#3a0d26',code:'U'},'EQUIPAMENTO':{c:'#d7c3a3',d:'#3a2c1c',code:'⚙'},'INIMIGO':{c:'#ff3f6e',d:'#2a0612',code:'✠'}};
 const TYPE={'Ação':{label:'AÇÃO',mark:'M50 6 60 40 94 50 60 60 50 94 40 60 6 50 40 40z'},'Reação':{label:'REAÇÃO',mark:'M50 6 88 20v28c0 22-16 38-38 46C28 86 12 70 12 48V20z'},'Armadilha':{label:'ARMADILHA',mark:'M50 4 60 22 80 12 76 34 96 40 80 54 92 72 70 72 66 94 50 80 34 94 30 72 8 72 20 54 4 40 24 34 20 12 40 22z'},'Equipamento':{label:'EQUIPAMENTO',mark:'M50 10a40 40 0 1 0 .1 0z'}};
 let n=0;
 /* Ilustração: céu de papel + sol/olho + recortes em camadas + ícone com sombra deslocada. */
 function art(card){const s=SECTOR[card.sector]||SECTOR.UNIVERSAL,id='ca'+(n++),icon=ICONS[card.icon]||ICONS.eye,t=TYPE[card.type]||TYPE['Ação'];
  const seed=[...card.id||card.name].reduce((a,ch)=>a+ch.charCodeAt(0),0),hill=(k)=>{const a=20+((seed*k)%30),b=10+((seed*(k+3))%25);return`M0 ${70+k*6}C20 ${70-b+k*4} 40 ${80-a+k*3} 60 ${72-b/2+k*4}S90 ${66+k*5} 100 ${70+k*4}V100H0z`};
  return`<svg class="ca-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style="--glow:${s.c};--ink:${s.d}" aria-hidden="true"><defs><radialGradient id="${id}g" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="${s.c}" stop-opacity=".55"/><stop offset=".55" stop-color="${s.d}"/><stop offset="1" stop-color="#0a0609"/></radialGradient></defs><rect width="100" height="100" fill="url(#${id}g)"/><g opacity=".14" fill="none" stroke="#fff" stroke-width=".4">${[0,1,2,3,4,5].map(i=>`<circle cx="50" cy="40" r="${10+i*9}"/>`).join('')}</g><path d="${t.mark}" transform="translate(50 40) scale(.62) translate(-50 -50)" fill="${s.c}" opacity=".18"/><path d="${hill(0)}" fill="${s.d}" opacity=".9"/><path d="${hill(1)}" fill="#0c070b" opacity=".85"/><g transform="translate(50 52) scale(.6) translate(-50 -50)"><path d="${icon}" fill="#000" opacity=".45" transform="translate(4 5)" fill-rule="evenodd"/><path d="${icon}" fill="#f4e7d6" stroke="${s.d}" stroke-width="2" fill-rule="evenodd"/>${DETAIL[card.icon]||''}</g><path d="${hill(2)}" fill="#07040a"/></svg>`}
 function dice(list){return list.map(v=>`<i class="pip-die" data-v="${v}">${[...Array(v)].map(()=>'<b></b>').join('')}</i>`).join('')}
 /* Carta completa. size: in-hand | big | thumb */
 function card(card,size='in-hand',opts={}){const s=SECTOR[card.sector]||SECTOR.UNIVERSAL,t=TYPE[card.type]||TYPE['Ação'];const text=opts.text??card.hells;
  return`<div class="pcard ${size} t-${(card.type||'Ação').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()}" style="--sc:${s.c};--sd:${s.d}"><div class="pc-head"><span class="pc-sigil">${s.code}</span><b class="pc-name">${card.name}</b><span class="pc-id">${card.id||''}</span></div><div class="pc-type">${t.label}</div><div class="pc-art">${art(card)}</div><div class="pc-text">${text||''}</div><div class="pc-dice">${dice(card.dice||[])}</div></div>`}
 function back(size='in-hand'){return`<div class="pcard back ${size}"><svg viewBox="0 0 100 140" aria-hidden="true"><rect width="100" height="140" rx="8" fill="#2a0b1a"/><rect x="6" y="6" width="88" height="128" rx="5" fill="none" stroke="#ff76c7" stroke-width="1.4" opacity=".7"/><g opacity=".22" stroke="#ff76c7" fill="none">${[0,1,2,3,4,5,6].map(i=>`<path d="M${-20+i*20} 0l60 140"/><path d="M${120-i*20} 0l-60 140"/>`).join('')}</g><path d="M14 70C30 44 70 44 86 70 70 96 30 96 14 70z" fill="#170812" stroke="#ff76c7" stroke-width="2"/><circle cx="50" cy="70" r="13" fill="#ff2f8e"/><ellipse cx="50" cy="70" rx="4" ry="10" fill="#0c070b"/><text x="50" y="122" text-anchor="middle" font-family="Cinzel Decorative,Georgia" font-size="11" fill="#ffb1dc" letter-spacing="3">ORDER</text></svg></div>`}
 return{card,back,art,ICONS,SECTOR};
})();
