"""Generate an original instrumental bed; no samples from user-supplied music."""
from pathlib import Path
import numpy as np, wave
rate=48000;seconds=45;audio=np.zeros((rate*seconds,2),np.float32)
notes=[60,64,67,72,57,60,64,69,53,57,60,65,55,59,62,67]
for i in range(90):
 n=notes[i%len(notes)];t=np.arange(int(rate*.45))/rate;f=440*2**((n-69)/12)
 tone=(np.sin(2*np.pi*f*t)+.2*np.sin(4*np.pi*f*t))*np.exp(-t*8)*np.minimum(t/.012,1)*.15
 start=i*rate//2;audio[start:start+len(tone),0]+=tone;audio[start:start+len(tone),1]+=tone*.85
 if i%2==0:
  t=np.arange(int(rate*.48))/rate;bass=440*2**((notes[(i//8)*4%16]-24-69)/12);tone=np.sin(2*np.pi*bass*t)*np.exp(-t*5)*np.minimum(t/.015,1)*.12
  audio[start:start+len(tone)]+=tone[:,None]
out=Path('/tmp/perekup12-original-music.wav');out.parent.mkdir(exist_ok=True,parents=True)
with wave.open(str(out),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate);w.writeframes((np.clip(audio,-.95,.95)*32767).astype('<i2').tobytes())
print('ORIGINAL_MUSIC_OK',out)
