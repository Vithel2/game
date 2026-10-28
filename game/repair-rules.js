export const LEVELS={quick:{name:'Быстрый',screws:4,connectors:1},standard:{name:'Обычный',connectors:3},advanced:{name:'Сложный',screws:10,connectors:3},expert:{name:'Экспертный',screws:12,connectors:3}};
export const levelOf=p=>LEVELS[p.difficulty]||LEVELS.standard;
export const screwCount=p=>levelOf(p).screws||(p.kind&&p.kind!=='phone'?4:8);
export const screwMask=p=>(1<<screwCount(p))-1;
export const connectorCount=p=>levelOf(p).connectors;
export const connectorMask=p=>(1<<connectorCount(p))-1;
export const complicated=p=>['advanced','expert'].includes(p.difficulty);
export function stageFor(p){
 if(!p.diagnosed)return 'diagnose';
 if((p.out||0)!==screwMask(p))return 'screws';
 if(complicated(p)&&!p.warmed)return 'heat';
 if(!p.open)return 'open';
 if((p.disconnected||0)!==connectorMask(p))return 'disconnect';
 if(complicated(p)&&!p.cleaned)return 'clean';
 if(!p.removed)return 'remove';
 if(!p.installed)return 'install';
 if(p.difficulty==='expert'&&!p.soldered)return 'solder';
 if((p.connected||0)!==connectorMask(p))return 'connect';
 if((p.inside||0)!==screwMask(p))return 'tighten';
 if(complicated(p)&&!p.sealed)return 'seal';
 if(!p.closed)return 'close';
 if(complicated(p)&&!p.calibrated)return 'calibrate';
 if(!p.fixed)return 'test';
 return 'done';
}
export function installComponent(p){
 p.serviced||=[];if(!p.serviced.includes(p.defect))p.serviced.push(p.defect);
 const next=p.requiredParts?.find(k=>!p.serviced.includes(k));
 if(next){p.defect=next;p.removed=false;p.installed=false;}else p.installed=true;
}
export function resalePrice(p){if(p.resale)return p.resale;return (p.primaryDefect||p.defect)==='battery'?3250:(p.primaryDefect||p.defect)==='charge'?3600:3900;}
