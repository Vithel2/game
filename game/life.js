export const PERKS=[
 {id:'runner',name:'Бегун',text:'Передвигается на 25% быстрее.',icon:'street'},
 {id:'savvy',name:'Прошаренный',text:'Покупает технику с рук на 8% дешевле.',icon:'sell'},
 {id:'strong',name:'Силач',text:'Корзина на 14 товаров вместо 8. Груз не замедляет.',icon:'bag'},
 {id:'smart',name:'Умник',text:'Улучшения ПК обходятся на 15% дешевле.',icon:'star'},
 {id:'maker',name:'Золотые руки',text:'Ремонт требует на 20% меньше времени и сил.',icon:'driver'},
 {id:'charm',name:'Харизматичный',text:'Влоги привлекают на 25% больше подписчиков.',icon:'heart'}
];
export const VLOG_TOPICS=[
 {id:'story',name:'Как я начинаю заново',text:'Честный рассказ о потере бизнеса и новой мастерской.',need:s=>true,base:45},
 {id:'repair',name:'Ремонт до последнего винтика',text:'Покажи настоящее восстановление техники.',need:s=>s.stats.repairs>0,base:90},
 {id:'haul',name:'Находки на барахолке',text:'Покажи покупки, отзывы и хитрых продавцов.',need:s=>s.phones.some(p=>!p.client),base:65},
 {id:'pc',name:'Мой бюджетный сетап',text:'Обзор своего ПК и улучшений.',need:s=>s.pc.owned,base:85},
 {id:'friends',name:'Сделка с другом',text:'Сними совместный ролик с другом из района.',need:s=>Object.values(s.friends).some(n=>n>0),base:100}
];
export const RIVALS=[{id:'denis',name:'Денис / Плата жива',start:420,growth:35},{id:'liza',name:'Лиза / Второй шанс',start:950,growth:60},{id:'max',name:'Макс / Железный район',start:1800,growth:85}];
export function rivals(s){return RIVALS.map(r=>({...r,subs:r.start+(s.day-1)*r.growth}));}
export function publishVlog(s,topic){
 const t=VLOG_TOPICS.find(t=>t.id===topic);if(!t||!t.need(s)||s.vlog.lastDay===s.day)return null;
 const quality=(1+s.stats.repairs*.06+(s.pc.owned?.15:0)+(s.pc.gpu||0)*.07)*Math.max(.65,Math.min(1.5,s.vlog.draftQuality||1));
 const growth=Math.round(t.base*quality*(s.profile.perk==='charm'?1.25:1));const views=growth*(8+(s.vlog.posts.length%4)*3);const earnings=s.vlog.monetized?Math.round(views*.025):0;
 const post={id:s.serial++,topic:t.name,title:s.vlog.draftTitle||t.name,cover:s.vlog.cover||'before',quality:s.vlog.draftQuality||1,day:s.day,subs:growth,views,earnings};s.vlog.posts.unshift(post);s.vlog.subs+=growth;s.vlog.views+=views;s.vlog.earned+=earnings;s.money+=earnings;s.vlog.lastDay=s.day;return post;
}
export function training(s){
 if(s.training.complete)return null;
 const p=s.phones.find(p=>!p.client&&!p.sold);
 if(!s.training.moved)return {id:'move',title:'Сначала освоимся',text:'Нажми на оранжевое кольцо на полу. Персонаж обойдёт мебель.',target:'[data-action="trainingMove"]',allow:['trainingMove'],progress:0};
 if(!p&&!s.sold){if(!s.training.phone)return {id:'phone',title:'Твой рабочий телефон',text:'Нажми на подсвеченный телефон снизу.',target:'#dock [data-action="phone"]',allow:['phone'],progress:1};if(!s.training.market)return {id:'market',title:'Найди первый аппарат',text:'Открой «Авиту» — здесь будут новые предложения каждый день.',target:'.phone-nav [data-tab="avitu"]',allow:['tab','phone','phoneAvitu'],progress:2};if(!s.training.meeting)return {id:'meet',title:'Назначь встречу',text:'Выбери первый R / 01. Обрати внимание на отзывы продавца.',target:'[data-action="meet"]',allow:['meet','tab','phone','phoneAvitu'],progress:3};return {id:'seller',title:'Осмотри товар лично',text:'Подойди к продавцу. Сначала осмотри аппарат, затем покупай.',target:'[data-action="seller"]',allow:['seller','inspect','buy','phone','tab','goStreet','meet'],progress:4};}
 if(p&&!p.diagnosed)return {id:'bench',title:'Проверим покупку',text:'Вернись домой, выбери телефон на столе и подключи питание.',target:'[data-action="bench"]',allow:['goHome','bench','repairPhone','diagnose','goStreet'],progress:5};
 if(p&&!p.fixed)return {id:'repair',title:'Работаем по порядку',text:'Оранжевая подсветка показывает нужный инструмент или деталь. Возьми инструмент с коврика.',target:null,allow:['tool','diagnose','screw','open','connector','remove','install','close','test','leaveRepair','phone','phoneAzon','phoneAvitu','tab','order','bed','sleep','goStreet','goHome','pickup','pickupCounter','visitPickup','collect','bench','repairPhone','meet','seller','inspect','buy'],progress:6};
 if(p?.fixed)return {id:'sale',title:'Первый заработок',text:'Выбери способ продажи. Передай аппарат покупателю на встрече или отправь через Azon.',target:'[data-action="sell"]',allow:['phone','phoneGoods','tab','sell','saleMethod','visitBuyer','buyer','buyerCheck','confirmSale','visitPickup','pickup','pickupCounter','shipSale','goStreet','goHome','sellerProfile','bed','sleep'],progress:7};
 return {id:'done',title:'Ты освоился!',text:'Теперь доступны друзья, магазин, заказы, ПК и Youpube.',target:'[data-action="finishTraining"]',allow:['finishTraining'],progress:8};
}
