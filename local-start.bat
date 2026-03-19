@echo off
REM Polymarket 交易系统 - Windows 批处理启动脚本
REM 使用方法: 双击运行 local-start.bat

echo ==================================
echo Polymarket 快速下跌对冲套利系统
echo ==================================
echo.

REM 检查 Node.js
echo [1/6] 检查 Node.js...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [31mNode.js 未安装[0m
    echo 请安装 Node.js 20+: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [92mNode.js %NODE_VERSION%[0m

REM 检查 pnpm
echo [2/6] 检查 pnpm...
where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo pnpm 未安装，正在安装...
    npm install -g pnpm
)
for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
echo [92mpnpm %PNPM_VERSION%[0m

REM 检查 .env.local
echo [3/6] 检查配置文件...
if not exist .env.local (
    echo [31m.env.local 不存在[0m
    echo.
    echo 请创建配置文件：
    echo.
    echo notepad .env.local
    echo.
    echo 复制以下内容：
    echo POLYMARKET_API_KEY=your_api_key
    echo POLYMARKET_API_SECRET=your_api_secret
    echo WALLET_PRIVATE_KEY=your_private_key
    echo.
    pause
    exit /b 1
)
echo [92m配置文件已存在[0m

REM 安装依赖
echo [4/6] 安装依赖...
call pnpm install
if %ERRORLEVEL% neq 0 (
    echo [33mpnpm 安装失败，尝试使用 npm...[0m
    call npm install
)
echo [92m依赖安装完成[0m

REM 构建项目
echo [5/6] 构建项目...
call pnpm build
if %ERRORLEVEL% neq 0 (
    echo [31m构建失败[0m
    pause
    exit /b 1
)
echo [92m构建完成[0m

REM 启动服务
echo [6/6] 启动服务...
echo.
echo ================================
echo 服务即将启动！
echo ================================
echo.
echo 访问地址: http://localhost:5000
echo.
echo 按 Ctrl+C 停止服务
echo.

call pnpm start
