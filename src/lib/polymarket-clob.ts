import { Wallet } from 'ethers';
import crypto from 'crypto';
import { POLYMARKET_CONFIG, RunMode, getRunMode } from './polymarket-config';
import { getCredentials } from './config-store';

/**
 * 订单参数
 */
export interface OrderParams {
  tokenId: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
  expiration?: number;
}

/**
 * 订单结果
 */
export interface OrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

/**
 * 余额信息
 */
export interface BalanceInfo {
  balance: number;
  available: number;
}

/**
 * 持仓信息
 */
export interface PositionInfo {
  asset: string;
  side: string;
  size: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
}

/**
 * 市场信息
 */
export interface MarketInfo {
  conditionId: string;
  question: string;
  tokens: Array<{
    tokenId: string;
    outcome: string;
    price: number;
  }>;
}

/**
 * 订单簿摘要
 */
export interface OrderBookSummary {
  market: string;
  asset: string;
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
  hash: string;
}

/**
 * Polymarket CLOB API 客户端
 * 支持真实交易和模拟模式
 */
export class PolymarketCLOBClient {
  private wallet: Wallet | null = null;
  private apiKey: string;
  private apiSecret: string;
  private mode: RunMode = 'simulation';
  
  // 模拟数据
  private simulatedBalance: BalanceInfo = { balance: 100, available: 100 };
  private simulatedPositions: PositionInfo[] = [];
  private simulatedOrders: Map<string, any> = new Map();
  private orderCounter = 0;

  constructor(privateKey: string | undefined, apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    
    if (privateKey) {
      try {
        this.wallet = new Wallet(privateKey);
      } catch (error) {
        console.error('Invalid private key:', error);
      }
    }
  }

  /**
   * 初始化客户端，检测运行模式
   */
  async initialize(): Promise<void> {
    this.mode = await getRunMode();
    console.log(`[CLOB] Running in ${this.mode} mode`);
  }

  /**
   * 获取当前模式
   */
  getMode(): RunMode {
    return this.mode;
  }

  /**
   * 获取钱包地址
   */
  getAddress(): string | null {
    return this.wallet?.address || null;
  }

  // ==================== 真实 API 方法 ====================

