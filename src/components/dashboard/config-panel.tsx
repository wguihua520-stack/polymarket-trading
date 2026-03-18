'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StrategyConfig } from '@/types/trading';
import { Settings, AlertCircle, CheckCircle } from 'lucide-react';

export function ConfigPanel() {
  const [config, setConfig] = useState<StrategyConfig | null>(null);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.data.config);
        setValidation(data.data.validation);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>配置信息</CardTitle>
          <CardDescription>加载中...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>配置信息</CardTitle>
          <CardDescription>无法加载配置</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {/* 配置验证 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            配置验证
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validation?.valid ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>配置有效</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>配置存在问题</span>
              </div>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {validation?.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 核心参数 */}
      <Card>
        <CardHeader>
          <CardTitle>核心参数</CardTitle>
          <CardDescription>策略核心参数设置</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">对冲阈值</p>
              <p className="text-xl font-bold">{config.sumTarget}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">下跌阈值</p>
              <p className="text-xl font-bold">{(config.movePct * 100).toFixed(0)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">监控窗口</p>
              <p className="text-xl font-bold">{config.windowMin} 分钟</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">市场周期</p>
              <p className="text-xl font-bold">{config.marketDuration} 分钟</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 仓位设置 */}
      <Card>
        <CardHeader>
          <CardTitle>仓位设置</CardTitle>
          <CardDescription>交易仓位和风险控制</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">每次交易金额</p>
              <p className="text-xl font-bold">{config.positionSize} USDC</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">最大买卖价差</p>
              <p className="text-xl font-bold">{(config.maxSpread * 100).toFixed(0)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">单市场最大暴露</p>
              <p className="text-xl font-bold">{config.maxExposure} USDC</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 市场筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>市场筛选</CardTitle>
          <CardDescription>目标市场配置</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">目标市场</p>
              <p className="font-semibold">{config.targetMarket}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API配置 */}
      <Card>
        <CardHeader>
          <CardTitle>API配置</CardTitle>
          <CardDescription>Polymarket API密钥状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Key</span>
              <Badge variant={config.polymarketApiKey ? "default" : "secondary"}>
                {config.polymarketApiKey ? '已配置' : '未配置'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Secret</span>
              <Badge variant={config.polymarketApiSecret ? "default" : "secondary"}>
                {config.polymarketApiSecret ? '已配置' : '未配置'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">钱包私钥</span>
              <Badge variant={config.walletPrivateKey ? "default" : "secondary"}>
                {config.walletPrivateKey ? '已配置' : '未配置'}
              </Badge>
            </div>
          </div>
          
          {(!config.polymarketApiKey || !config.polymarketApiSecret || !config.walletPrivateKey) && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>提示：</strong> 请在环境变量中配置以下参数：
              </p>
              <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                <li>POLYMARKET_API_KEY</li>
                <li>POLYMARKET_API_SECRET</li>
                <li>WALLET_PRIVATE_KEY</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
