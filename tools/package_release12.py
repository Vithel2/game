"""Build the public test distribution from explicit inputs; never include signing files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
root=Path(__file__).resolve().parents[1]
files={
 'README.txt':root/'marketing/0.12/README.txt',
 'android/perekup-0.12-debug.apk':root/'releases/perekup-0.12-debug.apk',
 'windows/Perekup-0.12-Setup.exe':root/'releases/Perekup-0.12-Setup.exe',
 'windows/perekup-0.12-windows-portable.zip':root/'releases/perekup-0.12-windows-portable.zip',
 'browser/perekup-second-chance-0.12.zip':root/'releases/perekup-second-chance-0.12.zip',
 'store/ru-store-listing.md':root/'marketing/0.12/ru-store-listing.md',
 'store/privacy-policy.md':root/'marketing/0.12/privacy-policy.md',
 'store/privacy.html':root/'marketing/0.12/privacy.html',
 'validation-0.12.md':root/'docs/validation-0.12.md'}
for name in ['icon-512.png','trailer-1080p60.mp4','trailer-capture.json','media-credits.txt']:
 files['media/'+name]=root/'marketing/0.12'/name
for folder in ['mobile','pc']:
 for file in sorted((root/'marketing/0.12'/folder).glob('*.png')):files['media/'+folder+'/'+file.name]=file
for file in [root/'web/THREE-LICENSE.txt',root/'web/fonts/Nunito-OFL.txt',root/'web/fonts/RussoOne-OFL.txt',root/'web/audio/Kenney-LICENSE.md',root/'web/audio/Kenney-impact-CC0.txt',root/'web/audio/Kenney-interface-CC0.txt',root/'web/audio/SOURCES.md']:
 files['licenses/'+file.name]=file
hashes=[]
for name,path in files.items():
 assert path.is_file() and path.stat().st_size>0,path
 assert not any(x in name.lower() for x in ['.jks','.keystore','password','private']),name
 hashes.append(hashlib.sha256(path.read_bytes()).hexdigest()+'  '+name)
out=root/'releases/perekup-0.12-public.zip'
with ZipFile(out,'w',ZIP_DEFLATED) as z:
 for name,path in files.items():z.write(path,name)
 z.writestr('SHA256SUMS.txt','\n'.join(hashes)+'\n')
with ZipFile(out) as z:assert z.testzip() is None
(root/'releases/perekup-0.12-public.zip.sha256').write_text(hashlib.sha256(out.read_bytes()).hexdigest()+'  '+out.name+'\n')
print('PUBLIC_ZIP_OK',len(files),'files,',round(out.stat().st_size/1024/1024,2),'MiB; debug APK explicitly labeled')
