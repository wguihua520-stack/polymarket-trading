/**
 * 配置存储管理
 * 支持加密存储敏感信息
 */

import crypto from 'crypto';

// 配置项定义
export interface TradingCredentials {
  walletPrivateKey: string;
  polymarketApiKey: string;
  polymarketApiSecret: string;
  polymarketPassphrase?: string;
}

export interface StrategyParameters {
  sumTarget: number;         // 对冲阈值
  movePct: number;           // 下跌阈值
  windowMin: number;         // 监控窗口（分钟）
  positionSize: number;      // 仓位大小（USDC）
  maxExposure: number;       // 最大暴露（USDC）
  maxSpread: number;         // 最大价差
}

export interface MarketConfig {
  marketId: string;
  conditionId: string;
  question: string;
  yesTokenId: string;  // UP token ID
  noTokenId: string;   // DOWN token ID
  upTokenId?: string;  // 显式的 UP token ID
  downTokenId?: string; // 显式的 DOWN token ID
  enabled: boolean;
}

export interface AppConfig {
  credentials: TradingCredentials | null;
  strategy: StrategyParameters;
  markets: MarketConfig[];
  isConfigured: boolean;
}

// 默认策略参数
const DEFAULT_STRATEGY: StrategyParameters = {
  sumTarget: 0.93,
  movePct: 0.15,
  windowMin: 3,
  positionSize: 1,        // 1 USDC
  maxExposure: 100,       // 100 USDC
  maxSpread: 0.05,
};

// 内存存储
let storedConfig: AppConfig = {
  credentials: null,
  strategy: { ...DEFAULT_STRATEGY },
  markets: [],
  isConfigured: false,
};

// 加密密钥（用于加密敏感信息）
const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY || 'polymarket-trading-default-key';

/**
 * 加密文本
 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * 解密文本
 */
function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * 保存凭证
 */
export function saveCredentials(credentials: TradingCredentials): void {
  storedConfig.credentials = {
    walletPrivateKey: encrypt(credentials.walletPrivateKey),
    polymarketApiKey: encrypt(credentials.polymarketApiKey),
    polymarketApiSecret: encrypt(credentials.polymarketApiSecret),
    polymarketPassphrase: credentials.polymarketPassphrase 
      ? encrypt(credentials.polymarketPassphrase) 
      : undefined,
  };
  storedConfig.isConfigured = true;
}

/**
 * 获取凭证
 */
export function getCredentials(): TradingCredentials | null {
  if (!storedConfig.credentials) {
    return null;
  }
  
  try {
    return {
      walletPrivateKey: decrypt(storedConfig.credentials.walletPrivateKey),
      polymarketApiKey: decrypt(storedConfig.credentials.polymarketApiKey),
      polymarketApiSecret: decrypt(storedConfig.credentials.polymarketApiSecret),
      polymarketPassphrase: storedConfig.credentials.polymarketPassphrase 
        ? decrypt(storedConfig.credentials.polymarketPassphrase) 
        : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * 清除凭证
 */
export function clearCredentials(): void {
  storedConfig.credentials = null;
  storedConfig.isConfigured = false;
}

/**
 * 更新策略参数
 */
export function updateStrategy(params: Partial<StrategyParameters>): StrategyParameters {
  storedConfig.strategy = {
    ...storedConfig.strategy,
    ...params,
  };
  return storedConfig.strategy;
}

/**
 * 获取策略参数
 */
export function getStrategy(): StrategyParameters {
  return { ...storedConfig.strategy };
}

/**
 * 添加市场配置
 */
export function addMarket(market: MarketConfig): void {
  const existing = storedConfig.markets.findIndex(m => m.marketId === market.marketId);
  if (existing >= 0) {
    storedConfig.markets[existing] = market;
  } else {
    storedConfig.markets.push(market);
  }
}

/**
 * 移除市场配置
 */
export function removeMarket(marketId: string): void {
  storedConfig.markets = storedConfig.markets.filter(m => m.marketId !== marketId);
}

/**
 * 获取市场配置
 */
export function getMarkets(): MarketConfig[] {
  return [...storedConfig.markets];
}

/**
 * 获取启用的市场
 */
export function getEnabledMarkets(): MarketConfig[] {
  return storedConfig.markets.filter(m => m.enabled);
}

/**
 * 获取完整配置
 */
export function getFullConfig(): AppConfig {
  return {
    ...storedConfig,
    credentials: storedConfig.credentials ? {
      walletPrivateKey: '***ENCRYPTED***',
      polymarketApiKey: '***ENCRYPTED***',
      polymarketApiSecret: '***ENCRYPTED***',
    } : null,
  };
}

/**
 * 检查是否已配置
 */
export function isConfigured(): boolean {
  return storedConfig.isConfigured && storedConfig.credentials !== null;
}

/**
 * 验证凭证格式
 */
export function validateCredentials(credentials: Partial<TradingCredentials>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (credentials.walletPrivateKey) {
    const key = credentials.walletPrivateKey.replace(/^0x/, '');
    if (!/^[a-fA-F0-9]{64}$/.test(key)) {
      errors.push('钱包私钥格式无效（应为64位十六进制字符）');
    }
  } else {
    errors.push('请输入钱包私钥');
  }

  if (!credentials.polymarketApiKey) {
    errors.push('请输入 Polymarket API Key');
  }

  if (!credentials.polymarketApiSecret) {
    errors.push('请输入 Polymarket API Secret');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 验证策略参数
 */
export function validateStrategy(params: Partial<StrategyParameters>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (params.sumTarget !== undefined) {
    if (params.sumTarget <= 0 || params.sumTarget >= 1) {
      errors.push('对冲阈值必须在 0 到 1 之间');
    }
  }

  if (params.movePct !== undefined) {
    if (params.movePct <= 0 || params.movePct >= 1) {
      errors.push('下跌阈值必须在 0 到 1 之间');
    }
  }

  if (params.positionSize !== undefined) {
    if (params.positionSize <= 0) {
      errors.push('仓位大小必须大于 0');
    }
  }

  if (params.maxExposure !== undefined) {
    if (params.maxExposure <= 0) {
      errors.push('最大暴露必须大于 0');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
