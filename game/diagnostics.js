import * as T from 'three';
import {handset} from './handsets.js';
export function diagnosticReport(p,final=false){const m=handset(p),broken=!final&&!p.fixed;return {model:m.name,chip:m.chip,os:m.os,port:m.port,ram:m.ram,storage:m.storage,screen:m.screen,battery:broken&&p.defect==='battery'?8:86,watts:broken&&p.defect==='charge'?0:m.charge,download:broken&&p.defect==='charge'?0:m.network,upload:Math.round(m.network*.27),ping:broken?42:12,display:!(broken&&p.defect==='display'),final};}
export function installDiagnostic(w,c){
 if(c.diagnostic)return;
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const screen=new T.Mesh(new T.PlaneGeometry(.063,.126),new T.MeshBasicMaterial({map:texture,polygonOffset:true,polygonOffsetFactor:-1}));screen.rotation.x=-Math.PI/2;screen.position.set(0,.0390,.002);screen.visible=false;c.display.add(screen);screen.raycast=()=>{};
 c.diagnostic={canvas,texture,screen,last:''};
 w.drawDiagnostic=(p,progress=1,final=false)=>{
  if(w.activeRepair!==c||p.kind&&p.kind!=='phone')return;
  const d=c.diagnostic,r=diagnosticReport(p,final),phase=Math.floor(progress*5),key=p.id+':'+phase+':'+final;
  d.screen.visible=true;if(d.last===key)return;d.last=key;
  const ctx=canvas.getContext('2d');ctx.fillStyle=r.os.startsWith('iOS')?'#142336':'#123c35';ctx.fillRect(0,0,512,1024);ctx.textBaseline='top';
  const line=(text,y,size=25,color='#d8e9e7')=>{ctx.fillStyle=color;ctx.font=`600 ${size}px Nunito, sans-serif`;ctx.fillText(text,30,y,452)};
  line('09:41          Wi-Fi       '+r.battery+'%',22,21);line(r.os.startsWith('iOS')?'iOS · ДИАГНОСТИКА':'ANDROID · ДИАГНОСТИКА',90,23,r.os.startsWith('iOS')?'#92bdff':'#83d9b1');line(r.model,135,38,'#fff4db');
  line(r.os,185,22,'#83d9b1');line(r.chip,225,26);line(r.ram+' ГБ RAM  /  '+r.storage+' ГБ',260);line(r.screen,305,24);
  line('СВЯЗЬ · ТЕСТ СЕТИ',385,22,'#83d9b1');line(Math.round(r.download*Math.min(1,progress*2))+' Мбит/с ↓',430,46);line(r.upload+' Мбит/с ↑  ·  '+r.ping+' мс',495,24);
  line('ПИТАНИЕ',570,22,'#83d9b1');line(r.watts?r.port+' · '+r.watts+' Вт · заряд идёт':'Питание не поступает',615,26,r.watts?'#e3f2e7':'#ffb8a3');line('Аккумулятор  '+r.battery+'%',660);
  line('ЭКРАН И СЕНСОР',735,22,'#83d9b1');line(r.display?'Изображение и касания: OK':'Дисплей: нет изображения',780,25,r.display?'#e3f2e7':'#ffb8a3');
  ctx.fillStyle='#294e59';ctx.fillRect(30,870,452,10);ctx.fillStyle='#83d9b1';ctx.fillRect(30,870,452*progress,10);
  line(progress<1?['Питание…','Проверка дисплея…','Тест сети…','Проверка зарядки…','Сохраняем отчёт…'][Math.min(4,phase)]:final?'ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ':'ОТЧЁТ СОХРАНЁН',915,22,'#fff4db');texture.needsUpdate=true;
 };
}
