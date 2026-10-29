import * as T from 'three';
import {product,FOOD} from './products.js';
import {batchStatic} from './batching.js';
import {character,animateCharacter} from './characters.js';
import {pathfind,blocked,slide,AREAS} from './navigation.js';
import {faceTravel} from './steering.js';

export const DOORS={room:[.15,.05,2.35],grocery:[6.59,.05,1.65],pickup:[12.22,.05,1.65]};
export function installNeighborhood(w){
 const ring=new T.Mesh(new T.TorusGeometry(.21,.015,7,28),new T.MeshBasicMaterial({color:'#e7a247'}));ring.rotation.x=Math.PI/2;ring.position.set(0,.03,.5);w.homeScene.add(ring);w.trainingRing=ring;w.profile={name:'Мастер',gender:'male',perk:'maker'};w.waypoints=[];w.pedestrians=[];w.friends=[];w.productPicks=[];w.busy=false;w.shoppingBusy=false;w.seller.visible=false;
 const replaceAvatar=profile=>{const old=w.avatar,newHero=character({color:profile.gender==='female'?'#ac796c':'#688d8d',gender:profile.gender,name:profile.name});newHero.position.copy(old.position);newHero.rotation.copy(old.rotation);old.parent?.add(newHero);old.removeFromParent();w.avatar=newHero;w.profile={...profile};w.basketKey=null;};
 w.setProfile=replaceAvatar;
 w.assets.grocery.scale.x=1.35;w.assets.grocery.position.x=6.7;w.assets.pickup.position.x=12.1;
 // A wider grocery with aligned stock, a basket station and accessible aisles.
 const shop=w.groceryScene;for(const child of [...shop.children])if(!child.isLight)shop.remove(child);
 const add=(parent,size,pos,color)=>{const m=w.box(...size,color);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
 add(shop,[6.6,.18,4.8],[0,.1,0],'#b8c7bd');add(shop,[6.5,.03,4.6],[0,.205,0],'#e0e5da');add(shop,[6.6,2.7,.12],[0,1.57,-2.25],'#e3dfd0');add(shop,[.12,2.7,4.7],[-3.23,1.57,0],'#9db6b0');
 const clerk=character({gender:'female',color:'#a96651',hair:'#756052',name:'Тамара'});clerk.position.set(-2.2,.23,-.05);shop.add(clerk);w.shopClerk=clerk;
 add(shop,[1.38,.85,.7],[-2.16,.65,.5],'#4d7a6f');add(shop,[1.48,.07,.79],[-2.16,1.11,.5],'#344f52');add(shop,[.21,.10,.18],[-1.95,1.19,.48],'#34454d');
 add(shop,[1.0,.14,.60],[-2.18,.30,1.5],'#c7baa0');for(let i=0;i<3;i++){const basket=makeBasket(w);basket.position.set(-2.18,.42+i*.12,1.5);shop.add(basket)}
 const foods=Object.keys(FOOD);for(let i=0;i<foods.length;i++){
  const id=foods[i],x=-2.75+(i%5)*1.18,y=.75+Math.floor(i/5)*.70,z=-1.86;
  add(shop,[1.08,.04,.55],[x,y-.13,z],'#9aaea0');for(let j=0;j<3;j++){const item=product(id);item.scale.setScalar(.51);item.position.set(x-.32+j*.32,y,z);item.userData.food=id;shop.add(item);w.productPicks.push(item)}
 }
 for(const x of[0,1.95]){add(shop,[1.3,.75,1.45],[x,.60,0],'#b6a17a');add(shop,[1.4,.045,1.52],[x,1.0,0],'#e0caa1');}
 for(const [x,id]of[[0,'apple'],[1.95,'bread']])for(let i=0;i<6;i++){const p=product(id);p.scale.setScalar(.50);p.position.set(x-.40+(i%3)*.40,1.04,-.35+Math.floor(i/3)*.65);p.userData.food=id;shop.add(p);w.productPicks.push(p)}
 w.shopBasket=null;w.spawnBasketItem=(id,source)=>{const item=product(id);item.scale.setScalar(.25);shop.add(item);const start=source?.getWorldPosition(new T.Vector3())||new T.Vector3(0,1.1,0);item.position.copy(start);w.gestures.push({obj:item,from:start,to:w.avatar.position.clone().add(new T.Vector3(.30,.7,.1)),time:0,duration:.65,discard:true,basket:true})};
 // Background streets, housing blocks, public space and several pedestrians.
 const city=new T.Group();w.scene.add(city);const pavement=add(city,[22,.10,2.8],[6,-.105,2.5],'#c9cfc4');pavement.receiveShadow=true;
 for(const [x,z,width,height,color]of[[-6,-3,3.5,5.8,'#a9b9b2'],[2,-7,4.5,7.2,'#b6b3a7'],[8,-7,4.2,5.5,'#a9b6bc'],[15,-5,4.0,6.5,'#a5b2a3'],[21,-3,4,4.8,'#b5ada4']]){
  add(city,[width,height,3.8],[x,height/2-.1,z],color);add(city,[width+.2,.18,4],[x,height,z],'#637a75');
  for(let ix=-1;ix<=1;ix++)for(let iy=0;iy<Math.floor(height/1.3);iy++)add(city,[.55,.7,.03],[x+ix*width*.26,.85+iy*1.25,z+1.92],iy%2?'#d8cdae':'#829fa4');
 }
 for(const x of[-5,0,5,10,15,20]){add(city,[1.2,.01,.16],[x,-.087,6.1],'#e1dfcd');}
 add(city,[1.8,.1,.45],[14.95,.46,3.2],'#ad8961');for(const x of[14.35,15.55])add(city,[.06,.43,.35],[x,.22,3.2],'#5b716c');
 const sign=add(city,[.07,1.8,.07],[15.3,.9,3.6],'#607c77');add(city,[.65,.52,.08],[15.3,1.80,3.6],'#7299ac');
 batchStatic(city);
 for(let i=0;i<6;i++){const npc=character({gender:i%2?'female':'male',color:['#967d78','#8c9b71','#617c9a','#c99a6b','#8b7eaa','#678d84'][i],hair:i%2?'#8e6a49':'#4b463c'});npc.position.set(-2.8+i*3,.05,2.5);w.scene.add(npc);w.pedestrians.push({actor:npc,zone:'street',next:i*.7,route:[],speed:.65+i*.05})}
 for(let i=0;i<3;i++){const npc=character({color:['#bf9d69','#718c9b','#a77d8d'][i],gender:i%2?'female':'male'});npc.position.set(...[[-1.05,.23,-.6],[.95,.23,-1.20],[2.75,.23,1.55]][i]);npc.rotation.y=i===2?Math.PI:0;shop.add(npc);w.pedestrians.push({actor:npc,zone:'grocery',next:12+i*4,route:[],speed:.45})}
 for(const [id,name,x,z,color]of[['lev','Лев',-2.85,2.8,'#99725b'],['denis','Денис',14.5,2.1,'#63899b'],['liza','Лиза',9.8,2.2,'#a37892']]){const actor=character({name,color,gender:id==='liza'?'female':'male'});actor.position.set(x,.05,z);w.scene.add(actor);w.friends.push({id,name,actor})}
 const baseSet=w.setZone.bind(w);w.setZone=(zone,instant=false,spawn=null)=>{const previous=w.mode;baseSet(zone,instant);w.waypoints=[];if(zone==='street'){w.targetFocus.set(6,1.0,0);w.targetView=12.3;w.avatar.position.fromArray(spawn||DOORS[previous]||DOORS.room)}if(zone==='room')w.avatar.position.set(0,.05,1.25);if(zone==='grocery'){w.targetFocus.set(0,.85,-.1);w.targetView=6.6;w.avatar.position.set(-1.05,.23,1.65)}if(zone==='pickup'){w.avatar.position.set(0,.26,2.15);w.targetFocus.set(0,1.0,-.1);w.targetView=7.4;}};
 w.isBlocked=(x,z)=>blocked(w.mode,x,z);w.walkTo=(target,done)=>{if(w.busy)return;const from={x:w.avatar.position.x,z:w.avatar.position.z},to={x:target[0],z:target[2]};const route=pathfind(w.mode,from,to);w.waypoints=route.map(p=>new T.Vector3(p.x,target[1],p.z));w.avatarGoal=w.waypoints.shift()||null;w.walkCallback=done;if(!w.avatarGoal&&Math.hypot(from.x-to.x,from.z-to.z)<.25)done?.()};
 w.bounds=()=>AREAS[w.mode]||AREAS.room;
 w.setMeeting=offer=>{if(w.seller){w.seller.removeFromParent()}w.seller=character({gender:offer?.seller==='Марина'||offer?.seller==='Алина'?'female':'male',color:['#688e9c','#af895f','#a57990'][(offer?.seller?.length||0)%3],name:offer?.seller||''});w.seller.position.set(3.7,.05,2.1);w.seller.visible=!!offer;w.scene.add(w.seller);w.meeting=offer;w.sellerLeaving=false;};
 w.dismissSeller=()=>{w.meeting=null;w.sellerLeaving=true};
 w.updatePeople=(dt,t)=>{
  const zone=w.mode,r=.17;let moving=false;w.trainingRing.visible=!!w.trainingMove;w.trainingRing.scale.setScalar(1+Math.sin(t*4)*.12);if(w.wasSeated&&!w.seated&&!w.lifeAction)w.avatar.position.set(.4,.05,1.3);w.wasSeated=w.seated;if(w.seated&&zone==='room'&&!w.lifeAction)w.avatar.position.lerp(new T.Vector3(1.04,.05,1.33),Math.min(1,dt*6));
  if(!w.blocked&&!w.busy&&!w.transitioning&&zone!=='repair'){
   const dir=new T.Vector3((w.keys.KeyD?1:0)-(w.keys.KeyA?1:0),0,(w.keys.KeyS?1:0)-(w.keys.KeyW?1:0));const speed=2.4*(w.profile.perk==='runner'?1.25:1)*((w.avatar.parcel.visible||w.avatar.basket.visible)&&w.profile.perk!=='strong'?.85:1);
   if(dir.lengthSq()){
    w.avatarGoal=null;w.waypoints=[];w.walkCallback=null;dir.normalize();
    const p=slide(zone,{x:w.avatar.position.x,z:w.avatar.position.z},{x:w.avatar.position.x+dir.x*dt*speed,z:w.avatar.position.z+dir.z*dt*speed},r),dx=p.x-w.avatar.position.x,dz=p.z-w.avatar.position.z;
    if(faceTravel(w.avatar,dx,dz,dt)){moving=Math.hypot(dx,dz)>.001;w.avatar.position.x=p.x;w.avatar.position.z=p.z;}
   }
   if(w.avatarGoal){const d=w.avatarGoal.clone().sub(w.avatar.position);if(d.length()<.04){w.avatar.position.copy(w.avatarGoal);w.avatarGoal=w.waypoints.shift()||null;if(!w.avatarGoal){const cb=w.walkCallback;w.walkCallback=null;cb?.();w.onAction('moved')}}else{
    const step=d.clone().multiplyScalar(Math.min(1,dt*speed/d.length())),pos=slide(zone,{x:w.avatar.position.x,z:w.avatar.position.z},{x:w.avatar.position.x+step.x,z:w.avatar.position.z+step.z},r),dx=pos.x-w.avatar.position.x,dz=pos.z-w.avatar.position.z;
    if(faceTravel(w.avatar,dx,dz,dt)){moving=Math.hypot(dx,dz)>.001;w.avatar.position.set(pos.x,w.avatarGoal.y,pos.z);}
   }}
   if(moving&&t-(w.lastStep||0)>.34){w.lastStep=t;w.onAction('step')}
  }
  if(!w.lifeAction)animateCharacter(w.avatar,t,moving,w.seated);
  w.updateCitizens?.(dt,t);
  animateCharacter(w.shopClerk,t,false);if(w.seller?.visible){animateCharacter(w.seller,t,w.sellerLeaving);if(w.sellerLeaving){w.seller.position.x+=dt*1.3;w.seller.rotation.y=Math.PI/2;if(w.seller.position.x>15){w.seller.visible=false;w.sellerLeaving=false}}}
  for(const f of w.friends)animateCharacter(f.actor,t,!!f.route?.length);
 };
 w.performLife=(kind,done,item=null)=>{
  if(w.busy)return;w.busy=true;w.avatarGoal=null;w.waypoints=[];const actor=w.avatar,start=actor.position.clone(),q=actor.quaternion.clone(),duration=kind==='sleep'?4.4:kind==='record'?3.2:2.1;
  const prop=kind==='sleep'?null:product(item||(kind==='drink'?'water':kind==='record'?'phone':'sandwich'));if(prop){prop.scale.setScalar(kind==='record'?.25:.38);prop.position.set(0,-.34,.07);actor.arms[1].add(prop)}
  const action={kind,time:0,duration,actor,start,q,prop,done};w.lifeAction=action;const caption=document.getElementById('life-caption');caption.classList.add('show');
 };
 w.updateLife=(dt,t)=>{const a=w.lifeAction;if(!a)return;a.time+=dt;const u=Math.min(1,a.time/a.duration),actor=a.actor;const cap=document.getElementById('life-caption');
  if(a.kind==='sleep'){
   const blend=u>.86?(1-u)/.14:Math.min(1,u/.20);actor.position.lerpVectors(a.start,new T.Vector3(-1.3,.72,.35),blend);actor.quaternion.slerpQuaternions(a.q,new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,0,0)),blend);actor.legs.forEach(l=>l.rotation.x=0);actor.arms.forEach(l=>l.rotation.x=0);actor.eyes.forEach(e=>e.scale.y=.12);
   const phase=u<.25?'Устраиваемся поудобнее…':u<.45?'19:30 · Вечер':u<.72?'01:10 · Ночь':u<.9?'05:40 · Рассвет':'09:00 · Новое утро';cap.textContent=phase;if(u>.25)w.onAction('clockPreview',phase.split(' · ')[0]);const darkness=u<.3?0:u<.65?(u-.3)/.35:u<.9?1-(u-.65)/.25:0;document.getElementById('sleep-shade').style.opacity=darkness*.64;
   for(const s of[w.homeScene,w.scene])s.traverse(o=>{if(o.isDirectionalLight){o.intensity=3.2-darkness*2.7;o.color.set(darkness>.5?'#9fb4e3':'#fff1ce')}});
  }else{const f=Math.sin(u*Math.PI);actor.arms[1].rotation.x=-1.95*f;actor.arms[1].rotation.z=-.15*f;actor.head.rotation.x=.08*f;cap.textContent=a.kind==='drink'?'Пьём воду…':a.kind==='record'?'Снимаем влог для YouTech…':'Небольшой перекус…';if(a.kind==='record')actor.arms[0].rotation.x=-.5*Math.sin(t*5);}
  if(u===1){a.prop?.removeFromParent();actor.position.copy(a.start);actor.quaternion.copy(a.q);actor.head.rotation.x=0;document.getElementById('sleep-shade').style.opacity=0;cap.classList.remove('show');w.lifeAction=null;w.busy=false;a.done?.();}
 };
 w.refreshBasket=items=>{const key=JSON.stringify(items);if(key===w.basketKey)return;w.basketKey=key;for(const c of [...w.avatar.basket.children])if(c.userData.basketFood){c.removeFromParent();c.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.map?.dispose();o.material.dispose()}})}let n=0;for(const [id,count]of Object.entries(items))for(let j=0;j<count&&n<8;j++,n++){const item=product(id);item.userData.basketFood=true;item.scale.setScalar(.16);item.position.set(-.08+(n%2)*.15,.04+Math.floor(n/4)*.09,-.04+Math.floor(n/2)%2*.09);w.avatar.basket.add(item)}};
 w.groceryTargets=()=>[{id:'basket',label:'Взять корзину',position:new T.Vector3(-2.18,1.15,1.5),action:'takeBasket'},...Object.keys(FOOD).map((id,i)=>({id:'food-'+id,label:FOOD[id].name+' · '+FOOD[id].price+' ₽',position:new T.Vector3(-2.75+(i%5)*1.18,1.15+Math.floor(i/5)*.70,-1.55),action:'addFood',food:id})),{id:'shopCounter',label:'Тамара · касса',position:new T.Vector3(-2.16,1.95,.5),action:'shopCounter'}];
}
function makeBasket(w){const g=new T.Group();const base=w.box(.55,.15,.35,'#b96d4c');g.add(base);for(const x of[-.25,.25]){const side=w.box(.025,.17,.35,'#658c76');side.position.set(x,.12,0);g.add(side)}return g}
