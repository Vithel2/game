import {KEY} from './state.js';
export function parseSave(text){
 if(text.length>2_000_000)throw Error('Файл сохранения слишком большой.');
 const s=JSON.parse(text);
 if(!s||typeof s!=='object'||Array.isArray(s)||![3,4,5,6,7,8].includes(s.version))throw Error('Это не сохранение «Перекупа».');
 for(const k of ['day','money','time'])if(!Number.isFinite(s[k])||s[k]<0)throw Error('Повреждены данные сохранения.');
 if(!Array.isArray(s.phones)||!s.profile||typeof s.profile.name!=='string')throw Error('Повреждены данные игрока.');
 JSON.stringify(s,(k,v)=>{if(['__proto__','prototype','constructor'].includes(k))throw Error('Недопустимые данные.');return v});
 return s;
}
export function importSave(text,storage=localStorage){
 const s=parseSave(text),old=storage.getItem(KEY);
 // Fail before replacing progress if there is no room for the backup.
 if(old)storage.setItem(KEY+'-backup',old);
 storage.setItem(KEY,JSON.stringify(s));return s;
}
