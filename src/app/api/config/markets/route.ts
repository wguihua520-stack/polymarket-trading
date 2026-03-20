import { NextResponse } from 'next/server';
import {
  getMarkets,
  addMarket,
  removeMarket,
  type MarketConfig,
} from '@/lib/config-store';

/**
 * 获取市场列表
 * GET /api/config/markets
 */
export async function GET() {
  const markets = getMarkets();
  
  return NextResponse.json({
    success: true,
    data: markets,
  });
}

/**
 * 添加市场
 * POST /api/config/markets
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { marketId, conditionId, question, yesTokenId, noTokenId, enabled } = body;

    if (!marketId || !conditionId || !yesTokenId || !noTokenId) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }

    const market: MarketConfig = {
      marketId,
      conditionId,
      question: question || '',
      yesTokenId,
      noTokenId,
      enabled: enabled !== false,
    };

    addMarket(market);

    return NextResponse.json({
      success: true,
      data: market,
      message: '市场已添加',
    });
  } catch (error) {
    console.error('Add market error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '添加失败',
    }, { status: 500 });
  }
}

/**
 * 删除市场
 * DELETE /api/config/markets?marketId=xxx
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const marketId = searchParams.get('marketId');

  if (!marketId) {
    return NextResponse.json({
      success: false,
      error: '缺少 marketId 参数',
    }, { status: 400 });
  }

  removeMarket(marketId);

  return NextResponse.json({
    success: true,
    message: '市场已删除',
  });
}
