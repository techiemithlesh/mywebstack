; ── MyWebStack NSIS customisation ────────────────────────────────────────────
; Runs after the default electron-builder NSIS install.

!macro customInstall
  ; Create packages\ directory so users know where to drop ZIPs
  CreateDirectory "$INSTDIR\packages"

  ; Write a README inside packages\
  FileOpen $0 "$INSTDIR\packages\README.txt" w
  FileWrite $0 "Place the following ZIP files here, then run setup.ps1:$\r$\n"
  FileWrite $0 "$\r$\n"
  FileWrite $0 "  Apache24.zip                      (Apache for Windows)\r\n"
  FileWrite $0 "  mysql-8.4.zip                     (MySQL ZIP archive)\r\n"
  FileWrite $0 "  php-8.5.7-Win32-vs17-x64.zip      (PHP Thread Safe x64)\r\n"
  FileWrite $0 "  phpmyadmin.zip                    (phpMyAdmin)\r\n"
  FileWrite $0 "$\r$\n"
  FileWrite $0 "Download links: https://github.com/techiemithlesh/mywebstack#quick-start\r\n"
  FileClose $0

  ; Create logs\ directory
  CreateDirectory "$INSTDIR\logs"

  ; Create mysql\ and php\ directories
  CreateDirectory "$INSTDIR\mysql"
  CreateDirectory "$INSTDIR\php"
  CreateDirectory "$INSTDIR\apache"
  CreateDirectory "$INSTDIR\phpmyadmin"
!macroend

!macro customUnInstall
  ; Nothing extra needed — electron-builder handles the rest
!macroend
