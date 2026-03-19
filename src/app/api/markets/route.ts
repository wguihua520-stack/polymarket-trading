import { NextRequest, NextResponse } from 'next/server';
import { getPolymarketClient } from '@/lib/polymarket-client';
import type { ApiResponse, MarketData } from '@/types/trading';

/**
 * 获取市场列表
 * 如果没有配置API密钥，返回模拟数据
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ markets: MarketData[] }>>> {
  try {
    // 检查是否配置了API密钥
    const hasApiKey = process.env.POLYMARKET_API_KEY && process.env.POLYMARKET_API_SECRET;
    
    if (!hasApiKey) {
      // 返回模拟市场数据用于测试
      const mockMarkets: MarketData[] = [
        {
          marketId: 'mock-btc-15min-001',
          question: 'Will Bitcoin price be above $65,000 in 15 minutes?',
          yesPrice: 0.48,
          noPrice: 0.52,
          yesBestAsk: 0.485,
          noBestAsk: 0.525,
          yesBestBid: 0.475,
          noBestBid: 0.515,
          spread: 0.021, // 2.1%
          liquidity: 2500000,
          status: 'ACTIVE',
          timestamp: Date.now(),
        },
        {
          marketId: 'mock-btc-15min-002',
          question: 'Will Bitcoin price increase by more than 1% in the next 15 minutes?',
          yesPrice: 0.35,
          noPrice: 0.65,
          yesBestAsk: 0.355,
          noBestAsk: 0.655,
          yesBestBid: 0.345,
          noBestBid: 0.645,
          spread: 0.029, // 2.9%
          liquidity: 1800000,
          status: 'ACTIVE',
          timestamp: Date.now(),
        },
        {
          marketId: 'mock-btc-15min-003',
          question: 'Will Bitcoin break $66,000 in the next 15 minutes?',
          yesPrice: 0.42,
          noPrice: 0.58,
          yesBestAsk: 0.425,
          noBestAsk: 0.585,
          yesBestBid: 0.415,
          noBestBid: 0.575,
          spread: 0.024, // 2.4%
          liquidity: 3200000,
          status: 'ACTIVE',
          timestamp: Date.now(),
        },
      ];
      
      return NextResponse.json({
        success: true,
        data: { 
          markets: mockMarkets,
          isMockData: true,
          message: '使用模拟数据（未配置API密钥）',
        },
      });
    }
    
    // 使用真实API获取数据
    const client = getPolymarketClient();
    const response = await client.getMarkets();
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch markets');
    }
    
    return NextResponse.json({
      success: true,
      data: { markets: response.data || [], isMockData: false },
    });
  } catch (error) {
    console.error('Failed to get markets:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
