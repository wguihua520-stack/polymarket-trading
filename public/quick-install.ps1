# 创建项目目录
$projectPath = "C:\polymarket-trading"
New-Item -ItemType Directory -Force -Path $projectPath | Out-Null

# 创建子目录
$directories = @(
    "$projectPath\src\types",
    "$projectPath\src\config",
    "$projectPath\src\lib",
    "$projectPath\src\app\api\engine\start",
    "$projectPath\src\app\api\engine\stop",
    "$projectPath\src\app\api\engine\status",
    "$projectPath\src\app\api\markets",
    "$projectPath\src\app\api\config",
    "$projectPath\public"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

Write-Host "✅ 目录创建完成" -ForegroundColor Green

# 创建 package.json
@"
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
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.13.10",
    "@types/react": "^19.0.0",
    "typescript": "^5.8.2"
  }
}
"@ | Out-File -FilePath "$projectPath\package.json" -Encoding utf8

# 创建 tsconfig.json
@"
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
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
"@ | Out-File -FilePath "$projectPath\tsconfig.json" -Encoding utf8

# 创建 next.config.ts
@"
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
"@ | Out-File -FilePath "$projectPath\next.config.ts" -Encoding utf8

# 创建 next-env.d.ts
@"
/// <reference types="next" />
/// <reference types="next/image-types/global" />
"@ | Out-File -FilePath "$projectPath\next-env.d.ts" -Encoding utf8

# 创建 .env.local
@"
POLYMARKET_API_KEY=019cc244-caab-7bf1-884e-61392538582e
POLYMARKET_API_SECRET=HS5QdfZ0Yq7kqhXLSEpy90aS6V9_liZe5OWz6PTymNY=
WALLET_PRIVATE_KEY=0x89a07674466649a1a49b170fbf8abb5358041a70e37d8b6311216d2b33f64c93
POSITION_SIZE=100
MAX_EXPOSURE=1000
"@ | Out-File -FilePath "$projectPath\.env.local" -Encoding utf8

Write-Host "✅ 配置文件创建完成" -ForegroundColor Green

# 创建类型定义
@"
export type TradeSide = 'YES' | 'NO';
export type MarketStatus = 'ACTIVE' | 'INACTIVE' | 'SETTLED';
export type RoundStatus = 'IDLE' | 'MONITORING' | 'LEG1_EXECUTED' | 'COMPLETED' | 'FAILED';

