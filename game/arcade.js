import {audio} from './audio.js';

// Two original embedded games, with one shared lifecycle and touch/keyboard controls.
export function startArcade(host,{device,hardware,onFinish}){
 const pc=device==='pc';let running=false,finished=false,score=0,elapsed=0,spawn=0,packet=0,lane=1,x=1,lives=1+(hardware?.ram||0),items=[],last=0,raf=0;
 const seconds=pc?60+(hardware?.ram||0)*10:30,mult=pc?1+(hardware?.gpu||0)*.25:1;
 host.innerHTML=`<div class="arcade-launch"><span class="eyebrow">${pc?'ПРИЛОЖЕНИЕ НА ПК':'ИГРА НА ТЕЛЕФОНЕ'}</span><h2>${pc?'Ночной курьер':'Лови сигнал'}</h2><p>${pc?'Меняй полосу, собирай посылки и объезжай заграждения. Стрелки, A/D или кнопки снизу.':'Лови зелёные пакеты касанием. Красные помехи отнимают очки. На ПК можно нажимать пробел.'}</p><button class="btn mint wide" id="arcade-start">Начать игру</button><small>${pc?`Время: ${seconds} с · Защита: ${lives} · Очки: ×${mult}`:'30 секунд · один палец'}</small></div>`;
 let canvas,ctx,w=360,h=460;
 const getScore=()=>pc?Math.floor(score*mult):score;
 function finish(){if(finished)return;finished=true;running=false;cancelAnimationFrame(raf);removeListeners();onFinish(getScore());}
 function move(dir){lane=Math.max(0,Math.min(2,lane+dir));}
 function key(e){if(!running)return;if(['ArrowLeft','ArrowRight','Space','KeyA','KeyD'].includes(e.code))e.preventDefault();if(pc){if(e.code==='ArrowLeft'||e.code==='KeyA')move(-1);if(e.code==='ArrowRight'||e.code==='KeyD')move(1)}else if(e.code==='Space'){const it=items.find(i=>i.good);if(it)catchPacket(it)}}
 function catchPacket(it){if(!items.includes(it))return;score=Math.max(0,score+(it.good?1:-2));items.splice(items.indexOf(it),1);audio.play(it.good?'game':'error');}
 function pointer(e){if(!running)return;const r=canvas.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*w,py=(e.clientY-r.top)/r.height*h;if(pc)move(px<w/2?-1:1);else{const it=[...items].reverse().find(i=>Math.hypot(i.x-px,i.y-py)<i.r+9);if(it)catchPacket(it)}}
 function removeListeners(){window.removeEventListener('keydown',key);canvas?.removeEventListener('pointerdown',pointer)}
 function rounded(x,y,w,h,r,color){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill()}
 function text(s,x,y,size=18,color='#fff',align='left'){ctx.fillStyle=color;ctx.font=`800 ${size}px Nunito, sans-serif`;ctx.textAlign=align;ctx.fillText(s,x,y)}
 function draw(dt){
  elapsed+=dt;spawn+=dt;packet+=dt;if(elapsed>=seconds){finish();return}
  ctx.clearRect(0,0,w,h);
  if(pc){
   const gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#172e46');gradient.addColorStop(1,'#243c54');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
   ctx.fillStyle='#40576c';ctx.fillRect(35,0,w-70,h);ctx.fillStyle='#ffd87c';for(let c=1;c<=2;c++)for(let y=-40;y<h;y+=75)ctx.fillRect(35+(w-70)/3*c-1,(y+elapsed*145)% (h+75)-30,2,35);
   if(spawn>.90-Math.min(.35,elapsed*.004)){spawn=0;items.push({type:'block',lane:Math.floor(Math.random()*3),y:-30})}
   if(packet>1.15){packet=0;items.push({type:'parcel',lane:Math.floor(Math.random()*3),y:-55})}
   x+=(lane-x)*Math.min(1,dt*15);const ly=h-75,speed=125+elapsed*2.4;
   for(const it of items){it.y+=dt*speed;const ix=35+(it.lane+.5)*(w-70)/3;
    if(it.type==='parcel'){rounded(ix-13,it.y-13,26,26,5,'#d3a168');ctx.fillStyle='#fff0c7';ctx.fillRect(ix-3,it.y-13,6,26)}else{rounded(ix-25,it.y-11,50,23,5,'#db806b');ctx.fillStyle='#ffe9bf';ctx.fillRect(ix-22,it.y-3,44,5)}
    if(!it.hit&&Math.abs(it.y-ly)<23&&Math.abs(it.lane-x)<.38){it.hit=true;if(it.type==='parcel'){score+=25;audio.play('game')}else{lives--;audio.play('error');if(lives<=0){finish();return}}}
   }
   items=items.filter(i=>i.y<h+50&&!i.hit);score+=dt*4;
   const px=35+(x+.5)*(w-70)/3;rounded(px-19,ly-27,38,54,12,'#93d7bc');rounded(px-13,ly-18,26,15,5,'#284b63');ctx.fillStyle='#ffe5a4';ctx.fillRect(px-15,ly-26,8,4);ctx.fillRect(px+7,ly-26,8,4);
   rounded(0,0,w,39,0,'#172e46');text('Ночной курьер',17,28,17,'#ffe5b5');text(`♥ ${lives}`,w-15,28,16,'#f3b6b2','right');
  }else{
   const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#163e47');g.addColorStop(1,'#31675e');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
   ctx.strokeStyle='#ffffff09';for(let y=0;y<h;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}for(let x=0;x<w;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
   if(spawn>.55){spawn=0;const good=Math.random()>.22;items.push({x:35+Math.random()*(w-70),y:95+Math.random()*(h-150),r:good?25:22,life:1.9,good,phase:Math.random()*6})}
   for(const it of items){it.life-=dt;it.x+=Math.sin(elapsed*2+it.phase)*dt*9;ctx.globalAlpha=Math.min(1,it.life*2);ctx.beginPath();ctx.arc(it.x,it.y,it.r,0,Math.PI*2);ctx.fillStyle=it.good?'#a6e2b9':'#ed9a8d';ctx.fill();ctx.strokeStyle=it.good?'#e3f7d7':'#ffdad0';ctx.lineWidth=3;ctx.stroke();text(it.good?'+':'×',it.x,it.y+7,25,'#24554c','center');ctx.globalAlpha=1}
   items=items.filter(it=>it.life>0);text('Лови сигнал',17,30,18,'#d9f2cb');
  }
  rounded(12,43,w-24,31,10,'#102f3dcc');text(`Очки: ${getScore()}`,24,65,16,'#fff0cb');text(`${Math.max(0,Math.ceil(seconds-elapsed))} с`,w-25,65,15,'#bde0db','right');
 }
 function frame(t){if(!running)return;const dt=Math.min(.06,(t-last)/1000||.016);last=t;draw(dt);if(running)raf=requestAnimationFrame(frame)}
 host.querySelector('#arcade-start').addEventListener('click',()=>{
  host.innerHTML=`<div class="arcade-loading">${pc?'Запускаем с '+(hardware.ssd?'SSD…':'жёсткого диска…'):'Подключаемся к сигналу…'}</div>`;
  const delay=pc?2200/(1+(hardware.ssd||0)*2):350;
  setTimeout(()=>{if(finished)return;host.innerHTML=`<canvas class="arcade-canvas" aria-label="${pc?'Ночной курьер':'Лови сигнал'}"></canvas><div class="arcade-buttons">${pc?'<button class="btn" id="arcade-left" aria-label="Левая полоса">←</button>':''}<button class="btn subtle" id="arcade-stop">Завершить</button>${pc?'<button class="btn" id="arcade-right" aria-label="Правая полоса">→</button>':''}</div>`;canvas=host.querySelector('canvas');canvas.width=w;canvas.height=h;ctx=canvas.getContext('2d');canvas.addEventListener('pointerdown',pointer);window.addEventListener('keydown',key,{passive:false});host.querySelector('#arcade-stop').addEventListener('click',finish);host.querySelector('#arcade-left')?.addEventListener('click',()=>move(-1));host.querySelector('#arcade-right')?.addEventListener('click',()=>move(1));running=true;last=performance.now();raf=requestAnimationFrame(frame)},delay);
 });
 return {stop(){finished=true;running=false;cancelAnimationFrame(raf);removeListeners()},get score(){return getScore()},get running(){return running},get lane(){return lane},get elapsed(){return elapsed},get obstacles(){return pc?items.filter(i=>i.type==='block').map(i=>({lane:i.lane,y:i.y})):[]},get packets(){return items.filter(i=>i.good).map(i=>({x:i.x,y:i.y,r:i.r}))}};
}
