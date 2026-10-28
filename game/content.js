import {repairStage} from './state.js';

export const QUESTS=[
 {id:'first-buy',title:'Моя первая сделка',who:'Лев · сосед-мастер',text:'Осмотри телефон на встрече и купи свой первый аппарат для восстановления.',reward:150,ready:s=>s.phones.some(p=>!p.client)&&s.stats.inspections>0},
 {id:'parcel',title:'Детали сами не приедут',who:'Маша · Azon',text:'Закажи запчасть и получи её внутри пункта выдачи.',reward:180,ready:s=>s.stats.collected>0},
 {id:'first-sale',title:'Вторая жизнь',who:'Лев · сосед-мастер',text:'Полностью восстанови и продай первый телефон.',reward:300,ready:s=>s.sold>=1},
 {id:'lunch',title:'Обед по расписанию',who:'Тамара · Пятак',text:'Зайди внутрь магазина и купи горячий перекус на кассе.',reward:100,ready:s=>s.stats.groceryVisits>0&&s.stats.foodBuys>0},
 {id:'workbench',title:'Рабочее место решает',who:'Лев · сосед-мастер',text:'Улучши ремонтный стол через инвентарь.',reward:250,ready:s=>s.upgrade},
 {id:'computer',title:'Не только телефоны',who:'Маша · Azon',text:'Купи комплект ПК и поставь его дома.',reward:250,ready:s=>s.pc.owned},
 {id:'ram',title:'Памяти много не бывает',who:'Денис · любитель железа',text:'Установи в свой ПК первый комплект оперативной памяти.',reward:200,ready:s=>s.pc.ram>=1},
 {id:'phone-game',title:'Пять минут отдыха',who:'Денис · любитель железа',text:'Набери 5 очков в «Лови сигнал» на игровом телефоне.',reward:100,ready:s=>s.records.phone>=5},
 {id:'pc-game',title:'Ночная доставка',who:'Маша · Azon',text:'Набери 100 очков в «Ночном курьере» на своём ПК.',reward:300,ready:s=>s.records.pc>=100},
 {id:'charge-repair',title:'Сложный случай',who:'Лев · сосед-мастер',text:'Восстанови и продай аппарат с неисправным разъёмом зарядки.',reward:400,ready:s=>s.phones.some(p=>p.sold&&p.defect==='charge')},
 {id:'donor-repair',title:'Донор спас положение',who:'Лев · сосед-мастер',text:'Восстанови телефон с разбитым дисплеем. В Azon дисплеев нет — придётся найти донора.',reward:500,ready:s=>s.phones.some(p=>p.sold&&p.defect==='display')},
 {id:'master',title:'У района появился мастер',who:'Жители района',text:'Продай три восстановленных телефона и заслужи репутацию надёжного продавца.',reward:700,ready:s=>s.sold>=3&&s.reputation>=59},
 {id:'neighbor',title:'Соседи советуют соседям',who:'Жители района',text:'Верни жителю района его отремонтированный телефон.',reward:250,ready:s=>s.stats.jobsCompleted>0},
];
export const JOBS=[
 {id:'tamara',name:'Тамара',title:'Касса без связи',text:'Мой личный телефон выключается без зарядки. После смены хочу позвонить дочке — выручишь?',defect:'battery',location:'grocery',pay:1500,bonus:250,days:3},
 {id:'masha',name:'Маша',title:'Уведомления не приходят',text:'Телефон для связи с курьерами перестал заряжаться. Только не потеряй данные: там вся моя смена.',defect:'charge',location:'pickup',pay:1800,bonus:400,days:5},
 {id:'lev',name:'Лев',title:'Экран для старого друга',text:'Плата живая, дисплей после падения умер. Найди хороший донор — лишние детали потом пригодятся.',defect:'display',location:'room',pay:2200,bonus:350,days:4}
];
export function dailyQuests(s){return [
 {id:`daily-${s.day}-inspect`,title:'Присмотреться к товару',text:'Осмотри один телефон на встрече сегодня.',reward:80,ready:s=>s.daily.inspections>0},
 {id:`daily-${s.day}-food`,title:'Не работать голодным',text:'Купи продукты в магазине сегодня.',reward:60,ready:s=>s.daily.foodBuys>0},
 {id:`daily-${s.day}-sale`,title:'Один день — одна сделка',text:'Продай восстановленный телефон сегодня.',reward:120,ready:s=>s.daily.sold>0}
];}
export const PC_UPGRADES={
 ram:{title:'Оперативная память',prices:[700,1400],tiers:['4 ГБ','8 ГБ','16 ГБ'],benefit:'Больше времени в «Ночном курьере»: +10 секунд за уровень.'},
 gpu:{title:'Видеокарта',prices:[1400,2600],tiers:['Встроенная','Pixel G1','Pixel G2'],benefit:'Множитель очков в игре: ×1 / ×1,25 / ×1,5.'},
 ssd:{title:'Накопитель',prices:[500,900],tiers:['HDD 128 ГБ','SSD 256 ГБ','SSD 512 ГБ'],benefit:'Загрузка игры становится быстрее.'}
};
export function tutorialStep(s){
 if(s.sold>0)return {n:8,title:'Первый оборот завершён!',text:'Ты прошёл весь путь от объявления до продажи. Новые задания, ПК и улучшения ждут в журнале.',action:'quests',label:'Открыть задания',done:true};
 const p=s.phones.find(p=>!p.sold);
 if(!p)return {n:1,title:'Найди первую сделку',text:'Открой «Авиту», договорись о встрече. Прочитай отзывы и осмотри телефон перед покупкой.',action:'phoneAvitu',label:'Открыть Авиту'};
 if(p.fixed)return {n:8,title:'Найди нового владельца',text:'Телефон исправен. Открой «Мои телефоны» и продай его покупателю.',action:'phoneGoods',label:'Продать телефон'};
 if(p.removed&&!p.installed&&!s.parts[p.defect]){
  const o=s.orders.find(o=>o.part===p.defect&&!o.picked);
  if(!o)return {n:4,title:'Нужна запчасть',text:p.defect==='display'?'Дисплей придётся снять с донора. Найди его в «Авиту».':'Закажи нужную деталь в Azon. Прочитай срок доставки.',action:p.defect==='display'?'phoneAvitu':'phoneAzon',label:'Найти деталь'};
  if(o.ready>s.day)return {n:5,title:'Пока едет посылка',text:`Заказ прибудет в день ${o.ready}. Отложи ремонт, отдохни или займись другой сделкой.`,action:'bed',label:'Вернуться ко сну'};
  return {n:6,title:'Забери посылку',text:'Выйди на улицу, зайди внутрь Azon и подойди к стойке выдачи.',action:'visitPickup',label:'В пункт выдачи'};
 }
 if(p.installed)return {n:7,title:'Собери и проверь',text:'Подключи три разъёма, опусти дисплей, верни восемь винтов и проверь телефон.',action:'bench',label:'К рабочему столу'};
 if(repairStage(p)==='install')return {n:7,title:'Деталь уже у тебя',text:'Вернись к столу и установи деталь рукой. Затем подключи шлейфы и собери телефон.',action:'bench',label:'Продолжить ремонт'};
 return {n:p.diagnosed?3:2,title:p.diagnosed?'Разбери аккуратно':'Узнай, что сломано',text:p.diagnosed?'Отвёртка — для винтов, присоска — для дисплея, лопатка — для разъёмов. Подсказки над столом покажут порядок.':'На рабочем столе проведи диагностику. Ремонт можно отложить — детали и прогресс сохранятся.',action:'bench',label:'К рабочему столу'};
}
