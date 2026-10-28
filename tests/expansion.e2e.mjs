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
 const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)});p.setDefaultTimeout(90000);
 const state=()=>p.evaluate(()=>__game.state);
 async function click(sel){await p.locator(sel).first().click();await p.waitForTimeout(100)}
 async function mode(value){await p.waitForFunction(v=>window.__game?.mode===v,value,{timeout:90000})}
 async function close(){if(await p.locator('.modal-close').count())await click('.modal-close')}
 async function home(){await close();const m=await p.evaluate(()=>__game.mode);if(m==='grocery'||m==='pickup')await click('#dock [data-action="goStreet"]');if(await p.evaluate(()=>__game.mode)!=='room')await click('#dock [data-action="goHome"]');await mode('room')}
 async function journal(){await close();await click('#hud [data-action="quests"]');await click('[data-action="journalTab"][data-id="goals"]')}
 async function claim(id){await journal();await click(`[data-action="claimQuest"][data-id="${id}"]`);await close()}
 async function stage(value){await p.waitForFunction(v=>__game.stage===v,value,{timeout:90000});console.log('REPAIR',value)}
 async function tool(id){await click(`[data-action="tool"][data-tool="${id}"]`)}
 async function toInstall(){await click('.hotspot[data-action="diagnose"]');await stage('screws');await tool('driver');for(let i=0;i<8;i++)await click('.hotspot[data-action="screw"]');await tool('suction');await click('.hotspot[data-action="open"]');await tool('spudger');for(let i=0;i<3;i++)await click('.hotspot[data-action="connector"]');await tool('hand');await click('.hotspot[data-action="remove"]');await stage('install')}
 async function assemble(){await tool('hand');await click('.hotspot[data-action="install"]');await stage('connect');await tool('spudger');for(let i=0;i<3;i++)await click('.hotspot[data-action="connector"]');await tool('hand');await click('.hotspot[data-action="close"]');await tool('driver');for(let i=0;i<8;i++)await click('.hotspot[data-action="screw"]');await click('.hotspot[data-action="test"]')}
 await p.addInitScript(()=>!localStorage.getItem('s-ruk-game-v3')&&localStorage.setItem('s-ruk-game-v3',JSON.stringify({version:5,profile:{created:true,name:'ТестКлиент',gender:'male',perk:'maker'},training:{complete:true}})));
 await p.goto(url);await p.waitForFunction(()=>window.__game?.ready,null,{timeout:90000});await p.evaluate(()=>document.fonts.ready);
 assert.equal(await p.evaluate(()=>document.fonts.check('14px Nunito')),true);assert.equal(await p.evaluate(()=>document.fonts.check('14px "Russo One"')),true);
 await click('[data-action="start"]');
 await click('#dock [data-action="goStreet"]');await mode('street');await p.waitForTimeout(1200);await p.screenshot({path:'/tmp/sruk_update_exterior.png'});
 await click('.hotspot[data-action="grocery"]');await mode('grocery');await p.waitForTimeout(900);await p.screenshot({path:'/tmp/sruk_update_store.png'});
 await click('[data-action="takeBasket"]');await click('[data-action="addFood"][data-food="sandwich"]');await p.waitForFunction(()=>!__game.busy&&!__game.moving);await click('#dock [data-action="shopCounter"]');await click('[data-action="checkout"]');assert.equal((await state()).money,3380);assert.equal((await state()).stats.groceryVisits,1);
 await claim('lunch');await claim('daily-1-food');assert.equal((await state()).money,3540);
 await journal();assert.equal(await p.locator('[data-action="claimQuest"][data-id="lunch"]').isDisabled(),true);assert.equal(await p.locator('[data-action="claimQuest"][data-id="first-sale"]').isDisabled(),true);
 await click('[data-action="journalTab"][data-id="jobs"]');await click('[data-action="acceptJob"][data-id="tamara"]');assert.equal((await state()).contracts.length,1);assert.equal((await state()).phones[0].client,'tamara');assert.equal(await p.locator('[data-action="acceptJob"][data-id="masha"]').isDisabled(),true);await close();
 await click('#dock [data-action="goStreet"]');await mode('street');await click('.hotspot[data-action="pickup"]');await mode('pickup');await p.waitForTimeout(900);await p.screenshot({path:'/tmp/sruk_update_pickup.png'});
 await click('.hotspot[data-action="pcMarket"]');await click('[data-action="buyPc"]');assert.equal((await state()).pc.owned,true);assert.equal((await state()).money,1340);await claim('computer');assert.equal((await state()).money,1590);
 console.log('PASS: intro, fonts, interiors, food, quest guards, commission acceptance, PC purchase');
 await home();await click('#dock [data-action="bench"]');await click('[data-action="repairPhone"]');await toInstall();
 await click('.hotspot[data-action="install"]');await click('[data-action="order"][data-id="battery"]');assert.equal((await state()).money,870);await close();await click('[data-action="leaveRepair"]');await click('.hotspot[data-action="bed"]');await click('[data-action="sleep"]');await p.waitForFunction(()=>__game.state.day===2&&!__game.busy);
 await click('#dock [data-action="goStreet"]');await mode('street');await click('.hotspot[data-action="pickup"]');await mode('pickup');await click('#dock [data-action="pickupCounter"]');await click('[data-action="collect"]');await home();
 await click('#dock [data-action="bench"]');await click('[data-action="repairPhone"]');await stage('install');await assemble();
 await p.waitForSelector('[data-action="returnClient"]');assert.equal(await p.locator('[data-action="sell"]').count(),0);await click('[data-action="returnClient"]');await mode('grocery');await click('#dock [data-action="shopCounter"]');
 const before=(await state()).money;await click('[data-action="deliverClient"]');assert.equal((await state()).money-before,1750);assert.equal((await state()).stats.jobsCompleted,1);assert.equal((await state()).sold,0);assert.equal((await state()).contracts[0].done,true);assert.equal(await p.locator('[data-action="deliverClient"]').count(),0);
 await claim('neighbor');await claim('parcel');assert.equal((await state()).money,3050);
 console.log('PASS: full client repair, physical return, deadline bonus, no resale or duplicate payout');
 await home();await click('.hotspot[data-action="pc"]');await click('[data-action="pcMarket"]');for(const id of['ram','gpu','ssd'])await click(`[data-action="buyPcUpgrade"][data-id="${id}"]`);assert.deepEqual((await state()).pc,{owned:true,ram:1,gpu:1,ssd:1});assert.equal((await state()).money,450);await p.screenshot({path:'/tmp/sruk_update_hardware.png'});await close();await claim('ram');assert.equal((await state()).money,650);
 await click('#hud [data-action="phone"]');await click('.phone-nav [data-action="tab"][data-tab="home"]');await click('[data-action="playPhone"]');await click('#arcade-start');await p.waitForFunction(()=>__game.arcade?.running);
 const deadline=Date.now()+40000;
 while(Date.now()<deadline){const a=await p.evaluate(()=>__game.arcade);if(!a||a.score>=5)break;const hit=a.packets[0];if(hit){const box=await p.locator('.arcade-canvas').boundingBox();await p.mouse.click(box.x+hit.x/360*box.width,box.y+hit.y/460*box.height)}await p.waitForTimeout(180)}
 assert.ok((await p.evaluate(()=>__game.arcade?.score||__game.state.records.phone))>=5);await p.screenshot({path:'/tmp/sruk_update_phone_game.png'});if(await p.locator('#arcade-stop').count())await click('#arcade-stop');assert.ok((await state()).records.phone>=5);await claim('phone-game');
 await click('.hotspot[data-action="pc"]');await click('[data-action="playPc"]');await click('#arcade-start');await p.waitForFunction(()=>__game.arcade?.running);assert.equal((await state()).pc.ssd,1);
 const limit=Date.now()+150000;
 while(Date.now()<limit){const a=await p.evaluate(()=>__game.arcade);if(!a||a.score>=100)break;
  const costs=[0,0,0];for(const o of a.obstacles)if(o.y>120&&o.y<405)costs[o.lane]+=Math.pow((o.y-100)/300,3);
  const safest=costs.indexOf(Math.min(...costs));if(costs[a.lane]>.05&&safest!==a.lane)await p.keyboard.press(safest<a.lane?'ArrowLeft':'ArrowRight');await p.waitForTimeout(130);
 }
 const score=await p.evaluate(()=>__game.arcade?.score||__game.state.records.pc);assert.ok(score>=100,'PC game should reach the quest score using normal controls');await p.screenshot({path:'/tmp/sruk_update_pc_game.png'});if(await p.locator('#arcade-stop').count())await click('#arcade-stop');assert.ok((await state()).records.pc>=100);await claim('pc-game');
 assert.ok(await p.evaluate(()=>__game.audio.loaded&&__game.audio.events>10));await close();await click('#hud [data-action="pause"]');await click('[data-action="sound"]');assert.equal(await p.evaluate(()=>__game.audio.muted),true);await click('[data-action="sound"]');assert.equal(await p.evaluate(()=>__game.audio.muted),false);await close();
 const saved=await state();await p.reload();await p.waitForFunction(()=>window.__game?.ready,null,{timeout:90000});const restored=await state();assert.deepEqual(restored.pc,saved.pc);assert.deepEqual(restored.records,saved.records);assert.deepEqual(restored.contracts,saved.contracts);assert.equal(restored.money,saved.money);assert.equal(new Set(restored.claims).size,restored.claims.length);assert.deepEqual(errors,[]);
 console.log('PASS: RAM/GPU/SSD, phone game, PC game, quest rewards, real audio and mute, progress migration/save');await b.close();server.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();server.close();process.exitCode=1});
