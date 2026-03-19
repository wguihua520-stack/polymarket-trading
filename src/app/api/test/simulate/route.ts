import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, TradingRound, PriceData, DropSignal } from '@/types/trading';
import type { LogEntry } from '@/types/trading';
import * as fs from 'fs';
import * as path from 'path';

// 模拟市场数据
const mockMarketData = {
  marketId: 'test-market-bitcoin-15min',
  question: 'Will Bitcoin price increase in the next 15 minutes?',
  yesPrice: 0.48,
  noPrice: 0.52,
};

// 使用文件持久化状态
const STATE_FILE = '/tmp/test_simulation_state.json';

function loadState(): { round: TradingRound | null; logs: LogEntry[] } {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (error) {
    console.error('Failed to load state:', error);
  }
  return { round: null, logs: [] };
}

function saveState(round: TradingRound | null, logs: LogEntry[]): void {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ round, logs }));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

let cachedState = loadState();

function addLog(level: LogEntry['level'], category: string, message: string, data?: Record<string, unknown>) {
  const log: LogEntry = {
    id: `test_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    level,
    category,
    message,
    data,
  };
  cachedState.logs.unshift(log); // 新日志在前
  if (cachedState.logs.length > 100) cachedState.logs.pop();
  saveState(cachedState.round, cachedState.logs);
}

/**
 * 模拟测试API - 模拟快速下跌信号
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    cachedState = loadState(); // 每次请求时重新加载状态
    const body = await request.json();
    const { action } = body;

    if (action === 'start_round') {
      // 开始模拟轮次
      const now = Date.now();
      cachedState.round = {
        roundId: `test_round_${now}`,
        startTime: now,
        status: 'MONITORING',
        marketId: mockMarketData.marketId,
        monitoringWindowEnd: now + 3 * 60 * 1000, // 3分钟
        cycleEndTime: now + 15 * 60 * 1000, // 15分钟
      };

      addLog('INFO', 'TEST', '模拟轮次已开始', { roundId: cachedState.round.roundId });
      
      return NextResponse.json({
        success: true,
        data: { round: cachedState.round, message: '模拟轮次已开始，将在3秒后触发快速下跌信号' },
      });
    }

    if (action === 'trigger_drop') {
      // 模拟快速下跌
      if (!cachedState.round || cachedState.round.status !== 'MONITORING') {
        return NextResponse.json({
          success: false,
          error: '没有正在进行的监控轮次',
        }, { status: 400 });
      }

      // 模拟YES价格快速下跌
      const dropFrom = 0.48;
      const dropTo = 0.38; // 下跌约21%
      const dropPct = (dropFrom - dropTo) / dropFrom;

      addLog('INFO', 'TEST', '模拟快速下跌信号', {
        side: 'YES',
        dropPct: `${(dropPct * 100).toFixed(2)}%`,
        fromPrice: dropFrom,
        toPrice: dropTo,
      });

      // 执行Leg1
      const now = Date.now();
      cachedState.round.leg1 = {
        side: 'YES',
        price: dropTo,
        amount: 100,
        timestamp: now,
        triggerReason: `模拟测试：快速下跌 ${(dropPct * 100).toFixed(2)}%`,
        priceDrop: dropPct,
      };
      cachedState.round.leg1TriggerTime = now;
      cachedState.round.status = 'LEG1_EXECUTED';

      addLog('INFO', 'LEG1', 'Leg1执行成功（模拟）', {
        side: 'YES',
        price: dropTo,
        amount: 100,
      });

      return NextResponse.json({
        success: true,
        data: { 
          round: cachedState.round, 
          message: '快速下跌信号已触发，Leg1已执行',
          dropSignal: {
            side: 'YES',
            dropPct,
            fromPrice: dropFrom,
            toPrice: dropTo,
          }
        },
      });
    }

    if (action === 'trigger_hedge') {
      // 模拟满足对冲条件
      if (!cachedState.round || cachedState.round.status !== 'LEG1_EXECUTED') {
        return NextResponse.json({
          success: false,
          error: '没有待对冲的Leg1',
        }, { status: 400 });
      }

      // 模拟NO价格
      const noPrice = 0.50;
      const sumPrice = cachedState.round.leg1!.price + noPrice;

      if (sumPrice > 0.93) {
        return NextResponse.json({
          success: false,
          error: `不满足对冲条件：sumPrice=${sumPrice.toFixed(4)} > 0.93`,
        }, { status: 400 });
      }

      // 执行Leg2
      const now = Date.now();
      const fee = 100 * 0.0156; // 1.56% 手续费
      
      cachedState.round.leg2 = {
        side: 'NO',
        price: noPrice,
        amount: 100,
        timestamp: now,
        sumPrice,
        actualFee: fee,
      };
      cachedState.round.leg2TriggerTime = now;
      cachedState.round.endTime = now;
      cachedState.round.status = 'COMPLETED';

      const profit = (1 - sumPrice) * 100 - fee;

      addLog('INFO', 'LEG2', 'Leg2执行成功（模拟）', {
        side: 'NO',
        price: noPrice,
        sumPrice,
        fee,
      });

      addLog('INFO', 'ROUND', '轮次完成（模拟）', {
        profit: profit.toFixed(4),
        sumPrice,
      });

      return NextResponse.json({
        success: true,
        data: { 
          round: cachedState.round, 
          message: '对冲条件已满足，Leg2已执行',
          profit: {
            gross: (1 - sumPrice) * 100,
            fee,
            net: profit,
          }
        },
      });
    }

    if (action === 'get_round') {
      return NextResponse.json({
        success: true,
        data: { round: cachedState.round },
      });
    }

    if (action === 'get_logs') {
      return NextResponse.json({
        success: true,
        data: { logs: cachedState.logs },
      });
    }

    if (action === 'reset') {
      cachedState.round = null;
      cachedState.logs = [];
      saveState(null, []);
      return NextResponse.json({
        success: true,
        data: { message: '模拟测试已重置' },
      });
    }

    if (action === 'full_test') {
      // 一键完成完整测试流程
      const now = Date.now();
      
      // 开始轮次
      cachedState.round = {
        roundId: `test_round_${now}`,
        startTime: now,
        status: 'MONITORING',
        marketId: mockMarketData.marketId,
        monitoringWindowEnd: now + 3 * 60 * 1000,
        cycleEndTime: now + 15 * 60 * 1000,
      };
      addLog('INFO', 'TEST', '模拟轮次已开始', { roundId: cachedState.round.roundId });

      // 触发下跌
      const dropFrom = 0.48;
      const dropTo = 0.38;
      const dropPct = (dropFrom - dropTo) / dropFrom;
      
      cachedState.round.leg1 = {
        side: 'YES',
        price: dropTo,
        amount: 100,
        timestamp: now + 100,
        triggerReason: `模拟测试：快速下跌 ${(dropPct * 100).toFixed(2)}%`,
        priceDrop: dropPct,
      };
      cachedState.round.leg1TriggerTime = now + 100;
      cachedState.round.status = 'LEG1_EXECUTED';
      addLog('INFO', 'LEG1', 'Leg1执行成功（模拟）', { side: 'YES', price: dropTo, amount: 100 });

      // 执行对冲
      const noPrice = 0.50;
      const sumPrice = dropTo + noPrice;
      const fee = 100 * 0.0156;
      
      cachedState.round.leg2 = {
        side: 'NO',
        price: noPrice,
        amount: 100,
        timestamp: now + 200,
        sumPrice,
        actualFee: fee,
      };
      cachedState.round.leg2TriggerTime = now + 200;
      cachedState.round.endTime = now + 200;
      cachedState.round.status = 'COMPLETED';
      
      const profit = (1 - sumPrice) * 100 - fee;
      
      addLog('INFO', 'LEG2', 'Leg2执行成功（模拟）', { side: 'NO', price: noPrice, sumPrice, fee });
      addLog('INFO', 'ROUND', '轮次完成（模拟）', { profit: profit.toFixed(4), sumPrice });

      return NextResponse.json({
        success: true,
        data: { 
          round: cachedState.round,
          message: '完整测试流程已完成',
          summary: {
            status: 'COMPLETED',
            leg1: { side: 'YES', price: dropTo, dropPct: `${(dropPct * 100).toFixed(2)}%` },
            leg2: { side: 'NO', price: noPrice, sumPrice },
            profit: { gross: (1 - sumPrice) * 100, fee, net: profit },
          }
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: '未知操作',
    }, { status: 400 });

  } catch (error) {
    console.error('Test simulation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
