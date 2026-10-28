import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import DATA from './asset-data.js';
import {repairStage} from './state.js';

export class World{
 constructor(canvas,onAction){
  this.canvas=canvas;this.onAction=onAction;this.mode='room';this.callbacks=[];this.ray=new T.Raycaster();this.pointer=new T.Vector2();this.avatarGoal=null;this.keys={};this.stage=null;
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
  this.scene=new T.Scene();this.scene.background=new T.Color('#c8d9d4');this.scene.fog=new T.Fog('#c8d9d4',28,65);this.repairScene=new T.Scene();this.repairScene.background=new T.Color('#3a655e');
  this.camera=new T.OrthographicCamera(-5,5,5,-5,.05,100);this.camera.position.set(6,6,8);this.focus=new T.Vector3(0,.65,0);this.camera.lookAt(this.focus);this.targetFocus=this.focus.clone();this.view=7;this.targetView=7;
  this.light(this.scene);this.light(this.repairScene);this.assets={};this.hotspots=[];this.repairTargets=[];
  this.floor=this.box(34,.18,18,'#91a78a');this.floor.position.set(3,-.28,0);this.scene.add(this.floor);
  this.clock=new T.Clock();this.drag=null;this.down=null;
  canvas.addEventListener('pointerdown',e=>this.pointerDown(e));canvas.addEventListener('pointerup',e=>this.pointerUp(e));canvas.addEventListener('pointermove',e=>this.pointerMove(e));canvas.addEventListener('pointercancel',()=>{this.drag=null;this.down=null});
  window.addEventListener('resize',()=>this.resize());window.addEventListener('keydown',e=>{if(!/INPUT|TEXTAREA/.test(e.target.tagName))this.keys[e.code]=true});window.addEventListener('keyup',e=>this.keys[e.code]=false);window.addEventListener('blur',()=>this.keys={});
  this.resize();this.animate();
 }
 light(scene){scene.add(new T.HemisphereLight('#e7f4ff','#9a8061',2.6));const sun=new T.DirectionalLight('#fff1ce',3.2);sun.position.set(-4,10,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-16,right:16,top:12,bottom:-12,near:.5,far:35});sun.shadow.normalBias=.025;scene.add(sun);}
 box(x,y,z,color){return new T.Mesh(new T.BoxGeometry(x,y,z),new T.MeshStandardMaterial({color,roughness:.85}));}
 async init(progress){
  const loader=new GLTFLoader();let count=0;
  for(const [name,data]of Object.entries(DATA)){
   const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));const gltf=await new Promise((resolve,reject)=>loader.parse(bytes.buffer,'',resolve,reject));
   gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material=o.material.clone();if(o.material.metalness>.7)o.material.metalness=.5;}});this.assets[name]=gltf.scene;progress(++count/Object.keys(DATA).length);
  }
  this.scene.add(this.assets.room);this.assets.bench.position.set(.3,0,-1.23);this.scene.add(this.assets.bench);
  this.assets.phone.position.set(.1,.815,-1.20);this.scene.add(this.assets.phone);
  this.assets.grocery.position.set(6.1,0,-.6);this.assets.pickup.position.set(10.02,0,-.6);this.scene.add(this.assets.grocery,this.assets.pickup);
  for(const model of [this.assets.grocery,this.assets.pickup])model.traverse(o=>{if(o.name.includes('Roof'))o.visible=false;});
  const pavement=this.box(16,.10,2.7,'#c7c4b4');pavement.position.set(4.3,-.1,2.45);pavement.receiveShadow=true;this.scene.add(pavement);
  const road=this.box(29,.1,2.4,'#667778');road.position.set(3,-.15,4.8);road.receiveShadow=true;this.scene.add(road);
  for(let i=-5;i<17;i+=3){const mark=this.box(1.5,.004,.045,'#e6e0c5');mark.position.set(i,-.09,4.8);this.scene.add(mark)}
  this.avatar=this.person('#d78e4f');this.avatar.position.set(.7,.05,.7);this.scene.add(this.avatar);
  this.seller=this.person('#558d9c');this.seller.position.set(3.5,.04,2.1);this.seller.rotation.y=-.3;this.scene.add(this.seller);
  const stool=this.box(.35,.08,.35,'#c98170');stool.position.set(.35,.45,-.25);this.scene.add(stool);for(const dx of[-.13,.13])for(const dz of[-.13,.13]){const leg=this.box(.03,.42,.03,'#516367');leg.position.set(.35+dx,.23,-.25+dz);this.scene.add(leg)}
  this.plant(-1.75,1.30);this.plant(2.15,-1.2);this.addStreetProps();
  this.buildRepair();this.setZone('room',true);return this;
 }
 person(color){const g=new T.Group();const skin=new T.MeshStandardMaterial({color:'#d8af8a',roughness:1});const body=this.box(.30,.36,.21,color);body.position.y=.61;g.add(body);const head=new T.Mesh(new T.SphereGeometry(.14,10,8),skin);head.position.y=.95;g.add(head);const hair=this.box(.25,.095,.22,'#4d4139');hair.position.set(0,1.047,-.015);g.add(hair);g.legs=[];for(const x of[-.085,.085]){const leg=this.box(.105,.35,.12,'#344e62');leg.position.set(x,.25,0);g.add(leg);g.legs.push(leg);const arm=this.box(.075,.31,.09,color);arm.position.set(x*2.3,.59,0);g.add(arm)}g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g;}
 plant(x,z){const pot=new T.Mesh(new T.CylinderGeometry(.15,.12,.25,10),new T.MeshStandardMaterial({color:'#b87c54'}));pot.position.set(x,.16,z);this.scene.add(pot);for(let i=0;i<5;i++){const leaf=this.box(.10,.38,.055,'#4a8062');leaf.position.set(x+Math.sin(i*1.7)*.11,.44,z+Math.cos(i*1.7)*.11);leaf.rotation.z=Math.sin(i)*.5;this.scene.add(leaf)}}
 addStreetProps(){for(const x of[3.1,12]){const pole=this.box(.055,2.65,.055,'#465a5c');pole.position.set(x,1.32,3.8);this.scene.add(pole);const lamp=this.box(.28,.12,.25,'#f8dda0');lamp.position.set(x,2.65,3.8);this.scene.add(lamp)}const bench=this.box(1.3,.10,.4,'#ad7f50');bench.position.set(2.7,.45,3.2);this.scene.add(bench);for(const x of[2.2,3.2]){const leg=this.box(.06,.45,.3,'#536563');leg.position.set(x,.2,3.2);this.scene.add(leg)}}
 buildRepair(){
  const table=this.box(8,.14,5.2,'#b78c5c');table.position.y=-.10;table.receiveShadow=true;this.repairScene.add(table);
  const mat=this.box(6.6,.035,4.5,'#397a6a');mat.position.y=0;mat.receiveShadow=true;this.repairScene.add(mat);
  const grid=new T.GridHelper(6.4,24,'#679c84','#528c77');grid.position.y=.025;this.repairScene.add(grid);
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
  const tray=this.box(.86,.07,1.65,'#9ebbae');tray.position.set(2.2,.06,.13);this.repairScene.add(tray);
  const bin=new T.Mesh(new T.CylinderGeometry(.43,.36,.25,24),new T.MeshStandardMaterial({color:'#4c5c5a'}));bin.position.set(2.2,.15,1.55);this.repairScene.add(bin);this.binPosition=new T.Vector3(2.2,.35,1.55);
  for(const [name,x,z,scale]of[['driver',-2.9,-1.2,7],['spudger',-2.9,.2,7],['suction',2.8,-1.4,7]]){const g=this.assets[name];g.scale.setScalar(scale);g.position.set(x,.06,z);this.repairScene.add(g)}
 }
 setZone(zone,instant=false){this.mode=zone;this.avatarGoal=null;this.walkCallback=null;const street=zone==='street';this.targetFocus.set(street?6:.05,street?.6:.75,street?.6:0);this.targetView=street?9:6.5;if(instant)this.focus.copy(this.targetFocus);if(this.avatar)this.avatar.position.set(street?3.3:.7,.05,street?2.6:.7);this.repairTargets=[];this.resize();}
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
 projectTargets(){const list=this.mode==='repair'?this.repairTargets:this.mode==='room'?[
  {id:'bench',label:'Рабочий стол',position:new T.Vector3(.3,1.65,-1.1),action:'bench'},
  {id:'bed',label:'Спать',position:new T.Vector3(-1.3,.85,-.1),action:'bed'},
  {id:'kitchen',label:'Вода и еда',position:new T.Vector3(1.5,1.40,-1.15),action:'kitchen'}
 ]:[
  {id:'seller',label:'Продавец',position:new T.Vector3(3.5,1.5,2.1),action:'seller'},
  {id:'grocery',label:'Пятак',position:new T.Vector3(6.1,2.5,.8),action:'grocery'},
  {id:'pickup',label:'Azon',position:new T.Vector3(10.02,2.5,.8),action:'pickup'}
 ];return list.map(t=>{const v=t.object?t.object.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.045,0)):t.position;return {...t,...this.position2d(v)}});}
 resize(){const w=this.canvas.clientWidth||innerWidth,h=this.canvas.clientHeight||innerHeight;this.renderer.setSize(w,h,false);this.aspect=w/h;}
 pickGround(e){const rect=this.canvas.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const p=new T.Vector3();this.ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),p);return p;}
 pointerDown(e){this.down={x:e.clientX,y:e.clientY,time:performance.now()};if(this.mode==='repair'&&this.stage==='remove'&&this.selectedTool==='hand'&&!this.blocked){this.drag={x:e.clientX,y:e.clientY};}}
 pointerMove(e){if(this.drag&&Math.hypot(e.clientX-this.drag.x,e.clientY-this.drag.y)>12){this.canvas.style.cursor='grabbing';document.getElementById('bin-hint').classList.add('show');}}
 pointerUp(e){if(this.blocked){this.down=null;this.drag=null;return}if(this.drag){if(Math.hypot(e.clientX-this.drag.x,e.clientY-this.drag.y)>45){this.onAction('remove');this.onAction('discard')}this.drag=null;this.canvas.style.cursor='';document.getElementById('bin-hint').classList.remove('show');return}if(!this.down)return;const moved=Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y);this.down=null;if(moved>8)return;if(this.mode!=='repair'){const p=this.pickGround(e);if(this.mode==='room'){p.x=T.MathUtils.clamp(p.x,-.4,1.5);p.z=T.MathUtils.clamp(p.z,-.55,1.4)}else{p.x=T.MathUtils.clamp(p.x,2.5,11);p.z=T.MathUtils.clamp(p.z,1.35,3.5)}p.y=.05;this.walkTo(p.toArray())}}
 animate(){requestAnimationFrame(()=>this.animate());const dt=Math.min(this.clock.getDelta(),.12),t=this.clock.elapsedTime;
  this.focus.lerp(this.targetFocus,1-Math.exp(-dt*5));if(this.focus.distanceTo(this.targetFocus)<.002)this.focus.copy(this.targetFocus);this.view=T.MathUtils.lerp(this.view,this.targetView,1-Math.exp(-dt*5));if(Math.abs(this.view-this.targetView)<.002)this.view=this.targetView;const minwidth=this.mode==='street'?16:this.mode==='repair'?(this.aspect<.8?4.6:6.8):6.3;const vh=Math.max(this.view,minwidth/(this.aspect||1));this.camera.left=-vh*(this.aspect||1)/2;this.camera.right=-this.camera.left;this.camera.top=vh/2;this.camera.bottom=-vh/2;this.camera.updateProjectionMatrix();const offset=this.mode==='repair'?new T.Vector3(3,5.8,6.5):new T.Vector3(6,6.3,8);this.camera.position.copy(this.focus).add(offset);this.camera.lookAt(this.focus);
  if(this.avatar&&!this.blocked&&this.mode!=='repair'){
   const key=new T.Vector3((this.keys.KeyD?1:0)-(this.keys.KeyA?1:0),0,(this.keys.KeyS?1:0)-(this.keys.KeyW?1:0));
   if(key.lengthSq()){key.normalize().multiplyScalar(dt*2);this.avatar.position.add(key);this.avatar.position.x=T.MathUtils.clamp(this.avatar.position.x,this.mode==='room'?-.4:2.5,this.mode==='room'?1.5:11);this.avatar.position.z=T.MathUtils.clamp(this.avatar.position.z,this.mode==='room'?-.5:1.35,this.mode==='room'?1.4:3.5);this.avatar.rotation.y=Math.atan2(key.x,key.z);this.avatarGoal=null;}
   if(this.avatarGoal){const d=this.avatarGoal.clone().sub(this.avatar.position);if(d.length()<.06){this.avatarGoal=null;const cb=this.walkCallback;this.walkCallback=null;cb?.()}else{this.avatar.rotation.y=Math.atan2(d.x,d.z);this.avatar.position.addScaledVector(d,Math.min(dt*3.0/d.length(),1));}}
   const walking=!!this.avatarGoal||key.lengthSq()>0;this.avatar.children[0].position.y=.61+(walking?Math.sin(t*15)*.018:Math.sin(t*2)*.005);this.avatar.legs.forEach((l,i)=>l.rotation.x=walking?Math.sin(t*15+i*Math.PI)*.45:0);
  }
  if(this.mode==='repair'&&this.phone){this.phone.traverse(o=>{if(o.userData.target)o.position.lerp(o.userData.target,1-Math.exp(-dt*8));if(o.userData.spin>0){const d=Math.min(o.userData.spin,dt*20);o.rotation.y+=d;o.userData.spin-=d}})}
  this.renderer.render(this.mode==='repair'?this.repairScene:this.scene,this.camera);this.onFrame?.();
 }
}
