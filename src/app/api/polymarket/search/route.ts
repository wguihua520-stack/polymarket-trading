import { NextResponse } from 'next/server';

/**
 * 搜索 Polymarket 市场
 * GET /api/polymarket/search?query=bitcoin
 */

interface MarketToken {
  tokenId: string;
  outcome: string;
  price: number;
}

interface MarketResult {
  marketId: string;
  conditionId: string;
  question: string;
  tokens: MarketToken[];
  spread: number;
  active: boolean;
  liquidity?: number;
  volume?: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    // 尝试从 Gamma API 获取真实市场数据
    const response = await fetch(
      `https://gamma-api.polymarket.com/markets?limit=${limit}&closed=false&active=true`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      
      const queryLower = query.toLowerCase();
      
      // 过滤并解析市场
      const markets: MarketResult[] = data
        .filter((market: any) => {
          if (!query) return true;
          return market.question?.toLowerCase().includes(queryLower) ||
                 market.description?.toLowerCase().includes(queryLower);
        })
        .map((market: any) => {
          const tokens: MarketToken[] = [];
          
          // 解析 tokens
          if (market.tokens && Array.isArray(market.tokens)) {
            for (const token of market.tokens) {
              const price = extractPrice(token);
              tokens.push({
                tokenId: token.token_id,
                outcome: token.outcome,
                price,
              });
            }
          }
          
          // 计算价差
          const upToken = tokens.find(t => t.outcome?.toUpperCase() === 'UP');
          const downToken = tokens.find(t => t.outcome?.toUpperCase() === 'DOWN');
          const yesToken = tokens.find(t => t.outcome?.toUpperCase() === 'YES');
          const noToken = tokens.find(t => t.outcome?.toUpperCase() === 'NO');
          
          let spread = 0;
          if (upToken && downToken) {
            spread = Math.abs(1 - (upToken.price + downToken.price));
          } else if (yesToken && noToken) {
            spread = Math.abs(1 - (yesToken.price + noToken.price));
          }
          
          return {
            marketId: market.condition_id || market.id,
            conditionId: market.condition_id || market.id,
            question: market.question,
            tokens,
            spread,
            active: market.active !== false,
            liquidity: parseFloat(market.volume || market.liquidity || '0') || 0,
            volume: parseFloat(market.volume || '0') || 0,
          };
        })
        .filter((m: MarketResult) => m.tokens.length >= 2);
      
      return NextResponse.json({
        success: true,
        data: markets,
        source: 'gamma-api',
        count: markets.length,
      });
    }
    
    // Gamma API 失败，返回示例数据
    return NextResponse.json({
      success: true,
      data: getExampleSearchResults(query, limit),
      source: 'example',
      count: getExampleSearchResults(query, limit).length,
      message: '无法连接 Polymarket API，显示示例数据',
    });
    
  } catch (error) {
    console.error('Search markets error:', error);
    
    // 返回示例数据而不是错误
    return NextResponse.json({
      success: true,
      data: getExampleSearchResults(query, limit),
      source: 'example',
      count: getExampleSearchResults(query, limit).length,
      message: '网络受限，显示示例数据',
    });
  }
}

/**
 * 从 token 数据中提取价格
 */
function extractPrice(token: any): number {
  const price = token.price;
  if (typeof price === 'number') return price;
  if (typeof price === 'string') return parseFloat(price) || 0.5;
  if (typeof price === 'object') {
    return parseFloat(price.price || price.bestAsk || price.bestBid || '0.5') || 0.5;
  }
  return 0.5;
}

/**
 * 获取示例搜索结果
 */
function getExampleSearchResults(query: string, limit: number): MarketResult[] {
  const allExamples: MarketResult[] = [
    {
      marketId: 'btc-15min-up-down',
      conditionId: 'btc-15min-up-down',
      question: 'Bitcoin Up or Down - 15 Minutes',
      tokens: [
        { tokenId: 'btc-15min-up-token', outcome: 'UP', price: 0.48 },
        { tokenId: 'btc-15min-down-token', outcome: 'DOWN', price: 0.52 },
      ],
      spread: 0.02,
      active: true,
      liquidity: 50000,
      volume: 150000,
    },
    {
      marketId: 'btc-1hr-up-down',
      conditionId: 'btc-1hr-up-down',
      question: 'Bitcoin Up or Down - 1 Hour',
      tokens: [
        { tokenId: 'btc-1hr-up-token', outcome: 'UP', price: 0.45 },
        { tokenId: 'btc-1hr-down-token', outcome: 'DOWN', price: 0.55 },
      ],
      spread: 0.025,
      active: true,
      liquidity: 35000,
      volume: 120000,
    },
    {
      marketId: 'eth-15min-up-down',
      conditionId: 'eth-15min-up-down',
      question: 'Ethereum Up or Down - 15 Minutes',
      tokens: [
        { tokenId: 'eth-15min-up-token', outcome: 'UP', price: 0.50 },
        { tokenId: 'eth-15min-down-token', outcome: 'DOWN', price: 0.50 },
      ],
      spread: 0.03,
      active: true,
      liquidity: 25000,
      volume: 80000,
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
