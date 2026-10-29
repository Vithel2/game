import {screwMask} from './repair-rules.js';
export const HANDSETS={
 mini:{name:'iPhone 13 mini',os:'iOS 18',port:'Lightning',chip:'Apple A15 Bionic',ram:4,storage:128,screen:'5,4″ OLED · 60 Гц',battery:2438,charge:20,network:148},
 neo:{name:'iQOO Neo 10',os:'Android 15',port:'USB-C',chip:'Snapdragon 8s Gen 4',ram:12,storage:256,screen:'6,78″ AMOLED · 144 Гц',battery:7000,charge:120,network:386},
 pro:{name:'iPhone 13 Pro',os:'iOS 18',port:'Lightning',chip:'Apple A15 Bionic',ram:6,storage:256,screen:'6,1″ OLED · 120 Гц',battery:3095,charge:27,network:224},
 realme:{name:'realme GT Neo 6',os:'Android 14 · realme UI',port:'USB-C',chip:'Snapdragon 8s Gen 3',ram:12,storage:256,screen:'6,78″ AMOLED · 120 Гц',battery:5500,charge:120,network:332}
};
export const GADGETS={console:{name:'PlayStation 5 Slim',os:'PlayStation OS'},portable:{name:'Steam Deck LCD',os:'SteamOS 3'},gamepad:{name:'8BitDo Ultimate 2C',os:'Прошивка контроллера'},speaker:{name:'JBL Flip 6',os:'Прошивка акустики'},headphones:{name:'Soundcore Q20i',os:'Прошивка гарнитуры'}};
export function handset(p={}){if(HANDSETS[p.model])return HANDSETS[p.model];const n=p.name||'';return /realme/i.test(n)?HANDSETS.realme:/Neo|R \/ 02/i.test(n)?HANDSETS.neo:/Pro|PRO/.test(n)?HANDSETS.pro:HANDSETS.mini;}
export const deviceOS=p=>p.kind&&p.kind!=='phone'?(GADGETS[p.kind]?.os||'Прошивка устройства'):handset(p).os;
export function renameLegacy(p){if(!p)return p;let name=p.name||'';for(const [old,next]of [['R / 01',HANDSETS.mini.name],['Aster 13 mini',HANDSETS.mini.name],['R / 02',HANDSETS.neo.name],['Qubo Neo 10',HANDSETS.neo.name],['R / PRO',HANDSETS.pro.name],['Aster 13 Pro',HANDSETS.pro.name],['Карманный геймпад','8BitDo Micro'],['Геймпад',GADGETS.gamepad.name],['Колонка',GADGETS.speaker.name],['Наушники',GADGETS.headphones.name]])name=name.replaceAll(old,next);return {...p,...(p.closed&&!p.fixed&&((p.inside||0)&screwMask(p))!==screwMask(p)?{closed:false}:{}),...(name?{name}:{})};}
