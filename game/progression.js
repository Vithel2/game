export const SEASONS=[{id:'summer',name:'Лето',ground:'#90ac82',leaf:'#6e9b62',sky:'#bbd9df'},{id:'autumn',name:'Осень',ground:'#aaa178',leaf:'#c28a48',sky:'#c4c8c3'},{id:'winter',name:'Зима',ground:'#e0e9e7',leaf:'#cededb',sky:'#bacddc'},{id:'spring',name:'Весна',ground:'#9eb890',leaf:'#91af74',sky:'#c4dfe0'}];
export const seasonFor=day=>SEASONS[Math.floor((day-1)/7)%4];
export function resetDay(s){s.daily={day:s.day,inspections:0,sold:0,foodBuys:0};s.stock={battery:2,charge:1,display:0};}
export function advanceTime(s,minutes){s.time+=minutes;while(s.time>=1440){s.time-=1440;s.day++;resetDay(s)};}
export function skyPhase(minutes){
 const t=minutes%1440;
 if(t<300||t>=1260)return {name:'Ночь',dark:1,sun:'#93a8da',sky:'#253b58'};
 if(t<420){const u=(t-300)/120;return {name:'Рассвет',dark:1-u,sun:'#edb58f',sky:'#b1b7c8'};}
 if(t<1020)return {name:'День',dark:0,sun:'#fff0d2',sky:null};
 return {name:'Вечер',dark:(t-1020)/240,sun:'#efb482',sky:'#a58fa4'};
}
const doneKinds=s=>new Set(s.phones.filter(p=>p.fixed).map(p=>p.kind||'phone')).size;
const req=(label,value,target)=>({label,value,target,done:value>=target});
export const CHAPTERS=[
 {id:'restart',title:'Не с нуля — с опыта',who:'Лев',line:'Я видел, как ты начинал в первый раз. На этот раз пусть мастерская будет твоей, а не партнёра.',goals:s=>[req('Первая продажа',s.sold,1)],reward:250},
 {id:'honest-work',title:'Деньги без риска',who:'Тамара',line:'Пока ждёшь детали, помоги нам на смене. Заработаешь и узнаешь район.',goals:s=>[req('Смены в Пятаке',s.work.grocery,2),req('Смена в Azon',s.work.pickup,1)],reward:500},
 {id:'neighbors',title:'Тебя снова узнают',who:'Лиза',line:'Для доверия не нужен старый канал. Нужны люди, которым ты помог сейчас.',goals:s=>[req('Знакомства',Object.values(s.friends).filter(n=>n>0).length,3),req('Заказ жителя',s.stats.jobsCompleted,1)],reward:600},
 {id:'collection',title:'У каждой вещи свой характер',who:'Денис',line:'Покажи, что можешь восстановить не только один и тот же телефон. Я принесу тебя в клуб мастеров.',goals:s=>[req('Виды восстановленной техники',doneKinds(s),3),req('Всего ремонтов',s.stats.repairs,5)],reward:700},
 {id:'evidence',title:'Версия для публики',who:'Лиза',line:'Расскажи свою историю сам. Без громких обещаний — покажи работу.',goals:s=>[req('Ролики',s.vlog.posts.length,4),req('Подписчики',s.vlog.subs,500)],reward:800},
 {id:'autumn',title:'Первый сезон новой жизни',who:'Лев',line:'В старом парке оставили коробку техники. Загляни, пока её не унесли под дождь.',goals:s=>[req('День',s.day,8),req('Находки в парке',s.stats.salvaged,3),req('Улучшенный стол',+s.upgrade,1)],reward:1000},
 {id:'deep-repair',title:'Неисправность под неисправностью',who:'Маша',line:'Продавец списал всё на аккумулятор. Диагностика показывает больше. Здесь пригодятся фен, очистка и точная пайка.',goals:s=>[req('Сложные ремонты',s.phones.filter(p=>p.fixed&&['advanced','expert'].includes(p.difficulty)).length,2)],reward:1200},
 {id:'own-rules',title:'Больше не на чужом месте',who:'Тамара',line:'Нам предлагают заменить мастерскую пунктом аренды. Докажи, что району нужен свой мастер.',goals:s=>[req('Довольные жители',s.stats.jobsCompleted,3),req('Продажи',s.sold,10),req('Доход от подработки',s.work.earned,2000)],reward:1400},
 {id:'winter',title:'Длинные зимние вечера',who:'Денис',line:'Зимой хорошая мастерская — место, куда приходят и чинить, и общаться. Соберём тебе настоящий рабочий компьютер.',goals:s=>[req('День',s.day,15),req('Уровни RAM + GPU + SSD',s.pc.ram+s.pc.gpu+s.pc.ssd,6),req('Ремонты',s.stats.repairs,12)],reward:1600},
 {id:'voice',title:'Канал, которому верят',who:'Лиза',line:'Рекламодатель просит назвать рефаб новым. Мы можем заработать иначе. Пусть канал растёт на настоящей работе.',goals:s=>[req('Подписчики',s.vlog.subs,1600),req('Монетизация',+s.vlog.monetized,1),req('Совместные знакомства',Object.values(s.friends).reduce((a,b)=>a+b,0),9)],reward:1800},
 {id:'old-debt',title:'Письмо из прежней жизни',who:'Лев',line:'Партнёр вышел на связь. Он предлагает вернуть вывеску в обмен на долю. Сначала закончи свою самую сложную работу — решение примешь уже без нужды.',goals:s=>[req('Экспертные ремонты',s.phones.filter(p=>p.fixed&&p.difficulty==='expert').length,3),req('Репутация',s.reputation,85)],reward:2200},
 {id:'spring',title:'Городская выставка',who:'Маша',line:'На весеннюю выставку нужны мастера из района. Не цена стенда, а вещи с историей.',goals:s=>[req('День',s.day,22),req('Разные виды техники',doneKinds(s),4),req('Всего ремонтов',s.stats.repairs,20)],reward:2500},
 {id:'independent',title:'Без чужих правил',who:'Лев',line:'Ты можешь вернуть старое имя или оставить новое. Теперь у тебя есть мастерская, друзья и возможность выбирать.',goals:s=>[req('Продажи',s.sold,20),req('Публикации',s.vlog.posts.length,12),req('Смены',s.work.grocery+s.work.pickup,12)],reward:3000},
 {id:'full-circle',title:'Четыре времени твоего года',who:'Лиза',line:'Мы начинали с коробки и одной сделки. Дальше нет обязательного финала. Снимем эту мастерскую такой, какой ты её построил.',goals:s=>[req('Полный круг сезонов: день',s.day,29),req('Ремонты',s.stats.repairs,28),req('Подписчики',s.vlog.subs,2500)],reward:4000}
];
export function chapterStatus(s){const chapter=CHAPTERS[s.story.chapter];if(!chapter)return null;const goals=chapter.goals(s);return {...chapter,goals,ready:goals.every(g=>g.done)};}
export function claimChapter(s,choice){const c=chapterStatus(s);if(!c?.ready||!['craft','media'].includes(choice))return null;s.story.history.push({id:c.id,day:s.day,choice});s.story.chapter++;s.money+=c.reward;if(choice==='craft')s.parts.battery++;else s.vlog.subs+=100;return c;}
export const SHIFT_GOODS={grocery:['bread','milk','water','apple','cheese','noodles','juice','sandwich','chips','coffee'],pickup:['battery','charge','ram','gpu','ssd','phone']};
export function startShift(s,place){if(!SHIFT_GOODS[place]||s.work.active||s.work.last[place]===s.day)return null;const items=SHIFT_GOODS[place],n=s.work[place],tasks=Array.from({length:5},(_,i)=>{const a=(s.day*3+i*(items.length===10?3:5)+n)%items.length;return {item:items[a],cell:(a%6)+1,options:[items[a],items[(a+1+i%2)%items.length],items[(a+3)%items.length]].sort((a,b)=>a.localeCompare(b))}});s.work.last[place]=s.day;return s.work.active={id:s.serial++,place,day:s.day,index:0,errors:0,remaining:90,tasks,finished:false,paid:false};}
export function answerShift(s,answer){const a=s.work.active;if(!a||a.finished)return false;if(a.remaining<=0){a.finished=true;return false}const t=a.tasks[a.index];if(answer!==t.item){a.errors++;a.remaining=Math.max(0,a.remaining-4);return false}a.index++;if(a.index===a.tasks.length)a.finished=true;return true;}
export function wageFor(s){const a=s.work.active;if(!a)return 0;return Math.max(0,Math.round((250+Math.min(5,Math.floor(s.work[a.place]/3))*50)*a.index/5)-a.errors*15);}
export function claimWage(s){const a=s.work.active;if(!a?.finished||a.paid)return null;const wage=wageFor(s);a.paid=true;s.money+=wage;s.work.earned+=wage;if(a.index>=3)s.work[a.place]++;else s.work.abandoned=(s.work.abandoned||0)+1;s.work.active=null;return wage;}
