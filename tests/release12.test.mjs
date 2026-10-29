import assert from 'node:assert/strict';
import {fresh,offers,KEY} from '../game/state.js';
import {parseSave,importSave} from '../game/save-transfer.js';
import {character,animateCharacter,setEyesClosed} from '../game/characters.js';
import {dailyQuests} from '../game/content.js';
for(const gender of ['male','female']){const actor=character({gender});setEyesClosed(actor,true);assert.ok(actor.eyes.every(e=>!e.visible));assert.ok(actor.eyelids.visible&&actor.eyelids.parent===actor.head);animateCharacter(actor,0);assert.ok(actor.eyes.every(e=>e.visible&&e.scale.y===1));assert.equal(actor.eyelids.visible,false);animateCharacter(actor,Math.PI/2/1.2);assert.ok(actor.eyes.every(e=>e.scale.y===.1));}
const s=fresh();s.training.complete=true;const original=offers(s);s.bought.push(original[0].id);for(const o of offers(s))assert.deepEqual(o,original.find(p=>p.id===o.id),'buying another listing must not change this deal');s.day++;assert.notDeepEqual(offers(s).map(o=>o.name),original.map(o=>o.name));assert.notDeepEqual(dailyQuests(s).map(q=>q.title),dailyQuests({...s,day:s.day+1}).map(q=>q.title));
const map=new Map([[KEY,JSON.stringify(fresh())]]),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};s.money=12345;s.phones=[{id:7,name:'iPhone 13 mini',disconnected:7,out:31}];importSave(JSON.stringify(s),storage);assert.equal(parseSave(map.get(KEY)).money,12345);assert.equal(JSON.parse(map.get(KEY+'-backup')).money,3500);const before=map.get(KEY);for(const text of ['{}','bad',JSON.stringify({...s,day:null}),'x'.repeat(2_000_001)])assert.throws(()=>importSave(text,storage));assert.equal(map.get(KEY),before);
console.log('PASS: sleeping eyelids and waking/blinking for both avatars; stable rotating listings, daily quests; save import/backup and rejection of corrupt files');
