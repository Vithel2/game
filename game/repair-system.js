import * as T from 'three';
import {repairStage,screwCount} from './state.js';
import {product} from './products.js';
import {connectorCount,connectorMask,screwCount as countScrews} from './repair-rules.js';
import {workshopTool,deviceCase} from './workshop-models.js';
import {installRepairMotion} from './repair-motion.js';
import {meshBounds} from './motion.js';
import {buildHandset,visibleDriver} from './repair-phone.js';
import {installDiagnostic} from './diagnostics.js';

export function installRepair(w){
 const configs={phone:buildHandset(w)};visibleDriver(w);
 const outlines=[];function outline(obj){const lines=[];obj.traverse(o=>{if(o.isMesh){const l=new T.LineSegments(new T.EdgesGeometry(o.geometry,25),new T.LineBasicMaterial({color:'#f5a247',transparent:true,opacity:.9}));l.raycast=()=>{};l.visible=false;o.add(l);lines.push(l)}});outlines.push({obj,lines});return lines;}
 for(const [i,key]of ['driver','spudger','suction'].entries()){const obj=w.assets[key];obj.position.set(-1.3+i*1.1,.07,1.65);obj.rotation.set(0,0,0);obj.userData.tool=key;obj.userData.rest=obj.position.clone();obj.userData.restQ=obj.quaternion.clone();obj.userData.tip ||= new T.Vector3(0,.009,key==='spudger'?.073:0);outline(obj)}
 configs.phone.display.traverse(o=>{if(/Display_flex|Touch_flex|Flex_connector/.test(o.name))o.visible=false});
 const newParts={};for(const [i,key]of ['battery','charge','display'].entries()){const o=product(key);o.position.set(1.25,.12,-.90);o.scale.setScalar(1.35);o.visible=false;o.userData.part=key;o.userData.stockPosition=o.position.clone();o.userData.stockQ=o.quaternion.clone();w.repairScene.add(o);newParts[key]=o;outline(o)}
 w.inventoryParts=newParts;w.repairBusy=false;w.precise=null;w.repairConfigs=configs;
 const generic=kind=>deviceCase(w,kind);
 function activate(p){const kind=p.kind||'phone';if(!configs[kind])configs[kind]=generic(kind);for(const [key,c]of Object.entries(configs))c.root.visible=key===kind;const c=configs[kind];if(!c.connectors){c.connectors=[];for(let i=0;i<3;i++){const o=w.box(.009,.004,.008,'#3b4a4e');o.position.copy(c.connectorPositions?.[i]||new T.Vector3(-.025+i*.025,.032,.044));if(kind==='headphones')o.scale.setScalar(.55);c.root.add(o);c.connectors.push(o)}c.flexes=[];for(let i=0;i<2;i++){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(13*2*3),3));const indices=[];for(let j=0;j<12;j++)indices.push(j*2,j*2+1,j*2+2,j*2+1,j*2+3,j*2+2);geo.setIndex(indices);const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color:'#ca9345',roughness:.45,metalness:.25,side:T.DoubleSide}));c.root.add(mesh);c.flexes.push(mesh)}}Object.assign(w,{phone:c.root,display:c.display,battery:c.battery,charge:c.charge,oled:c.oled,screws:c.screws});w.activeRepair=c;
  if(kind==='phone')installDiagnostic(w,c);
  if(w.stockKind!==kind){
   w.stockKind=kind;
   for(const [key,source]of Object.entries({battery:c.battery,charge:c.charge,display:c.display})){
    const old=newParts[key],stock=source.clone(true);old.removeFromParent();c.root.add(stock);w.repairScene.attach(stock);stock.quaternion.identity();stock.visible=true;
    const b=meshBounds(stock),center=b.getCenter(new T.Vector3());stock.position.add(new T.Vector3(1.85-center.x,.10-b.min.y,-1.10-center.z));stock.userData={part:key,stockPosition:stock.position.clone(),stockQ:stock.quaternion.clone()};stock.visible=false;newParts[key]=stock;outline(stock);
   }
  }
 }
 function pose(p){const c=w.activeRepair;if(!p.open||p.closed)return {pos:c.hinge.clone().sub(c.pivot),q:new T.Quaternion()};if(p.disconnected===connectorMask(p)&&!['connect','seal','close','tighten','calibrate','test','done'].includes(repairStage(p))){const pos=c.park.clone(),oldPos=c.display.position.clone(),oldQ=c.display.quaternion.clone();c.display.position.copy(pos);c.display.quaternion.identity();const b=meshBounds(c.display);pos.y+=(.028-b.min.y)/c.root.scale.y;c.display.position.copy(oldPos);c.display.quaternion.copy(oldQ);c.display.updateWorldMatrix(true,true);return {pos,q:new T.Quaternion()};}const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),1.0);return {pos:c.hinge.clone().sub(c.pivot.clone().applyQuaternion(q)),q};}
 w.showRepair=p=>{w.discarded.clear();activate(p);w.mode='repair';w.avatarGoal=null;w.waypoints=[];w.targetFocus.set(-.1,.42,0);w.targetView=5.9;w.repairId=p.id;w.repairPhone=p;w.updateRepair(p,true);w.resize()};
 w.updateRepair=(p,instant=false)=>{
  if(w.repairId!==p.id){activate(p);w.repairId=p.id;instant=true}w.stage=repairStage(p);w.repairPhone=p;const c=w.activeRepair;const t=pose(p);c.display.userData.pose=t;if(c.diagnostic&&!w.precise)c.diagnostic.screen.visible=p.fixed||w.stage==='test';if(instant){c.display.position.copy(t.pos);c.display.quaternion.copy(t.q)}
  c.display.visible=!(p.defect==='display'&&p.removed&&!p.installed);c.battery.visible=!(p.defect==='battery'&&p.removed&&!p.installed);c.charge.visible=!(p.defect==='charge'&&p.removed&&!p.installed);
  if(c.oled)c.oled.material.color.set(p.fixed?'#7dc7a3':'#17313b');
  c.screws.forEach((s,i)=>{const removed=(p.out&(1<<i))&&!(p.inside&(1<<i)),phone=!p.kind||p.kind==='phone';const target=removed?new T.Vector3(.135+(i%2)*.020,.010,-.04+Math.floor(i/2)*.028):new T.Vector3(i%2?(phone?.031:.062):(phone?-.031:-.062),phone?.036:.075,phone?-.063+Math.floor(i/2)*.042:(i<2?-.037:.037));s.userData.target=target;if(instant)s.position.copy(target)});
  const count=w.inventory?.[p.defect]||0;for(const [key,o]of Object.entries(newParts)){o.visible=w.mode==='repair'&&key===p.defect&&(w.inventory?.[key]||0)>0;if(!w.precise){o.position.copy(o.userData.stockPosition);o.quaternion.copy(o.userData.stockQ)}}
  w.repairTargets=[];
  if(w.stage==='screws'||w.stage==='tighten')c.screws.forEach((o,i)=>{if(w.stage==='screws'?!(p.out&(1<<i)):!(p.inside&(1<<i)))w.repairTargets.push({id:'screw-'+i,label:String(i+1),object:o,action:'screw',index:i,small:true})});
  if(w.stage==='diagnose')w.repairTargets.push({id:'diagnose',label:'Проверить питание',position:new T.Vector3(-.2,.7,.1),action:'diagnose'});
  if(w.stage==='open'||w.stage==='close')w.repairTargets.push({id:'display',label:w.stage==='open'?(p.kind&&p.kind!=='phone'?'Поднять крышку':'Поднять дисплей'):'Закрыть корпус',position:new T.Vector3(-.3,.8,.1),action:w.stage});
  if(w.stage==='disconnect'||w.stage==='connect')for(let i=0;i<connectorCount(p);i++)if(!((w.stage==='disconnect'?p.disconnected:p.connected)&(1<<i)))w.repairTargets.push({id:'connector-'+i,label:i===0?'Питание':'Шлейф '+i,object:c.connectors[i],action:'connector',index:i,connector:true});
  if(w.stage==='remove')w.repairTargets.push({id:'part',label:'Снять неисправную деталь',position:new T.Vector3(-.3,.65,.4),action:'remove'});
  if(w.stage==='install')w.repairTargets.push(count?{id:'install',label:'Взять деталь со стола',object:newParts[p.defect],action:'install'}:{id:'install',label:'Найти запчасть',position:new T.Vector3(-.3,.65,.4),action:'install'});
  if(w.stage==='test')w.repairTargets.push({id:'test',label:'Проверить устройство',position:new T.Vector3(-.3,.7,.1),action:'test'});
  const required=w.stage==='screws'||w.stage==='tighten'?'driver':w.stage==='open'?'suction':w.stage==='disconnect'||w.stage==='connect'?'spudger':null;
  if(required)w.repairTargets.push({id:'take-'+required,label:'Взять '+({driver:'отвёртку',suction:'присоску',spudger:'лопатку'}[required]),object:w.assets[required],action:'toolFromTable',tool:required,toolPick:true});
  w.requiredTool=required;w.highlightRepair();
 };
 w.highlightRepair=()=>{for(const item of outlines){const active=item.obj.userData.tool===w.requiredTool||item.obj.userData.part===w.repairPhone?.defect&&w.stage==='install';for(const line of item.lines)line.visible=active} };
 w.updatePrecise=(dt,t)=>{
  const c=w.activeRepair;if(c&&!w.precise&&!w.coverMotion){const pose=c.display.userData.pose;if(pose){c.display.position.lerp(pose.pos,1-Math.exp(-dt*9));c.display.quaternion.slerp(pose.q,1-Math.exp(-dt*9));}}
  const a=w.precise;if(c&&w.repairPhone){const p=w.repairPhone;for(let i=0;i<3;i++)c.connectors[i].scale.y=1;for(let i=0;i<2;i++){const mesh=c.flexes[i],live=p.open&&!p.closed&&c.display.visible;mesh.visible=live&&i+1<connectorCount(p);if(!mesh.visible)continue;const loose=(p.disconnected&(1<<(i+1)))&&!(p.connected&(1<<(i+1))),from=c.connectors[i+1].position.clone(),end=(c.flexEnds?.[i]?.clone()||new T.Vector3(i? .014:-.016,c===configs.phone?.080:.04,.043)).applyQuaternion(c.display.quaternion).add(c.display.position);if(loose)end.y-=.009;mesh.userData.loose=T.MathUtils.damp(mesh.userData.loose||0,loose?1:0,7,dt);from.lerp(end.clone().add(new T.Vector3(.007,-.004,-.014)),mesh.userData.loose);const curve=new T.CatmullRomCurve3([from,from.clone().lerp(end,.33).add(new T.Vector3(0,.004,0)),from.clone().lerp(end,.72).add(new T.Vector3(0,.006,0)),end]);const a=mesh.geometry.attributes.position;for(let j=0;j<=12;j++){const pt=curve.getPoint(j/12);a.setXYZ(j*2,pt.x-.003,pt.y,pt.z);a.setXYZ(j*2+1,pt.x+.003,pt.y,pt.z)}a.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere()}}w.tickRepairMotion?.(dt,t);w.workHands?.forEach(h=>h.syncArm());
  for(const {lines}of outlines)for(const line of lines)if(line.visible)line.material.opacity=.65+Math.sin(t*5)*.25;
 };

 const extraOutlines=[];
 for(const key of ['heater','brush','iron','glue','meter']){const obj=workshopTool(w,key);obj.userData.rest=obj.position.clone();obj.userData.restQ=obj.quaternion.clone();w.assets[key]=obj;w.repairScene.add(obj);extraOutlines.push({obj,lines:outline(obj)})}
 const baseUpdate=w.updateRepair;
 w.updateRepair=(p,instant=false)=>{
  const c=w.activeRepair;if(c===configs.phone&&!c.extended){for(let i=8;i<12;i++){const o=c.screws[0].clone(true);c.root.add(o);c.screws.push(o)}c.extended=true}
  baseUpdate(p,instant);const n=countScrews(p);c.inPositions=[];c.trayPositions=[];
  c.screws.forEach((o,i)=>{o.visible=i<n;const phone=c===configs.phone;const pos=c.fasteners?.[i]?new T.Vector3(...c.fasteners[i]):new T.Vector3(i%2?.031:-.031,.036,-.063+Math.floor(i/2)*.126/(n/2-1));c.inPositions.push(pos);const tray=new T.Vector3(.135+(i%2)*.020,.003,-.103+Math.floor(i/2)*.009);c.trayPositions.push(tray);o.userData.target=(p.out&(1<<i))&&!(p.inside&(1<<i))?tray:pos;if(instant)o.position.copy(o.userData.target)});
  w.repairTargets=w.repairTargets.filter(t=>t.action!=='screw'||t.index<n);for(const target of w.repairTargets)if(target.action==='remove'||target.action==='close'){const obj=target.action==='close'?c.display:p.defect==='battery'?c.battery:p.defect==='charge'?c.charge:c.display;target.position=meshBounds(obj).getCenter(new T.Vector3()).add(new T.Vector3(0,.15,0));delete target.object;}
  if(w.stage==='tighten')for(const t of w.repairTargets)if(t.action==='screw'){t.position=c.root.localToWorld(c.inPositions[t.index].clone()).add(new T.Vector3(0,.045,0));delete t.object;}
  if(c!==configs.phone)for(const t of w.repairTargets)if(t.action==='connector'){t.position=c.connectors[t.index].getWorldPosition(new T.Vector3()).add(new T.Vector3((t.index-1)*.35,.18,0));delete t.object;}
  if(c!==configs.phone){c.flexEnds=c.connectorPositions.map(v=>v.clone().add(new T.Vector3(0,.014,.015)));}
  const names={heat:['Прогреть клей','heater'],clean:['Очистить контакты','brush'],solder:['Восстановить пайку','iron'],seal:['Обновить уплотнитель','glue'],calibrate:['Калибровка','meter']};
  if(names[w.stage]){const [label,tool]=names[w.stage];w.requiredTool=tool;w.repairTargets.push({id:'extra-'+w.stage,label,position:c.root.localToWorld(new T.Vector3(0,.07,0)),action:w.stage},{id:'take-'+tool,label:'Взять '+{heater:'фен',brush:'кисть',iron:'паяльник',glue:'герметик',meter:'мультиметр'}[tool],object:w.assets[tool],action:'toolFromTable',tool});}
  if(!instant&&(c.lastStage==='disconnect'&&['remove','clean'].includes(w.stage)||w.stage==='connect'&&c.lastStage&&c.lastStage!=='connect')){w.coverMotion={time:0,from:c.display.position.clone(),q:c.display.quaternion.clone(),pose:c.display.userData.pose};w.repairBusy=true}c.lastStage=w.stage;
  w.highlightRepair();
 };
 installRepairMotion(w);
 w.repairPick=e=>{const rect=w.canvas.getBoundingClientRect();w.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);w.ray.setFromCamera(w.pointer,w.camera);const hits=w.ray.intersectObjects(w.repairScene.children,true);for(const hit of hits){let a=hit.object,hidden=false;while(a){if(!a.visible)hidden=true;a=a.parent}if(hidden)continue;let o=hit.object;while(o){if(o.userData.tool){w.onAction('toolFromTable',o.userData.tool);return true}if(o.userData.part){w.onAction('install');return true}o=o.parent}}return false};
}
