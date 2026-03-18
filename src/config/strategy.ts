import type { StrategyConfig } from '@/types/trading';

// 默认策略配置
export const DEFAULT_CONFIG: StrategyConfig = {
  // 核心参数
  sumTarget: 0.93,          // 对冲阈值
  movePct: 0.15,            // 下跌阈值 15%
  windowMin: 3,             // 监控窗口 3分钟
  
  // 仓位设置
  positionSize: 100,        // 默认每次交易 100 USDC
  
  // 风险控制
  maxSpread: 0.05,          // 最大买卖价差 5%
  maxExposure: 1000,        // 单市场最大暴露 1000 USDC
  
  // 市场筛选
  targetMarket: 'Bitcoin 15 minute', // 目标市场
  marketDuration: 15,       // 市场周期 15分钟
  
  // API配置 - 从环境变量读取
  polymarketApiKey: process.env.POLYMARKET_API_KEY,
  polymarketApiSecret: process.env.POLYMARKET_API_SECRET,
  walletPrivateKey: process.env.WALLET_PRIVATE_KEY,
};

// Polymarket API配置
export const POLYMARKET_CONFIG = {
  // REST API
  REST_API_URL: 'https://clob.polymarket.com',
  
  // WebSocket API
  WS_API_URL: 'wss://ws-subscriptions-clob.polymarket.com/ws',
  
  // Gamma API (市场数据)
  GAMMA_API_URL: 'https://gamma-api.polymarket.com',
  
  // Chain配置
  CHAIN_ID: 137, // Polygon Mainnet
  
  // 合约地址
  CTF_EXCHANGE_ADDRESS: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E',
  CONDITIONAL_TOKENS_ADDRESS: '0x4D97DCd97eC945f40cF65F87097ACe5EA0472604',
  USDC_ADDRESS: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
};

// 日志配置
export const LOG_CONFIG = {
  LOG_DIR: '/app/work/logs/bypass',
  LOG_FILE: 'trading.log',
  MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_LOG_FILES: 5,
};

// 时间配置
export const TIME_CONFIG = {
  PRICE_CHECK_INTERVAL: 1000,        // 价格检查间隔 1秒
  WEBSOCKET_RECONNECT_DELAY: 5000,   // WebSocket重连延迟
  ORDER_TIMEOUT: 10000,              // 订单超时 10秒
  MARKET_REFRESH_INTERVAL: 30000,    // 市场刷新间隔 30秒
};

// 从环境变量获取配置
export function getConfig(): StrategyConfig {
  return {
    ...DEFAULT_CONFIG,
    positionSize: process.env.POSITION_SIZE 
      ? parseFloat(process.env.POSITION_SIZE) 
      : DEFAULT_CONFIG.positionSize,
    maxExposure: process.env.MAX_EXPOSURE 
      ? parseFloat(process.env.MAX_EXPOSURE) 
      : DEFAULT_CONFIG.maxExposure,
    polymarketApiKey: process.env.POLYMARKET_API_KEY,
    polymarketApiSecret: process.env.POLYMARKET_API_SECRET,
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY,
  };
}

// 验证配置
export function validateConfig(config: StrategyConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (config.sumTarget <= 0 || config.sumTarget >= 1) {
    errors.push('sumTarget must be between 0 and 1');
  }
  
  if (config.movePct <= 0 || config.movePct >= 1) {
    errors.push('movePct must be between 0 and 1');
  }
  
  if (config.positionSize <= 0) {
    errors.push('positionSize must be greater than 0');
  }
  
  if (!config.polymarketApiKey && process.env.NODE_ENV === 'production') {
    errors.push('POLYMARKET_API_KEY is required in production');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
