"""Give Cordova the same self-contained HTML used by the verified offline ZIP."""
from pathlib import Path
from zipfile import ZipFile
root = Path(__file__).resolve().parents[1]
with ZipFile(root / 'releases/perekup-second-chance-0.11.zip') as archive:
    html = archive.read('play.html').decode('utf-8')
html = html.replace('</head>', '<script src="cordova.js"></script></head>')
out = root / 'android-app/www'
out.mkdir(parents=True, exist_ok=True)
(out / 'index.html').write_text(html)
print('ANDROID_ASSETS_OK: embedded game, models, fonts and audio')
