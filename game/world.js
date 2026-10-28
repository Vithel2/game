import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import DATA from './asset-data.js';
import {repairStage} from './state.js';
import {installLocations} from './locations.js';
import {installNeighborhood,DOORS} from './neighborhood.js';
import {installRepair} from './repair-system.js';
import {character} from './characters.js';
import {batchStatic} from './batching.js';
import {installEnvironment} from './environment.js';
import {installCitizens} from './citizens.js';
import {installLifeMotion} from './life-motion.js';

export class World{
 constructor(canvas,onAction){
  this.canvas=canvas;this.onAction=onAction;this.mode='room';this.callbacks=[];this.ray=new T.Raycaster();this.pointer=new T.Vector2();this.avatarGoal=null;this.keys={};this.stage=null;
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
  this.scene=new T.Scene();this.scene.background=new T.Color('#c8d9d4');this.scene.fog=new T.Fog('#c8d9d4',28,65);this.homeScene=new T.Scene();this.homeScene.background=new T.Color('#d5dfd5');this.repairScene=new T.Scene();this.repairScene.background=new T.Color('#3a655e');
  this.camera=new T.OrthographicCamera(-5,5,5,-5,.05,100);this.camera.position.set(6,6,8);this.focus=new T.Vector3(0,.65,0);this.camera.lookAt(this.focus);this.targetFocus=this.focus.clone();this.view=7;this.targetView=7;
  this.light(this.scene);this.light(this.homeScene);this.light(this.repairScene);this.particles=[];this.gestures=[];this.assets={};this.hotspots=[];this.repairTargets=[];
  this.floor=this.box(46,.18,18,'#91a78a');this.floor.position.set(9,-.28,0);this.scene.add(this.floor);
  this.clock=new T.Clock();this.drag=null;this.down=null;
  canvas.addEventListener('pointerdown',e=>this.pointerDown(e));canvas.addEventListener('pointerup',e=>this.pointerUp(e));canvas.addEventListener('pointermove',e=>this.pointerMove(e));canvas.addEventListener('pointercancel',()=>{this.drag=null;this.down=null});
  window.addEventListener('resize',()=>this.resize());window.addEventListener('keydown',e=>{if(!/INPUT|TEXTAREA/.test(e.target.tagName))this.keys[e.code]=true});window.addEventListener('keyup',e=>this.keys[e.code]=false);window.addEventListener('blur',()=>this.keys={});
  this.resize();this.animate();
 }
 light(scene){scene.add(new T.HemisphereLight('#e7f4ff','#9a8061',2.6));const sun=new T.DirectionalLight('#fff1ce',3.2);sun.position.set(-4,10,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-16,right:16,top:12,bottom:-12,near:.5,far:35});sun.shadow.normalBias=.025;scene.add(sun);}
 box(x,y,z,color){return new T.Mesh(new T.BoxGeometry(x,y,z),new T.MeshStandardMaterial({color,roughness:.85}));}
 async init(progress){
  const loader=new GLTFLoader();let count=0;
  for(const [name,data]of Object.entries(DATA)){
   const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));const gltf=await new Promise((resolve,reject)=>loader.parse(bytes.buffer,'',resolve,reject));
   gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material=o.material.clone();if(o.material.metalness>.7)o.material.metalness=.5;}});this.assets[name]=gltf.scene;progress(++count/Object.keys(DATA).length);
  }
  this.homeScene.add(this.assets.room);this.assets.bench.position.set(.3,0,-1.23);this.homeScene.add(this.assets.bench);
  this.assets.phone.position.set(.1,.815,-1.20);this.homeScene.add(this.assets.phone);
  this.assets.grocery.position.set(6.1,0,-.6);this.assets.pickup.position.set(10.02,0,-.6);this.scene.add(this.assets.grocery,this.assets.pickup);
  for(const model of [this.assets.grocery,this.assets.pickup])model.traverse(o=>{if(o.name.includes('Roof'))o.visible=true;});
  const pavement=this.box(16,.10,2.7,'#c7c4b4');pavement.position.set(4.3,-.1,2.45);pavement.receiveShadow=true;this.scene.add(pavement);
  const road=this.box(29,.1,2.4,'#667778');road.position.set(3,-.15,4.8);road.receiveShadow=true;this.scene.add(road);
  for(let i=-5;i<17;i+=3){const mark=this.box(1.5,.004,.045,'#e6e0c5');mark.position.set(i,-.09,4.8);this.scene.add(mark)}
  this.avatar=this.person('#d78e4f');this.avatar.position.set(.7,.05,.7);this.scene.add(this.avatar);
  this.seller=this.person('#558d9c');this.seller.position.set(3.5,.04,2.1);this.seller.rotation.y=-.3;this.scene.add(this.seller);
  const stool=this.box(.35,.08,.35,'#c98170');stool.position.set(.35,.45,-.25);this.homeScene.add(stool);for(const dx of[-.13,.13])for(const dz of[-.13,.13]){const leg=this.box(.03,.42,.03,'#516367');leg.position.set(.35+dx,.23,-.25+dz);this.homeScene.add(leg)}
  this.plant(-1.75,1.30,this.homeScene);this.plant(2.15,-1.2);this.addStreetProps();
  this.buildRepair();installLocations(this);installNeighborhood(this);installEnvironment(this);installCitizens(this);installLifeMotion(this);for(const k of ['room','bench','phone','grocery','pickup'])batchStatic(this.assets[k]);installRepair(this);this.setZone('room',true);return this;
 }
 person(color){return character({color});}
 plant(x,z,target=this.scene){const pot=new T.Mesh(new T.CylinderGeometry(.15,.12,.25,10),new T.MeshStandardMaterial({color:'#b87c54'}));pot.position.set(x,.16,z);target.add(pot);for(let i=0;i<5;i++){const leaf=this.box(.10,.38,.055,'#4a8062');leaf.position.set(x+Math.sin(i*1.7)*.11,.44,z+Math.cos(i*1.7)*.11);leaf.rotation.z=Math.sin(i)*.5;target.add(leaf)}}
 addStreetProps(){for(const x of[3.1,12]){const pole=this.box(.055,2.65,.055,'#465a5c');pole.position.set(x,1.32,3.8);this.scene.add(pole);const lamp=this.box(.28,.12,.25,'#f8dda0');lamp.position.set(x,2.65,3.8);this.scene.add(lamp)}const bench=this.box(1.3,.10,.4,'#ad7f50');bench.position.set(2.7,.45,3.2);this.scene.add(bench);for(const x of[2.2,3.2]){const leg=this.box(.06,.45,.3,'#536563');leg.position.set(x,.2,3.2);this.scene.add(leg)}}
 buildRepair(){
  const table=this.box(8,.14,5.2,'#b78c5c');table.position.y=-.10;table.receiveShadow=true;this.repairScene.add(table);
  const mat=this.box(6.6,.035,4.5,'#397a6a');mat.position.y=0;mat.receiveShadow=true;this.repairScene.add(mat);
  const lines=[];for(let x=-3.25;x<=3.26;x+=.25)lines.push(x,.025,-2.20,x,.025,2.20);for(let z=-2.20;z<=2.21;z+=.25)lines.push(-3.25,.025,z,3.25,.025,z);const grid=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(lines,3)),new T.LineBasicMaterial({color:'#73a792',transparent:true,opacity:.5}));this.repairGrid=grid;this.repairScene.add(grid);
  this.phone=this.assets.repair;this.phone.scale.setScalar(17);this.phone.position.set(-.3,.06,.1);this.repairScene.add(this.phone);
  this.display=new T.Group();this.phone.add(this.display);this.battery=new T.Group();this.phone.add(this.battery);this.charge=new T.Group();this.phone.add(this.charge);
  const originals=[...this.phone.children];
  for(const o of originals){if(o===this.display||o===this.battery||o===this.charge)continue;
   if(/^(Display_|OLED_panel|Touch_flex|Flex_connector)/.test(o.name))this.display.attach(o);
   else if(/^(Battery|Text_Li|Text_3|Text_R)/.test(o.name))this.battery.attach(o);
   else if(/^(Charging_daughterboard|Internal_USB)/.test(o.name))this.charge.attach(o);
   if(/^Rear_cover|^Rear_camera/.test(o.name))o.visible=false;
  }
  this.display.traverse(o=>{if(o.name==='OLED_panel'){o.material=new T.MeshStandardMaterial({color:'#192d38',roughness:.25});this.oled=o}});
  this.screws=[];for(let i=0;i<8;i++){const root=this.phone.getObjectByName(`Phone_screw_${String(i+1).padStart(2,'0')}`);if(root)this.screws.push(root)}
  const tray=this.box(.86,.07,.95,'#9ebbae');tray.position.set(2.2,.06,-1.3);this.repairScene.add(tray);
  const bin=this.box(.96,.04,2.35,'#728d86');bin.position.set(2.2,.045,.85);this.repairScene.add(bin);const inside=this.box(.84,.01,2.20,'#3e5b57');inside.position.set(2.2,.07,.85);this.repairScene.add(inside);this.binPosition=new T.Vector3(2.2,.12,.85);
  for(const [name,x,z,scale]of[['driver',-2.9,-1.2,7],['spudger',-2.9,.2,7],['suction',2.8,-1.4,7]]){const g=this.assets[name];g.scale.setScalar(scale);g.position.set(x,.06,z);this.repairScene.add(g)}
 }
 setZone(zone,instant=false){
  this.mode=zone;this.avatarGoal=null;this.walkCallback=null;
  const configs={room:[[0,.75,0],6.6,[.45,.05,1.13]],street:[[5.1,1.05,.0],10.6,[.55,.05,2.45]],grocery:[[0,.9,0],5.7,[.1,.23,1.15]],pickup:[[0,.9,0],5.7,[.2,.23,1.15]]};
  const [focus,view,pos]=configs[zone]||configs.room;this.targetFocus.fromArray(focus);this.targetView=view;if(instant)this.focus.copy(this.targetFocus);
  if(this.avatar){this.scenes[zone].add(this.avatar);this.avatar.position.fromArray(pos)}this.repairTargets=[];this.resize();
 }
 async transitionTo(zone){
  if(this.transitioning)return;this.transitioning=true;this.avatarGoal=null;
  const names={room:'Дом · мастерская',street:'Центральный район',grocery:'Пятак · внутри магазина',pickup:'Azon · пункт выдачи',park:'Старый сквер'};
  this.onAction('door');if(this.homeDoor&&(zone==='room'||this.mode==='room'))this.homeDoor.userData.openUntil=performance.now()+700;
  const screen=document.getElementById('location-transition');screen.textContent=names[zone];screen.classList.add('show');
  await new Promise(r=>setTimeout(r,320));this.setZone(zone);await new Promise(r=>setTimeout(r,280));screen.classList.remove('show');this.transitioning=false;
 }
 bounds(){return this.mode==='room'?[-.45,1.5,-.55,1.4]:this.mode==='grocery'?[-.65,.85,-.75,1.35]:this.mode==='pickup'?[-.48,.65,-.75,1.35]:[-.35,11,1.35,3.5];}
 decorate(state){this.gameState=state;
  this.pcModel.visible=state.pc.owned;this.pcPlaceholder.visible=!state.pc.owned;
  if(this.avatar?.parcel)this.avatar.parcel.visible=!!state.carrying&&this.mode!=='repair';
  for(const fan of this.pcFans||[]){fan.visible=state.pc.owned;fan.children[0].material.color.set(['#83c9b1','#e6ba6e','#b1a2eb'][state.pc.gpu])}for(const [i,led]of(this.pcRamLights||[]).entries())led.visible=i<state.pc.ram;if(this.pcSsdIndicator)this.pcSsdIndicator.visible=state.pc.ssd>0;
  if(this.pcScreen){this.pcScreen.material.color.set(state.pc.gpu>0?'#c6ffea':'#ffffff');}
 }
 effect(kind='success'){
  const scene=this.scenes[this.mode],origin=this.mode==='repair'?new T.Vector3(-.3,.8,.1):this.avatar.position.clone().add(new T.Vector3(0,.9,0));
  for(let i=0;i<14;i++){const mesh=new T.Mesh(new T.SphereGeometry(.035,5,4),new T.MeshBasicMaterial({color:kind==='coin'?'#edc76b':i%2?'#a8dbb0':'#f8e4a1',transparent:true}));mesh.position.copy(origin);scene.add(mesh);this.particles.push({mesh,v:new T.Vector3((Math.random()-.5)*1.7,.8+Math.random(),(Math.random()-.5)*1.3),life:1.0});}
 }
 gesture(action,index){
  if(this.mode!=='repair')return;
  const key=action==='screw'?'driver':action==='connector'?'spudger':action==='open'?'suction':null;
  if(key){const obj=this.assets[key],from=obj.position.clone();const target=action==='screw'&&this.screws[index]?this.screws[index].getWorldPosition(new T.Vector3()):new T.Vector3(-.3,.8,0);this.gestures.push({obj,from,to:target.add(new T.Vector3(.15,.35,0)),time:0,duration:.7,rotation:obj.rotation.clone()});}
  if(action==='remove'){
   const source=this.repairPhone.defect==='battery'?this.battery:this.repairPhone.defect==='charge'?this.charge:this.display;const copy=source.clone(true);this.phone.add(copy);this.repairScene.attach(copy);copy.visible=true;this.gestures.push({obj:copy,from:copy.position.clone(),to:this.binPosition.clone(),time:0,duration:.85,discard:true});
  }
  if(action==='install'||action==='test')this.effect();
 }

 showRepair(phone){this.mode='repair';this.avatarGoal=null;this.targetFocus.set(-.1,.45,0);this.targetView=5.7;this.updateRepair(phone);this.resize();}
 updateRepair(p){
  this.stage=repairStage(p);this.repairPhone=p;const lifted=p.open&&!p.closed;const detached=(p.disconnected||0)===7;
  this.moveTo(this.display,new T.Vector3(detached&&!p.closed?-.108:0,lifted?-.008:-.048,0));
  this.display.visible=!(p.defect==='display'&&p.removed&&!p.installed);
  this.battery.visible=!(p.defect==='battery'&&p.removed&&!p.installed);this.charge.visible=!(p.defect==='charge'&&p.removed&&!p.installed);
  if(p.installed){const g=p.defect==='battery'?this.battery:p.defect==='charge'?this.charge:this.display;g.traverse(o=>{if(o.isMesh&&!o.name.startsWith('Text')&&o.name!=='OLED_panel'&&!o.userData.fresh){o.material=o.material.clone();o.material.color.lerp(new T.Color('#7dbca7'),.3);o.userData.fresh=true}})}
  if(this.oled)this.oled.material.color.set(p.fixed?'#73c3a6':'#192d38');
  this.screws.forEach((o,i)=>{const out=!!((p.out||0)&(1<<i)),back=!!((p.inside||0)&(1<<i));const dest=out&&!back?new T.Vector3(.135+(i%2)*.020,.01,-.04+Math.floor(i/2)*.028):new T.Vector3(i%2?.031:-.031,.032,-.063+Math.floor(i/2)*.042);this.moveTo(o,dest)});
  this.repairTargets=[];
  if(this.stage==='screws'||this.stage==='tighten')this.screws.forEach((o,i)=>{if(this.stage==='screws'?!(p.out&(1<<i)):!(p.inside&(1<<i)))this.repairTargets.push({id:'screw-'+i,label:String(i+1),object:o,action:'screw',index:i,small:true})});
  if(this.stage==='diagnose')this.repairTargets.push({id:'diagnose',label:'Проверить питание',position:new T.Vector3(-.2,.75,.1),action:'diagnose'});
  if(this.stage==='open'||this.stage==='close')this.repairTargets.push({id:'display',label:this.stage==='open'?'Поднять дисплей':'Закрыть дисплей',position:new T.Vector3(-.3,.8,.1),action:this.stage});
  if(this.stage==='disconnect'||this.stage==='connect')for(let i=0;i<3;i++)if(!((this.stage==='disconnect'?p.disconnected:p.connected)&(1<<i)))this.repairTargets.push({id:'connector-'+i,label:i===0?'Питание':'Шлейф '+i,position:new T.Vector3(-.75+i*.43,.57,-.50),action:'connector',index:i,small:false,connector:true});
  if(this.stage==='remove')this.repairTargets.push({id:'part',label:'Снять '+({battery:'аккумулятор',charge:'шлейф зарядки',display:'дисплей'}[p.defect]),position:new T.Vector3(-.3,.75,.5),action:'remove'});
  if(this.stage==='install')this.repairTargets.push({id:'install',label:'Установить деталь',position:new T.Vector3(-.3,.55,.4),action:'install'});
  if(this.stage==='test')this.repairTargets.push({id:'test',label:'Проверить телефон',position:new T.Vector3(-.3,.7,.1),action:'test'});
 }
 moveTo(o,v){if(!o.userData.init){o.position.copy(v);o.userData.init=true}else o.userData.target=v;}
 spinScrew(i){const o=this.screws[i];if(o)o.userData.spin=5*Math.PI;}
 walkTo(target,done){this.avatarGoal=new T.Vector3(...target);this.walkCallback=done;}
 position2d(v){const p=v.clone().project(this.camera);return{x:(p.x+1)/2*this.canvas.clientWidth,y:(1-p.y)/2*this.canvas.clientHeight,visible:p.z>-1&&p.z<1&&Math.abs(p.x)<1&&Math.abs(p.y)<1};}
 projectTargets(){
  const tables={room:[
   {id:'bench',label:'Рабочий стол',position:new T.Vector3(.3,1.60,-1.1),action:'bench'},
   {id:'bed',label:'Спать',position:new T.Vector3(-1.3,.85,-.1),action:'bed'},
   {id:'kitchen',label:'Вода и еда',position:new T.Vector3(1.5,1.40,-1.15),action:'kitchen'},
   {id:'pc',label:this.pcModel?.visible?'Мой компьютер':'Место для ПК',position:new T.Vector3(1.20,1.35,.65),action:'pc'},
  ],street:[
   {id:'home',label:'Дом · войти',position:new T.Vector3(.15,2.5,1.8),action:'goHome'},
   {id:'seller',label:'Продавец',position:new T.Vector3(3.5,1.5,2.1),action:'seller'},
   {id:'grocery',label:'Войти в Пятак',position:new T.Vector3(6.1,2.5,.8),action:'grocery'},
   {id:'pickup',label:'Войти в Azon',position:new T.Vector3(10.02,2.5,.8),action:'pickup'}
  ],grocery:[
   {id:'shopCounter',label:'Тамара · касса',position:new T.Vector3(-1.2,1.65,.5),action:'shopCounter'},
   {id:'products',label:'Продукты',position:new T.Vector3(1.3,1.35,.5),action:'shopCounter'},
  ],pickup:[
   {id:'pickupCounter',label:'Маша · выдача',position:new T.Vector3(-.9,1.7,.5),action:'pickupCounter'},
   {id:'techShelf',label:'Компьютеры',position:new T.Vector3(.9,1.5,-.8),action:'pcMarket'}
  ]};
  let list=this.mode==='repair'?this.repairTargets:this.mode==='grocery'?this.groceryTargets():tables[this.mode]||[];if(this.mode==='street'){list=list.filter(t=>t.id!=='seller'||this.meeting);for(const t of list){if(t.id==='seller')t.position.set(3.7,1.95,2.1);if(t.id==='grocery'){t.position.x=6.7;t.label='Зайти в Пятак'}if(t.id==='pickup'){t.position.x=12.1;t.label='Зайти в Azon'}}for(const f of this.friends)list.push({id:'friend-'+f.id,label:f.name,position:f.actor.position.clone().add(new T.Vector3(0,1.95,0)),action:'friend',friend:f.id});}if(this.trainingMove&&this.mode==='room')list.push({id:'trainingMove',label:'Иди сюда',position:new T.Vector3(0,.08,.5),action:'trainingMove'});
  list.push(...(this.extraTargets?.()||[]));return list.map(t=>{const v=t.object?t.object.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.045,0)):t.position;return {...t,...this.position2d(v)}});
 }

 resize(){const w=this.canvas.clientWidth||innerWidth,h=this.canvas.clientHeight||innerHeight;this.renderer.setSize(w,h,false);this.aspect=w/h;}
 pickGround(e){const rect=this.canvas.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const p=new T.Vector3();this.ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),p);return p;}
 pointerDown(e){this.down={x:e.clientX,y:e.clientY,time:performance.now()};if(false&&this.mode==='repair'&&this.stage==='remove'&&this.selectedTool==='hand'&&!this.blocked){this.drag={x:e.clientX,y:e.clientY};}}
 pointerMove(e){if(this.drag&&Math.hypot(e.clientX-this.drag.x,e.clientY-this.drag.y)>12){this.canvas.style.cursor='grabbing';document.getElementById('bin-hint').classList.add('show');}}
 pointerUp(e){if(this.blocked||this.transitioning||this.busy||this.repairBusy){this.down=null;this.drag=null;return}if(this.drag){if(Math.hypot(e.clientX-this.drag.x,e.clientY-this.drag.y)>45){this.onAction('remove');this.onAction('discard')}this.drag=null;this.canvas.style.cursor='';document.getElementById('bin-hint').classList.remove('show');return}if(!this.down)return;const moved=Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y);this.down=null;if(moved>8)return;if(this.mode==='repair'){this.repairPick?.(e);return}if(this.mode==='grocery'){this.pointer.set((e.clientX/this.canvas.clientWidth)*2-1,-(e.clientY/this.canvas.clientHeight)*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=this.ray.intersectObjects(this.productPicks,true)[0];if(hit){let o=hit.object;while(o&&!o.userData.food)o=o.parent;if(o){this.lastFoodPick=o;this.onAction('foodPick',o.userData.food);return}}}if(this.mode!=='repair'){const p=this.pickGround(e);const b=this.bounds();p.x=T.MathUtils.clamp(p.x,b[0],b[1]);p.z=T.MathUtils.clamp(p.z,b[2],b[3]);p.y=['grocery','pickup'].includes(this.mode)?.23:.05;this.walkTo(p.toArray())}}
 animate(){requestAnimationFrame(()=>this.animate());const dt=Math.min(this.clock.getDelta(),.25),t=this.clock.elapsedTime;
  this.focus.lerp(this.targetFocus,1-Math.exp(-dt*5));if(this.focus.distanceTo(this.targetFocus)<.002)this.focus.copy(this.targetFocus);this.view=T.MathUtils.lerp(this.view,this.targetView,1-Math.exp(-dt*5));if(Math.abs(this.view-this.targetView)<.002)this.view=this.targetView;const minwidth=this.mode==='street'?(this.aspect<.8?11:16.5):this.mode==='repair'?(this.aspect<.8?4.6:6.8):this.mode==='grocery'?8.6:this.mode==='pickup'?5.4:this.mode==='room'?(this.aspect<.8?6.3:9.0):this.mode==='park'?10:6.3;const vh=Math.max(this.view,minwidth/(this.aspect||1));this.camera.left=-vh*(this.aspect||1)/2;this.camera.right=-this.camera.left;this.camera.top=vh/2;this.camera.bottom=-vh/2;this.camera.updateProjectionMatrix();const offset=this.mode==='repair'?new T.Vector3(3,5.8,6.5):new T.Vector3(6,6.3,8);this.camera.position.copy(this.focus).add(offset);this.camera.lookAt(this.focus);
  if(this.updatePeople)this.updatePeople(dt,t);
  if(this.mode==='repair'&&this.phone){this.phone.traverse(o=>{if(o.userData.target)o.position.lerp(o.userData.target,1-Math.exp(-dt*8));if(o.userData.spin>0){const d=Math.min(o.userData.spin,dt*20);o.rotation.y+=d;o.userData.spin-=d}})}
  if(this.seated&&this.mode==='room'&&this.avatar){this.avatar.rotation.y=Math.PI;this.avatar.legs.forEach(l=>l.rotation.x=T.MathUtils.lerp(l.rotation.x,-1,dt*7));this.avatar.arms.forEach((a,i)=>a.rotation.x=-.65+Math.sin(t*7+i)*.035)}for(const fan of this.pcFans||[])fan.rotation.z+=dt*5;this.updateLife?.(dt,t);this.updatePrecise?.(dt,t);
  if(this.car){this.car.position.set(((t*.75)%32)-10,0,4.9);}
  for(const [i,crown]of(this.sway||[]).entries())crown.rotation.z=Math.sin(t*.9+i)*.035;
  if(this.homeDoor)this.homeDoor.rotation.y=T.MathUtils.lerp(this.homeDoor.rotation.y,performance.now()<(this.homeDoor.userData.openUntil||0)?-1.1:0,dt*6);
  for(const p of this.particles){p.life-=dt;p.mesh.position.addScaledVector(p.v,dt);p.v.y-=dt*1.7;p.mesh.material.opacity=Math.max(0,p.life);if(p.life<=0){p.mesh.removeFromParent();p.mesh.geometry.dispose();p.mesh.material.dispose()}}this.particles=this.particles.filter(p=>p.life>0);
  for(const g of this.gestures){g.time+=dt;const u=Math.min(1,g.time/g.duration);if(g.discard){g.obj.position.lerpVectors(g.from,g.to,u);g.obj.position.y+=Math.sin(u*Math.PI)*.5;g.obj.rotation.z=u*1.3;if(u===1)g.obj.removeFromParent()}else{const v=Math.sin(u*Math.PI);g.obj.position.lerpVectors(g.from,g.to,v);g.obj.rotation.z=g.rotation.z+v*.6;if(u===1)g.obj.rotation.copy(g.rotation)}}this.gestures=this.gestures.filter(g=>g.time<g.duration);
  this.updateClimate?.(dt);this.onSimulate?.(dt);if(true){this.renderer.render(this.scenes?.[this.mode]||this.scene,this.camera);this.lastDraw=t}this.onFrame?.();
 }
}
