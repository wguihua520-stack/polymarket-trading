import { NextResponse } from 'next/server';
import { getPolymarketClient } from '@/lib/polymarket-client';

/**
 * 搜索 Polymarket 市场
 * GET /api/polymarket/search?query=bitcoin
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    const client = getPolymarketClient();
    
    // 使用搜索功能
    const response = await client.searchMarkets(query);
    
    if (!response.success) {
      // API 不可用，返回示例数据
      return NextResponse.json({
        success: true,
        data: getExampleSearchResults(query, limit),
        source: 'example',
        count: getExampleSearchResults(query, limit).length,
        message: '无法连接 Polymarket API，显示示例数据。部署到 Vercel 后将获取真实市场。',
      });
    }
    
    const markets = (response.data || []).slice(0, limit).map(market => ({
      marketId: market.marketId,
      conditionId: market.marketId,
      question: market.question,
      tokens: [
        { tokenId: `yes-${market.marketId}`, outcome: 'YES', price: market.yesPrice },
        { tokenId: `no-${market.marketId}`, outcome: 'NO', price: market.noPrice },
      ],
      spread: market.spread,
      active: market.status === 'ACTIVE',
      liquidity: market.liquidity,
    }));

    return NextResponse.json({
      success: true,
      data: markets,
      source: 'api',
      count: markets.length,
    });
    
  } catch (error) {
    console.error('Search markets error:', error);
    
    // 返回示例数据而不是错误
    return NextResponse.json({
      success: true,
      data: getExampleSearchResults(query, limit),
      source: 'example',
      count: getExampleSearchResults(query, limit).length,
      message: '网络受限，显示示例数据。部署到 Vercel 后将搜索真实市场。',
    });
  }
}

/**
 * 获取示例搜索结果
 */
function getExampleSearchResults(query: string, limit: number) {
  const allExamples = [
    {
      marketId: 'btc-15min-up',
      conditionId: 'btc-15min-up',
      question: 'Will Bitcoin price increase in the next 15 minutes?',
      tokens: [
        { tokenId: 'btc-yes', outcome: 'YES', price: 0.48 },
        { tokenId: 'btc-no', outcome: 'NO', price: 0.52 },
      ],
      spread: 0.02,
      active: true,
      liquidity: 50000,
    },
    {
      marketId: 'btc-1hr-above',
      conditionId: 'btc-1hr-above',
      question: 'Will Bitcoin be above $70,000 in 1 hour?',
      tokens: [
        { tokenId: 'btc-1hr-yes', outcome: 'YES', price: 0.45 },
        { tokenId: 'btc-1hr-no', outcome: 'NO', price: 0.55 },
      ],
      spread: 0.025,
      active: true,
      liquidity: 35000,
    },
    {
      marketId: 'eth-hourly',
      conditionId: 'eth-hourly',
      question: 'Will Ethereum increase by 2% in the next hour?',
      tokens: [
        { tokenId: 'eth-yes', outcome: 'YES', price: 0.35 },
        { tokenId: 'eth-no', outcome: 'NO', price: 0.65 },
      ],
      spread: 0.03,
      active: true,
      liquidity: 25000,
    },
    {
      marketId: 'sol-daily',
      conditionId: 'sol-daily',
      question: 'Will Solana reach $200 today?',
      tokens: [
        { tokenId: 'sol-yes', outcome: 'YES', price: 0.28 },
        { tokenId: 'sol-no', outcome: 'NO', price: 0.72 },
      ],
      spread: 0.035,
      active: true,
      liquidity: 20000,
    },
  ];
  
  const queryLower = query.toLowerCase();
  
  let filtered = allExamples;
  if (query) {
    filtered = allExamples.filter(m => 
      m.question.toLowerCase().includes(queryLower)
    );
  }
  
  return filtered.slice(0, limit);
}
