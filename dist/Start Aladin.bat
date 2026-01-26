@echo off
REM Aladin Launcher - Just double-click to run!
REM Starts a local server and opens in browser

cd /d "%~dp0"
set PORT=8765

echo 🧞 Starting Aladin on http://localhost:%PORT%
echo    Close this window to stop
echo.

REM Open browser
start http://localhost:%PORT%

REM Start server
python -m http.server %PORT%
