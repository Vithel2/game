import {World} from './world.js';
import {PARTS,fresh,load,save,offers,repairStage,money,time,screwCount} from './state.js';
import {QUESTS,dailyQuests,PC_UPGRADES,tutorialStep,JOBS} from './content.js';
import {audio} from './audio.js';
import {startArcade} from './arcade.js';
import {Features} from './features.js';
import {FOOD} from './products.js';
import {Vector3} from 'three';
import {Expansion} from './expansion.js';
import {advanceTime} from './progression.js';
import {Marketplace} from './marketplace.js';
import {MediaStudio} from './media-studio.js';
import {HomeCalendar} from './calendar.js';
import {dealFor,sellerRating} from './trading.js';
import {connectorCount,installComponent,resalePrice,levelOf} from './repair-rules.js';

const $=s=>document.querySelector(s);let state=load(),world,modal=null,tab='home',repairId=null,tool='hand',pending=state.meeting||null,inspected=false,ready=false,title=true,muted=false,toastTimer,arcade=null,arcadeResult=null,tutorialPage=0,activeDevice=null,lastModalContext='';
const iconPaths={coin:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M9 7h4a3 3 0 0 1 0 6H9m0-6v11m-2-3h7',clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 4v6l4 2',phone:'M7 2h10v20H7V2m3 17h4',bench:'M3 9h18M5 9v12m14-12v12M7 9V4h10v5',bed:'M3 5v16m18-10v10M3 16h18M3 9h7v7m0-5h11v5',bag:'M5 7h14l2 14H3L5 7m3 0V5a4 4 0 0 1 8 0v2',home:'m2 11 10-9 10 9M5 9v12h14V9m-9 12v-7h4v7',street:'M4 3v18m16-18v18M12 3v4m0 3v4m0 3v4',water:'M12 2C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-13',food:'M5 2v7m4-7v7M3 6h8v4H7v12M18 2v20m0-20c-5 4-5 10 0 10',energy:'m13 2-8 12h6l-1 8 9-13h-6l1-7',heart:'M12 21 3 12C-3 5 7-1 12 6c5-7 15-1 9 6l-9 9',hand:'M8 13V5a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v8-5a2 2 0 0 1 4 0v9c0 5-3 7-7 7-3 0-5-2-7-4l-4-5a2 2 0 0 1 3-3l3 3',driver:'m4 20 6-6m-1-3 9-9 4 4-9 9-4-4m-5 9-2 2',spudger:'m3 21 9-9m-1-2 8-8 3 3-8 8-3-3m-9 9 4-1 1 2-4 1-1-2',suction:'M12 3v9m-4-9h8M3 18c0-7 18-7 18 0v3H3v-3',close:'m5 5 14 14M19 5 5 19',check:'m4 12 5 5L20 6',arrow:'M3 12h18m-7-7 7 7-7 7',parcel:'m3 7 9-5 9 5v12l-9 4-9-4V7m0 0 9 5 9-5m-9 5v11',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m-1-6h2l1 3 3 1 3-1 2 3-2 2v4l2 2-2 3-3-1-3 1-1 3h-2l-1-3-3-1-3 1-2-3 2-2v-4L2 8l2-3 3 1 3-1 1-3',star:'m12 2 3 6 7 1-5 5 1 8-6-3-6 3 1-8-5-5 7-1 3-6',plug:'M7 2v6m10-6v6M5 8h14v4c0 4-3 5-7 5s-7-1-7-5V8m7 9v5',battery:'M9 2h6v3H9V2M6 5h12v17H6V5m6 4v8m-3-4h6',sell:'m3 3 9 0 10 10-9 9L3 12V3m4 4h.01'};
function icon(n){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${iconPaths[n]||iconPaths.bag}"/></svg>`}
function button(action,label,kind='',extra=''){return `<button class="btn ${kind}" data-action="${action}" ${extra}>${label}</button>`}
const features=new Features({recordVlog:topic=>media.handle('recordVlog',topic),state:()=>state,world:()=>world,button,icon,audio,open,close,persist,toast,tick,walk,launchArcade,tool:()=>tool,setTool:key=>{tool=key},setTitle:value=>{title=value}});
const expansion=new Expansion({state:()=>state,world:()=>world,button,icon,img:key=>features.img(key),audio,open,close,persist,toast,tick,walk,save:()=>save(state),phone:currentPhone,completeRepair:(a,i)=>repairAction(a,i,true),renderJobs:jobsHTML,renderGoals:compactGoalsHTML});
const extraAPI={state:()=>state,world:()=>world,button,img:key=>features.img(key),audio,open,close,persist,toast,tick,walk};
const market=new Marketplace(extraAPI),media=new MediaStudio(extraAPI),calendar=new HomeCalendar(extraAPI);
function sound(freq=540){audio.play(freq>=900?'coin':freq<450?'tool':'ui')}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4200)}
function tick(minutes=5,energy=1){if(state.food<20||state.water<20)energy*=1.5;advanceTime(state,minutes);state.food=Math.max(0,state.food-minutes/65);state.water=Math.max(0,state.water-minutes/48);state.energy=Math.max(0,state.energy-energy);if(state.food<5||state.water<5)state.hp=Math.max(10,state.hp-1);}
function persist(){save(state);paint()}
function currentPhone(){return state.phones.find(p=>p.id===repairId)}
function objective(){if(state.sold>=3)return['Мастерская на ходу','Улучшай стол и продолжай сделки'];if(state.sold)return[`Хорошее начало · ${state.sold}/3`,'Восстанови и продай ещё один телефон'];const p=state.phones.find(p=>!p.sold);if(!p)return['Твой первый оборот','Открой «Авиту» и договорись о встрече'];if(p.fixed)return['Осталось найти покупателя','Продай восстановленный телефон'];if(p.removed&&!p.installed&&!state.parts[p.defect]){const ready=state.orders.some(o=>!o.picked&&o.ready<=state.day);return['Нужна запчасть',ready?'Посылка приехала. Забери её в Azon':'Закажи деталь в Azon и дождись доставки']}return['Восстанови первый телефон','Рабочий стол уже готов к ремонту']}
function paint(){
 if(!ready)return;const context=[modal,tab,expansion.journalTab,modal==='channel'?media.tab:''].join('/'),same=context===lastModalContext,scrolls=same?['.modal','.app-body','.phone-wallpaper'].map(q=>[q,document.querySelector(q)?.scrollTop||0]):[],expanded=same?[...document.querySelectorAll('details[open][data-key]')].map(e=>e.dataset.key):[];const focus=same?document.activeElement?.id:null;lastModalContext=context;world.decorate(state);world.seated=['pc','channel','videoEdit','videoWatch'].includes(modal)||(modal==='arcade'&&activeDevice==='pc');calendar.draw();const [goal,sub]=objective();const claimable=[...QUESTS,...dailyQuests(state)].filter(q=>q.ready(state)&&!state.claims.includes(q.id)).length;
 $('#hud').innerHTML=`<div class="hud-left"><div class="pill money">${icon('coin')}<span>${money(state.money)}</span></div><div class="pill lilac">${icon('clock')}<span>${time(state)}</span></div><div class="pill day">День ${state.day}</div></div><div class="hud-right"><button class="square quest-button" data-action="quests" aria-label="Задания">${icon('check')}${claimable?`<i class="quest-badge">${claimable}</i>`:''}</button><button class="square" data-action="phone" aria-label="Телефон">${icon('phone')}</button><button class="square" data-action="inventory" aria-label="Инвентарь">${icon('bag')}</button><button class="square" data-action="pause" aria-label="Пауза">${icon('settings')}</button></div>`;
 $('#needs').innerHTML=[['food','food','Сытость'],['water','water','Вода'],['energy','energy','Энергия'],['hp','heart','Здоровье']].map(([v,i,label])=>`<div class="need" title="${label}: ${Math.round(state[v])}" aria-label="${label}: ${Math.round(state[v])}">${icon(i)}<div><i style="width:${state[v]}%;background:${state[v]<25?'#cf7564':''}"></i></div></div>`).join('');
 $('#objective').innerHTML=`<span class="eyebrow">${world.mode==='repair'?'НА РАБОЧЕМ СТОЛЕ':world.mode==='street'?'ЦЕНТРАЛЬНЫЙ РАЙОН':world.mode==='grocery'?'ПЯТАК · ВНУТРИ':world.mode==='pickup'?'AZON · ВНУТРИ':world.mode==='park'?'СТАРЫЙ СКВЕР':'ДОМА · МАСТЕРСКАЯ'}</span><strong>${goal}</strong><small>${sub}</small>`;
 $('#dock').innerHTML=world.mode==='repair'?`<div class="tools">${[['hand','Рука'],['driver','Отвёртка'],['suction','Присоска'],['spudger','Лопатка'],...({heat:[['heater','Фен']],clean:[['brush','Кисть']],solder:[['iron','Паяльник']],seal:[['glue','Герметик']],calibrate:[['meter','Прибор']]}[currentPhone()?repairStage(currentPhone()):'']||[])].map(([id,t])=>`<button class="tool ${tool===id?'active':''}" data-action="tool" data-tool="${id}">${icon(id)}<span>${t}</span></button>`).join('')}</div>${button('leaveRepair','Отложить ремонт','subtle')}`:`<div class="dock-actions">${button('phone',icon('phone')+'<span>Телефон</span>')}${button('bench',icon('bench')+'<span>Ремонт</span>','mint')}${button(world.mode==='street'?'goHome':'goStreet',icon(world.mode==='street'?'home':'street')+`<span>${world.mode==='street'?'Домой':world.mode==='park'?'В район':'На улицу'}</span>`)}</div><small class="control-hint">${matchMedia('(pointer:coarse)').matches?'Коснись пола, чтобы идти':'Клик по полу — идти · WASD — движение'}</small>`;
 if(['grocery','pickup'].includes(world.mode))$('#dock').innerHTML=`<div class="dock-actions">${button('phone',icon('phone')+'<span>Телефон</span>')}${button(world.mode==='grocery'?'shopCounter':'pickupCounter',icon(world.mode==='grocery'?'food':'parcel')+`<span>${world.mode==='grocery'?'К кассе':'К выдаче'}</span>`,'mint')}${button('goStreet',icon('street')+'<span>Выйти</span>')}</div><small class="control-hint">Ты внутри ${world.mode==='grocery'?'магазина':'пункта выдачи'} · касайся пола, чтобы идти</small>`;
 $('#objective').classList.toggle('repair-objective',world.mode==='repair');$('#repair-guide').classList.toggle('show',world.mode==='repair');if(world.mode==='repair')renderRepairGuide();
 if(!state.tutorial.hidden&&world.mode!=='repair'&&!title){const t=tutorialStep(state);$('#objective').innerHTML=`<div class="mentor-heading"><b class="mentor-avatar">Л</b><span>ЛЕВ · ШАГ ${t.n}/8</span><button data-action="hideTutorial" aria-label="Скрыть подсказки">×</button></div><strong>${t.title}</strong><small>${t.text}</small>${button('tutorialAction',t.label,'mentor-button',`data-id="${t.action}"`)}`;}if(modal)renderModal();else $('#modal-root').innerHTML='';
 $('#title').classList.toggle('hidden',!title);$('#hud').classList.toggle('hidden',title);$('#needs').classList.toggle('hidden',title);$('#objective').classList.toggle('hidden',title);$('#dock').classList.toggle('hidden',title);
 world.blocked=!!modal||title;world.selectedTool=tool;
 features.afterPaint(title,modal);expansion.afterPaint(title,modal);for(const [q,top]of scrolls){const el=document.querySelector(q);if(el)el.scrollTop=top}for(const id of expanded){const el=[...document.querySelectorAll('details[data-key]')].find(e=>e.dataset.key===id);if(el)el.open=true}if(!same)document.querySelector('.modal')?.classList.add('is-new');if(focus)document.getElementById(focus)?.focus({preventScroll:true});if(world.mode==='repair'&&currentPhone())world.updateRepair(currentPhone());
}
function open(type,newtab){modal=type;if(newtab)tab=newtab;paint();}
function close(){if(arcade){arcade.stop();arcade=null}modal=null;paint()}
function renderRepairGuide(){const p=currentPhone();if(!p)return;const stage=repairStage(p),part=PARTS[p.defect],count=screwCount(p),connections=connectorCount(p);const info={
 diagnose:['01','Сначала — диагностика','Подключи питание и выясни, что сломано.'],
 screws:['02',`Выкрути ${count} винтов`,'Выбери отвёртку и нажимай на подсвеченные винты.'],
 open:['03',p.kind&&p.kind!=='phone'?'Аккуратно подними крышку':'Аккуратно подними дисплей','Возьми присоску. Шлейфы пока подключены.'],
 disconnect:['04','Отключи питание и шлейфы',`Лопаткой отсоедини разъёмы: ${connections}.`],
 heat:['03','Размягчи клей','Фен → прогрев в зелёной зоне.'],clean:['05','Следы влаги','Кистью очисти контакты перед заменой.'],solder:['07','Контакт на плате','Паяльник → три точных контакта.'],seal:['08','Защита корпуса','Нанеси новый уплотнитель.'],calibrate:['10','Настройка прибора','Мультиметр → три точных измерения.'],
 remove:['05','Сними неисправную деталь',`Выбери руку. Неисправность: ${part.short}.`],
 install:['06','Поставь исправную деталь',state.parts[p.defect]?`В инвентаре: ${part.name}. Установи её на место.`:'Детали нет. Открой Azon или найди донора в «Авиту».'],
 connect:['07','Подключи все разъёмы',`Лопаткой подключи разъёмы: ${connections}.`],
 close:['08','Опусти дисплей в корпус','Выбери руку и аккуратно закрой телефон.'],
 tighten:['09',`Верни ${count} винтов`,'Отвёрткой закрепи все винты обратно.'],
 test:['10','Финальная проверка','Подключи зарядку и проверь работу телефона.'],done:['✓','Телефон работает!','Теперь его можно выставить на продажу.']
 }[stage];
 $('#repair-guide').innerHTML=`<span class="step-number">${info[0]}</span><div><strong>${info[1]}</strong><small>${info[2]}</small></div>${stage==='install'&&!state.parts[p.defect]?button('phoneAzon','Заказать', 'blue'):''}`;
}
function oldPhoneIcon(type){return `<div class="product-thumb ${type==='display'?'broken':''}">${icon(type==='battery'?'battery':type==='charge'?'plug':'phone')}</div>`}
function phoneIcon(type){return `<div class="product-thumb">${features.img(type||'phone')}</div>`;}
function renderModal(){if(modal==='arcade')return;let html='',phoneFrame=false;
 if(modal==='phone'){
  phoneFrame=true;
  const head=(name,sub,cls='')=>`<header class="app-header ${cls}"><h2>${name}</h2><p>${sub}</p></header>`;
  if(tab==='home')html=`<div class="phone-wallpaper"><span class="eyebrow">День ${state.day} · ${time(state)}</span><h2>Мастерская</h2><div class="app-grid"><button data-action="tab" data-tab="avitu"><b class="avitu-icon">а</b>Авиту</button><button data-action="tab" data-tab="azon"><b class="azon-icon">az</b>Azon</button><button data-action="tab" data-tab="myphones"><b class="bag-icon">${icon('phone')}</b>Техника</button><button data-action="tab" data-tab="orders"><b class="orders-icon">${icon('parcel')}</b>Заказы</button></div><div class="phone-extra-apps">${button('youpube','Youpube','')}<button data-action="playPhone">${icon('star')}<span>Лови сигнал</span></button><button data-action="quests">${icon('check')}<span>Задания</span></button></div><div class="home-widget"><strong>${state.orders.filter(o=>!o.picked&&o.ready<=state.day).length} посылок ждут выдачи</strong><p>До мастерской рукой подать.</p></div></div>`;
  if(tab==='avitu')html=head('авиту','Свежие сделки в твоём районе','avitu')+`<div class="app-body"><div class="notice">${pending?'Встреча назначена. Продавец ждёт на улице.':'Новые предложения каждый игровой день.'}</div>${offers(state).map(o=>`<article class="listing">${phoneIcon(o.donor?'donor':o.kind||'phone')}<div><strong>${o.name}</strong>${o.difficulty?`<small class="difficulty-badge ${o.difficulty}">${levelOf(o).name}</small>`:''}<b class="listing-price">${money(o.price)}</b><small>★ ${o.rating} · ${o.reviews} отзывов · ${o.seller}</small><p>${o.description}</p>${button('meet','Договориться о встрече','blue',`data-id="${o.id}"`)}</div></article>`).join('')||'<p class="empty">На сегодня всё. Загляни завтра.</p>'}</div>`;
  if(tab==='azon')html=head('azon','Детали для твоих сделок','azon')+`<div class="app-body">${button('pcMarket','Компьютеры и улучшения','wide blue')}<div class="notice">Пункт выдачи у «Пятака» · 1–3 игровых дня</div>${Object.entries(PARTS).map(([id,p])=>`<article class="catalog-item">${phoneIcon(id)}<div><strong>${p.name}</strong><b>${money(p.price)}</b><small>${state.stock[id]?`${state.stock[id]} шт. · ${p.days===1?'завтра':'через '+p.days+' дня'}`:'Нет в наличии'}</small></div>${button('order',state.stock[id]?'+':'—','blue compact',`data-id="${id}" ${!state.stock[id]?'disabled':''} aria-label="Заказать ${p.name}"`)}</article>`).join('')}<div class="note orange">Нет дисплея? Поищи телефон-донор в «Авиту». В каталоге есть не все детали.</div>${button('tab','Мои заказы','wide', 'data-tab="orders"')}</div>`;
  if(tab==='orders')html=head('Посылки','Пункт выдачи Azon','azon')+`<div class="app-body">${state.orders.map(o=>`<article class="order-card"><strong>Заказ № ${o.id} · ${PARTS[o.part].name}</strong><p>${o.picked?'Получен':o.ready<=state.day?'Можно забирать':'Прибудет в день '+o.ready}</p>${!o.picked&&o.ready<=state.day?button('visitPickup','Идти в пункт выдачи','mint'):''}</article>`).join('')||'<p class="empty">Заказов пока нет.</p>'}<div class="note">Время идёт в игре. Чтобы наступил следующий день, поспишь дома.</div></div>`;
  if(tab==='youpube')html=media.phoneHTML();
  if(tab==='myphones')html=head('Моя техника','★ '+sellerRating(state)+' · '+state.sold+' продаж')+`<div class="app-body">${button('sellerProfile','Рейтинг и последние продажи','wide')}${state.phones.filter(p=>!p.sold).map(p=>`<article class="listing">${phoneIcon(p.kind||'phone')}<div><strong>${p.client?'Техника '+JOBS.find(j=>j.id===p.client).name:p.name||'R / 01'}</strong><b>${p.fixed?'Проверен · готов к продаже':p.diagnosed?'Нужен '+PARTS[p.defect].short:'Ожидает диагностики'}</b><small>${p.client?'Клиентский аппарат · вернуть владельцу':'Куплен за '+money(p.cost)}</small>${button(p.fixed?(p.client?'returnClient':'sell'):'repairPhone',p.fixed?(p.client?'Вернуть владельцу':dealFor(state,p.id)?'Моя сделка':'Найти покупателя'):'На рабочий стол',p.fixed?'mint':'',`data-id="${p.id}"`)}</div></article>`).join('')||'<p class="empty">Пока пусто. Первый телефон найдётся в «Авиту».</p>'}</div>`;
  html=`<div class="phone-status"><span>${time(state)}</span><b>${Math.round(state.energy)}% ▰</b></div>${html}<nav class="phone-nav">${[['home','home','Домой'],['avitu','sell','Авиту'],['azon','bag','Azon'],['myphones','phone','Товар']].map(([id,ic,t])=>`<button class="${tab===id?'selected':''}" data-action="tab" data-tab="${id}">${icon(ic)}<span>${t}</span></button>`).join('')}</nav>`;
 }
 if(modal==='seller')html=`<span class="eyebrow">ВСТРЕЧА У МАГАЗИНА</span><h2>${pending.seller}</h2><div class="seller-rating">${icon('star')} ${pending.rating} · ${pending.reviews} отзывов</div><div class="seller-product">${phoneIcon(pending.donor?'donor':pending.kind||'phone')}<div><h3>${pending.name}</h3><strong>${money(pending.price)}</strong></div></div><details><summary>Описание продавца</summary><p>${pending.description}</p></details>${inspected?`<div class="note mint-bg">${pending.condition}</div>`:button('inspect','Осмотреть и проверить','wide')}${button('buy','Купить за '+money(pending.price),'wide mint')}${button('cancelDeal','Отказаться от сделки','wide subtle')}`;
 if(modal==='bench')html=`<span class="eyebrow">РАБОЧИЙ СТОЛ</span><h2>Что будем чинить?</h2>${state.phones.filter(p=>!p.sold&&!p.fixed).map(p=>`<article class="inventory-row">${phoneIcon(p.kind||'phone')}<div><strong>${p.name||'R / 01'}</strong><small>${levelOf(p).name} · ${p.diagnosed?PARTS[p.defect].short:'диагностика'}</small></div>${button('repairPhone','Взять','mint',`data-id="${p.id}"`)}</article>`).join('')||`<p>Нет телефонов для ремонта. Открой «Авиту» и найди первую сделку.</p>${button('phoneAvitu','Открыть Авиту','wide blue')}`}`;
 if(modal==='bed')html=`<span class="eyebrow">ДОМА</span><h2>Завтра будут новые сделки.</h2><p>Сон восстановит энергию и продвинет доставку на один игровой день.</p>${button('sleep','Поспать до утра','wide lilac')}`;
 if(modal==='kitchen')html=`<span class="eyebrow">КУХОННЫЙ УГОЛОК</span><h2>Небольшой перерыв</h2><p>Воду можно налить дома. За продуктами — в «Пятак» по соседству.</p>${button('drink','Выпить воды · бесплатно','wide blue')}${button('eatHome','Приготовить перекус · 100 ₽','wide mint')}`;
 if(modal==='grocery')html=`<span class="eyebrow">ПЯТАК · МАГАЗИН У ДОМА</span><h2>Подкрепиться перед работой</h2><div class="food-card">${icon('food')}<div><strong>Горячий перекус</strong><p>+50 сытости · +8 здоровья</p></div>${button('foodBuy','120 ₽','mint')}</div><div class="food-card">${icon('water')}<div><strong>Вода и сок</strong><p>+70 воды</p></div>${button('waterBuy','40 ₽','blue')}</div>`;
 if(modal==='pickup')html=`<span class="eyebrow">AZON · ПУНКТ ВЫДАЧИ</span><h2>Твоя посылка приехала?</h2>${state.orders.filter(o=>!o.picked).map(o=>`<article class="order-card"><strong>${PARTS[o.part].name}</strong><p>${o.ready<=state.day?'Готова к выдаче':'Прибудет в день '+o.ready}</p>${button('collect',o.ready<=state.day?'Забрать':'Ещё в пути',o.ready<=state.day?'mint':'',`data-id="${o.id}" ${o.ready>state.day?'disabled':''}`)}</article>`).join('')||'<p>Посылок пока нет. Запчасти можно заказать в приложении Azon.</p>'}${button('phoneAzon','Открыть каталог','wide blue')}`;
 if(modal==='inventory')html=`<span class="eyebrow">ТВОЯ МАСТЕРСКАЯ</span><h2>Детали и инструменты</h2>${Object.entries(PARTS).map(([id,p])=>`<div class="inventory-row">${phoneIcon(id)}<div><strong>${p.name}</strong><small>В наличии: ${state.parts[id]} шт.</small></div></div>`).join('')}<div class="note">Отвёртка, лопатка и присоска уже лежат на столе.</div><h3>Следующая цель</h3><p>${state.upgrade?'Стол улучшен. Ты готов к новым сделкам.':'Улучшенный рабочий стол сократит затраты энергии при ремонте.'}</p>${button('upgrade',state.upgrade?'Рабочее место улучшено':'Улучшить стол · 1 800 ₽','wide mint',`${state.upgrade?'disabled':''}`)}`;

 if(modal==='pause')html=`<span class="eyebrow">С РУК · ПЕРВЫЙ ОБОРОТ</span><h2>Твоя маленькая мастерская</h2><p>Покупай телефоны в «Авиту», проверяй их на встрече, чини на столе и перепродавай. Недостающие детали ищи в Azon или снимай с донора.</p><div class="note">Игра сохраняется автоматически. На ПК: WASD или клик по полу. На телефоне: касания и кнопки.</div>${button('tutorial','Обучение и подсказки','wide')}${button('quests','Журнал заданий','wide')}${button('sound',muted?'Включить звук':'Выключить звук','wide')}${button('close','Продолжить','wide mint')}${button('askReset','Новая игра','wide subtle')}`;
 if(modal==='reset')html=`<h2>Начать заново?</h2><p>Текущий прогресс будет удалён.</p>${button('reset','Начать новую игру','wide')}${button('close','Оставить прогресс','wide mint')}`;
 if(modal==='win')html=`<span class="eyebrow">ПЕРВЫЕ ТРИ СДЕЛКИ</span><h2>Мастерская на ходу!</h2><p>Три восстановленных телефона нашли новых владельцев. Можно продолжать торговать и улучшать рабочее место.</p><div class="sale-price">${money(state.money)}</div><p>Репутация: ${state.reputation} · Продано: ${state.sold}</p>${button('close','Продолжить играть','wide mint')}`;
 if(modal==='quests')html=questHTML();
 if(modal==='pcMarket')html=pcMarketHTML();
 if(modal==='pc')html=pcDesktopHTML();
 if(modal==='tutorialIntro')html=introHTML();
 if(modal==='arcadeResult')html=`<span class="eyebrow">${arcadeResult.device==='pc'?'НОЧНОЙ КУРЬЕР':'ЛОВИ СИГНАЛ'}</span><h2>Хорошая партия!</h2><div class="sale-price">${arcadeResult.score} очков</div><p>Твой рекорд: ${state.records[arcadeResult.device]}. Проверь журнал — возможно, готово новое задание.</p>${button(arcadeResult.device==='pc'?'playPc':'playPhone','Сыграть ещё','wide mint')}${button('quests','Проверить задания','wide')}`;
 if(modal!=='phone'){const extra=features.render(modal,tab);if(extra!==null)html=extra;}
 const expansionHTML=expansion.render(modal);if(expansionHTML!==null)html=expansionHTML;html+=expansion.counterButtons(modal);for(const c of [market,media,calendar]){const extra=c.render(modal);if(extra!==null)html=extra;}if(modal==='pickup')html+=market.shipmentHTML();
 if(['grocery','pickup','inventory'].includes(modal)){const place=modal==='inventory'?'room':modal;html+=clientCounterHTML(place);}
 if(modal==='inventory'||modal==='kitchen')html+=features.pantryHTML();
 $('#modal-root').innerHTML=`<div class="scrim ${modal==='work'?'work-scrim':''}" data-action="backdrop"><section class="modal ${modal==='work'?'work-modal':''} ${modal==='channel'?'channel-modal':''} ${phoneFrame?'phone-modal':''}" role="dialog" aria-modal="true" aria-label="${phoneFrame?'Телефон':'Действие'}"><button class="modal-close" data-action="close" aria-label="Закрыть">${icon('close')}</button>${html}</section></div>`;
}
async function walk(action){
 if(world.transitioning)return;
 if(action==='goStreet'){close();await world.transitionTo('street');tick(8,1);persist();return;}
 if(action==='goHome'){
  close();if(world.mode!=='street'&&world.mode!=='room')await world.transitionTo('street');
  if(world.mode==='room'){paint();return;}
  world.walkTo([.15,.05,2.35],async()=>{await world.transitionTo('room');state.carrying=false;tick(8,1);persist()});paint();return;
 }
 if(['grocery','pickup','seller'].includes(action)){
  close();if(world.mode!=='street')await world.transitionTo('street');
  const pos=action==='seller'?[3.7,.05,2.6]:action==='grocery'?[6.59,.05,1.65]:[12.22,.05,1.65];
  world.walkTo(pos,async()=>{
   if(action==='seller'){if(!pending){toast('Сначала договорись о встрече в «Авиту».');return}open('seller');return;}
   await world.transitionTo(action);state.stats[action==='grocery'?'groceryVisits':'pickupVisits']++;persist();
   toast(action==='grocery'?'Тамара ждёт у кассы. Можешь пройти по магазину.':'Маша выдаёт посылки у стойки. На стеллаже — компьютеры.');
  });paint();return;
 }
 if(['shopCounter','pickupCounter','pcMarket'].includes(action)){
  if(action==='pcMarket'&&!['pickup','room'].includes(world.mode)){open('pcMarket');return;}
  const zone=action==='shopCounter'?'grocery':'pickup';
  if(world.mode!==zone&&action!=='pcMarket'){walk(zone);return;}
  if(action==='pcMarket'){open('pcMarket');return;}
  world.walkTo(world.mode==='grocery'?[-1.05,.23,1.10]:[.05,.23,.70],()=>open(action==='shopCounter'?'grocery':'pickup'));paint();return;
 }
 if(['bench','bed','kitchen','pc'].includes(action)){
  if(world.mode==='repair'){if(action==='bench'){close();return;}world.setZone('room');}
  if(world.mode!=='room'){
   close();if(world.mode!=='street')await world.transitionTo('street');
   world.walkTo([.15,.05,2.35],async()=>{await world.transitionTo('room');state.carrying=false;persist();walk(action)});paint();return;
  }
  const targets={bench:[.3,.05,-.65],bed:[-.3,.05,.4],kitchen:[1.35,.05,-.35],pc:[.40,.05,1.30]};
  close();world.walkTo(targets[action],()=>open(action==='pc'?(state.pc.owned?'pc':'pcMarket'):action));paint();
 }
}
function introHTML(){
 const pages=[['ДОМ — ТВОЯ МАСТЕРСКАЯ','Начинаем с малого','Ты снял небольшой дом и открыл мастерскую. На столе уже есть инструменты, на кухне — вода, а кровать поможет дождаться посылок.','home'],['РАЙОН ЖИВЁТ СВОЕЙ ЖИЗНЬЮ','Сначала проверка, потом деньги','Продавец ждёт на улице. Читай отзывы, осматривай товар. В продуктовый и Azon можно зайти внутрь и поговорить с сотрудниками.','street'],['ПЕРВАЯ ЦЕЛЬ','Верни телефон к жизни','Купи R / 01, проведи диагностику и следуй подсказкам ремонта. Новую деталь закажи или найди у донора. После продажи забери награду в журнале.','bench']];
 const p=pages[tutorialPage];return `<div class="tutorial-illustration">${icon(p[3])}<span>${tutorialPage+1} / 3</span></div><span class="eyebrow">${p[0]}</span><h2>${p[1]}</h2><p>${p[2]}</p><div class="tutorial-dots">${pages.map((_,i)=>`<i class="${i===tutorialPage?'active':''}"></i>`).join('')}</div>${button('tutorialNext',tutorialPage===2?'Начать первую сделку':'Дальше','wide mint')}${button('tutorialSkip','Пропустить вступление','wide subtle')}`;
}
function compactGoalsHTML(){
 const cards=list=>list.map(q=>{const claimed=state.claims.includes(q.id),done=q.ready(state);return `<details class="compact-quest ${claimed?'claimed':''}" data-key="${q.id}"><summary><span>${claimed?'✓':done?'●':'○'} ${q.title}</span><b>${money(q.reward)}</b></summary><p>${q.text}</p></details><div class="compact-quest-reward">${button('claimQuest',claimed?'Получено':done?'Забрать награду':'В процессе',done?'mint':'',`data-id="${q.id}" ${claimed||!done?'disabled':''}`)}</div>`}).join('');return `<h3>Сегодня</h3>${cards(dailyQuests(state))}<h3>Дела района</h3>${cards(QUESTS)}`;
}
function questHTML(){
 const cards=list=>list.map(q=>{const claimed=state.claims.includes(q.id),done=q.ready(state);return `<article class="quest-card ${claimed?'claimed':done?'quest-ready':''}"><div class="quest-label">${claimed?'ВЫПОЛНЕНО':done?'НАГРАДА ЖДЁТ':q.who||'ЗАДАНИЕ ДНЯ'}</div><h3>${q.title}</h3><p>${q.text}</p><div class="quest-bottom"><b>+${money(q.reward)}</b>${button('claimQuest',claimed?'Получено':done?'Забрать':'В процессе',done?'mint':'',`data-id="${q.id}" ${claimed||!done?'disabled':''}`)}</div></article>`}).join('');
 return `<span class="eyebrow">ЖУРНАЛ · ДЕНЬ ${state.day}</span><h2>Маленькие дела.<br>Большая мастерская.</h2><p>Соседи узнают о тебе по сделкам. Помогай району, получай награды и обустраивай дом.</p><h3 class="section-label">Сегодня</h3>${cards(dailyQuests(state))}<h3 class="section-label">Заказы жителей</h3>${jobsHTML()}<h3 class="section-label">Истории района</h3>${cards(QUESTS)}`;
}
function jobsHTML(){return JOBS.map(j=>{
 const contract=state.contracts.find(c=>c.id===j.id),phone=contract&&state.phones.find(p=>p.id===contract.phone),active=state.contracts.some(c=>!c.done);
 return `<article class="quest-card"><div class="quest-label">${j.name.toUpperCase()} · ЗАКАЗ НА РЕМОНТ</div><h3>${j.title}</h3><p>«${j.text}»</p><div class="note">Оплата ${money(j.pay)} + ${money(j.bonus)} за срок. ${contract?'Срок: день '+contract.due:'На работу '+j.days+' игровых дня'}. Запчасть оплачивает мастер.</div>${contract?contract.done?'<span class="max-upgrade">Телефон возвращён владельцу</span>':phone?.fixed?button('returnClient','Вернуть телефон','wide mint',`data-id="${phone.id}"`):'<p>Аппарат на твоём рабочем столе.</p>':button('acceptJob',active?'Сначала закончи текущий заказ':'Взять заказ','wide',`data-id="${j.id}" ${active?'disabled':''}`)}</article>`;
 }).join('');}
