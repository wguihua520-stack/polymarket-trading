import type { PriceData, MarketData, TradeSide } from '@/types/trading';
import { getPolymarketClient } from '@/lib/polymarket-client';
import { getConfig, TIME_CONFIG } from '@/config/strategy';

interface PricePoint {
  price: number;
  timestamp: number;
}

interface PriceHistory {
  YES: PricePoint[];
  NO: PricePoint[];
}

interface DropSignal {
  side: TradeSide;
  dropPct: number;
  fromPrice: number;
  toPrice: number;
  duration: number; // 毫秒
}

/**
 * 价格监控服务
 * 负责实时监控价格变化，检测快速下跌信号
 */
export class PriceMonitor {
  private priceHistory: PriceHistory = { YES: [], NO: [] };
  private maxHistoryLength = 100; // 保存最近100个价格点
  private monitorInterval?: NodeJS.Timeout;
  private isMonitoring = false;
  private currentMarketId?: string;
  
  // 价格变化检测回调
  private onPriceUpdate?: (priceData: PriceData) => void;
  private onDropDetected?: (signal: DropSignal) => void;
  
  /**
   * 开始监控市场
   */
  startMonitoring(
    marketId: string,
    onPriceUpdate: (priceData: PriceData) => void,
    onDropDetected: (signal: DropSignal) => void
  ): void {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }
    
    this.currentMarketId = marketId;
    this.onPriceUpdate = onPriceUpdate;
    this.onDropDetected = onDropDetected;
    this.isMonitoring = true;
    
    // 清空历史数据
    this.priceHistory = { YES: [], NO: [] };
    
    console.log(`[PriceMonitor] Starting monitoring for market: ${marketId}`);
    
    // 连接WebSocket
    const client = getPolymarketClient();
    client.connectWebSocket(
      marketId,
      (priceData) => this.handlePriceUpdate(priceData),
      (error) => console.error('[PriceMonitor] WebSocket error:', error)
    );
    
    // 同时启动轮询作为备用
    this.startPolling(marketId);
  }
  
  /**
   * 停止监控
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = undefined;
    }
    
    const client = getPolymarketClient();
    client.disconnectWebSocket();
    
    console.log('[PriceMonitor] Monitoring stopped');
  }
  
  /**
   * 启动轮询（作为WebSocket的备用）
   */
  private startPolling(marketId: string): void {
    this.monitorInterval = setInterval(async () => {
      if (!this.isMonitoring) return;
      
      try {
        const client = getPolymarketClient();
        const response = await client.getMarket(marketId);
        
        if (response.success && response.data) {
          const market = response.data;
          
          // 更新YES价格
          this.handlePriceUpdate({
            side: 'YES',
            price: market.yesPrice,
            timestamp: market.timestamp,
          });
          
          // 更新NO价格
          this.handlePriceUpdate({
            side: 'NO',
            price: market.noPrice,
            timestamp: market.timestamp,
          });
        }
      } catch (error) {
        console.error('[PriceMonitor] Polling error:', error);
      }
    }, TIME_CONFIG.PRICE_CHECK_INTERVAL);
  }
  
  /**
   * 处理价格更新
   */
  private handlePriceUpdate(priceData: PriceData): void {
    if (!this.isMonitoring) return;
    
    // 添加到历史记录
    this.priceHistory[priceData.side].push({
      price: priceData.price,
      timestamp: priceData.timestamp,
    });
    
    // 保持历史记录长度
    if (this.priceHistory[priceData.side].length > this.maxHistoryLength) {
      this.priceHistory[priceData.side].shift();
    }
    
    // 调用回调
    this.onPriceUpdate?.(priceData);
    
    // 检测快速下跌
    this.detectQuickDrop(priceData.side);
  }
  
  /**
   * 检测快速下跌
   */
  private detectQuickDrop(side: TradeSide): void {
    const history = this.priceHistory[side];
    
    if (history.length < 2) return;
    
    const config = getConfig();
    const currentTime = Date.now();
    const lookbackTime = currentTime - 3000; // 3秒前
    
    // 找到3秒前的价格点
    const oldPricePoint = history.find(p => p.timestamp >= lookbackTime);
    
    if (!oldPricePoint) return;
    
    const currentPrice = history[history.length - 1].price;
    const oldPrice = oldPricePoint.price;
    
    // 计算下跌幅度
    const dropPct = (oldPrice - currentPrice) / oldPrice;
    
    // 检查是否超过阈值
    if (dropPct >= config.movePct) {
      const signal: DropSignal = {
        side,
        dropPct,
        fromPrice: oldPrice,
        toPrice: currentPrice,
        duration: currentTime - oldPricePoint.timestamp,
      };
      
      console.log(`[PriceMonitor] Quick drop detected: ${side} dropped ${(dropPct * 100).toFixed(2)}%`);
      
      // 调用回调
      this.onDropDetected?.(signal);
    }
  }
  
  /**
   * 获取最新价格
   */
  getLatestPrice(side: TradeSide): number | null {
    const history = this.priceHistory[side];
    return history.length > 0 ? history[history.length - 1].price : null;
  }
  
  /**
   * 获取价格历史
   */
  getPriceHistory(side: TradeSide): PricePoint[] {
    return this.priceHistory[side];
  }
  
  /**
   * 计算Leg1 + Leg2价格总和
   */
  calculateSumPrice(leg1Side: TradeSide, leg1Price: number): number | null {
    // 获取另一侧的最新价格
    const otherSide: TradeSide = leg1Side === 'YES' ? 'NO' : 'YES';
    const otherPrice = this.getLatestPrice(otherSide);
    
    if (otherPrice === null) return null;
    
    return leg1Price + otherPrice;
  }
  
  /**
   * 检查是否满足对冲条件
   */
  checkHedgeCondition(leg1Side: TradeSide, leg1Price: number): boolean {
    const sumPrice = this.calculateSumPrice(leg1Side, leg1Price);
    
    if (sumPrice === null) return false;
    
    const config = getConfig();
    return sumPrice <= config.sumTarget;
  }
}

// 单例模式
let monitorInstance: PriceMonitor | null = null;

export function getPriceMonitor(): PriceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PriceMonitor();
  }
  return monitorInstance;
}
