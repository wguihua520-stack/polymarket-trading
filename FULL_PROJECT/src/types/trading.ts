// 交易方向
export type TradeSide = 'YES' | 'NO';

// 市场状态
export type MarketStatus = 'ACTIVE' | 'INACTIVE' | 'SETTLED';

// 轮次状态
export type RoundStatus = 
  | 'IDLE'           // 空闲，等待新周期
  | 'MONITORING'     // 监控Leg 1信号
  | 'LEG1_EXECUTED'  // Leg 1已执行，等待Leg 2
  | 'COMPLETED'      // 本轮完成
  | 'FAILED'         // 本轮失败
  | 'TIMEOUT';       // 超时放弃

// 价格数据
export interface PriceData {
  side: TradeSide;
  price: number;
  timestamp: number;
}

// 快速下跌信号
export interface DropSignal {
  side: TradeSide;
  dropPct: number;
  fromPrice: number;
  toPrice: number;
  duration: number; // 毫秒
}

// 市场数据
export interface MarketData {
  marketId: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  yesBestAsk: number;
  noBestAsk: number;
  yesBestBid: number;
  noBestBid: number;
  spread: number; // 买卖价差百分比
  liquidity: number;
  status: MarketStatus;
  timestamp: number;
}

// Leg 1 交易记录
export interface Leg1Trade {
  side: TradeSide;
  price: number;
  amount: number;
  timestamp: number;
  triggerReason: string; // 触发原因
  priceDrop: number;     // 价格下跌幅度
}

// Leg 2 交易记录
export interface Leg2Trade {
  side: TradeSide;
  price: number;
  amount: number;
  timestamp: number;
  sumPrice: number;      // Leg1 + Leg2 价格总和
  actualFee: number;     // 实际手续费
}

// 交易轮次
export interface TradingRound {
  roundId: string;
  startTime: number;
  endTime?: number;
  status: RoundStatus;
  marketId: string;
  
  // Leg 1 数据
  leg1?: Leg1Trade;
  leg1TriggerTime?: number;
  
  // Leg 2 数据
  leg2?: Leg2Trade;
  leg2TriggerTime?: number;
  
  // 失败原因
  failReason?: string;
  
  // 监控窗口结束时间
  monitoringWindowEnd: number;
  
  // 周期结束时间（比特币15分钟市场）
  cycleEndTime: number;
}

// 策略配置
export interface StrategyConfig {
  // 核心参数
  sumTarget: number;        // 对冲阈值 (0.93)
  movePct: number;          // 下跌阈值 (0.15)
  windowMin: number;        // 监控窗口（分钟）
  
  // 仓位设置
  positionSize: number;     // 每次交易金额 (USDC)
  
  // 风险控制
  maxSpread: number;        // 最大买卖价差 (0.05)
  maxExposure: number;      // 单市场最大暴露 (USDC)
  
  // 市场筛选
  targetMarket: string;     // 目标市场关键词
  marketDuration: number;   // 市场周期（分钟）
  
  // API配置
  polymarketApiKey?: string;
  polymarketApiSecret?: string;
  walletPrivateKey?: string;
}

// 日志级别
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

// 日志条目
export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

// 系统状态
export interface SystemState {
  isRunning: boolean;
  currentRound?: TradingRound;
  totalRounds: number;
  successfulRounds: number;
  failedRounds: number;
  totalProfit: number;
  totalLoss: number;
  lastUpdate: number;
}

// WebSocket消息
export interface WSMessage {
  type: 'PRICE_UPDATE' | 'ROUND_UPDATE' | 'LOG' | 'SYSTEM_STATUS';
  data: PriceData | TradingRound | LogEntry | SystemState;
}

// API响应
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// 订单请求
export interface OrderRequest {
  marketId: string;
  side: TradeSide;
  amount: number;
  price?: number; // 可选价格限制
}

// 订单响应
export interface OrderResponse {
  orderId: string;
  marketId: string;
  side: TradeSide;
  amount: number;
  executedPrice: number;
  fee: number;
  timestamp: number;
}
