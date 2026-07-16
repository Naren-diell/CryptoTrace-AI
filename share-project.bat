@echo off
title CryptoTrace AI - Public Sharing Tool
echo ===================================================
echo   CryptoTrace AI - Starting Local Services & Tunnel
echo ===================================================

:: Check for node_modules in backend
if not exist "backend\node_modules\" (
    echo [Backend] Installing dependencies...
    cd backend && npm install && cd ..
)

:: Check for node_modules in frontend
if not exist "frontend\node_modules\" (
    echo [Frontend] Installing dependencies...
    cd frontend && npm install && cd ..
)

echo.
echo [1/3] Starting Backend Server on port 5000...
start "CryptoTrace Backend" cmd /c "cd backend && npm run dev"

echo [2/3] Starting Frontend (Vite) on port 5173...
start "CryptoTrace Frontend" cmd /c "cd frontend && npm run dev"

echo [3/3] Creating Public HTTPS Tunnel...
echo.
echo ---------------------------------------------------
echo ⚠️  IMPORTANT NOTE:
echo When you open the public URL, Localtunnel might ask
echo for a password. If prompted, please submit your public
echo IP address. You can find it by googling "what is my ip".
echo ---------------------------------------------------
echo.

npx localtunnel --port 5173 --local-host 127.0.0.1

pause
