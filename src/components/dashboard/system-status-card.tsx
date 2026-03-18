'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SystemState } from '@/types/trading';
import { Activity, TrendingUp, TrendingDown, Target, Clock } from 'lucide-react';

interface SystemStatusCardProps {
  state: SystemState | null;
}

export function SystemStatusCard({ state }: SystemStatusCardProps) {
  if (!state) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>系统状态</CardTitle>
          <CardDescription>加载中...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const winRate = state.totalRounds > 0 
    ? ((state.successfulRounds / state.totalRounds) * 100).toFixed(1) 
    : '0.0';

  const netProfit = state.totalProfit - state.totalLoss;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          系统状态
        </CardTitle>
        <CardDescription>
          最后更新：{new Date(state.lastUpdate).toLocaleString('zh-CN')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 总轮次 */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">总轮次</p>
            <p className="text-2xl font-bold">{state.totalRounds}</p>
          </div>
          
          {/* 成功轮次 */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">成功轮次</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-green-600">{state.successfulRounds}</p>
              <Badge variant="secondary">{winRate}%</Badge>
            </div>
          </div>
          
          {/* 失败轮次 */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">失败轮次</p>
            <p className="text-2xl font-bold text-red-600">{state.failedRounds}</p>
          </div>
          
          {/* 净利润 */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">净利润 (USDC)</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">
                {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)}
              </p>
              {netProfit >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
          {/* 总利润 */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">总利润</p>
            <p className="text-lg font-semibold text-green-600">
              +{state.totalProfit.toFixed(2)} USDC
            </p>
          </div>
          
          {/* 总亏损 */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">总亏损</p>
            <p className="text-lg font-semibold text-red-600">
              -{state.totalLoss.toFixed(2)} USDC
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
