import type { MarketData, PriceData, OrderRequest, OrderResponse, ApiResponse, TradeSide } from '@/types/trading';
import { POLYMARKET_CONFIG, getConfig } from '@/config/strategy';

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
  
  constructor() {
    const config = getConfig();
    this.apiKey = config.polymarketApiKey;
    this.apiSecret = config.polymarketApiSecret;
  }
  
  /**
   * 获取市场列表 - 使用 Gamma API
   */
  async getMarkets(): Promise<ApiResponse<MarketData[]>> {
    try {
      // 使用 Gamma API 获取活跃市场
      const response = await fetch(
        `https://gamma-api.polymarket.com/markets?limit=50&closed=false`,
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
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      // 解析所有市场
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
        `https://gamma-api.polymarket.com/markets?limit=50&closed=false`,
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
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
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
   * 获取单个市场数据
   */
  async getMarket(marketId: string): Promise<ApiResponse<MarketData>> {
    try {
      const response = await fetch(
        `https://gamma-api.polymarket.com/markets/${marketId}`,
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
      const market = this.parseMarketData(data);
      
      if (!market) {
        throw new Error('Failed to parse market data');
      }
      
      return { success: true, data: market };
    } catch (error) {
      console.error('Failed to fetch market:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * 获取订单簿
   */
  async getOrderBook(tokenId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(
        `${POLYMARKET_CONFIG.REST_API_URL}/book?token_id=${tokenId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch order book:', error);
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
      
      const mockResponse: OrderResponse = {
        orderId: `order_${Date.now()}`,
        marketId: orderRequest.marketId,
        side: orderRequest.side,
        amount: orderRequest.amount,
        executedPrice: orderRequest.side === 'YES' ? 0.35 : 0.65,
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
   * 连接WebSocket获取实时价格
   */
  connectWebSocket(
    marketId: string,
    onPriceUpdate: (priceData: PriceData) => void,
    onError?: (error: Error) => void
  ): void {
    try {
      if (this.ws) {
        this.ws.close();
      }
      
      this.ws = new WebSocket(POLYMARKET_CONFIG.WS_API_URL);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        this.ws?.send(JSON.stringify({
          type: 'subscribe',
          channel: 'market',
          marketId: marketId,
        }));
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'price_update') {
            const priceData: PriceData = {
              side: data.side,
              price: data.price,
              timestamp: Date.now(),
            };
            onPriceUpdate(priceData);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(new Error('WebSocket error'));
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            this.connectWebSocket(marketId, onPriceUpdate, onError);
          }, 5000 * this.reconnectAttempts);
        }
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
  
  /**
   * 断开WebSocket连接
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }
  
  /**
   * 解析市场数据
   */
  private parseMarketData(market: any): MarketData | null {
    try {
      if (!market) return null;
      
      // 获取 tokens 数据
      const tokens = market.tokens || [];
      
      // 尝试找到 YES 和 NO token
      let yesToken = tokens.find((t: any) => 
        t.outcome?.toUpperCase() === 'YES' || t.outcome === 'Yes'
      );
      let noToken = tokens.find((t: any) => 
        t.outcome?.toUpperCase() === 'NO' || t.outcome === 'No'
      );
      
      // 如果没有找到标准格式，使用前两个 token
      if (!yesToken && tokens.length >= 2) {
        yesToken = tokens[0];
        noToken = tokens[1];
      }
      
      // 获取价格
      const yesPrice = this.extractPrice(yesToken);
      const noPrice = this.extractPrice(noToken);
      
      // 计算价差
      const spread = Math.abs(1 - (yesPrice + noPrice));
      
      return {
        marketId: market.condition_id || market.id || '',
        question: market.question || 'Unknown',
        yesPrice,
        noPrice,
        yesBestAsk: yesToken?.price?.bestAsk ? parseFloat(yesToken.price.bestAsk) : yesPrice,
        noBestAsk: noToken?.price?.bestAsk ? parseFloat(noToken.price.bestAsk) : noPrice,
        yesBestBid: yesToken?.price?.bestBid ? parseFloat(yesToken.price.bestBid) : yesPrice,
        noBestBid: noToken?.price?.bestBid ? parseFloat(noToken.price.bestBid) : noPrice,
        spread,
        liquidity: parseFloat(market.volume || market.liquidity || '0') || 0,
        status: market.closed ? 'SETTLED' : (market.active !== false ? 'ACTIVE' : 'INACTIVE'),
        timestamp: Date.now(),
      };
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
    
    // 尝试多种价格字段
    const price = token.price;
    
    if (typeof price === 'number') return price;
    if (typeof price === 'string') return parseFloat(price) || 0.5;
    if (typeof price === 'object') {
      return parseFloat(price.price || price.bestAsk || price.bestBid || '0.5') || 0.5;
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
