import * as T from 'three';
import {character,animateCharacter} from './characters.js';
import {BUYER_SPOT,createDeal,dealFor,completeDeal,shipDeal,sellerRating} from './trading.js';
import {money} from './state.js';
import {resalePrice} from './repair-rules.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class Marketplace{
 constructor(api){Object.assign(this,api);this.phoneId=null;this.buyerId=null;this.deliverySave=0;}
 handle(action,id){const s=this.state(),w=this.world();
  if(action==='sell'){const p=s.phones.find(p=>p.id===Number(id));if(p?.client)return false;if(!p||!p.fixed||p.sold)return true;this.phoneId=p.id;this.open('sell');return true;}
  if(action==='saleMethod'){
   const d=createDeal(s,this.phoneId,id);if(!d){this.toast('Сначала заверши назначенную встречу с покупателем.');return true}this.syncBuyer();this.persist();this.toast(id==='meet'?d.name+' ждёт у Пятака. Передай аппарат лично.':'Покупатель выбрал доставку. Отнеси аппарат к стойке Azon.');return true;
  }
  if(action==='visitBuyer'||action==='buyer'){
   const selected=dealFor(s,this.phoneId),d=selected?.method==='meet'?selected:s.market.deals.find(d=>d.status==='meeting');if(!d||d.method!=='meet')return true;this.phoneId=d.phone;this.close();const go=()=>w.walkTo(BUYER_SPOT,()=>this.open('buyer'));if(w.mode==='street')go();else w.transitionTo('street').then(go);return true;
  }
  if(action==='buyerCheck'){
   const d=dealFor(s,this.phoneId);if(!this.nearBuyer(d))return true;this.close();w.performLife('work',()=>{d.checked=true;this.open('buyer');this.persist()},'phone',{place:'pickup'});return true;
  }
  if(action==='confirmSale'){
   const d=dealFor(s,this.phoneId);if(!this.nearBuyer(d)||!d.checked){this.toast('Покупатель сначала проверит аппарат на встрече.');return true}const done=completeDeal(s,d.id);if(done){this.close();this.syncBuyer();w.effect('coin');this.tick(20,2);this.audio.play('coin');this.persist();this.toast(done.name+' купил аппарат за '+money(done.price)+'. Новый отзыв в профиле продавца.');}return true;
  }
  if(action==='sellerProfile'){this.open('sellerProfile');return true;}
  if(action==='shipSale'){
   const d=s.market.deals.find(d=>d.id===Number(id));if(w.mode!=='pickup'||!d||d.status!=='dropoff'){this.toast('Передай аппарат сотруднику внутри Azon.');return true}
   this.close();w.walkTo([.05,.23,.70],()=>{const active=s.market.deals.find(a=>a.id===Number(id));if(active?.status!=='dropoff')return;w.performLife('work',()=>{shipDeal(s,id);this.audio.play('parcel');this.tick(12,2);this.open('pickup');this.persist();this.toast('Посылка отправлена. Покупатель получит её завтра.')},'phone',{place:'pickup'})});return true;
  }
  return false;
 }
 nearBuyer(d){const w=this.world();return !!d&&d.status==='meeting'&&w.mode==='street'&&w.avatar.position.distanceTo(new T.Vector3(...BUYER_SPOT))<.85;}
 syncBuyer(){const s=this.state(),w=this.world(),d=s.market.deals.find(d=>d.status==='meeting');if(this.buyerId===d?.id)return;this.buyerId=d?.id;w.buyer?.removeFromParent();if(d){const actor=character({name:d.name,gender:d.name.endsWith('а')?'female':'male',color:'#9a806d'});actor.position.set(BUYER_SPOT[0],.05,BUYER_SPOT[2]-.5);w.scene.add(actor);w.buyer=actor;}else w.buyer=null;}
 targets(){const w=this.world();return w.mode==='street'&&w.buyer?[{id:'buyer',label:'Покупатель · '+this.state().market.deals.find(d=>d.status==='meeting').name,position:w.buyer.position.clone().add(new T.Vector3(0,1.9,0)),action:'buyer'}]:[];}
 frame(dt){const s=this.state(),w=this.world();this.syncBuyer();if(w.buyer){animateCharacter(w.buyer,w.clock.elapsedTime,false);const delta=w.avatar.position.clone().sub(w.buyer.position);w.buyer.rotation.y=Math.atan2(delta.x,delta.z);}
  this.deliverySave+=dt;if(this.deliverySave<1)return;this.deliverySave=0;const done=s.market.deals.filter(d=>d.status==='transit'&&d.arrives<=s.day).map(d=>completeDeal(s,d.id)).filter(Boolean);if(done.length){this.audio.play('coin');this.persist();this.toast('Доставка завершена: '+done.map(d=>money(d.price)).join(', ')+'. Покупатель оставил отзыв.');}
 }
 shipmentHTML(){const s=this.state(),b=this.button;return s.market.deals.filter(d=>d.status==='dropoff').map(d=>`<article class="order-card"><strong>Отправить ${esc(s.phones.find(p=>p.id===d.phone)?.name||'Aster 13 mini')}</strong><p>${d.name} · оплата после получения: ${money(d.price)}</p>${b('shipSale','Передать аппарат для отправки','wide blue',`data-id="${d.id}"`)}</article>`).join('');}
 profileHTML(){const s=this.state();return `<div class="seller-summary"><b>★ ${sellerRating(s)}</b><span>${s.market.reviews.length} отзывов · ${s.sold} продаж</span></div><h3>Последние три продажи</h3>${s.market.history.map(h=>`<article class="sale-history"><div>${this.img(h.kind||'phone')}</div><section><strong>${esc(h.name)}</strong><small>${h.day?'День '+h.day:'Продано ранее'} · ${h.method==='parcel'?'Доставка Azon':h.method==='legacy'?'Из прошлой версии':'Личная встреча'}</small><b>${money(h.price)}</b>${h.stars?`<small>★ ${h.stars} · ${h.buyer}</small>`:''}</section></article>`).join('')||'<p>После передачи первого аппарата здесь появится история.</p>'}<details><summary>Отзывы покупателей</summary>${s.market.reviews.slice(0,8).map(r=>`<p><b>★ ${r.stars} · ${r.name}</b><br>${r.text}</p>`).join('')||'<p>Отзывов пока нет.</p>'}</details>`;}
 render(modal){const s=this.state(),b=this.button,p=s.phones.find(p=>p.id===this.phoneId),d=dealFor(s,this.phoneId);
  if(modal==='sellerProfile')return `<span class="eyebrow">АВИТУ · ПРОФИЛЬ ПРОДАВЦА</span><h2>${esc(s.profile.name)}</h2>${this.profileHTML()}`;
  if(modal==='sell'){
   if(!p)return '<p>Техника не найдена.</p>';
   if(d)return `<span class="eyebrow">СДЕЛКА В ПРОЦЕССЕ</span><h2>${esc(p.name||'Aster 13 mini')}</h2><p>${d.name} · ${money(d.price)}</p>${d.method==='meet'?`<p>Покупатель ждёт у Пятака. Покажешь аппарат и передашь его из рук в руки.</p>${b('visitBuyer','Пойти на встречу','wide mint')}`:d.status==='dropoff'?`<p>Аппарат нужно отнести к стойке Azon. Деньги придут после получения.</p>${b('visitPickup','Отнести в Azon','wide blue')}`:`<p>Посылка в пути. Прибудет в день ${d.arrives}. Аппарат зарезервирован.</p>`}${b('sellerProfile','Мой профиль продавца','wide')}`;
   return `<span class="eyebrow">АВИТУ · ПРОДАЖА</span><h2>${esc(p.name||'Aster 13 mini')}</h2><div class="sale-hero">${this.img(p.kind||'phone')}<strong>${money(resalePrice(p))}</strong></div><p>Замена детали указана в объявлении. Как передадим технику?</p>${b('saleMethod','Встреча у Пятака','wide mint','data-id="meet"')}${b('saleMethod','Отправка через Azon · 1 день','wide blue','data-id="parcel"')}<small>Оплата после передачи. Доставка уже включена в цену для покупателя.</small>${b('sellerProfile','Мой рейтинг и последние продажи','wide')}`;
  }
  if(modal==='buyer')return d?`<span class="eyebrow">ЛИЧНАЯ ВСТРЕЧА</span><h2>${d.name}</h2><p>«${d.checked?'Питание, экран и зарядка работают. Забираю!':'Покажешь, как работает? И что менялось внутри?' }»</p><div class="sale-hero">${this.img(p.kind||'phone')}<strong>${money(d.price)}</strong></div>${d.checked?b('confirmSale','Передать аппарат и получить деньги','wide mint'):b('buyerCheck','Показать и проверить аппарат','wide mint')}`:'<p>Встреча завершена.</p>';
  return null;
 }
}
