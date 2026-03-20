'use client';

import { useState, useEffect, useCallback } from 'react';
import ConfigWizard from '@/components/ConfigWizard';

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
  total: number;
  lastUpdate: number;
  arbitrage: {
    opportunity: boolean;
    profit?: number;
    profitPercent?: string;
  };
}

interface SystemStatus {
  mode: 'simulation' | 'production';
  connectivity: {
    reachable: boolean;
    latency?: number;
    error?: string;
  };
  config: {
    hasPrivateKey: boolean;
    hasApiKey: boolean;
    hasApiSecret: boolean;
    isConfigured: boolean;
  };
  wallet: {
    address: string | null;
    connected: boolean;
  };
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
  const [marketPrice, setMarketPrice] = useState<MarketPrice>({ 
    yes: 0.5, 
    no: 0.5, 
    total: 1, 
    lastUpdate: 0,
    arbitrage: { opportunity: false }
  });
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [showConfigWizard, setShowConfigWizard] = useState(false);

  // 获取系统状态
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const d = await res.json();
      if (d.success) {
        setSystemStatus(d.data);
      }
    } catch (e) {
      console.error('Failed to fetch status:', e);
    }
  }, []);

  // 获取引擎状态
  const fetchEngineStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/engine/status');
      const d = await res.json();
      if (d.success) {
        setRunning(d.data?.state?.isRunning || false);
      }
    } catch (e) {
      console.error('Failed to fetch engine status:', e);
    }
  }, []);

  // 获取周期信息
  const fetchCycle = useCallback(async () => {
    try {
      const res = await fetch('/api/cycle');
      const d = await res.json();
      if (d.success) setCycle(d.data.cycle);
    } catch (e) {
      console.error('Failed to fetch cycle:', e);
    }
  }, []);

  // 获取余额
  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/balance');
      const d = await res.json();
      if (d.success) setBalance(d.data.balance);
    } catch (e) {
      console.error('Failed to fetch balance:', e);
    }
  }, []);

  // 获取持仓
  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/positions');
      const d = await res.json();
      if (d.success && d.data?.positions) {
        setPositions(d.data.positions);
      }
    } catch (e) {
      console.error('Failed to fetch positions:', e);
    }
  }, []);

  // 获取价格
  const fetchPrice = useCallback(async () => {
    setPriceLoading(true);
    try {
      const res = await fetch('/api/price');
      const d = await res.json();
      if (d.success) {
        setMarketPrice({
          yes: d.data.yes,
          no: d.data.no,
          total: d.data.total,
          lastUpdate: Date.now(),
          arbitrage: d.data.arbitrage,
        });
        
        // 如果检测到套利机会，添加日志
        if (d.data.arbitrage.opportunity) {
          addLog('INFO', `套利机会检测: YES=${d.data.yes.toFixed(4)}, NO=${d.data.no.toFixed(4)}, 利润=${d.data.arbitrage.profitPercent}%`);
        }
      }
    } catch (e) {
      console.error('Failed to fetch price:', e);
    } finally {
      setPriceLoading(false);
    }
  }, []);

  // 启动/停止引擎
  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(running ? '/api/engine/stop' : '/api/engine/start', { method: 'POST' });
      const d = await res.json();
      if (d.success) {
        setRunning(!running);
        addLog('INFO', running ? '引擎已停止' : '引擎已启动');
      }
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
    addLog('INFO', `余额已设置为 ${value} USDC`);
  };

  // 添加日志
  const addLog = (level: string, message: string) => {
    setLogs(prev => [{
      id: Date.now().toString(),
      timestamp: Date.now(),
      level,
      message,
    }, ...prev].slice(0, 100));
  };

  // 初始化
  useEffect(() => {
    fetchStatus();
    fetchEngineStatus();
    fetchBalance();
    fetchPositions();
    fetchPrice();
    
    // 定时刷新
    const cycleInterval = setInterval(fetchCycle, 1000);
    const balanceInterval = setInterval(fetchBalance, 10000);
    const positionInterval = setInterval(fetchPositions, 30000);
    const statusInterval = setInterval(fetchStatus, 60000);
    const priceInterval = setInterval(fetchPrice, 2000);

    return () => {
      clearInterval(cycleInterval);
      clearInterval(balanceInterval);
      clearInterval(positionInterval);
      clearInterval(statusInterval);
      clearInterval(priceInterval);
    };
  }, [fetchStatus, fetchEngineStatus, fetchCycle, fetchBalance, fetchPositions, fetchPrice]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTime2 = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString();
  };

  const getModeColor = (mode: string) => {
    return mode === 'production' ? '#4caf50' : '#ff9800';
  };

  const getModeLabel = (mode: string) => {
    return mode === 'production' ? '生产模式' : '模拟模式';
  };

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      {/* 头部 */}
      <header style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ marginBottom: 5, fontSize: 24 }}>比特币15分钟涨跌预测</h1>
          <p style={{ color: '#666', margin: 0 }}>实时监控 · 快速下跌对冲套利</p>
        </div>
        <button 
          onClick={() => setShowConfigWizard(true)}
          style={{
            padding: '8px 16px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ⚙️ 配置
        </button>
      </header>

      {/* 系统状态卡片 */}
      <div style={{
        background: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        border: '1px solid #e9ecef',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div>
              <span style={{ fontSize: 12, color: '#888' }}>运行模式</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: systemStatus ? getModeColor(systemStatus.mode) : '#ccc',
                }} />
                <span style={{ fontWeight: 'bold', color: systemStatus ? getModeColor(systemStatus.mode) : '#666' }}>
                  {systemStatus ? getModeLabel(systemStatus.mode) : '检测中...'}
                </span>
              </div>
            </div>
            
            <div>
              <span style={{ fontSize: 12, color: '#888' }}>API 连接</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: systemStatus?.connectivity?.reachable ? '#4caf50' : '#f44336',
                }} />
                <span style={{ color: systemStatus?.connectivity?.reachable ? '#4caf50' : '#f44336' }}>
                  {systemStatus?.connectivity?.reachable 
                    ? `已连接 (${systemStatus.connectivity.latency}ms)` 
                    : '未连接'}
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: 12, color: '#888' }}>钱包状态</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: systemStatus?.wallet?.connected ? '#4caf50' : '#ff9800',
                }} />
                <span style={{ color: systemStatus?.wallet?.connected ? '#4caf50' : '#ff9800' }}>
                  {systemStatus?.wallet?.connected ? '已连接' : '未配置'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {systemStatus?.mode === 'simulation' && (
              <span style={{
                padding: '4px 8px',
                background: '#fff3e0',
                borderRadius: 4,
                fontSize: 11,
                color: '#e65100',
              }}>
                ⚠️ 模拟模式 - 无真实交易
              </span>
            )}
            {systemStatus?.mode === 'production' && (
              <span style={{
                padding: '4px 8px',
                background: '#e8f5e9',
                borderRadius: 4,
                fontSize: 11,
                color: '#2e7d32',
              }}>
                ✓ 生产模式 - 真实交易
              </span>
            )}
          </div>
        </div>
      </div>

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
              {systemStatus?.mode === 'simulation' && (
                <p style={{ margin: '2px 0 0 0', fontSize: 10, color: '#888' }}>模拟余额</p>
              )}
            </div>
            <button 
              onClick={() => setShowSetBalance(!showSetBalance)} 
              style={{ 
                padding: '6px 12px', 
                background: '#4caf50', 
                color: 'white', 
                border: 'none', 
                borderRadius: 4, 
                cursor: 'pointer', 
                fontSize: 12 
              }}
            >
              设置
            </button>
          </div>
          {showSetBalance && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <input 
                type="number" 
                value={inputBalance} 
                onChange={e => setInputBalance(e.target.value)} 
                placeholder="输入余额" 
                style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }} 
              />
              <button 
                onClick={setManualBalance} 
                style={{ padding: '8px 16px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                保存
              </button>
            </div>
          )}
        </div>

        {/* 实时价格卡片 */}
        <div style={{ background: marketPrice.arbitrage.opportunity ? '#fff8e1' : '#e3f2fd', padding: 15, borderRadius: 10, borderLeft: `4px solid ${marketPrice.arbitrage.opportunity ? '#ffc107' : '#2196f3'}` }}>
          <p style={{ margin: 0, fontSize: 12, color: marketPrice.arbitrage.opportunity ? '#ff8f00' : '#1976d2' }}>
            实时价格 {priceLoading && <span style={{ fontSize: 10 }}>(刷新中...)</span>}
          </p>
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
            总和: {marketPrice.total.toFixed(4)}
            {marketPrice.arbitrage.opportunity && (
              <span style={{ color: '#4caf50', marginLeft: 5, fontWeight: 'bold' }}>
                ✓ 对冲机会! 利润: {marketPrice.arbitrage.profitPercent}%
              </span>
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
          <button 
            onClick={toggle} 
            disabled={loading} 
            style={{
              width: '100%',
              padding: '10px 20px',
              background: running ? '#f44336' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
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
            <div style={{ maxHeight: 200, overflow: 'auto' }}>
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
            <div style={{ maxHeight: 200, overflow: 'auto', fontFamily: 'monospace', fontSize: 11 }}>
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
          {systemStatus?.mode === 'simulation' && (
            <><br /><strong>当前为模拟模式，不会执行真实交易。</strong></>
          )}
        </p>
      </div>

      {/* 配置指南 */}
      {systemStatus && !systemStatus.config.isConfigured && (
        <div style={{ background: '#e3f2fd', padding: 15, borderRadius: 10, marginTop: 10, borderLeft: '4px solid #2196f3' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#1565c0', fontSize: 13 }}>⚙️ 配置指南</h4>
          <p style={{ margin: '0 0 10px 0', fontSize: 12, color: '#0d47a1' }}>
            要启用真实交易，请点击右上角「配置」按钮进行设置。
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12 }}>
              <code>WALLET_PRIVATE_KEY</code>: 
              {systemStatus.config.hasPrivateKey ? 
                <span style={{ color: '#4caf50', marginLeft: 4 }}>✓</span> : 
                <span style={{ color: '#f44336', marginLeft: 4 }}>✗</span>
              }
            </span>
            <span style={{ fontSize: 12 }}>
              <code>POLYMARKET_API_KEY</code>: 
              {systemStatus.config.hasApiKey ? 
                <span style={{ color: '#4caf50', marginLeft: 4 }}>✓</span> : 
                <span style={{ color: '#f44336', marginLeft: 4 }}>✗</span>
              }
            </span>
            <span style={{ fontSize: 12 }}>
              <code>POLYMARKET_API_SECRET</code>: 
              {systemStatus.config.hasApiSecret ? 
                <span style={{ color: '#4caf50', marginLeft: 4 }}>✓</span> : 
                <span style={{ color: '#f44336', marginLeft: 4 }}>✗</span>
              }
            </span>
          </div>
        </div>
      )}

      {/* 配置向导 */}
      <ConfigWizard 
        isOpen={showConfigWizard} 
        onClose={() => setShowConfigWizard(false)}
        onComplete={() => {
          fetchStatus();
          fetchBalance();
          addLog('INFO', '配置完成');
        }}
      />
    </main>
  );
}
