import { NextResponse } from 'next/server';
import { getCLOBClient } from '@/lib/polymarket-clob';

// 内存存储手动设置的余额
let manualBalance = 0;

/**
 * 获取余额 API
 * GET /api/balance
 */
export async function GET() {
  try {
    const client = getCLOBClient();
    
    if (!client) {
      // 如果客户端未配置，返回手动设置的余额
      return NextResponse.json({
        success: true,
        data: {
          balance: manualBalance,
          available: manualBalance,
          symbol: 'USDC',
          address: null,
          source: manualBalance > 0 ? 'manual' : 'unconfigured',
          note: manualBalance > 0 ? '手动设置的余额' : '请配置 API Key 和私钥',
        },
      });
    }

    // 尝试从 API 获取余额
    const balance = await client.getBalance();

    if (balance.balance > 0) {
      return NextResponse.json({
        success: true,
        data: {
          ...balance,
          symbol: 'USDC',
          address: client.getAddress(),
          source: 'api',
        },
      });
    }

    // 如果 API 返回 0，使用手动设置的余额
    return NextResponse.json({
      success: true,
      data: {
        balance: manualBalance || balance.balance,
        available: manualBalance || balance.available,
        symbol: 'USDC',
        address: client.getAddress(),
        source: manualBalance > 0 ? 'manual' : 'api',
        note: manualBalance > 0 ? '手动设置的余额（API返回0）' : undefined,
      },
    });
  } catch (error) {
    console.error('Balance fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '查询失败',
      data: { balance: manualBalance, available: manualBalance, symbol: 'USDC' },
    });
  }
}

/**
 * 手动设置余额 API
 * POST /api/balance
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    manualBalance = parseFloat(body.balance) || 0;

    return NextResponse.json({
      success: true,
      data: {
        balance: manualBalance,
        available: manualBalance,
        symbol: 'USDC',
        note: '余额已更新',
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '设置失败',
    });
  }
}
