import { NextResponse } from 'next/server';
import {
  saveCredentials,
  clearCredentials,
  isConfigured,
  validateCredentials,
  type TradingCredentials,
} from '@/lib/config-store';

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

    return NextResponse.json({
      success: true,
      message: '凭证已保存',
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
  
  return NextResponse.json({
    success: true,
    message: '凭证已删除',
  });
}
