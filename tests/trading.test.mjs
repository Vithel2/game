import assert from 'node:assert/strict';
import * as T from 'three';
import {fresh} from '../game/state.js';
import {createDeal,completeDeal,shipDeal,sellerRating} from '../game/trading.js';
import {faceTravel} from '../game/steering.js';
const s=fresh();s.phones=[1,2,3,4,5].map(id=>({id,fixed:true,defect:'battery',cost:850,name:'R / 0'+id}));s.serial=10;
assert.equal(createDeal(s,9,'meet'),null);const d=createDeal(s,1,'meet');assert.equal(s.money,3500);assert.equal(s.sold,0);assert.equal(completeDeal(s,d.id),null,'buyer must inspect first');assert.equal(createDeal(s,2,'meet'),null,'only one buyer at a time');d.checked=true;assert.ok(completeDeal(s,d.id));assert.equal(s.money,6750);assert.equal(s.profit,1680);assert.equal(sellerRating(s),'5,0');assert.equal(completeDeal(s,d.id),null,'single payout');
const parcel=createDeal(s,2,'parcel');assert.equal(completeDeal(s,parcel.id),null);assert.ok(shipDeal(s,parcel.id));assert.equal(shipDeal(s,parcel.id),null);assert.equal(completeDeal(s,parcel.id),null,'no payout before arrival');s.day++;assert.ok(completeDeal(s,parcel.id));assert.equal(s.market.history[0].method,'parcel');
for(const id of[3,4]){const deal=createDeal(s,id,'meet');deal.checked=true;if(id===4)s.day+=3;assert.ok(completeDeal(s,deal.id));}
assert.equal(s.market.history.length,3);assert.deepEqual(s.market.history.map(h=>h.phone),[4,3,2]);assert.equal(s.market.history[0].stars,4);assert.equal(sellerRating(s),'4,8');s.phones.push({id:100,client:'lev',fixed:true});assert.equal(createDeal(s,100,'meet'),null);
for(const angle of[0,Math.PI*.7,-Math.PI*.8,Math.PI])for(const direction of[[1,0],[-1,0],[0,1],[0,-1]]){const actor=new T.Group();actor.rotation.set(Math.PI,angle,Math.PI);for(let i=0;i<45;i++){const ready=faceTravel(actor,...direction,1/60);if(ready){const f=new T.Vector3(0,0,1).applyQuaternion(actor.quaternion);assert.ok(f.x*direction[0]+f.z*direction[1]>.8);}}const forward=new T.Vector3(0,0,1).applyQuaternion(actor.quaternion);assert.ok(forward.x*direction[0]+forward.z*direction[1]>.999);assert.ok(Math.abs(forward.y)<.001);}
console.log('PASS: physical-sale guards, shipping delay, single payouts, 3-sale history, seller rating, client protection, yaw recovery after life poses and turn-before-walk');
