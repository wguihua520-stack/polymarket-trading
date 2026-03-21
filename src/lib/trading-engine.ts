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
 * 
 * Leg 1 规则：
 * - 每轮开始时，启动3分钟倒计时
 * - 监控YES和NO两侧价格
 * - 如果任意一侧在3秒内下跌≥15%，立即买入下跌侧
 * - 3分钟内无信号则结束本轮
 * 
 * Leg 2 规则：
 * - Leg1完成后，监控另一侧价格
 * - 当 Leg1价格 + 另一侧价格 ≤ 0.93 时，买入另一侧
 * - 如果在本周期内无法满足条件，放弃本轮
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
  private mainLoopInterval?: NodeJS.Timeout;
  private leg1Timeout?: NodeJS.Timeout;
  private leg2CheckInterval?: NodeJS.Timeout;
  
  // 状态变更回调
  private onStateChange?: (state: SystemState) => void;
  private onRoundUpdate?: (round: TradingRound) => void;
  private onLog?: (log: LogEntry) => void;
  
  // 当前市场信息
  private currentMarketId?: string;
  private currentMarketQuestion?: string;
  
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
    
    const config = getConfig();
    const validation = validateConfig(config);
    
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    
    this.log('INFO', 'ENGINE', '交易引擎初始化完成', { 
      策略参数: {
        对冲阈值: config.sumTarget,
        下跌阈值: `${(config.movePct * 100).toFixed(0)}%`,
        监控窗口: `${config.windowMin}分钟`,
        仓位大小: `${config.positionSize} USDC`,
        最大暴露: `${config.maxExposure} USDC`,
      }
    });
  }
  
  /**
   * 启动引擎
   */
  async start(): Promise<void> {
    if (this.state.isRunning) {
      this.log('WARN', 'ENGINE', '引擎已在运行中');
      return;
    }
    
    this.state.isRunning = true;
    this.state.lastUpdate = Date.now();
    this.notifyStateChange();
    
    this.log('INFO', 'ENGINE', '🚀 交易引擎已启动');
    
    // 查找市场并启动主循环
    await this.findMarketAndStartMainLoop();
  }
  
  /**
   * 停止引擎
   */
  async stop(): Promise<void> {
    if (!this.state.isRunning) return;
    
    this.state.isRunning = false;
    this.state.lastUpdate = Date.now();
    
    // 清理所有定时器
    this.clearAllTimers();
    
    // 停止价格监控
    const monitor = getPriceMonitor();
    monitor.stopMonitoring();
    
    // 结束当前轮次
    if (this.currentRound) {
      await this.endRound('TIMEOUT', '引擎停止');
    }
    
    this.notifyStateChange();
    this.log('INFO', 'ENGINE', '⏹️ 交易引擎已停止');
  }
  
  /**
   * 清理所有定时器
   */
  private clearAllTimers(): void {
    if (this.mainLoopInterval) {
      clearInterval(this.mainLoopInterval);
      this.mainLoopInterval = undefined;
    }
    if (this.leg1Timeout) {
      clearTimeout(this.leg1Timeout);
      this.leg1Timeout = undefined;
    }
    if (this.leg2CheckInterval) {
      clearInterval(this.leg2CheckInterval);
      this.leg2CheckInterval = undefined;
    }
  }
  
  /**
   * 查找市场并启动主循环
   */
  private async findMarketAndStartMainLoop(): Promise<void> {
    try {
      // 查找比特币15分钟市场
      const btcResponse = await client.getBitcoin15MinMarket();
      
      if (btcResponse.success && btcResponse.data) {
        this.currentMarketId = btcResponse.data.marketId;
        this.currentMarketQuestion = btcResponse.data.question;
        this.log('INFO', 'ENGINE', `已选择市场: ${btcResponse.data.question}`, {
          UP价格: btcResponse.data.yesPrice.toFixed(4),
          DOWN价格: btcResponse.data.noPrice.toFixed(4),
          价差: `${(btcResponse.data.spread * 100).toFixed(2)}%`,
        });
      } else {
        // 尝试搜索市场
        const response = await client.searchMarkets('bitcoin');
        
        if (!response.success || !response.data || response.data.length === 0) {
          this.log('WARN', 'ENGINE', '未找到比特币市场，使用默认市场');
          this.currentMarketId = 'btc-15min-default';
          this.currentMarketQuestion = '比特币15分钟涨跌预测';
        } else {
          // 筛选高流动性市场
          const config = getConfig();
          const suitableMarkets = response.data.filter(market => 
            market.spread < config.maxSpread && 
            market.status === 'ACTIVE'
          );
          
          if (suitableMarkets.length > 0) {
            const market = suitableMarkets[0];
            this.currentMarketId = market.marketId;
            this.currentMarketQuestion = market.question;
            this.log('INFO', 'ENGINE', `已选择市场: ${market.question}`);
          } else {
            this.currentMarketId = response.data[0].marketId;
            this.currentMarketQuestion = response.data[0].question;
          }
        }
      }
      
      // 启动主循环（与Polymarket周期同步）
      this.startSynchronizedMainLoop();
      
    } catch (error) {
      this.log('ERROR', 'ENGINE', '查找市场失败', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      // 使用默认市场
      this.currentMarketId = 'btc-15min-default';
      this.currentMarketQuestion = '比特币15分钟涨跌预测';
      this.startSynchronizedMainLoop();
    }
  }
  
  /**
   * 启动同步主循环（与Polymarket 15分钟周期同步）
   */
  private startSynchronizedMainLoop(): void {
    const config = getConfig();
    const cycleDurationMs = config.marketDuration * 60 * 1000; // 15分钟
    
    // 计算下一个周期的开始时间
    const now = Date.now();
    const currentCycleStart = Math.floor(now / cycleDurationMs) * cycleDurationMs;
    const nextCycleStart = currentCycleStart + cycleDurationMs;
    const timeToNextCycle = nextCycleStart - now;
    
    this.log('INFO', 'CYCLE', `⏰ 周期同步`, {
      当前周期开始: new Date(currentCycleStart).toLocaleTimeString(),
      下个周期开始: new Date(nextCycleStart).toLocaleTimeString(),
      等待时间: `${Math.floor(timeToNextCycle / 1000)}秒`,
    });
    
    // 立即检查当前周期是否还有时间
    const remainingInCycle = cycleDurationMs - (now - currentCycleStart);
    if (remainingInCycle > config.windowMin * 60 * 1000) {
      // 当前周期还有足够时间，立即开始
      this.startNewRound(currentCycleStart, nextCycleStart);
    }
    
    // 设置定时器，在每个周期开始时启动新轮次
    setTimeout(() => {
      this.startNewRound(nextCycleStart, nextCycleStart + cycleDurationMs);
      
      // 每15分钟启动新轮次
      this.mainLoopInterval = setInterval(() => {
        const cycleStart = Date.now();
        this.startNewRound(cycleStart, cycleStart + cycleDurationMs);
      }, cycleDurationMs);
      
    }, timeToNextCycle);
  }
  
  /**
   * 启动新的交易轮次
   */
  private startNewRound(cycleStartTime: number, cycleEndTime: number): void {
    const config = getConfig();
    const now = Date.now();
    
    // 如果有正在进行的轮次，先结束
    if (this.currentRound && 
        this.currentRound.status !== 'COMPLETED' && 
        this.currentRound.status !== 'FAILED' && 
        this.currentRound.status !== 'TIMEOUT') {
      this.log('WARN', 'ROUND', '上一轮未结束，强制结束');
      this.endRound('TIMEOUT', '新周期开始');
    }
    
    // 创建新轮次
    this.currentRound = {
      roundId: `round_${now}`,
      startTime: now,
      status: 'MONITORING',
      marketId: this.currentMarketId || 'unknown',
      monitoringWindowEnd: now + config.windowMin * 60 * 1000, // 3分钟监控窗口
      cycleEndTime: cycleEndTime,
    };
    
    this.state.totalRounds++;
    this.state.lastUpdate = now;
    this.notifyStateChange();
    this.notifyRoundUpdate();
    
    this.log('INFO', 'ROUND', `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    this.log('INFO', 'ROUND', `🔄 新轮次开始`, {
      轮次ID: this.currentRound.roundId,
      市场: this.currentMarketQuestion,
      周期结束时间: new Date(cycleEndTime).toLocaleTimeString(),
      监控窗口: `${config.windowMin}分钟`,
    });
    this.log('INFO', 'ROUND', `📊 Leg1 监控中... (检测3秒内≥${(config.movePct * 100).toFixed(0)}%下跌)`);
    
    // 启动价格监控
    const monitor = getPriceMonitor();
    monitor.startMonitoring(
      this.currentMarketId || 'btc-15min-default',
      (priceData) => this.handlePriceUpdate(priceData),
      (signal) => this.handleDropSignal(signal)
    );
    
    // 设置Leg1监控窗口超时（3分钟）
    this.leg1Timeout = setTimeout(() => {
      if (this.currentRound && this.currentRound.status === 'MONITORING') {
        this.endRound('TIMEOUT', `📊 Leg1 监控窗口(${config.windowMin}分钟)内未检测到快速下跌信号`);
      }
    }, config.windowMin * 60 * 1000);
  }
  
  /**
   * 处理价格更新
   */
  private handlePriceUpdate(priceData: PriceData): void {
    if (!this.currentRound) return;
    
    // Leg1阶段：记录价格用于检测下跌
    if (this.currentRound.status === 'MONITORING') {
      // 价格监控在 PriceMonitor 中处理
    }
    
    // Leg2阶段：检查对冲条件
    if (this.currentRound.status === 'LEG1_EXECUTED' && this.currentRound.leg1) {
      const monitor = getPriceMonitor();
      const otherSide: TradeSide = this.currentRound.leg1.side === 'YES' ? 'NO' : 'YES';
      const otherPrice = monitor.getLatestPrice(otherSide);
      
      if (otherPrice !== null) {
        const sumPrice = this.currentRound.leg1.price + otherPrice;
        const config = getConfig();
        
        // 检查是否满足对冲条件
        if (sumPrice <= config.sumTarget) {
          this.log('INFO', 'LEG2', `✅ 满足对冲条件`, {
            Leg1价格: this.currentRound.leg1.price.toFixed(4),
            另一侧价格: otherPrice.toFixed(4),
            价格总和: sumPrice.toFixed(4),
            目标阈值: config.sumTarget,
          });
          this.executeLeg2(otherPrice, otherSide);
        }
      }
    }
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
      this.log('WARN', 'SIGNAL', '超出监控窗口，信号忽略');
      return;
    }
    
    this.log('INFO', 'SIGNAL', `📉 检测到快速下跌`, {
      方向: signal.side,
      下跌幅度: `${(signal.dropPct * 100).toFixed(2)}%`,
      起始价格: signal.fromPrice.toFixed(4),
      当前价格: signal.toPrice.toFixed(4),
      耗时: `${signal.duration}ms`,
    });
    
    // 清除Leg1超时定时器
    if (this.leg1Timeout) {
      clearTimeout(this.leg1Timeout);
      this.leg1Timeout = undefined;
    }
    
    // 执行Leg1
    await this.executeLeg1(signal);
  }
  
  /**
   * 执行Leg1 - 首次买入
   */
  private async executeLeg1(signal: DropSignal): Promise<void> {
    if (!this.currentRound) return;
    
    const config = getConfig();
    const now = Date.now();
    
    this.log('INFO', 'LEG1', `🟢 执行Leg1买入`, {
      买入方向: signal.side,
      买入价格: signal.toPrice.toFixed(4),
      仓位大小: `${config.positionSize} USDC`,
    });
    
    try {
      const client = getPolymarketClient();
      
      // 创建买入订单
      const orderResponse = await client.createOrder({
        marketId: this.currentRound.marketId,
        side: signal.side,
        amount: config.positionSize,
        price: signal.toPrice,
      });
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.error || '订单失败');
      }
      
      const order = orderResponse.data!;
      
      // 更新轮次状态
      this.currentRound.leg1 = {
        side: signal.side,
        price: order.executedPrice,
        amount: order.amount,
        timestamp: order.timestamp,
        triggerReason: `快速下跌 ${(signal.dropPct * 100).toFixed(2)}%`,
        priceDrop: signal.dropPct,
      };
      
      this.currentRound.leg1TriggerTime = now;
      this.currentRound.status = 'LEG1_EXECUTED';
      
      this.notifyRoundUpdate();
      
      this.log('INFO', 'LEG1', `✅ Leg1 买入成功`, {
        订单ID: order.orderId,
        成交价格: order.executedPrice.toFixed(4),
        成交数量: order.amount,
        手续费: order.fee.toFixed(4),
      });
      
      // 计算剩余时间
      const remainingTime = this.currentRound.cycleEndTime - now;
      const remainingMinutes = Math.floor(remainingTime / 60000);
      
      this.log('INFO', 'LEG2', `📊 Leg2 监控中... (等待价格总和≤${config.sumTarget})`, {
        需要另一侧价格: `≤${(config.sumTarget - order.executedPrice).toFixed(4)}`,
        剩余时间: `${remainingMinutes}分钟`,
      });
      
      // 设置周期结束检查
      this.leg2CheckInterval = setInterval(() => {
        if (!this.currentRound) return;
        
        const timeRemaining = this.currentRound.cycleEndTime - Date.now();
        if (timeRemaining <= 0) {
          this.endRound('TIMEOUT', '⏰ 周期结束，未满足对冲条件，放弃本轮');
        }
      }, 10000); // 每10秒检查一次
      
    } catch (error) {
      this.log('ERROR', 'LEG1', `❌ Leg1 买入失败`, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      await this.endRound('FAILED', 'Leg1执行失败');
    }
  }
  
  /**
   * 执行Leg2 - 对冲买入
   */
  private async executeLeg2(otherPrice: number, otherSide: TradeSide): Promise<void> {
    if (!this.currentRound || !this.currentRound.leg1) return;
    
    const config = getConfig();
    const now = Date.now();
    
    // 清除Leg2检查定时器
    if (this.leg2CheckInterval) {
      clearInterval(this.leg2CheckInterval);
      this.leg2CheckInterval = undefined;
    }
    
    this.log('INFO', 'LEG2', `🟢 执行Leg2对冲买入`, {
      买入方向: otherSide,
      买入价格: otherPrice.toFixed(4),
      仓位大小: `${config.positionSize} USDC`,
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
        throw new Error(orderResponse.error || '订单失败');
      }
      
      const order = orderResponse.data!;
      const sumPrice = this.currentRound.leg1.price + order.executedPrice;
      const grossProfit = (1 - sumPrice) * config.positionSize;
      const netProfit = grossProfit - order.fee;
      
      // 更新轮次状态
      this.currentRound.leg2 = {
        side: otherSide,
        price: order.executedPrice,
        amount: order.amount,
        timestamp: order.timestamp,
        sumPrice: sumPrice,
        actualFee: order.fee,
      };
      
      this.currentRound.leg2TriggerTime = now;
      this.currentRound.endTime = now;
      this.currentRound.status = 'COMPLETED';
      
      // 更新统计
      this.state.successfulRounds++;
      this.state.totalProfit += netProfit;
      this.state.lastUpdate = now;
      
      this.notifyStateChange();
      this.notifyRoundUpdate();
      
      this.log('INFO', 'LEG2', `✅ Leg2 对冲买入成功`, {
        订单ID: order.orderId,
        成交价格: order.executedPrice.toFixed(4),
        成交数量: order.amount,
        手续费: order.fee.toFixed(4),
        价格总和: sumPrice.toFixed(4),
      });
      
      this.log('INFO', 'ROUND', `🎉 本轮完成！`, {
        Leg1: `${this.currentRound.leg1.side} @ ${this.currentRound.leg1.price.toFixed(4)}`,
        Leg2: `${otherSide} @ ${order.executedPrice.toFixed(4)}`,
        价格总和: sumPrice.toFixed(4),
        毛利润: grossProfit.toFixed(4),
        手续费: order.fee.toFixed(4),
        净利润: netProfit.toFixed(4),
      });
      
      // 停止监控
      const monitor = getPriceMonitor();
      monitor.stopMonitoring();
      
      // 等待下一周期
      this.log('INFO', 'ROUND', `⏳ 等待下一周期开始...`);
      
    } catch (error) {
      this.log('ERROR', 'LEG2', `❌ Leg2 买入失败`, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      await this.endRound('FAILED', 'Leg2执行失败');
    }
  }
  
  /**
   * 结束轮次
   */
  private async endRound(status: 'COMPLETED' | 'FAILED' | 'TIMEOUT', reason: string): Promise<void> {
    if (!this.currentRound) return;
    
    // 清理定时器
    if (this.leg1Timeout) {
      clearTimeout(this.leg1Timeout);
      this.leg1Timeout = undefined;
    }
    if (this.leg2CheckInterval) {
      clearInterval(this.leg2CheckInterval);
      this.leg2CheckInterval = undefined;
    }
    
    // 停止价格监控
    const monitor = getPriceMonitor();
    monitor.stopMonitoring();
    
    const previousStatus = this.currentRound.status;
    this.currentRound.status = status;
    this.currentRound.endTime = Date.now();
    this.currentRound.failReason = reason;
    
    if (status !== 'COMPLETED') {
      this.state.failedRounds++;
    }
    this.state.lastUpdate = Date.now();
    
    this.notifyStateChange();
    this.notifyRoundUpdate();
    
    const statusEmoji = status === 'TIMEOUT' ? '⏰' : status === 'FAILED' ? '❌' : '✅';
    this.log('INFO', 'ROUND', `${statusEmoji} 轮次结束: ${reason}`, {
      轮次ID: this.currentRound.roundId,
      最终状态: status,
      是否有Leg1: !!this.currentRound.leg1,
      是否有Leg2: !!this.currentRound.leg2,
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
    
    logger.log(logEntry);
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
