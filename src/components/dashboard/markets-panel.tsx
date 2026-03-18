'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MarketData } from '@/types/trading';
import { TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';

export function MarketsPanel() {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/markets');
      const data = await response.json();
      
      if (data.success) {
        setMarkets(data.data.markets);
      } else {
        setError(data.error || 'Failed to fetch markets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>市场列表</CardTitle>
          <CardDescription>加载中...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">市场列表</h2>
          <p className="text-muted-foreground">
            共找到 {markets.length} 个比特币15分钟市场
          </p>
        </div>
        <Button onClick={fetchMarkets} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          刷新
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          <strong>错误：</strong> {error}
        </div>
      )}

      {/* 市场列表 */}
      {markets.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>暂无合适的市场</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {markets.map((market) => (
            <Card key={market.marketId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{market.question}</CardTitle>
                    <CardDescription className="mt-2">
                      Market ID: {market.marketId}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={market.status === 'ACTIVE' ? 'default' : 'secondary'}
                  >
                    {market.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* YES价格 */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">YES价格</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold">{market.yesPrice.toFixed(4)}</span>
                      <span className="text-xs text-muted-foreground">
                        (买: {market.yesBestAsk.toFixed(4)})
                      </span>
                    </div>
                  </div>

                  {/* NO价格 */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">NO价格</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold">{market.noPrice.toFixed(4)}</span>
                      <span className="text-xs text-muted-foreground">
                        (买: {market.noBestAsk.toFixed(4)})
                      </span>
                    </div>
                  </div>

                  {/* 买卖价差 */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">买卖价差</p>
                    <Badge 
                      variant={market.spread < 0.05 ? "default" : "destructive"}
                      className="text-sm"
                    >
                      {(market.spread * 100).toFixed(2)}%
                    </Badge>
                  </div>

                  {/* 流动性 */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">流动性</p>
                    <p className="text-xl font-bold">
                      ${(market.liquidity / 1000000).toFixed(2)}M
                    </p>
                  </div>
                </div>

                {/* 适合交易提示 */}
                <div className="mt-4 pt-4 border-t">
                  {market.spread < 0.05 && market.status === 'ACTIVE' ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">适合交易（高流动性）</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {market.spread >= 0.05 ? '价差过大' : '市场不活跃'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
