import * as T from 'three';
export const ease=u=>{u=T.MathUtils.clamp(u,0,1);return u*u*(3-2*u)};
export function keys(u,frames){if(u<=frames[0][0])return frames[0][1];for(let i=1;i<frames.length;i++)if(u<=frames[i][0]){const a=frames[i-1],b=frames[i];return T.MathUtils.lerp(a[1],b[1],ease((u-a[0])/(b[0]-a[0])))}return frames.at(-1)[1];}
const down=new T.Vector3(0,-1,0);
export function reachArm(actor,index,target,blend=1){
 const arm=actor.arms[index],elbow=actor.elbows?.[index];if(!elbow)return;
 const shoulder=arm.position.clone(),end=new T.Vector3(...target),v=end.sub(shoulder),length=T.MathUtils.clamp(v.length(),.055,.395),dir=v.normalize();
 const a=(.21*.21-.19*.19+length*length)/(2*length),height=Math.sqrt(Math.max(0,.21*.21-a*a));
 const bend=new T.Vector3(index?1:-1,-.15,.7).addScaledVector(dir,-new T.Vector3(index?1:-1,-.15,.7).dot(dir)).normalize();
 const joint=dir.clone().multiplyScalar(a).addScaledVector(bend,height),fore=dir.clone().multiplyScalar(length).sub(joint);
 const upperQ=new T.Quaternion().setFromUnitVectors(down,joint.normalize()),foreQ=new T.Quaternion().setFromUnitVectors(down,fore.normalize());
 arm.quaternion.slerp(upperQ,blend);elbow.quaternion.slerp(upperQ.clone().invert().multiply(foreQ),blend);
}
// Bounds for visible surfaces. Hidden exploded-model cables must not pull grips below the mat.
export function meshBounds(root){
 root.updateWorldMatrix(true,true);const box=new T.Box3();
 const visit=o=>{if(o!==root&&!o.visible)return;if(o.isMesh&&o.geometry){if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld))}for(const child of o.children)visit(child)};visit(root);return box;
}
