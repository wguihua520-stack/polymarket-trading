/**
 * Polymarket 配置和环境检测
 */

import { isConfigured as hasStoredCredentials } from './config-store';

// API 端点配置
export const POLYMARKET_CONFIG = {
  // CLOB API 基础URL
  CLOB_API_URL: 'https://clob.polymarket.com',
  
  // Polygon 主网 Chain ID
  CHAIN_ID: 137,
  
  // API 超时时间（毫秒）
  API_TIMEOUT: 10000,
  
  // 连接检测超时时间（毫秒）
  HEALTH_CHECK_TIMEOUT: 5000,
  
  // 比特币15分钟市场 Token ID（需要根据实际市场配置）
  // 这是示例值，实际使用时需要从市场数据中获取
  BTC_15MIN_TOKEN_IDS: {
    YES: '', // 需要配置实际的 token ID
    NO: '',  // 需要配置实际的 token ID
  },
  
  // 默认市场条件 ID（比特币涨跌预测市场）
  DEFAULT_CONDITION_ID: '', // 需要配置实际的条件 ID
};

/**
 * 检测 Polymarket API 是否可达
 */
export async function checkApiConnectivity(): Promise<{
  reachable: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), POLYMARKET_CONFIG.HEALTH_CHECK_TIMEOUT);
    
    const response = await fetch(`${POLYMARKET_CONFIG.CLOB_API_URL}/server_time`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const latency = Date.now() - startTime;
      return { reachable: true, latency };
    } else {
      return { 
        reachable: false, 
        error: `HTTP ${response.status}` 
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { 
      reachable: false, 
      error: errorMessage 
    };
  }
}

/**
 * 获取当前运行模式
 */
export type RunMode = 'simulation' | 'production';

let cachedMode: RunMode | null = null;
let lastModeCheck = 0;
const MODE_CACHE_TTL = 60000; // 1分钟缓存

// 强制模式（用户手动设置）
let forcedMode: RunMode | null = null;

/**
 * 强制设置运行模式
 */
export function setForcedMode(mode: RunMode | null): void {
  forcedMode = mode;
  cachedMode = null;
  lastModeCheck = 0;
}

/**
 * 获取强制模式
 */
export function getForcedMode(): RunMode | null {
  return forcedMode;
}

export async function getRunMode(): Promise<RunMode> {
  // 如果用户强制设置了模式，优先使用
  if (forcedMode) {
    return forcedMode;
  }
  
  const now = Date.now();
  
  // 使用缓存
  if (cachedMode && (now - lastModeCheck) < MODE_CACHE_TTL) {
    return cachedMode;
  }
  
  // 检测 API 连接
  const { reachable } = await checkApiConnectivity();
  
  // 检查凭证（环境变量或存储的凭证）
  const hasEnvCredentials = Boolean(
    process.env.WALLET_PRIVATE_KEY &&
    process.env.POLYMARKET_API_KEY &&
    process.env.POLYMARKET_API_SECRET
  );
  
  const hasStoredConfig = hasStoredCredentials();
  const hasCredentials = hasEnvCredentials || hasStoredConfig;
  
  // 如果配置了凭证，使用生产模式
  // 注意：即使 API 不可达（可能是网络限制），只要配置了凭证就认为是生产模式
  // 真实环境中部署后，API 调用会正常工作
  cachedMode = hasCredentials ? 'production' : 'simulation';
  lastModeCheck = now;
  
  return cachedMode;
}

/**
 * 强制刷新模式（用于测试）
 */
export function resetModeCache(): void {
  cachedMode = null;
  lastModeCheck = 0;
}

/**
 * 检查是否配置了交易凭证
 */
export function hasTradingCredentials(): boolean {
  const hasEnvCredentials = Boolean(
    process.env.WALLET_PRIVATE_KEY &&
    process.env.POLYMARKET_API_KEY &&
    process.env.POLYMARKET_API_SECRET
  );
  
  return hasEnvCredentials || hasStoredCredentials();
}

/**
 * 获取配置状态
 */
export function getConfigStatus(): {
  hasPrivateKey: boolean;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  isConfigured: boolean;
} {
  const hasPrivateKey = Boolean(process.env.WALLET_PRIVATE_KEY);
  const hasApiKey = Boolean(process.env.POLYMARKET_API_KEY);
  const hasApiSecret = Boolean(process.env.POLYMARKET_API_SECRET);
  
  const hasEnvConfig = hasPrivateKey && hasApiKey && hasApiSecret;
  const hasStoredConfig = hasStoredCredentials();
  
  return {
    hasPrivateKey,
    hasApiKey,
    hasApiSecret,
    isConfigured: hasEnvConfig || hasStoredConfig,
  };
}
