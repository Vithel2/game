import {training} from './life.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class MobileUI {
 constructor(root,context){
  this.root=root;this.context=context;this.rotation=document.createElement('div');this.rotation.id='rotate-device';this.rotation.hidden=true;this.rotation.setAttribute('role','alert');this.rotation.innerHTML='<p>Поверните телефон вертикально</p><small>Игра приостановлена. Прогресс сохранён.</small>';root.append(this.rotation);this.query=matchMedia('(max-width:700px), (pointer:coarse) and (max-height:600px)');
  this.toast=document.getElementById('toast');this.life=document.getElementById('life-caption');this.sizes=new WeakMap();this.positions=new Map();
  this.worldView=document.createElement('div');this.worldView.id='world-view';
  for(const id of ['scene','vignette','hotspots','action-shield']){const el=id==='vignette'?root.querySelector('.vignette'):document.getElementById(id);if(el)this.worldView.append(el);}
  root.prepend(this.worldView);
  this.links=document.createElementNS('http://www.w3.org/2000/svg','svg');this.links.id='hotspot-links';this.worldView.prepend(this.links);
  this.header=document.createElement('header');this.header.id='touch-header';this.hints=document.createElement('div');this.hints.id='touch-hints';
  this.notices=document.createElement('div');this.notices.id='touch-notices';this.header.append(this.hints);root.append(this.header,this.notices);
  this.primary=document.createElement('div');this.primary.id='touch-repair-action';
  this.resize=()=>{const vv=window.visualViewport;root.style.setProperty('--app-height',((!vv||vv.scale>1.05)?innerHeight:vv.height)+'px');this.sizes=new WeakMap();this.positions.clear();this.update();this.checkOrientation();this.context().world?.resize();};
  this.query.addEventListener('change',this.resize);window.addEventListener('resize',this.resize);window.visualViewport?.addEventListener('resize',this.resize);
  new ResizeObserver(()=>{this.sizes=new WeakMap();this.positions.clear();this.context().world?.resize();}).observe(this.worldView);
  document.fonts.ready.then(()=>{this.sizes=new WeakMap();});
  this.resize();
 }
 checkOrientation(){
  const editing=/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)||document.activeElement?.isContentEditable;
  const paused=this.active&&matchMedia('(pointer:coarse)').matches&&innerWidth>innerHeight&&!editing;
  this.rotation.hidden=!paused;const w=this.context().world;if(w){w.orientationPaused=paused;if(paused)w.keys={};}
 }
 get active(){return this.query.matches;}
 update(){
  const {world:w,state:s,title,modal}=this.context(),mobile=this.active;this.root.classList.toggle('mobile-ui',mobile);this.root.classList.toggle('has-modal',!!modal);this.root.classList.toggle('is-repair',w?.mode==='repair');this.root.classList.toggle('on-title',!!title);if(w)w.mobileInterface=mobile;
  if(!mobile){this.header.inert=false;document.getElementById('dock').inert=false;for(const id of ['hud','needs','objective','guided-training','repair-guide','parcel-task']){const el=document.getElementById(id);if(el&&el.parentElement!==this.root)this.root.append(el);}this.root.append(this.toast,this.life);this.primary.remove();this.links.innerHTML='';this.linkMarkup='';return;}
  for(const id of ['hud','needs']){const el=document.getElementById(id);if(el&&el.parentElement!==this.header)this.header.prepend(el);}
  for(const id of ['objective','guided-training','repair-guide','parcel-task']){const el=document.getElementById(id);if(el&&el.parentElement!==this.hints)this.hints.append(el);}
  const panel=document.querySelector('#modal-root .modal');
  this.header.inert=!!modal;document.getElementById('dock').inert=!!modal;
  if(panel){
   // Guidance and messages participate in the dialog's scroll/flex layout.
   // Keep the real toast node alive when renderModal replaces its old parent.
   const tutorial=training(s);
   if(tutorial&&!panel.querySelector('.modal-training')){const help=document.createElement('details');help.className='modal-training';help.dataset.key='mobile-training';help.innerHTML=`<summary>Обучение · ${escape(tutorial.title)}</summary><p>${escape(tutorial.text)}</p>`;const body=panel.querySelector('.app-body,.phone-wallpaper');if(body)body.prepend(help);else panel.insertBefore(help,panel.querySelector('.modal-close')?.nextSibling||panel.firstChild);}
   let slot=panel.querySelector('.modal-notice');if(!slot){slot=document.createElement('div');slot.className='modal-notice';const nav=panel.querySelector('.phone-nav');nav?panel.insertBefore(slot,nav):panel.append(slot);}if(this.toast.parentElement!==slot)slot.append(this.toast);
  }else if(this.toast.parentElement!==this.notices)this.notices.append(this.toast);
  if(this.life.parentElement!==this.notices)this.notices.append(this.life);
  this.notices.classList.toggle('has-toast',this.toast.classList.contains('show'));
  if(w?.mode==='repair')this.repairAction();else this.primary.remove();
 }
 repairAction(){
  const {world:w}=this.context(),dock=document.getElementById('dock');if(!w||!dock)return;
  if(this.primary.parentElement!==dock)dock.prepend(this.primary);
  const target=w.repairTargets.find(t=>t.action!=='toolFromTable');
  const labels={diagnose:'Проверить телефон',open:'Поднять дисплей',remove:'Снять неисправную деталь',install:'Установить новую деталь',close:'Закрыть корпус',test:'Проверить результат',heat:'Прогреть клей',clean:'Очистить контакты',solder:'Восстановить пайку',seal:'Нанести уплотнитель',calibrate:'Калибровать'};
  let label=target?(labels[target.action]||target.label):'Ремонт завершён';
  if(target?.action==='screw')label=(w.stage==='tighten'?'Закрутить':'Выкрутить')+' винт '+(target.index+1);
  if(target?.action==='connector')label=(w.stage==='connect'?'Подключить':'Отключить')+' · '+target.label;
  if(w.stage==='install'&&!(w.inventory?.[w.repairPhone?.defect]>0))label='Заказать недостающую деталь';
  const key=target?.action+':'+target?.index+':'+label;
  if(this.primary.dataset.key!==key){this.primary.dataset.key=key;this.primary.innerHTML=`<button class="btn wide mint mobile-repair-action" data-action="${target?.action||'leaveRepair'}" data-index="${target?.index??0}"><span>${escape(label)}</span></button>`;}
  const busy=!!(w.busy||w.repairBusy||w.shoppingBusy),button=this.primary.firstElementChild;button.disabled=busy;button.setAttribute('aria-busy',String(busy));const text=busy?'Выполняем…':label,span=button.querySelector('span');if(span.textContent!==text)span.textContent=text;
  for(const el of dock.querySelectorAll('.tool')){el.classList.toggle('required',el.dataset.tool===w.requiredTool);el.disabled=busy;}
 }
 filterTargets(targets){
  if(!this.active)return targets;const w=this.context().world;
  if(w.mode==='repair')return targets.filter(t=>t.small||t.connector);
  const near=(t,d)=>!t.position||Math.hypot(t.position.x-w.avatar.position.x,t.position.z-w.avatar.position.z)<d;
  if(w.mode==='room')return targets.filter(t=>t.id!=='bench'&&(!['myHouse','story-board','sofa'].includes(t.id)||near(t,1.75)));
  if(w.mode==='street')return targets.filter(t=>t.action!=='friend'||near(t,1.8)).sort((a,b)=>Number(b.action!=='friend')-Number(a.action!=='friend')).slice(0,6);
  return targets;
 }
 placeTargets(targets,container){
  if(!this.active){if(this.linkMarkup){this.links.innerHTML='';this.linkMarkup='';}return false;}
  const mode=this.context().world.mode;if(this.lastMode!==mode){this.positions.clear();this.lastMode=mode;}const now=performance.now(),blend=1-Math.exp(-Math.min(.05,(now-(this.lastPlacement||now))/1000)*10);this.lastPlacement=now;
  const ids=new Set(targets.map(t=>t.id));for(const id of this.positions.keys())if(!ids.has(id))this.positions.delete(id);
  const width=this.worldView.clientWidth,height=this.worldView.clientHeight,placed=[],lines=[];this.links.setAttribute('viewBox',`0 0 ${width} ${height}`);
  for(let i=0;i<targets.length;i++){
   const t=targets[i],el=container.children[i];if(!el)continue;
   el.style.visibility=t.visible?'visible':'hidden';if(!t.visible){this.positions.delete(t.id);continue;}
   let size=this.sizes.get(el);if(!size){size={w:el.offsetWidth,h:el.offsetHeight};this.sizes.set(el,size);}
   const previous=this.positions.get(t.id),halfW=size.w/2,halfH=size.h/2,margin=5,candidates=[];
   if(previous)candidates.push({x:clamp(t.x+previous.dx,halfW+margin,width-halfW-margin),y:clamp(t.y+previous.dy,halfH+margin,height-halfH-margin)});
   for(const dy of [0,-48,48,-96,96,-144,144])for(const dx of [0,-65,65,-130,130])candidates.push({x:clamp(t.x+dx,halfW+margin,width-halfW-margin),y:clamp(t.y+dy,halfH+margin,height-halfH-margin)});
   // The fallback lattice also handles tightly packed shelves on small screens.
   const xs=[halfW+margin,width-halfW-margin],ys=[halfH+margin,height-halfH-margin];
   for(let x=halfW+margin;x<width-halfW-margin;x+=Math.max(24,size.w/2+4))xs.push(x);
   for(let y=halfH+margin;y<height-halfH-margin;y+=Math.max(24,size.h/2+4))ys.push(y);
   for(const y of ys)for(const x of xs)candidates.push({x,y});
   let best=candidates[0],score=Infinity;
   for(const c of candidates){let overlap=0;for(const r of placed){const dx=Math.min(c.x+halfW,r.x+r.w/2)-Math.max(c.x-halfW,r.x-r.w/2),dy=Math.min(c.y+halfH,r.y+r.h/2)-Math.max(c.y-halfH,r.y-r.h/2);if(dx>-4&&dy>-4)overlap+=(Math.max(0,dx)+4)*(Math.max(0,dy)+4);}const cost=overlap*10000+(c.x-t.x)**2+(c.y-t.y)**2+(previous?((c.x-previous.x)**2+(c.y-previous.y)**2)*5:0);if(cost<score){score=cost;best=c;}}
   if(previous){const desired={...best};best={x:previous.x+(best.x-previous.x)*blend,y:previous.y+(best.y-previous.y)*blend};this.positions.set(t.id,{...best,dx:desired.x-t.x,dy:desired.y-t.y});}else this.positions.set(t.id,{...best,dx:best.x-t.x,dy:best.y-t.y});
   placed.push({...best,...size});el.style.transform=`translate(-50%,-50%) translate(${Math.round(best.x)}px,${Math.round(best.y)}px)`;
   if(Math.hypot(best.x-t.x,best.y-t.y)>20)lines.push(`<path d="M${t.x.toFixed(1)},${t.y.toFixed(1)}L${best.x.toFixed(1)},${best.y.toFixed(1)}"/><circle cx="${t.x.toFixed(1)}" cy="${t.y.toFixed(1)}" r="3"/>`);
  }
  const markup=lines.join('');if(this.linkMarkup!==markup){this.links.innerHTML=markup;this.linkMarkup=markup;}return true;
 }
 frame(){this.checkOrientation();if(this.active){this.notices.classList.toggle('has-toast',this.toast.classList.contains('show'));if(this.context().world?.mode==='repair')this.repairAction();}}
}
