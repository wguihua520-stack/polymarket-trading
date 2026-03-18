import { NextRequest, NextResponse } from 'next/server';
import { getTradingEngine } from '@/lib/trading-engine';
import type { ApiResponse, SystemState } from '@/types/trading';

/**
 * 停止交易引擎
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ state: SystemState }>>> {
  try {
    const engine = getTradingEngine();
    await engine.stop();
    
    const state = engine.getState();
    
    return NextResponse.json({
      success: true,
      data: { state },
    });
  } catch (error) {
    console.error('Failed to stop engine:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
