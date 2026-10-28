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
(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});browser=b;const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});p.setDefaultTimeout(45000);const errors=[];p.on('pageerror',e=>errors.push(e.message));async function tap(s){await p.locator(s).first().tap();await p.waitForTimeout(140)}
await p.goto(url);await p.waitForFunction(()=>window.__game?.ready,null,{timeout:60000});await p.screenshot({path:'/tmp/sruk_mobile_title.png'});await tap('[data-action="start"]');await p.waitForTimeout(500);await p.screenshot({path:'/tmp/sruk_mobile_room.png'});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await tap('#dock [data-action="phone"]');await tap('[data-action="tab"][data-tab="avitu"]');await tap('[data-action="meet"][data-id="1-a"]');await tap('.hotspot[data-action="seller"]');await tap('[data-action="inspect"]');await tap('[data-action="buy"]');await tap('[data-action="goHome"]');await tap('#dock [data-action="bench"]');await tap('[data-action="repairPhone"]');await tap('.hotspot[data-action="diagnose"]');await tap('[data-action="tool"][data-tool="driver"]');for(let i=0;i<8;i++)await tap('.hotspot[data-action="screw"]');await tap('[data-action="tool"][data-tool="suction"]');await tap('.hotspot[data-action="open"]');await tap('[data-action="tool"][data-tool="spudger"]');for(let i=0;i<3;i++)await tap('.hotspot[data-action="connector"]');
assert.equal(await p.evaluate(()=>__game.stage),'remove');await p.screenshot({path:'/tmp/sruk_mobile_repair.png'});await tap('[data-action="tool"][data-tool="hand"]');await tap('.hotspot[data-action="remove"]');await tap('.hotspot[data-action="install"]');await p.screenshot({path:'/tmp/sruk_mobile_azon.png'});await tap('[data-action="order"][data-id="battery"]');assert.equal(await p.evaluate(()=>__game.state.orders.length),1);assert.deepEqual(errors,[]);console.log('PASS: touch purchase, inspection, 8 screws, 3 connectors, tool selection, repair, Azon order, 390px layout');await b.close();server.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();server.close();process.exitCode=1});
