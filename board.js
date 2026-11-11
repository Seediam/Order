/* ORDER — tabuleiro de investigação no estilo Clue sobre a planta de Santa Cecília.
   Grade 32×24 sobre assets/web/map-igreja.webp (1448×1086). Corredores, portas e salas em coordenadas de casa. */
'use strict';
const ChurchBoard=(()=>{
 const COLS=32,ROWS=24;
 const rect=(x1,y1,x2,y2)=>{const out=[];for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)out.push([x,y]);return out};
 const CORRIDOR_RECTS=[[11,2,12,12],[10,7,10,8],[21,2,21,12],[22,7,22,12],[5,13,28,13],[15,14,18,19],[16,20,17,21]];
 const corridor=new Set(CORRIDOR_RECTS.flatMap(r=>rect(...r)).map(([x,y])=>x+','+y));
 /* door: casa de corredor colada à porta da sala. */
 const ROOMS={
  escritorio:{name:'Escritório da Ordem',rect:[5,1,10,6],center:[8,3.5],doors:[[10,7]]},
  nave:{name:'Nave principal',rect:[13,0,20,12],center:[16.5,7.5],doors:[[12,8],[21,8],[14,13],[19,13],[16,13],[17,13]]},
  sacristia:{name:'Sacristia',rect:[22,1,28,6],center:[25.5,4],doors:[[21,5]]},
  arquivo:{name:'Arquivo de documentos',rect:[2,7,9,12],center:[5.5,10],doors:[[11,10],[8,13]]},
  confessionario:{name:'Confessionário',rect:[23,7,30,12],center:[27,10],doors:[[22,10],[24,13]]},
  porao:{name:'Quarto trancado',rect:[1,14,7,20],center:[4,17],doors:[[6,13]],locked:true},
  reunioes:{name:'Sala de reuniões',rect:[8,14,14,20],center:[11,17],doors:[[11,13],[15,16]]},
  corredor:{name:'Corredor dos fundos',rect:[19,14,23,20],center:[21,17],doors:[[20,13],[18,16]]},
  patio:{name:'Pátio / abrigo da criança',rect:[24,14,30,21],center:[27,18],doors:[[27,13]]}
 };
 /* Passagem secreta (como no Clue): liga o confessionário ao quarto sob o altar depois que as chaves forem encontradas. */
 const SECRET={confessionario:'porao',porao:'confessionario'};
 const START=[16,20];
 const key=(x,y)=>x+','+y;
 const isCorridor=(x,y)=>corridor.has(key(x,y));
 function roomAtDoor(x,y){return Object.entries(ROOMS).filter(([,r])=>r.doors.some(([dx,dy])=>dx===x&&dy===y)).map(([id])=>id)}
 /* Alcance a partir de uma casa de corredor (ou da porta da sala atual), com exatamente até N passos. */
 function reach(from,steps,blockedCells=[]){
  const block=new Set(blockedCells.map(([x,y])=>key(x,y)));
  const dist=new Map([[key(...from),0]]),prev=new Map(),q=[from];
  for(let i=0;i<q.length;i++){const [x,y]=q[i],d=dist.get(key(x,y));if(d>=steps)continue;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(!isCorridor(nx,ny)||dist.has(k)||block.has(k))continue;dist.set(k,d+1);prev.set(k,[x,y]);q.push([nx,ny])}}
  return{dist,prev};
 }
 function pathFrom(prev,from,to){const out=[to];let k=key(...to);while(prev.has(k)){const p=prev.get(k);out.unshift(p);k=key(...p)}return out[0][0]===from[0]&&out[0][1]===from[1]?out:null}
 /* Caminho mais curto entre duas casas de corredor (para a Presença). */
 function shortest(from,to){const {prev,dist}=reach(from,99);if(!dist.has(key(...to)))return null;return pathFrom(prev,from,to)}
 function cellCenter(x,y){return[(x+.5)/COLS*100,(y+.5)/ROWS*100]}
 return{COLS,ROWS,ROOMS,SECRET,START,corridor,isCorridor,roomAtDoor,reach,pathFrom,shortest,cellCenter,key};
})();
if(typeof module!=='undefined')module.exports=ChurchBoard;
