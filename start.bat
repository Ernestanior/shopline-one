@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ╔════════════════════════════════════════╗
echo ║   XYVN 电商系统 - 一键启动脚本        ║
echo ╚════════════════════════════════════════╝
echo.

:: 检查 Node.js
echo [1/5] 检查 Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装，请先安装 Node.js
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js 版本: %NODE_VERSION%

:: 检查 MySQL
echo [2/5] 检查 MySQL...
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ MySQL 未安装或未在 PATH 中
    echo ⚠️  请确保 MySQL 服务正在运行
) else (
    echo ✅ MySQL 已安装
)

:: 初始化数据库
echo [3/5] 初始化数据库...
node server/init-database.js
if %errorlevel% neq 0 (
    echo ❌ 数据库初始化失败
    echo 💡 请检查:
    echo    1. MySQL 服务是否运行
    echo    2. .env 文件中的数据库配置是否正确
    echo    3. 数据库用户是否有足够的权限
    pause
    exit /b 1
)
echo ✅ 数据库初始化成功

:: 检查依赖
echo [4/5] 检查依赖...
if not exist "node_modules" (
    echo 📦 安装后端依赖...
    call npm install
)

if not exist "client\node_modules" (
    echo 📦 安装前端依赖...
    cd client
    call npm install
    cd ..
)
echo ✅ 依赖检查完成

:: 启动服务
echo [5/5] 启动服务...
echo.
echo ════════════════════════════════════════
echo 🚀 正在启动服务...
echo ════════════════════════════════════════
echo.
echo 📍 后端服务: http://localhost:5002
echo 📍 前端服务: http://localhost:3001
echo 📍 管理后台: http://localhost:3001/admin
echo.
echo 👤 默认管理员账户:
echo    邮箱: admin@xyvn.com
echo    密码: admin123
echo.
echo ════════════════════════════════════════
echo 💡 提示: 按 Ctrl+C 停止所有服务
echo ════════════════════════════════════════
echo.

:: 启动后端
start "XYVN Backend" cmd /k "npm run server"

:: 等待2秒
timeout /t 2 /nobreak >nul

:: 启动前端
start "XYVN Frontend" cmd /k "cd client && npm start"

echo.
echo ✅ 服务已启动！
echo.
echo 按任意键关闭此窗口...
pause >nul
