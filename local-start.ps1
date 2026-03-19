# Polymarket 交易系统 - Windows PowerShell 启动脚本
# 使用方法: .\local-start.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Polymarket 快速下跌对冲套利系统" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
Write-Host "[1/6] 检查 Node.js..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js 未安装" -ForegroundColor Red
    Write-Host "请安装 Node.js 20+: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
$nodeVersion = node --version
Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green

# 检查 pnpm
Write-Host "[2/6] 检查 pnpm..." -ForegroundColor Yellow
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "pnpm 未安装，正在安装..." -ForegroundColor Yellow
    npm install -g pnpm
}
$pnpmVersion = pnpm --version
Write-Host "✅ pnpm $pnpmVersion" -ForegroundColor Green

# 检查 .env.local
Write-Host "[3/6] 检查配置文件..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local 不存在" -ForegroundColor Red
    Write-Host ""
    Write-Host "请创建配置文件：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "notepad .env.local" -ForegroundColor White
    Write-Host ""
    Write-Host "复制以下内容：" -ForegroundColor Yellow
    Write-Host @"
POLYMARKET_API_KEY=your_api_key
POLYMARKET_API_SECRET=your_api_secret
WALLET_PRIVATE_KEY=your_private_key
"@ -ForegroundColor Gray
    Write-Host ""
    exit 1
}
Write-Host "✅ 配置文件已存在" -ForegroundColor Green

# 安装依赖
Write-Host "[4/6] 安装依赖..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ pnpm 安装失败，尝试使用 npm..." -ForegroundColor Yellow
    npm install
}
Write-Host "✅ 依赖安装完成" -ForegroundColor Green

# 构建项目
Write-Host "[5/6] 构建项目..." -ForegroundColor Yellow
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 构建完成" -ForegroundColor Green

# 启动服务
Write-Host "[6/6] 启动服务..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "🚀 服务即将启动！" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Yellow
Write-Host ""

pnpm start
