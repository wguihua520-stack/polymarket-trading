import { NextResponse } from 'next/server';
import {
  saveCredentials,
  clearCredentials,
  isConfigured,
  validateCredentials,
  type TradingCredentials,
} from '@/lib/config-store';
import { resetModeCache, setForcedMode } from '@/lib/polymarket-config';
import { resetCLOBClient } from '@/lib/polymarket-clob';

/**
 * 获取凭证状态
 * GET /api/config/credentials
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      isConfigured: isConfigured(),
      // 不返回实际凭证，只返回状态
    },
  });
}

/**
 * 保存凭证
 * POST /api/config/credentials
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletPrivateKey, polymarketApiKey, polymarketApiSecret, polymarketPassphrase } = body;

    // 验证凭证
    const validation = validateCredentials({
      walletPrivateKey,
      polymarketApiKey,
      polymarketApiSecret,
    });

    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        errors: validation.errors,
      }, { status: 400 });
    }

    // 保存凭证
    const credentials: TradingCredentials = {
      walletPrivateKey: walletPrivateKey.replace(/^0x/, ''),
      polymarketApiKey,
      polymarketApiSecret,
      polymarketPassphrase,
    };

    saveCredentials(credentials);
    
    // 重置缓存，让系统重新检测模式
    resetModeCache();
    resetCLOBClient();
    // 设置为生产模式
    setForcedMode('production');

    return NextResponse.json({
      success: true,
      message: '凭证已保存，已切换到生产模式',
    });
  } catch (error) {
    console.error('Save credentials error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '保存失败',
    }, { status: 500 });
  }
}

/**
 * 删除凭证
 * DELETE /api/config/credentials
 */
export async function DELETE() {
  clearCredentials();
  
  // 重置缓存，切换回模拟模式
  resetModeCache();
  resetCLOBClient();
  setForcedMode(null);
  
  return NextResponse.json({
    success: true,
    message: '凭证已删除',
  });
}