  /**
   * 生成 L1 签名
   */
  private async signL1Message(message: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured');
    }
    return await this.wallet.signMessage(message);
  }

  /**
   * 生成 L2 签名 (用于订单)
   */
  private signL2Message(message: string): string {
    const hmac = crypto.createHmac('sha256', this.apiSecret);
    hmac.update(message);
    return hmac.digest('hex');
  }

  /**
   * 获取认证头
   */
  private async getAuthHeaders(method: string, endpoint: string): Promise<Record<string, string>> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    
    const messageToSign = `${method}${endpoint}${timestamp}${nonce}`;
    const signature = await this.signL1Message(messageToSign);

    return {
      'POLY-ADDRESS': this.wallet?.address || '',
      'POLY-SIGNATURE': signature,
      'POLY-TIMESTAMP': timestamp,
      'POLY-NONCE': nonce,
      'POLY-API-KEY': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 发送真实 API 请求
   */
  private async fetchRealApi<T>(
    method: string, 
    endpoint: string, 
    body?: any
  ): Promise<T | null> {
    try {
      const headers = method === 'GET' && !endpoint.includes('/balances') && !endpoint.includes('/orders')
        ? { 'Content-Type': 'application/json' }
        : await this.getAuthHeaders(method, endpoint);

      const options: RequestInit = {
        method,
        headers,
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${POLYMARKET_CONFIG.CLOB_API_URL}${endpoint}`, options);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error ${response.status}:`, errorText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${method} ${endpoint}`, error);
      return null;
    }
  }

  // ==================== 公共 API ====================

  /**
   * 获取市场列表
   */
  async getMarkets(): Promise<MarketInfo[]> {
    if (this.mode === 'simulation') {
      return this.getSimulatedMarkets();
    }

    const data = await this.fetchRealApi<{ data: any[] }>('GET', '/markets');
    if (!data?.data) {
      return this.getSimulatedMarkets();
    }

    return data.data.map(market => ({
      conditionId: market.condition_id || market.conditionId,
      question: market.question || 'Unknown',
      tokens: (market.tokens || []).map((t: any) => ({
        tokenId: t.token_id || t.tokenId,
        outcome: t.outcome || 'Unknown',
        price: 0.5, // 需要单独查询价格
      })),
    }));
  }

  /**
   * 获取特定市场信息
   */
  async getMarket(conditionId: string): Promise<MarketInfo | null> {
    if (this.mode === 'simulation') {
      const markets = this.getSimulatedMarkets();
      return markets.find(m => m.conditionId === conditionId) || null;
    }

    const data = await this.fetchRealApi<any>('GET', `/markets/${conditionId}`);
    if (!data) return null;

    return {
      conditionId: data.condition_id || data.conditionId,
      question: data.question || 'Unknown',
      tokens: (data.tokens || []).map((t: any) => ({
        tokenId: t.token_id || t.tokenId,
        outcome: t.outcome || 'Unknown',
        price: 0.5,
      })),
    };
  }

  /**
   * 获取订单簿
   */
  async getOrderBook(tokenId: string): Promise<OrderBookSummary | null> {
    if (this.mode === 'simulation') {
      return this.getSimulatedOrderBook(tokenId);
    }

    const data = await this.fetchRealApi<any>('GET', `/book?token_id=${tokenId}`);
    if (!data) {
      return this.getSimulatedOrderBook(tokenId);
    }

    return {
      market: data.market || 'Unknown',
      asset: data.asset || tokenId,
      bids: (data.bids || []).map((b: any) => ({ 
        price: parseFloat(b.price), 
        size: parseFloat(b.size) 
      })),
      asks: (data.asks || []).map((a: any) => ({ 
        price: parseFloat(a.price), 
        size: parseFloat(a.size) 
      })),
      hash: data.hash || '',
    };
  }

  /**
   * 获取价格
   */
  async getPrice(tokenId: string): Promise<number> {
    if (this.mode === 'simulation') {
      return this.getSimulatedPrice(tokenId);
    }

    const data = await this.fetchRealApi<{ price: string }>('GET', `/price?token_id=${tokenId}`);
    if (!data?.price) {
      return this.getSimulatedPrice(tokenId);
    }

    return parseFloat(data.price);
  }

  /**
   * 获取多个价格
   */
  async getPrices(tokenIds: string[]): Promise<Record<string, number>> {
    if (this.mode === 'simulation') {
      const prices: Record<string, number> = {};
      for (const id of tokenIds) {
        prices[id] = this.getSimulatedPrice(id);
      }
      return prices;
    }

    // 批量查询
    const prices: Record<string, number> = {};
    const params = tokenIds.map(id => `token_id=${id}`).join('&');
    const data = await this.fetchRealApi<Array<{ token_id: string; price: string }>>(
      'GET', 
      `/prices?${params}`
    );

    if (data) {
      for (const item of data) {
        prices[item.token_id] = parseFloat(item.price);
      }
    } else {
      // 回退到模拟
      for (const id of tokenIds) {
        prices[id] = this.getSimulatedPrice(id);
      }
    }

    return prices;
  }

  // ==================== 交易 API ====================

  /**
   * 获取账户余额
   */
  async getBalance(): Promise<BalanceInfo> {
    if (this.mode === 'simulation') {
      return this.simulatedBalance;
    }

    const data = await this.fetchRealApi<{
      balance: string;
      available_balance?: string;
    }>('GET', '/balances');

    if (!data) {
      return this.simulatedBalance;
    }

    return {
      balance: parseFloat(data.balance) || 0,
      available: parseFloat(data.available_balance || data.balance) || 0,
    };
  }

  /**
   * 设置模拟余额（仅模拟模式）
   */
  setSimulatedBalance(balance: number): void {
    this.simulatedBalance = {
      balance,
      available: balance,
    };
  }

  /**
   * 创建订单
   */
  async createOrder(params: OrderParams): Promise<OrderResult> {
    if (this.mode === 'simulation') {
      return this.createSimulatedOrder(params);
    }

    try {
      const headers = await this.getAuthHeaders('POST', '/order');
      
      const order = {
        token_id: params.tokenId,
        side: params.side,
        price: params.price.toString(),
        size: params.size.toString(),
        expiration: params.expiration || Math.floor(Date.now() / 1000) + 86400,
      };

      const orderMessage = JSON.stringify(order);
      const l2Signature = this.signL2Message(orderMessage);

      const response = await fetch(`${POLYMARKET_CONFIG.CLOB_API_URL}/order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...order,
          signature: l2Signature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText };
      }

      const data = await response.json();
      return { success: true, orderId: data.order_id || data.id };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    if (this.mode === 'simulation') {
      return this.simulatedOrders.delete(orderId);
    }

    const headers = await this.getAuthHeaders('DELETE', `/order/${orderId}`);
    const response = await fetch(
      `${POLYMARKET_CONFIG.CLOB_API_URL}/order/${orderId}`,
      { method: 'DELETE', headers }
    );

    return response.ok;
  }

  /**
   * 获取订单
   */
  async getOrder(orderId: string): Promise<any> {
    if (this.mode === 'simulation') {
      return this.simulatedOrders.get(orderId) || null;
    }

    return await this.fetchRealApi('GET', `/order/${orderId}`);
  }

  /**
   * 获取所有订单
   */
  async getOrders(): Promise<any[]> {
    if (this.mode === 'simulation') {
      return Array.from(this.simulatedOrders.values());
    }

    const data = await this.fetchRealApi<{ orders: any[] }>('GET', '/orders');
    return data?.orders || [];
  }

  /**
   * 获取持仓
   */
  async getPositions(): Promise<PositionInfo[]> {
    if (this.mode === 'simulation') {
      return this.simulatedPositions;
    }

    const data = await this.fetchRealApi<{ positions: any[] }>('GET', '/positions');
    if (!data?.positions) {
      return this.simulatedPositions;
    }

    return data.positions.map(p => ({
      asset: p.asset || 'Unknown',
      side: p.side || 'LONG',
      size: parseFloat(p.size) || 0,
      avgPrice: parseFloat(p.avg_price || p.avgPrice) || 0,
      currentPrice: parseFloat(p.current_price || p.currentPrice) || 0,
      pnl: parseFloat(p.pnl) || 0,
    }));
  }

  // ==================== 模拟数据生成 ====================

  private getSimulatedMarkets(): MarketInfo[] {
    return [
      {
        conditionId: 'btc-15min-up-down',
        question: 'Will Bitcoin go up in the next 15 minutes?',
        tokens: [
          { tokenId: 'btc-yes', outcome: 'YES', price: 0.5 },
          { tokenId: 'btc-no', outcome: 'NO', price: 0.5 },
        ],
      },
    ];
  }

  private simulatedPrices: Map<string, number> = new Map([
    ['btc-yes', 0.5],
    ['btc-no', 0.5],
  ]);

  private getSimulatedPrice(tokenId: string): number {
    let price = this.simulatedPrices.get(tokenId) || 0.5;
    
    // 随机波动
    const change = (Math.random() - 0.5) * 0.02;
    price = Math.max(0.01, Math.min(0.99, price + change));
    
    this.simulatedPrices.set(tokenId, price);
    
    // 同步另一侧价格
    if (tokenId === 'btc-yes') {
      const noPrice = Math.max(0.01, Math.min(0.99, 1 - price + (Math.random() - 0.5) * 0.05));
      this.simulatedPrices.set('btc-no', noPrice);
    } else if (tokenId === 'btc-no') {
      const yesPrice = Math.max(0.01, Math.min(0.99, 1 - price + (Math.random() - 0.5) * 0.05));
      this.simulatedPrices.set('btc-yes', yesPrice);
    }
    
    return price;
  }

  private getSimulatedOrderBook(tokenId: string): OrderBookSummary {
    const price = this.getSimulatedPrice(tokenId);
    
    // 生成模拟订单簿
    const bids = [];
    const asks = [];
    
    for (let i = 0; i < 5; i++) {
      bids.push({
        price: Math.max(0.01, price - 0.01 * (i + 1)),
        size: Math.random() * 100 + 10,
      });
      asks.push({
        price: Math.min(0.99, price + 0.01 * (i + 1)),
        size: Math.random() * 100 + 10,
      });
    }
    
    return {
      market: 'btc-15min-up-down',
      asset: tokenId,
      bids,
      asks,
      hash: crypto.randomBytes(32).toString('hex'),
    };
  }

  private createSimulatedOrder(params: OrderParams): OrderResult {
    // 检查余额
    const cost = params.price * params.size;
    if (params.side === 'BUY' && cost > this.simulatedBalance.available) {
      return { success: false, error: 'Insufficient balance' };
    }

    // 创建订单
    const orderId = `sim-${++this.orderCounter}`;
    const order = {
      id: orderId,
      ...params,
      status: 'OPEN',
      createdAt: Date.now(),
    };
    
    this.simulatedOrders.set(orderId, order);

    // 模拟立即成交
    setTimeout(() => {
      const order = this.simulatedOrders.get(orderId);
      if (order && order.status === 'OPEN') {
        order.status = 'FILLED';
        
        // 更新余额
        if (params.side === 'BUY') {
          this.simulatedBalance.available -= cost;
          
          // 添加持仓
          this.simulatedPositions.push({
            asset: params.tokenId,
            side: 'LONG',
            size: params.size,
            avgPrice: params.price,
            currentPrice: params.price,
            pnl: 0,
          });
        }
      }
    }, 100);

    return { success: true, orderId };
  }
}

// 单例
let clobClient: PolymarketCLOBClient | null = null;

/**
 * 重置 CLOB 客户端（配置更改后调用）
 */
export function resetCLOBClient(): void {
  clobClient = null;
}

export function getCLOBClient(): PolymarketCLOBClient {
  if (!clobClient) {
    // 优先使用存储的凭证，其次使用环境变量
    const storedCreds = getCredentials();
    
    const privateKey = storedCreds?.walletPrivateKey || process.env.WALLET_PRIVATE_KEY;
    const apiKey = storedCreds?.polymarketApiKey || process.env.POLYMARKET_API_KEY || '';
    const apiSecret = storedCreds?.polymarketApiSecret || process.env.POLYMARKET_API_SECRET || '';

    clobClient = new PolymarketCLOBClient(privateKey, apiKey, apiSecret);
  }

  return clobClient;
}

export async function getInitializedCLOBClient(): Promise<PolymarketCLOBClient> {
  const client = getCLOBClient();
  await client.initialize();
  return client;
}
