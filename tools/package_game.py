"""Pack an offline single-HTML game so it also opens from a temporary folder."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import re

root = Path(__file__).resolve().parents[1]
html = (root / 'index.html').read_text()
css = (root / 'web/game.css').read_text()
js = (root / 'web/game.js').read_text()
js = re.sub(r'</script', r'<\\/script', js, flags=re.IGNORECASE)
html, css_count = re.subn(r'<link rel="stylesheet" href="web/game.css[^"]*">', lambda _: '<style>' + css + '</style>', html)
html, js_count = re.subn(r'<script src="web/game.js[^"]*"></script>', lambda _: '<script>' + js + '</script>', html)
assert css_count == js_count == 1
assert 'src="web/' not in html and 'href="web/' not in html
out = root / 'releases/s-ruk-playable-0.2.zip'
out.parent.mkdir(exist_ok=True)
with ZipFile(out, 'w', ZIP_DEFLATED) as z:
    z.writestr('play.html', html)
    z.write(root / 'web/THREE-LICENSE.txt', 'THREE-LICENSE.txt')
    z.writestr('КАК ИГРАТЬ.txt', 'С РУК — ПЕРВЫЙ ОБОРОТ\n\nОткрой play.html в современном браузере с WebGL 2.\nВсе модели и интерфейс внутри одного файла. Интернет не нужен.\n\nКлик или касание пола — идти. На ПК также WASD.\nПодписи над предметами — взаимодействие.\n\nПервая цель: телефон → Авиту → встреча и покупка → рабочий стол →\nдиагностика и разборка → заказ детали в Azon → сон → пункт выдачи →\nсборка и проверка → продажа через «Мои телефоны».\n\nЭто первая игровая версия, не APK. Прогресс сохраняется в браузере.\n')
with ZipFile(out) as z:
    assert z.testzip() is None
print(f'OFFLINE_ZIP_OK: {out.name} ({out.stat().st_size / 1024 / 1024:.2f} MiB)')
