import {PARTS} from './state.js';
import {resalePrice} from './repair-rules.js';
export const BUYER_SPOT=[8.5,.05,2.75];
const names=['Олег','Кира','Роман','Аня','Тимур','Света'];
export function sellerRating(s){const list=s.market.reviews;return list.length?(list.reduce((n,r)=>n+r.stars,0)/list.length).toFixed(1).replace('.',','):'—';}
export function dealFor(s,phoneId){return s.market.deals.find(d=>d.phone===Number(phoneId)&&d.status!=='complete'&&d.status!=='cancelled');}
export function createDeal(s,phoneId,method){
 const p=s.phones.find(p=>p.id===Number(phoneId));if(!p||!p.fixed||p.sold||p.client||!['meet','parcel'].includes(method))return null;
 const existing=dealFor(s,p.id);if(existing)return existing;
 if(method==='meet'&&s.market.deals.some(d=>d.method==='meet'&&d.status==='meeting'))return null;
 const deal={id:s.serial++,phone:p.id,name:names[(s.sold+p.id)%names.length],method,status:method==='meet'?'meeting':'dropoff',created:s.day,due:s.day+2,price:resalePrice(p)};s.market.deals.push(deal);return deal;
}
export function shipDeal(s,id){const d=s.market.deals.find(d=>d.id===Number(id)),p=d&&s.phones.find(p=>p.id===d.phone);if(!d||d.status!=='dropoff'||!p?.fixed||p.sold)return null;d.status='transit';d.arrives=s.day+1;return d;}
export function completeDeal(s,id){
 const d=s.market.deals.find(d=>d.id===Number(id)),p=d&&s.phones.find(p=>p.id===d.phone);if(!d||!p?.fixed||p.sold||p.client)return null;
 if(!(d.method==='meet'&&d.status==='meeting'&&d.checked||d.method==='parcel'&&d.status==='transit'&&s.day>=d.arrives))return null;
 p.sold=true;d.status='complete';d.day=s.day;p.soldDay=s.day;s.money+=d.price;s.sold++;s.daily.sold++;
 s.profit+=d.price-p.cost-(p.requiredParts||[p.primaryDefect||p.defect]).reduce((sum,k)=>sum+(PARTS[k]?.price||0),0);s.reputation=Math.min(100,s.reputation+3);
 const stars=s.day>d.due?4:5,review={id:d.id,name:d.name,stars,day:s.day,text:stars===5?'Всё как в объявлении. Ремонт указан, аппарат проверен.':'Техника работает. Передачу пришлось подождать.'};s.market.reviews.unshift(review);
 s.market.history.unshift({id:d.id,phone:p.id,name:p.name||'Aster 13 mini',kind:p.kind||'phone',price:d.price,day:s.day,method:d.method,buyer:d.name,stars});s.market.history=s.market.history.slice(0,3);return d;
}
