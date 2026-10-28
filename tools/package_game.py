"""Pack an offline single-HTML game so it also opens from a temporary folder."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import re
import base64

root = Path(__file__).resolve().parents[1]
html = (root / 'index.html').read_text()
css = (root / 'web/game.css').read_text()
for font in ['Nunito','RussoOne']:
    encoded=base64.b64encode((root / f'web/fonts/{font}.ttf').read_bytes()).decode()
    css=css.replace(f"./fonts/{font}.ttf",f"data:font/ttf;base64,{encoded}")
js = (root / 'web/game.js').read_text()
js = re.sub(r'</script', r'<\\/script', js, flags=re.IGNORECASE)
html, css_count = re.subn(r'<link rel="stylesheet" href="web/game.css[^"]*">', lambda _: '<style>' + css + '</style>', html)
html, js_count = re.subn(r'<script src="web/game.js[^"]*"></script>', lambda _: '<script>' + js + '</script>', html)
assert css_count == js_count == 1
assert 'src="web/' not in html and 'href="web/' not in html
out = root / 'releases/perekup-second-chance-0.7.zip'
out.parent.mkdir(exist_ok=True)
with ZipFile(out, 'w', ZIP_DEFLATED) as z:
    z.writestr('play.html', html)
    z.write(root / 'web/THREE-LICENSE.txt', 'THREE-LICENSE.txt')
    for path in ['web/fonts/Nunito-OFL.txt','web/fonts/RussoOne-OFL.txt','web/audio/Kenney-LICENSE.md','web/audio/SOURCES.md','web/audio/Kenney-interface-CC0.txt','web/audio/Kenney-impact-CC0.txt']:
        z.write(root / path,'licenses/'+Path(path).name)
    z.writestr('КАК ИГРАТЬ.txt', 'ПЕРЕКУП: ВТОРОЙ ШАНС · 0.7\n\nОткрой play.html в современном браузере с WebGL 2.\nВсе модели и интерфейс внутри одного файла. Интернет не нужен.\n\nКлик или касание пола — идти. На ПК также WASD.\nПодписи над предметами — взаимодействие.\n\nПервая цель: телефон → Авиту → встреча и покупка → рабочий стол →\nдиагностика и разборка → заказ детали в Azon → сон → пункт выдачи →\nсборка и проверка → продажа через «Мои телефоны».\n\nВ версии 0.7: четыре активных задания, физический поиск посылок по коду, мебель и развитие дома.\nИстощение, помощь друзей и прохожих, ночные встречи.\nПереработаны присоска, разъёмы и короткая рука, добавлены переходы телефона.\n\nТакже доступны игровые канал и студия Youpube на ПК, съёмка трёх кадров и монтаж.\nПродажа требует личной встречи или отправки через Azon, рейтинг и три последние сделки.\nДома есть календарь с напоминаниями. Исправлены руки, отвёртка, дисплей и разворот.\nДва трека чередуются автоматически.\n\nСохранились 14 глав истории, подработки в Пятаке и Azon, четыре уровня ремонта.\nВечер и ночь наступают со временем; сезон меняется раз в семь игровых дней.\nЕсть расширенный дом, сквер с находками, музыка и отдельные настройки громкости.\nРазработчик: Vithel. Создано с помощью GPT-6.1 Sol.\n\nОбязательное обучение, ник, пол и шесть способностей на выбор.\nСон на кровати с таймлапсом, еда и питьё, корзина и продукты в магазине.\nВ Youpube можно снимать влоги, набирать подписчиков, подключать монетизацию.\nВ районе есть друзья и соревнования, кроме телефонов ремонтируются геймпады, колонки и наушники.\nТакже есть журнал заданий, заказы жителей,\nПК и улучшения RAM/GPU/SSD. На телефоне игра «Лови сигнал», на ПК — «Ночной курьер».\nШрифты и звуки уже внутри HTML. Звук включается первым нажатием.\n\nЭто браузерная игровая версия, не APK. Прогресс сохраняется в браузере.\n')
with ZipFile(out) as z:
    assert z.testzip() is None
print(f'OFFLINE_ZIP_OK: {out.name} ({out.stat().st_size / 1024 / 1024:.2f} MiB)')
