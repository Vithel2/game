import media from './media-data.js';

export class AudioBank {
 constructor(){this.context=null;this.buffers={};this.muted=false;this.loaded=false;this.events=0;this.step=0;}
 async unlock(){
  if(!this.context){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.context=new C();this.master=this.context.createGain();this.master.gain.value=.25;this.master.connect(this.context.destination);}
  await this.context.resume();if(this.loading)return this.loading;
  this.loading=Promise.all(Object.entries(media).map(async([key,data])=>{const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));this.buffers[key]=await this.context.decodeAudioData(bytes.buffer)})).then(()=>{this.loaded=true});return this.loading;
 }
 setMuted(value){this.muted=value;if(this.master)this.master.gain.setTargetAtTime(value?0:.25,this.context.currentTime,.08);}
 play(kind='ui'){
  if(this.muted||!this.context||this.context.state!=='running')return;
  const names={coin:'coin',reward:'coin',step:'walking',door:'land',tool:'break',plug:'land',ui:'jump',success:'coin',error:'fall',game:'coin',parcel:'land'};
  const buffer=this.buffers[names[kind]||'jump'];if(!buffer)return;
  const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;
  source.playbackRate.value=kind==='step'?.88+(this.step++%3)*.08:kind==='ui'?1.6:kind==='tool'?1.8:1;
  gain.gain.value=kind==='step'?.28:kind==='ui'?.24:kind==='tool'?.28:.6;
  source.connect(gain);gain.connect(this.master);const offset=kind==='step'?Math.min(.1+(this.step%3)*.18,buffer.duration*.4):0;
  source.start(0,offset,Math.min(kind==='step'?.16:kind==='ui'?.12:kind==='tool'?.18:1.2,buffer.duration-offset));this.events++;
 }
}
export const audio=new AudioBank();
