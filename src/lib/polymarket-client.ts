import type { MarketData, PriceData, OrderRequest, OrderResponse, ApiResponse, TradeSide } from '@/types/trading';
import { POLYMARKET_CONFIG, getConfig } from '@/config/strategy';
import { calculateTokenIds, formatTokenId } from './token-utils';

/**
 * 当前活跃市场信息
 */
interface ActiveMarket {
  conditionId: string;
  question: string;
  upTokenId: string;
  downTokenId: string;
  endTime: number;
  startTime: number;
  prices: {
    up: number;
    down: number;
  };
}

/**
 * Polymarket API客户端
 * 负责与Polymarket REST API和WebSocket API通信
 */
export class PolymarketClient {
  private apiKey?: string;
  private apiSecret?: string;
  private ws?: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  // 当前活跃市场缓存
  private activeMarket: ActiveMarket | null = null;
  private marketCacheTime: number = 0;
  private readonly MARKET_CACHE_TTL = 30000; // 30秒缓存
  
  constructor() {
    const config = getConfig();
    this.apiKey = config.polymarketApiKey;
    this.apiSecret = config.polymarketApiSecret;
  }
  
  /**
   * 获取当前活跃的比特币15分钟市场
   * 每个市场只有15分钟，需要动态获取最新的
   */
  async getActiveBitcoinMarket(): Promise<ApiResponse<ActiveMarket>> {
    try {
      const now = Date.now();
      
      // 使用缓存（如果还在有效期内）
      if (this.activeMarket && (now - this.marketCacheTime) < this.MARKET_CACHE_TTL) {
        // 检查市场是否还有效（至少还有1分钟）
        if (this.activeMarket.endTime - now > 60000) {
          return { success: true, data: this.activeMarket };
        }
      }
      
      // 从 Gamma API 获取最新的比特币15分钟市场
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
        throw new Error(`Gamma API error: ${response.status}`);
      }
      
      const markets = await response.json();
      
      console.log(`[Market] Found ${markets.length} markets from Gamma API`);
      
      // 打印所有市场名称（调试用）
      markets.forEach((m: any, i: number) => {
        console.log(`[Market ${i}] ${m.question}`);
      });
      
      // 找到比特币15分钟市场（UP/DOWN 格式）- 放宽条件
      let btcMarket = markets.find((m: any) => {
        const question = m.question?.toLowerCase() || '';
        return (
          (question.includes('bitcoin') || question.includes('btc')) &&
          question.includes('15') &&
          (question.includes('up') || question.includes('down'))
        );
      });
      
      // 如果没找到，尝试更宽松的条件
      if (!btcMarket) {
        console.log('[Market] No exact match, trying broader search...');
        btcMarket = markets.find((m: any) => {
          const question = m.question?.toLowerCase() || '';
          return (
            (question.includes('bitcoin') || question.includes('btc')) &&
            (question.includes('up') || question.includes('down') || 
             question.includes('涨') || question.includes('跌'))
          );
        });
      }
      
      // 如果还是没找到，尝试任何比特币市场
      if (!btcMarket) {
        console.log('[Market] Still no match, trying any Bitcoin market...');
        btcMarket = markets.find((m: any) => {
          const question = m.question?.toLowerCase() || '';
          return question.includes('bitcoin') || question.includes('btc');
        });
      }
      
      if (!btcMarket) {
        console.error('[Market] No Bitcoin market found in API response');
        throw new Error('No active Bitcoin 15min market found');
      }
      
      console.log(`[Market] Selected: ${btcMarket.question}`);
      
      // 解析市场信息
      const tokens = btcMarket.tokens || [];
      const upToken = tokens.find((t: any) => t.outcome?.toUpperCase() === 'UP');
      const downToken = tokens.find((t: any) => t.outcome?.toUpperCase() === 'DOWN');
      
      let upTokenId: string;
      let downTokenId: string;
      
      if (upToken?.token_id && downToken?.token_id) {
        // 优先使用 API 返回的 Token ID（最准确）
        upTokenId = upToken.token_id;
        downTokenId = downToken.token_id;
        console.log('[Market] Using Token IDs from API');
      } else if (btcMarket.condition_id) {
        // 备用：从 conditionId 计算 Token ID
        const calculated = calculateTokenIds(btcMarket.condition_id);
        upTokenId = calculated.upTokenId;
        downTokenId = calculated.downTokenId;
        console.log('[Market] Calculated Token IDs from conditionId');
      } else {
        throw new Error('Cannot determine Token IDs');
      }
      
      console.log(`[Market] UP Token: ${formatTokenId(upTokenId)}`);
      console.log(`[Market] DOWN Token: ${formatTokenId(downTokenId)}`);
      
      // 获取实时价格（从订单簿）
      const [upPrice, downPrice] = await Promise.all([
        this.getTokenPrice(upTokenId),
        this.getTokenPrice(downTokenId),
      ]);
      
      // 解析市场时间
      const startTime = btcMarket.start_date_iso ? new Date(btcMarket.start_date_iso).getTime() : now;
      const endTime = btcMarket.end_date_iso ? new Date(btcMarket.end_date_iso).getTime() : now + 15 * 60 * 1000;
      
      this.activeMarket = {
        conditionId: btcMarket.condition_id,
        question: btcMarket.question,
        upTokenId,
        downTokenId,
        startTime,
        endTime,
        prices: {
          up: upPrice,
          down: downPrice,
        },
      };
      
      this.marketCacheTime = now;
      
      console.log(`[Market] Active market: ${btcMarket.question}`);
      console.log(`[Market] Prices: UP=${upPrice.toFixed(4)}, DOWN=${downPrice.toFixed(4)}`);
      console.log(`[Market] End time: ${new Date(endTime).toLocaleTimeString()}`);
      
      return { success: true, data: this.activeMarket };
      
    } catch (error) {
      console.error('Failed to get active market:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * 从 CLOB API 获取 Token 实时价格
   */
  async getTokenPrice(tokenId: string): Promise<number> {
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
        return 0.5;
      }
      
      const data = await response.json();
      
      // 从订单簿获取中间价
      const bestBid = data.bids?.[0]?.price ? parseFloat(data.bids[0].price) : null;
      const bestAsk = data.asks?.[0]?.price ? parseFloat(data.asks[0].price) : null;
      
      if (bestBid !== null && bestAsk !== null) {
        return (bestBid + bestAsk) / 2;
      }
      
      return 0.5;
    } catch (error) {
      console.error('Get token price error:', error);
      return 0.5;
    }
  }
  
