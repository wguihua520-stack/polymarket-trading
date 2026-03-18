import type { 
  TradingRound, 
  SystemState, 
  TradeSide, 
  PriceData, 
  LogEntry,
  DropSignal 
} from '@/types/trading';
import { getPriceMonitor } from '@/lib/price-monitor';
import { getPolymarketClient } from '@/lib/polymarket-client';
import { getConfig, validateConfig } from '@/config/strategy';
import { logger } from '@/lib/logger';

/**
 * 交易策略引擎
 * 核心逻辑：快速下跌对冲套利
 */
export class TradingEngine {
  private state: SystemState = {
    isRunning: false,
    totalRounds: 0,
    successfulRounds: 0,
    failedRounds: 0,
    totalProfit: 0,
    totalLoss: 0,
    lastUpdate: Date.now(),
  };
  
  private currentRound?: TradingRound;
  private roundCheckInterval?: NodeJS.Timeout;
  private cycleCheckInterval?: NodeJS.Timeout;
  
  // 状态变更回调
  private onStateChange?: (state: SystemState) => void;
  private onRoundUpdate?: (round: TradingRound) => void;
  private onLog?: (log: LogEntry) => void;
  
  /**
   * 初始化引擎
   */
  async initialize(
    onStateChange: (state: SystemState) => void,
    onRoundUpdate: (round: TradingRound) => void,
    onLog: (log: LogEntry) => void
  ): Promise<void> {
    this.onStateChange = onStateChange;
    this.onRoundUpdate = onRoundUpdate;
    this.onLog = onLog;
    
    // 验证配置
    const config = getConfig();
    const validation = validateConfig(config);
    
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    
    this.log('INFO', 'ENGINE', 'Trading engine initialized', { config });
  }
  
  /**
   * 启动引擎
   */
  async start(): Promise<void> {
    if (this.state.isRunning) {
      this.log('WARN', 'ENGINE', 'Engine is already running');
      return;
    }
    
    this.state.isRunning = true;
    this.state.lastUpdate = Date.now();
    this.notifyStateChange();
    
    this.log('INFO', 'ENGINE', 'Trading engine started');
    
    // 启动周期检查
    this.startCycleCheck();
  }
  
  /**
   * 停止引擎
   */
  async stop(): Promise<void> {
    if (!this.state.isRunning) {
      return;
    }
    
    this.state.isRunning = false;
    this.state.lastUpdate = Date.now();
    
    // 清理定时器
    if (this.roundCheckInterval) {
      clearInterval(this.roundCheckInterval);
      this.roundCheckInterval = undefined;
    }
    
    if (this.cycleCheckInterval) {
      clearInterval(this.cycleCheckInterval);
      this.cycleCheckInterval = undefined;
    }
    
    // 停止价格监控
    const monitor = getPriceMonitor();
    monitor.stopMonitoring();
    
    // 结束当前轮次
    if (this.currentRound && this.currentRound.status === 'MONITORING') {
      await this.failRound('Engine stopped');
    }
    
    this.notifyStateChange();
    this.log('INFO', 'ENGINE', 'Trading engine stopped');
  }
  
  /**
   * 启动周期检查（比特币15分钟市场周期）
   */
  private startCycleCheck(): void {
    const config = getConfig();
    
    // 每分钟检查一次周期
    this.cycleCheckInterval = setInterval(async () => {
      if (!this.state.isRunning) return;
      
      // 查找合适的比特币15分钟市场
      await this.findAndStartRound();
    }, 60000); // 每分钟检查一次
    
    // 立即执行一次
    this.findAndStartRound();
  }
  
