import * as T from 'three';
const up=new T.Vector3(0,1,0);
// Life poses can leave Euler angles at (PI, y, PI). Always steer a pure yaw quaternion.
export function faceTravel(actor,dx,dz,dt){
 if(Math.hypot(dx,dz)<1e-7)return true;
 const target=new T.Quaternion().setFromAxisAngle(up,Math.atan2(dx,dz));
 actor.quaternion.slerp(target,1-Math.exp(-dt*9));
 const forward=new T.Vector3(0,0,1).applyQuaternion(actor.quaternion);return (forward.x*dx+forward.z*dz)/Math.hypot(dx,dz)>.80;
}
