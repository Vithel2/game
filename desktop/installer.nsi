Unicode true
!include "MUI2.nsh"
!include "x64.nsh"
!ifndef VERSION
 !define VERSION "0.10.0"
!endif
Name "Перекуп: второй шанс"
OutFile "${OUTPUT}"
InstallDir "$LOCALAPPDATA\Programs\Vithel\Perekup"
InstallDirRegKey HKCU "Software\Vithel\Perekup" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
BrandingText "Vithel · Перекуп: второй шанс"
VIProductVersion "${VERSION}.0"
VIAddVersionKey /LANG=1049 "ProductName" "Перекуп: второй шанс"
VIAddVersionKey /LANG=1049 "CompanyName" "Vithel"
VIAddVersionKey /LANG=1049 "FileDescription" "Установка игры Перекуп: второй шанс"
VIAddVersionKey /LANG=1049 "FileVersion" "${VERSION}"
VIAddVersionKey /LANG=1049 "LegalCopyright" "Vithel · 2026"
!define MUI_ICON "${PROJECTDIR}/desktop/icon.ico"
!define MUI_UNICON "${PROJECTDIR}/desktop/icon.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Перекуп: второй шанс"
!define MUI_WELCOMEPAGE_TEXT "Офлайн-игра о ремонте техники и своём деле.$\r$\n$\r$\nРазработчик: Vithel$\r$\nСоздано с помощью GPT-6.1 Sol.$\r$\n$\r$\nНужны Windows 10/11 x64 и Microsoft Edge WebView2. После установки WebView2 игровой интернет не требуется.$\r$\n$\r$\nУстановка в папку пользователя, без прав администратора."
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\Perekup.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Открыть мастерскую"
!define MUI_FINISHPAGE_RUN_NOTCHECKED
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Russian"
Function .onInit
 ${IfNot} ${RunningX64}
  MessageBox MB_OK "Для этой версии нужна 64-битная Windows 10 или 11."
  Abort
 ${EndIf}
 SetRegView 64
FunctionEnd
Section "Игра"
 SetOutPath "$INSTDIR"
 File /r "${STAGING}/*"
 WriteRegStr HKCU "Software\Vithel\Perekup" "InstallDir" "$INSTDIR"
 WriteUninstaller "$INSTDIR\Uninstall.exe"
 CreateDirectory "$SMPROGRAMS\Перекуп — второй шанс"
 CreateShortcut "$SMPROGRAMS\Перекуп — второй шанс\Перекуп.lnk" "$INSTDIR\Perekup.exe"
 CreateShortcut "$SMPROGRAMS\Перекуп — второй шанс\Удалить игру.lnk" "$INSTDIR\Uninstall.exe"
 CreateShortcut "$DESKTOP\Перекуп — второй шанс.lnk" "$INSTDIR\Perekup.exe"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VithelPerekup" "DisplayName" "Перекуп: второй шанс"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VithelPerekup" "Publisher" "Vithel"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VithelPerekup" "DisplayVersion" "${VERSION}"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VithelPerekup" "DisplayIcon" "$INSTDIR\Perekup.exe"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VithelPerekup" "UninstallString" '"$INSTDIR\Uninstall.exe"'
 WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VithelPerekup" "NoModify" 1
 WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VithelPerekup" "NoRepair" 1
SectionEnd
Section "Uninstall"
 SetRegView 64
 Delete "$INSTDIR\Perekup.exe"
 Delete "$INSTDIR\Microsoft.Web.WebView2.Core.dll"
 Delete "$INSTDIR\Microsoft.Web.WebView2.WinForms.dll"
 Delete "$INSTDIR\WebView2Loader.dll"
 Delete "$INSTDIR\КАК ИГРАТЬ.txt"
 RMDir /r "$INSTDIR\game"
 RMDir /r "$INSTDIR\licenses"
 Delete "$INSTDIR\Uninstall.exe"
 RMDir "$INSTDIR"
 Delete "$DESKTOP\Перекуп — второй шанс.lnk"
 Delete "$SMPROGRAMS\Перекуп — второй шанс\Перекуп.lnk"
 Delete "$SMPROGRAMS\Перекуп — второй шанс\Удалить игру.lnk"
 RMDir "$SMPROGRAMS\Перекуп — второй шанс"
 DeleteRegKey HKCU "Software\Vithel\Perekup"
 DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VithelPerekup"
 ; Keep the player's WebView2 profile and save under LOCALAPPDATA\Vithel\Perekup.
SectionEnd
