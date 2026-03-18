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
   * 获取市场列表
   */
  async getMarkets(): Promise<ApiResponse<MarketData[]>> {
    try {
      const response = await fetch(
        `${POLYMARKET_CONFIG.GAMMA_API_URL}/markets?limit=100&active=true`,
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
      
      // 过滤出比特币15分钟市场
      const btcMarkets = data.filter((market: any) => 
        market.question.toLowerCase().includes('bitcoin') && 
        market.question.toLowerCase().includes('15 minute')
      );
      
      const markets: MarketData[] = btcMarkets.map((market: any) => this.parseMarketData(market));
      
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
   * 获取单个市场数据
   */
  async getMarket(marketId: string): Promise<ApiResponse<MarketData>> {
    try {
      const response = await fetch(
        `${POLYMARKET_CONFIG.GAMMA_API_URL}/markets/${marketId}`,
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
      const market = this.parseMarketData(data);
      
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
  async getOrderBook(marketId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(
        `${POLYMARKET_CONFIG.REST_API_URL}/book?token_id=${marketId}`,
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
   * 注意：这需要私钥签名，实际部署时需要配置
   */
  async createOrder(orderRequest: OrderRequest): Promise<ApiResponse<OrderResponse>> {
    try {
      // 检查API密钥
      if (!this.apiKey || !this.apiSecret) {
        throw new Error('API credentials not configured. Please set POLYMARKET_API_KEY and POLYMARKET_API_SECRET');
      }
      
      // TODO: 实现真实的订单创建逻辑
      // 这需要：
      // 1. 构造订单参数
      // 2. 使用私钥签名
      // 3. 提交到CLOB API
      
      console.log('Creating order:', orderRequest);
      
      // 模拟订单响应（仅用于演示）
      const mockResponse: OrderResponse = {
        orderId: `order_${Date.now()}`,
        marketId: orderRequest.marketId,
        side: orderRequest.side,
        amount: orderRequest.amount,
        executedPrice: orderRequest.side === 'YES' ? 0.35 : 0.65,
        fee: orderRequest.amount * 0.0156, // 1.56% 手续费
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
      // 关闭现有连接
      if (this.ws) {
        this.ws.close();
      }
      
      this.ws = new WebSocket(POLYMARKET_CONFIG.WS_API_URL);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // 订阅市场数据
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
        
        // 尝试重连
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
  private parseMarketData(market: any): MarketData {
    // Polymarket市场有两个token: YES和NO
    const yesToken = market.tokens?.find((t: any) => t.outcome === 'Yes');
    const noToken = market.tokens?.find((t: any) => t.outcome === 'No');
    
    // 计算买卖价差
    const yesSpread = yesToken?.price ? 
      Math.abs(yesToken.price.best_ask - yesToken.price.best_bid) / yesToken.price.best_bid : 0;
    
    return {
      marketId: market.condition_id || market.id,
      question: market.question,
      yesPrice: yesToken?.price?.price || 0.5,
      noPrice: noToken?.price?.price || 0.5,
      yesBestAsk: yesToken?.price?.best_ask || 0.5,
      noBestAsk: noToken?.price?.best_ask || 0.5,
      yesBestBid: yesToken?.price?.best_bid || 0.5,
      noBestBid: noToken?.price?.best_bid || 0.5,
      spread: yesSpread,
      liquidity: market.volume || 0,
      status: market.active ? 'ACTIVE' : 'INACTIVE',
      timestamp: Date.now(),
    };
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
