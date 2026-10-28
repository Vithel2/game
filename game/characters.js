import * as T from 'three';
import {batchStatic} from './batching.js';
export function character({color='#bf785d',gender='male',hair='#493d35',skin='#d7aa85',name=''}={}){
 const g=new T.Group();Object.assign(g,{legs:[],knees:[],arms:[],elbows:[],hands:[],eyes:[]});g.userData.name=name;
 const material=c=>new T.MeshStandardMaterial({color:c,roughness:.85}),cloth=material(color),skinMat=material(skin),dark=material('#233d48'),hairMat=material(hair),shoe=material('#e1dbcb');
 function sphere(parent,r,pos,ma,scale=[1,1,1]){const o=new T.Mesh(new T.SphereGeometry(r,14,10),ma);o.position.set(...pos);o.scale.set(...scale);parent.add(o);return o}
 function capsule(parent,r,len,pos,ma){const o=new T.Mesh(new T.CapsuleGeometry(r,len,4,10),ma);o.position.set(...pos);parent.add(o);return o}
 g.body=capsule(g,.19,.28,[0,.91,0],cloth);g.body.scale.z=.75;sphere(g,.085,[0,1.16,0],skinMat);
 g.head=new T.Group();g.head.position.set(0,1.36,0);g.add(g.head);const head=g.head;
 sphere(head,.205,[0,0,0],skinMat,[.94,1.04,.93]);sphere(head,.209,[0,.11,-.025],hairMat,[1,.62,1]);
 for(const x of[-.20,.20])sphere(head,.047,[x,-.01,0],skinMat,[.6,1,1]);
 if(gender==='female'){sphere(head,.16,[0,-.06,-.12],hairMat,[1.3,1.6,.7]);sphere(head,.10,[.12,.06,-.22],hairMat)}else for(const [x,z]of[[-.1,.1],[.02,.13],[.1,.08]])sphere(head,.075,[x,.13,z],hairMat,[1.2,.65,.8]);
 for(const x of[-.07,.07]){const eye=new T.Group();eye.position.set(x,.02,.175);sphere(eye,.031,[0,0,0],material('#f9f6e8'),[1,1.2,.5]);sphere(eye,.015,[.002,0,.018],dark,[1,1.1,.6]);head.add(eye);g.eyes.push(eye)}
 sphere(head,.034,[0,-.04,.197],skinMat,[.75,.8,.9]);g.mouth=new T.Group();head.add(g.mouth);g.mouth.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-.035,-.085,.175),new T.Vector3(0,-.094,.185),new T.Vector3(.035,-.085,.175)]),new T.LineBasicMaterial({color:'#8f5e4c'})));
 const face=new T.Group();for(const o of [...head.children])if(!g.eyes.includes(o)&&o!==g.mouth)face.add(o);head.add(face);batchStatic(face);
 for(const x of[-.10,.10]){const leg=new T.Group();leg.position.set(x,.64,0);capsule(leg,.076,.15,[0,-.13,0],dark);const knee=new T.Group();knee.position.y=-.255;leg.add(knee);capsule(knee,.068,.19,[0,-.16,0],dark);sphere(knee,.09,[0,-.34,.035],shoe,[1,.55,1.5]);g.add(leg);g.legs.push(leg);g.knees.push(knee)}
 for(const x of[-.235,.235]){const arm=new T.Group();arm.position.set(x,1.08,0);capsule(arm,.067,.11,[0,-.105,0],cloth);const elbow=new T.Group();elbow.position.y=-.21;arm.add(elbow);capsule(elbow,.058,.075,[0,-.080,0],cloth);const hand=new T.Group();hand.position.y=-.19;elbow.add(hand);sphere(hand,.059,[0,0,0],skinMat);g.add(arm);g.arms.push(arm);g.elbows.push(elbow);g.hands.push(hand)}
 const zipper=new T.Mesh(new T.BoxGeometry(.015,.27,.007),material('#dfc29a'));zipper.position.set(0,.92,.151);g.add(zipper);
 g.parcel=new T.Mesh(new T.BoxGeometry(.36,.28,.27),material('#bb9463'));g.parcel.position.set(0,.83,.26);g.parcel.visible=false;g.add(g.parcel);
 g.basket=new T.Group();const base=new T.Mesh(new T.BoxGeometry(.32,.14,.23),material('#b56f50'));base.position.y=-.04;g.basket.add(base);for(const x of[-.13,.13]){const side=new T.Mesh(new T.BoxGeometry(.022,.15,.23),cloth);side.position.set(x,.07,0);g.basket.add(side)}const handle=new T.Mesh(new T.TorusGeometry(.15,.012,5,16,Math.PI),dark);handle.position.y=.14;g.basket.add(handle);g.basket.position.set(.32,.60,.12);g.basket.visible=false;g.add(g.basket);
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g;
}
export function animateCharacter(g,t,walking=false,sitting=false){
 const dt=Math.min(.15,t-(g.userData.lastT||t));g.userData.lastT=t;g.userData.gait=T.MathUtils.damp(g.userData.gait||0,walking?1:0,12,dt);const gait=g.userData.gait,speed=g.userData.pace||1,phase=t*9*speed;g.body.position.y=.91+(walking?Math.sin(phase*2)*.012:Math.sin(t*2)*.004);g.body.rotation.z=walking?Math.sin(phase)*.025:0;
 g.legs.forEach((l,i)=>{const s=Math.sin(phase+i*Math.PI);l.rotation.x=sitting?-1.35:s*.42*gait;g.knees[i].rotation.x=sitting?.85:Math.max(0,-s)*.65*gait});
 g.arms.forEach((a,i)=>{a.rotation.set(sitting?-.70:g.parcel.visible?-.70:g.basket.visible&&i===1?-.22:Math.sin(phase+i*Math.PI+Math.PI)*.28*gait+Math.sin(t*1.5)*.025*(1-gait),0,0);g.elbows[i].rotation.set(g.parcel.visible?-.65:g.basket.visible&&i===1?-.4:walking?-.18:0,0,0)});
 g.head.rotation.set(0,walking?Math.sin(phase*.25)*.045:Math.sin(t*.45)*.055,0);g.eyes.forEach(e=>e.scale.y=Math.sin(t*1.2)>.996?.1:1);g.mouth.scale.y=1;
}
