import * as T from 'three';
import {product} from './products.js';
export function workshopTool(w,kind){
 const g=new T.Group(),add=(size,pos,c)=>{const o=w.box(...size,c);o.position.set(...pos);g.add(o);return o};
 if(kind==='heater'){add([.22,.19,.38],[0,.12,.06],'#c99054');add([.12,.25,.15],[0,.06,.23],'#344e58');add([.13,.13,.19],[0,.13,-.22],'#869b9d');g.userData.tip=new T.Vector3(0,.13,-.32)}
 if(kind==='brush'){add([.085,.05,.42],[0,.07,.06],'#b59366');for(let i=-2;i<=2;i++)add([.015,.055,.12],[i*.022,.045,-.19],'#ddcc9d');g.userData.tip=new T.Vector3(0,.035,-.25)}
 if(kind==='iron'){add([.095,.07,.30],[0,.07,.07],'#6b9ca6');add([.035,.035,.26],[0,.07,-.20],'#a5b4b0');add([.013,.013,.11],[0,.07,-.37],'#c3b595');g.userData.tip=new T.Vector3(0,.07,-.425)}
 if(kind==='glue'){add([.12,.085,.27],[0,.08,.06],'#d3ba75');add([.045,.045,.17],[0,.08,-.16],'#ededcf');g.userData.tip=new T.Vector3(0,.08,-.25)}
 if(kind==='meter'){add([.28,.08,.40],[0,.08,0],'#d8b74e');add([.20,.008,.13],[0,.125,-.08],'#afc6b2');for(const x of[-.07,.07]){add([.025,.025,.28],[x,.06,.36],x<0?'#b56555':'#34454d')}g.userData.tip=new T.Vector3(.07,.06,.50)}
 g.position.set(-2.75,.06,-1.30+['heater','brush','iron','glue','meter'].indexOf(kind)*.64);g.userData.tool=kind;return g;
}
export function deviceCase(w,kind){
 const root=new T.Group();root.position.set(-.3,.06,.1);root.scale.setScalar(17);w.repairScene.add(root);const display=new T.Group();root.add(display);let boardCenter=[0,.026,0],boardSize=[.115,.003,.07],batteryCenter=[-.025,.032,.012],batterySize=[.055,.008,.044],chargeCenter=[.048,.031,.035],hinge=new T.Vector3(-.065,.04,0),pivot=hinge.clone(),park=new T.Vector3(0,-.006,-.15),fasteners;
 if(kind==='speaker'){
  const mat=new T.MeshStandardMaterial({color:'#688c99',roughness:.7}),half=(top)=>{const mesh=new T.Mesh(new T.CylinderGeometry(.035,.035,.11,24,1,true,top?Math.PI/2:-Math.PI/2,Math.PI),mat);mesh.rotation.x=Math.PI/2;mesh.position.y=.04;return mesh};root.add(half(false));display.add(half(true));for(const z of[-.056,.056]){const cap=new T.Mesh(new T.CylinderGeometry(.035,.035,.004,20),new T.MeshStandardMaterial({color:'#334e59'}));cap.rotation.x=Math.PI/2;cap.position.set(0,.04,z);root.add(cap)}
  boardCenter=[0,.04,0];boardSize=[.05,.003,.08];batteryCenter=[-.006,.048,.007];batterySize=[.025,.008,.040];chargeCenter=[.02,.046,.035];hinge.set(-.034,.04,0);pivot.copy(hinge);park.set(-.095,-.003,0);fasteners=[[-.025,.064,-.038],[.025,.064,-.038],[-.025,.064,.038],[.025,.064,.038]];
 }else if(kind==='headphones'){
  const shell=product('headphones');shell.rotation.x=-Math.PI/2;shell.scale.setScalar(.135);shell.position.set(0,.023,.035);root.add(shell);shell.updateMatrixWorld(true);root.updateMatrixWorld(true);
  // The right earcup opens; the headband and left earcup stay on the mat.
  for(const o of [...shell.children])if(o.position.x>.3)display.attach(o);
  boardCenter=[.056,.026,-.011];boardSize=[.026,.003,.043];batteryCenter=[.056,.033,-.012];batterySize=[.020,.006,.027];chargeCenter=[.055,.032,.010];hinge.set(.041,.03,-.011);pivot.copy(hinge);park.set(.065,0,-.02);fasteners=[[.043,.039,-.031],[.069,.039,-.031],[.043,.039,.010],[.069,.039,.010]];
 }else{
  const body=w.box(.15,.018,.105,'#3c5661');body.position.y=.012;root.add(body);const shell=product(kind);shell.scale.setScalar(.135);shell.position.y=.014;display.add(shell);fasteners=[[-.062,.052,-.037],[.062,.052,-.037],[-.062,.052,.037],[.062,.052,.037]];
 }
 const board=w.box(...boardSize,'#2e7962');board.position.set(...boardCenter);root.add(board);
 const battery=new T.Group();const b=w.box(...batterySize,'#354b53');b.position.set(...batteryCenter);battery.add(b);root.add(battery);
 const charge=new T.Group();const c=w.box(kind==='headphones'?.015:.025,.005,.012,'#c39451');c.position.set(...chargeCenter);charge.add(c);root.add(charge);
 for(let i=0;i<2;i++){const chip=w.box(boardSize[0]*.22,.003,boardSize[2]*.18,'#9caca3');chip.position.set(boardCenter[0]+(i-.5)*boardSize[0]*.45,boardCenter[1]+.004,boardCenter[2]-boardSize[2]*.30);root.add(chip)}
 const screws=[];for(let i=0;i<4;i++){const s=new T.Group();s.add(new T.Mesh(new T.CylinderGeometry(.0022,.0015,.003,12),new T.MeshStandardMaterial({color:'#c3d0ca',metalness:.6,roughness:.3})));root.add(s);screws.push(s)}
 const connectorPositions=Array.from({length:3},(_,i)=>new T.Vector3(boardCenter[0]+(i-1)*boardSize[0]*.26,boardCenter[1]+.006,boardCenter[2]-boardSize[2]*.32));
 return {root,display,battery,charge,board,oled:null,screws,hinge,pivot,park,fasteners,connectorPositions};
}
