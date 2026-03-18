import { NextRequest, NextResponse } from 'next/server';
import { getTradingEngine } from '@/lib/trading-engine';
import type { ApiResponse, SystemState, TradingRound, LogEntry } from '@/types/trading';

// 存储状态、轮次和日志的回调数据（用于WebSocket推送）
let latestState: SystemState | null = null;
let latestRound: TradingRound | null = null;
let recentLogs: LogEntry[] = [];

/**
 * 启动交易引擎
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ state: SystemState }>>> {
  try {
    const engine = getTradingEngine();
    
    // 初始化引擎（首次启动时）
    if (!engine.getState().isRunning) {
      await engine.initialize(
        (state) => {
          latestState = state;
        },
        (round) => {
          latestRound = round;
        },
        (log) => {
          recentLogs.push(log);
          // 只保留最近100条日志
          if (recentLogs.length > 100) {
            recentLogs.shift();
          }
        }
      );
    }
    
    // 启动引擎
    await engine.start();
    
    const state = engine.getState();
    
    return NextResponse.json({
      success: true,
      data: { state },
    });
  } catch (error) {
    console.error('Failed to start engine:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
