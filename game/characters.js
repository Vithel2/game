import * as T from 'three';
import {batchStatic} from './batching.js';

export function character({color='#bf785d',gender='male',hair='#493d35',skin='#d7aa85',name=''}={}){
 const g=new T.Group();g.userData.name=name;g.legs=[];g.arms=[];g.eyes=[];
 const material=c=>new T.MeshStandardMaterial({color:c,roughness:.85});const cloth=material(color),skinMat=material(skin),dark=material('#233d48'),hairMat=material(hair);
 function sphere(parent,r,pos,ma,scale=[1,1,1]){const o=new T.Mesh(new T.SphereGeometry(r,14,10),ma);o.position.set(...pos);o.scale.set(...scale);parent.add(o);return o}
 function capsule(parent,r,len,pos,ma){const o=new T.Mesh(new T.CapsuleGeometry(r,len,5,12),ma);o.position.set(...pos);parent.add(o);return o}
 g.body=capsule(g,.19,.28,[0,.91,0],cloth);g.body.scale.z=.75;
 sphere(g,.13,[0,1.10,-.02],cloth,[1.35,.6,1]);sphere(g,.085,[0,1.16,0],skinMat);
 g.head=sphere(g,.205,[0,1.36,0],skinMat,[.94,1.04,.93]);sphere(g,.209,[0,1.47,-.025],hairMat,[1,.62,1]);
 for(const x of[-.20,.20])sphere(g,.047,[x,1.35,0],skinMat,[.6,1,1]);
 if(gender==='female'){sphere(g,.16,[0,1.30,-.12],hairMat,[1.3,1.6,.7]);sphere(g,.10,[.12,1.42,-.22],hairMat);}
 else{for(const [x,z]of[[-.1,.1],[.02,.13],[.1,.08]])sphere(g,.075,[x,1.49,z],hairMat,[1.2,.65,.8]);}
 for(const x of[-.07,.07]){const eye=new T.Group();eye.position.set(x,1.38,.175);sphere(eye,.031,[0,0,0],material('#f9f6e8'),[1,1.2,.5]);sphere(eye,.015,[.002,0,.018],dark,[1,1.1,.6]);g.add(eye);g.eyes.push(eye);}
 sphere(g,.034,[0,1.32,.197],skinMat,[.75,.8,.9]);
 const smile=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-.035,1.275,.175),new T.Vector3(0,1.266,.185),new T.Vector3(.035,1.275,.175)]),new T.LineBasicMaterial({color:'#8f5e4c'}));g.add(smile);
 for(const x of[-.10,.10]){const leg=new T.Group();leg.position.set(x,.64,0);capsule(leg,.080,.30,[0,-.20,0],dark);sphere(leg,.09,[0,-.48,.035],material('#e1dbcb'),[1,.55,1.5]);g.add(leg);g.legs.push(leg)}
 for(const x of[-.235,.235]){const arm=new T.Group();arm.position.set(x,1.08,0);capsule(arm,.068,.20,[0,-.15,0],cloth);sphere(arm,.063,[0,-.34,0],skinMat);g.add(arm);g.arms.push(arm)}
 const zipper=new T.Mesh(new T.BoxGeometry(.015,.27,.007),material('#dfc29a'));zipper.position.set(0,.92,.151);g.add(zipper);
 g.parcel=new T.Mesh(new T.BoxGeometry(.36,.28,.27),material('#bb9463'));g.parcel.position.set(0,.83,.26);g.parcel.visible=false;g.add(g.parcel);
 g.basket=new T.Group();const base=new T.Mesh(new T.BoxGeometry(.32,.14,.23),material('#b56f50'));base.position.y=-.04;g.basket.add(base);for(const x of[-.13,.13]){const side=new T.Mesh(new T.BoxGeometry(.022,.15,.23),cloth);side.position.set(x,.07,0);g.basket.add(side)}const handle=new T.Mesh(new T.TorusGeometry(.15,.012,5,16,Math.PI),dark);handle.position.y=.14;g.basket.add(handle);g.basket.position.set(.32,.60,.12);g.basket.visible=false;g.add(g.basket);
 const fixed=new T.Group();const moving=new Set([g.body,g.head,...g.legs,...g.arms,...g.eyes,g.parcel,g.basket]);for(const o of [...g.children])if(!moving.has(o))fixed.add(o);g.add(fixed);batchStatic(fixed);
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g;
}
export function animateCharacter(g,t,walking=false,sitting=false){
 g.body.position.y=.91+(walking?Math.sin(t*12)*.017:Math.sin(t*2)*.004);
 g.legs.forEach((l,i)=>l.rotation.x=sitting?-1.35:walking?Math.sin(t*12+i*Math.PI)*.45:0);
 g.arms.forEach((a,i)=>{a.rotation.x=sitting?-.70+Math.sin(t*8+i)*.02:g.parcel.visible?-.75:walking?Math.sin(t*12+i*Math.PI+Math.PI)*.35:Math.sin(t*1.5)*.025});
 g.eyes.forEach(e=>e.scale.y=Math.sin(t*1.2)>.996?.1:1);
}
