function test(name,run){run();console.log('PASS: '+name)}
import assert from 'node:assert/strict';
import {KEY,load,save} from '../game/state.js';

test('the previous release keeps money, repairs and sales and receives the new systems',()=>{
 const previous={version:3,started:true,day:7,time:660,money:5180,sold:1,reputation:53,phones:[{id:1,defect:'battery',fixed:true,sold:true}],parts:{battery:1,charge:0,display:0},orders:[{id:2,part:'battery',ready:7,picked:true}],bought:['1-a'],stock:{battery:1,charge:1,display:0},serial:3};
 let raw=JSON.stringify(previous);globalThis.localStorage={getItem:key=>key===KEY?raw:null,setItem:(key,value)=>{assert.equal(key,KEY);raw=value}};
 const next=load();assert.equal(next.version,7);assert.equal(next.money,5180);assert.equal(next.day,7);assert.deepEqual(next.phones,previous.phones);assert.deepEqual(next.orders,previous.orders);assert.equal(next.sold,1);assert.deepEqual(next.market.deals,[]);assert.deepEqual(next.market.reviews,[]);assert.equal(next.market.history.length,1);assert.equal(next.market.history[0].phone,1);assert.equal(next.market.history[0].method,'legacy');assert.deepEqual(next.calendar,{notes:{}});assert.deepEqual(next.pc,{owned:false,ram:0,gpu:0,ssd:0});assert.deepEqual(next.contracts,[]);assert.deepEqual(next.claims,[]);assert.equal(next.tutorial.intro,true);
 next.pc.owned=true;next.pc.ram=1;next.records.phone=5;next.claims.push('phone-game');save(next);
 const again=load();assert.deepEqual(again.pc,next.pc);assert.equal(again.records.phone,5);assert.deepEqual(again.claims,['phone-game']);assert.equal(again.money,5180);
 delete globalThis.localStorage;
});

test('an invalid saved document recovers to a usable new game',()=>{
 globalThis.localStorage={getItem:()=>'{broken'};
 const recovered=load();assert.equal(recovered.version,7);assert.equal(recovered.started,false);assert.equal(recovered.money,3500);assert.deepEqual(recovered.contracts,[]);delete globalThis.localStorage;
});