  /**
   * 获取市场列表
   */
  async getMarkets(): Promise<ApiResponse<MarketData[]>> {
    try {
      const response = await fetch(
        'https://gamma-api.polymarket.com/markets?limit=50&closed=false',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const markets: MarketData[] = data
        .filter((market: any) => market.active !== false)
        .map((market: any) => this.parseMarketData(market))
        .filter((m): m is MarketData => m !== null);
      
      return { success: true, data: markets };
    } catch (error) {
      console.error('Failed to fetch markets:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * 搜索市场
   */
  async searchMarkets(query: string): Promise<ApiResponse<MarketData[]>> {
    try {
      const response = await fetch(
        'https://gamma-api.polymarket.com/markets?limit=50&closed=false',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const queryLower = query.toLowerCase();
      
      const markets: MarketData[] = data
        .filter((market: any) => 
          market.active !== false &&
          (market.question?.toLowerCase().includes(queryLower) ||
           market.description?.toLowerCase().includes(queryLower))
        )
        .map((market: any) => this.parseMarketData(market))
        .filter((m): m is MarketData => m !== null);
      
      return { success: true, data: markets };
    } catch (error) {
      console.error('Failed to search markets:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * 创建订单
   */
  async createOrder(orderRequest: OrderRequest): Promise<ApiResponse<OrderResponse>> {
    try {
      if (!this.apiKey || !this.apiSecret) {
        throw new Error('API credentials not configured');
      }
      
      console.log('Creating order:', orderRequest);
      
      // TODO: 实现真实订单创建
      const mockResponse: OrderResponse = {
        orderId: `order_${Date.now()}`,
        marketId: orderRequest.marketId,
        side: orderRequest.side,
        amount: orderRequest.amount,
        executedPrice: orderRequest.price,
        fee: orderRequest.amount * 0.0156,
        timestamp: Date.now(),
      };
      
      return { success: true, data: mockResponse };
    } catch (error) {
      console.error('Failed to create order:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * 解析市场数据
   */
  private parseMarketData(market: any): MarketData | null {
    try {
      if (!market) return null;
      
      const tokens = market.tokens || [];
      
      // 优先查找 UP/DOWN token
      let upToken = tokens.find((t: any) => t.outcome?.toUpperCase() === 'UP');
      let downToken = tokens.find((t: any) => t.outcome?.toUpperCase() === 'DOWN');
      
      // 如果没有找到，查找 YES/NO
      if (!upToken || !downToken) {
        upToken = tokens.find((t: any) => t.outcome?.toUpperCase() === 'YES');
        downToken = tokens.find((t: any) => t.outcome?.toUpperCase() === 'NO');
      }
      
      // 如果还没有，使用前两个 token
      if (!upToken && !downToken && tokens.length >= 2) {
        upToken = tokens[0];
        downToken = tokens[1];
      }
      
      const upPrice = this.extractPrice(upToken);
      const downPrice = this.extractPrice(downToken);
      const spread = Math.abs(1 - (upPrice + downPrice));
      
      return {
        marketId: market.condition_id || market.id || '',
        question: market.question || 'Unknown',
        yesPrice: upPrice,
        noPrice: downPrice,
        yesBestAsk: upToken?.price?.bestAsk ? parseFloat(upToken.price.bestAsk) : upPrice,
        noBestAsk: downToken?.price?.bestAsk ? parseFloat(downToken.price.bestAsk) : downPrice,
        yesBestBid: upToken?.price?.bestBid ? parseFloat(upToken.price.bestBid) : upPrice,
        noBestBid: downToken?.price?.bestBid ? parseFloat(downToken.price.bestBid) : downPrice,
        spread,
        liquidity: parseFloat(market.volume || market.liquidity || '0') || 0,
        status: market.closed ? 'SETTLED' : (market.active !== false ? 'ACTIVE' : 'INACTIVE'),
        timestamp: Date.now(),
        // 额外字段
        upTokenId: upToken?.token_id,
        downTokenId: downToken?.token_id,
      } as MarketData & { upTokenId?: string; downTokenId?: string };
    } catch (error) {
      console.error('Failed to parse market:', error);
      return null;
    }
  }
  
  /**
   * 从 token 数据中提取价格
   */
  private extractPrice(token: any): number {
    if (!token) return 0.5;
    
    const price = token.price;
    
    if (typeof price === 'number') return price;
    if (typeof price === 'string') return parseFloat(price) || 0.5;
    if (typeof price === 'object') {
      if (price.bestAsk) return parseFloat(price.bestAsk) || 0.5;
      if (price.price) return parseFloat(price.price) || 0.5;
      if (price.bestBid) return parseFloat(price.bestBid) || 0.5;
    }
    
    return 0.5;
  }
}

// 单例模式
let clientInstance: PolymarketClient | null = null;

export function getPolymarketClient(): PolymarketClient {
  if (!clientInstance) {
    clientInstance = new PolymarketClient();
  }
  return clientInstance;
}

export type { ActiveMarket };
