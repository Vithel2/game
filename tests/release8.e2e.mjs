import assert from 'node:assert/strict';
import {harness,seed,ready,idle,click} from './browser-harness.mjs';
const h=await harness(),p=h.page;
const c=s=>click(p,s),tool=t=>c(`[data-action="tool"][data-tool="${t}"]`),stage=s=>p.waitForFunction(s=>__game.stage===s,s);
async function skill(){
 for(let i=0;i<3;i++){
  await p.waitForSelector('[data-action="skillHit"]');
  // Trigger in the same presented frame, as a touch press does. Deliberately
  // delay release: the old click-based implementation would judge a later phase.
  await p.evaluate(()=>new Promise(resolve=>{function sample(){const n=document.querySelector('.skill-needle')?.getBoundingClientRect(),z=document.querySelector('.skill-zone')?.getBoundingClientRect();if(n&&z&&(n.left+n.right)/2>z.left+5&&(n.left+n.right)/2<z.right-5){document.querySelector('[data-action="skillHit"]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerType:'touch'}));resolve()}else requestAnimationFrame(sample)}sample()}));
  await p.waitForTimeout(180);
 }
 await idle(p);
}
try{
 await seed(p,{day:8,time:600,energy:100,money:12000,pc:{owned:true},phones:[{id:5,name:'R / PRO',difficulty:'expert',defect:'battery',diagnosed:true,out:4095,warmed:true,open:true,disconnected:7,cleaned:true,removed:true,installed:true},{id:6,name:'R / 02',difficulty:'advanced',defect:'charge',diagnosed:true,out:1023}]});
 await p.goto(h.url);await ready(p);await c('[data-action="start"]');
 assert.equal(await p.evaluate(()=>__game.state.phones[0].name),'Aster 13 Pro');
 await c('#dock [data-action="bench"]');await c('[data-action="repairPhone"][data-id="6"]');await stage('heat');await tool('heater');await c('.hotspot[data-action="heat"]');
 // Red zone must fail; visible green must succeed. No reading of simulation phase.
 await p.evaluate(()=>{document.querySelector('.skill-needle').style.left='95%';document.querySelector('[data-action="skillHit"]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}));});assert.equal(await p.evaluate(()=>__game.skill.hits),0);
 await skill();await stage('open');console.log('PASS: visible heat targets and initial-press input');await c('[data-action="leaveRepair"]');
 await c('#dock [data-action="bench"]');await c('[data-action="repairPhone"][data-id="5"]');await stage('solder');await tool('iron');await c('.hotspot[data-action="solder"]');await skill();await stage('connect');await tool('spudger');for(let i=0;i<3;i++){await idle(p);await c('.hotspot[data-action="connector"]');}await stage('tighten');await idle(p);
 assert.equal(await p.evaluate(()=>__game.state.phones[0].closed||false),false);await tool('driver');for(let i=0;i<12;i++){await idle(p);await c('.hotspot[data-action="screw"]');}await stage('seal');await tool('glue');await c('.hotspot[data-action="seal"]');await stage('close');await tool('hand');await c('.hotspot[data-action="close"]');await stage('calibrate');await tool('meter');await c('.hotspot[data-action="calibrate"]');await skill();await stage('test');await c('.hotspot[data-action="test"]');await p.waitForFunction(()=>__game.repairView.progress>.5);await p.screenshot({path:'/tmp/perekup8-diagnostic.png'});await p.waitForSelector('.diagnostic-summary');assert.match(await p.locator('.diagnostic-summary').innerText(),/224 Мбит/);await c('[data-action="finishBenchTest"]');await c('[data-action="close"]');console.log('PASS: solder, screws before sealing/closing, calibration, on-device diagnostics and final report');
 await c('#dock [data-action="phone"]');await c('[data-action="tab"][data-tab="home"]');await c('[data-action="youpube"]');await c('[data-action="recordVlog"][data-id="story"]');await c('[data-action="videoCapture"]');await p.waitForSelector('#recording-viewfinder');await p.waitForFunction(()=>__game.pose.progress>.25);const before=await p.evaluate(()=>__game.pose.hands[0]);await p.waitForTimeout(450);const after=await p.evaluate(()=>__game.pose.hands[0]);assert.ok(Math.hypot(...after.map((v,i)=>v-before[i]))>.005);await p.screenshot({path:'/tmp/perekup8-recording.png'});await p.waitForSelector('[data-action="videoCapture"]');assert.equal(await p.evaluate(()=>__game.media.production.clips.length),1);assert.equal(await p.locator('#recording-viewfinder').count(),0);assert.deepEqual(h.errors,[]);console.log('PASS: animated recording, live REC overlay, saved clip, no browser errors');
}finally{await h.close()}
