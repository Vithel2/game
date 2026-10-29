import * as T from 'three';
import {product} from './products.js';
import {makeSign} from './environment.js';
import {AREAS,SOLIDS} from './navigation.js';
import {DOORS} from './neighborhood.js';
import {PC_UPGRADES} from './content.js';
import {money} from './state.js';
import {batchStatic} from './batching.js';
export const TECH_GOODS=[{id:'headphones',name:'Soundcore Q20i',price:4500,resale:2800},{id:'gamepad',name:'8BitDo Ultimate 2C',price:2400,resale:1700},{id:'console',name:'PlayStation 5 Slim',price:42000,resale:30000},{id:'portable',name:'Steam Deck LCD',price:36000,resale:26000}];
export function buyUpgrade(s,id){const u=PC_UPGRADES[id];s.pc.pending||={ram:0,gpu:0,ssd:0};const level=(s.pc[id]||0)+(s.pc.pending[id]||0);if(!s.pc.owned||!u||level>=2)return false;const price=Math.round(u.prices[level]*(s.profile.perk==='smart'?.85:1));if(s.money<price)return false;s.money-=price;s.pc.pending[id]++;return true;}
export class TechShop{
 constructor(api){Object.assign(this,api);}
 init(){const w=this.world(),outside=new T.Group();outside.position.set(22.3,0,-.4);w.scene.add(outside);
 const add=(g,size,pos,color)=>{const m=w.box(...size,color);m.position.set(...pos);g.add(m);return m;};
 add(outside,[5.3,2.8,3.0],[0,1.4,0],'#44545d');add(outside,[5.5,.22,3.2],[0,2.9,0],'#d98039');add(outside,[4.8,1.7,.05],[0,1.1,1.53],'#9bbbc0');add(outside,[.08,1.9,.08],[.3,1.0,1.59],'#e6c38e');const sign=makeSign('ТЕХНОТОЧКА',4.9,.46,'#d47731','#fff3db');sign.position.set(0,2.52,1.58);outside.add(sign);batchStatic(outside);
 const room=new T.Scene();room.background=new T.Color('#d7ddd6');w.light(room);w.scenes.techshop=room;AREAS.techshop=[-3.55,3.55,-2.0,2.4];SOLIDS.techshop=[[-3.5,3.5,-2,-1.35],[-3.45,-2.3,.2,1.15],[1.3,3.25,-.3,.75]];DOORS.techshop=[22.3,.05,1.8];
 add(room,[7.4,.18,5.0],[0,-.06,0],'#bcc5c5');add(room,[7.4,2.9,.12],[0,1.45,-2.40],'#e0e5e0');add(room,[.12,2.9,5],[-3.65,1.45,0],'#697b80');add(room,[7.2,.25,.15],[0,2.6,-2.30],'#d77b36');
 for(const [i,id]of ['pc','gpu','headphones','console','portable','gamepad'].entries()){const x=-2.9+i*1.15;add(room,[1.05,.85,.8],[x,.44,-1.8],'#81928e');const g=product(id);g.position.set(x,.91,-1.75);g.scale.setScalar(.68);room.add(g);}
 add(room,[1.3,.95,.7],[-2.85,.52,.65],'#d48342');const clerk=w.person('#bf8147');clerk.position.set(-2.85,.05,-.2);room.add(clerk);this.clerk=clerk;
 add(room,[1.7,.8,.75],[2.2,.45,.2],'#a8b6b2');const set=product('pc');set.position.set(2.2,.9,.2);set.scale.setScalar(.8);room.add(set);const label=makeSign('ПК · ЗВУК · КОНСОЛИ',5.8,.35,'#485f66','#fff1d5');label.position.set(0,2.18,-2.28);room.add(label);w.environmentLights.push({scene:room,sun:room.children.find(o=>o.isDirectionalLight),hemi:room.children.find(o=>o.isHemisphereLight)});
 const base=w.setZone.bind(w);w.setZone=(zone,instant=false,spawn=null)=>{base(zone,instant,spawn);if(zone==='techshop'){w.avatar.position.set(0,.05,1.85);w.targetFocus.set(0,.9,-.1);w.targetView=7.1;}};
 }
 async visit(){const w=this.world();this.close();if(w.mode==='techshop'){this.open('techCatalog');return;}if(w.mode!=='street')await w.transitionTo('street');w.walkTo([22.3,.05,1.8],async()=>{await w.transitionTo('techshop');this.persist();this.toast('Техноточка: ПК, комплектующие, звук и консоли.');});}
 handle(action,id){const s=this.state(),w=this.world();if(action==='techShop'){this.visit();return true;}if(action==='techCatalog'){this.open('techCatalog');return true;}if(action==='techExit'){this.close();w.transitionTo('street').then(()=>this.persist());return true;}
 if(action==='buyPcUpgrade'&&w.mode==='techshop'){if(buyUpgrade(s,id)){this.audio.play('coin');this.persist();this.toast('Комплектующая куплена. Установи её на домашнем ПК.');}else this.toast('Проверь цену и доступный уровень улучшения.');return true;}
 if(action==='buyTech'){if(w.mode!=='techshop')return true;const g=TECH_GOODS.find(g=>g.id===id);if(!g||s.money<g.price){this.toast('Не хватает денег.');return true;}s.money-=g.price;s.phones.push({id:s.serial++,kind:g.id,name:g.name,cost:g.price,resale:g.resale,defect:'battery',fixed:true,closed:true,diagnosed:true});this.persist();this.audio.play('coin');this.toast('Покупка в разделе «Техника»: '+g.name);return true;}return false;
 }
 targets(){const w=this.world();return w.mode==='street'?[{id:'techShop',label:'Техноточка',position:new T.Vector3(22.3,3.2,1.2),action:'techShop'}]:w.mode==='techshop'?[{id:'techCatalog',label:'Каталог техники',position:new T.Vector3(-2.4,1.65,.6),action:'techCatalog'},{id:'techExit',label:'Выйти',position:new T.Vector3(0,.65,2.3),action:'techExit'}]:[];}
 render(modal){if(modal!=='techCatalog')return null;const s=this.state(),b=this.button;return `<span class="eyebrow">ТЕХНОТОЧКА · МАГАЗИН ТЕХНИКИ</span><h2>Собери свой сетап</h2>${!s.pc.owned?`<article class="hardware-card">${this.img('pc')}<div><h3>ПК StartBox</h3><p>Монитор, системный блок, клавиатура и мышь.</p>${b('buyPc','Купить · 2 200 ₽','mint')}</div></article>`:Object.entries(PC_UPGRADES).map(([id,u])=>{const level=s.pc[id]+(s.pc.pending?.[id]||0),price=Math.round(u.prices[level]*(s.profile.perk==='smart'?.85:1));return `<article class="hardware-card">${this.img(id)}<div><h3>${u.title}</h3><p>${u.tiers[Math.min(2,level+1)]}</p>${level<2?b('buyPcUpgrade','Купить · '+money(price),'',`data-id="${id}"`):'<small>Максимальный комплект уже куплен</small>'}</div></article>`}).join('')}<div class="note">Покупай комплектующие здесь, устанавливай дома. Azon занимается посылками и деталями ремонта.</div>${TECH_GOODS.map(g=>`<article class="hardware-card">${this.img(g.id)}<div><h3>${g.name}</h3><p>${money(g.price)}</p>${b('buyTech','Купить','',`data-id="${g.id}"`)}</div></article>`).join('')}`;}
}
