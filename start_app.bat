@echo off
echo ==========================================
echo      PREVENTIVA 360 - SYSTEM START
echo ==========================================

echo [1/2] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error installing dependencies!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Starting application server...
echo Access the app at: http://localhost:3000
echo.
call npm run dev
pause
