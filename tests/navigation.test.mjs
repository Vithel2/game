import assert from 'node:assert/strict';
import {blocked,pathfind,slide} from '../game/navigation.js';
for(const [zone,start,goal] of [['room',{x:0,z:1.25},{x:.3,z:-1.3}],['room',{x:0,z:1.25},{x:.3,z:-.65}],['street',{x:.15,z:2.35},{x:12.22,z:1.48}],['grocery',{x:-1.05,z:1.65},{x:1.97,z:-1.25}],['pickup',{x:.15,z:1.35},{x:.05,z:.7}]]){
 const path=pathfind(zone,start,goal);assert.ok(path.length,zone+' must have a route');let prev=start;
 for(const p of path){assert.equal(blocked(zone,p.x,p.z),false,zone+' waypoint inside solid');const length=Math.hypot(p.x-prev.x,p.z-prev.z),n=Math.ceil(length/.02);for(let i=1;i<=n;i++){const x=prev.x+(p.x-prev.x)*i/n,z=prev.z+(p.z-prev.z)*i/n;assert.equal(blocked(zone,x,z),false,zone+' path cuts through furniture')}prev=p;}
 console.log('PASS: '+zone+' route avoids all solids');
}
let p={x:-1.3,z:1.2};for(let i=0;i<100;i++)p=slide('room',p,{x:p.x,z:p.z-.05});assert.ok(p.z>.7);assert.equal(blocked('room',p.x,p.z),false);
console.log('PASS: keyboard sliding cannot walk through bed');
for(const [zone,start,delta,check]of[
 ['street',{x:2.5,z:2.45},{x:0,z:.05},p=>p.z<2.82],
 ['room',{x:1.5,z:1.55},{x:0,z:-.05},p=>p.z>1.21],
 ['grocery',{x:-1.25,z:.5},{x:-.05,z:0},p=>p.x>-1.32]
]){let p=start;for(let i=0;i<100;i++)p=slide(zone,p,{x:p.x+delta.x,z:p.z+delta.z});assert.ok(check(p),zone+' must stop at the bench, table or counter');assert.equal(blocked(zone,p.x,p.z),false)}
console.log('PASS: street bench, home table and grocery counter block movement');
