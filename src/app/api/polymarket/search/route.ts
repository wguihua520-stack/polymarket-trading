import { NextResponse } from 'next/server';
import { POLYMARKET_CONFIG } from '@/config/strategy';

/**
 * 搜索 Polymarket 市场
 * GET /api/polymarket/search?query=bitcoin
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    // 使用 Gamma API 搜索市场
    const gammaUrl = `${POLYMARKET_CONFIG.GAMMA_API_URL}/markets`;
    
    const response = await fetch(gammaUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // 如果 Gamma API 不可用，返回模拟数据
      return NextResponse.json({
        success: true,
        data: getSimulatedMarkets(query, limit),
        source: 'simulation',
        message: 'API 不可用，显示模拟数据',
      });
    }

    const data = await response.json();
    
    // 过滤和转换数据
    let markets = Array.isArray(data) ? data : [];
    
    if (query) {
      const queryLower = query.toLowerCase();
      markets = markets.filter((m: any) => 
        m.question?.toLowerCase().includes(queryLower) ||
        m.description?.toLowerCase().includes(queryLower)
      );
    }

    // 转换为统一格式
    const result = markets.slice(0, limit).map((m: any) => ({
      marketId: m.id || m.market_id,
      conditionId: m.condition_id || m.conditionId,
      question: m.question || 'Unknown',
      description: m.description || '',
      tokens: (m.tokens || []).map((t: any) => ({
        tokenId: t.token_id || t.tokenId,
        outcome: t.outcome || 'Unknown',
        price: parseFloat(t.price || '0.5'),
      })),
      spread: calculateSpread(m.tokens),
      active: m.active !== false,
      volume: parseFloat(m.volume || '0'),
      liquidity: parseFloat(m.liquidity || '0'),
    }));

    return NextResponse.json({
      success: true,
      data: result,
      source: 'api',
    });
  } catch (error) {
    console.error('Search markets error:', error);
    
    // 返回模拟数据
    return NextResponse.json({
      success: true,
      data: getSimulatedMarkets(query, limit),
      source: 'simulation',
      message: '查询失败，显示模拟数据',
    });
  }
}

/**
 * 计算买卖价差
 */
function calculateSpread(tokens: any[] = []): number {
  if (!tokens || tokens.length < 2) return 1;
  
  const prices = tokens.map(t => parseFloat(t.price || '0.5'));
  const yesPrice = prices[0] || 0.5;
  const noPrice = prices[1] || 0.5;
  
  // 价差 = 1 - (yes + no) 的偏差
  const sum = yesPrice + noPrice;
  return Math.abs(1 - sum);
}

/**
 * 获取模拟市场数据
 */
function getSimulatedMarkets(query: string, limit: number) {
  const allMarkets = [
    {
      marketId: 'btc-15min-up-down',
      conditionId: 'btc-15min-condition',
      question: 'Will Bitcoin price increase in the next 15 minutes?',
      description: 'Bitcoin 15-minute price prediction market',
      tokens: [
        { tokenId: 'btc-yes', outcome: 'YES', price: 0.51 },
        { tokenId: 'btc-no', outcome: 'NO', price: 0.49 },
      ],
      spread: 0.02,
      active: true,
      volume: 50000,
      liquidity: 100000,
    },
    {
      marketId: 'btc-1hr-up-down',
      conditionId: 'btc-1hr-condition',
      question: 'Will Bitcoin go up in the next hour?',
      description: 'Bitcoin hourly price prediction',
      tokens: [
        { tokenId: 'btc-1hr-yes', outcome: 'YES', price: 0.52 },
        { tokenId: 'btc-1hr-no', outcome: 'NO', price: 0.48 },
      ],
      spread: 0.015,
      active: true,
      volume: 120000,
      liquidity: 250000,
    },
    {
      marketId: 'eth-15min-up-down',
      conditionId: 'eth-15min-condition',
      question: 'Will Ethereum price increase in the next 15 minutes?',
      description: 'Ethereum 15-minute price prediction market',
      tokens: [
        { tokenId: 'eth-yes', outcome: 'YES', price: 0.50 },
        { tokenId: 'eth-no', outcome: 'NO', price: 0.50 },
      ],
      spread: 0.03,
      active: true,
      volume: 30000,
      liquidity: 80000,
    },
  ];

  // 过滤查询
  let filtered = allMarkets;
  if (query) {
    const queryLower = query.toLowerCase();
    filtered = allMarkets.filter(m => 
      m.question.toLowerCase().includes(queryLower) ||
      m.description.toLowerCase().includes(queryLower)
    );
  }

  return filtered.slice(0, limit);
}
