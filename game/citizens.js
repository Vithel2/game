import * as T from 'three';
import {pathfind,slide} from './navigation.js';
import {animateCharacter} from './characters.js';
import {faceTravel} from './steering.js';
export function installCitizens(w){
 const shopLoop=[[-1.05,-1.25],[.96,-1.25],[2.85,-1.25],[2.85,1.55],[.94,1.65],[-1.05,1.65]];
 const streetStops=[[-3.1,2.5],[.4,2.45],[3.8,2.7],[6.5,1.7],[9.9,2.5],[12.4,1.7],[15.5,2.6],[20.2,2.7],[23.5,2.4]];
 w.pedestrians.forEach((n,i)=>{n.id=i;n.stop=i%6;n.next=2+i*1.8;n.route=[];n.actor.userData.pace=n.speed/.7;if(n.zone==='grocery')n.actor.basket.visible=true;});
 w.updateCitizens=(dt,t)=>{
  const occupied=w.staffWorking||(w.mode==='grocery'&&Math.hypot(w.avatar.position.x+2.2,w.avatar.position.z+.05)<.65);const targetClerk=new T.Vector3(occupied?-2.85:-2.2,.23,occupied?-.65:-.05);w.shopClerk.position.lerp(targetClerk,Math.min(1,dt*3));
  const list=w.pedestrians.filter(n=>n.zone===w.mode),hour=(w.gameState?.time||540)/60;
  for(const n of list){
   const late=n.zone==='street'&&(hour<6||hour>=23)&&n.id>1;n.actor.visible=!late;if(late)continue;
   if(t>n.next&&!n.route.length){const stops=n.zone==='grocery'?shopLoop:streetStops;n.stop=(n.stop+1)%stops.length;const [x,z]=stops[n.stop];n.route=pathfind(n.zone,{x:n.actor.position.x,z:n.actor.position.z},{x,z},.16);n.next=t+3.5+(n.id%3)*1.3;}
   let moving=false;if(n.route.length){const goal=n.route[0],delta=new T.Vector3(goal.x-n.actor.position.x,0,goal.z-n.actor.position.z);if(delta.length()<.10)n.route.shift();else{
    const velocity=delta.clone().normalize().multiplyScalar(n.speed),others=[...list.filter(o=>o!==n&&o.actor.visible).map(o=>o.actor),...(w.mode===n.zone?[w.avatar]:[])];
    for(const actor of others){const away=n.actor.position.clone().sub(actor.position);away.y=0;const d=away.length();if(d<.70&&d>.001){const push=away.multiplyScalar((.70-d)/(d*.70));velocity.addScaledVector(push,.85);if(d<.37&&velocity.dot(delta)>0){const side=new T.Vector3(-delta.z,0,delta.x).normalize().multiplyScalar(n.id%2?1:-1);velocity.multiplyScalar(.15).addScaledVector(side,.38)}}}
    const p=slide(n.zone,{x:n.actor.position.x,z:n.actor.position.z},{x:n.actor.position.x+velocity.x*dt,z:n.actor.position.z+velocity.z*dt},.16);const dx=p.x-n.actor.position.x,dz=p.z-n.actor.position.z;moving=false;if(faceTravel(n.actor,dx,dz,dt)){moving=Math.hypot(dx,dz)>.002;n.actor.position.x=p.x;n.actor.position.z=p.z;}

   }}
   animateCharacter(n.actor,t+n.id*.37,moving);if(!moving&&n.zone==='grocery')n.actor.head.rotation.y=Math.sin(t*.7+n.id)*.18;
  }
  for(const f of w.friends){const delta=w.avatar.position.clone().sub(f.actor.position);if(w.mode==='street'&&delta.length()<2.0){const target=Math.atan2(delta.x,delta.z);f.actor.rotation.y+=Math.atan2(Math.sin(target-f.actor.rotation.y),Math.cos(target-f.actor.rotation.y))*Math.min(1,dt*4)}}
 };
}
