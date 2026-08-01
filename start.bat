@echo off
title EduSuite School Management SaaS

echo ============================================
echo   EduSuite - School Management SaaS
echo ============================================
echo.

:: Kill any existing processes on port 8000 and 3000
echo [1/3] Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start Laravel API server in a new window
echo [2/3] Starting Laravel API server on http://127.0.0.1:8000 ...
start "Laravel API (port 8000)" cmd /k "cd /d "%~dp0" && php artisan serve --host=127.0.0.1 --port=8000"

timeout /t 3 /nobreak >nul

:: Start Next.js frontend in a new window
echo [3/3] Starting Next.js Frontend on http://localhost:3000 ...
start "Next.js Frontend (port 3000)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo   Both servers are starting up!
echo ============================================
echo.
echo   Frontend  : http://localhost:3000
echo   API       : http://127.0.0.1:8000
echo.
echo   Super Admin Login:
echo   Email    : admin@schoolsaas.com
echo   Password : Admin@123456
echo.
echo   Opening browser in 3 seconds...
echo ============================================
timeout /t 3 /nobreak >nul

start http://localhost:3000

echo.
echo You can close this window. The two server windows must stay open.
pause
