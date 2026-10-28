import assert from 'node:assert/strict';
import {stageFor,screwMask,connectorMask} from '../game/repair-rules.js';
import {renameLegacy,handset} from '../game/handsets.js';
import {diagnosticReport} from '../game/diagnostics.js';
import {presentedHit} from '../game/precision.js';
for(const difficulty of ['quick','standard','advanced','expert']){
 const p={difficulty,diagnosed:true,out:screwMask({difficulty}),warmed:true,open:true,disconnected:connectorMask({difficulty}),cleaned:true,removed:true,installed:true,soldered:true,connected:connectorMask({difficulty})};
 assert.equal(stageFor(p),'tighten');p.inside=screwMask(p);assert.equal(stageFor(p),['advanced','expert'].includes(difficulty)?'seal':'close');p.sealed=true;assert.equal(stageFor(p),'close');p.closed=true;p.calibrated=true;assert.equal(stageFor(p),'test');p.fixed=true;assert.equal(stageFor(p),'done');
}
assert.equal(renameLegacy({name:'R / 02 · после дождя'}).name,'Qubo Neo 10 · после дождя');
assert.equal(handset({name:'Qubo Neo 10'}).ram,12);
assert.equal(diagnosticReport({defect:'charge'}).watts,0);
assert.equal(diagnosticReport({name:'Qubo Neo 10',defect:'charge'},true).watts,120);
assert.equal(diagnosticReport({defect:'display'}).display,false);
const root=(left,right)=>({querySelector:s=>({getBoundingClientRect:()=>s==='.skill-needle'?{left,right}:{left:30,right:50,width:20}})});
assert.equal(presentedHit(root(39,43)),true);assert.equal(presentedHit(root(72,76)),false);assert.equal(presentedHit(root(28,32)),true);
console.log('PASS: screw-before-seal ordering at four levels, names, diagnostic failure/success, presented needle boundaries');
