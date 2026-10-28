import assert from 'node:assert/strict';
import {stageFor,screwCount,screwMask,connectorMask} from '../game/repair-rules.js';
import * as T from 'three';
import {scheduleResident,isHomeTime} from '../game/citizen-schedule.js';
import {fresh,load,KEY} from '../game/state.js';
for(const difficulty of ['quick','standard','advanced','expert']){
 const p={difficulty,defect:'battery'};assert.ok(screwCount(p)<=7);assert.equal(stageFor(p),'diagnose');p.diagnosed=true;p.warmed=true;assert.equal(stageFor(p),'open');p.open=true;assert.equal(stageFor(p),'disconnect');p.disconnected=connectorMask(p);assert.equal(stageFor(p),'screws');p.out=screwMask(p);p.cleaned=true;assert.equal(stageFor(p),'remove');p.removed=true;p.installed=true;p.soldered=true;assert.equal(stageFor(p),'tighten');p.inside=screwMask(p);assert.equal(stageFor(p),'connect');p.connected=connectorMask(p);p.sealed=true;assert.equal(stageFor(p),'close');p.closed=true;p.calibrated=true;assert.equal(stageFor(p),'test');p.fixed=true;assert.equal(stageFor(p),'done');
}
const old={difficulty:'expert',diagnosed:true,warmed:true,open:true,disconnected:7,out:4095,cleaned:true,removed:true,installed:true,soldered:true,inside:4095,connected:7,sealed:true,closed:true};assert.equal(stageFor(old),'calibrate','old larger screw masks must not restart repairs');
assert.equal(isHomeTime(19.5,1),true);assert.equal(isHomeTime(19.5,5),false);assert.equal(isHomeTime(21.1,5),true);assert.equal(isHomeTime(6.1,5),true);
const state=fresh();state.phones=[old];globalThis.localStorage={getItem:key=>key===KEY?JSON.stringify(state):null};assert.equal(stageFor(load().phones[0]),'calibrate');
const resident={actor:new T.Group(),route:[]};resident.actor.position.set(12,.05,2.5);scheduleResident(resident,1,19,.05);assert.equal(resident.schedule,'active');scheduleResident(resident,1,19.5,.05);assert.equal(resident.schedule,'leaving');assert.equal(resident.actor.visible,true);assert.ok(resident.route.length>0);resident.route=[];scheduleResident(resident,1,22,.2);assert.ok(resident.alpha>0&&resident.alpha<1);assert.equal(resident.actor.visible,true);for(let i=0;i<8;i++)scheduleResident(resident,1,22,.2);assert.equal(resident.actor.visible,false);
console.log('PASS: open/disconnect before internal screws, maximum seven, old 12-screw progress retained, staggered resident schedules');
