import { NextResponse } from 'next/server';
import { getTradingEngine } from '@/lib/trading-engine';

/**
 * 获取周期信息 API
 * GET /api/cycle
 */
export async function GET() {
  try {
    const engine = getTradingEngine();
    const state = engine.getState();
    const currentRound = engine.getCurrentRound();
    
    // 如果没有运行中的轮次，返回默认周期
    if (!currentRound || !state.isRunning) {
      // 返回一个模拟周期用于显示
      const now = Date.now();
      const cycleDuration = 15 * 60 * 1000; // 15分钟
      
      // 计算当前时间在15分钟周期中的位置
      const cycleStart = Math.floor(now / cycleDuration) * cycleDuration;
      const cycleEnd = cycleStart + cycleDuration;
      const elapsed = now - cycleStart;
      const remaining = cycleEnd - now;
      const progress = (elapsed / cycleDuration) * 100;
      
      return NextResponse.json({
        success: true,
        data: {
          cycle: {
            cycleId: `cycle_${cycleStart}`,
            startTime: cycleStart,
            endTime: cycleEnd,
            remainingSeconds: Math.floor(remaining / 1000),
            progress,
            duration: 15 * 60, // 15分钟（秒）
            status: state.isRunning ? 'RUNNING' : 'IDLE',
          },
          isRunning: state.isRunning,
          currentRound: null,
        },
      });
    }

    // 计算当前轮次的剩余时间和进度
    const now = Date.now();
    const cycleEndTime = currentRound.cycleEndTime || (now + 15 * 60 * 1000);
    const cycleStartTime = currentRound.startTime;
    const cycleDuration = cycleEndTime - cycleStartTime;
    
    const elapsed = now - cycleStartTime;
    const remaining = Math.max(0, cycleEndTime - now);
    const progress = Math.min(100, (elapsed / cycleDuration) * 100);

    return NextResponse.json({
      success: true,
      data: {
        cycle: {
          cycleId: currentRound.roundId,
          startTime: cycleStartTime,
          endTime: cycleEndTime,
          remainingSeconds: Math.floor(remaining / 1000),
          progress,
          duration: Math.floor(cycleDuration / 1000),
          status: currentRound.status,
        },
        isRunning: state.isRunning,
        currentRound: {
          roundId: currentRound.roundId,
          status: currentRound.status,
          marketId: currentRound.marketId,
          hasLeg1: !!currentRound.leg1,
          hasLeg2: !!currentRound.leg2,
        },
      },
    });
  } catch (error) {
    console.error('Cycle fetch error:', error);
    
    // 出错时返回默认周期
    const now = Date.now();
    const cycleDuration = 15 * 60 * 1000;
    const cycleStart = Math.floor(now / cycleDuration) * cycleDuration;
    const cycleEnd = cycleStart + cycleDuration;
    const elapsed = now - cycleStart;
    const remaining = cycleEnd - now;
    const progress = (elapsed / cycleDuration) * 100;
    
    return NextResponse.json({
      success: true,
      data: {
        cycle: {
          cycleId: `cycle_${cycleStart}`,
          startTime: cycleStart,
          endTime: cycleEnd,
          remainingSeconds: Math.floor(remaining / 1000),
          progress,
          duration: 15 * 60,
          status: 'IDLE',
        },
        isRunning: false,
        currentRound: null,
      },
    });
  }
}
