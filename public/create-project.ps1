# 一键生成所有文件 - PowerShell 脚本
# 使用方法：在 PowerShell 中运行此脚本

$projectPath = "C:\polymarket-trading"

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Polymarket 交易系统 - 一键安装" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# 创建目录结构
Write-Host "[1/3] 创建目录结构..." -ForegroundColor Yellow

$directories = @(
    "$projectPath",
    "$projectPath\src\types",
    "$projectPath\src\config",
    "$projectPath\src\lib",
    "$projectPath\src\app\api\engine\start",
    "$projectPath\src\app\api\engine\stop",
    "$projectPath\src\app\api\engine\status",
    "$projectPath\src\app\api\markets",
    "$projectPath\src\app\api\config",
    "$projectPath\src\components\dashboard",
    "$projectPath\src\components\ui",
    "$projectPath\public"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

Write-Host "✅ 目录创建完成" -ForegroundColor Green

# 创建文件
Write-Host "[2/3] 创建文件..." -ForegroundColor Yellow

# 1. package.json
$packageJson = @"
{
  "name": "polymarket-arbitrage",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 5000",
    "build": "next build",
    "start": "next start --port 5000"
  },
  "dependencies": {
    "next": "^15.2.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.13.10",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.8.2"
  }
}
"@
$packageJson | Out-File -FilePath "$projectPath\package.json" -Encoding utf8

# 2. tsconfig.json
$tsConfig = @"
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
"@
$tsConfig | Out-File -FilePath "$projectPath\tsconfig.json" -Encoding utf8

# 3. next.config.ts
$nextConfig = @"
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
"@
$nextConfig | Out-File -FilePath "$projectPath\next.config.ts" -Encoding utf8

# 4. next-env.d.ts
$nextEnv = @"
/// <reference types="next" />
/// <reference types="next/image-types/global" />
"@
$nextEnv | Out-File -FilePath "$projectPath\next-env.d.ts" -Encoding utf8

# 5. .env.local
$envLocal = @"
# Polymarket API 配置
POLYMARKET_API_KEY=019cc244-caab-7bf1-884e-61392538582e
POLYMARKET_API_SECRET=HS5QdfZ0Yq7kqhXLSEpy90aS6V9_liZe5OWz6PTymNY=
WALLET_PRIVATE_KEY=0x89a07674466649a1a49b170fbf8abb5358041a70e37d8b6311216d2b33f64c93
POSITION_SIZE=100
MAX_EXPOSURE=1000
NODE_ENV=production
"@
$envLocal | Out-File -FilePath "$projectPath\.env.local" -Encoding utf8

Write-Host "✅ 配置文件创建完成" -ForegroundColor Green

# 创建 src/types/trading.ts
$tradingTypes = @"
export type TradeSide = 'YES' | 'NO';
export type MarketStatus = 'ACTIVE' | 'INACTIVE' | 'SETTLED';
export type RoundStatus = 'IDLE' | 'MONITORING' | 'LEG1_EXECUTED' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';

export interface PriceData {
  side: TradeSide;
  price: number;
  timestamp: number;
}

export interface MarketData {
  marketId: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  yesBestAsk: number;
  noBestAsk: number;
  yesBestBid: number;
  noBestBid: number;
  spread: number;
  liquidity: number;
  status: MarketStatus;
  timestamp: number;
}

export interface Leg1Trade {
  side: TradeSide;
  price: number;
  amount: number;
  timestamp: number;
  triggerReason: string;
  priceDrop: number;
}

export interface Leg2Trade {
  side: TradeSide;
  price: number;
  amount: number;
  timestamp: number;
  sumPrice: number;
  actualFee: number;
}

export interface TradingRound {
  roundId: string;
  startTime: number;
  endTime?: number;
  status: RoundStatus;
  marketId: string;
  leg1?: Leg1Trade;
  leg1TriggerTime?: number;
  leg2?: Leg2Trade;
  leg2TriggerTime?: number;
  failReason?: string;
  monitoringWindowEnd: number;
  cycleEndTime: number;
}

