import { NextResponse } from 'next/server';
import { getInitializedCLOBClient } from '@/lib/polymarket-clob';

/**
 * 获取价格 API
 * GET /api/price?tokenId=xxx
 * GET /api/price?tokenIds=xxx,yyy
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const tokenIds = searchParams.get('tokenIds');

    const client = await getInitializedCLOBClient();
    const mode = client.getMode();

    if (tokenIds) {
      // 批量获取价格
      const ids = tokenIds.split(',').filter(Boolean);
      const prices = await client.getPrices(ids);
      
      // 获取订单簿信息
      const orderBooks = await Promise.all(
        ids.map(id => client.getOrderBook(id))
      );
      
      const result: Record<string, any> = {};
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const ob = orderBooks[i];
        result[id] = {
          price: prices[id],
          bestBid: ob?.bids?.[0]?.price || prices[id],
          bestAsk: ob?.asks?.[0]?.price || prices[id],
          spread: ob ? (ob.asks?.[0]?.price || 0) - (ob.bids?.[0]?.price || 0) : 0,
        };
      }
      
      return NextResponse.json({
        success: true,
        data: result,
        mode,
      });
    }

    if (tokenId) {
      // 单个价格查询
      const price = await client.getPrice(tokenId);
      const orderBook = await client.getOrderBook(tokenId);
      
      return NextResponse.json({
        success: true,
        data: {
          tokenId,
          price,
          orderBook: orderBook ? {
            bids: orderBook.bids.slice(0, 5),
            asks: orderBook.asks.slice(0, 5),
            bestBid: orderBook.bids[0]?.price || price,
            bestAsk: orderBook.asks[0]?.price || price,
            spread: (orderBook.asks[0]?.price || 0) - (orderBook.bids[0]?.price || 0),
          } : null,
        },
        mode,
      });
    }

    // 获取默认市场（比特币15分钟）的价格
    const btcYesPrice = await client.getPrice('btc-yes');
    const btcNoPrice = await client.getPrice('btc-no');
    const total = btcYesPrice + btcNoPrice;
    
    return NextResponse.json({
      success: true,
      data: {
        yes: btcYesPrice,
        no: btcNoPrice,
        total,
        arbitrage: total < 0.93 ? {
          opportunity: true,
          profit: 1 - total,
          profitPercent: ((1 - total) / total * 100).toFixed(2),
        } : {
          opportunity: false,
        },
      },
      mode,
    });
  } catch (error) {
    console.error('Price fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取价格失败',
    });
  }
}