function clientCounterHTML(place){const ready=state.phones.filter(p=>p.client&&!p.sold&&p.fixed&&JOBS.find(j=>j.id===p.client).location===place);if(!ready.length)return '';return `<h3 class="section-label">Телефоны для возврата</h3>${ready.map(p=>{const j=JOBS.find(j=>j.id===p.client);return `<article class="order-card"><strong>${j.title}</strong><p>${j.name} ждёт свой аппарат.</p>${button('deliverClient','Вернуть и получить оплату','wide mint',`data-id="${p.id}"`)}</article>`}).join('')}`;}
function pcMarketHTML(){
 if(!state.pc.owned)return `<span class="eyebrow">ТЕХНОПОЛКА · AZON</span><h2>Твой первый компьютер</h2><div class="pc-product-art">${features.img('pc')}<span>DESK / 01</span></div><p>Монитор, системный блок, клавиатура и мышь. 4 ГБ памяти, встроенная графика и HDD 128 ГБ.</p><div class="note">На ПК установлена игра «Ночной курьер». Память, видеокарту и накопитель можно улучшать.</div>${world.mode==='pickup'?button('buyPc','Купить комплект · 2 200 ₽','wide mint'):button('visitPickup','Зайти в Azon за компьютером','wide blue')}`;
 return `<span class="eyebrow">ТВОЙ DESK / 01</span><h2>Железо для новых рекордов</h2>${Object.entries(PC_UPGRADES).map(([id,u])=>{const level=state.pc[id];return `<article class="hardware-card"><span class="hardware-icon">${features.img(id)}</span><div><h3>${u.title}</h3><strong>${u.tiers[level]}</strong><p>${u.benefit}</p>${level<2?button('buyPcUpgrade',world.mode==='room'?'Установить · '+money(Math.round(u.prices[level]*(state.profile.perk==='smart'?.85:1))):'Установить дома','mint',`data-id="${id}"`):'<span class="max-upgrade">Максимальный уровень</span>'}</div></article>`}).join('')}${button('pc','К компьютеру','wide')}`;
}
function pcDesktopHTML(){return `<div class="desktop-top"><span>DESK OS</span><small>${time(state)} · День ${state.day}</small></div><div class="desktop-wallpaper"><span class="eyebrow">ПРИЯТНО ВЕРНУТЬСЯ ДОМОЙ</span><h2>После работы<br>можно и отдохнуть.</h2><div class="desktop-apps">${button('playPc',icon('street')+'<span>Ночной курьер</span>','mint')}${button('pcMarket',icon('settings')+'<span>Мой компьютер</span>')}${button('quests',icon('check')+'<span>Задания</span>')}${button('phoneAvitu',icon('sell')+'<span>Авиту</span>')}${button('pcYoupube','▶<span>Youpube · мой канал</span>')}</div></div><div class="pc-specs">${Object.entries(PC_UPGRADES).map(([id,u])=>u.tiers[state.pc[id]]).join(' · ')}</div><p>Рекорд в «Ночном курьере»: ${state.records.pc}</p>`;}
function launchArcade(device){
 if(device==='pc'&&!state.pc.owned){open('pcMarket');return;}
 if(device==='pc'&&world.mode!=='room'){toast('Свой компьютер стоит дома.');walk('pc');return;}
 if(arcade)arcade.stop();activeDevice=device;modal='arcade';paint();
 $('#modal-root').innerHTML=`<div class="scrim"><section class="modal arcade-modal ${device==='phone'?'phone-arcade':'pc-arcade'}" role="dialog" aria-modal="true" aria-label="Игра"><button class="modal-close" data-action="close" aria-label="Закрыть">${icon('close')}</button><div class="arcade-os">${device==='pc'?'DESK OS · ИГРЫ':'ТЕЛЕФОН · ИГРЫ'}</div><div id="arcade-host"></div></section></div>`;
 arcade=startArcade($('#arcade-host'),{device,hardware:state.pc,onFinish:score=>{state.records[device]=Math.max(state.records[device],score);arcadeResult={score,device};arcade=null;modal='arcadeResult';tick(10,0);state.energy=Math.min(100,state.energy+3);sound(980);persist();}});
}

