import { NextResponse } from 'next/server';
import { getPolymarketClient } from '@/lib/polymarket-client';

/**
 * 获取价格 API
 * GET /api/price - 获取比特币15分钟市场实时价格
 */
export async function GET(request: Request) {
  try {
    const client = getPolymarketClient();
    
    // 获取比特币15分钟市场数据
    const response = await client.getBitcoin15MinMarket();
    
    if (!response.success || !response.data) {
      // 如果获取失败，返回模拟数据
      const mockYes = 0.5 + (Math.random() - 0.5) * 0.1;
      const mockNo = 1 - mockYes + (Math.random() - 0.5) * 0.02;
      const total = mockYes + mockNo;
      
      return NextResponse.json({
        success: true,
        data: {
          yes: mockYes,
          no: mockNo,
          total,
          arbitrage: total < 0.93 ? {
            opportunity: true,
            profit: 1 - total,
            profitPercent: ((1 - total) / total * 100).toFixed(2),
          } : {
            opportunity: false,
          },
        },
        mode: 'simulation',
        error: response.error || 'Failed to fetch market data',
      });
    }
    
    const market = response.data;
    const total = market.yesPrice + market.noPrice;
    
    return NextResponse.json({
      success: true,
      data: {
        yes: market.yesPrice,
        no: market.noPrice,
        total,
        yesBestAsk: market.yesBestAsk,
        noBestAsk: market.noBestAsk,
        yesBestBid: market.yesBestBid,
        noBestBid: market.noBestBid,
        spread: market.spread,
        question: market.question,
        arbitrage: total < 0.93 ? {
          opportunity: true,
          profit: 1 - total,
          profitPercent: ((1 - total) / total * 100).toFixed(2),
        } : {
          opportunity: false,
        },
      },
      mode: 'production',
    });
  } catch (error) {
    console.error('Price fetch error:', error);
    
    // 返回模拟数据作为兜底
    const mockYes = 0.5 + (Math.random() - 0.5) * 0.1;
    const mockNo = 1 - mockYes + (Math.random() - 0.5) * 0.02;
    const total = mockYes + mockNo;
    
    return NextResponse.json({
      success: true,
      data: {
        yes: mockYes,
        no: mockNo,
        total,
        arbitrage: total < 0.93 ? {
          opportunity: true,
          profit: 1 - total,
          profitPercent: ((1 - total) / total * 100).toFixed(2),
        } : {
          opportunity: false,
        },
      },
      mode: 'simulation',
      error: error instanceof Error ? error.message : '获取价格失败',
    });
  }
}
