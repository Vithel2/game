import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
export async function harness(viewport={width:1280,height:900}){
 const root=resolve('.'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf'};
 const server=createServer(async(req,res)=>{try{let path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(path!==root&&!path.startsWith(root+'/'))throw Error('invalid path');if(path===root)path=resolve(root,'index.html');res.setHeader('Content-Type',types[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404);res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport});page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message)});
 return {browser,page,errors,url:'http://127.0.0.1:'+server.address().port+'/',close:async()=>{await browser.close();await new Promise(r=>server.close(r))}};
}
export async function seed(page,state){await page.addInitScript(s=>{if(!localStorage.getItem('s-ruk-game-v3'))localStorage.setItem('s-ruk-game-v3',JSON.stringify({version:6,started:true,profile:{created:true,name:'Vithel',gender:'male',perk:'maker'},training:{complete:true},...s}));},state);}
export const ready=page=>page.waitForFunction(()=>window.__game?.ready,null,{timeout:90000});
export const idle=page=>page.waitForFunction(()=>!__game.busy&&!__game.moving&&!__game.navigation.transitioning);
export async function click(page,selector){await page.locator(selector).first().click();await page.waitForTimeout(80);}
