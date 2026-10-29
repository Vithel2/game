import assert from 'node:assert/strict';
import {harness,seed,ready,click,idle} from './browser-harness.mjs';
const h=await harness();await h.page.close();const p=await h.browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const c=s=>click(p,s);const errors=[];p.on('pageerror',e=>errors.push(e.message));
try{await seed(p,{day:8,time:600,phones:[{id:6,name:'Qubo Neo 10',difficulty:'advanced',defect:'charge',diagnosed:true,out:1023}]});await p.goto(h.url);await ready(p);await c('[data-action="start"]');await c('#dock [data-action="bench"]');await c('[data-action="repairPhone"]');await c('[data-action="tool"][data-tool="heater"]');await c('.mobile-repair-action[data-action="heat"]');
 await p.waitForTimeout(350);
 await p.evaluate(()=>{document.addEventListener('pointerdown',e=>{if(e.target.closest('[data-action="skillHit"]')){const n=document.querySelector('.skill-needle').getBoundingClientRect(),z=document.querySelector('.skill-zone').getBoundingClientRect(),x=(n.left+n.right)/2;window.lastPrecisionPress={green:x>=z.left-2&&x<=z.right+2,target:e.target.closest('[data-action]').dataset.action}}},true)});
 const b=await p.locator('[data-action="skillHit"]').boundingBox();let hits=0;
 for(let attempts=0;attempts<12&&hits<3;attempts++){
  await p.waitForFunction(()=>{const n=document.querySelector('.skill-needle')?.getBoundingClientRect(),z=document.querySelector('.skill-zone')?.getBoundingClientRect();return n&&z&&Math.abs((n.left+n.right-z.left-z.right)/2)<z.width*.20});
  await p.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await p.waitForTimeout(90);
  const press=await p.evaluate(()=>window.lastPrecisionPress);assert.ok(press,'a real touch must reach the button');if(press.green)hits++;
  if(hits<3){assert.equal(await p.locator('[data-action="skillHit"]').count(),1,'touch release must not close the re-rendered mini-game');assert.equal(await p.evaluate(()=>__game.skill?.hits),hits,'only a presented green target scores');}
 }
 assert.equal(hits,3);

 await idle(p);assert.equal(await p.evaluate(()=>__game.stage),'open');assert.deepEqual(errors,[]);await p.screenshot({path:'/tmp/perekup8-mobile.png'});console.log('PASS: 390×844 touch presses hit the presented heat zone, no release click closes the modal');
}finally{await h.close()}
