import { Wallet } from 'ethers';
import crypto from 'crypto';

/**
 * Polymarket CLOB API 客户端
 * 实现真实的交易功能
 */
export class PolymarketCLOBClient {
  private wallet: Wallet;
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://clob.polymarket.com';

  constructor(privateKey: string, apiKey: string, apiSecret: string) {
    this.wallet = new Wallet(privateKey);
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * 获取钱包地址
   */
  getAddress(): string {
    return this.wallet.address;
  }

  /**
   * 生成 L1 签名
   */
  private async signL1Message(message: string): Promise<string> {
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
    
    // L1 签名
    const messageToSign = `${method}${endpoint}${timestamp}${nonce}`;
    const signature = await this.signL1Message(messageToSign);

    return {
      'POLY-ADDRESS': this.wallet.address,
      'POLY-SIGNATURE': signature,
      'POLY-TIMESTAMP': timestamp,
      'POLY-NONCE': nonce,
      'POLY-API-KEY': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 获取市场数据
   */
  async getMarkets(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/markets`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get markets:', error);
      return [];
    }
  }

  /**
   * 获取订单簿
   */
  async getOrderBook(tokenId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/book?token_id=${tokenId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get order book:', error);
      return null;
    }
  }

  /**
   * 获取账户余额
   */
  async getBalance(): Promise<{ balance: number; available: number }> {
    try {
      const headers = await this.getAuthHeaders('GET', '/balances');
      
      const response = await fetch(`${this.baseUrl}/balances`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        console.error('Balance API error:', response.status);
        return { balance: 0, available: 0 };
      }

      const data = await response.json();
      return {
        balance: parseFloat(data.balance) || 0,
        available: parseFloat(data.available_balance) || 0,
      };
    } catch (error) {
      console.error('Failed to get balance:', error);
      return { balance: 0, available: 0 };
    }
  }

  /**
   * 创建订单
   */
  async createOrder(params: {
    tokenId: string;
    side: 'BUY' | 'SELL';
    price: number;
    size: number;
    expiration?: number;
  }): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const headers = await this.getAuthHeaders('POST', '/order');
      
      // 构造订单
      const order = {
        token_id: params.tokenId,
        side: params.side,
        price: params.price.toString(),
        size: params.size.toString(),
        expiration: params.expiration || Math.floor(Date.now() / 1000) + 86400, // 24小时后过期
      };

      // L2 签名
      const orderMessage = JSON.stringify(order);
      const l2Signature = this.signL2Message(orderMessage);

      const response = await fetch(`${this.baseUrl}/order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...order,
          signature: l2Signature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Order creation failed:', errorText);
        return { success: false, error: errorText };
      }

      const data = await response.json();
      return { success: true, orderId: data.order_id || data.id };
    } catch (error) {
      console.error('Failed to create order:', error);
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
    try {
      const headers = await this.getAuthHeaders('DELETE', `/order/${orderId}`);
      
      const response = await fetch(`${this.baseUrl}/order/${orderId}`, {
        method: 'DELETE',
        headers,
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to cancel order:', error);
      return false;
    }
  }

  /**
   * 获取订单状态
   */
  async getOrder(orderId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders('GET', `/order/${orderId}`);
      
      const response = await fetch(`${this.baseUrl}/order/${orderId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get order:', error);
      return null;
    }
  }

  /**
   * 获取持仓
   */
  async getPositions(): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders('GET', '/positions');
      
      const response = await fetch(`${this.baseUrl}/positions`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get positions:', error);
      return [];
    }
  }
}

// 单例
let clobClient: PolymarketCLOBClient | null = null;

export function getCLOBClient(): PolymarketCLOBClient | null {
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  const apiKey = process.env.POLYMARKET_API_KEY;
  const apiSecret = process.env.POLYMARKET_API_SECRET;

  if (!privateKey || !apiKey || !apiSecret) {
    console.warn('CLOB client not configured - missing credentials');
    return null;
  }

  if (!clobClient) {
    clobClient = new PolymarketCLOBClient(privateKey, apiKey, apiSecret);
  }

  return clobClient;
}
