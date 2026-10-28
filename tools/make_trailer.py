from pathlib import Path
import subprocess,json
root=Path(__file__).resolve().parents[1]
tmp=Path('/tmp/perekup-trailer');tmp.mkdir(exist_ok=True)
font=root/'web/fonts/RussoOne.ttf'
def run(args):
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',*map(str,args)],check=True)
shots=[('01-city','НАЙДИ СВОЮ СДЕЛКУ',5.0),('02-repair','ВОЗВРАЩАЙ ТЕХНИКУ К ЖИЗНИ',6.5),('03-parcels','ПОДРАБАТЫВАЙ В РАЙОНЕ',6.0),('04-home','ОБУСТРАИВАЙ СВОЙ ДОМ',5.0)]
outputs=[]
for name,caption,length in shots:
 text=tmp/(name+'.txt');text.write_text(caption)
 out=tmp/(name+'.mp4')
 vf=f'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,fps=24,setsar=1,drawbox=x=0:y=610:w=iw:h=110:color=0x143c40@0.80:t=fill,drawtext=fontfile={font}:textfile={text}:fontcolor=0xfff3d9:fontsize=32:x=(w-tw)/2:y=645,fade=t=in:st=0:d=0.18,fade=t=out:st={length-.2}:d=0.2'
 run(['-i',tmp/(name+'.webm'),'-t',length,'-vf',vf,'-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-af','aresample=48000,apad','-c:a','aac','-ar','48000','-ac','2',out]);outputs.append(out)
# A clean title card closes the actual recorded gameplay.
text1=tmp/'title.txt';text1.write_text('ПЕРЕКУП')
text2=tmp/'subtitle.txt';text2.write_text('ВТОРОЙ ШАНС')
text3=tmp/'slogan.txt';text3.write_text('Из чужого хлама — в своё дело.')
end=tmp/'05-title.mp4'
vf=f'[0:v][1:v]overlay=70:190,drawtext=fontfile={font}:textfile={text1}:fontcolor=0xfff0cb:fontsize=68:x=430:y=225,drawtext=fontfile={font}:textfile={text2}:fontcolor=0x9ddac0:fontsize=42:x=435:y=320,drawtext=fontfile={root}/web/fonts/Nunito.ttf:textfile={text3}:fontcolor=white:fontsize=30:x=435:y=420,drawtext=fontfile={root}/web/fonts/Nunito.ttf:text=Vithel · GPT-6.1 Sol:fontcolor=0xc9dbcc:fontsize=24:x=(w-tw)/2:y=650[v]'
run(['-f','lavfi','-i','color=c=0x153e42:s=1280x720:r=24:d=3','-loop','1','-i',root/'marketing/0.7/icon-512.png','-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-filter_complex',vf.replace('[0:v][1:v]overlay','[1:v]scale=280:280[icon];[0:v][icon]overlay'),'-map','[v]','-map','2:a','-t','3','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-c:a','aac',end]);outputs.append(end)
listing=tmp/'concat.txt';listing.write_text(''.join("file '"+str(p)+"'\n" for p in outputs))
joined=tmp/'joined.mp4';run(['-f','concat','-safe','0','-i',listing,'-c','copy',joined])
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(joined)]));duration=float(probe['format']['duration'])
out=root/'marketing/0.7/trailer.mp4'
run(['-i',joined,'-i',root/'web/audio/pack/music_midlife.ogg','-filter_complex',f'[0:a]volume=0.9[fx];[1:a]volume=0.24,afade=t=in:d=0.8,afade=t=out:st={duration-1.6}:d=1.6[m];[fx][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]','-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','160k','-t',duration,'-movflags','+faststart',out])
print('TRAILER_OK',round(duration,2),'seconds',out.stat().st_size,'bytes')
