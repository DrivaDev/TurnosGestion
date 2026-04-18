@echo off
echo Iniciando Gestor de Turnos...
echo.

cd /d "%~dp0backend"
start "Backend - Gestor de Turnos" cmd /k "node server.js"

timeout /t 2 /nobreak >nul

cd /d "%~dp0frontend"
start "Frontend - Gestor de Turnos" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo Abriendo el navegador...
start http://localhost:5173

echo.
echo Gestor de Turnos iniciado!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
