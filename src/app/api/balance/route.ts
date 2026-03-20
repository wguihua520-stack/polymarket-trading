import { NextResponse } from 'next/server';
import { getInitializedCLOBClient, getCLOBClient } from '@/lib/polymarket-clob';
import { getRunMode, getConfigStatus } from '@/lib/polymarket-config';

// 内存存储手动设置的余额
let manualBalance = 0;

/**
 * 获取余额 API
 * GET /api/balance
 */
export async function GET() {
  try {
    const mode = await getRunMode();
    const configStatus = getConfigStatus();
    
    // 如果未配置凭证，返回手动设置的余额
    if (!configStatus.isConfigured) {
      return NextResponse.json({
        success: true,
        data: {
          balance: manualBalance,
          available: manualBalance,
          symbol: 'USDC',
          address: null,
          source: manualBalance > 0 ? 'manual' : 'unconfigured',
          mode,
          configStatus,
          note: manualBalance > 0 ? '手动设置的余额' : '请配置 API Key 和私钥',
        },
      });
    }

    // 使用 CLOB 客户端获取余额
    const client = await getInitializedCLOBClient();
    const balance = await client.getBalance();
    const address = client.getAddress();
    const clientMode = client.getMode();

    // 如果是模拟模式或余额为0，使用手动设置的余额
    const effectiveBalance = clientMode === 'simulation' && manualBalance > 0 
      ? manualBalance 
      : balance.balance;

    return NextResponse.json({
      success: true,
      data: {
        balance: effectiveBalance,
        available: effectiveBalance,
        symbol: 'USDC',
        address,
        source: clientMode === 'simulation' 
          ? (manualBalance > 0 ? 'manual' : 'simulation') 
          : 'api',
        mode: clientMode,
        configStatus,
      },
    });
  } catch (error) {
    console.error('Balance fetch error:', error);
    
    // 出错时返回手动余额
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '查询失败',
      data: { 
        balance: manualBalance, 
        available: manualBalance, 
        symbol: 'USDC',
        source: manualBalance > 0 ? 'manual' : 'error',
      },
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
    
    // 同时更新模拟客户端的余额
    const client = getCLOBClient();
    if (client.getMode() === 'simulation') {
      client.setSimulatedBalance(manualBalance);
    }

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