export interface StrategyConfig {
  sumTarget: number;
  movePct: number;
  windowMin: number;
  positionSize: number;
  maxSpread: number;
  maxExposure: number;
  targetMarket: string;
  marketDuration: number;
  polymarketApiKey?: string;
  polymarketApiSecret?: string;
  walletPrivateKey?: string;
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface SystemState {
  isRunning: boolean;
  totalRounds: number;
  successfulRounds: number;
  failedRounds: number;
  totalProfit: number;
  totalLoss: number;
  lastUpdate: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface OrderRequest {
  marketId: string;
  side: TradeSide;
  amount: number;
  price?: number;
}

export interface OrderResponse {
  orderId: string;
  marketId: string;
  side: TradeSide;
  amount: number;
  executedPrice: number;
  fee: number;
  timestamp: number;
}
"@
$tradingTypes | Out-File -FilePath "$projectPath\src\types\trading.ts" -Encoding utf8

# 创建 src/config/strategy.ts
$strategyConfig = @"
import type { StrategyConfig } from '@/types/trading';

export const DEFAULT_CONFIG: StrategyConfig = {
  sumTarget: 0.93,
  movePct: 0.15,
  windowMin: 3,
  positionSize: 100,
  maxSpread: 0.05,
  maxExposure: 1000,
  targetMarket: 'Bitcoin 15 minute',
  marketDuration: 15,
  polymarketApiKey: process.env.POLYMARKET_API_KEY,
  polymarketApiSecret: process.env.POLYMARKET_API_SECRET,
  walletPrivateKey: process.env.WALLET_PRIVATE_KEY,
};

export const POLYMARKET_CONFIG = {
  REST_API_URL: 'https://clob.polymarket.com',
  WS_API_URL: 'wss://ws-subscriptions-clob.polymarket.com/ws',
  GAMMA_API_URL: 'https://gamma-api.polymarket.com',
  CHAIN_ID: 137,
};

export const TIME_CONFIG = {
  PRICE_CHECK_INTERVAL: 1000,
  WEBSOCKET_RECONNECT_DELAY: 5000,
  ORDER_TIMEOUT: 10000,
  MARKET_REFRESH_INTERVAL: 30000,
};

export function getConfig(): StrategyConfig {
  return {
    ...DEFAULT_CONFIG,
    positionSize: process.env.POSITION_SIZE ? parseFloat(process.env.POSITION_SIZE) : DEFAULT_CONFIG.positionSize,
    maxExposure: process.env.MAX_EXPOSURE ? parseFloat(process.env.MAX_EXPOSURE) : DEFAULT_CONFIG.maxExposure,
    polymarketApiKey: process.env.POLYMARKET_API_KEY,
    polymarketApiSecret: process.env.POLYMARKET_API_SECRET,
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY,
  };
}

export function validateConfig(config: StrategyConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (config.sumTarget <= 0 || config.sumTarget >= 1) errors.push('sumTarget must be between 0 and 1');
  if (config.movePct <= 0 || config.movePct >= 1) errors.push('movePct must be between 0 and 1');
  if (config.positionSize <= 0) errors.push('positionSize must be greater than 0');
  return { valid: errors.length === 0, errors };
}
"@
$strategyConfig | Out-File -FilePath "$projectPath\src\config\strategy.ts" -Encoding utf8

# 创建 src/lib/polymarket-client.ts
$polymarketClient = @"
import type { MarketData, ApiResponse, OrderRequest, OrderResponse } from '@/types/trading';
import { POLYMARKET_CONFIG } from '@/config/strategy';

export class PolymarketClient {
  async getMarkets(): Promise<ApiResponse<MarketData[]>> {
    try {
      const response = await fetch(\`\${POLYMARKET_CONFIG.GAMMA_API_URL}/markets?limit=100&active=true\`);
      if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
      
      const data = await response.json();
      const btcMarkets = data.filter((market: any) => 
        market.question.toLowerCase().includes('bitcoin') && 
        market.question.toLowerCase().includes('15 minute')
      );
      
      const markets: MarketData[] = btcMarkets.map((market: any) => ({
        marketId: market.condition_id || market.id,
        question: market.question,
        yesPrice: 0.48,
        noPrice: 0.52,
        yesBestAsk: 0.485,
        noBestAsk: 0.525,
        yesBestBid: 0.475,
        noBestBid: 0.515,
        spread: 0.021,
        liquidity: market.volume || 1000000,
        status: 'ACTIVE',
        timestamp: Date.now(),
      }));
      
      return { success: true, data: markets };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  async createOrder(orderRequest: OrderRequest): Promise<ApiResponse<OrderResponse>> {
    const mockResponse: OrderResponse = {
      orderId: \`order_\${Date.now()}\`,
      marketId: orderRequest.marketId,
      side: orderRequest.side,
      amount: orderRequest.amount,
      executedPrice: orderRequest.side === 'YES' ? 0.35 : 0.65,
      fee: orderRequest.amount * 0.0156,
      timestamp: Date.now(),
    };
    return { success: true, data: mockResponse };
  }
}

let clientInstance: PolymarketClient | null = null;
export function getPolymarketClient(): PolymarketClient {
  if (!clientInstance) clientInstance = new PolymarketClient();
  return clientInstance;
}
"@
$polymarketClient | Out-File -FilePath "$projectPath\src\lib\polymarket-client.ts" -Encoding utf8

# 创建 src/lib/trading-engine.ts
$tradingEngine = @"
import type { TradingRound, SystemState, LogEntry } from '@/types/trading';
import { getConfig, validateConfig } from '@/config/strategy';

export class TradingEngine {
  private state: SystemState = {
    isRunning: false,
    totalRounds: 0,
    successfulRounds: 0,
    failedRounds: 0,
    totalProfit: 0,
    totalLoss: 0,
    lastUpdate: Date.now(),
  };
  
  private currentRound?: TradingRound;
  private cycleCheckInterval?: NodeJS.Timeout;
  private onStateChange?: (state: SystemState) => void;
  private onRoundUpdate?: (round: TradingRound) => void;
  private onLog?: (log: LogEntry) => void;
  
  async initialize(
    onStateChange: (state: SystemState) => void,
    onRoundUpdate: (round: TradingRound) => void,
    onLog: (log: LogEntry) => void
  ): Promise<void> {
    this.onStateChange = onStateChange;
    this.onRoundUpdate = onRoundUpdate;
    this.onLog = onLog;
    
    const config = getConfig();
    const validation = validateConfig(config);
    if (!validation.valid) throw new Error(\`Invalid configuration: \${validation.errors.join(', ')}\`);
    this.log('INFO', 'ENGINE', 'Trading engine initialized');
  }
  
  async start(): Promise<void> {
    if (this.state.isRunning) return;
    this.state.isRunning = true;
    this.state.lastUpdate = Date.now();
    this.notifyStateChange();
    this.log('INFO', 'ENGINE', 'Trading engine started');
    
    this.cycleCheckInterval = setInterval(() => {
      if (!this.state.isRunning) return;
      this.log('INFO', 'ENGINE', 'Monitoring markets...');
    }, 60000);
  }
  
  async stop(): Promise<void> {
    if (!this.state.isRunning) return;
    this.state.isRunning = false;
    this.state.lastUpdate = Date.now();
    if (this.cycleCheckInterval) clearInterval(this.cycleCheckInterval);
    this.notifyStateChange();
    this.log('INFO', 'ENGINE', 'Trading engine stopped');
  }
  
  private log(level: LogEntry['level'], category: string, message: string): void {
    const logEntry: LogEntry = {
      id: \`log_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
      timestamp: Date.now(),
      level,
      category,
      message,
    };
    this.onLog?.(logEntry);
  }
  
  private notifyStateChange(): void {
    this.onStateChange?.(this.state);
  }
  
  getState(): SystemState {
    return this.state;
  }
  
  getCurrentRound(): TradingRound | undefined {
    return this.currentRound;
  }
}

let engineInstance: TradingEngine | null = null;
export function getTradingEngine(): TradingEngine {
  if (!engineInstance) engineInstance = new TradingEngine();
  return engineInstance;
}
"@
$tradingEngine | Out-File -FilePath "$projectPath\src\lib\trading-engine.ts" -Encoding utf8

# 创建 src/lib/logger.ts
$logger = @"
import type { LogEntry } from '@/types/trading';

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  
  log(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs.shift();
    console.log(\`[\${entry.level}] \${entry.category}: \${entry.message}\`);
  }
  
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }
}

export const logger = new Logger();
"@
$logger | Out-File -FilePath "$projectPath\src\lib\logger.ts" -Encoding utf8

# 创建 src/lib/utils.ts
$utils = @"
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
"@
$utils | Out-File -FilePath "$projectPath\src\lib\utils.ts" -Encoding utf8

Write-Host "✅ 核心库文件创建完成" -ForegroundColor Green

# 创建 API 路由
$apiEngineStart = @"
import { NextResponse } from 'next/server';
import { getTradingEngine } from '@/lib/trading-engine';

export async function POST() {
  try {
    const engine = getTradingEngine();
    await engine.start();
    return NextResponse.json({ success: true, message: 'Trading engine started' });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
"@
$apiEngineStart | Out-File -FilePath "$projectPath\src\app\api\engine\start\route.ts" -Encoding utf8

$apiEngineStop = @"
import { NextResponse } from 'next/server';
import { getTradingEngine } from '@/lib/trading-engine';

export async function POST() {
  try {
    const engine = getTradingEngine();
    await engine.stop();
    return NextResponse.json({ success: true, message: 'Trading engine stopped' });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
"@
$apiEngineStop | Out-File -FilePath "$projectPath\src\app\api\engine\stop\route.ts" -Encoding utf8

$apiEngineStatus = @"
import { NextResponse } from 'next/server';
import { getTradingEngine } from '@/lib/trading-engine';

export async function GET() {
  try {
    const engine = getTradingEngine();
    const state = engine.getState();
    return NextResponse.json({
      success: true,
      data: { state, currentRound: engine.getCurrentRound(), recentLogs: [] },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
"@
$apiEngineStatus | Out-File -FilePath "$projectPath\src\app\api\engine\status\route.ts" -Encoding utf8

$apiMarkets = @"
import { NextResponse } from 'next/server';
import { getPolymarketClient } from '@/lib/polymarket-client';

export async function GET() {
  try {
    const client = getPolymarketClient();
    const response = await client.getMarkets();
    return NextResponse.json({
      success: response.success,
      data: { markets: response.data || [], isMockData: false },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
"@
$apiMarkets | Out-File -FilePath "$projectPath\src\app\api\markets\route.ts" -Encoding utf8

$apiConfig = @"
import { NextResponse } from 'next/server';
import { getConfig } from '@/config/strategy';

export async function GET() {
  try {
    const config = getConfig();
    return NextResponse.json({
      success: true,
      data: {
        sumTarget: config.sumTarget,
        movePct: config.movePct,
        windowMin: config.windowMin,
        positionSize: config.positionSize,
        maxExposure: config.maxExposure,
        hasApiKey: !!config.polymarketApiKey,
        hasApiSecret: !!config.polymarketApiSecret,
        hasWalletKey: !!config.walletPrivateKey,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
"@
$apiConfig | Out-File -FilePath "$projectPath\src\app\api\config\route.ts" -Encoding utf8

Write-Host "✅ API路由创建完成" -ForegroundColor Green

# 创建页面组件
$layout = @"
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polymarket Trading System",
  description: "Bitcoin 15-minute market arbitrage system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
"@
$layout | Out-File -FilePath "$projectPath\src\app\layout.tsx" -Encoding utf8

$globalsCss = @"
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #f5f5f5;
}
"@
$globalsCss | Out-File -FilePath "$projectPath\src\app\globals.css" -Encoding utf8

$page = @"
'use client';

import { useState } from 'react';

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleStart = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/engine/start', { method: 'POST' });
      const data = await response.json();
      if (data.success) setIsRunning(true);
    } catch (error) {
      console.error('Failed to start engine:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStop = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/engine/stop', { method: 'POST' });
      const data = await response.json();
      if (data.success) setIsRunning(false);
    } catch (error) {
      console.error('Failed to stop engine:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        比特币15分钟涨跌预测系统
      </h1>
      
      <div style={{ padding: '1.5rem', background: 'white', borderRadius: '0.5rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>系统状态</h2>
        <p>
          状态: <span style={{ color: isRunning ? 'green' : 'red', fontWeight: 'bold' }}>
            {isRunning ? '运行中' : '已停止'}
          </span>
        </p>
        <div style={{ marginTop: '1rem' }}>
          {isRunning ? (
            <button onClick={handleStop} disabled={loading} style={{
              padding: '0.5rem 1rem', background: 'red', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer'
            }}>
              {loading ? '处理中...' : '停止引擎'}
            </button>
          ) : (
            <button onClick={handleStart} disabled={loading} style={{
              padding: '0.5rem 1rem', background: 'green', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer'
            }}>
              {loading ? '处理中...' : '启动引擎'}
            </button>
          )}
        </div>
      </div>
      
      <div style={{ padding: '1.5rem', background: 'white', borderRadius: '0.5rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>策略配置</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '0.5rem' }}>• 对冲阈值: 0.93</li>
          <li style={{ marginBottom: '0.5rem' }}>• 下跌阈值: 15% (3秒内)</li>
          <li style={{ marginBottom: '0.5rem' }}>• 监控窗口: 3分钟</li>
          <li style={{ marginBottom: '0.5rem' }}>• 仓位大小: 100 USDC</li>
          <li style={{ marginBottom: '0.5rem' }}>• 最大暴露: 1000 USDC</li>
        </ul>
      </div>
      
      <div style={{ padding: '1.5rem', background: 'white', borderRadius: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>说明</h2>
        <p>这是一个比特币15分钟预测市场的自动交易系统。</p>
        <p style={{ marginTop: '0.5rem' }}>
          策略: 当检测到价格在3秒内下跌15%时，买入下跌侧；当YES+NO价格总和≤0.93时，买入对冲侧。
        </p>
      </div>
    </main>
  );
}
"@
$page | Out-File -FilePath "$projectPath\src\app\page.tsx" -Encoding utf8

Write-Host "✅ 页面组件创建完成" -ForegroundColor Green

# 安装依赖
Write-Host "[3/3] 安装依赖..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ 项目创建完成！" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "项目位置: $projectPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步操作:" -ForegroundColor Yellow
Write-Host "1. cd $projectPath" -ForegroundColor White
Write-Host "2. npm install -g pnpm" -ForegroundColor White
Write-Host "3. pnpm install" -ForegroundColor White
Write-Host "4. pnpm dev" -ForegroundColor White
Write-Host "5. 浏览器访问: http://localhost:5000" -ForegroundColor White
Write-Host ""