  /**
   * 查找并启动新的交易轮次
   */
  private async findAndStartRound(): Promise<void> {
    // 如果有正在进行的轮次，跳过
    if (this.currentRound && this.currentRound.status !== 'COMPLETED' && this.currentRound.status !== 'FAILED' && this.currentRound.status !== 'TIMEOUT') {
      return;
    }
    
    try {
      const client = getPolymarketClient();
      const response = await client.getMarkets();
      
      if (!response.success || !response.data || response.data.length === 0) {
        this.log('WARN', 'ENGINE', 'No suitable markets found');
        return;
      }
      
      const config = getConfig();
      
      // 筛选高流动性市场
      const suitableMarkets = response.data.filter(market => 
        market.spread < config.maxSpread && 
        market.status === 'ACTIVE'
      );
      
      if (suitableMarkets.length === 0) {
        this.log('WARN', 'ENGINE', 'No markets with sufficient liquidity');
        return;
      }
      
      // 选择第一个合适的市场
      const market = suitableMarkets[0];
      
      // 启动新轮次
      this.startRound(market.marketId, market.question);
      
    } catch (error) {
      this.log('ERROR', 'ENGINE', 'Failed to find markets', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
  
  /**
   * 启动新的交易轮次
   */
  private startRound(marketId: string, marketQuestion: string): void {
    const config = getConfig();
    const now = Date.now();
    
    // 计算周期结束时间（15分钟后）
    const cycleEndTime = now + config.marketDuration * 60 * 1000;
    
    // 计算监控窗口结束时间（3分钟后）
    const monitoringWindowEnd = now + config.windowMin * 60 * 1000;
    
    this.currentRound = {
      roundId: `round_${now}`,
      startTime: now,
      status: 'MONITORING',
      marketId,
      monitoringWindowEnd,
      cycleEndTime,
    };
    
    this.state.totalRounds++;
    this.state.lastUpdate = now;
    this.notifyStateChange();
    this.notifyRoundUpdate();
    
    this.log('INFO', 'ROUND', `Round started: ${marketQuestion}`, {
      roundId: this.currentRound.roundId,
      marketId,
      monitoringWindow: `${config.windowMin} minutes`,
    });
    
    // 启动价格监控
    const monitor = getPriceMonitor();
    monitor.startMonitoring(
      marketId,
      (priceData) => this.handlePriceUpdate(priceData),
      (signal) => this.handleDropSignal(signal)
    );
    
    // 设置监控窗口超时
    setTimeout(() => {
      this.checkMonitoringWindow();
    }, config.windowMin * 60 * 1000);
  }
  
  /**
   * 检查监控窗口是否超时
   */
  private checkMonitoringWindow(): void {
    if (!this.currentRound || this.currentRound.status !== 'MONITORING') {
      return;
    }
    
    // 如果在监控窗口内没有触发Leg1，结束本轮
    this.failRound('No signal in monitoring window');
  }
  
  /**
   * 处理价格更新
   */
  private handlePriceUpdate(priceData: PriceData): void {
    if (!this.currentRound) return;
    
    // 记录价格更新（用于计算对冲条件）
    this.log('DEBUG', 'PRICE', `Price update: ${priceData.side} = ${priceData.price.toFixed(4)}`);
  }
  
  /**
   * 处理快速下跌信号
   */
  private async handleDropSignal(signal: DropSignal): Promise<void> {
    if (!this.currentRound || this.currentRound.status !== 'MONITORING') {
      return;
    }
    
    // 检查是否在监控窗口内
    const now = Date.now();
    if (now > this.currentRound.monitoringWindowEnd) {
      this.log('WARN', 'ROUND', 'Signal received outside monitoring window, ignoring');
      return;
    }
    
    this.log('INFO', 'SIGNAL', `Quick drop detected: ${signal.side} dropped ${(signal.dropPct * 100).toFixed(2)}%`, {
      fromPrice: signal.fromPrice.toFixed(4),
      toPrice: signal.toPrice.toFixed(4),
      duration: `${signal.duration}ms`,
    });
    
    // 执行Leg1
    await this.executeLeg1(signal);
  }
  
  /**
   * 执行Leg1 - 首次买入
   */
  private async executeLeg1(signal: DropSignal): Promise<void> {
    if (!this.currentRound) return;
    
    const config = getConfig();
    
    try {
      const client = getPolymarketClient();
      
      // 创建买入订单
      const orderResponse = await client.createOrder({
        marketId: this.currentRound.marketId,
        side: signal.side,
        amount: config.positionSize,
        price: signal.toPrice, // 以当前价格买入
      });
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.error || 'Order failed');
      }
      
      const order = orderResponse.data!;
      
      // 更新轮次状态
      this.currentRound.leg1 = {
        side: signal.side,
        price: order.executedPrice,
        amount: order.amount,
        timestamp: order.timestamp,
        triggerReason: `Quick drop: ${(signal.dropPct * 100).toFixed(2)}%`,
        priceDrop: signal.dropPct,
      };
      
      this.currentRound.leg1TriggerTime = order.timestamp;
      this.currentRound.status = 'LEG1_EXECUTED';
      
      this.notifyRoundUpdate();
      
      this.log('INFO', 'LEG1', `Leg1 executed: ${signal.side} @ ${order.executedPrice.toFixed(4)}`, {
        orderId: order.orderId,
        amount: order.amount,
        fee: order.fee.toFixed(4),
      });
      
      // 开始监控Leg2
      this.startLeg2Monitoring();
      
    } catch (error) {
      this.log('ERROR', 'LEG1', 'Failed to execute Leg1', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      await this.failRound('Leg1 execution failed');
    }
  }
  
  /**
   * 开始Leg2监控
   */
  private startLeg2Monitoring(): void {
    if (!this.currentRound || !this.currentRound.leg1) return;
    
    this.log('INFO', 'LEG2', 'Starting Leg2 monitoring', {
      targetSum: getConfig().sumTarget,
      leg1Side: this.currentRound.leg1.side,
      leg1Price: this.currentRound.leg1.price.toFixed(4),
    });
    
    // 设置超时检查（如果接近周期结束，放弃本轮）
    const timeToCycleEnd = this.currentRound.cycleEndTime - Date.now();
    
    setTimeout(() => {
      if (this.currentRound && this.currentRound.status === 'LEG1_EXECUTED') {
        this.failRound('No hedge opportunity before cycle end');
      }
    }, timeToCycleEnd - 60000); // 提前1分钟放弃
  }
  
  /**
   * 执行Leg2 - 对冲买入
   */
  private async executeLeg2(): Promise<void> {
    if (!this.currentRound || !this.currentRound.leg1) return;
    
    const config = getConfig();
    const monitor = getPriceMonitor();
    
    // 获取另一侧的价格
    const otherSide: TradeSide = this.currentRound.leg1.side === 'YES' ? 'NO' : 'YES';
    const otherPrice = monitor.getLatestPrice(otherSide);
    
    if (otherPrice === null) {
      this.log('WARN', 'LEG2', 'No price data for other side');
      return;
    }
    
    // 计算价格总和
    const sumPrice = this.currentRound.leg1.price + otherPrice;
    
    // 检查是否满足对冲条件
    if (sumPrice > config.sumTarget) {
      this.log('DEBUG', 'LEG2', `Hedge condition not met: sum=${sumPrice.toFixed(4)} > ${config.sumTarget}`);
      return;
    }
    
    this.log('INFO', 'SIGNAL', `Hedge opportunity detected: sum=${sumPrice.toFixed(4)} <= ${config.sumTarget}`, {
      leg1Price: this.currentRound.leg1.price.toFixed(4),
      otherPrice: otherPrice.toFixed(4),
    });
    
    try {
      const client = getPolymarketClient();
      
      // 创建对冲订单
      const orderResponse = await client.createOrder({
        marketId: this.currentRound.marketId,
        side: otherSide,
        amount: config.positionSize,
        price: otherPrice,
      });
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.error || 'Order failed');
      }
      
      const order = orderResponse.data!;
      
      // 更新轮次状态
      this.currentRound.leg2 = {
        side: otherSide,
        price: order.executedPrice,
        amount: order.amount,
        timestamp: order.timestamp,
        sumPrice: this.currentRound.leg1.price + order.executedPrice,
        actualFee: order.fee,
      };
      
      this.currentRound.leg2TriggerTime = order.timestamp;
      this.currentRound.endTime = order.timestamp;
      this.currentRound.status = 'COMPLETED';
      
      // 更新统计
      this.state.successfulRounds++;
      this.state.totalProfit += this.calculateProfit();
      this.state.lastUpdate = order.timestamp;
      
      this.notifyStateChange();
      this.notifyRoundUpdate();
      
      this.log('INFO', 'LEG2', `Leg2 executed: ${otherSide} @ ${order.executedPrice.toFixed(4)}`, {
        orderId: order.orderId,
        amount: order.amount,
        sumPrice: this.currentRound.leg2.sumPrice.toFixed(4),
        fee: order.fee.toFixed(4),
      });
      
      this.log('INFO', 'ROUND', 'Round completed successfully', {
        roundId: this.currentRound.roundId,
        profit: this.calculateProfit().toFixed(4),
      });
      
      // 停止监控，准备下一轮
      monitor.stopMonitoring();
      
    } catch (error) {
      this.log('ERROR', 'LEG2', 'Failed to execute Leg2', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      await this.failRound('Leg2 execution failed');
    }
  }
  
  /**
   * 计算利润
   */
  private calculateProfit(): number {
    if (!this.currentRound || !this.currentRound.leg1 || !this.currentRound.leg2) {
      return 0;
    }
    
    const config = getConfig();
    
    // 理论利润 = (1 - sumPrice) * positionSize
    const sumPrice = this.currentRound.leg1.price + this.currentRound.leg2.price;
    const grossProfit = (1 - sumPrice) * config.positionSize;
    
    // 净利润 = 理论利润 - 手续费
    const netProfit = grossProfit - this.currentRound.leg2.actualFee;
    
    return netProfit;
  }
  
  /**
   * 结束轮次（失败）
   */
  private async failRound(reason: string): Promise<void> {
    if (!this.currentRound) return;
    
    this.currentRound.status = 'FAILED';
    this.currentRound.endTime = Date.now();
    this.currentRound.failReason = reason;
    
    this.state.failedRounds++;
    this.state.lastUpdate = Date.now();
    
    const monitor = getPriceMonitor();
    monitor.stopMonitoring();
    
    this.notifyStateChange();
    this.notifyRoundUpdate();
    
    this.log('WARN', 'ROUND', `Round failed: ${reason}`, {
      roundId: this.currentRound.roundId,
    });
  }
  
  /**
   * 通知状态变更
   */
  private notifyStateChange(): void {
    this.onStateChange?.(this.state);
  }
  
  /**
   * 通知轮次更新
   */
  private notifyRoundUpdate(): void {
    if (this.currentRound) {
      this.onRoundUpdate?.(this.currentRound);
    }
  }
  
  /**
   * 记录日志
   */
  private log(level: LogEntry['level'], category: string, message: string, data?: Record<string, unknown>): void {
    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
    };
    
    // 写入日志文件
    logger.log(logEntry);
    
    // 通知前端
    this.onLog?.(logEntry);
  }
  
  /**
   * 获取当前状态
   */
  getState(): SystemState {
    return this.state;
  }
  
  /**
   * 获取当前轮次
   */
  getCurrentRound(): TradingRound | undefined {
    return this.currentRound;
  }
}

// 单例模式
let engineInstance: TradingEngine | null = null;

export function getTradingEngine(): TradingEngine {
  if (!engineInstance) {
    engineInstance = new TradingEngine();
  }
  return engineInstance;
}
