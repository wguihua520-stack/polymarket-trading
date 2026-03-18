'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SystemState, TradingRound, LogEntry } from '@/types/trading';
import { SystemStatusCard } from '@/components/dashboard/system-status-card';
import { RoundInfoCard } from '@/components/dashboard/round-info-card';
import { LogPanel } from '@/components/dashboard/log-panel';
import { ConfigPanel } from '@/components/dashboard/config-panel';
import { MarketsPanel } from '@/components/dashboard/markets-panel';
import { Play, Square, Settings, TrendingUp, Activity } from 'lucide-react';

export default function Dashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [currentRound, setCurrentRound] = useState<TradingRound | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'config' | 'markets'>('status');
  const [error, setError] = useState<string | null>(null);

  // 获取系统状态
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/engine/status');
      const data = await response.json();
      
      if (data.success) {
        setSystemState(data.data.state);
        setCurrentRound(data.data.currentRound);
        setLogs(data.data.recentLogs);
        setIsRunning(data.data.state.isRunning);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // 启动引擎
  const startEngine = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/engine/start', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setIsRunning(true);
        setSystemState(data.data.state);
        setError(null);
      } else {
        setError(data.error || 'Failed to start engine');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // 停止引擎
  const stopEngine = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/engine/stop', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setIsRunning(false);
        setSystemState(data.data.state);
        setError(null);
      } else {
        setError(data.error || 'Failed to stop engine');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // 定期刷新状态
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000); // 每2秒刷新一次
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      {/* 头部 */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Polymarket 快速下跌对冲套利
          </h1>
          <p className="text-muted-foreground mt-2">
            自动监控比特币15分钟市场，执行快速下跌对冲套利策略
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge 
            variant={isRunning ? "default" : "secondary"} 
            className="text-sm py-2 px-4"
          >
            <Activity className="h-4 w-4 mr-2" />
            {isRunning ? '运行中' : '已停止'}
          </Badge>
          
          <div className="flex gap-2">
            {!isRunning ? (
              <Button 
                onClick={startEngine} 
                disabled={isLoading}
                size="lg"
                className="gap-2"
              >
                <Play className="h-5 w-5" />
                启动引擎
              </Button>
            ) : (
              <Button 
                onClick={stopEngine} 
                disabled={isLoading}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <Square className="h-5 w-5" />
                停止引擎
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 错误提示 */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
          <strong>错误：</strong> {error}
        </div>
      )}

      {/* 标签页 */}
      <div className="flex gap-2 mb-6 border-b">
        <Button
          variant={activeTab === 'status' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('status')}
          className="rounded-b-none"
        >
          系统状态
        </Button>
        <Button
          variant={activeTab === 'logs' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('logs')}
          className="rounded-b-none"
        >
          实时日志
        </Button>
        <Button
          variant={activeTab === 'config' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('config')}
          className="rounded-b-none"
        >
          <Settings className="h-4 w-4 mr-2" />
          配置
        </Button>
        <Button
          variant={activeTab === 'markets' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('markets')}
          className="rounded-b-none"
        >
          市场列表
        </Button>
      </div>

      {/* 内容区域 */}
      {activeTab === 'status' && (
        <div className="grid gap-6">
          {/* 系统状态卡片 */}
          <SystemStatusCard state={systemState} />
          
          {/* 当前轮次信息 */}
          <RoundInfoCard round={currentRound} />
          
          {/* 策略说明 */}
          <Card>
            <CardHeader>
              <CardTitle>策略说明</CardTitle>
              <CardDescription>快速下跌对冲套利策略详解</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">核心参数</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>对冲阈值：0.93（Leg1 + Leg2 ≤ 0.93时触发）</li>
                  <li>下跌阈值：15%（3秒内下跌≥15%触发Leg1）</li>
                  <li>监控窗口：3分钟（每轮开始后前3分钟监控）</li>
                  <li>市场周期：15分钟（比特币15分钟市场）</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">执行流程</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>每轮开始时，启动3分钟倒计时监控</li>
                  <li>如果YES或NO价格在3秒内下跌≥15%，买入下跌侧（Leg1）</li>
                  <li>监控另一侧价格，当Leg1 + 另一侧价格 ≤ 0.93时，买入另一侧（Leg2）</li>
                  <li>完成对冲，锁定利润（理论利润 = 1 - sumPrice）</li>
                  <li>如果3分钟内无信号或无法对冲，放弃本轮，等待下一轮</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">风险控制</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>只交易高流动性市场（买卖价差&lt;5%）</li>
                  <li>Leg2为吃单操作，自动扣除约1.56%手续费</li>
                  <li>单市场最大暴露自动控制</li>
                  <li>使用Safe账户自托管，确保资金安全</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'logs' && (
        <LogPanel logs={logs} />
      )}

      {activeTab === 'config' && (
        <ConfigPanel />
      )}

      {activeTab === 'markets' && (
        <MarketsPanel />
      )}
    </div>
  );
}
