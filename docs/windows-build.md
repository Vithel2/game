# Windows-приложение и установщик

`Perekup-0.12-Setup.exe` — настоящий NSIS-установщик. Устанавливает `Perekup.exe`, игровые ресурсы и библиотеки WebView2 в `%LOCALAPPDATA%\Programs\Vithel\Perekup`, создаёт ярлыки на рабочем столе и в меню «Пуск», добавляет удаление через настройки Windows. Права администратора не нужны.

`perekup-0.12-windows-portable.zip` — распаковать целиком и запустить `Perekup.exe`. Один EXE отдельно от DLL и папки `game` переносить нельзя.

Окно игры имеет название, иконку и сведения о версии. F11 включает полный экран. Игра открывается внутри своего приложения, без вкладки браузера или ручного открытия HTML. Все игровые данные локальные. Для отображения используется Microsoft Edge WebView2.

Требования: Windows 10/11 x64, .NET Framework 4.6.2+ (в актуальной Windows обычно 4.8), Microsoft Edge WebView2. Если WebView2 отсутствует, приложение предлагает открыть официальный сайт Microsoft. Установка самого WebView2 может потребовать интернет; после неё игровой интернет не нужен.

Сохранения хранятся в `%LOCALAPPDATA%\Vithel\Perekup\WebView2` и не удаляются деинсталлятором. При обновлении устанавливайте новую версию поверх старой. Сохранение обычного браузера или Android автоматически не переносится.

Сборка пока без коммерческого сертификата цифровой подписи Windows. Компиляция и содержимое установщика проверены в Linux; запуска на настоящей Windows-машине в этой сессии не было. Это не подтверждение публикации в магазине.

## Воспроизводимая сборка

Нужны Node.js 22, Python 3, Mono (`mcs`, WinForms reference assemblies), NSIS. Пример для Ubuntu:

```sh
sudo apt-get install mono-mcs libmono-system-windows-forms4.0-cil nsis
npm ci
npm run package:offline
python3 tools/build_windows.py
```

Скрипт загружает официальный Microsoft.Web.WebView2 SDK версии 1.0.2903.40 с NuGet, компилирует `desktop/Program.cs`, собирает ZIP и установщик. Приватные ключи не нужны. Для нестандартного расположения инструментов доступны `MONO`, `MCS`, `MAKENSIS`, `PEREKUP_WINDOWS_BUILD`; переменные Mono/NSIS можно задать обычным способом.

Исходники установщика: `desktop/installer.nsi`. Манифест приложения: `desktop/app.manifest`. Автоматическая сборка — `.github/workflows/build-windows.yml`.
