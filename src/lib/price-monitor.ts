import type { PriceData, TradeSide } from '@/types/trading';
import { getPolymarketClient } from '@/lib/polymarket-client';
import { getConfig, TIME_CONFIG } from '@/config/strategy';

interface PricePoint {
  price: number;
  timestamp: number;
}

interface PriceHistory {
  UP: PricePoint[];
  DOWN: PricePoint[];
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
 * 使用真实的 Token ID 从 CLOB API 获取价格
 */
export class PriceMonitor {
  private priceHistory: PriceHistory = { UP: [], DOWN: [] };
  private maxHistoryLength = 100;
  private monitorInterval?: NodeJS.Timeout;
  private isMonitoring = false;
  
  // 当前监控的 Token IDs
  private upTokenId?: string;
  private downTokenId?: string;
  
  // 价格变化检测回调
  private onPriceUpdate?: (priceData: PriceData) => void;
  private onDropDetected?: (signal: DropSignal) => void;
  
  /**
   * 使用真实的 Token ID 开始监控
   */
  startMonitoringWithTokens(
    upTokenId: string,
    downTokenId: string,
    onPriceUpdate: (priceData: PriceData) => void,
    onDropDetected: (signal: DropSignal) => void
  ): void {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }
    
    this.upTokenId = upTokenId;
    this.downTokenId = downTokenId;
    this.onPriceUpdate = onPriceUpdate;
    this.onDropDetected = onDropDetected;
    this.isMonitoring = true;
    
    // 清空历史数据
    this.priceHistory = { UP: [], DOWN: [] };
    
    console.log(`[PriceMonitor] Starting with tokens:`);
    console.log(`[PriceMonitor] UP: ${upTokenId.slice(0, 20)}...`);
    console.log(`[PriceMonitor] DOWN: ${downTokenId.slice(0, 20)}...`);
    
    // 启动轮询获取价格
    this.startPolling();
  }
  
  /**
   * 开始监控（兼容旧接口）
   */
  startMonitoring(
    marketId: string,
    onPriceUpdate: (priceData: PriceData) => void,
    onDropDetected: (signal: DropSignal) => void
  ): void {
    console.log('[PriceMonitor] Using legacy monitoring mode - will fetch tokens dynamically');
    
    // 获取当前活跃市场
    this.fetchAndStartMonitoring(onPriceUpdate, onDropDetected);
  }
  
  /**
   * 动态获取 Token ID 并开始监控
   */
  private async fetchAndStartMonitoring(
    onPriceUpdate: (priceData: PriceData) => void,
    onDropDetected: (signal: DropSignal) => void
  ): Promise<void> {
    try {
      const client = getPolymarketClient();
      const marketResponse = await client.getActiveBitcoinMarket();
      
      if (marketResponse.success && marketResponse.data) {
        const market = marketResponse.data;
        this.startMonitoringWithTokens(
          market.upTokenId,
          market.downTokenId,
          onPriceUpdate,
          onDropDetected
        );
      } else {
        console.error('[PriceMonitor] Failed to get market, using simulation');
        // 使用模拟数据
        this.startSimulationMode(onPriceUpdate, onDropDetected);
      }
    } catch (error) {
      console.error('[PriceMonitor] Error fetching market:', error);
      this.startSimulationMode(onPriceUpdate, onDropDetected);
    }
  }
  
  /**
   * 启动模拟模式（无法获取真实数据时）
   */
  private startSimulationMode(
    onPriceUpdate: (priceData: PriceData) => void,
    onDropDetected: (signal: DropSignal) => void
  ): void {
    this.isMonitoring = true;
    this.onPriceUpdate = onPriceUpdate;
    this.onDropDetected = onDropDetected;
    
    this.priceHistory = { UP: [], DOWN: [] };
    
    console.log('[PriceMonitor] Running in simulation mode');
    
    // 生成模拟价格
    this.monitorInterval = setInterval(() => {
      if (!this.isMonitoring) return;
      
      // 生成模拟价格
      const upPrice = 0.5 + (Math.random() - 0.5) * 0.1;
      const downPrice = 1 - upPrice + (Math.random() - 0.5) * 0.02;
      
      // 更新 UP 价格
      this.handlePriceUpdate({
        side: 'YES',
        price: upPrice,
        timestamp: Date.now(),
      });
      
      // 更新 DOWN 价格
      this.handlePriceUpdate({
        side: 'NO',
        price: downPrice,
        timestamp: Date.now(),
      });
    }, TIME_CONFIG.PRICE_CHECK_INTERVAL);
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
    
    console.log('[PriceMonitor] Monitoring stopped');
  }
  
  /**
   * 启动轮询获取价格
   */
  private startPolling(): void {
    this.monitorInterval = setInterval(async () => {
      if (!this.isMonitoring || !this.upTokenId || !this.downTokenId) return;
      
      try {
        const client = getPolymarketClient();
        
        // 并行获取两个 Token 的价格
        const [upPrice, downPrice] = await Promise.all([
          client.getTokenPrice(this.upTokenId),
          client.getTokenPrice(this.downTokenId),
        ]);
        
        const now = Date.now();
        
        // 更新 UP 价格
        this.handlePriceUpdate({
          side: 'YES',
          price: upPrice,
          timestamp: now,
        });
        
        // 更新 DOWN 价格
        this.handlePriceUpdate({
          side: 'NO',
          price: downPrice,
          timestamp: now,
        });
        
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
    
    // 映射 side（YES -> UP, NO -> DOWN）
    const historyKey: 'UP' | 'DOWN' = priceData.side === 'YES' ? 'UP' : 'DOWN';
    
    // 添加到历史记录
    this.priceHistory[historyKey].push({
      price: priceData.price,
      timestamp: priceData.timestamp,
    });
    
    // 保持历史记录长度
    if (this.priceHistory[historyKey].length > this.maxHistoryLength) {
      this.priceHistory[historyKey].shift();
    }
    
    // 调用回调
    this.onPriceUpdate?.(priceData);
    
    // 检测快速下跌
    this.detectQuickDrop(historyKey);
  }
  
  /**
   * 检测快速下跌
   */
  private detectQuickDrop(side: 'UP' | 'DOWN'): void {
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
        side: side === 'UP' ? 'YES' : 'NO',
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
    const historyKey: 'UP' | 'DOWN' = side === 'YES' ? 'UP' : 'DOWN';
    const history = this.priceHistory[historyKey];
    return history.length > 0 ? history[history.length - 1].price : null;
  }
  
  /**
   * 获取价格历史
   */
  getPriceHistory(side: TradeSide): PricePoint[] {
    const historyKey: 'UP' | 'DOWN' = side === 'YES' ? 'UP' : 'DOWN';
    return this.priceHistory[historyKey];
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

export type { DropSignal };
