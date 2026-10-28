export const KEY='s-ruk-game-v3';
export const PARTS={battery:{name:'Аккумулятор R / 01',short:'аккумулятор',price:720,days:1,stock:2,icon:'battery'},charge:{name:'Шлейф зарядки',short:'шлейф зарядки',price:390,days:3,stock:1,icon:'plug'},display:{name:'Дисплей R / 01',short:'дисплей',price:2100,days:2,stock:0,icon:'phone'}};
export function fresh(){return {version:3,started:false,day:1,time:540,money:3500,food:85,water:90,energy:95,hp:100,reputation:50,phones:[],parts:{battery:0,charge:0,display:0},orders:[],bought:[],stock:{battery:2,charge:1,display:0},sold:0,profit:0,upgrade:false,serial:1};}
export function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s?.version===3)return s;}catch{}return fresh();}
export function save(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch{}}
export function offers(s){return [
 {id:`${s.day}-a`,name:'R / 01 · не держит заряд',price:850,defect:'battery',seller:'Игорь',rating:'4,8',reviews:24,honest:true,description:'Пользовался сам. Включается от зарядки, без неё сразу гаснет. Коробки нет.',condition:'Оригинальный экран. Сильно изношен аккумулятор.'},
 {id:`${s.day}-b`,name:'R / 01 · «просто сел»',price:1150,defect:'charge',seller:'Саня Техника',rating:'3,1',reviews:17,honest:false,description:'Всё отлично, просто зарядка потерялась. Забирай сегодня, потом дороже.',condition:'Питание не идёт. Следы пайки у разъёма. Продавец умолчал о ремонте.'},
 {id:`${s.day}-c`,name:'R / 01 · после падения',price:600,defect:'display',seller:'Марина',rating:'4,9',reviews:53,honest:true,description:'Звонит, но экран чёрный. Отдам под восстановление. Внутри ничего не меняли.',condition:'Плата работает, дисплей повреждён. Нужна замена.'},
 {id:`${s.day}-donor`,name:'Донор R / 01',price:950,donor:true,seller:'Мастер Лев',rating:'5,0',reviews:112,honest:true,description:'Плата мёртвая, дисплей проверен на другом аппарате. Продаю на детали.',condition:'Исправный оригинальный дисплей, плата не подлежит восстановлению.'}
 ].filter(o=>!s.bought.includes(o.id));}
export function repairStage(p){if(!p.diagnosed)return'diagnose';if((p.out||0)!==255)return'screws';if(!p.open)return'open';if((p.disconnected||0)!==7)return'disconnect';if(!p.removed)return'remove';if(!p.installed)return'install';if((p.connected||0)!==7)return'connect';if(!p.closed)return'close';if((p.inside||0)!==255)return'tighten';if(!p.fixed)return'test';return'done';}
export function money(n){return Math.round(n).toLocaleString('ru-RU')+' ₽';}
export function time(s){return `${String(Math.floor(s.time/60)%24).padStart(2,'0')}:${String(Math.floor(s.time%60)).padStart(2,'0')}`;}
