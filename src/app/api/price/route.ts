import { NextResponse } from 'next/server';
import { getEnabledMarkets } from '@/lib/config-store';

/**
 * 获取比特币15分钟市场实时价格
 * 使用 Polymarket CLOB API 获取订单簿价格
 */

/**
 * 从 CLOB API 获取订单簿价格
 */
async function getOrderBookPrice(tokenId: string): Promise<{ price: number; bestBid: number; bestAsk: number } | null> {
  try {
    const response = await fetch(
      `https://clob.polymarket.com/book?token_id=${tokenId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );
    
    if (!response.ok) {
      console.error(`Order book API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // 从订单簿获取最优买卖价
    const bestBid = data.bids?.[0]?.price ? parseFloat(data.bids[0].price) : null;
    const bestAsk = data.asks?.[0]?.price ? parseFloat(data.asks[0].price) : null;
    
    if (bestBid !== null && bestAsk !== null) {
      // 中间价
      const price = (bestBid + bestAsk) / 2;
      return { price, bestBid, bestAsk };
    }
    
    // 如果订单簿为空，尝试获取最新成交价
    if (data.last_price) {
      const price = parseFloat(data.last_price);
      return { price, bestBid: price, bestAsk: price };
    }
    
    return null;
  } catch (error) {
    console.error('Order book fetch error:', error);
    return null;
  }
}

/**
 * 从 Gamma API 获取市场信息
 */
async function getMarketInfo() {
  try {
    const response = await fetch(
      'https://gamma-api.polymarket.com/markets?slug=btc-15m-change&closed=false',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const market = Array.isArray(data) ? data[0] : data;
    
    return market;
  } catch (error) {
    console.error('Gamma API error:', error);
    return null;
  }
}

/**
 * 搜索比特币15分钟市场
 */
async function searchBitcoinMarket() {
  try {
    const response = await fetch(
      'https://gamma-api.polymarket.com/markets?limit=20&closed=false&active=true',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const markets = await response.json();
    
    // 找到比特币15分钟市场
    return markets.find((m: any) => 
      m.question?.toLowerCase().includes('bitcoin') && 
      m.question?.toLowerCase().includes('15') &&
      (m.question?.toLowerCase().includes('up') || m.question?.toLowerCase().includes('down'))
    );
  } catch (error) {
    console.error('Market search error:', error);
    return null;
  }
}

/**
 * 从 Gamma API 数据中提取价格
 */
function extractPriceFromToken(token: any): number {
  const price = token.price;
  if (typeof price === 'number') return price;
  if (typeof price === 'string') return parseFloat(price) || 0.5;
  if (typeof price === 'object') {
    return parseFloat(price.price || price.bestAsk || price.bestBid || '0.5') || 0.5;
  }
  return 0.5;
}

export async function GET(request: Request) {
  try {
    // 1. 尝试从存储的市场配置获取 Token ID
    const enabledMarkets = getEnabledMarkets();
    const btcMarket = enabledMarkets.find(m => 
      m.question?.toLowerCase().includes('bitcoin') && 
      m.question?.toLowerCase().includes('15')
    );
    
    let upTokenId = '';
    let downTokenId = '';
    
    if (btcMarket) {
      upTokenId = btcMarket.upTokenId || btcMarket.yesTokenId;
      downTokenId = btcMarket.downTokenId || btcMarket.noTokenId;
    }
    
    // 2. 如果没有存储的配置，尝试从 Gamma API 获取
    let marketInfo = null;
    
    if (!upTokenId || !downTokenId) {
      marketInfo = await getMarketInfo() || await searchBitcoinMarket();
      
      if (marketInfo && marketInfo.tokens) {
        const upToken = marketInfo.tokens.find((t: any) => t.outcome?.toUpperCase() === 'UP');
        const downToken = marketInfo.tokens.find((t: any) => t.outcome?.toUpperCase() === 'DOWN');
        
        if (upToken) upTokenId = upToken.token_id;
        if (downToken) downTokenId = downToken.token_id;
        
        console.log(`[Price API] Found tokens from Gamma API: UP=${upTokenId}, DOWN=${downTokenId}`);
      }
    }
    
    // 3. 如果有 Token ID，尝试从 CLOB API 获取实时订单簿价格
    if (upTokenId && downTokenId) {
      const [upOrderBook, downOrderBook] = await Promise.all([
        getOrderBookPrice(upTokenId),
        getOrderBookPrice(downTokenId),
      ]);
      
      if (upOrderBook && downOrderBook) {
        const total = upOrderBook.price + downOrderBook.price;
        
        return NextResponse.json({
          success: true,
          data: {
            yes: upOrderBook.price,
            no: downOrderBook.price,
            total,
            yesBestBid: upOrderBook.bestBid,
            yesBestAsk: upOrderBook.bestAsk,
            noBestBid: downOrderBook.bestBid,
            noBestAsk: downOrderBook.bestAsk,
            spread: Math.abs(1 - total),
            question: marketInfo?.question || 'Bitcoin Up or Down - 15 Minutes',
            upTokenId,
            downTokenId,
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
    }
    
    // 4. 如果 CLOB API 失败但有 Gamma API 数据，使用 Gamma API 价格
    if (marketInfo && marketInfo.tokens) {
      const upToken = marketInfo.tokens.find((t: any) => t.outcome?.toUpperCase() === 'UP');
      const downToken = marketInfo.tokens.find((t: any) => t.outcome?.toUpperCase() === 'DOWN');
      
      if (upToken && downToken) {
        const upPrice = extractPriceFromToken(upToken);
        const downPrice = extractPriceFromToken(downToken);
        const total = upPrice + downPrice;
        
        return NextResponse.json({
          success: true,
          data: {
            yes: upPrice,
            no: downPrice,
            total,
            yesBestBid: upToken.price?.bestBid ? parseFloat(upToken.price.bestBid) : upPrice,
            yesBestAsk: upToken.price?.bestAsk ? parseFloat(upToken.price.bestAsk) : upPrice,
            noBestBid: downToken.price?.bestBid ? parseFloat(downToken.price.bestBid) : downPrice,
            noBestAsk: downToken.price?.bestAsk ? parseFloat(downToken.price.bestAsk) : downPrice,
            spread: Math.abs(1 - total),
            question: marketInfo.question,
            upTokenId: upToken.token_id,
            downTokenId: downToken.token_id,
            arbitrage: total < 0.93 ? {
              opportunity: true,
              profit: 1 - total,
              profitPercent: ((1 - total) / total * 100).toFixed(2),
            } : {
              opportunity: false,
            },
          },
          mode: 'production',
          source: 'gamma-api',
        });
      }
    }
    
    // 5. 如果都失败，返回模拟数据并提示用户配置 Token ID
    const mockUp = 0.5 + (Math.random() - 0.5) * 0.1;
    const mockDown = 1 - mockUp + (Math.random() - 0.5) * 0.02;
    const total = mockUp + mockDown;
    
    return NextResponse.json({
      success: true,
      data: {
        yes: mockUp,
        no: mockDown,
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
      source: 'mock',
      error: '无法获取实时价格，请检查网络连接或在配置向导中选择正确的市场',
      hint: '请通过配置向导选择 Bitcoin 15分钟市场以获取实时价格',
    });
    
  } catch (error) {
    console.error('Price fetch error:', error);
    
    // 返回模拟数据
    const mockUp = 0.5 + (Math.random() - 0.5) * 0.1;
    const mockDown = 1 - mockUp + (Math.random() - 0.5) * 0.02;
    const total = mockUp + mockDown;
    
    return NextResponse.json({
      success: true,
      data: {
        yes: mockUp,
        no: mockDown,
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
      source: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
