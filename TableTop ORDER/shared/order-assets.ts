import type { Asset, Mode } from './types';
export const ORDER_ART={man:'/art/order/characters/man.png',woman:'/art/order/characters/woman.png',manNovel:'/art/order/characters/man-novel.png',womanNovel:'/art/order/characters/woman-novel.png',manHells:'/art/order/characters/man-hells.png',womanHells:'/art/order/characters/woman-hells.png',elvira:'/art/order/characters/elvira.png',elviraHells:'/art/order/characters/elvira-hells.png',echo:'/art/order/characters/echo.png',guardian:'/art/order/characters/guardian.png',church:'/art/order/backgrounds/church.png',hells:'/art/order/backgrounds/hells.png'} as const;
export const BUILT_IN_ASSETS:Asset[]=[
  {
    "id": "order-man",
    "name": "Searcher · Homem",
    "category": "Personagens",
    "mime": "image/png",
    "size": 1940639,
    "url": "/art/order/characters/man.png",
    "thumbnail": "/art/order/characters/man.png"
  },
  {
    "id": "order-woman",
    "name": "Searcher · Mulher",
    "category": "Personagens",
    "mime": "image/png",
    "size": 2319577,
    "url": "/art/order/characters/woman.png",
    "thumbnail": "/art/order/characters/woman.png"
  },
  {
    "id": "order-man-novel",
    "name": "Searcher · Homem · Visual Novel",
    "category": "Personagens",
    "mime": "image/png",
    "size": 2082657,
    "url": "/art/order/characters/man-novel.png",
    "thumbnail": "/art/order/characters/man-novel.png"
  },
  {
    "id": "order-woman-novel",
    "name": "Searcher · Mulher · Visual Novel",
    "category": "Personagens",
    "mime": "image/png",
    "size": 2419014,
    "url": "/art/order/characters/woman-novel.png",
    "thumbnail": "/art/order/characters/woman-novel.png"
  },
  {
    "id": "order-man-hells",
    "name": "Searcher · Homem · Hells",
    "category": "Personagens",
    "mime": "image/png",
    "size": 2948857,
    "url": "/art/order/characters/man-hells.png",
    "thumbnail": "/art/order/characters/man-hells.png"
  },
  {
    "id": "order-woman-hells",
    "name": "Searcher · Mulher · Hells",
    "category": "Personagens",
    "mime": "image/png",
    "size": 3055113,
    "url": "/art/order/characters/woman-hells.png",
    "thumbnail": "/art/order/characters/woman-hells.png"
  },
  {
    "id": "order-elvira",
    "name": "Dona Elvira",
    "category": "Personagens",
    "mime": "image/png",
    "size": 2221502,
    "url": "/art/order/characters/elvira.png",
    "thumbnail": "/art/order/characters/elvira.png"
  },
  {
    "id": "order-elvira-hells",
    "name": "Elvira · Hells",
    "category": "Personagens",
    "mime": "image/png",
    "size": 2656675,
    "url": "/art/order/characters/elvira-hells.png",
    "thumbnail": "/art/order/characters/elvira-hells.png"
  },
  {
    "id": "order-echo",
    "name": "Eco do Contrato",
    "category": "Personagens",
    "mime": "image/png",
    "size": 1521988,
    "url": "/art/order/characters/echo.png",
    "thumbnail": "/art/order/characters/echo.png"
  },
  {
    "id": "order-guardian",
    "name": "Guardião do Prazo",
    "category": "Personagens",
    "mime": "image/png",
    "size": 1635119,
    "url": "/art/order/characters/guardian.png",
    "thumbnail": "/art/order/characters/guardian.png"
  },
  {
    "id": "order-church-map",
    "name": "Igreja de Santa Cecília · Planta (Clue)",
    "category": "Cenários",
    "mime": "image/webp",
    "size": 360000,
    "url": "/art/order/backgrounds/church-map.webp",
    "thumbnail": "/art/order/backgrounds/church-map.webp"
  },
  {
    "id": "order-church",
    "name": "Igreja · Exterior",
    "category": "Cenários",
    "mime": "image/png",
    "size": 2309145,
    "url": "/art/order/backgrounds/church.png",
    "thumbnail": "/art/order/backgrounds/church.png"
  },
  {
    "id": "order-nave",
    "name": "Nave principal",
    "category": "Cenários",
    "mime": "image/png",
    "size": 2181121,
    "url": "/art/order/backgrounds/nave.png",
    "thumbnail": "/art/order/backgrounds/nave.png"
  },
  {
    "id": "order-sacristy",
    "name": "Sacristia",
    "category": "Cenários",
    "mime": "image/png",
    "size": 2040976,
    "url": "/art/order/backgrounds/sacristy.png",
    "thumbnail": "/art/order/backgrounds/sacristy.png"
  },
  {
    "id": "order-archive",
    "name": "Arquivo paroquial",
    "category": "Cenários",
    "mime": "image/png",
    "size": 2210954,
    "url": "/art/order/backgrounds/archive.png",
    "thumbnail": "/art/order/backgrounds/archive.png"
  },
  {
    "id": "order-confessional",
    "name": "Confessionário",
    "category": "Cenários",
    "mime": "image/png",
    "size": 2191001,
    "url": "/art/order/backgrounds/confessional.png",
    "thumbnail": "/art/order/backgrounds/confessional.png"
  },
  {
    "id": "order-courtyard",
    "name": "Pátio do abrigo",
    "category": "Cenários",
    "mime": "image/png",
    "size": 2380953,
    "url": "/art/order/backgrounds/courtyard.png",
    "thumbnail": "/art/order/backgrounds/courtyard.png"
  },
  {
    "id": "order-corridor",
    "name": "Corredor dos fundos",
    "category": "Cenários",
    "mime": "image/png",
    "size": 2087539,
    "url": "/art/order/backgrounds/corridor.png",
    "thumbnail": "/art/order/backgrounds/corridor.png"
  },
  {
    "id": "order-locked-room",
    "name": "Quarto trancado",
    "category": "Cenários",
    "mime": "image/png",
    "size": 2288472,
    "url": "/art/order/backgrounds/locked-room.png",
    "thumbnail": "/art/order/backgrounds/locked-room.png"
  },
  {
    "id": "order-hells",
    "name": "Hells",
    "category": "Cenários",
    "mime": "image/png",
    "size": 2743919,
    "url": "/art/order/backgrounds/hells.png",
    "thumbnail": "/art/order/backgrounds/hells.png"
  }
];
export function sceneArtwork(background:string,mode:Mode,name='',fallback:string=ORDER_ART.church){
 if(background&&background!=='/art/inferno.svg')return background;
 if(mode==='HELLS'||background==='/art/inferno.svg')return ORDER_ART.hells;
 const normalized=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const area=[['sacrist','sacristy'],['arquivo','archive'],['confession','confessional'],['patio','courtyard'],['corredor','corridor'],['quarto','locked-room'],['nave','nave'],['igreja','church']].find(([key])=>normalized.includes(key));
 return area?'/art/order/backgrounds/'+area[1]+'.png':fallback;
}
export function novelPortrait(portrait:string,mode:Mode){
 if(portrait===ORDER_ART.man)return mode==='HELLS'?ORDER_ART.manHells:ORDER_ART.manNovel;
 if(portrait===ORDER_ART.woman)return mode==='HELLS'?ORDER_ART.womanHells:ORDER_ART.womanNovel;
 if(portrait===ORDER_ART.elvira&&mode==='HELLS')return ORDER_ART.elviraHells;
 return portrait;
}

const bundledUrls=new Set(BUILT_IN_ASSETS.map(asset=>asset.url));
export const isBundledArt=(value:string)=>bundledUrls.has(value)||/^\/art\/order\/cards\/[A-Za-z0-9]+\.webp$/.test(value);
