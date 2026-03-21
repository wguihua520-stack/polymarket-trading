import { NextResponse } from 'next/server';

/**
 * 获取比特币15分钟市场信息
 * 用于获取正确的 Token IDs
 */

export async function GET(request: Request) {
  try {
    // 方法1: 通过 slug 查询 Gamma API
    const gammaResponse = await fetch(
      'https://gamma-api.polymarket.com/markets?slug=btc-15m-change&closed=false',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );
    
    if (gammaResponse.ok) {
      const data = await gammaResponse.json();
      const market = Array.isArray(data) ? data[0] : data;
      
      if (market && market.tokens) {
        const upToken = market.tokens.find((t: any) => t.outcome?.toUpperCase() === 'UP');
        const downToken = market.tokens.find((t: any) => t.outcome?.toUpperCase() === 'DOWN');
        
        if (upToken && downToken) {
          // 提取价格
          const extractPrice = (token: any) => {
            const price = token.price;
            if (typeof price === 'number') return price;
            if (typeof price === 'string') return parseFloat(price) || 0.5;
            if (typeof price === 'object') {
              return parseFloat(price.price || price.bestAsk || price.bestBid || '0.5') || 0.5;
            }
            return 0.5;
          };
          
          return NextResponse.json({
            success: true,
            data: {
              marketId: market.condition_id || market.id,
              question: market.question,
              up: {
                tokenId: upToken.token_id,
                outcome: upToken.outcome,
                price: extractPrice(upToken),
                bestBid: upToken.price?.bestBid ? parseFloat(upToken.price.bestBid) : null,
                bestAsk: upToken.price?.bestAsk ? parseFloat(upToken.price.bestAsk) : null,
              },
              down: {
                tokenId: downToken.token_id,
                outcome: downToken.outcome,
                price: extractPrice(downToken),
                bestBid: downToken.price?.bestBid ? parseFloat(downToken.price.bestBid) : null,
                bestAsk: downToken.price?.bestAsk ? parseFloat(downToken.price.bestAsk) : null,
              },
              spread: Math.abs(1 - (extractPrice(upToken) + extractPrice(downToken))),
              active: market.active !== false,
              source: 'gamma-api',
            },
          });
        }
      }
    }
    
    // 方法2: 尝试搜索比特币15分钟市场
    const searchResponse = await fetch(
      'https://gamma-api.polymarket.com/markets?limit=20&closed=false&active=true',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );
    
    if (searchResponse.ok) {
      const markets = await searchResponse.json();
      
      // 找到比特币15分钟市场
      const btcMarket = markets.find((m: any) => 
        m.question?.toLowerCase().includes('bitcoin') && 
        m.question?.toLowerCase().includes('15') &&
        (m.question?.toLowerCase().includes('up') || m.question?.toLowerCase().includes('down'))
      );
      
      if (btcMarket && btcMarket.tokens) {
        const upToken = btcMarket.tokens.find((t: any) => t.outcome?.toUpperCase() === 'UP');
        const downToken = btcMarket.tokens.find((t: any) => t.outcome?.toUpperCase() === 'DOWN');
        
        if (upToken && downToken) {
          const extractPrice = (token: any) => {
            const price = token.price;
            if (typeof price === 'number') return price;
            if (typeof price === 'string') return parseFloat(price) || 0.5;
            if (typeof price === 'object') {
              return parseFloat(price.price || price.bestAsk || price.bestBid || '0.5') || 0.5;
            }
            return 0.5;
          };
          
          return NextResponse.json({
            success: true,
            data: {
              marketId: btcMarket.condition_id || btcMarket.id,
              question: btcMarket.question,
              up: {
                tokenId: upToken.token_id,
                outcome: upToken.outcome,
                price: extractPrice(upToken),
                bestBid: upToken.price?.bestBid ? parseFloat(upToken.price.bestBid) : null,
                bestAsk: upToken.price?.bestAsk ? parseFloat(upToken.price.bestAsk) : null,
              },
              down: {
                tokenId: downToken.token_id,
                outcome: downToken.outcome,
                price: extractPrice(downToken),
                bestBid: downToken.price?.bestBid ? parseFloat(downToken.price.bestBid) : null,
                bestAsk: downToken.price?.bestAsk ? parseFloat(downToken.price.bestAsk) : null,
              },
              spread: Math.abs(1 - (extractPrice(upToken) + extractPrice(downToken))),
              active: btcMarket.active !== false,
              source: 'gamma-api-search',
            },
          });
        }
      }
    }
    
    // 返回默认 Token IDs（需要用户手动更新）
    return NextResponse.json({
      success: false,
      error: 'Could not find Bitcoin 15min market',
      data: {
        message: 'Please manually configure the Token IDs from Polymarket website',
        defaultUpTokenId: '21742633143463906290569050155826241533067272736897614950488156847949938836455',
        defaultDownTokenId: '62391862665526084067340065550710875152847290587576605636812166568643269021657',
      },
    });
    
  } catch (error) {
    console.error('Market info fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
