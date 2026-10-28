import * as T from 'three';
import {repairStage,screwCount} from './state.js';
import {product} from './products.js';

export function installRepair(w){
 const configs={phone:{root:w.phone,display:w.display,battery:w.battery,charge:w.charge,oled:w.oled,screws:w.screws,hinge:new T.Vector3(-.035,.036,0),pivot:new T.Vector3(-.035,.084,0),park:new T.Vector3(-.085,-.080,0)}};
 const outlines=[];function outline(obj){const lines=[];obj.traverse(o=>{if(o.isMesh){const l=new T.LineSegments(new T.EdgesGeometry(o.geometry,25),new T.LineBasicMaterial({color:'#f5a247',transparent:true,opacity:.9}));l.raycast=()=>{};l.visible=false;o.add(l);lines.push(l)}});outlines.push({obj,lines});return lines;}
 for(const [i,key]of ['driver','spudger','suction'].entries()){const obj=w.assets[key];obj.position.set(-1.3+i*1.1,.07,1.65);obj.rotation.set(0,0,0);obj.userData.tool=key;obj.userData.rest=obj.position.clone();obj.userData.restQ=obj.quaternion.clone();obj.userData.tip=new T.Vector3(0,.009,key==='driver'?.085:key==='spudger'?.073:0);outline(obj)}
 configs.phone.display.traverse(o=>{if(/Display_flex|Touch_flex|Flex_connector/.test(o.name))o.visible=false});
 const newParts={};for(const [i,key]of ['battery','charge','display'].entries()){const o=product(key);o.position.set(1.25,.12,-.90);o.scale.setScalar(1.35);o.visible=false;o.userData.part=key;w.repairScene.add(o);newParts[key]=o;outline(o)}
 w.inventoryParts=newParts;w.repairBusy=false;w.precise=null;w.repairConfigs=configs;
 function generic(kind){
  const root=new T.Group();root.position.set(-.3,.06,.1);root.scale.setScalar(17);w.repairScene.add(root);const body=w.box(.15,.018,.105,'#3c5661');body.position.y=.012;root.add(body);
  const display=new T.Group();const shell=product(kind);shell.scale.setScalar(.135);shell.position.y=.023;display.add(shell);root.add(display);
  const board=w.box(.115,.003,.07,'#2e7962');board.position.y=.024;root.add(board);
  const battery=new T.Group();const b=w.box(.055,.008,.044,'#354b53');b.position.set(-.025,.032,.012);battery.add(b);root.add(battery);
  const charge=new T.Group();const c=w.box(.03,.007,.012,'#c39451');c.position.set(.048,.031,.035);charge.add(c);root.add(charge);
  for(const x of[-.04,.015,.045]){const chip=w.box(.018,.003,.012,'#9caca3');chip.position.set(x,.030,-.02);root.add(chip)}
  const screws=[];for(let i=0;i<4;i++){const s=new T.Group();const mesh=new T.Mesh(new T.CylinderGeometry(.0025,.0017,.004,12),new T.MeshStandardMaterial({color:'#c3d0ca',metalness:.6,roughness:.3}));s.add(mesh);root.add(s);screws.push(s)}
  return {root,display,battery,charge,oled:null,screws,hinge:new T.Vector3(-.065,.04,0),pivot:new T.Vector3(-.065,.04,0),park:new T.Vector3(0,-.030,-.15)};
 }
 function activate(p){const kind=p.kind||'phone';if(!configs[kind])configs[kind]=generic(kind);for(const [key,c]of Object.entries(configs))c.root.visible=key===kind;const c=configs[kind];if(!c.connectors){c.connectors=[];for(let i=0;i<3;i++){const o=w.box(.009,.004,.008,'#3b4a4e');o.position.set(-.0265+i*.0253,.030,-.0353);c.root.add(o);c.connectors.push(o)}c.flexes=[];for(let i=0;i<2;i++){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(13*2*3),3));const indices=[];for(let j=0;j<12;j++)indices.push(j*2,j*2+1,j*2+2,j*2+1,j*2+3,j*2+2);geo.setIndex(indices);const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color:'#ca9345',roughness:.45,metalness:.25,side:T.DoubleSide}));c.root.add(mesh);c.flexes.push(mesh)}}Object.assign(w,{phone:c.root,display:c.display,battery:c.battery,charge:c.charge,oled:c.oled,screws:c.screws});w.activeRepair=c;}
 function pose(p){const c=w.activeRepair;if(!p.open||p.closed)return {pos:c.hinge.clone().sub(c.pivot),q:new T.Quaternion()};if(p.disconnected===7&&!p.installed)return {pos:c.park.clone(),q:new T.Quaternion()};const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),1.0);return {pos:c.hinge.clone().sub(c.pivot.clone().applyQuaternion(q)),q};}
 w.showRepair=p=>{activate(p);w.mode='repair';w.avatarGoal=null;w.waypoints=[];w.targetFocus.set(-.1,.42,0);w.targetView=5.9;w.repairId=p.id;w.repairPhone=p;w.updateRepair(p,true);w.resize()};
 w.updateRepair=(p,instant=false)=>{
  if(w.repairId!==p.id){activate(p);w.repairId=p.id;instant=true}w.stage=repairStage(p);w.repairPhone=p;const c=w.activeRepair;const t=pose(p);c.display.userData.pose=t;if(instant){c.display.position.copy(t.pos);c.display.quaternion.copy(t.q)}
  c.display.visible=!(p.defect==='display'&&p.removed&&!p.installed);c.battery.visible=!(p.defect==='battery'&&p.removed&&!p.installed);c.charge.visible=!(p.defect==='charge'&&p.removed&&!p.installed);
  if(c.oled)c.oled.material.color.set(p.fixed?'#7dc7a3':'#17313b');
  c.screws.forEach((s,i)=>{const removed=(p.out&(1<<i))&&!(p.inside&(1<<i)),phone=!p.kind||p.kind==='phone';const target=removed?new T.Vector3(.135+(i%2)*.020,.010,-.04+Math.floor(i/2)*.028):new T.Vector3(i%2?(phone?.031:.062):(phone?-.031:-.062),phone?.036:.075,phone?-.063+Math.floor(i/2)*.042:(i<2?-.037:.037));s.userData.target=target;if(instant)s.position.copy(target)});
  const count=w.inventory?.[p.defect]||0;for(const [key,o]of Object.entries(newParts))o.visible=w.mode==='repair'&&key===p.defect&&(w.inventory?.[key]||0)>0;
  w.repairTargets=[];
  if(w.stage==='screws'||w.stage==='tighten')c.screws.forEach((o,i)=>{if(w.stage==='screws'?!(p.out&(1<<i)):!(p.inside&(1<<i)))w.repairTargets.push({id:'screw-'+i,label:String(i+1),object:o,action:'screw',index:i,small:true})});
  if(w.stage==='diagnose')w.repairTargets.push({id:'diagnose',label:'Проверить питание',position:new T.Vector3(-.2,.7,.1),action:'diagnose'});
  if(w.stage==='open'||w.stage==='close')w.repairTargets.push({id:'display',label:w.stage==='open'?(p.kind&&p.kind!=='phone'?'Поднять крышку':'Поднять дисплей'):'Закрыть корпус',position:new T.Vector3(-.3,.8,.1),action:w.stage});
  if(w.stage==='disconnect'||w.stage==='connect')for(let i=0;i<3;i++)if(!((w.stage==='disconnect'?p.disconnected:p.connected)&(1<<i)))w.repairTargets.push({id:'connector-'+i,label:i===0?'Питание':'Шлейф '+i,position:new T.Vector3(-.75+i*.43,.57,-.50),action:'connector',index:i,connector:true});
  if(w.stage==='remove')w.repairTargets.push({id:'part',label:'Снять неисправную деталь',position:new T.Vector3(-.3,.65,.4),action:'remove'});
  if(w.stage==='install')w.repairTargets.push(count?{id:'install',label:'Взять деталь со стола',object:newParts[p.defect],action:'install'}:{id:'install',label:'Найти запчасть',position:new T.Vector3(-.3,.65,.4),action:'install'});
  if(w.stage==='test')w.repairTargets.push({id:'test',label:'Проверить устройство',position:new T.Vector3(-.3,.7,.1),action:'test'});
  const required=w.stage==='screws'||w.stage==='tighten'?'driver':w.stage==='open'?'suction':w.stage==='disconnect'||w.stage==='connect'?'spudger':null;
  if(required)w.repairTargets.push({id:'take-'+required,label:'Взять '+({driver:'отвёртку',suction:'присоску',spudger:'лопатку'}[required]),object:w.assets[required],action:'toolFromTable',tool:required,toolPick:true});
  w.requiredTool=required;w.highlightRepair();
 };
 w.highlightRepair=()=>{for(const item of outlines){const active=item.obj.userData.tool===w.requiredTool||item.obj.userData.part===w.repairPhone?.defect&&w.stage==='install';for(const line of item.lines)line.visible=active} };
 w.performRepair=(action,index,done)=>{
  if(w.repairBusy)return;w.repairBusy=true;const p=w.repairPhone,key=action==='screw'?'driver':action==='connector'?'spudger':action==='open'?'suction':null;
  const obj=key?w.assets[key]:null;let target=new T.Vector3(-.3,.65,.1);
  if(action==='screw'){const b=new T.Box3().setFromObject(w.screws[index]);b.getCenter(target);target.y=b.max.y+.003;}
  if(action==='connector')target.set(-.75+index*.43,.57,-.50);
  if(action==='open'){const box=new T.Box3().setFromObject(w.display);box.getCenter(target);target.y=box.max.y+.01;}
  const from=obj?.position.clone(),fromQ=obj?.quaternion.clone();const q=new T.Quaternion().setFromEuler(new T.Euler(key==='driver'||key==='spudger'?Math.PI/2:0,0,0));
  let flying=null;if(action==='remove'){const source=p.defect==='battery'?w.battery:p.defect==='charge'?w.charge:w.display;flying=source.clone(true);w.phone.add(flying);w.repairScene.attach(flying);flying.visible=true;target=w.binPosition.clone()}
  if(action==='install'){flying=newParts[p.defect];const bounds=new T.Box3().setFromObject(p.defect==='battery'?w.battery:p.defect==='charge'?w.charge:w.display);bounds.getCenter(target);target.y=Math.max(.12,target.y-.04);}
  w.precise={action,index,obj,target,from,fromQ,q,flying,flyFrom:flying?.position.clone(),time:0,duration:action==='test'?1.4:action==='open'?1.35:.95,done};
 };
 w.updatePrecise=(dt,t)=>{
  const c=w.activeRepair;if(c&&!w.precise){const pose=c.display.userData.pose;if(pose){c.display.position.lerp(pose.pos,1-Math.exp(-dt*9));c.display.quaternion.slerp(pose.q,1-Math.exp(-dt*9));}}
  const a=w.precise;if(c&&w.repairPhone){const p=w.repairPhone;for(let i=0;i<3;i++)c.connectors[i].scale.y=(p.disconnected&(1<<i))&&!(p.connected&(1<<i))?.3:1;for(let i=0;i<2;i++){const mesh=c.flexes[i],live=p.open&&!p.closed&&(!(p.disconnected&(1<<(i+1)))||!!(p.connected&(1<<(i+1))));mesh.visible=live;if(!live)continue;const from=new T.Vector3(-.0012+i*.0253,.034,-.0353),end=new T.Vector3(i? .014:-.016,c===configs.phone?.080:.04,.043).applyQuaternion(c.display.quaternion).add(c.display.position);const curve=new T.CatmullRomCurve3([from,from.clone().add(new T.Vector3(0,.025,.025)),end.clone().add(new T.Vector3(0,-.018,0)),end]);const a=mesh.geometry.attributes.position;for(let j=0;j<=12;j++){const pt=curve.getPoint(j/12);a.setXYZ(j*2,pt.x-.003,pt.y,pt.z);a.setXYZ(j*2+1,pt.x+.003,pt.y,pt.z)}a.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere()}}if(a){a.time+=dt;const u=Math.min(1,a.time/a.duration),approach=Math.min(1,u/.25),ret=u>.78?(u-.78)/.22:0;
   if(a.obj){const q=a.fromQ.clone().slerp(a.q,approach);if(ret)q.slerp(a.fromQ,ret);if(a.action==='screw'&&u>.25&&u<.78){const spin=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),(u-.25)*Math.PI*12);q.premultiply(spin);w.screws[a.index].rotation.y=(u-.25)*Math.PI*12;}const tip=a.obj.userData.tip.clone().multiplyScalar(a.obj.scale.x).applyQuaternion(q);const pos=a.target.clone().sub(tip);a.obj.position.lerpVectors(a.from,pos,approach);if(ret)a.obj.position.lerp(a.from,ret);a.obj.quaternion.copy(q);}
   if(a.action==='open'&&u>.25){const angle=Math.min(1,(u-.25)/.65);const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),angle);c.display.quaternion.copy(q);c.display.position.copy(c.hinge).sub(c.pivot.clone().applyQuaternion(q));}
   if(a.flying){a.flying.position.lerpVectors(a.flyFrom,a.target,Math.min(1,u/.85));a.flying.position.y+=Math.sin(u*Math.PI)*.25;}
   if(u===1){if(a.obj){a.obj.position.copy(a.from);a.obj.quaternion.copy(a.fromQ)}if(a.action==='remove')a.flying?.removeFromParent();w.precise=null;w.repairBusy=false;a.done?.();}
  }
  for(const {lines}of outlines)for(const line of lines)if(line.visible)line.material.opacity=.65+Math.sin(t*5)*.25;
 };
 w.repairPick=e=>{const rect=w.canvas.getBoundingClientRect();w.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);w.ray.setFromCamera(w.pointer,w.camera);const hits=w.ray.intersectObjects(w.repairScene.children,true);for(const hit of hits){let a=hit.object,hidden=false;while(a){if(!a.visible)hidden=true;a=a.parent}if(hidden)continue;let o=hit.object;while(o){if(o.userData.tool){w.onAction('toolFromTable',o.userData.tool);return true}if(o.userData.part){w.onAction('install');return true}o=o.parent}}return false};
}
