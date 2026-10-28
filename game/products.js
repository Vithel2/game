import * as T from 'three';
export const FOOD={
 bread:{name:'Свежий хлеб',price:35,food:20,water:0,color:'#dba66b'},milk:{name:'Молоко',price:60,food:15,water:20,color:'#e9f1eb'},water:{name:'Вода',price:25,food:0,water:65,color:'#8dc5cd'},apple:{name:'Яблоки',price:45,food:20,water:8,color:'#c46a56'},cheese:{name:'Сыр',price:110,food:40,water:0,color:'#e6ca6c'},noodles:{name:'Лапша',price:75,food:40,water:0,color:'#d77350'},juice:{name:'Сок',price:50,food:8,water:50,color:'#dca56e'},sandwich:{name:'Сэндвич',price:120,food:50,water:0,hp:8,color:'#d7b786'},chips:{name:'Чипсы',price:65,food:15,water:-8,color:'#e5b853'},coffee:{name:'Кофе',price:90,food:0,water:15,energy:18,color:'#a78165'}
};
const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.65});
function box(g,size,pos,c){const m=new T.Mesh(new T.BoxGeometry(...size),mat(c));m.position.set(...pos);g.add(m);return m;}
function cyl(g,r,h,pos,c){const m=new T.Mesh(new T.CylinderGeometry(r,r*.96,h,16),mat(c));m.position.set(...pos);g.add(m);return m;}
function label(g,text,pos,w=.48,h=.20,color='#284352',bg='#f6f0dc'){
 const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,256,128);x.fillStyle=color;x.textAlign='center';x.textBaseline='middle';x.font='900 47px Nunito,sans-serif';x.fillText(text,128,64,235);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const p=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:t}));p.position.set(...pos);g.add(p);return p;
}
export function product(kind='phone',color='#708e9b'){
 const g=new T.Group();g.userData.product=kind;
 if(FOOD[kind]){
  const f=FOOD[kind];if(kind==='water'){cyl(g,.13,.54,[0,.31,0],'#a3ced1');cyl(g,.085,.09,[0,.62,0],'#f1f4e7');label(g,'ВОДА',[0,.3,.133],.25,.16,'#396c85');}
  else if(kind==='apple'){for(const [x,z]of[[-.14,.02],[.13,.04],[0,-.14]]){const a=new T.Mesh(new T.IcosahedronGeometry(.17,2),mat(f.color));a.position.set(x,.20,z);g.add(a);box(g,[.025,.08,.025],[x,.37,z],'#716b3c')}}
  else if(kind==='bread'){const loaf=new T.Mesh(new T.CapsuleGeometry(.17,.4,5,12),mat(f.color));loaf.rotation.z=Math.PI/2;loaf.position.y=.19;g.add(loaf);for(let i=-1;i<=1;i++){const cut=box(g,[.025,.013,.24],[i*.16,.34,0],'#f0ce95');cut.rotation.y=.35;}}
  else if(kind==='coffee'||kind==='noodles'){cyl(g,.2,.38,[0,.21,0],kind==='coffee'?'#b58c6c':f.color);cyl(g,.22,.04,[0,.42,0],'#eee7cf');label(g,kind==='coffee'?'КОФЕ':'ЛАПША',[0,.22,.205],.35,.16);}
  else if(kind==='sandwich'){box(g,[.6,.12,.38],[0,.08,0],'#dfbf86');box(g,[.56,.04,.36],[0,.16,0],'#88a15a');box(g,[.55,.04,.35],[0,.20,0],'#d58663');box(g,[.6,.10,.38],[0,.27,0],'#ecd19c');}
  else if(kind==='cheese'){box(g,[.5,.28,.4],[0,.16,0],f.color);for(const x of[-.14,.12]){const dot=new T.Mesh(new T.CircleGeometry(.035,10),mat('#c7a74f'));dot.position.set(x,.17,.202);g.add(dot)}}
  else{box(g,kind==='chips'?[.40,.6,.15]:[.36,.64,.32],[0,.34,0],f.color);if(kind!=='chips')box(g,[.36,.1,.30],[0,.71,0],'#b6cbbb');label(g,kind==='milk'?'МОЛОКО':kind==='juice'?'СОК':'ХРУСТ',[0,.36,kind==='chips'?.079:.163],.33,.23);}
 }else if(kind==='battery'){box(g,[.48,.09,.78],[0,.06,0],'#30464e');for(const x of[-.12,.12])box(g,[.07,.03,.10],[x,.07,-.43],'#c6a451');const p=label(g,'Li-ion',[0,.111,0],.36,.23,'#d4e9dd','#30464e');p.rotation.x=-Math.PI/2;}
 else if(kind==='charge'){box(g,[.48,.025,.12],[0,.03,.2],'#c48c3e');for(const x of[-.2,.2])box(g,[.08,.025,.4],[x,.03,0],'#c48c3e');for(const x of[-.2,.2])box(g,[.14,.07,.13],[x,.06,-.22],'#30464e');}
 else if(kind==='ram'){box(g,[.8,.12,.25],[0,.12,0],'#4d8065');for(let i=-2;i<=2;i++)box(g,[.10,.035,.17],[i*.14,.20,0],'#253e48');for(let i=-5;i<=5;i++)box(g,[.035,.02,.06],[i*.06,.06,.145],'#c7a658');}
 else if(kind==='gpu'){box(g,[.9,.14,.48],[0,.16,0],'#3d5764');for(const x of[-.23,.23]){const r=new T.Mesh(new T.TorusGeometry(.16,.025,6,20),mat('#94c3b5'));r.rotation.x=-Math.PI/2;r.position.set(x,.25,0);g.add(r);for(let k=0;k<3;k++){const blade=box(g,[.23,.02,.035],[x,.25,0],'#7d9fa1');blade.rotation.y=k*Math.PI/3}}}
 else if(kind==='ssd'){box(g,[.58,.10,.78],[0,.1,0],'#a7bec0');const l=label(g,'SSD',[0,.16,0],.43,.32,'#244552','#e8ecdd');l.rotation.x=-Math.PI/2;}
 else if(kind==='pc'){box(g,[.45,.70,.48],[.35,.36,0],'#3a5362');box(g,[.88,.54,.06],[-.35,.65,0],'#30434f');box(g,[.76,.41,.015],[-.35,.65,.04],'#699fa0');box(g,[.08,.34,.08],[-.35,.26,0],'#3d5662');box(g,[.48,.03,.25],[-.35,.08,.02],'#3d5662');}
 else if(kind==='speaker'){cyl(g,.35,.8,[0,.42,0],color);for(const y of[.12,.22,.32,.42,.52,.62,.72]){const r=new T.Mesh(new T.TorusGeometry(.352,.008,4,24),mat('#3c5965'));r.rotation.x=Math.PI/2;r.position.y=y;g.add(r)}box(g,[.24,.03,.08],[0,.84,0],'#d8dfd5');}
 else if(kind==='headphones'){const arc=new T.Mesh(new T.TorusGeometry(.42,.065,7,24,Math.PI),mat(color));arc.position.y=.48;g.add(arc);for(const x of[-.42,.42]){const ear=box(g,[.23,.40,.20],[x,.34,0],color);box(g,[.08,.30,.23],[x>0?x-.13:x+.13,.34,0],'#243c49')}}
 else if(kind==='gamepad'){box(g,[.9,.19,.45],[0,.18,0],color);for(const x of[-.38,.38]){const grip=box(g,[.25,.20,.40],[x,.16,.25],color);grip.rotation.y=x*.65;cyl(g,.085,.06,[x*.56,.3,.12],'#253c46')}for(const x of[-.34,-.25])box(g,[.10,.025,.04],[x,.30,-.09],'#a1c9bd');for(let i=0;i<4;i++)cyl(g,.035,.03,[.29+Math.sin(i*Math.PI/2)*.08,.3,-.08+Math.cos(i*Math.PI/2)*.08],['#d78872','#a8ba63','#7e9ec7','#d2bd6d'][i]);}
 else {box(g,[.52,.07,1.0],[0,.06,0],kind==='donor'?'#949d9b':color);box(g,[.47,.012,.93],[0,.102,0],'#183744');if(kind==='display'||kind==='donor'){const pts=[new T.Vector3(-.13,.11,-.23),new T.Vector3(.1,.11,.0),new T.Vector3(-.06,.11,.23)];g.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:'#b5d3d4'})))}else{box(g,[.30,.004,.06],[0,.112,.1],'#5fa9b3');box(g,[.30,.004,.04],[0,.112,.2],'#d1b373')}}
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g;
}
let thumbnails;
export function productPictures(){
 if(thumbnails)return thumbnails;thumbnails={};const r=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r.setSize(180,150);r.outputColorSpace=T.SRGBColorSpace;r.setClearColor('#e7eee8',1);const scene=new T.Scene();scene.add(new T.HemisphereLight('#ffffff','#7a8c7e',3));const l=new T.DirectionalLight('#fff4dc',3);l.position.set(2,5,3);scene.add(l);const camera=new T.OrthographicCamera(-.85,.85,.7,-.7,.01,20);camera.position.set(1.5,2.4,2.8);camera.lookAt(0,.22,0);
 for(const name of [...Object.keys(FOOD),'phone','donor','battery','charge','display','pc','ram','gpu','ssd','speaker','headphones','gamepad']){const g=product(name);scene.add(g);const bounds=new T.Box3().setFromObject(g),sphere=bounds.getBoundingSphere(new T.Sphere());const v=Math.max(.35,sphere.radius*1.15);camera.left=-v*1.2;camera.right=v*1.2;camera.top=v;camera.bottom=-v;camera.position.copy(sphere.center).add(new T.Vector3(1.5,2.4,2.8));camera.lookAt(sphere.center);camera.updateProjectionMatrix();r.render(scene,camera);thumbnails[name]=r.domElement.toDataURL('image/png');scene.remove(g)}r.dispose();return thumbnails;
}
