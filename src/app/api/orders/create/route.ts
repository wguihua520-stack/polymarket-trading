import { NextResponse } from 'next/server';
import { getInitializedCLOBClient } from '@/lib/polymarket-clob';

/**
 * 创建订单 API
 * POST /api/orders/create
 */
export async function POST(request: Request) {
  try {
    const client = await getInitializedCLOBClient();
    const mode = client.getMode();

    const body = await request.json();
    const { tokenId, side, price, size } = body;

    // 参数验证
    if (!tokenId || !side || !price || !size) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数：tokenId, side, price, size',
      }, { status: 400 });
    }

    if (side !== 'BUY' && side !== 'SELL') {
      return NextResponse.json({
        success: false,
        error: 'side 必须是 BUY 或 SELL',
      }, { status: 400 });
    }

    if (price <= 0 || price >= 1) {
      return NextResponse.json({
        success: false,
        error: '价格必须在 0 到 1 之间',
      }, { status: 400 });
    }

    // 创建订单
    const result = await client.createOrder({
      tokenId,
      side,
      price,
      size,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          orderId: result.orderId,
          message: mode === 'simulation' 
            ? '模拟订单创建成功' 
            : '订单创建成功',
        },
        mode,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || '订单创建失败',
        mode,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
