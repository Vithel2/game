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
let browser,page;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});page=await browser.newPage({viewport:{width:1000,height:760}});const p=page,errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(90000);
 await p.addInitScript(()=>{if(!localStorage.getItem('s-ruk-game-v3'))localStorage.setItem('s-ruk-game-v3',JSON.stringify({version:5,started:true,profile:{created:true,name:'Возвращение',gender:'male',perk:'maker'},training:{complete:false,moved:true,phone:true,market:true,meeting:true}}))});
 async function click(s){await p.locator(s).first().click();await p.waitForTimeout(100)}async function ready(){await p.waitForFunction(()=>window.__game?.ready,null,{timeout:90000})}
 await p.goto(url);await ready();await click('[data-action="start"]');assert.equal(await p.locator('#title').evaluate(e=>e.classList.contains('hidden')),true);await p.waitForSelector('[data-action="phone"].guided-target');await click('#dock [data-action="phone"]');await click('.phone-nav [data-tab="avitu"]');await click('[data-action="meet"][data-id="1-a"]');await p.waitForFunction(()=>__game.state.meeting?.id==='1-a');await p.reload();await ready();await click('[data-action="start"]');assert.equal(await p.evaluate(()=>__game.meeting.present),true);await click('#dock [data-action="goStreet"]');await click('.hotspot[data-action="seller"]');await click('[data-action="inspect"]');await click('[data-action="buy"]');assert.equal(await p.evaluate(()=>__game.state.phones.length),1);assert.equal(await p.evaluate(()=>__game.state.meeting),null);await p.reload();await ready();assert.equal(await p.evaluate(()=>__game.meeting.present),false);assert.deepEqual(errors,[]);console.log('PASS: unfinished tutorial resumes, missing appointment can be rebooked, meeting survives reload, purchase clears meeting');await browser.close();server.close();
})().catch(async e=>{console.error(e);if(page)await page.screenshot({path:'/tmp/sruk4-resume-failure.png'}).catch(()=>{});if(browser)await browser.close();server.close();process.exitCode=1});
