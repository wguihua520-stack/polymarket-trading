import { NextRequest, NextResponse } from 'next/server';
import { getConfig, validateConfig } from '@/config/strategy';
import type { ApiResponse, StrategyConfig } from '@/types/trading';

/**
 * 获取当前配置
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ config: StrategyConfig; validation: { valid: boolean; errors: string[] } }>>> {
  try {
    const config = getConfig();
    const validation = validateConfig(config);
    
    // 隐藏敏感信息
    const safeConfig: StrategyConfig = {
      ...config,
      polymarketApiKey: config.polymarketApiKey ? '***' : undefined,
      polymarketApiSecret: config.polymarketApiSecret ? '***' : undefined,
      walletPrivateKey: config.walletPrivateKey ? '***' : undefined,
    };
    
    return NextResponse.json({
      success: true,
      data: { config: safeConfig, validation },
    });
  } catch (error) {
    console.error('Failed to get config:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
