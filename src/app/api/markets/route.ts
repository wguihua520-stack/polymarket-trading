import { NextRequest, NextResponse } from 'next/server';
import { getPolymarketClient } from '@/lib/polymarket-client';
import type { ApiResponse, MarketData } from '@/types/trading';

/**
 * 获取市场列表
 * 从 Gamma API 获取真实的 Polymarket 市场数据
 * 如果网络不可达，返回示例市场数据
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ markets: MarketData[] }>>> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');
    
    const client = getPolymarketClient();
    
    // 如果有搜索关键词，使用搜索功能
    let response;
    if (query) {
      response = await client.searchMarkets(query);
    } else {
      response = await client.getMarkets();
    }
    
    if (!response.success) {
      // API 调用失败，返回示例数据
      console.log('Gamma API unavailable, returning example markets');
      return NextResponse.json({
        success: true,
        data: { 
          markets: getExampleMarkets(), 
          count: getExampleMarkets().length,
          isMockData: true,
          message: '无法连接 Polymarket API，显示示例市场。部署到 Vercel 后将获取真实数据。'
        },
      });
    }
    
    const markets = response.data || [];
    
    return NextResponse.json({
      success: true,
      data: { 
        markets, 
        count: markets.length,
        isMockData: false 
      },
    });
    
  } catch (error) {
    console.error('Failed to get markets:', error);
    
    // 返回示例数据而不是错误
    return NextResponse.json({
      success: true,
      data: { 
        markets: getExampleMarkets(), 
        count: getExampleMarkets().length,
        isMockData: true,
        message: '网络受限，显示示例市场。部署到 Vercel 后将获取真实数据。'
      },
    });
  }
}

/**
 * 获取示例市场数据（当 API 不可用时使用）
 */
function getExampleMarkets(): MarketData[] {
  return [
    {
      marketId: 'example-btc-15min',
      question: 'Will Bitcoin price increase in the next 15 minutes?',
      yesPrice: 0.48,
      noPrice: 0.52,
      yesBestAsk: 0.485,
      noBestAsk: 0.525,
      yesBestBid: 0.475,
      noBestBid: 0.515,
      spread: 0.02,
      liquidity: 50000,
      status: 'ACTIVE',
      timestamp: Date.now(),
    },
    {
      marketId: 'example-eth-hourly',
      question: 'Will Ethereum be above $3,500 in 1 hour?',
      yesPrice: 0.55,
      noPrice: 0.45,
      yesBestAsk: 0.555,
      noBestAsk: 0.455,
      yesBestBid: 0.545,
      noBestBid: 0.445,
      spread: 0.015,
      liquidity: 30000,
      status: 'ACTIVE',
      timestamp: Date.now(),
    },
    {
      marketId: 'example-sol-daily',
      question: 'Will Solana reach $200 today?',
      yesPrice: 0.35,
      noPrice: 0.65,
      yesBestAsk: 0.355,
      noBestAsk: 0.655,
      yesBestBid: 0.345,
      noBestBid: 0.645,
      spread: 0.025,
      liquidity: 25000,
      status: 'ACTIVE',
      timestamp: Date.now(),
    },
  ];
}
