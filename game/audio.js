import media from './media-data.js';
export class AudioBank {
 constructor(){this.context=null;this.buffers={};this.muted=false;this.loaded=false;this.events=0;this.step=0;this.settings={music:.30,effects:.7};this.theme='home';this.musicTracks={};this.musicGeneration=0;this.trackIndex=0;this.tracksPlayed=0;this.trackStarted=0;}
 async decode(key){if(this.buffers[key])return this.buffers[key];const bytes=Uint8Array.from(atob(media[key]),c=>c.charCodeAt(0));return this.buffers[key]=await this.context.decodeAudioData(bytes.buffer);}
 async unlock(){
  if(!this.context){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.context=new C();this.master=this.context.createGain();this.fx=this.context.createGain();this.musicBus=this.context.createGain();this.fx.connect(this.master);this.musicBus.connect(this.master);this.master.connect(this.context.destination);this.applyLevels();}
  await this.context.resume();if(!this.loading)this.loading=Promise.all(Object.keys(media).filter(k=>!k.startsWith('music_')).map(k=>this.decode(k))).then(()=>{this.loaded=true;this.setTheme(this.theme,true)});return this.loading;
 }
 applyLevels(duck=false){if(!this.context)return;const t=this.context.currentTime;this.master.gain.setTargetAtTime(this.muted?0:1,t,.08);this.fx.gain.setTargetAtTime(this.settings.effects*.6,t,.1);this.musicBus.gain.setTargetAtTime(this.settings.music*(duck?.30:.55),t,.5);}
 setLevels(settings){Object.assign(this.settings,settings);this.applyLevels(this.ducked);}
 setMuted(v){this.muted=v;this.applyLevels(this.ducked);}
 duck(v){if(this.ducked===v)return;this.ducked=v;this.applyLevels(v);}
 async setTheme(theme,force=false){
  this.theme=theme;
  // A theme change never restarts the same song. The playlist rotates independently of location.
  if(!this.context||!this.loaded||this.musicKey&&!force)return;
  if(!this.musicKey)this.trackIndex=['repair','night'].includes(theme)?1:0;
  return this.startTrack(['music_midlife','music_self'][this.trackIndex%2]);
 }
 async startTrack(key){
  const generation=++this.musicGeneration;this.musicKey=key;
  const buffer=await this.decode(key);if(generation!==this.musicGeneration)return;
  const old=this.musicSource,oldGain=this.musicGain,source=this.context.createBufferSource(),gain=this.context.createGain(),now=this.context.currentTime;
  source.buffer=buffer;source.loop=false;source.connect(gain);gain.connect(this.musicBus);gain.gain.value=0;gain.gain.linearRampToValueAtTime(1,now+2);source.start();this.musicSource=source;this.musicGain=gain;this.trackStarted=now;this.tracksPlayed++;
  source.onended=()=>{source.disconnect();gain.disconnect();if(this.musicSource===source){this.musicSource=null;this.nextTrack()}};
  if(old){oldGain.gain.cancelScheduledValues(now);oldGain.gain.setTargetAtTime(0,now,.5);old.stop(now+3)}
 }
 nextTrack(){if(!this.context||!this.loaded)return;this.trackIndex++;return this.startTrack(['music_midlife','music_self'][this.trackIndex%2]);}
 update(){if(this.context?.state==='running'&&this.musicSource&&this.context.currentTime-this.trackStarted>=85)this.nextTrack();}

 play(kind='ui'){
  if(this.muted||!this.context||this.context.state!=='running')return;const variant=String(this.step++%2).padStart(3,'0');const names={coin:'confirmation_001',reward:'confirmation_003',step:'footstep_wood_'+variant,streetStep:'footstep_concrete_'+variant,grassStep:'footstep_grass_000',snowStep:'footstep_snow_000',door:'impactWood_light_000',tool:'impactMetal_light_000',plug:'switch_001',ui:'click_001',open:'open_001',close:'close_001',success:'confirmation_003',error:'error_001',game:'select_001',parcel:'impactSoft_medium_000',scan:'confirmation_001',brush:'scratch_001',eat:'impactSoft_medium_000',drink:'impactGlass_light_000',heat:'scratch_001',solder:'tick_001'};
  const buffer=this.buffers[names[kind]||'click_001']||this.buffers.jump;if(!buffer)return;const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;source.playbackRate.value=kind==='tool'?1.1+(this.step++%3)*.09:kind.includes('Step')||kind==='step'?.93+(this.step%3)*.06:1;gain.gain.value=kind.includes('Step')||kind==='step'?.34:kind==='tool'?.22:kind==='ui'?.4:.65;source.connect(gain);gain.connect(this.fx);source.start();source.onended=()=>{source.disconnect();gain.disconnect()};this.events++;
 }
}
export const audio=new AudioBank();
