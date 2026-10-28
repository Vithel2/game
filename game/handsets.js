import {screwMask} from './repair-rules.js';
// Fictional manufacturers; familiar model naming, no third-party marks or logos.
export const HANDSETS={
 mini:{name:'Aster 13 mini',chip:'A15 Compact',ram:4,storage:128,screen:'5,4″ OLED · 60 Гц',battery:2438,charge:20,network:148},
 neo:{name:'Qubo Neo 10',chip:'Dragon 8s',ram:12,storage:256,screen:'6,78″ AMOLED · 144 Гц',battery:7000,charge:120,network:386},
 pro:{name:'Aster 13 Pro',chip:'A15 Pro',ram:6,storage:256,screen:'6,1″ OLED · 120 Гц',battery:3095,charge:27,network:224}
};
export function handset(p={}){if(HANDSETS[p.model])return HANDSETS[p.model];return /Neo|R \/ 02/.test(p.name||'')?HANDSETS.neo:/Pro|PRO/.test(p.name||'')?HANDSETS.pro:HANDSETS.mini;}
export function renameLegacy(p){if(!p)return p;return {...p,...(p.closed&&!p.fixed&&(p.inside||0)!==screwMask(p)?{closed:false}:{}),...(p.name?{name:p.name.replace(/R \/ 01/g,HANDSETS.mini.name).replace(/R \/ 02/g,HANDSETS.neo.name).replace(/R \/ PRO/g,HANDSETS.pro.name)}:{})};}