export interface MarketData {
  marketId: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  spread: number;
  liquidity: number;
  status: MarketStatus;
  timestamp: number;
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

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR';
  category: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
"@ | Out-File -FilePath "$projectPath\src\types\trading.ts" -Encoding utf8

# 创建策略配置
@"
export const DEFAULT_CONFIG = {
  sumTarget: 0.93,
  movePct: 0.15,
  windowMin: 3,
  positionSize: 100,
  maxExposure: 1000,
  targetMarket: 'Bitcoin 15 minute',
};

export const POLYMARKET_CONFIG = {
  GAMMA_API_URL: 'https://gamma-api.polymarket.com',
};

export function getConfig() {
  return {
    ...DEFAULT_CONFIG,
    polymarketApiKey: process.env.POLYMARKET_API_KEY,
  };
}
"@ | Out-File -FilePath "$projectPath\src\config\strategy.ts" -Encoding utf8

# 创建 API 客户端
@"
import type { MarketData, ApiResponse } from '@/types/trading';
import { POLYMARKET_CONFIG } from '@/config/strategy';

export class PolymarketClient {
  async getMarkets(): Promise<ApiResponse<MarketData[]>> {
    try {
      const response = await fetch(\`\${POLYMARKET_CONFIG.GAMMA_API_URL}/markets?limit=100&active=true\`);
      const data = await response.json();
      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: 'Failed to fetch markets' };
    }
  }
}

let client: PolymarketClient | null = null;
export function getPolymarketClient() {
  if (!client) client = new PolymarketClient();
  return client;
}
"@ | Out-File -FilePath "$projectPath\src\lib\polymarket-client.ts" -Encoding utf8

# 创建交易引擎
@"
import type { SystemState, LogEntry } from '@/types/trading';
import { getConfig } from '@/config/strategy';

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

  async start(): Promise<void> {
    this.state.isRunning = true;
    this.state.lastUpdate = Date.now();
  }

  async stop(): Promise<void> {
    this.state.isRunning = false;
    this.state.lastUpdate = Date.now();
  }

  getState(): SystemState {
    return this.state;
  }
}

let engine: TradingEngine | null = null;
export function getTradingEngine() {
  if (!engine) engine = new TradingEngine();
  return engine;
}
"@ | Out-File -FilePath "$projectPath\src\lib\trading-engine.ts" -Encoding utf8

Write-Host "✅ 核心库创建完成" -ForegroundColor Green

# 创建 API 路由
@"
import { NextResponse } from 'next/server';
import { getTradingEngine } from '@/lib/trading-engine';

export async function POST() {
  const engine = getTradingEngine();
  await engine.start();
  return NextResponse.json({ success: true });
}
"@ | Out-File -FilePath "$projectPath\src\app\api\engine\start\route.ts" -Encoding utf8

@"
import { NextResponse } from 'next/server';
import { getTradingEngine } from '@/lib/trading-engine';

export async function POST() {
  const engine = getTradingEngine();
  await engine.stop();
  return NextResponse.json({ success: true });
}
"@ | Out-File -FilePath "$projectPath\src\app\api\engine\stop\route.ts" -Encoding utf8

@"
import { NextResponse } from 'next/server';
import { getTradingEngine } from '@/lib/trading-engine';

export async function GET() {
  const engine = getTradingEngine();
  const state = engine.getState();
  return NextResponse.json({ success: true, data: { state } });
}
"@ | Out-File -FilePath "$projectPath\src\app\api\engine\status\route.ts" -Encoding utf8

@"
import { NextResponse } from 'next/server';
import { getPolymarketClient } from '@/lib/polymarket-client';

export async function GET() {
  const client = getPolymarketClient();
  const response = await client.getMarkets();
  return NextResponse.json({ success: response.success, data: { markets: [] } });
}
"@ | Out-File -FilePath "$projectPath\src\app\api\markets\route.ts" -Encoding utf8

@"
import { NextResponse } from 'next/server';
import { getConfig } from '@/config/strategy';

export async function GET() {
  const config = getConfig();
  return NextResponse.json({
    success: true,
    data: {
      sumTarget: config.sumTarget,
      movePct: config.movePct,
      positionSize: config.positionSize,
    }
  });
}
"@ | Out-File -FilePath "$projectPath\src\app\api\config\route.ts" -Encoding utf8

Write-Host "✅ API路由创建完成" -ForegroundColor Green

# 创建页面
@"
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polymarket Trading",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html><body>{children}</body></html>;
}
"@ | Out-File -FilePath "$projectPath\src\app\layout.tsx" -Encoding utf8

@"
body { font-family: system-ui; background: #f5f5f5; }
"@ | Out-File -FilePath "$projectPath\src\app\globals.css" -Encoding utf8

@"
'use client';
import { useState } from 'react';

export default function Home() {
  const [running, setRunning] = useState(false);

  const start = async () => {
    await fetch('/api/engine/start', { method: 'POST' });
    setRunning(true);
  };

  const stop = async () => {
    await fetch('/api/engine/stop', { method: 'POST' });
    setRunning(false);
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>比特币15分钟交易系统</h1>
      <p>状态: {running ? '运行中' : '已停止'}</p>
      <button onClick={running ? stop : start} style={{
        padding: '10px 20px',
        background: running ? 'red' : 'green',
        color: 'white',
        border: 'none',
        borderRadius: 5,
        cursor: 'pointer'
      }}>
        {running ? '停止' : '启动'}
      </button>
    </main>
  );
}
"@ | Out-File -FilePath "$projectPath\src\app\page.tsx" -Encoding utf8

Write-Host "✅ 页面创建完成" -ForegroundColor Green

# 显示结果
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ 项目创建完成！" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "位置: $projectPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步:" -ForegroundColor Yellow
Write-Host "1. cd $projectPath"
Write-Host "2. npm install -g pnpm"
Write-Host "3. pnpm install"
Write-Host "4. pnpm dev"
Write-Host "5. 访问 http://localhost:5000"
