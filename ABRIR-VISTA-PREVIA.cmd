@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  start "" "http://127.0.0.1:4173/admin.html"
  node preview.mjs
) else (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    start "" "http://127.0.0.1:4173/admin.html"
    "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" preview.mjs
  ) else (
    echo Instala Node.js desde https://nodejs.org y vuelve a abrir este archivo.
    pause
  )
)