function enterRepair(id){if(world.mode!=='room'){close();walk('bench');return}const p=state.phones.find(p=>p.id===Number(id));if(!p||p.sold||p.fixed)return;modal=null;repairId=p.id;tool='hand';world.showRepair(p);paint();toast('Выбирай инструмент снизу и следуй подсказке.');}
function repairAction(action,index,animated=false){
 const p=currentPhone();if(!p)return;if(state.energy<5){toast('Сил почти нет. Отложи ремонт и поспи дома.');return}const stage=repairStage(p);let ok=false;
 if(!animated){
  if(world.repairBusy||world.busy)return;
  const required={screw:'driver',open:'suction',connector:'spudger',remove:'hand',install:'hand',close:'hand',heat:'heater',clean:'brush',solder:'iron',seal:'glue',calibrate:'meter'}[action];
  if(required&&tool!==required){toast('Сначала выбери '+({driver:'отвёртку',suction:'присоску',spudger:'лопатку',hand:'руку',heater:'фен',brush:'кисть',iron:'паяльник',glue:'герметик',meter:'мультиметр'}[required])+'.');return;}
  const valid=action==='diagnose'&&stage==='diagnose'||action==='screw'&&['screws','tighten'].includes(stage)||action==='open'&&stage==='open'||action==='connector'&&['disconnect','connect'].includes(stage)||action==='remove'&&stage==='remove'||action==='install'&&stage==='install'||action==='close'&&stage==='close'||action==='test'&&stage==='test'||['heat','clean','solder','seal','calibrate'].includes(action)&&stage===action;
  if(!valid)return;if(action==='install'&&!state.parts[p.defect]){open('phone','azon');return;}
  if(['heat','solder','calibrate'].includes(action)){expansion.beginSkill(action);return;}audio.play(action==='screw'?'tool':'plug');world.performRepair(action,index,()=>repairAction(action,index,true));return;
 }
 const requireTool=(t,msg)=>{if(tool!==t){toast(msg);return false}return true};
 if(action==='diagnose'&&stage==='diagnose'){p.diagnosed=true;tick(12,3);toast('Неисправность: '+PARTS[p.defect].name+'. Приступаем к разборке.');ok=true}
 if(action==='screw'&&(stage==='screws'||stage==='tighten')){if(!requireTool('driver','Сначала выбери отвёртку.'))return;const key=stage==='screws'?'out':'inside';if(p[key]&(1<<index))return;p[key]=(p[key]||0)|(1<<index);ok=true}
 if(action==='open'&&stage==='open'){if(!requireTool('suction','Подними дисплей присоской.'))return;p.open=true;ok=true}
 if(action==='connector'&&(stage==='disconnect'||stage==='connect')){if(!requireTool('spudger','Для разъёмов возьми пластиковую лопатку.'))return;const key=stage==='disconnect'?'disconnected':'connected';p[key]=(p[key]||0)|(1<<index);ok=true}
 if(action==='remove'&&stage==='remove'){if(!requireTool('hand','Выбери руку, чтобы снять деталь.'))return;p.removed=true;toast('Неисправная деталь убрана в лоток.');ok=true}
 if(action==='install'&&stage==='install'){if(!requireTool('hand','Установи деталь рукой.'))return;if(!state.parts[p.defect]){toast('Нужна деталь: '+PARTS[p.defect].name);open('phone','azon');return}state.parts[p.defect]--;installComponent(p);ok=true}
 if(action==='close'&&stage==='close'){if(!requireTool('hand','Выбери руку и опусти дисплей.'))return;p.closed=true;ok=true}
 if(['heat','clean','solder','seal','calibrate'].includes(action)&&stage===action){p[{heat:'warmed',clean:'cleaned',solder:'soldered',seal:'sealed',calibrate:'calibrated'}[action]]=true;ok=true}
 if(action==='test'&&stage==='test'){p.fixed=true;p.fixedDay=state.day;state.stats.repairs++;tick(10,2);sound(880);world.updateRepair(p);world.effect();toast('Проверка пройдена: питание, дисплей и зарядка работают.');setTimeout(()=>{modal=null;world.repairBusy=false;world.setZone('room');open('phone','myphones');},400);world.repairBusy=true;ok=true}
 if(ok){const perk=state.profile.perk==='maker'?.8:1;tick(2*perk,(state.upgrade?.18:.35)*perk);persist()}
}
function handle(action,id,el){
 if(!ready||world.transitioning||world.busy||world.repairBusy||world.shoppingBusy)return;
 if(media.handle(action,id,el)||market.handle(action,id,el)||calendar.handle(action,id,el))return;
 if(expansion.handle(action,id,el))return;
 if(features.handle(action,id,el))return;
 if(extraAction(action,id,el))return;
 if(['diagnose','screw','open','connector','remove','install','connect','test','heat','clean','solder','seal','calibrate'].includes(action)||(action==='close'&&world.mode==='repair'&&!modal)){repairAction(action,Number(id));return}
 if(action==='start'){audio.unlock();title=false;state.started=true;if(!state.tutorial.intro){tutorialPage=0;modal='tutorialIntro'}persist();toast('Лев поможет освоиться. Задания отмечены галочкой сверху.');return}
 if(action==='close'||action==='backdrop'){if(action==='backdrop'&&el?.className!=='scrim')return;close();return}
 if(action==='phone'){open('phone',tab);return}if(action==='phoneAvitu'){open('phone','avitu');return}if(action==='phoneAzon'){open('phone','azon');return}
 if(action==='tab'){tab=el.dataset.tab;paint();return}
 if(action==='inventory'||action==='pause'){open(action);return}
 if(action==='tool'){tool=el.dataset.tool;sound(380);paint();return}
 if(action==='goStreet'||action==='goHome'){walk(action);return}
 if(['bench','bed','kitchen','grocery','pickup','seller'].includes(action)){if(world.mode==='repair'&&action==='bench')return;walk(action);return}
 if(action==='leaveRepair'){modal=null;world.setZone('room');persist();return}
 if(action==='repairPhone'){enterRepair(id);return}
 if(action==='meet'){pending=offers(state).find(o=>o.id===id);if(!pending)return;inspected=false;modal=null;state.meeting=pending;world.setMeeting(pending);if(world.mode!=='street')walk('goStreet');paint();toast('Продавец ждёт у магазинов. Подойди к нему.');return}
 if(action==='inspect'){if(!pending)return;if(!inspected){state.stats.inspections++;state.daily.inspections++}inspected=true;tick(8,1);persist();return}
 if(action==='cancelDeal'){world.dismissSeller();pending=null;state.meeting=null;close();return}
 if(action==='buy'){
  if(!state.training.complete&&!inspected){toast('Сначала осмотри аппарат: это обязательная часть первой сделки.');return;}if(!pending||state.bought.includes(pending.id))return;if(state.money<pending.price){toast('Не хватает денег на эту покупку.');return}state.money-=pending.price;state.bought.push(pending.id);
  if(pending.donor){state.parts.display++;toast('Дисплей с донора добавлен в инвентарь.')}else{state.phones.push({id:state.serial++,kind:pending.kind||'phone',difficulty:pending.difficulty||'standard',resale:pending.resale,requiredParts:pending.requiredParts,primaryDefect:pending.defect,name:pending.name,defect:pending.defect,cost:pending.price,diagnosed:false,open:false,out:0,disconnected:0,removed:false,installed:false,connected:0,closed:false,inside:0,fixed:false,sold:false});toast('Покупка твоя. Возвращайся домой к рабочему столу.')}world.dismissSeller();pending=null;state.meeting=null;modal=null;tick(10,1);sound(700);persist();return;
 }
 if(action==='order'){
  const p=PARTS[id];if(!p||!state.stock[id])return;if(state.money<p.price){toast('Недостаточно денег для заказа.');return}state.money-=p.price;state.stock[id]--;state.orders.push({id:state.serial++,part:id,ready:state.day+p.days,picked:false});tick(3,0);sound(730);tab='orders';toast('Заказ принят. Прибудет в день '+(state.day+p.days)+'.');persist();return;
 }
 if(action==='visitPickup'){close();walk('pickup');return}
 if(action==='collect'){const o=state.orders.find(o=>o.id===Number(id));if(!o||o.picked||o.ready>state.day)return;if(world.mode!=='pickup')return;o.picked=true;state.parts[o.part]++;state.stats.collected++;state.carrying=true;audio.play('parcel');tick(5,1);toast('Посылка получена. Можно продолжать ремонт.');sound(780);persist();return}
 if(action==='sleep'){state.day++;state.daily={day:state.day,inspections:0,sold:0,foodBuys:0};state.time=540;state.energy=100;state.food=Math.max(0,state.food-18);state.water=Math.max(0,state.water-22);state.hp=Math.min(100,state.hp+15);state.stock={battery:2,charge:1,display:0};modal=null;world.setZone('room');$('#day-transition').textContent='День '+state.day;$('#day-transition').classList.add('show');setTimeout(()=>$('#day-transition').classList.remove('show'),1500);persist();toast('Доброе утро. Проверь объявления и посылки.');return}
 if(action==='drink'){state.water=100;tick(2,0);toast('Запас воды восстановлен.');persist();return}
 if(['foodBuy','waterBuy','eatHome'].includes(action)){const cost=action==='waterBuy'?40:action==='eatHome'?100:120;if(state.money<cost){toast('Не хватает денег.');return}state.money-=cost;if(action==='foodBuy'&&world.mode==='grocery'){state.stats.foodBuys++;state.daily.foodBuys++}if(action==='waterBuy')state.water=Math.min(100,state.water+70);else{state.food=Math.min(100,state.food+50);state.hp=Math.min(100,state.hp+8)}tick(6,0);toast('Теперь можно снова за работу.');persist();return}
 if(action==='sell'){const p=state.phones.find(p=>p.id===Number(id));if(p?.client){extraAction('returnClient',id);return}repairId=Number(id);open('sell');return}

 if(action==='upgrade'){if(state.upgrade)return;if(state.money<1800){toast('Для улучшения нужно 1 800 ₽.');return}state.money-=1800;state.upgrade=true;toast('Рабочее место улучшено. Ремонт требует меньше энергии.');persist();return}
 if(action==='sound'){muted=!muted;audio.setMuted(muted);paint();return}if(action==='askReset'){open('reset');return}
 if(action==='reset'){state=fresh();state.started=true;pending=null;repairId=null;title=false;tutorialPage=0;features.story=0;title=true;modal='prologue';world.setZone('room');persist();toast('Новая мастерская. Новые возможности.');return}
}
function extraAction(action,id,el){
 if(action==='acceptJob'){
  const j=JOBS.find(j=>j.id===id);if(!j||state.contracts.some(c=>c.id===id||!c.done))return true;
  const phoneId=state.serial++;state.phones.push({id:phoneId,client:j.id,defect:j.defect,cost:0,diagnosed:false,open:false,out:0,disconnected:0,removed:false,installed:false,connected:0,closed:false,inside:0,fixed:false,sold:false});
  state.contracts.push({id:j.id,phone:phoneId,due:state.day+j.days,done:false});audio.play('parcel');toast('Заказ принят. Клиентский телефон ждёт на рабочем столе.');persist();return true;
 }
 if(action==='returnClient'){
  const p=state.phones.find(p=>p.id===Number(id));if(!p?.client||!p.fixed||p.sold)return true;const j=JOBS.find(j=>j.id===p.client);close();
  if(j.location==='room'){if(world.mode==='room')open('inventory');else walk('goHome');}else if(world.mode===j.location)open(j.location);else walk(j.location);
  toast('Верни телефон '+j.name+(j.location==='room'?' дома.':' у стойки внутри '+(j.location==='grocery'?'магазина.':'Azon.')));return true;
 }
 if(action==='deliverClient'){
  const p=state.phones.find(p=>p.id===Number(id));if(!p?.client||!p.fixed||p.sold)return true;const j=JOBS.find(j=>j.id===p.client),c=state.contracts.find(c=>c.id===j.id);if(world.mode!==j.location||!c||c.done)return true;
  const pay=j.pay+(state.day<=c.due?j.bonus:0);p.sold=true;p.returned=true;c.done=true;state.money+=pay;state.stats.jobsCompleted++;state.reputation=Math.min(100,state.reputation+5);world.effect('coin');audio.play('coin');toast('Клиент доволен. Оплата '+money(pay)+(state.day<=c.due?' — с премией за срок.':'.'));persist();return true;
 }
 if(action==='quests'){open('quests');return true;}
 if(action==='claimQuest'){const q=[...QUESTS,...dailyQuests(state)].find(q=>q.id===id);if(!q||!q.ready(state)||state.claims.includes(id))return true;state.claims.push(id);state.money+=q.reward;world.effect('coin');audio.play('reward');toast('Задание выполнено: +'+money(q.reward));persist();return true;}
 if(action==='hideTutorial'){state.tutorial.hidden=true;persist();return true;}
 if(action==='tutorialAction'){close();if(id==='phoneGoods')open('phone','myphones');else handle(id);return true;}
 if(action==='tutorial'){state.tutorial.hidden=false;tutorialPage=0;open('tutorialIntro');return true;}
 if(action==='tutorialNext'){tutorialPage++;if(tutorialPage>=3){state.tutorial.intro=true;modal=null;persist()}else paint();return true;}
 if(action==='tutorialSkip'){state.tutorial.intro=true;modal=null;persist();return true;}
 if(action==='phoneGoods'){open('phone','myphones');return true;}
 if(action==='shopCounter'||action==='pickupCounter'){walk(action);return true;}
 if(action==='pc'){if(!state.pc.owned)open('pcMarket');else walk('pc');return true;}
 if(action==='pcMarket'){open('pcMarket');return true;}
 if(action==='buyPc'){
  if(state.pc.owned)return true;if(world.mode!=='pickup'){toast('Комплект можно забрать внутри Azon.');walk('pickup');return true;}
  if(state.money<2200){toast('Для комплекта нужно 2 200 ₽.');return true;}state.money-=2200;state.pc.owned=true;state.carrying=true;tick(10,1);world.effect();sound(980);toast('ПК куплен. Отнеси комплект домой — рабочее место уже готово.');open('pcMarket');persist();return true;
 }
 if(action==='buyPcUpgrade'){
  const u=PC_UPGRADES[id];if(!state.pc.owned||!u||state.pc[id]>=2)return true;
  if(world.mode!=='room'){toast('Улучшения устанавливаются дома.');close();walk('pc');return true;}
  const cost=Math.round(u.prices[state.pc[id]]*(state.profile.perk==='smart'?.85:1));if(state.money<cost){toast('Не хватает денег на улучшение.');return true;}
  state.money-=cost;state.pc[id]++;tick(15,2);world.effect();audio.play('success');toast('Установлено: '+u.tiers[state.pc[id]]);persist();return true;
 }
 if(action==='playPhone'){launchArcade('phone');return true;}
 if(action==='playPc'){launchArcade('pc');return true;}
 return false;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b||b.disabled||world.transitioning||world.busy||world.repairBusy||world.shoppingBusy)return;const action=b.dataset.action,id=b.dataset.food||b.dataset.tool||b.dataset.friend||b.dataset.id;if(!features.allowed(action))return;audio.unlock();audio.play(action==='close'?'close':action==='tab'?'plug':'ui');features.observe(action,b);if(b.classList.contains('hotspot')){if(['toolFromTable','addFood','takeBasket','friend','trainingMove','park','parkExit','salvage','parkRest','sofa','story','buyer','calendar'].includes(action))handle(action,id,b);else if(world.mode==='repair')repairAction(action,Number(b.dataset.index));else walk(action)}else handle(action,id,b);save(state);});

