@echo off
REM Cloudflare Migration - Install All Dependencies (Windows)
REM This script installs dependencies for both Workers and Frontend

echo 🚀 Installing Cloudflare Migration Dependencies...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo ✅ Node.js installed
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

echo ✅ npm installed
npm --version
echo.

REM Install Workers dependencies
echo 📦 Installing Workers dependencies...
cd workers
if not exist "package.json" (
    echo ❌ workers/package.json not found!
    exit /b 1
)

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install Workers dependencies
    exit /b 1
)

echo ✅ Workers dependencies installed
echo.

REM Install Frontend dependencies
echo 📦 Installing Frontend dependencies...
cd ..\client
if not exist "package.json" (
    echo ❌ client/package.json not found!
    exit /b 1
)

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install Frontend dependencies
    exit /b 1
)

echo ✅ Frontend dependencies installed
echo.

cd ..

echo 🎉 All dependencies installed successfully!
echo.
echo Next steps:
echo 1. Install Wrangler CLI: npm install -g wrangler
echo 2. Login to Cloudflare: wrangler login
echo 3. Follow QUICK_START_CLOUDFLARE.md for deployment
echo.
echo To test locally:
echo   cd workers ^&^& npm run dev
echo.

pause
