'use client';

import { useState, useEffect, useCallback } from 'react';

interface CycleData {
  cycleId: string;
  remainingSeconds: number;
  progress: number;
}

interface Position {
  asset: string;
  side: string;
  size: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
}

interface LogEntry {
  id: string;
  timestamp: number;
  level: string;
  message: string;
}

interface MarketPrice {
  yes: number;
  no: number;
  lastUpdate: number;
}

export default function Home() {
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cycle, setCycle] = useState<CycleData | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [showSetBalance, setShowSetBalance] = useState(false);
  const [inputBalance, setInputBalance] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [marketPrice, setMarketPrice] = useState<MarketPrice>({ yes: 0.5, no: 0.5, lastUpdate: 0 });

  // 获取系统状态
  const fetchStatus = useCallback(async () => {
    const res = await fetch('/api/engine/status');
    const d = await res.json();
    if (d.success) {
      setRunning(d.data?.state?.isRunning || false);
    }
  }, []);

  // 获取周期信息
  const fetchCycle = useCallback(async () => {
    const res = await fetch('/api/cycle');
    const d = await res.json();
    if (d.success) setCycle(d.data.cycle);
  }, []);

  // 获取余额
  const fetchBalance = useCallback(async () => {
    const res = await fetch('/api/balance');
    const d = await res.json();
    if (d.success) setBalance(d.data.balance);
  }, []);

  // 获取持仓
  const fetchPositions = useCallback(async () => {
    const res = await fetch('/api/positions');
    const d = await res.json();
    if (d.success && d.data?.positions) {
      setPositions(d.data.positions);
    }
  }, []);

  // 启动/停止引擎
  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(running ? '/api/engine/stop' : '/api/engine/start', { method: 'POST' });
      const d = await res.json();
      if (d.success) setRunning(!running);
    } finally {
      setLoading(false);
    }
  };

  // 手动设置余额
  const setManualBalance = async () => {
    const value = parseFloat(inputBalance);
    if (isNaN(value)) return;
    await fetch('/api/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balance: value }),
    });
    setBalance(value);
    setShowSetBalance(false);
    setInputBalance('');
  };

  // 添加日志
  const addLog = (level: string, message: string) => {
    setLogs(prev => [{
      id: Date.now().toString(),
      timestamp: Date.now(),
      level,
      message,
    }, ...prev].slice(0, 50));
  };

  // 初始化
  useEffect(() => {
    fetchStatus();
    fetchBalance();
    fetchPositions();
    
    // 定时刷新
    const cycleInterval = setInterval(fetchCycle, 1000);
    const balanceInterval = setInterval(fetchBalance, 10000);
    const positionInterval = setInterval(fetchPositions, 30000);

    return () => {
      clearInterval(cycleInterval);
      clearInterval(balanceInterval);
      clearInterval(positionInterval);
    };
  }, [fetchStatus, fetchCycle, fetchBalance, fetchPositions]);

  // 模拟价格更新（实际应从 API 获取）
  useEffect(() => {
    if (!running) return;
    
    const priceInterval = setInterval(() => {
      // 模拟价格波动
      const random = Math.random() * 0.02 - 0.01;
      setMarketPrice(prev => ({
        yes: Math.max(0.01, Math.min(0.99, prev.yes + random)),
        no: Math.max(0.01, Math.min(0.99, prev.no - random)),
        lastUpdate: Date.now(),
      }));
    }, 1000);

    return () => clearInterval(priceInterval);
  }, [running]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTime2 = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString();
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      {/* 头部 */}
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 5, fontSize: 24 }}>比特币15分钟涨跌预测</h1>
        <p style={{ color: '#666', margin: 0 }}>实时监控 · 快速下跌对冲套利</p>
      </header>

      {/* 周期倒计时 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        color: 'white',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.9 }}>距离周期结束</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 36, fontWeight: 'bold', fontFamily: 'monospace' }}>
              {cycle ? formatTime(cycle.remainingSeconds) : '00:00'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.9 }}>周期进度</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 20, fontWeight: 'bold' }}>
              {cycle ? cycle.progress.toFixed(1) : 0}%
            </p>
          </div>
        </div>
        <div style={{ marginTop: 10, height: 6, background: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: cycle ? `${cycle.progress}%` : '0%', height: '100%', background: 'white', borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* 主要信息网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
        {/* 余额卡片 */}
        <div style={{ background: '#e8f5e9', padding: 15, borderRadius: 10, borderLeft: '4px solid #4caf50' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#388e3c' }}>Polymarket 余额</p>
              <p style={{ margin: '5px 0 0 0', fontSize: 24, fontWeight: 'bold', color: '#2e7d32' }}>
                {balance !== null ? balance.toFixed(2) : '...'} USDC
              </p>
            </div>
            <button onClick={() => setShowSetBalance(!showSetBalance)} style={{ padding: '6px 12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
              设置
            </button>
          </div>
          {showSetBalance && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <input type="number" value={inputBalance} onChange={e => setInputBalance(e.target.value)} placeholder="输入余额" style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
              <button onClick={setManualBalance} style={{ padding: '8px 16px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>保存</button>
            </div>
          )}
        </div>

        {/* 实时价格卡片 */}
        <div style={{ background: '#e3f2fd', padding: 15, borderRadius: 10, borderLeft: '4px solid #2196f3' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#1976d2' }}>实时价格</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <div>
              <span style={{ fontSize: 12, color: '#666' }}>YES:</span>
              <span style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 5, color: '#1976d2' }}>
                {marketPrice.yes.toFixed(4)}
              </span>
            </div>
            <div>
              <span style={{ fontSize: 12, color: '#666' }}>NO:</span>
              <span style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 5, color: '#d32f2f' }}>
                {marketPrice.no.toFixed(4)}
              </span>
            </div>
          </div>
          <p style={{ margin: '5px 0 0 0', fontSize: 10, color: '#888' }}>
            总和: {(marketPrice.yes + marketPrice.no).toFixed(4)}
            {(marketPrice.yes + marketPrice.no) <= 0.93 && (
              <span style={{ color: '#4caf50', marginLeft: 5 }}>✓ 对冲机会!</span>
            )}
          </p>
        </div>
      </div>

      {/* 系统状态和策略配置 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
        {/* 系统状态 */}
        <div style={{ background: 'white', padding: 15, borderRadius: 10, border: '1px solid #eee' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: 14 }}>系统状态</h3>
          <p style={{ margin: '0 0 10px 0' }}>
            状态: <span style={{ color: running ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
              {running ? '✓ 运行中' : '✗ 已停止'}
            </span>
          </p>
          <button onClick={toggle} disabled={loading} style={{
            width: '100%',
            padding: '10px 20px',
            background: running ? '#f44336' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? '处理中...' : running ? '停止引擎' : '启动引擎'}
          </button>
        </div>

        {/* 策略配置 */}
        <div style={{ background: 'white', padding: 15, borderRadius: 10, border: '1px solid #eee' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: 14 }}>策略配置</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
              <p style={{ margin: 0, fontSize: 10, color: '#888' }}>对冲阈值</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 14, fontWeight: 'bold' }}>0.93</p>
            </div>
            <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
              <p style={{ margin: 0, fontSize: 10, color: '#888' }}>下跌阈值</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 14, fontWeight: 'bold' }}>15% / 3秒</p>
            </div>
            <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
              <p style={{ margin: 0, fontSize: 10, color: '#888' }}>仓位大小</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 14, fontWeight: 'bold' }}>1 USDC</p>
            </div>
            <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
              <p style={{ margin: 0, fontSize: 10, color: '#888' }}>最大暴露</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 14, fontWeight: 'bold' }}>100 USDC</p>
            </div>
          </div>
        </div>
      </div>

      {/* 持仓和日志 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
        {/* 持仓 */}
        <div style={{ background: 'white', padding: 15, borderRadius: 10, border: '1px solid #eee' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: 14 }}>当前持仓</h3>
          {positions.length === 0 ? (
            <p style={{ color: '#888', fontSize: 12, margin: 0 }}>暂无持仓</p>
          ) : (
            <div style={{ maxHeight: 150, overflow: 'auto' }}>
              {positions.map((p, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                  <p style={{ margin: 0, fontSize: 12 }}>{p.asset} - {p.side}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: 10, color: '#666' }}>
                    数量: {p.size} | 价格: {p.avgPrice} | PnL: {p.pnl > 0 ? '+' : ''}{p.pnl.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 日志 */}
        <div style={{ background: 'white', padding: 15, borderRadius: 10, border: '1px solid #eee' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: 14 }}>交易日志</h3>
          {logs.length === 0 ? (
            <p style={{ color: '#888', fontSize: 12, margin: 0 }}>暂无日志</p>
          ) : (
            <div style={{ maxHeight: 150, overflow: 'auto', fontFamily: 'monospace', fontSize: 11 }}>
              {logs.map((log) => (
                <div key={log.id} style={{ padding: '4px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ color: '#888' }}>{formatTime2(log.timestamp)}</span>
                  <span style={{ 
                    marginLeft: 8, 
                    color: log.level === 'ERROR' ? '#f44336' : log.level === 'WARN' ? '#ff9800' : '#4caf50' 
                  }}>
                    [{log.level}]
                  </span>
                  <span style={{ marginLeft: 8 }}>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 策略说明 */}
      <div style={{ background: '#fff3e0', padding: 15, borderRadius: 10, marginTop: 15, borderLeft: '4px solid #ff9800' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#e65100', fontSize: 13 }}>策略说明</h4>
        <p style={{ margin: 0, fontSize: 12, color: '#bf360c' }}>
          当检测到 YES/NO 价格在 3 秒内下跌 ≥15% 时，自动买入下跌侧（Leg1）。
          当 Leg1 价格 + 另一侧价格 ≤ 0.93 时，买入另一侧（Leg2）完成对冲。
          理论利润 = 1 - 总价格 - 手续费。
        </p>
      </div>

      {/* 风险提示 */}
      <div style={{ background: '#ffebee', padding: 15, borderRadius: 10, marginTop: 10, borderLeft: '4px solid #f44336' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#c62828', fontSize: 13 }}>⚠️ 风险提示</h4>
        <p style={{ margin: 0, fontSize: 12, color: '#b71c1c' }}>
          自动交易存在风险，请确保您了解策略原理并控制好仓位。
          建议先用小额资金测试，确认策略正常后再增加仓位。
        </p>
      </div>
    </main>
  );
}
