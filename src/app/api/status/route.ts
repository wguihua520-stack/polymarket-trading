import { NextResponse } from 'next/server';
import { getInitializedCLOBClient } from '@/lib/polymarket-clob';
import { getRunMode, checkApiConnectivity, getConfigStatus } from '@/lib/polymarket-config';

/**
 * 获取系统状态 API
 * GET /api/status
 */
export async function GET() {
  try {
    const mode = await getRunMode();
    const configStatus = getConfigStatus();
    
    // 检测 API 连接状态
    let connectivity = { reachable: false, latency: 0, error: '' };
    try {
      connectivity = await checkApiConnectivity() as any;
    } catch (e) {
      connectivity.error = e instanceof Error ? e.message : 'Unknown error';
    }

    // 获取客户端信息
    const client = await getInitializedCLOBClient();
    const address = client.getAddress();
    const clientMode = client.getMode();

    return NextResponse.json({
      success: true,
      data: {
        mode: clientMode,
        connectivity: {
          reachable: connectivity.reachable,
          latency: connectivity.latency,
          error: connectivity.error,
        },
        config: {
          hasPrivateKey: configStatus.hasPrivateKey,
          hasApiKey: configStatus.hasApiKey,
          hasApiSecret: configStatus.hasApiSecret,
          isConfigured: configStatus.isConfigured,
        },
        wallet: address ? {
          address,
          connected: true,
        } : {
          address: null,
          connected: false,
        },
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Status fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取状态失败',
    });
  }
}
