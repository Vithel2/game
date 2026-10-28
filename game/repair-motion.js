import * as T from 'three';
import {ease,keys,meshBounds} from './motion.js';
import {workshopHand} from './repair-hand.js';
const toolFor={screw:'driver',connector:'spudger',open:'suction',heat:'heater',clean:'brush',solder:'iron',seal:'glue',calibrate:'meter'};
export function installRepairMotion(w){
 w.workHands=[workshopHand(w),workshopHand(w,true)];w.discarded=new T.Group();w.repairScene.add(w.discarded);
 w.performRepair=(action,index,done)=>{
  if(w.repairBusy)return;w.repairBusy=true;const p=w.repairPhone,c=w.activeRepair,key=toolFor[action],obj=key?w.assets[key]:null;let target=new T.Vector3(-.3,.65,.1);let screw=null,hole=null,tray=null;
  if(action==='screw'){
   screw=w.screws[index];hole=c.root.localToWorld(c.inPositions[index].clone());tray=c.root.localToWorld(c.trayPositions[index].clone());const box=meshBounds(screw),at=screw.getWorldPosition(new T.Vector3());target.copy(hole);target.y+=box.max.y-at.y+.003;
  }
  if(action==='connector')target.copy(c.connectors[index].getWorldPosition(new T.Vector3())).add(new T.Vector3(0,.022,0));
  if(action==='open'||action==='close'){meshBounds(c.display).getCenter(target);target.y=meshBounds(c.display).max.y+.01;}
  if(['clean','solder','calibrate'].includes(action))target.copy(c.connectors[action==='solder'?1:0].getWorldPosition(new T.Vector3())).add(new T.Vector3(0,.025,0));
  if(action==='heat'||action==='seal')target.copy(c.root.localToWorld(new T.Vector3(-.030,.045,0))).add(new T.Vector3(0,action==='heat'?.35:.03,0));
  const sourcePart=p.defect==='battery'?c.battery:p.defect==='charge'?c.charge:c.display;let flying=null;
  if(action==='remove'){flying=sourcePart.clone(true);c.root.add(flying);w.repairScene.attach(flying);flying.visible=true;sourcePart.visible=false;meshBounds(flying).getCenter(target);}
  if(action==='install'){flying=w.inventoryParts[p.defect];meshBounds(sourcePart).getCenter(target);}
  const q=new T.Quaternion().setFromEuler(new T.Euler(key==='driver'?Math.PI/2:key==='spudger'?.98:key==='heater'?-.55:key==='iron'?-.35:key==='brush'?.30:0,0,0));
  const hands=['remove','install','close'].includes(action)?w.workHands.slice(0,action==='close'?2:1):obj?w.workHands.slice(0,1):[];hands.forEach((h,i)=>{h.visible=true;h.position.set(i?.9:-.8,.28,2.8);h.rotation.set(0,0,0)});
  w.precise={action,index,obj,target,from:obj?.position.clone(),fromQ:obj?.quaternion.clone(),q,time:0,duration:{screw:2.15,connector:1.1,open:2.4,close:2.1,remove:1.8,install:2.0,test:2.6,heat:2.8,clean:2.2,solder:2.5,seal:2.2,calibrate:1.8}[action]||1.2,done,flying,flyFrom:flying?.position.clone(),flyQ:flying?.quaternion.clone(),flyOffset:flying?meshBounds(flying).getCenter(new T.Vector3()).sub(flying.position):null,hands,screw,hole,tray,tighten:w.stage==='tighten',coverFrom:c.display.position.clone(),coverQ:c.display.quaternion.clone(),contact:c.display.worldToLocal(target.clone()),connectorFrom:action==='connector'?c.connectors[index].position.clone():null,phase:-1,headOffset:target.y-(hole?.y||0)};
 };
 w.tickRepairMotion=(dt,t)=>{
  const a=w.precise;if(!a){const m=w.coverMotion;if(m){m.time+=dt;const u=Math.min(1,m.time/1.4),v=ease(u),c=w.activeRepair;c.display.position.lerpVectors(m.from,m.pose.pos,v);c.display.quaternion.slerpQuaternions(m.q,m.pose.q,v);const center=meshBounds(c.display).getCenter(new T.Vector3());w.workHands.forEach((h,i)=>{h.visible=u<1;h.position.copy(center).add(new T.Vector3(i?.35:-.35,.13,.1));h.rotation.set(0,0,i?.06:-.06);h.curl(.5)});if(u===1){w.coverMotion=null;w.repairBusy=false}}return;}const c=w.activeRepair,p=w.repairPhone;a.time+=dt;const u=Math.min(1,a.time/a.duration),reach=ease(Math.min(1,u/.25)),withdraw=ease(Math.max(0,(u-.80)/.20));
  if(a.action==='screw'){
   const screwWorld=a.tighten?a.tray.clone().lerp(a.hole,ease(Math.min(1,u/.24))):a.hole.clone().lerp(a.tray,ease(Math.max(0,(u-.74)/.26)));screwWorld.y+=a.tighten?Math.sin(Math.min(1,u/.24)*Math.PI)*.2:u<.74?Math.max(0,(u-.25))*.04:Math.sin((u-.74)/.26*Math.PI)*.12;
   a.screw.position.copy(c.root.worldToLocal(screwWorld.clone()));if(u>.25&&u<.74)a.target.y=screwWorld.y+a.headOffset;a.screw.rotation.y=(a.tighten?-1:1)*Math.PI*keys(u,[[0,0],[.25,0],[.74,3],[1,3]]);
   if(u>.25&&u<.76&&t-(a.lastSound||0)>.19){a.lastSound=t;w.onAction('foley','tool')}
  }
  if(a.action==='open'){
   const tilt=keys(u,[[0,0],[.28,0],[.78,1],[1,1]]),q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),tilt);c.display.quaternion.copy(q);c.display.position.copy(c.hinge).sub(c.pivot.clone().applyQuaternion(q));c.root.updateMatrixWorld(true);a.target.copy(c.display.localToWorld(a.contact.clone()));
  }
  if(a.action==='connector'){const k=c.connectors[a.index],lift=keys(u,[[0,0],[.30,0],[.58,1],[.75,.75],[1,.7]])*(w.stage==='disconnect'?1:-1);k.position.copy(a.connectorFrom);k.position.y+=lift*.004;k.rotation.z=lift*.12;}
  if(a.action==='close'){
   const blend=ease(Math.max(0,Math.min(1,(u-.22)/.57)));c.display.position.lerpVectors(a.coverFrom,c.hinge.clone().sub(c.pivot),blend);c.display.quaternion.slerpQuaternions(a.coverQ,new T.Quaternion(),blend);
  }
  if(a.obj){
   let orient=a.q;if(a.action==='open'){const coverQ=c.display.getWorldQuaternion(new T.Quaternion());orient=coverQ;}const q=a.fromQ.clone().slerp(orient,reach);if(a.action==='screw'&&u>.25)q.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI*(a.tighten?-1:1)*keys(u,[[0,0],[.25,0],[.74,3],[1,3]])));if(a.action==='connector'&&u>.28&&u<.76)q.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.sin((u-.28)/.48*Math.PI)*.12));q.slerp(a.fromQ,withdraw);
   let aim=a.target.clone();if(a.action==='heat')aim.x+=Math.sin(u*Math.PI*4)*.4;if(a.action==='clean')aim.x+=Math.sin(u*Math.PI*9)*.15;if(a.action==='seal'){const corners=[[-.031,-.063],[.031,-.063],[.031,.063],[-.031,.063],[-.031,-.063]],n=Math.min(3,Math.floor(u*4)),v=u*4-n;aim.copy(c.root.localToWorld(new T.Vector3(T.MathUtils.lerp(corners[n][0],corners[n+1][0],v),.045,T.MathUtils.lerp(corners[n][1],corners[n+1][1],v))))}
   const tip=a.obj.userData.tip.clone().multiply(a.obj.scale).applyQuaternion(q),pos=aim.sub(tip);a.obj.position.lerpVectors(a.from,pos,reach).lerp(a.from,withdraw);a.obj.quaternion.copy(q);
  }
  if(a.flying){
   const v=ease(Math.max(0,Math.min(1,(u-.22)/.50))),end=(a.action==='remove'?w.binPosition.clone():a.target.clone()).sub(a.flyOffset);a.flying.position.lerpVectors(a.flyFrom,end,v);a.flying.position.y+=Math.sin(v*Math.PI)*.24;if(a.action==='remove')a.flying.quaternion.slerpQuaternions(a.flyQ,new T.Quaternion(),v);
  }
  for(const [i,h]of a.hands.entries()){
   const goal=a.obj?a.obj.localToWorld(a.obj.userData.grip?.clone()||new T.Vector3(0,.014,a.action==='screw'?-.035:a.action==='open'?0:.06)):a.flying?meshBounds(a.flying).getCenter(new T.Vector3()):meshBounds(c.display).getCenter(new T.Vector3());if(!a.obj){goal.y+=.10;goal.x+=i?.35:-.35;}
   if(a.action==='screw')goal.add(new T.Vector3(-.20,0,.10));
   const start=new T.Vector3(i?.9:-.8,.28,2.8),blend=keys(u,[[0,0],[.22,1],[.78,1],[1,0]]);h.position.lerpVectors(start,goal,blend);if(a.action==='screw'){const stroke=Math.max(0,Math.min(1,(u-.25)/.49))*3;h.rotation.set(0,Math.sin(stroke*Math.PI*2)*.45*(a.tighten?-1:1),Math.PI/2);h.curl(keys(u,[[0,0],[.2,.9],[.78,.9],[1,0]])*(.85+.15*Math.sin(stroke*Math.PI*2)));}else{h.rotation.set(-.15*blend,0,0);h.curl(keys(u,[[0,0],[.2,.2],[.3,.8],[.76,.8],[.9,0],[1,0]]));}
  }
  if(['test','calibrate','heat','clean','solder','seal'].includes(a.action)){
   const phases={test:['Проверка питания','Зарядка и связь','Проверка завершена'],calibrate:['Проверка точности','Калибровка сохранена'],heat:['Равномерный прогрев','Клей размягчён'],clean:['Очистка контактов','Контакты чистые'],solder:['Прогрев площадки','Контакт восстановлен'],seal:['Новый уплотнитель','Контур замкнут']}[a.action],phase=Math.min(phases.length-1,Math.floor(u*phases.length));if(a.phase!==phase){a.phase=phase;w.onAction('repairPhase',phases[phase]);w.onAction('foley',a.action==='test'?'scan':a.action==='clean'?'brush':a.action)}
   if(a.action==='test'&&c.oled)c.oled.material.color.lerp(new T.Color('#8ed3ac'),dt*3);
  }
  if(u===1){if(a.obj){a.obj.position.copy(a.from);a.obj.quaternion.copy(a.fromQ)}a.hands.forEach(h=>h.visible=false);if(a.action==='remove'&&a.flying){w.discarded.add(a.flying);a.flying.position.copy(w.binPosition).sub(a.flyOffset)}w.precise=null;w.repairBusy=false;w.onAction('repairPhase','');a.done?.();}
 };
}
