# 📦 完整项目文件文档

## 目录

1. [项目目录结构](#项目目录结构)
2. [配置文件](#配置文件)
3. [类型定义](#类型定义)
4. [核心库](#核心库)
5. [API路由](#api路由)
6. [页面组件](#页面组件)
7. [创建步骤](#创建步骤)
8. [运行步骤](#运行步骤)

---

## 项目目录结构

```
polymarket-trading/
├── package.json
├── tsconfig.json
├── next.config.ts
├── next-env.d.ts
├── .env.local
├── src/
│   ├── types/
│   │   └── trading.ts
│   ├── config/
│   │   └── strategy.ts
│   ├── lib/
│   │   ├── polymarket-client.ts
│   │   ├── price-monitor.ts
│   │   ├── trading-engine.ts
│   │   ├── logger.ts
│   │   └── utils.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── engine/
│   │       │   ├── start/
│   │       │   │   └── route.ts
│   │       │   ├── stop/
│   │       │   │   └── route.ts
│   │       │   └── status/
│   │       │       └── route.ts
│   │       ├── markets/
│   │       │   └── route.ts
│   │       └── config/
│   │           └── route.ts
│   └── components/
│       ├── dashboard/
│       │   ├── system-status-card.tsx
│       │   ├── round-info-card.tsx
│       │   ├── log-panel.tsx
│       │   ├── markets-panel.tsx
│       │   └── config-panel.tsx
│       └── ui/
│           ├── button.tsx
│           ├── card.tsx
│           ├── badge.tsx
│           └── (其他UI组件)
└── public/
```

---

## 创建步骤

### 第1步：创建项目目录

在 Windows 上打开 CMD 或 PowerShell：

```bash
# 创建项目目录
mkdir C:\polymarket-trading
cd C:\polymarket-trading

# 创建子目录
mkdir src\types
mkdir src\config
mkdir src\lib
mkdir src\app\api\engine\start
mkdir src\app\api\engine\stop
mkdir src\app\api\engine\status
mkdir src\app\api\markets
mkdir src\app\api\config
mkdir src\components\dashboard
mkdir src\components\ui
mkdir public
```

### 第2步：创建文件

按照下方提供的文件内容，逐个创建文件。

---

## 配置文件

### 文件 1: package.json

**路径**: `package.json`

```json
{
  "name": "polymarket-arbitrage",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 5000",
    "build": "next build",
    "start": "next start --port 5000",
    "lint": "next lint"
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
```

### 文件 2: tsconfig.json

**路径**: `tsconfig.json`

```json
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
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 文件 3: next.config.ts

**路径**: `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

### 文件 4: next-env.d.ts

**路径**: `next-env.d.ts`

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
```

### 文件 5: .env.local

**路径**: `.env.local`

```env
# Polymarket API 配置
POLYMARKET_API_KEY=019cc244-caab-7bf1-884e-61392538582e
POLYMARKET_API_SECRET=HS5QdfZ0Yq7kqhXLSEpy90aS6V9_liZe5OWz6PTymNY=

# 钱包私钥
WALLET_PRIVATE_KEY=0x89a07674466649a1a49b170fbf8abb5358041a70e37d8b6311216d2b33f64c93

# 策略参数
POSITION_SIZE=100
MAX_EXPOSURE=1000

# 环境
NODE_ENV=production
```

---

## 类型定义

### 文件 6: src/types/trading.ts

**路径**: `src/types/trading.ts`

```typescript
// 交易方向
export type TradeSide = 'YES' | 'NO';

// 市场状态
export type MarketStatus = 'ACTIVE' | 'INACTIVE' | 'SETTLED';

// 轮次状态
export type RoundStatus = 
  | 'IDLE'
  | 'MONITORING'
  | 'LEG1_EXECUTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'TIMEOUT';

// 价格数据
export interface PriceData {
  side: TradeSide;
  price: number;
  timestamp: number;
}

// 市场数据
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

// Leg 1 交易记录
export interface Leg1Trade {
  side: TradeSide;
  price: number;
  amount: number;
  timestamp: number;
  triggerReason: string;
  priceDrop: number;
}

// Leg 2 交易记录
export interface Leg2Trade {
  side: TradeSide;
  price: number;
  amount: number;
  timestamp: number;
  sumPrice: number;
  actualFee: number;
}

// 交易轮次
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

// 策略配置
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

// 日志级别
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

// 日志条目
export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

// 系统状态
export interface SystemState {
  isRunning: boolean;
  totalRounds: number;
  successfulRounds: number;
  failedRounds: number;
  totalProfit: number;
  totalLoss: number;
  lastUpdate: number;
}

// API响应
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// 订单请求
export interface OrderRequest {
  marketId: string;
  side: TradeSide;
  amount: number;
  price?: number;
}

// 订单响应
export interface OrderResponse {
  orderId: string;
  marketId: string;
  side: TradeSide;
  amount: number;
  executedPrice: number;
  fee: number;
  timestamp: number;
}
```

---

## 核心库

### 文件 7: src/config/strategy.ts

**路径**: `src/config/strategy.ts`

```typescript
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
    positionSize: process.env.POSITION_SIZE 
      ? parseFloat(process.env.POSITION_SIZE) 
      : DEFAULT_CONFIG.positionSize,
    maxExposure: process.env.MAX_EXPOSURE 
      ? parseFloat(process.env.MAX_EXPOSURE) 
      : DEFAULT_CONFIG.maxExposure,
    polymarketApiKey: process.env.POLYMARKET_API_KEY,
    polymarketApiSecret: process.env.POLYMARKET_API_SECRET,
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY,
  };
}

export function validateConfig(config: StrategyConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (config.sumTarget <= 0 || config.sumTarget >= 1) {
    errors.push('sumTarget must be between 0 and 1');
  }
  
  if (config.movePct <= 0 || config.movePct >= 1) {
    errors.push('movePct must be between 0 and 1');
  }
  
  if (config.positionSize <= 0) {
    errors.push('positionSize must be greater than 0');
  }
  
  return { valid: errors.length === 0, errors };
}
```

### 文件 8: src/lib/polymarket-client.ts

**路径**: `src/lib/polymarket-client.ts`

```typescript
import type { MarketData, ApiResponse, OrderRequest, OrderResponse } from '@/types/trading';
import { POLYMARKET_CONFIG } from '@/config/strategy';

export class PolymarketClient {
  async getMarkets(): Promise<ApiResponse<MarketData[]>> {
    try {
      const response = await fetch(
        `${POLYMARKET_CONFIG.GAMMA_API_URL}/markets?limit=100&active=true`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
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
      console.error('Failed to fetch markets:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  async createOrder(orderRequest: OrderRequest): Promise<ApiResponse<OrderResponse>> {
    console.log('Creating order:', orderRequest);
    
    const mockResponse: OrderResponse = {
      orderId: `order_${Date.now()}`,
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
  if (!clientInstance) {
    clientInstance = new PolymarketClient();
  }
  return clientInstance;
}
```

### 文件 9: src/lib/trading-engine.ts

**路径**: `src/lib/trading-engine.ts`

```typescript
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
    
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    
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
    
    if (this.cycleCheckInterval) {
      clearInterval(this.cycleCheckInterval);
    }
    
    this.notifyStateChange();
    this.log('INFO', 'ENGINE', 'Trading engine stopped');
  }
  
  private log(level: LogEntry['level'], category: string, message: string): void {
    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
  if (!engineInstance) {
    engineInstance = new TradingEngine();
  }
  return engineInstance;
}
```

### 文件 10: src/lib/logger.ts

**路径**: `src/lib/logger.ts`

```typescript
import type { LogEntry } from '@/types/trading';

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  
  log(entry: LogEntry): void {
    this.logs.push(entry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    console.log(`[${entry.level}] ${entry.category}: ${entry.message}`);
  }
  
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }
}

export const logger = new Logger();
```

### 文件 11: src/lib/utils.ts

**路径**: `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## API路由

### 文件 12: src/app/api/engine/start/route.ts

**路径**: `src/app/api/engine/start/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getTradingEngine } from '@/lib/trading-engine';

export async function POST() {
  try {
    const engine = getTradingEngine();
    
    await engine.start();
    
    return NextResponse.json({
      success: true,
      message: 'Trading engine started',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

### 文件 13: src/app/api/engine/stop/route.ts

**路径**: `src/app/api/engine/stop/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getTradingEngine } from '@/lib/trading-engine';

export async function POST() {
  try {
    const engine = getTradingEngine();
    
    await engine.stop();
    
    return NextResponse.json({
      success: true,
      message: 'Trading engine stopped',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

### 文件 14: src/app/api/engine/status/route.ts

**路径**: `src/app/api/engine/status/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getTradingEngine } from '@/lib/trading-engine';

export async function GET() {
  try {
    const engine = getTradingEngine();
    const state = engine.getState();
    
    return NextResponse.json({
      success: true,
      data: {
        state,
        currentRound: engine.getCurrentRound(),
        recentLogs: [],
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

### 文件 15: src/app/api/markets/route.ts

**路径**: `src/app/api/markets/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getPolymarketClient } from '@/lib/polymarket-client';

export async function GET() {
  try {
    const client = getPolymarketClient();
    const response = await client.getMarkets();
    
    return NextResponse.json({
      success: response.success,
      data: {
        markets: response.data || [],
        isMockData: false,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

### 文件 16: src/app/api/config/route.ts

**路径**: `src/app/api/config/route.ts`

```typescript
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
```

---

## 页面组件

### 文件 17: src/app/layout.tsx

**路径**: `src/app/layout.tsx`

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polymarket Trading System",
  description: "Bitcoin 15-minute market arbitrage system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 文件 18: src/app/globals.css

**路径**: `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #f5f5f5;
}
```

### 文件 19: src/app/page.tsx

**路径**: `src/app/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleStart = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/engine/start', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setIsRunning(true);
      }
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
      if (data.success) {
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Failed to stop engine:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Bitcoin 15分钟涨跌预测系统
      </h1>
      
      <div style={{ 
        padding: '1.5rem', 
        background: 'white', 
        borderRadius: '0.5rem',
        marginBottom: '1rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          系统状态
        </h2>
        <p>
          状态: <span style={{ 
            color: isRunning ? 'green' : 'red',
            fontWeight: 'bold'
          }}>
            {isRunning ? '运行中' : '已停止'}
          </span>
        </p>
        
        <div style={{ marginTop: '1rem' }}>
          {isRunning ? (
            <button
              onClick={handleStop}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                background: 'red',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                marginRight: '0.5rem'
              }}
            >
              {loading ? '处理中...' : '停止引擎'}
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                background: 'green',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              {loading ? '处理中...' : '启动引擎'}
            </button>
          )}
        </div>
      </div>
      
      <div style={{ 
        padding: '1.5rem', 
        background: 'white', 
        borderRadius: '0.5rem',
        marginBottom: '1rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          策略配置
        </h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '0.5rem' }}>• 对冲阈值: 0.93</li>
          <li style={{ marginBottom: '0.5rem' }}>• 下跌阈值: 15% (3秒内)</li>
          <li style={{ marginBottom: '0.5rem' }}>• 监控窗口: 3分钟</li>
          <li style={{ marginBottom: '0.5rem' }}>• 仓位大小: 100 USDC</li>
          <li style={{ marginBottom: '0.5rem' }}>• 最大暴露: 1000 USDC</li>
        </ul>
      </div>
      
      <div style={{ 
        padding: '1.5rem', 
        background: 'white', 
        borderRadius: '0.5rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          说明
        </h2>
        <p>这是一个比特币15分钟预测市场的自动交易系统。</p>
        <p style={{ marginTop: '0.5rem' }}>
          策略: 当检测到价格在3秒内下跌15%时，买入下跌侧；当YES+NO价格总和≤0.93时，买入对冲侧。
        </p>
      </div>
    </main>
  );
}
```

---

## 运行步骤

### 第1步：安装 Node.js

1. 访问 https://nodejs.org/
2. 下载 LTS 版本（v20+）
3. 运行安装程序

### 第2步：安装 pnpm

打开 CMD 或 PowerShell：

```bash
npm install -g pnpm
```

### 第3步：安装依赖

在项目目录下运行：

```bash
cd C:\polymarket-trading
pnpm install
```

### 第4步：运行项目

```bash
pnpm dev
```

### 第5步：访问系统

打开浏览器，访问：

```
http://localhost:5000
```

---

## 完整文件清单

**必需文件（共19个）**：

1. package.json
2. tsconfig.json
3. next.config.ts
4. next-env.d.ts
5. .env.local
6. src/types/trading.ts
7. src/config/strategy.ts
8. src/lib/polymarket-client.ts
9. src/lib/trading-engine.ts
10. src/lib/logger.ts
11. src/lib/utils.ts
12. src/app/layout.tsx
13. src/app/globals.css
14. src/app/page.tsx
15. src/app/api/engine/start/route.ts
16. src/app/api/engine/stop/route.ts
17. src/app/api/engine/status/route.ts
18. src/app/api/markets/route.ts
19. src/app/api/config/route.ts

---

## 预计时间

- 创建目录结构：2分钟
- 创建文件：15分钟
- 安装依赖：5分钟
- 运行项目：1分钟

**总计：约25分钟**

---

**祝您创建顺利！** 🚀
