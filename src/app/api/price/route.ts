import { NextResponse } from 'next/server';
import { getPolymarketClient } from '@/lib/polymarket-client';

/**
 * 获取比特币15分钟市场实时价格
 * 动态获取当前活跃市场（每15分钟一个新市场）
 */

export async function GET(request: Request) {
  try {
    const client = getPolymarketClient();
    
    // 获取当前活跃的比特币15分钟市场
    const marketResponse = await client.getActiveBitcoinMarket();
    
    if (marketResponse.success && marketResponse.data) {
      const market = marketResponse.data;
      const total = market.prices.up + market.prices.down;
      
      // 计算剩余时间
      const now = Date.now();
      const remainingMs = market.endTime - now;
      const remainingMin = Math.max(0, Math.floor(remainingMs / 60000));
      const remainingSec = Math.max(0, Math.floor((remainingMs % 60000) / 1000));
      
      return NextResponse.json({
        success: true,
        data: {
          yes: market.prices.up,
          no: market.prices.down,
          total,
          spread: Math.abs(1 - total),
          question: market.question,
          upTokenId: market.upTokenId,
          downTokenId: market.downTokenId,
          conditionId: market.conditionId,
          endTime: market.endTime,
          remainingTime: `${remainingMin}:${remainingSec.toString().padStart(2, '0')}`,
          arbitrage: total < 0.93 ? {
            opportunity: true,
            profit: 1 - total,
            profitPercent: ((1 - total) / total * 100).toFixed(2),
          } : {
            opportunity: false,
          },
        },
        mode: 'production',
        source: 'clob-api',
      });
    }
    
    // 如果获取失败，返回错误信息
    return NextResponse.json({
      success: false,
      error: marketResponse.error || 'Failed to get active market',
      data: {
        yes: 0.5,
        no: 0.5,
        total: 1,
        arbitrage: {
          opportunity: false,
        },
      },
      mode: 'simulation',
      source: 'error',
    });
    
  } catch (error) {
    console.error('Price fetch error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        yes: 0.5,
        no: 0.5,
        total: 1,
        arbitrage: {
          opportunity: false,
        },
      },
      mode: 'simulation',
      source: 'error',
    });
  }
}