document.addEventListener('keydown',e=>{if(e.code==='Escape'&&!title&&state.profile.created&&!world.busy&&!world.repairBusy){if(modal)close();else if(world.mode==='repair')handle('leaveRepair');else open('pause')}});
function updateHotspots(){
 if(!ready)return;const container=$('#hotspots');document.getElementById('action-shield').classList.toggle('show',!!(world.transitioning||world.busy||world.repairBusy||world.shoppingBusy));features.highlight();if(title||modal||world.transitioning||world.busy||world.repairBusy||world.shoppingBusy){container.style.display='none';return}container.style.display='';const targets=world.projectTargets();const signature=targets.map(t=>t.id+':'+t.label).join('|');if(container.dataset.signature!==signature){container.dataset.signature=signature;container.innerHTML=targets.map(t=>`<button class="hotspot ${t.small?'screw-target':t.connector?'connector-target':''}" data-action="${t.action}" data-index="${t.index??0}" data-target="${t.id}" data-tool="${t.tool||''}" data-food="${t.food||''}" data-friend="${t.friend||''}" aria-label="${t.small?'Винт '+t.label:t.label}">${t.small||t.connector?'':icon(world.mode==='repair'?'hand':t.action==='bench'?'bench':t.action==='bed'?'bed':t.action==='kitchen'?'water':t.action==='seller'?'sell':t.action==='grocery'?'food':'parcel')}<span>${t.connector?(t.index===0?'Б':t.index):t.label}</span></button>`).join('')}
 for(let i=0;i<targets.length;i++){const t=targets[i],el=container.children[i];el.style.transform=`translate(-50%,-50%) translate(${Math.round(t.x)}px,${Math.round(t.y)}px)`;el.style.visibility=t.visible?'visible':'hidden'}features.highlight();
}
async function init(){
 try{world=new World($('#scene'),(a,detail)=>{if(a==='step'||a==='door')audio.play(a==='step'?(world.mode==='park'?'grassStep':world.mode==='street'?(world.climate?.season==='winter'?'snowStep':'streetStep'):'step'):'door');else if(a==='foley')audio.play(detail);else if(a==='repairPhase'){const el=document.getElementById('life-caption');el.textContent=detail;el.classList.toggle('show',!!detail);}else if(a==='clockPreview'){const el=document.querySelector('#hud .lilac span');if(el)el.textContent=detail;}else if(a==='moved'){if(!state.training.moved){state.training.moved=true;persist()}}else if(a==='foodPick'){if(features.allowed('addFood'))handle('addFood',detail)}else if(a==='toolFromTable'){if(features.allowed(a))handle(a,detail)}else repairAction(a)});await world.init(p=>{$('#loading-progress').style.width=(p*100)+'%';$('#loading-label').textContent='Открываем мастерскую… '+Math.round(p*100)+'%'});features.init();calendar.init();const extraTargets=world.extraTargets;world.extraTargets=()=>[...(extraTargets?.()||[]),...market.targets(),...calendar.targets()];if(pending)world.setMeeting(pending);ready=true;world.onFrame=updateHotspots;world.onSimulate=dt=>{expansion.frame(dt,title,modal);media.frame(dt,modal);if(!title)market.frame(dt);};$('#loading').classList.add('hidden');$('#title').innerHTML=`<div class="title-wordmark"><span>С</span> РУК<small>ЖИЗНЬ РАЙОНА</small></div><div class="start-card"><span class="eyebrow">У КАЖДОЙ ВЕЩИ ЕСТЬ ВТОРОЙ ШАНС</span><h1>Твоя мастерская.<br>Твои правила.</h1><p>Покупай с рук. Разбирай до винтика.<br>Возвращай к жизни и зарабатывай.</p>${button('start',state.started?'Продолжить день '+state.day:'Открыть мастерскую','wide mint start-button')}<small>Vithel · создано с помощью GPT-6.1 Sol</small></div>`;paint();
  window.__game={get state(){return structuredClone(state)},get mode(){return world.mode},get stage(){return currentPhone()?repairStage(currentPhone()):null},get ready(){return ready},get renderInfo(){return {calls:world.renderer.info.render.calls,triangles:world.renderer.info.render.triangles}},get camera(){return world.camera.position.toArray()},get moving(){return !!world.avatarGoal},get position(){return world.avatar.position.toArray()},get arcade(){return arcade?{running:arcade.running,score:arcade.score,packets:arcade.packets,obstacles:arcade.obstacles,lane:arcade.lane,elapsed:arcade.elapsed}:null},get audio(){return {loaded:audio.loaded,events:audio.events,muted:audio.muted,music:audio.musicKey,musicRunning:!!audio.musicSource,tracksPlayed:audio.tracksPlayed,trackStarted:audio.trackStarted,audioTime:audio.context?.currentTime,levels:{...audio.settings}}},get climate(){return {...world.climate,sky:world.scene.background.getHexString(),ground:world.floor.material.color.getHexString(),snow:world.snow.visible,sun:world.environmentLights.find(l=>l.scene===world.scene)?.sun.intensity}},get skill(){return expansion.skill?{...expansion.skill}:null},get shift(){return structuredClone(state.work.active)},get tutorial(){return tutorialStep(state)},get training(){return {step:state.training,guide:document.querySelector('#guided-training')?.textContent}},get busy(){return world.busy||world.repairBusy||world.shoppingBusy},get pose(){return {position:world.avatar.position.toArray(),rotation:world.avatar.rotation.toArray(),rightArm:world.avatar.arms[1].rotation.x,action:world.lifeAction?.kind,progress:world.lifeAction?world.lifeAction.time/world.lifeAction.duration:null,propTip:world.lifeAction?.prop?world.lifeAction.prop.localToWorld(new Vector3(0,.65,0)).toArray():null,hands:world.avatar.hands?.map(h=>h.getWorldPosition(new Vector3()).toArray()),mouth:world.avatar.head.localToWorld(new Vector3(0,-.09,.185)).toArray()}},get repairView(){const a=world.precise;return {hands:world.workHands?.map(h=>({visible:h.visible,position:h.position.toArray()})),progress:a?a.time/a.duration:null,tip:a?.obj?a.obj.localToWorld(a.obj.userData.tip.clone()).toArray():null,target:a?.target.toArray(),cover:world.display?.position.toArray(),coverVisible:world.display?.visible,flying:!!a?.flying,flyingPosition:a?.flying?.position.toArray(),driverQuaternion:a?.obj?.quaternion.toArray(),wrist:world.workHands?.[0].rotation.toArray(),action:a?.action,flexVisible:world.activeRepair?.flexes?.map(m=>m.visible),stock:Object.fromEntries(Object.entries(world.inventoryParts||{}).map(([k,v])=>[k,v.visible]))}},get media(){return {needle:media.needle,pc:media.pc,production:structuredClone(state.vlog.production)}},get facing(){return new Vector3(0,0,1).applyQuaternion(world.avatar.quaternion).toArray()},get sale(){return {buyer:!!world.buyer,phone:market.phoneId}},get obstacles(){return {position:world.avatar.position.toArray(),waypoints:world.waypoints?.map(v=>v.toArray())}},get navigation(){return {zone:world.mode,goal:world.avatarGoal?.toArray(),inputBlocked:world.blocked,transitioning:world.transitioning,blocked:world.isBlocked?.(world.avatar.position.x,world.avatar.position.z),path:world.waypoints?.map(v=>v.toArray())}},project:(x,y,z)=>world.position2d(new Vector3(x,y,z)),get meeting(){return {present:!!world.meeting,visible:world.seller?.visible}},get scenes(){return Object.keys(world.scenes)}};
 }catch(e){console.error(e);$('#loading-label').textContent='Не удалось открыть 3D-сцену. Включи аппаратное ускорение браузера и обнови страницу.';$('#loading-progress').style.background='#ca7669';}
}
init();
