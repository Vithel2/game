import * as T from 'three';
export function workshopHand(w,left=false){
 const g=new T.Group(),skin=new T.MeshStandardMaterial({color:'#dbb393',roughness:.8}),cuff=new T.MeshStandardMaterial({color:'#527d7b',roughness:1});
 const ellipsoid=(parent,r,pos,scale,material=skin)=>{const m=new T.Mesh(new T.SphereGeometry(r,18,12),material);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m};
 ellipsoid(g,1,[0,0,.01],[.105,.050,.135]);ellipsoid(g,1,[0,-.003,.15],[.067,.043,.090]);
 // A short, bent forearm ends beside the mat instead of stretching across the whole screen.
 const sleeve=new T.Mesh(new T.CapsuleGeometry(.13,.43,5,14),cuff);sleeve.castShadow=true;w.repairScene.add(sleeve);g.syncArm=()=>{sleeve.visible=g.visible;if(!g.visible)return;const wrist=g.localToWorld(new T.Vector3(0,0,.15)),end=wrist.clone().add(new T.Vector3(left?.28:-.28,-.12,.58)),d=end.clone().sub(wrist);sleeve.position.copy(wrist).lerp(end,.5);sleeve.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());sleeve.scale.set(1,d.length()/.69,1);};
 g.fingers=[];
 for(let i=0;i<4;i++){
  const finger=new T.Group();finger.position.set(-.076+i*.050,0,-.077);g.add(finger);const length=[.080,.105,.097,.073][i];let parent=finger;
  for(let j=0;j<3;j++){const part=new T.Group();part.position.z=j===0?0:-length*.36;parent.add(part);const bone=new T.Mesh(new T.CapsuleGeometry(j===2?.019:.022,length*.20,4,10),skin);bone.rotation.x=Math.PI/2;bone.position.z=-length*.18;bone.castShadow=true;part.add(bone);if(j===0)finger.bones=[];finger.bones.push(part);parent=part;}
  g.fingers.push(finger);
 }
 const thumb=new T.Group();thumb.position.set(left?-.092:.092,-.01,.035);thumb.rotation.y=left?-.75:.75;g.add(thumb);ellipsoid(thumb,1,[0,0,-.035],[.030,.028,.055]);ellipsoid(thumb,1,[left?.015:-.015,-.006,-.086],[.025,.024,.034]);g.thumb=thumb;
 g.curl=value=>{g.fingers.forEach((f,i)=>f.bones.forEach((b,j)=>b.rotation.x=-value*(j===0?.48:.68)*(1-i*.04)));g.thumb.rotation.x=-value*.5;};
 g.scale.setScalar(2.35);w.repairScene.add(g);g.visible=false;return g;
}
