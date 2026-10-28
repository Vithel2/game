import * as T from 'three';
import {pathfind} from './navigation.js';
// Each resident has their own departure and return time, rather than a shared
// visibility cutoff. A resident leaves via a street exit before fading away.
export function isHomeTime(hour,index){return hour<6+index*.24||hour>=19+index*.38;}
function opacity(n,value){
 if(!n.materials){const set=new Set();n.actor.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])set.add(m)});n.materials=[...set];}
 for(const m of n.materials){if(m.transparent!==(value<1)){m.transparent=value<1;m.needsUpdate=true;}m.opacity=value;}
 n.alpha=value;n.actor.visible=value>0;
}
export function scheduleResident(n,index,hour,dt){
 n.home||={x:n.actor.position.x,z:n.actor.position.z};n.exit||={x:index%2?-4.1:24.95,z:2.55};
 const late=isHomeTime(hour,index);
 if(!n.schedule){n.schedule=late?'hidden':'active';if(late){n.actor.position.set(n.exit.x,.05,n.exit.z);opacity(n,0)}else opacity(n,1);}
 if(late&&n.schedule==='active'){n.schedule='leaving';n.route=pathfind('street',{x:n.actor.position.x,z:n.actor.position.z},n.exit,.16);}
 if(!late&&n.schedule==='hidden'){n.schedule='arriving';n.route=pathfind('street',n.exit,n.home,.16);opacity(n,.01);}
 if(!late&&n.schedule==='leaving'){n.schedule='active';n.route=pathfind('street',{x:n.actor.position.x,z:n.actor.position.z},n.home,.16);opacity(n,1);}
 if(n.schedule==='leaving'&&!n.route.length){opacity(n,Math.max(0,n.alpha-dt/.95));if(!n.alpha)n.schedule='hidden';}
 if(n.schedule==='arriving'){opacity(n,Math.min(1,n.alpha+dt/1.4));if(n.alpha===1)n.schedule='active';}
 n.goingHome=n.schedule==='leaving'||n.schedule==='hidden';
 return n.schedule!=='hidden';
}
