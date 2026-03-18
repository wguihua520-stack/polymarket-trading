'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TradingRound } from '@/types/trading';
import { Target, Clock, TrendingUp, AlertCircle, CheckCircle2, XCircle, Timer } from 'lucide-react';

interface RoundInfoCardProps {
  round: TradingRound | null;
}

const statusConfig = {
  IDLE: { label: '空闲', color: 'secondary', icon: Clock },
  MONITORING: { label: '监控中', color: 'default', icon: Target },
  LEG1_EXECUTED: { label: 'Leg1已执行', color: 'warning', icon: TrendingUp },
  COMPLETED: { label: '已完成', color: 'success', icon: CheckCircle2 },
  FAILED: { label: '失败', color: 'destructive', icon: XCircle },
  TIMEOUT: { label: '超时', color: 'destructive', icon: Timer },
};

export function RoundInfoCard({ round }: RoundInfoCardProps) {
  if (!round) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>当前轮次</CardTitle>
          <CardDescription>等待启动...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>尚未开始监控</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = statusConfig[round.status];
  const StatusIcon = status.icon;
  
  const now = Date.now();
  const timeToWindowEnd = Math.max(0, round.monitoringWindowEnd - now);
  const timeToCycleEnd = Math.max(0, round.cycleEndTime - now);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            当前轮次
          </CardTitle>
          <Badge variant={status.color as any} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
        <CardDescription>
          轮次ID：{round.roundId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 时间信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">开始时间</p>
            <p className="font-semibold">
              {new Date(round.startTime).toLocaleTimeString('zh-CN')}
            </p>
          </div>
          
          {round.status === 'MONITORING' && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">监控窗口剩余</p>
              <p className="font-semibold text-blue-600">
                {formatTime(timeToWindowEnd)}
              </p>
            </div>
          )}
          
          {(round.status === 'MONITORING' || round.status === 'LEG1_EXECUTED') && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">周期剩余</p>
              <p className="font-semibold">
                {formatTime(timeToCycleEnd)}
              </p>
            </div>
          )}
        </div>

        {/* Leg1 信息 */}
        {round.leg1 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Leg 1 - 首次买入
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">方向</p>
                <Badge variant="outline" className="mt-1">
                  {round.leg1.side}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">价格</p>
                <p className="font-semibold">{round.leg1.price.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">数量</p>
                <p className="font-semibold">{round.leg1.amount} USDC</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">下跌幅度</p>
                <p className="font-semibold text-red-600">
                  {(round.leg1.priceDrop * 100).toFixed(2)}%
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">触发时间</p>
                <p className="font-semibold">
                  {new Date(round.leg1.timestamp).toLocaleTimeString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Leg2 信息 */}
        {round.leg2 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Leg 2 - 对冲买入
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">方向</p>
                <Badge variant="outline" className="mt-1">
                  {round.leg2.side}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">价格</p>
                <p className="font-semibold">{round.leg2.price.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">数量</p>
                <p className="font-semibold">{round.leg2.amount} USDC</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">价格总和</p>
                <p className="font-semibold text-green-600">
                  {round.leg2.sumPrice.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">手续费</p>
                <p className="font-semibold text-orange-600">
                  {round.leg2.actualFee.toFixed(4)} USDC
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">触发时间</p>
                <p className="font-semibold">
                  {new Date(round.leg2.timestamp).toLocaleTimeString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 失败原因 */}
        {round.failReason && (
          <div className="border-t pt-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <p className="text-sm font-semibold text-red-600 mb-1">失败原因</p>
              <p className="text-sm text-muted-foreground">{round.failReason}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
