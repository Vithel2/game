import * as T from 'three';
import {makeSign} from './environment.js';
import {startShift,answerShift} from './progression.js';
export const PARCEL_CODES=['013','042','107','215','308','426','531','640'];
export class ParcelWork{
 constructor(api){Object.assign(this,api);this.boxes=[];}
 init(){const w=this.world();PARCEL_CODES.forEach((code,i)=>{const root=new T.Group();root.position.set(-2.35+(i%4)*1.56,.72+Math.floor(i/4)*.65,-1.96);const box=w.box(.54,.35,.38,'#b99160');root.add(box);const tape=w.box(.09,.355,.39,'#dbc494');root.add(tape);const label=makeSign(code,.34,.18,'#fff5db','#284d55');label.position.set(0,0,.197);root.add(label);root.visible=false;w.pickupScene.add(root);this.boxes.push({code,root,index:i})});const ui=document.createElement('div');ui.id='parcel-task';ui.setAttribute('aria-live','polite');document.getElementById('game').append(ui);this.ui=ui;}
 announce(a){this.toast(a.finished?'Все посылки выданы. Получи оплату у Маши.':'Маша: следующая посылка — '+a.tasks[a.index].code);this.audio.play('scan');}
 handle(action,id){const s=this.state(),w=this.world(),a=s.work.active;
  if(action==='startShift'&&w.mode==='pickup'){if(!a)startShift(s,'pickup');if(s.work.active?.place!=='pickup')return true;this.close();this.announce(s.work.active);this.persist();return true;}
  if(action==='resumePickup'){this.close();return true}
  if(action==='liftParcel'){
   if(w.mode!=='pickup'||a?.place!=='pickup'||a.finished||a.carry)return true;const item=this.boxes.find(b=>b.code===id);if(!item)return true;w.walkTo([item.root.position.x,.26,-1.33],()=>w.performLife('parcelLift',()=>{a.carry=id;this.audio.play('parcel');this.persist()},'parcel',{code:id,source:item.root.getWorldPosition(new T.Vector3()),duration:1.8}));return true;
  }
  if(action==='deliverParcel'){
   if(w.mode!=='pickup'||a?.place!=='pickup'||!a.carry||a.finished)return true;const code=a.carry;w.walkTo([-1.9,.26,1.05],()=>w.performLife('parcelGive',()=>{const ok=answerShift(s,code);a.carry=null;if(ok)this.announce(a);else{this.audio.play('error');this.toast('Это другая посылка. Нужен код '+a.tasks[a.index].code+'.');}if(a.finished)this.open('work');this.persist()},'parcel',{destination:new T.Vector3(-1.9,1.30,.12),duration:1.7}));return true;
  }
  if(action==='finishShift'&&a?.place==='pickup'){a.finished=true;a.carry=null;this.open('work');this.persist();return true;}
  return false;
 }
 targets(){const s=this.state(),w=this.world(),a=s.work.active;if(w.mode!=='pickup'||a?.place!=='pickup'||a.finished)return [];return a.carry?[{id:'deliverParcel',label:'Передать Маше · '+a.carry,position:new T.Vector3(-1.9,1.8,.35),action:'deliverParcel'}]:this.boxes.map(b=>({id:'code-'+b.code,label:b.code,position:b.root.position.clone().add(new T.Vector3(0,.26,.1)),action:'liftParcel',code:b.code}));}
 frame(dt,title){const s=this.state(),w=this.world(),a=s.work.active,working=!title&&w.mode==='pickup'&&a?.place==='pickup'&&!a.finished;this.ui.classList.toggle('show',!!working);if(working){if(!w.busy)a.remaining=Math.max(0,a.remaining-dt);const task=a.tasks[a.index];this.ui.innerHTML=`<b>Маша: посылка ${task.code}</b><span>${a.carry?'Несу '+a.carry+' → к стойке':'Найди номер на коробке и принеси к стойке'} · ${a.index+1}/5</span>`;if(!a.remaining){a.finished=true;a.carry=null;this.open('work');this.persist()}}
  const active=a?.place==='pickup'&&!a.finished;for(const b of this.boxes)b.root.visible=!!active&&a.carry!==b.code&&!(w.lifeAction?.kind==='parcelLift'&&w.lifeAction.options.code===b.code&&w.lifeAction.time/w.lifeAction.duration>.25);if(a?.place==='pickup')w.avatar.parcel.visible=!!a.carry&&!w.busy;
 }
}
