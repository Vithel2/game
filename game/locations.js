import * as T from 'three';

function textPlane(text,{w=1.5,h=.35,bg='#fff2cf',color='#43554b'}={}){
 const c=document.createElement('canvas');c.width=768;c.height=192;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.fillStyle=color;x.textAlign='center';x.textBaseline='middle';x.font='900 60px Nunito, sans-serif';x.fillText(text,c.width/2,c.height/2,720);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture}));
}
export function installLocations(world){
 const {scene,homeScene}=world;world.groceryScene=new T.Scene();world.pickupScene=new T.Scene();for(const s of[world.groceryScene,world.pickupScene]){s.background=new T.Color('#d2ded7');world.light(s)}
 // Interior copies have no exterior facade/roof. The street copies remain complete.
 for(const [key,s] of[['grocery',world.groceryScene],['pickup',world.pickupScene]]){
  const clone=world.assets[key].clone(true);clone.position.set(0,0,0);clone.traverse(o=>{if(/Roof|Front_|Window_glass|Door_|Fascia|fascia|Canopy|canopy|Entry_step|Hours_plate|Text_|Sign_|Emblem|emblem/.test(o.name)||(o.name.startsWith('Side_wall')&&o.position.x>0))o.visible=false});s.add(clone);
  const pad=world.box(key==='grocery'?4.6:3.6,.12,3.7,'#b7a687');pad.position.y=-.06;pad.receiveShadow=true;s.add(pad);
  const cashier=world.person(key==='grocery'?'#a75d52':'#426cbd');cashier.position.set(key==='grocery'?-1.35:-.95,.20,key==='grocery'?.18:.23);cashier.rotation.y=.2;s.add(cashier);
  const sign=textPlane(key==='grocery'?'СВЕЖЕЕ КАЖДЫЙ ДЕНЬ':'ПОСЫЛКИ ДЛЯ ТВОИХ ПЛАНОВ',{w:key==='grocery'?2.4:2.5,h:.32,bg:key==='grocery'?'#e0ead4':'#d7e7ff',color:key==='grocery'?'#456b4a':'#3156a0'});sign.position.set(0,2.5,-1.395);s.add(sign);
 }
 const fridge=world.box(.52,1.5,.46,'#e5eee4');fridge.position.set(1.63,.97,-1.0);world.groceryScene.add(fridge);for(let y=.5;y<1.7;y+=.28){const shelf=world.box(.44,.025,.37,'#6f998b');shelf.position.set(1.63,y,-.75);world.groceryScene.add(shelf)}
 // A complete external house: four walls, pitched roof, windows and an entrance.
 const house=new T.Group();world.houseExterior=house;scene.add(house);
 function box(w,h,d,c,x,y,z){const o=world.box(w,h,d,c);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;house.add(o);return o}
 box(4.5,.2,3.85,'#6c776c',0,0,0);box(4.3,2.8,3.65,'#d9d1b9',0,1.5,0);box(4.4,.25,3.75,'#8f9d87',0,.28,0);
 const vertices=[-2.42,2.93,2.08,2.42,2.93,2.08,0,4.0,2.08,-2.42,2.93,-2.08,2.42,2.93,-2.08,0,4.0,-2.08];
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex([0,1,2,5,4,3,0,2,5,0,5,3,2,1,4,2,4,5,3,4,1,3,1,0]);geo.computeVertexNormals();const roof=new T.Mesh(geo,new T.MeshStandardMaterial({color:'#52796b',roughness:.9}));roof.castShadow=true;house.add(roof);
 for(const x of[-1.3,1.35]){box(.84,.92,.04,'#f5edda',x,1.65,1.853);box(.69,.77,.05,'#91b6bd',x,1.65,1.88);box(.045,.82,.035,'#f8f0dc',x,1.65,1.92);box(.74,.045,.035,'#f8f0dc',x,1.65,1.92);box(.97,.06,.20,'#f1e6cb',x,1.16,1.93)}
 for(const z of[-.75,.75]){box(.045,.95,.85,'#eee5d0',2.17,1.65,z);box(.05,.78,.69,'#91b6bd',2.197,1.65,z)}
 const doorPivot=new T.Group();doorPivot.position.set(-.29,.19,1.86);house.add(doorPivot);const door=world.box(.90,1.99,.07,'#9c7650');door.position.set(.45,.995,0);doorPivot.add(door);const glass=world.box(.57,.63,.025,'#b7ccbb');glass.position.set(.45,1.49,.055);doorPivot.add(glass);const handle=world.box(.055,.14,.045,'#dcc285');handle.position.set(.77,.96,.07);doorPivot.add(handle);world.homeDoor=doorPivot;
 box(1.3,.14,.45,'#b0aa96',.16,.10,2.10);const number=textPlane('МАСТЕРСКАЯ · 12',{w:1.6,h:.28});number.position.set(.16,2.47,1.867);house.add(number);
 box(.25,.35,.16,'#b87157',.95,1.08,1.93);box(.17,.022,.025,'#685a47',.95,1.15,2.02);
 const chimney=box(.36,.9,.4,'#9f8c73',1.05,3.63,-.68);world.chimney=chimney;
 // A separate PC station in the room, with visible hardware upgrades.
 const desk=new T.Group();desk.position.set(1.15,0,.72);homeScene.add(desk);world.pcDesk=desk;
 const top=world.box(1.18,.07,.62,'#b68e60');top.position.y=.73;desk.add(top);for(const x of[-.49,.49])for(const z of[-.23,.23]){const leg=world.box(.04,.70,.04,'#53656a');leg.position.set(x,.35,z);desk.add(leg)}
 const pc=new T.Group();world.pcModel=pc;desk.add(pc);
 const monitor=world.box(.65,.40,.045,'#344a52');monitor.position.set(-.12,1.07,-.10);pc.add(monitor);const stem=world.box(.055,.12,.06,'#4e6268');stem.position.set(-.12,.82,-.11);pc.add(stem);const foot=world.box(.30,.025,.17,'#4e6268');foot.position.set(-.12,.77,-.10);pc.add(foot);
 world.pcScreen=textPlane('НОЧНОЙ КУРЬЕР',{w:.59,h:.32,bg:'#173d52',color:'#9cd8bd'});world.pcScreen.position.set(-.12,1.07,-.073);pc.add(world.pcScreen);
 const keyboard=world.box(.48,.025,.14,'#4d606b');keyboard.position.set(-.12,.785,.18);pc.add(keyboard);for(let x=-.32;x<.1;x+=.045)for(let z=.14;z<.23;z+=.035){const key=world.box(.032,.008,.024,'#c0d0c7');key.position.set(x,.803,z);pc.add(key)}
 const mouse=world.box(.06,.025,.10,'#99bbaa');mouse.position.set(.24,.785,.19);pc.add(mouse);
 const tower=world.box(.24,.48,.43,'#3c5261');tower.position.set(.41,1.0,-.02);pc.add(tower);world.pcFans=[];world.pcRamLights=[];
 for(let y=.90;y<1.20;y+=.16){const fan=new T.Group();fan.position.set(.41,y,.202);const ring=new T.Mesh(new T.TorusGeometry(.065,.006,6,20),new T.MeshStandardMaterial({color:'#83c9b1',emissive:'#437e80',emissiveIntensity:.25}));fan.add(ring);for(let i=0;i<3;i++){const blade=world.box(.09,.014,.006,'#8caabe');blade.rotation.z=i*Math.PI/3;fan.add(blade)}pc.add(fan);world.pcFans.push(fan)}
 for(let i=0;i<2;i++){const led=world.box(.17,.012,.009,'#a7d9bc');led.position.set(.41,1.23+i*.022,.205);pc.add(led);world.pcRamLights.push(led)}
 const drive=world.box(.15,.025,.10,'#b9c9c6');drive.position.set(.24,.786,-.13);pc.add(drive);world.pcSsdIndicator=drive;
 const seat=world.box(.34,.065,.34,'#b6c99c');seat.position.set(1.04,.42,1.33);homeScene.add(seat);for(const x of[.9,1.18])for(const z of[1.19,1.47]){const leg=world.box(.025,.40,.025,'#6c7e70');leg.position.set(x,.21,z);homeScene.add(leg)}
 const backrest=world.box(.34,.30,.045,'#9fb690');backrest.position.set(1.04,.67,1.49);homeScene.add(backrest);
 const empty=textPlane('МЕСТО ДЛЯ ПК',{w:.65,h:.19,bg:'#d8c8a8',color:'#7c6d55'});empty.rotation.x=-Math.PI/2;empty.position.set(0,.775,0);desk.add(empty);world.pcPlaceholder=empty;
 const board=new T.Group();board.position.set(.65,1.65,-1.67);homeScene.add(board);const back=world.box(.65,.44,.04,'#af8d5e');board.add(back);for(const [x,y,c] of[[-.17,.07,'#e2c97a'],[.08,.08,'#9dc6b1'],[-.03,-.10,'#e1a592']]){const note=world.box(.19,.13,.006,c);note.position.set(x,y,.028);note.rotation.z=x*.4;board.add(note)}
 // Ambient motion in the street: a compact car and tree crowns.
 world.sway=[];for(const [x,z]of[[-3,1.1],[13,-1.1],[-2.8,-3.0]]){const trunk=world.box(.16,1.2,.16,'#896c4f');trunk.position.set(x,.5,z);scene.add(trunk);const crown=new T.Mesh(new T.DodecahedronGeometry(.8,1),new T.MeshStandardMaterial({color:'#6e9272',roughness:1}));crown.position.set(x,1.7,z);crown.castShadow=true;scene.add(crown);world.sway.push(crown)}
 const car=new T.Group();const body=world.box(1.45,.38,.72,'#a86d58');body.position.y=.45;car.add(body);const cabin=world.box(.75,.30,.64,'#a6bec0');cabin.position.set(-.1,.78,0);car.add(cabin);for(const x of[-.47,.47])for(const z of[-.38,.38]){const wheel=new T.Mesh(new T.CylinderGeometry(.17,.17,.10,12),new T.MeshStandardMaterial({color:'#36474a'}));wheel.rotation.x=Math.PI/2;wheel.position.set(x,.29,z);car.add(wheel)}scene.add(car);world.car=car;
 world.scenes={room:homeScene,street:scene,grocery:world.groceryScene,pickup:world.pickupScene,repair:world.repairScene};
}
