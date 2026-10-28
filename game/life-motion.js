import * as T from 'three';
import {product} from './products.js';
import {animateCharacter} from './characters.js';
import {ease,keys,reachArm} from './motion.js';
export function installLifeMotion(w){
 w.performLife=(kind,done,item=null,options={})=>{
  if(w.busy)return;w.busy=true;w.avatarGoal=null;w.waypoints=[];const actor=w.avatar,start=actor.position.clone(),q=actor.quaternion.clone();
  const duration=options.duration||{sleep:6,record:4.5,drink:3.6,eat:4.0,shop:.95,work:1.35,salvage:2.6,rest:4}[kind]||3;
  const prop=['sleep','rest'].includes(kind)?null:product(item||(kind==='drink'?'water':kind==='record'?'phone':kind==='salvage'?'donor':'sandwich'));if(prop){prop.scale.setScalar(kind==='shop'?.30:kind==='record'?.25:.34);actor.add(prop)}
  w.lifeAction={kind,time:0,duration,actor,start,q,prop,done,options,sounds:new Set(),focus:w.targetFocus.clone(),view:w.targetView};if(kind==='record'){w.targetFocus.copy(actor.position).add(new T.Vector3(0,.85,0));w.targetView=3.6;const overlay=document.createElement('div');overlay.id='recording-viewfinder';overlay.innerHTML='<b>● REC <span>00:00</span></b><i></i><small>'+['Общий план · вступление','Крупный план · процесс','Результат · финал'][options.beat||0]+'</small>';document.getElementById('game').append(overlay);}const caption=document.getElementById('life-caption');caption.classList.add('show');
 };
 w.spawnBasketItem=(id,source,done)=>w.performLife('shop',done,id,{source:source?.getWorldPosition(new T.Vector3())});
 w.updateLife=(dt,t)=>{
  const a=w.lifeAction;if(!a)return;a.time+=dt;const u=Math.min(1,a.time/a.duration),actor=a.actor,cap=document.getElementById('life-caption');const play=(key,at,sound)=>{if(u>=at&&!a.sounds.has(key)){a.sounds.add(key);w.onAction('foley',sound)}};
  if(a.kind==='sleep'){
   const blend=keys(u,[[0,0],[.22,1],[.84,1],[1,0]]);actor.position.lerpVectors(a.start,new T.Vector3(-1.3,.72,.35),blend);actor.quaternion.slerpQuaternions(a.q,new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,0,0)),blend);actor.legs.forEach(l=>l.rotation.x=0);actor.knees.forEach(l=>l.rotation.x=0);actor.arms.forEach((l,i)=>{l.rotation.set(-.06,0,i?-.12:.12);actor.elbows[i].rotation.x=-.25});actor.eyes.forEach(e=>e.scale.y=.10);
   const phase=u<.22?'Устраиваемся поудобнее…':u<.43?'19:30 · Вечер':u<.70?'01:10 · Ночь':u<.87?'05:40 · Рассвет':'09:00 · Новое утро';cap.textContent=phase;if(u>.22)w.onAction('clockPreview',phase.split(' · ')[0]);const darkness=keys(u,[[0,0],[.27,0],[.52,1],[.70,1],[.95,0],[1,0]]);document.getElementById('sleep-shade').style.opacity=darkness*.68;
   for(const l of w.environmentLights||[]){if(l.scene===w.homeScene||l.scene===w.scene){l.sun.intensity=3.2-darkness*2.8;l.sun.color.lerp(new T.Color(darkness>.5?'#93a8d8':'#fff1ce'),Math.min(1,dt*5))}}
  }else if(a.kind==='rest'){
   const blend=keys(u,[[0,0],[.25,1],[.80,1],[1,0]]),target=a.options.sofa?new T.Vector3(4,-.06,-.79):a.options.seat?new T.Vector3(...a.options.seat):a.start.clone().add(new T.Vector3(0,-.05,0));actor.position.lerpVectors(a.start,target,blend);actor.quaternion.slerpQuaternions(a.q,new T.Quaternion(),blend);actor.legs.forEach(l=>l.rotation.x=-1.25*blend);actor.knees.forEach(l=>l.rotation.x=.8*blend);actor.arms.forEach((arm,i)=>{arm.rotation.x=-.3*blend;actor.elbows[i].rotation.x=-.5*blend});actor.head.rotation.z=.07*Math.sin(t)*blend;cap.textContent='Небольшой отдых';
  }else{
   animateCharacter(actor,t,false);if(['eat','drink','record'].includes(a.kind)){const facing=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.atan2(w.camera.position.x-actor.position.x,w.camera.position.z-actor.position.z));actor.quaternion.slerpQuaternions(a.q,facing,keys(u,[[0,0],[.18,1],[.84,1],[1,0]]))}let target=[.26,.70,.12],left=[-.24,.70,.10];let propQ=new T.Quaternion();
   if(a.kind==='eat'||a.kind==='drink'){
    const lift=keys(u,[[0,0],[.18,1],[.40,1],[.50,.72],[.64,1],[.80,1],[1,0]]);const rest=new T.Vector3(.25,.72,.10),mouth=new T.Vector3(a.kind==='drink'?.06:.10,a.kind==='drink'?1.24:1.22,a.kind==='drink'?.34:.22);const hand=rest.lerp(mouth,lift);target=hand.toArray();left=[-.14,.84+lift*.24,.24];const chew=u>.2&&u<.82?Math.sin(t*(a.kind==='eat'?11:6))*.018:0;actor.head.rotation.x=.06*lift+chew;actor.mouth.scale.y=1+Math.max(0,Math.sin(t*11))*.10*lift;propQ.setFromEuler(new T.Euler(a.kind==='drink'?-.85*lift:Math.sin(t*4)*.08,0,0));cap.textContent=a.kind==='drink'?'Пьём…':'Перекус';play('first',.22,a.kind);play('second',.65,a.kind);
   }else if(a.kind==='record'){
    const lift=keys(u,[[0,0],[.20,1],[.83,1],[1,0]]);target=[.39,.80+.40*lift,.15+.20*lift];left=[-.22-.1*Math.sin(t*3)*lift,1.02+Math.sin(t*4)*.15*lift,.30];actor.head.rotation.y=-.09*lift;actor.head.rotation.z=Math.sin(t*2)*.035*lift;actor.mouth.scale.y=1+Math.max(0,Math.sin(t*15))*.4*lift;const timer=document.querySelector('#recording-viewfinder span');if(timer)timer.textContent='00:'+String(Math.floor(a.time)).padStart(2,'0');propQ.setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2*lift);cap.textContent='Запись в Youpube';play('record',.2,'scan');play('stop',.9,'scan');
   }else if(a.kind==='shop'||a.kind==='salvage'){
    const lift=keys(u,[[0,0],[.28,1],[.65,1],[1,0]]);target=[.22,.7+.3*lift,.1+.25*lift];cap.textContent=a.kind==='shop'?'В корзину':'Осматриваем находку';play('pick',.35,'parcel');
   }else if(a.kind==='work'){
    const lift=keys(u,[[0,0],[.2,1],[.7,1],[1,0]]);target=[.1,.85+.20*lift,.15+.2*lift];left=[-.16,.95,.23];cap.textContent=a.options.place==='pickup'?'Проверка и упаковка':'Товар пробит';play('scan',.45,'scan');play('bag',.85,'parcel');
   }
   reachArm(actor,1,target,1);if(['eat','record','work'].includes(a.kind))reachArm(actor,0,left,.75);
   if(a.prop){actor.updateMatrixWorld(true);const hand=actor.worldToLocal(actor.hands[1].getWorldPosition(new T.Vector3()));a.prop.position.copy(hand).add(a.kind==='record'?new T.Vector3(.025,.09,.08):new T.Vector3(0,-.08,.035));a.prop.quaternion.copy(propQ);
    if(a.kind==='shop'){
     const source=a.options.source||actor.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,1,.4)),end=actor.basket.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.12,0)),held=actor.hands[1].getWorldPosition(new T.Vector3());const p=u<.55?source.clone().lerp(held,ease(u/.55)):held.clone().lerp(end,ease((u-.55)/.45));p.y+=Math.sin(u*Math.PI)*.14;a.prop.position.copy(actor.worldToLocal(p));
    }
    if(a.kind==='work'){const start=new T.Vector3(w.mode==='grocery'?-2.16:-.9,1.15,.24),end=start.clone().add(new T.Vector3(.4,.08,.2)),p=start.clone().lerp(end,ease(u));p.y+=Math.sin(u*Math.PI)*.12;a.prop.position.copy(actor.worldToLocal(p));}
   }
  }
  if(u===1){if(a.kind==='record'){document.getElementById('recording-viewfinder')?.remove();w.targetFocus.copy(a.focus);w.targetView=a.view;}if(a.prop){a.prop.removeFromParent();a.prop.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.material.map)o.material.map.dispose();o.material.dispose()}})}actor.position.copy(a.start);actor.quaternion.copy(a.q);actor.head.rotation.set(0,0,0);actor.arms.forEach(o=>o.rotation.z=0);document.getElementById('sleep-shade').style.opacity=0;cap.classList.remove('show');w.lifeAction=null;w.busy=false;a.done?.();}
 };
}
