// Shared collision map for point-and-click paths, keyboard movement and NPCs.
export const AREAS={park:[-4.3,4.3,-3.2,3.2],room:[-1.95,5.9,-1.58,1.68],street:[-4.5,25.3,1.35,4.35],grocery:[-3.15,3.15,-2.1,2.05],pickup:[-3.45,3.45,-2.40,2.5]};
export const SOLIDS={
 park:[[.2,2.5,-1.5,.3],[-3.65,-1.95,-.55,-.05],[-3.65,-1.95,2.15,2.65],[-2.72,-2.08,-2.4,-1.9],[-3.6,-3.2,-2.4,-2.0],[3.1,3.5,-2.5,-2.1],[3.3,3.7,2.2,2.6],[-3.7,-3.3,2.1,2.5]],
 room:[[3.0,5.0,-1.3,-.5],[5.03,5.7,-1.4,-.85],[3.35,4.25,.25,.8],[-1.89,-.74,-1.57,.54],[-.46,1.06,-1.59,-.87],[1.25,1.96,-1.60,-.88],[.55,1.79,.39,1.05],[.86,1.23,1.16,1.51],[.18,.52,-.42,-.08]],
 street:[[17.5,19.3,3.6,4.2],[-2.28,2.28,-2,1.92],[3.7,9.7,-2.3,1.0],[10.45,13.85,-2.3,1.0],[2.0,3.4,2.98,3.43],[14.05,15.85,2.975,3.425],[3.06,3.14,3.76,3.84],[11.96,12.04,3.76,3.84],[15.26,15.34,3.56,3.64]],
 grocery:[[-3.05,3.05,-2.2,-1.66],[-2.85,-1.48,.15,.87],[1.25,2.65,-.75,.76],[-.60,.70,-.75,.76],[-2.7,-1.65,1.18,1.82]],
 pickup:[[-3.40,3.40,-2.4,-1.74],[-3.0,-.83,-.24,.48],[2.18,3.25,-.18,.50],[1.18,2.48,1.57,2.03]]
};
export function blocked(zone,x,z,r=.17){const b=AREAS[zone]||AREAS.room;if(x<b[0]+r||x>b[1]-r||z<b[2]+r||z>b[3]-r)return true;return (SOLIDS[zone]||[]).some(a=>x>a[0]-r&&x<a[1]+r&&z>a[2]-r&&z<a[3]+r);}
export function slide(zone,from,to,r=.17){const p={...from};if(!blocked(zone,to.x,from.z,r))p.x=to.x;if(!blocked(zone,p.x,to.z,r))p.z=to.z;return p;}
export function pathfind(zone,from,to,r=.17){
 r+=.01;
 const b=AREAS[zone]||AREAS.room,step=.17,nx=Math.ceil((b[1]-b[0])/step),nz=Math.ceil((b[3]-b[2])/step);
 const point=i=>({x:b[0]+(i%nx)*step,z:b[2]+Math.floor(i/nx)*step});
 const clear=(a,b)=>{const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.025));for(let j=0;j<=n;j++){const u=j/n;if(blocked(zone,a.x+(b.x-a.x)*u,a.z+(b.z-a.z)*u,r))return false}return true};
 const nearest=p=>{const safe=!blocked(zone,p.x,p.z,r);let best=-1,d=Infinity;for(let i=0;i<nx*nz;i++){const q=point(i);if(blocked(zone,q.x,q.z,r))continue;const t=(q.x-p.x)**2+(q.z-p.z)**2;if(t<d&&(!safe||clear(q,p))){d=t;best=i}}return best};
 const start=nearest(from),goal=nearest(to);if(start<0||goal<0)return [];
 const queue=[start],prev=new Map([[start,-1]]);let head=0;
 while(head<queue.length&&!prev.has(goal)){const i=queue[head++],x=i%nx,z=Math.floor(i/nx);for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz,j=zz*nx+xx;if(xx<0||xx>=nx||zz<0||zz>=nz||prev.has(j))continue;const p=point(j);if(blocked(zone,p.x,p.z,r))continue;prev.set(j,i);queue.push(j)}}
 if(!prev.has(goal))return [];
 const route=[];for(let j=goal;j!==start&&j!==-1;j=prev.get(j))route.push(point(j));route.push(point(start));route.reverse();
 if(!blocked(zone,to.x,to.z,r))route.push({x:to.x,z:to.z});
 // Remove collinear grid points, preserving corners so furniture is never cut through.
 return route.filter((p,i,a)=>i===0||i===a.length-1||Math.abs((p.x-a[i-1].x)*(a[i+1].z-p.z)-(p.z-a[i-1].z)*(a[i+1].x-p.x))>.0001);
}
