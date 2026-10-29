import * as T from 'three';
import {batchStatic} from './batching.js';
import {character} from './characters.js';
import {seasonFor,skyPhase} from './progression.js';
export function installEnvironment(w){
 const add=(parent,size,pos,color)=>{const o=w.box(...size,color);o.position.set(...pos);o.castShadow=o.receiveShadow=true;parent.add(o);return o};
 const landscape=new T.Group();w.scene.add(landscape);w.cityDecor=landscape;
 add(landscape,[11,.10,3.3],[20,-.10,2.7],'#c9cfc4');add(landscape,[12,.10,2.4],[20,-.15,5.3],'#667778');
 for(const x of[18,21,24])add(landscape,[1.3,.008,.08],[x,-.09,5.3],'#eee8d2');
 for(const [x,height,color]of[[18,5.4,'#b5b2a2'],[23,7,'#9eafb1'],[28,5.8,'#b1bca5']]){
  add(landscape,[3.5,height,3],[x,height/2,-4.6],color);add(landscape,[3.7,.15,3.2],[x,height,-4.6],'#637a75');
  for(let y=1;y<height-.3;y+=1.15)for(const dx of[-1,0,1])add(landscape,[.55,.65,.03],[x+dx,y,-3.08],'#b9ced0');
 }
 add(landscape,[1.8,.10,.45],[18.4,.5,3.9],'#b88f65');for(const x of[17.8,19])add(landscape,[.06,.46,.35],[x,.24,3.9],'#54716b');
 for(const x of[17.4,19.5])add(landscape,[.06,2.4,.06],[x,1.2,4.25],'#5d7473');
 const label=makeSign('СКВЕР',1.1,.36,'#e3ecd2','#3d6252');label.position.set(21.5,2.05,1.4);w.scene.add(label);for(const x of[20.9,22.1])add(landscape,[.07,1.8,.07],[x,.9,1.4],'#6c8064');
 // The living room shares a real, walkable floor with the original workshop.
 const living=new T.Group();w.livingRoom=living;w.homeScene.add(living);add(living,[3.8,.18,3.5],[3.85,-.07,0],'#ad9478');
 for(let z=-1.35;z<1.4;z+=.89)for(let x=2.1;x<5.6;x+=.35)add(living,[.34,.025,.88],[x,.033,z],'#c2a583');
 add(living,[3.8,2.45,.10],[3.85,1.20,-1.70],'#c9d9cd');
 add(living,[1.6,1.0,.06],[4.0,1.45,-1.635],'#f1ebdc');add(living,[1.44,.84,.07],[4,1.45,-1.59],'#94b6bd');
 add(living,[1.95,.42,.75],[4,.32,-.9],'#648f83');add(living,[1.95,.65,.14],[4,.77,-1.22],'#6c9a8a');for(const x of[3.08,4.92])add(living,[.18,.42,.75],[x,.64,-.9],'#82a997');for(const x of[3.55,4.45])add(living,[.68,.10,.57],[x,.57,-.84],'#a5c5ab');
 add(living,[1.95,.014,1.45],[3.9,.06,.53],'#b0b5a4');add(living,[.85,.06,.5],[3.8,.48,.52],'#b28e65');for(const x of[3.48,4.12])for(const z of[.37,.67])add(living,[.035,.42,.035],[x,.24,z],'#657873');
 add(living,[.6,1.7,.33],[5.37,.87,-1.17],'#a1845f');for(let y=.36;y<1.8;y+=.38){add(living,[.56,.03,.35],[5.37,y,-1.17],'#d5bc92');for(let j=0;j<4;j++)add(living,[.08,.23,.18],[5.18+j*.12,y+.13,-1.12],['#638c87','#b88065','#d3b979','#8093a7'][j])}
 add(living,[.04,1.6,.04],[2.6,.8,-1.15],'#607974');const shade=new T.Mesh(new T.ConeGeometry(.27,.35,16,1,true),new T.MeshStandardMaterial({color:'#f1dbb4',side:T.DoubleSide}));shade.position.set(2.6,1.64,-1.15);living.add(shade);w.plant(5.35,.98,living);batchStatic(living);
 w.parkScene=new T.Scene();w.parkScene.background=new T.Color('#b9d3cb');w.light(w.parkScene);w.scenes.park=w.parkScene;const park=new T.Group();w.parkScene.add(park);
 w.parkGround=add(park,[9,.16,7],[0,-.08,0],'#92ae85');add(park,[1.2,.02,6.3],[-1.2,.015,0],'#c2bda6');add(park,[7,.02,1.0],[0,.02,1.8],'#c2bda6');
 add(park,[2.2,.12,1.8],[1.35,.03,-.6],'#899b8f');const water=add(park,[2.02,.025,1.62],[1.35,.105,-.6],'#74a9b2');water.material.roughness=.2;w.pond=water;
 for(const [x,z]of[[-3.4,-2.2],[3.3,-2.3],[3.5,2.4],[-3.5,2.3]]){add(park,[.18,1.2,.18],[x,.6,z],'#92775b');const crown=new T.Mesh(new T.DodecahedronGeometry(.85,1),new T.MeshStandardMaterial({color:'#729c68'}));crown.position.set(x,1.75,z);crown.castShadow=true;w.parkScene.add(crown);w.sway.push(crown)}
 for(const z of[-.3,2.4]){add(park,[1.55,.08,.45],[-2.8,.48,z],'#b8946c');for(const x of[-3.35,-2.25])add(park,[.05,.44,.3],[x,.22,z],'#61776b')}
 const crate=add(park,[.58,.42,.48],[-2.4,.24,-2.15],'#ac8b63');add(park,[.6,.05,.5],[-2.4,.48,-2.15],'#ccb389');w.salvageCrate=crate;
 for(const z of[-3.35,3.35])for(let x=-4.3;x<4.4;x+=.45)if(!(z>0&&x>-.7&&x<.8))add(park,[.08,.5,.08],[x,.25,z],'#8c9a82');
 w.parkGround.removeFromParent();w.pond.removeFromParent();batchStatic(park);w.parkScene.add(w.parkGround,w.pond);batchStatic(landscape);
 const oldZone=w.setZone.bind(w);w.setZone=(zone,instant=false,spawn=null)=>{const prev=w.mode;oldZone(zone,instant,zone==='street'&&prev==='park'?[21.5,.05,2.35]:spawn);if(zone==='room'){w.targetFocus.set(1.5,.75,0);w.targetView=7.2}if(zone==='street'){w.targetFocus.set(T.MathUtils.clamp(w.avatar.position.x+2.7,2,21),.9,1);w.targetView=10.5}if(zone==='park'){w.avatar.position.set(0,.05,2.7);w.targetFocus.set(0,.7,0);w.targetView=8.3}if(instant)w.focus.copy(w.targetFocus)};
 w.snowRoofs=[];for(const [x,z,width,depth]of[[6.7,-.6,6.05,3.30],[12.1,-.6,3.43,3.23]]){const roof=add(w.scene,[width,.035,depth],[x,3.09,z],'#e5eeed');roof.visible=false;w.snowRoofs.push(roof)}
 const roofShape=w.houseExterior.children.find(o=>o.isMesh&&o.geometry.attributes.position.count===6);if(roofShape){const snow=new T.Mesh(roofShape.geometry.clone(),new T.MeshStandardMaterial({color:'#e5eeed',roughness:1}));snow.position.y=.025;snow.visible=false;w.houseExterior.add(snow);w.snowRoofs.push(snow)}
 w.windowMats=[];w.scene.traverse(o=>{if(o.isMesh&&o.material?.color&&['b9ced0','d8cdae','829fa4'].includes(o.material.color.getHexString())&&!w.windowMats.includes(o.material)){o.material.emissive.set('#edc58c');w.windowMats.push(o.material)}});
 w.environmentLights=Object.values(w.scenes).map(scene=>({scene,sun:scene.children.find(o=>o.isDirectionalLight),hemi:scene.children.find(o=>o.isHemisphereLight)}));
 const count=90,positions=new Float32Array(count*3);for(let i=0;i<count;i++){positions[i*3]=(i*1.713%32)-5;positions[i*3+1]=(i*.481)%7;positions[i*3+2]=(i*1.391%10)-3}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));w.snow=new T.Points(geo,new T.PointsMaterial({color:'#f6fafb',size:.07,transparent:true,opacity:.7,depthWrite:false}));w.scene.add(w.snow);w.snowPark=w.snow.clone();w.snowPark.geometry=w.snow.geometry.clone();w.parkScene.add(w.snowPark);
 w.lampGlows=[];for(const x of[3.1,12,20]){const lamp=new T.PointLight('#ffdcb0',0,6,1.5);lamp.position.set(x,2.4,3.2);w.scene.add(lamp);w.lampGlows.push(lamp)}
 w.updateClimate=(dt)=>{
  const s=w.gameState;if(!s)return;const season=seasonFor(s.day),phase=skyPhase(s.time),outdoors=w.mode==='street'||w.mode==='park';w.climate={season:season.id,seasonName:season.name,phase:phase.name,dark:phase.dark};
  if(w.mode==='street'&&w.lifeAction?.kind!=='record'){w.targetFocus.x=T.MathUtils.clamp(w.avatar.position.x+2.7,2,21);w.targetFocus.z=1;}
  if(w.mode==='room'&&w.lifeAction?.kind!=='record'){const max=w.roomExtent||2.2;w.targetFocus.set((max-2.2)/2,1.0,0);}
  if(w.mode==='room'&&!w.lifeAction){const level=s.house?.level||0;w.targetView=level>=2?8.3:level===0?6.6:7.2;}const alpha=1-Math.exp(-dt*2.5);if(w.lifeAction?.kind!=='sleep')for(const l of w.environmentLights){const outdoor=l.scene===w.scene||l.scene===w.parkScene;if(l.scene===w.repairScene)continue;const sky=new T.Color(phase.sky||season.sky);if(l.scene.background)l.scene.background.lerp(outdoor?sky:new T.Color(phase.dark>.6?'#9fadaf':'#d5dfd5'),alpha);if(l.scene.fog)l.scene.fog.color.copy(l.scene.background);if(l.sun){l.sun.intensity=T.MathUtils.lerp(l.sun.intensity,outdoor?3.2-phase.dark*2.95:2.8-phase.dark*1.25,alpha);l.sun.color.lerp(new T.Color(phase.sun),alpha)}if(l.hemi)l.hemi.intensity=outdoor?2.3-phase.dark*1.6:2.3-phase.dark*.45;}
  for(const crown of w.sway)crown.material.color.lerp(new T.Color(season.leaf),alpha);w.floor.material.color.lerp(new T.Color(season.ground),alpha);w.parkGround.material.color.lerp(new T.Color(season.ground),alpha);for(const lamp of w.lampGlows)lamp.intensity=phase.dark*3;
  for(const roof of w.snowRoofs)roof.visible=season.id==='winter'&&!(roof.parent===w.houseExterior&&s.house?.level>=2);for(const material of w.windowMats)material.emissiveIntensity=phase.dark*.45;w.snow.visible=w.snowPark.visible=season.id==='winter';if(season.id==='winter'){for(const cloud of[w.snow,w.snowPark]){const a=cloud.geometry.attributes.position;for(let i=0;i<a.count;i++){a.array[i*3+1]-=dt*.65;a.array[i*3]+=dt*.12;if(a.array[i*3+1]<0)a.array[i*3+1]=7}a.needsUpdate=true}}w.pond.material.color.lerp(new T.Color(season.id==='winter'?'#b4d6dd':'#74a9b2'),alpha);w.pond.position.y=.105+Math.sin(w.clock.elapsedTime*.7)*.003;
 };
 w.extraTargets=()=>w.mode==='room'&&w.gameState?.house?.level>0?[{id:'sofa',label:'Отдохнуть',position:new T.Vector3(4,1.35,-.8),action:'sofa'},{id:'story-board',label:'Моя история',position:new T.Vector3(5.3,1.9,-1.0),action:'story'}]:w.mode==='street'?[{id:'park',label:'Сквер',position:new T.Vector3(21.5,2.3,1.4),action:'park'}]:w.mode==='park'?[{id:'parkExit',label:'В район',position:new T.Vector3(0,.7,2.8),action:'parkExit'},{id:'salvage',label:'Старая техника',position:new T.Vector3(-2.4,1.15,-2.15),action:'salvage'},{id:'parkRest',label:'Посидеть',position:new T.Vector3(-2.8,1.4,-.3),action:'parkRest'}]:[];
}
export function makeSign(text,width=1.4,height=.35,bg='#f2ecd9',ink='#3b5552'){
 const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,512,128);x.fillStyle=ink;x.font='900 62px Nunito,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,65,490);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map:texture}));
}
