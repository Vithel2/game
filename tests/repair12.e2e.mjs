import assert from 'node:assert/strict';
import {harness,seed,ready} from './browser-harness.mjs';
import {mkdir} from 'node:fs/promises';
const h=await harness();await h.page.close();const ctx=await h.browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await ctx.newPage();p.setDefaultTimeout(60000);const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{window.__captureMode=true;window.__captureFps=60});await mkdir('/tmp/perekup12-check',{recursive:true});
const step=async(n=1)=>p.evaluate(n=>{window.__captureSkipRender=true;for(let i=0;i<n;i++)window.__captureFrame();window.__captureSkipRender=false;window.__captureFrame()},n);
const tap=async s=>{await p.locator(s).first().tap();await step();};
const settle=async()=>{for(let i=0;i<100;i++){await step(30);if(await p.evaluate(()=>!__game.busy&&!__game.moving&&!__game.navigation.transitioning))return;await p.waitForTimeout(25)}throw Error('Action stuck')};
try{
 await seed(p,{money:20000,phones:[{id:1,name:'iPhone 13 mini',defect:'battery',diagnosed:true}],parts:{battery:1,charge:0,display:1}});await p.goto(h.url);await ready(p);await step(2);await tap('[data-action="start"]');await tap('#dock [data-action="bench"]');await settle();await tap('[data-action="repairPhone"]');await step(30);
 assert.equal(await p.evaluate(()=>__game.repairView.stockDiagnostic),false);
 let lifted,parked;
 for(let i=0;i<35;i++){
  const stage=await p.evaluate(()=>__game.stage);if(stage==='done')break;
  const tool={open:'suction',disconnect:'spudger',connect:'spudger',screws:'driver',tighten:'driver',remove:'hand',install:'hand',close:'hand',test:'hand'}[stage];
  if(tool)await tap(`.tool[data-tool="${tool}"]`);
  const button=p.locator('.mobile-repair-action');const r=await button.boundingBox();assert.ok(r.height>=44&&r.y+r.height<=844,'large visible repair button');await tap('.mobile-repair-action');await settle();
  const next=await p.evaluate(()=>__game.stage),view=await p.evaluate(()=>__game.repairView);
  assert.deepEqual(view.hands,[]);
  if(next==='disconnect'&&!lifted){lifted=view.cover;await p.screenshot({path:'/tmp/perekup12-check/repair-lifted.png'});}
  if(next==='screws'&&!parked){parked=view.cover;assert.ok(Math.hypot(...parked.map((v,i)=>v-lifted[i]))>.04,'screen parks after disconnection');await p.screenshot({path:'/tmp/perekup12-check/repair-parked.png'});}
  if(stage==='tighten'&&next==='connect'){assert.ok(Math.hypot(...view.cover.map((v,i)=>v-lifted[i]))<.003,'screen returns before connecting');await p.screenshot({path:'/tmp/perekup12-check/repair-reconnect.png'});}
 }
 assert.equal(await p.evaluate(()=>__game.stage),'done');assert.equal(await p.evaluate(()=>__game.state.phones[0].fixed),true);assert.deepEqual(errors,[]);await p.screenshot({path:'/tmp/perekup12-check/repair-finished.png'});console.log('PASS: full mobile repair, screen lift/disconnect/park/return/connect ordering, blank spare display, no hands, reachable 44px controls');
}finally{await ctx.close();await h.close()}
