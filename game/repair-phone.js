import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
// Dimensions are metres; the workshop magnifies the whole handset uniformly.
export function buildHandset(w){
 const old=w.phone,root=new T.Group();root.position.copy(old.position);root.scale.copy(old.scale);root.position.y=.028-.012*root.scale.y;old.removeFromParent();w.repairScene.add(root);
 const mats={};const mat=(color,metal=0)=>mats[color]||=(new T.MeshStandardMaterial({color,roughness:metal?.38:.73,metalness:metal}));
 const box=(parent,size,pos,color,r=.001)=>{const m=new T.Mesh(new RoundedBoxGeometry(...size,2,r),mat(color));m.position.set(...pos);parent.add(m);m.castShadow=m.receiveShadow=true;return m};
 box(root,[.076,.008,.153],[0,.016,0],'#273b43',.004);
 box(root,[.070,.002,.147],[0,.021,0],'#889a9e',.003);
 // Raised frame, with the battery and board actually seated inside it.
 for(const x of[-.036,.036])box(root,[.0025,.012,.150],[x,.026,0],'#536a71');
 for(const z of[-.074,.074])box(root,[.072,.012,.0025],[0,.026,z],'#536a71');
 box(root,[.064,.0025,.039],[0,.025,-.050],'#2f7463');
 box(root,[.025,.004,.021],[-.009,.029,-.050],'#9aa9a8');
 for(let i=0;i<6;i++)box(root,[.003,.0015,.003],[.008+(i%3)*.006,.028,-.060+Math.floor(i/3)*.008],'#263a42',.0003);
 for(let i=0;i<2;i++){const lens=new T.Group();lens.position.set(-.024+i*.014,.032,-.057);root.add(lens);const ring=new T.Mesh(new T.CylinderGeometry(.006,.006,.005,16),mat('#263940'));lens.add(ring);const glass=new T.Mesh(new T.CylinderGeometry(.0043,.0043,.0008,16),mat('#205264',.4));glass.position.y=.0028;lens.add(glass)}
 const battery=new T.Group();root.add(battery);box(battery,[.054,.005,.076],[0,.027,.010],'#34464d',.002);box(battery,[.043,.0003,.055],[0,.0298,.010],'#a6b2ae',.001);
 for(let i=0;i<3;i++)box(battery,[.019-i*.004,.0002,.0007],[-.006,.0301,.002+i*.004],'#627774',.0001);
 box(battery,[.007,.001,.004],[.021,.029,-.027],'#c7a860');
 const charge=new T.Group();root.add(charge);box(charge,[.060,.0025,.016],[0,.026,.060],'#347f70');box(charge,[.011,.004,.007],[0,.028,.070],'#b3bfc0');box(charge,[.022,.003,.009],[-.018,.028,.059],'#273a43');
 // Short central interconnect is tucked against the shield, never stretched across the open case.
 box(root,[.006,.0005,.090],[.029,.030,.009],'#b88f4e',.0004);
 const display=new T.Group();root.add(display);box(display,[.073,.0035,.150],[0,.036,0],'#182b35',.004);
 const screen=box(display,[.067,.0007,.138],[0,.0383,0],'#17313b',.003);w.oled=screen;
 box(display,[.012,.0004,.0015],[0,.0388,-.065],'#5d7479',.0005);
 const screws=[];for(let i=0;i<8;i++){const g=new T.Group();g.position.set(i%2?.031:-.031,.036,-.063+Math.floor(i/2)*.042);root.add(g);const head=new T.Mesh(new T.CylinderGeometry(.0018,.0018,.0012,12),mat('#b7c4c3',.5));g.add(head);for(const angle of[0,Math.PI/2]){const slot=box(g,[.0022,.0002,.00035],[0,.0007,0],'#43575d',.00005);slot.rotation.y=angle}const stem=new T.Mesh(new T.CylinderGeometry(.0006,.0006,.003,8),mat('#899a9b',.5));stem.position.y=-.0015;g.add(stem);screws.push(g)}
 Object.assign(w,{phone:root,display,battery,charge,screws});return {root,display,battery,charge,oled:screen,screws,hinge:new T.Vector3(-.035,.036,0),pivot:new T.Vector3(-.035,.036,0),park:new T.Vector3(-.105,-.010,0),flexEnds:[new T.Vector3(-.015,.034,.045),new T.Vector3(.015,.034,.045)]};
}
export function visibleDriver(w){
 const old=w.assets.driver,g=new T.Group();g.position.copy(old.position);old.removeFromParent();w.repairScene.add(g);
 const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.5,metalness:c==='#c2cdd0'?.65:.08});
 const cylinder=(r1,r2,length,z,color,n=16)=>{const m=new T.Mesh(new T.CylinderGeometry(r1,r2,length,n),mat(color));m.rotation.x=Math.PI/2;m.position.z=z;g.add(m);return m};
 cylinder(.014,.014,.30,.27,'#c2cdd0');cylinder(.021,.005,.05,.43,'#c2cdd0',6);
 cylinder(.058,.047,.35,-.055,'#315c77',10);cylinder(.060,.060,.055,-.24,'#ddb05d');cylinder(.040,.050,.035,.135,'#d9ad62');
 // The orange index stripe and dark grip ribs make axial rotation readable.
 for(let i=0;i<6;i++){const a=i*Math.PI/3,rib=new T.Mesh(new T.CapsuleGeometry(.008,.23,3,7),mat(i===0?'#ffab52':'#203d50'));rib.rotation.x=Math.PI/2;rib.position.set(Math.sin(a)*.055,Math.cos(a)*.055,-.055);g.add(rib)}
 const capIndex=new T.Mesh(new T.BoxGeometry(.045,.014,.004),mat('#25445a'));capIndex.position.set(.012,0,-.269);g.add(capIndex);
 const marker=new T.Mesh(new T.SphereGeometry(.014,10,8),mat('#fff1c9'));marker.position.set(0,.063,-.15);g.add(marker);
 g.userData={tip:new T.Vector3(0,0,.455),grip:new T.Vector3(0,0,-.015)};w.assets.driver=g;
}
