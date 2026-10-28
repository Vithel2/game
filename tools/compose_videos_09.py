"""Add titles and mix the captured, simulation-timed game sounds with music."""
from pathlib import Path
import subprocess, json, sys, os
import numpy as np
root=Path(__file__).resolve().parents[1]
kind=sys.argv[1] if len(sys.argv)>1 else 'trailer'
tmp=Path('/tmp/perekup09-'+kind);manifest=json.loads((tmp/'manifest.json').read_text());clips=manifest['clips'];fps=clips[0]['fps'];width=clips[0]['width'];height=clips[0]['height'];outputs=[]
font=root/'web/fonts/RussoOne.ttf';small=root/'web/fonts/Nunito.ttf'
def run(args):subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',*map(str,args)],check=True)
for i,c in enumerate(clips):
 text=tmp/(c['name']+'.txt');text.write_text(c['caption']);out=tmp/(c['name']+'-title.mp4')
 if kind=='trailer':
  y=120;size=29;filters=f'drawbox=x=380:y=100:w=1500:h=82:color=0x11343f@0.88:t=fill,drawbox=x=380:y=100:w=7:h=82:color=0xf0b05f:t=fill,drawtext=fontfile={font}:textfile={text}:fontcolor=0xfff2d9:fontsize={size}:x=410:y={y}'
 else:
  y=42;filters=f'drawbox=x=400:y=18:w=1160:h=82:color=0x102f3b@0.93:t=fill,drawtext=fontfile={small}:textfile={text}:fontcolor=0xfff2d9:fontsize=27:x=425:y={y}'
 if kind=='trailer' and c['name']=='06-home':filters='zoompan=z=1+0.00045*on:x=(iw-iw/zoom)/2:y=(ih-ih/zoom)/2:d=1:s=1920x1080:fps=60,'+filters
 filters+=f',fade=t=in:st=0:d=0.10,fade=t=out:st={max(.1,c["seconds"]-.10)}:d=0.10'
 if not (os.environ.get('COMPOSE_RESUME') and out.exists() and out.stat().st_size>=1000):run(['-i',c['path'],'-vf',filters,'-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-r',fps,out])
 outputs.append(out)
if kind=='trailer':
 for name,text in [('name','ПЕРЕКУП'),('sub','ВТОРОЙ ШАНС'),('slogan','Из чужого хлама — в своё дело.'),('platforms','ОФЛАЙН · ANDROID И WINDOWS'),('credits','Vithel · создано с помощью GPT-6.1 Sol')]: (tmp/(name+'.txt')).write_text(text)
 out=tmp/'outro.mp4'
 vf=f'[1:v]scale=310:310[icon];[0:v][icon]overlay=x=260:y=330+8*sin(t*2):shortest=1,drawtext=fontfile={font}:textfile={tmp}/name.txt:fontcolor=0xfff2d9:fontsize=91:x=670:y=335,drawtext=fontfile={font}:textfile={tmp}/sub.txt:fontcolor=0x9bd5bd:fontsize=60:x=675:y=455,drawtext=fontfile={small}:textfile={tmp}/slogan.txt:fontcolor=white:fontsize=37:x=680:y=570,drawtext=fontfile={small}:textfile={tmp}/platforms.txt:fontcolor=0xe9c27e:fontsize=30:x=(w-tw)/2:y=775,drawtext=fontfile={small}:textfile={tmp}/credits.txt:fontcolor=0xaec9c6:fontsize=24:x=(w-tw)/2:y=975,fade=t=in:d=0.25,fade=t=out:st=2.6:d=0.4[v]'
 run(['-f','lavfi','-i',f'color=c=0x153e48:s={width}x{height}:r={fps}:d=3','-loop','1','-framerate',fps,'-i',root/'marketing/0.7/icon-512.png','-filter_complex',vf,'-map','[v]','-t','3','-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p',out]);outputs.append(out)
listing=tmp/'concat.txt';listing.write_text(''.join("file '"+str(p)+"'\n" for p in outputs));joined=tmp/'joined.mp4';run(['-f','concat','-safe','0','-i',listing,'-c','copy',joined])
info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(joined)]));duration=float(info['format']['duration']);expected=sum(c['seconds'] for c in clips)+(3 if kind=='trailer' else 0);assert abs(duration-expected)<=1/fps,f'Incomplete video: {duration}, expected {expected}';rate=48000
music=root/'web/audio/pack'/('music_midlife.ogg' if kind=='trailer' else 'music_self.ogg')
def pcm(path,speed=1):
 args=['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ar',str(rate),'-ac','2']
 if speed!=1:args+=['-af',f'asetrate={round(rate*speed)},aresample={rate}']
 return np.frombuffer(subprocess.check_output(args+['pipe:1']),dtype='<f4').reshape(-1,2)
size=round(duration*rate);audio=np.zeros((size,2),np.float32);m=pcm(music);n=min(len(m),size);audio[:n]+=m[:n]*(.19 if kind=='trailer' else .12);offset=0.;cache={};count=0
for clip in clips:
 for event in clip['events']:
  key=(event['key'],round(event.get('rate',1),2));source=root/'web/audio/pack'/(key[0]+'.ogg')
  if not source.exists():continue
  if key not in cache:cache[key]=pcm(source,key[1])
  sound=cache[key];start=round((offset+max(0,event['time']))*rate);n=min(len(sound),size-start)
  if n>0:audio[start:start+n]+=sound[:n]*event['volume']*1.6;count+=1
 offset+=clip['seconds']
fade=min(rate,size);audio[:fade]*=np.linspace(0,1,fade)[:,None];end=min(rate*2,size);audio[-end:]*=np.linspace(1,0,end)[:,None];audio=np.clip(audio,-.97,.97);raw=tmp/'mix.f32';audio.astype('<f4').tofile(raw)
out=root/'marketing/0.9'/('trailer-1080p60.mp4' if kind=='trailer' else 'tutorial.mp4')
run(['-i',joined,'-f','f32le','-ar',rate,'-ac','2','-i',raw,'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','256k','-t',duration,'-movflags','+faststart',out])
(root/'marketing/0.9'/(kind+'-capture.json')).write_text(json.dumps({'width':width,'height':height,'fps':fps,'duration':duration,'captured_game_sound_events':count,'captured_simulation_frames':sum(round(c['seconds']*fps) for c in clips),'method':'fixed-step actual game simulation, one render per output frame; no interpolation','clips':[{'name':c['name'],'seconds':c['seconds'],'hashes':c['hashes']} for c in clips]},ensure_ascii=False,indent=2))
print('VIDEO_OK',kind,width,height,fps,'duration',duration,'FX events',count,'bytes',out.stat().st_size)
