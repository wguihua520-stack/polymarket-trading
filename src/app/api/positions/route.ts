import { NextResponse } from 'next/server';
import { getInitializedCLOBClient } from '@/lib/polymarket-clob';

/**
 * 获取持仓 API
 * GET /api/positions
 */
export async function GET() {
  try {
    const client = await getInitializedCLOBClient();
    const positions = await client.getPositions();
    const mode = client.getMode();

    return NextResponse.json({
      success: true,
      data: {
        positions: positions || [],
        address: client.getAddress(),
        mode,
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
