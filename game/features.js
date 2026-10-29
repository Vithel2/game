import {FOOD,productPictures} from './products.js';
import {PERKS,training} from './life.js';
import {offers,money,repairStage} from './state.js';
import {DOORS} from './neighborhood.js';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class Features{
 constructor(api){Object.assign(this,api);this.story=0;this.friend='lev';this.pics=null;this.lastHighlight=null;}
 init(){this.pics=productPictures();}
 img(kind){return `<img src="${this.pics?.[kind]||this.pics?.phone||''}" alt="3D-модель товара" draggable="false">`;}
 allowed(action){const s=this.state(),w=this.world();if(w.busy||w.repairBusy||w.shoppingBusy)return false;
  if(action==='start')return true;
  if(!s.profile.created)return ['start','storyNext','gender','perk','profileDone','profileName','sound'].includes(action);
  const t=training(s);if(!t)return true;
  if(['close','backdrop','pause','askReset','reset','sound','credits','toolFromTable','trainingMove','finishBenchTest'].includes(action))return true;
  if(t.allow.includes(action))return true;
  this.toast('Сначала закончим обучение: '+t.title);return false;
 }
 handle(action,id,el){
  const s=this.state(),w=this.world(),b=this.button,i=this.icon;
  if(action==='meet'&&!s.training.complete&&!s.phones.some(p=>!p.client&&!p.sold)&&!String(id).endsWith('-a')){this.toast('Для первой сделки возьми iPhone 13 mini с изношенным аккумулятором.');return true;}
  if(action==='start'&&!s.profile.created){this.story=0;this.open('prologue');return true;}
  if(action==='storyNext'){this.story++;this.open(this.story<3?'prologue':'character');return true;}
  if(action==='gender'){s.profile.gender=el.dataset.gender;this.open('character');return true;}
  if(action==='perk'){s.profile.perk=id;this.open('character');return true;}
  if(action==='profileDone'){const name=document.querySelector('#nickname')?.value.trim();if(!/^[\p{L}\p{N}_ -]{2,16}$/u.test(name||'')){this.toast('Ник: 2–16 букв, цифр, пробелов или знаков _ и -');return true}s.profile.name=name;s.profile.created=true;s.tutorial={intro:true,hidden:true};s.started=true;this.setTitle(false);this.close();this.persist();return true;}
  if(action==='tutorial'){this.open('controls');return true;}
  if(action==='tutorialSkip'||action==='hideTutorial'){this.toast('Обучение проходится действиями. Оранжевая подсветка показывает, что делать.');return true;}
  if(action==='finishTraining'){s.training.complete=true;this.persist();this.toast('Обучение завершено. Теперь весь район открыт.');return true;}
  if(action==='trainingMove'){w.walkTo([0,.05,.50],()=>{s.training.moved=true;this.persist()});return true;}
  if(action==='toolFromTable'){s.training.tools ||= {};s.training.tools[id]=true;this.setTool(id);this.persist();return true;}
  if(action==='tool'&&w.mobileInterface){s.training.tools||={};s.training.tools[el.dataset.tool]=true;return false;}
  if(action==='tool'&&el.dataset.tool!=='hand'&&!s.training.complete&&!s.training.tools?.[el.dataset.tool]){this.toast('Сначала нажми на сам подсвеченный инструмент на коврике.');return true;}
  if(action==='sleep'){
   this.close();w.performLife('sleep',()=>{s.day++;s.time=540;s.energy=100;s.hp=Math.min(100,s.hp+15);s.food=Math.max(0,s.food-18);s.water=Math.max(0,s.water-22);s.daily={day:s.day,inspections:0,sold:0,foodBuys:0};s.stock={battery:2,charge:1,display:0};this.persist();this.toast('Доброе утро, '+s.profile.name+'. День '+s.day)});return true;
  }
  if(action==='drink'){this.close();w.performLife('drink',()=>{s.water=100;this.tick(2,0);this.persist()});return true;}
  if(action==='eatHome'){if(s.money<100){this.toast('Не хватает на перекус.');return true}s.money-=100;this.close();w.performLife('eat',()=>{s.food=Math.min(100,s.food+50);this.tick(5,0);this.persist()});return true;}
  if(action==='takeBasket'){s.shop.basket=true;w.avatar.basket.visible=true;this.persist();this.toast('Корзина в руке. Теперь выбирай продукты на полках.');return true;}
  if((action==='goStreet'||action==='goHome')&&w.mode==='grocery'){if(this.basketTotal()>0){this.open('grocery');this.toast('Сначала оплати покупки или верни товары.');return true;}s.shop.basket=false;}
  if(action==='addFood'){if(!s.shop.basket){this.toast('Сначала возьми корзину у входа.');return true}const n=Object.values(s.shop.items).reduce((a,b)=>a+b,0),limit=s.profile.perk==='strong'?14:8;if(n>=limit){this.toast('Корзина полна. Пора к кассе.');return true}if(!FOOD[id])return true;
   this.close();w.shoppingBusy=true;const index=Object.keys(FOOD).indexOf(id),target=[-2.75+(index%5)*1.18,.23,-1.32];w.walkTo(target,()=>{w.spawnBasketItem(id,w.lastFoodPick?.userData.food===id?w.lastFoodPick:w.productPicks.find(o=>o.userData.food===id),()=>{s.shop.items[id]=(s.shop.items[id]||0)+1;w.shoppingBusy=false;this.persist();this.toast(FOOD[id].name+' в корзине')})});return true;
  }
  if(action==='checkout'){
   const total=this.basketTotal();if(!total){this.toast('Корзина пока пуста.');return true}if(s.money<total){this.toast('Не хватает денег. Можно убрать товары из корзины.');return true}s.money-=total;
   for(const [key,n]of Object.entries(s.shop.items))s.pantry[key]=(s.pantry[key]||0)+n;s.stats.foodBuys++;s.daily.foodBuys++;s.shop.items={};s.shop.basket=false;w.avatar.basket.visible=false;this.audio.play('coin');this.persist();this.toast('Покупки оплачены. Продукты в инвентаре.');return true;
  }
  if(action==='removeFood'){if(s.shop.items[id])s.shop.items[id]--;if(!s.shop.items[id])delete s.shop.items[id];this.persist();return true;}
  if(action==='returnBasket'){s.shop={basket:false,items:{}};this.persist();return true;}
  if(action==='consumeFood'){const f=FOOD[id];if(!f||!s.pantry[id])return true;this.close();w.performLife(id==='water'||id==='juice'||id==='milk'||id==='coffee'?'drink':'eat',()=>{s.pantry[id]--;s.food=Math.max(0,Math.min(100,s.food+f.food));s.water=Math.max(0,Math.min(100,s.water+f.water));s.energy=Math.min(100,s.energy+(f.energy||0));s.hp=Math.min(100,s.hp+(f.hp||0));this.tick(3,0);this.persist()},id);return true;}
  if(action==='monetize'){if(s.vlog.subs<500||s.vlog.posts.length<3){this.toast('Для монетизации нужны 500 подписчиков и три ролика.');return true}s.vlog.monetized=true;this.persist();return true;}
  if(action==='sponsor'){if(s.vlog.subs<300||s.day-(s.vlog.lastSponsorDay||-10)<3)return true;const pay=Math.round(250+s.vlog.subs*.3);s.money+=pay;s.vlog.earned+=pay;s.vlog.subs-=Math.ceil(s.vlog.subs*.03);s.vlog.lastSponsorDay=s.day;this.audio.play('coin');this.persist();this.toast('Рекламная интеграция: +'+money(pay)+'. Часть аудитории отписалась.');return true;}
  if(action==='claimRace'){const r=rivals(s).find(r=>r.id===id);s.vlog.raceClaims||=[];if(!r||s.vlog.subs<=r.subs||s.vlog.raceClaims.includes(id))return true;s.vlog.raceClaims.push(id);s.money+=id==='denis'?750:id==='liza'?1500:2500;this.persist();this.toast('Ты обошёл автора в рейтинге! Награда получена.');return true;}
  if(action==='friend'){const friend=w.friends.find(f=>f.id===id);if(!friend||w.mode!=='street')return true;this.friend=id;this.close();w.walkTo([friend.actor.position.x,.05,friend.actor.position.z+.55],()=>this.open('friend'));return true;}
  if(action==='talkFriend'){const friend=w.friends.find(f=>f.id===this.friend);if(w.mode!=='street'||!friend||w.avatar.position.distanceTo(friend.actor.position)>1.5){this.toast('Подойди ближе.');return true}const k=s.day+'-'+this.friend;if(!s.talked.includes(k)){s.talked.push(k);s.friends[this.friend]++;this.tick(10,0)}this.persist();return true;}
  if(action==='collab'){if(!s.friends[this.friend]){this.toast('Сначала познакомься поближе.');return true}this.recordVlog('friends');return true;}
  if(action==='friendChallenge'){this.challenge={id:this.friend,device:this.friend==='denis'?'pc':'phone',score:this.friend==='denis'?150:this.friend==='lev'?8:15};this.launchArcade(this.challenge.device);return true;}
  if(action==='claimFriendChallenge'){s.friendClaims||=[];const c=this.challenge;if(!c||s.records[c.device]<c.score||s.friendClaims.includes(c.id))return true;s.friendClaims.push(c.id);s.money+=250;s.friends[c.id]++;this.persist();return true;}
  return false;
 }
 observe(action,el){const s=this.state();if(action==='phone')s.training.phone=true;if(action==='tab'&&el?.dataset.tab==='avitu')s.training.market=true;if(action==='meet')s.training.meeting=true;}
 basketTotal(){const s=this.state();return Object.entries(s.shop.items).reduce((a,[k,n])=>a+(FOOD[k]?.price||0)*n,0)}
 render(modal,tab){const s=this.state(),b=this.button,i=this.icon;
  if(modal==='controls')return `<span class="eyebrow">ДЕЙСТВИЯ В МИРЕ</span><h2>Мастерская под рукой</h2><p>Оранжевая подсветка показывает нужный предмет. Инструмент можно взять прямо с коврика. Клик по полу прокладывает маршрут вокруг мебели; WASD тоже учитывает препятствия.</p><p>В магазине сначала возьми корзину, выбери продукты на полках, затем оплати у Тамары. После оплаты продукты можно съесть из инвентаря.</p><p>Сон, еда, запись роликов и ремонт выполняются персонажем. Дождись конца действия: состояние сохранится после него.</p>`;
  if(modal==='prologue'){const pages=[['ГОД НАЗАД','Ты уже был на вершине.','Сеть мастерских, успешный канал и очередь из клиентов. Ты знал цену каждой детали и каждого решения.','14 мастерских · 2,4 млн подписчиков'],['ПОСЛЕ ОДНОЙ СДЕЛКИ','Остались только навыки.','Партнёр исчез с деньгами. Склад ушёл за долги, старый канал потерян. Большую жизнь пришлось упаковать в одну коробку.','Магазины закрыты · старый аккаунт недоступен'],['СЕГОДНЯ','Начать заново — тоже навык.','Небольшой дом, старый телефон, набор инструментов и первые сбережения. Теперь ты строишь своё дело — без чужих правил.','Новая мастерская · новая история']];const p=pages[this.story];return `<div class="story-art story-${this.story}">${i(this.story===0?'star':this.story===1?'parcel':'home')}<span>${p[3]}</span></div><span class="eyebrow">${p[0]}</span><h2>${p[1]}</h2><p>${p[2]}</p>${b('storyNext',this.story<2?'Дальше':'Кто начнёт эту историю?','wide mint')}`;}
  if(modal==='character')return `<span class="eyebrow">ТВОЯ НОВАЯ ИСТОРИЯ</span><h2>Как тебя зовут?</h2><input id="nickname" class="nickname" placeholder="Ник · 2–16 символов" maxlength="16" value="${esc(s.profile.name==='Мастер'?'':s.profile.name)}"><div class="gender-options">${['male','female'].map(g=>b('gender',g==='male'?'Мужской':'Женский',s.profile.gender===g?'mint':'',`data-gender="${g}"`)).join('')}</div><h3>Одна сильная сторона</h3><div class="perks-grid">${PERKS.map(p=>`<button data-action="perk" data-id="${p.id}" class="perk ${s.profile.perk===p.id?'chosen':''}">${i(p.icon)}<strong>${p.name}</strong><small>${p.text}</small></button>`).join('')}</div>${b('profileDone','Начать заново — по-своему','wide mint')}`;
  if(modal==='grocery')return `<span class="eyebrow">ТАМАРА · КАССА</span><h2>Покупки на сегодня</h2>${s.shop.basket?`<div class="basket-list">${Object.entries(s.shop.items).map(([id,n])=>`<article class="basket-row">${this.img(id)}<div><strong>${FOOD[id].name}</strong><small>${n} шт. · ${money(FOOD[id].price*n)}</small></div>${b('removeFood','−','compact',`data-id="${id}"`)}</article>`).join('')||'<p>Корзина пуста. Выбери продукты на полках.</p>'}</div><div class="basket-total">Итого: ${money(this.basketTotal())}</div>${b('checkout','Оплатить покупки','wide mint')}${b('returnBasket','Вернуть корзину и товары','wide subtle')}`:`<p>Возьми корзину у входа, затем нажимай на нужные продукты. Я пробью покупки, когда подойдёшь.</p>${b('takeBasket','Взять корзину','wide mint')}`}<details><summary>Выбрать продукты с полок</summary>${Object.entries(FOOD).map(([id,f])=>b('addFood',f.name+' · '+money(f.price),'wide',`data-id="${id}"`)).join('')}</details>${this.pantryHTML()}`;
  if(modal==='friend'){const f=this.friend,name={lev:'Лев',denis:'Денис',liza:'Лиза'}[f],quotes={lev:'Я помню твою старую мастерскую. Руки остались те же — остальное вернём.',denis:'Соберём нормальный сетап? Только сначала попробуй побить мой рекорд.',liza:'Я тоже начинала с одной сделки. Давай сравним каналы, когда освоишься.'};return `<span class="eyebrow">ДРУЗЬЯ РАЙОНА</span><h2>${name}</h2><blockquote>${quotes[f]}</blockquote><p>Дружба: ${s.friends[f]} · Твой канал: ${s.vlog.subs} подписчиков</p>${b('talkFriend','Поговорить','wide mint')}${b('collab','Снять совместный влог','wide')}${b('friendChallenge',f==='denis'?'Вызов: 150 очков на ПК':'Вызов: '+(f==='lev'?8:15)+' очков на телефоне','wide')}${this.challenge?.id===f?b('claimFriendChallenge','Забрать награду за рекорд','wide mint',s.records[this.challenge.device]>=this.challenge.score?'':'disabled'):''}${b('youpube','Открыть Youpube','wide')}`;}
  return null;
 }
 pantryHTML(){const s=this.state(),b=this.button;const list=Object.entries(s.pantry).filter(([,n])=>n>0);return list.length?`<h3>Твои продукты</h3>${list.map(([id,n])=>`<article class="basket-row">${this.img(id)}<div><strong>${FOOD[id].name}</strong><small>В наличии: ${n}</small></div>${b('consumeFood','Съесть / выпить','',`data-id="${id}"`)}</article>`).join('')}`:'';}
 afterPaint(title,modal){const s=this.state(),w=this.world();w.inventory=s.parts;if((s.profile.created||modal==='character')&&JSON.stringify(w.profile)!==JSON.stringify(s.profile))w.setProfile(s.profile);w.avatar.basket.visible=s.shop.basket&&w.mode==='grocery';w.refreshBasket?.(s.shop.items);w.trainingMove=!s.training.complete&&!s.training.moved;
  if(modal==='character'){document.querySelector('#nickname')?.addEventListener('input',e=>{s.profile.name=e.target.value});}
  if(!s.profile.created){document.querySelector('.modal-close')?.remove();}
  const g=document.getElementById('guided-training'),t=training(s);g.classList.toggle('hidden',title||!s.profile.created||!t);if(!t)return;document.getElementById('objective').classList.add('hidden');g.innerHTML=`<span>ОБУЧЕНИЕ · ${t.progress+1}/9</span><strong>${t.title}</strong><p>${t.text}</p>${t.id==='done'?this.button('finishTraining','Я готов — открыть весь район','mint'):''}`;
 }
 highlight(){const s=this.state(),w=this.world(),t=training(s);if(!t||!s.profile.created)return;
  let selector=t.target;if(t.id==='bench'){selector=this.world().mode==='repair'?'[data-action="diagnose"]':document.querySelector('[data-action="repairPhone"]')?'[data-action="repairPhone"]':this.world().mode==='street'?'[data-action="goHome"]':'[data-action="bench"]'}if(t.id==='seller'&&document.querySelector('[data-action="buy"]'))selector=document.querySelector('[data-action="inspect"]')?'[data-action="inspect"]':'[data-action="buy"]';if(t.id==='seller'&&!document.querySelector('[data-action="buy"]')){if(w.meeting)selector=w.mode==='street'?'[data-action="seller"]':'[data-action="goStreet"]';else selector=document.querySelector('[data-action="meet"]')?'[data-action="meet"]':document.querySelector('.phone-nav')?'.phone-nav [data-tab="avitu"]':'[data-action="phone"]';}if(t.id==='sale'&&!document.querySelector('[data-action="sell"]'))selector=document.querySelector('.phone-nav')?'.phone-nav [data-tab="myphones"]':'[data-action="phone"]';
  if(t.id==='sale'){
   const d=s.market.deals.find(d=>['meeting','dropoff','transit'].includes(d.status));
   const visible=['confirmSale','buyerCheck','visitBuyer','shipSale','saleMethod'].find(a=>document.querySelector(`[data-action="${a}"]`));
   if(visible)selector=`[data-action="${visible}"]`;
   else if(d?.status==='meeting')selector=w.mode==='street'?'[data-action="buyer"]':'[data-action="goStreet"]';
   else if(d?.status==='dropoff')selector=w.mode==='pickup'?'[data-action="pickupCounter"]':w.mode==='street'?'[data-action="pickup"]':'[data-action="goStreet"]';
   else if(d?.status==='transit')selector=document.querySelector('[data-action="sleep"]')?'[data-action="sleep"]':w.mode==='room'?'[data-action="bed"]':'[data-action="goHome"]';
  }
  if(t.id==='repair'){
   const p=s.phones.find(p=>!p.client&&!p.sold);if(document.querySelector('[data-action="collect"]'))selector='[data-action="collect"]';else if(document.querySelector(`[data-action="order"][data-id="${p.defect}"]`))selector=`[data-action="order"][data-id="${p.defect}"]`;else if(document.querySelector('[data-action="sleep"]'))selector='[data-action="sleep"]';else if(document.querySelector('[data-action="repairPhone"]'))selector='[data-action="repairPhone"]';else if(document.querySelector('.phone-modal')&&s.orders.some(o=>!o.picked))selector='.modal-close';else if(w.mode==='repair'){
    const stage=repairStage(p);if(w.requiredTool&&this.tool()!==w.requiredTool)selector=`[data-action="${w.mobileInterface?'tool':'toolFromTable'}"][data-tool="${w.requiredTool}"]`;
    else selector=stage==='screws'||stage==='tighten'?'[data-action="screw"]':stage==='disconnect'||stage==='connect'?'[data-action="connector"]':stage==='remove'?'[data-action="remove"]':stage==='install'?'[data-action="install"]':`[data-action="${stage}"]`;
    if(stage==='install'&&!s.parts[p.defect]&&s.orders.some(o=>!o.picked&&o.part===p.defect))selector='[data-action="leaveRepair"]';
   }else if(document.querySelector('[data-action="order"]'))selector=`[data-action="order"][data-id="${p.defect}"]`;
   else if(s.orders.some(o=>!o.picked&&o.ready<=s.day))selector=w.mode==='pickup'?'[data-action="pickupCounter"]':w.mode==='street'?'[data-action="pickup"]':'[data-action="goStreet"]';
   else if(s.orders.some(o=>!o.picked&&o.ready>s.day))selector=w.mode==='room'?'[data-action="bed"]':'[data-action="goHome"]';
   else selector='[data-action="bench"]';
  }
  const candidates=selector?[...document.querySelectorAll(selector)]:[];const element=candidates.find(e=>e.getBoundingClientRect().width&&getComputedStyle(e).visibility!=='hidden');if(this.lastHighlight!==element){this.lastHighlight?.classList.remove('guided-target');element?.classList.add('guided-target');this.lastHighlight=element;}
 }
}
