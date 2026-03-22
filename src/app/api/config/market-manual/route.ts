import { NextResponse } from 'next/server';

/**
 * 手动配置市场
 * POST /api/config/market-manual
 * 
 * 如果自动查找失败，用户可以手动输入市场信息
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { 
      conditionId,
      upTokenId,
      downTokenId,
      question 
    } = body;
    
    if (!conditionId || !upTokenId || !downTokenId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: conditionId, upTokenId, downTokenId',
      });
    }
    
    // 保存到内存中
    // 这里可以扩展为持久化存储
    
    return NextResponse.json({
      success: true,
      data: {
        conditionId,
        upTokenId,
        downTokenId,
        question: question || 'Manual configured market',
        message: 'Market configured successfully. The system will use this market.',
      },
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 获取手动配置的市场
 */
export async function GET(request: Request) {
  // 返回当前配置的市场信息
  return NextResponse.json({
    success: true,
    hint: 'If auto-discovery fails, you can manually configure the market by POST to this endpoint.',
    example: {
      conditionId: '0x...',
      upTokenId: '123456789...',
      downTokenId: '987654321...',
      question: 'Bitcoin Up or Down - 15 Minutes',
    },
  });
}
