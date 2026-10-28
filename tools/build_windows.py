"""Build an x64 Windows launcher, portable ZIP and per-user NSIS installer."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import os, json, shutil, subprocess, urllib.request, tempfile
root=Path(__file__).resolve().parents[1]
version=json.loads((root/'package.json').read_text())['version']
short='.'.join(version.split('.')[:2]); sdk_version='1.0.2903.40'
build=Path(os.environ.get('PEREKUP_WINDOWS_BUILD',str(Path(tempfile.gettempdir())/'perekup-windows-build')));build.mkdir(exist_ok=True)
sdk=build/'webview2'
if not (sdk/'lib/net462/Microsoft.Web.WebView2.Core.dll').exists():
 package=build/'webview2.nupkg'
 urllib.request.urlretrieve(f'https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/{sdk_version}/microsoft.web.webview2.{sdk_version}.nupkg',package)
 with ZipFile(package) as archive: archive.extractall(sdk)
stage=build/'app';stage.mkdir(exist_ok=True)
for name in ['Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll']:shutil.copyfile(sdk/'lib/net462'/name,stage/name)
shutil.copyfile(sdk/'runtimes/win-x64/native/WebView2Loader.dll',stage/'WebView2Loader.dll')
with ZipFile(root/f'releases/perekup-second-chance-{short}.zip') as archive:
 (stage/'game').mkdir(exist_ok=True);(stage/'game/index.html').write_bytes(archive.read('play.html'))
 for name in archive.namelist():
  if name.startswith('licenses/') or name=='THREE-LICENSE.txt':
   path=stage/'licenses'/Path(name).name;path.parent.mkdir(exist_ok=True);path.write_bytes(archive.read(name))
for file in sdk.rglob('*LICENSE*'):
 if file.is_file():shutil.copyfile(file,stage/'licenses'/('WebView2-'+file.name))
(stage/'КАК ИГРАТЬ.txt').write_text('ПЕРЕКУП: ВТОРОЙ ШАНС · '+version+'\n\nЗапустите Perekup.exe. Не перемещайте EXE отдельно от папок и DLL.\nWindows 10/11 x64, .NET Framework 4.6.2+ и Microsoft Edge WebView2.\nОбычно компоненты уже есть в обновлённой Windows.\nF11 — полный экран. WASD или клик по полу — движение.\nВсе игровые ресурсы локальные; интернет игре не нужен.\nСохранения: %LOCALAPPDATA%\\Vithel\\Perekup\\WebView2\nНе удаляются при обновлении или деинсталляции. Браузерное сохранение автоматически не переносится.\n\nРазработчик Vithel · создано с помощью GPT-6.1 Sol.\nСборка без коммерческого сертификата цифровой подписи Windows.\n')
mono=os.environ.get('MONO','mono');mcs=os.environ.get('MCS','mcs')
command=[mono,mcs] if mcs.endswith('.exe') else [mcs]
refs=['System.Windows.Forms','System.Drawing']+[str(sdk/'lib/net462'/name) for name in ['Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll']]
command+=['-target:winexe','-platform:x64','-optimize+','-out:'+str(stage/'Perekup.exe'),'-win32icon:'+str(root/'desktop/icon.ico'),'-win32manifest:'+str(root/'desktop/app.manifest'),'-resource:'+str(root/'desktop/icon.ico')+',game.ico']+['-r:'+r for r in refs]+[str(root/'desktop/Program.cs')]
subprocess.run(command,check=True,cwd=root)
assert (stage/'Perekup.exe').read_bytes()[:2]==b'MZ'
releases=root/'releases';releases.mkdir(exist_ok=True)
portable=releases/f'perekup-{short}-windows-portable.zip'
with ZipFile(portable,'w',ZIP_DEFLATED) as archive:
 for path in sorted(stage.rglob('*')):
  if path.is_file(): archive.write(path,'Perekup/'+str(path.relative_to(stage)))
setup=releases/f'Perekup-{short}-Setup.exe'
subprocess.run([os.environ.get('MAKENSIS','makensis'),'-V2',f'-DPROJECTDIR={root}',f'-DSTAGING={stage}',f'-DOUTPUT={setup}',f'-DVERSION={version}',str(root/'desktop/installer.nsi')],check=True,cwd=root)
assert setup.read_bytes()[:2]==b'MZ'
print('WINDOWS_BUILDS_OK',portable.stat().st_size,setup.stat().st_size)
