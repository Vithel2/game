// A saved offline audience simulation. Rewards are credited only as views arrive.
export function audiencePlan(views,subs){return {elapsed:0,duration:300+Math.min(360,views*.12),targetViews:views,targetSubs:subs};}
export function advanceAudience(s,seconds){
 if(!(seconds>0))return false;let changed=false;
 for(const p of s.vlog.posts){const a=p.audience;if(!a||a.elapsed>=a.duration)continue;a.elapsed=Math.min(a.duration,a.elapsed+seconds);
  // The upload gets discovered slowly, then recommendations bring a larger wave.
  const x=a.elapsed/a.duration,ratio=x*x*(3-2*x),views=Math.floor(a.targetViews*ratio),delta=views-p.views;
  p.watching=x>=1?0:Math.max(0,Math.round(Math.sin(x*Math.PI)*(3+a.targetViews/85)));
  if(delta<=0)continue;changed=true;p.views=views;s.vlog.views+=delta;
  const subs=Math.floor(a.targetSubs*ratio);s.vlog.subs+=subs-p.subs;p.subs=subs;
  p.likes=Math.floor(views*(.045+Math.min(1.5,p.quality||1)*.018));
  const wanted=Math.min(4,Math.floor(views/Math.max(35,a.targetViews/4)));p.comments||=[];
  const lines=['Попалось в рекомендациях. Удачи с мастерской!','Люблю, когда показывают ремонт по шагам.','Подписался, жду следующую находку.','Вот это результат! Сколько стоили детали?'];
  while(p.comments.length<wanted)p.comments.push({name:['Саша','Мила','Денис','Роман'][p.comments.length],text:lines[p.comments.length],at:Math.round(a.elapsed)});
  if(s.vlog.monetized){p.paidViews=(p.paidViews||0)+delta;const earned=Math.floor(p.paidViews*.025),gain=earned-(p.earnings||0);p.earnings=earned;s.vlog.earned+=gain;s.money+=gain;}
 }
 return changed;
}
