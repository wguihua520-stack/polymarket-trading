import { NextRequest, NextResponse } from 'next/server';
import { getTradingEngine } from '@/lib/trading-engine';
import type { ApiResponse, SystemState, TradingRound, LogEntry } from '@/types/trading';
import { logger } from '@/lib/logger';

/**
 * 获取系统状态
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{
  state: SystemState;
  currentRound?: TradingRound;
  recentLogs: LogEntry[];
}>>> {
  try {
    const engine = getTradingEngine();
    const state = engine.getState();
    const currentRound = engine.getCurrentRound();
    const recentLogs = logger.readRecentLogs(50);
    
    return NextResponse.json({
      success: true,
      data: {
        state,
        currentRound,
        recentLogs,
      },
    });
  } catch (error) {
    console.error('Failed to get status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
