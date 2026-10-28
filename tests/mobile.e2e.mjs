import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('.');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(p!==root&&!p.startsWith(root+'/')){res.writeHead(403);res.end();return}const file=p===root?resolve(root,'index.html'):p;res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port+'/';
let browser;
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});browser=b;
 const context=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(90000);
 async function tap(s){await p.locator(s).first().tap();await p.waitForTimeout(100)}
 async function ready(){await p.waitForFunction(()=>window.__game?.ready,null,{timeout:90000})}
 await p.goto(url);await ready();await tap('[data-action="start"]');for(let i=0;i<3;i++)await tap('[data-action="storyNext"]');
 await p.locator('#nickname').fill('Света');await tap('[data-action="gender"][data-gender="female"]');await tap('[data-action="perk"][data-id="runner"]');await tap('[data-action="profileDone"]');
 assert.deepEqual(await p.evaluate(()=>__game.state.profile),{created:true,name:'Света',gender:'female',perk:'runner'});assert.equal(await p.locator('[data-action="tutorialSkip"]').count(),0);await tap('[data-action="trainingMove"]');await p.waitForFunction(()=>__game.state.training.moved);
 await tap('#dock [data-action="phone"]');await tap('.phone-nav [data-tab="avitu"]');await p.waitForTimeout(300);await p.screenshot({path:'/tmp/sruk4_mobile_market.png'});assert.equal(await p.locator('.listing .product-thumb img').count(),7);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 console.log('PASS: touch story, female profile, runner perk, mandatory visual tutorial and 390px market');
 await context.close();
 const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const q=await c.newPage();q.on('pageerror',e=>errors.push(e.message));q.setDefaultTimeout(90000);
 await q.addInitScript(()=>localStorage.setItem('s-ruk-game-v3',JSON.stringify({version:5,profile:{created:true,name:'Света',gender:'female',perk:'runner'},training:{complete:true},pc:{owned:true,ram:1,gpu:1,ssd:1},pantry:{water:1}})));
 async function touch(s){await q.locator(s).first().tap();await q.waitForTimeout(100)}
 await q.goto(url);await q.waitForFunction(()=>window.__game?.ready,null,{timeout:90000});await touch('[data-action="start"]');
 await touch('#hud [data-action="inventory"]');await touch('[data-action="consumeFood"][data-id="water"]');await q.waitForFunction(()=>__game.pose.action==='drink'&&__game.pose.rightArm<-.6);await q.screenshot({path:'/tmp/sruk4_mobile_drink.png'});await q.waitForFunction(()=>!__game.busy);assert.equal(await q.evaluate(()=>__game.state.pantry.water),0);
 await touch('#dock [data-action="goStreet"]');await touch('.hotspot[data-action="grocery"]');await q.waitForFunction(()=>__game.mode==='grocery');await touch('[data-action="takeBasket"]');for(let i=0;i<8;i++){await touch('[data-action="addFood"][data-food="apple"]');await q.waitForFunction(()=>!__game.busy&&!__game.moving)}await touch('[data-action="addFood"][data-food="bread"]');assert.equal(await q.evaluate(()=>__game.state.shop.items.apple),8);assert.equal(await q.evaluate(()=>__game.state.shop.items.bread||0),0);await touch('#dock [data-action="shopCounter"]');await touch('[data-action="checkout"]');assert.equal(await q.evaluate(()=>__game.state.money),3140);await touch('[data-action="workMenu"][data-id="grocery"]');await touch('[data-action="startShift"]');for(let i=0;i<3;i++){const a=await q.evaluate(()=>__game.shift);await touch(`[data-action="shiftPick"][data-id="${a.tasks[a.index].item}"]`);await q.waitForFunction(()=>!__game.busy)}await touch('[data-action="finishShift"]');await touch('[data-action="claimWage"]');assert.equal(await q.evaluate(()=>__game.state.work.grocery),1);await touch('.modal-close');await q.screenshot({path:'/tmp/sruk4_mobile_shop.png'});
 await touch('#dock [data-action="phone"]');await touch('.phone-nav [data-tab="home"]');await touch('[data-action="playPhone"]');await touch('#arcade-start');await q.waitForFunction(()=>__game.arcade?.running);
 const end=Date.now()+45000;while(Date.now()<end){const a=await q.evaluate(()=>__game.arcade);if(!a||a.score>=5)break;const hit=a.packets[0];if(hit){const box=await q.locator('.arcade-canvas').boundingBox();await q.touchscreen.tap(box.x+hit.x/360*box.width,box.y+hit.y/460*box.height)}await q.waitForTimeout(180)}assert.ok((await q.evaluate(()=>__game.arcade?.score||__game.state.records.phone))>=5);if(await q.locator('#arcade-stop').count())await touch('#arcade-stop');await touch('.modal-close');
 await touch('#dock [data-action="goStreet"]');await touch('#dock [data-action="goHome"]');await q.waitForFunction(()=>__game.mode==='room');await touch('.hotspot[data-action="pc"]');await touch('[data-action="playPc"]');await touch('#arcade-start');await q.waitForFunction(()=>__game.arcade?.running);await touch('#arcade-left');assert.equal(await q.evaluate(()=>__game.arcade.lane),0);await touch('#arcade-right');assert.equal(await q.evaluate(()=>__game.arcade.lane),1);await touch('#arcade-stop');
 assert.equal(await q.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);console.log('PASS: mobile drinking, basket limit, checkout, phone game touch controls and PC game controls');await b.close();server.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();server.close();process.exitCode=1});
