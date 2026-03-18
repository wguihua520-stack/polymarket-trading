import { NextRequest, NextResponse } from 'next/server';
import { getPolymarketClient } from '@/lib/polymarket-client';
import type { ApiResponse, MarketData } from '@/types/trading';

/**
 * 获取市场列表
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ markets: MarketData[] }>>> {
  try {
    const client = getPolymarketClient();
    const response = await client.getMarkets();
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch markets');
    }
    
    return NextResponse.json({
      success: true,
      data: { markets: response.data || [] },
    });
  } catch (error) {
    console.error('Failed to get markets:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
