import { NextResponse } from 'next/server';
import { getCLOBClient } from '@/lib/polymarket-clob';

/**
 * 获取持仓 API
 * GET /api/positions
 */
export async function GET() {
  try {
    const client = getCLOBClient();
    
    if (!client) {
      return NextResponse.json({
        success: false,
        error: '交易客户端未配置',
        data: { positions: [] },
      });
    }

    const positions = await client.getPositions();

    return NextResponse.json({
      success: true,
      data: {
        positions: positions || [],
        address: client.getAddress(),
      },
    });
  } catch (error) {
    console.error('Get positions error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取持仓失败',
      data: { positions: [] },
    });
  }
}
