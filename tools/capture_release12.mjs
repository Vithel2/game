import {harness,seed,ready} from '../tests/browser-harness.mjs';
import {mkdir} from 'node:fs/promises';
const h=await harness();await h.page.close();
try{for(const mobile of [true,false]){
 const ctx=await h.browser.newContext({viewport:mobile?{width:360,height:640}:{width:1920,height:1080},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile}),p=await ctx.newPage();p.setDefaultTimeout(90000);await p.addInitScript(()=>{window.__captureMode=true;window.__captureFps=60});await seed(p,{money:60000,day:8,time:650,house:{level:2,owned:[],hidden:[]},pc:{owned:true,ram:1,gpu:1,ssd:1}});await p.goto(h.url);await ready(p);
 const frame=async(n=1)=>p.evaluate(n=>{window.__captureSkipRender=true;for(let i=0;i<n;i++)__captureFrame();window.__captureSkipRender=false;__captureFrame()},n);
 const press=async sel=>{await p.locator(sel).first().evaluate(e=>e.click());await frame()};const settle=async()=>{for(let i=0;i<180;i++){await frame(30);if(await p.evaluate(()=>!__game.busy&&!__game.moving&&!__game.navigation.transitioning))return;await p.waitForTimeout(30)}throw Error('Motion stuck')};
 const path='marketing/0.12/'+(mobile?'mobile':'pc');await mkdir(path,{recursive:true});const shot=async name=>{await frame(120);await p.screenshot({path:path+'/'+name+'.png'})};
 await press('[data-action="start"]');await shot('home');await press('#dock [data-action="phone"]');await press('[data-tab="avitu"]');await shot('market');await press('.modal-close');await press('#dock [data-action="map"]');await press('[data-action="nav"][data-id="techShop"]');await settle();await shot('techshop');await press('[data-action="techCatalog"]');await shot('catalog');await press('.modal-close');await press('[data-action="techExit"]');await settle();await press('#dock [data-action="map"]');await press('[data-action="nav"][data-id="park"]');await settle();await shot('park');await ctx.close();console.log('SCREENSHOTS_OK',mobile?'1080x1920 mobile':'1920x1080 PC');
}}finally{await h.close()}
