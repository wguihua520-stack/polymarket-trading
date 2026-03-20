import { NextResponse } from 'next/server';
import {
  getStrategy,
  updateStrategy,
  validateStrategy,
  type StrategyParameters,
} from '@/lib/config-store';

/**
 * 获取策略参数
 * GET /api/config/strategy
 */
export async function GET() {
  const strategy = getStrategy();
  
  return NextResponse.json({
    success: true,
    data: strategy,
  });
}

/**
 * 更新策略参数
 * PUT /api/config/strategy
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // 验证参数
    const validation = validateStrategy(body);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        errors: validation.errors,
      }, { status: 400 });
    }

    // 更新策略
    const updated = updateStrategy(body);

    return NextResponse.json({
      success: true,
      data: updated,
      message: '策略参数已更新',
    });
  } catch (error) {
    console.error('Update strategy error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '更新失败',
    }, { status: 500 });
  }
}
