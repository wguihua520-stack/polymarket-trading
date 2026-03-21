'use client';

import { useState, useEffect } from 'react';

interface ConfigWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface CredentialsForm {
  walletPrivateKey: string;
  polymarketApiKey: string;
  polymarketApiSecret: string;
  polymarketPassphrase: string;
}

interface StrategyForm {
  sumTarget: number;
  movePct: number;
  windowMin: number;
  positionSize: number;
  maxExposure: number;
}

interface Market {
  marketId: string;
  conditionId: string;
  question: string;
  tokens: Array<{
    tokenId: string;
    outcome: string;
    price: number;
  }>;
  spread: number;
  active: boolean;
  liquidity?: number;
  volume?: number;
  upTokenId?: string;
  downTokenId?: string;
}

export default function ConfigWizard({ isOpen, onClose, onComplete }: ConfigWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 凭证表单
  const [credentials, setCredentials] = useState<CredentialsForm>({
    walletPrivateKey: '',
    polymarketApiKey: '',
    polymarketApiSecret: '',
    polymarketPassphrase: '',
  });
  
  // 策略表单
  const [strategy, setStrategy] = useState<StrategyForm>({
    sumTarget: 0.93,
    movePct: 0.15,
    windowMin: 3,
    positionSize: 1,
    maxExposure: 100,
  });
  
  // 市场搜索
  const [searchQuery, setSearchQuery] = useState('bitcoin');
  const [searchResults, setSearchResults] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // 加载已保存的配置
  useEffect(() => {
    if (isOpen) {
      loadSavedConfig();
    }
  }, [isOpen]);

  const loadSavedConfig = async () => {
    try {
      // 检查凭证状态
      const credRes = await fetch('/api/config/credentials');
      const credData = await credRes.json();
      setIsConfigured(credData.data?.isConfigured || false);
      
      // 加载策略
      const stratRes = await fetch('/api/config/strategy');
      const stratData = await stratRes.json();
      if (stratData.data) {
        setStrategy({
          sumTarget: stratData.data.sumTarget || 0.93,
          movePct: stratData.data.movePct || 0.15,
          windowMin: stratData.data.windowMin || 3,
          positionSize: stratData.data.positionSize || 1,
          maxExposure: stratData.data.maxExposure || 100,
        });
      }
    } catch (e) {
      console.error('Load config error:', e);
    }
  };

  const searchMarkets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/polymarket/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data || []);
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveCredentials = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/config/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setIsConfigured(true);
        setStep(2);
      } else {
        setError(data.errors?.join(', ') || data.error || '保存失败');
      }
    } catch (e) {
      setError('保存凭证时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const saveStrategy = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/config/strategy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategy),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStep(3);
      } else {
        setError(data.errors?.join(', ') || data.error || '保存失败');
      }
    } catch (e) {
      setError('保存策略时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const saveMarket = async () => {
    if (!selectedMarket) {
      setError('请选择一个市场');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/config/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: selectedMarket.marketId,
          conditionId: selectedMarket.conditionId,
          question: selectedMarket.question,
          yesTokenId: selectedMarket.tokens.find(t => t.outcome === 'UP' || t.outcome === 'YES')?.tokenId || '',
          noTokenId: selectedMarket.tokens.find(t => t.outcome === 'DOWN' || t.outcome === 'NO')?.tokenId || '',
          upTokenId: selectedMarket.tokens.find(t => t.outcome === 'UP')?.tokenId || '',
          downTokenId: selectedMarket.tokens.find(t => t.outcome === 'DOWN')?.tokenId || '',
          enabled: true,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        onComplete();
        onClose();
      } else {
        setError(data.error || '保存失败');
      }
    } catch (e) {
      setError('保存市场时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const skipCredentials = () => {
    setStep(2);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        maxWidth: 600,
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        {/* 头部 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>配置向导</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>

        {/* 进度条 */}
        <div style={{ display: 'flex', marginBottom: 24, gap: 8 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: step >= s ? '#4caf50' : '#e0e0e0',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* 步骤标题 */}
        <div style={{ marginBottom: 16, color: '#666', fontSize: 14 }}>
          步骤 {step}/3: {
            step === 1 ? '配置凭证' :
            step === 2 ? '策略参数' :
            '选择市场'
          }
        </div>

        {/* 步骤 1: 凭证配置 */}
        {step === 1 && (
          <div>
            {isConfigured && (
              <div style={{ background: '#e8f5e9', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <p style={{ margin: 0, color: '#2e7d32', fontSize: 14 }}>
                  ✓ 凭证已配置。输入新凭证将覆盖现有配置。
                </p>
              </div>
            )}
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                钱包私钥 *
              </label>
              <input
                type="password"
                value={credentials.walletPrivateKey}
                onChange={e => setCredentials({ ...credentials, walletPrivateKey: e.target.value })}
                placeholder="64位十六进制私钥（可带0x前缀）"
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'monospace',
                }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#888' }}>
                用于签名交易的 Polygon 钱包私钥
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                Polymarket API Key *
              </label>
              <input
                type="text"
                value={credentials.polymarketApiKey}
                onChange={e => setCredentials({ ...credentials, polymarketApiKey: e.target.value })}
                placeholder="API Key"
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                Polymarket API Secret *
              </label>
              <input
                type="password"
                value={credentials.polymarketApiSecret}
                onChange={e => setCredentials({ ...credentials, polymarketApiSecret: e.target.value })}
                placeholder="API Secret"
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                Passphrase（可选）
              </label>
              <input
                type="password"
                value={credentials.polymarketPassphrase}
                onChange={e => setCredentials({ ...credentials, polymarketPassphrase: e.target.value })}
                placeholder="Passphrase"
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>

            {error && (
              <div style={{ background: '#ffebee', padding: 12, borderRadius: 8, marginBottom: 16, color: '#c62828', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={skipCredentials}
                style={{
                  padding: '12px 20px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                跳过（模拟模式）
              </button>
              <button
                onClick={saveCredentials}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? '保存中...' : '保存并继续'}
              </button>
            </div>
          </div>
        )}

        {/* 步骤 2: 策略参数 */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                对冲阈值
              </label>
              <input
                type="number"
                step="0.01"
                value={strategy.sumTarget}
                onChange={e => setStrategy({ ...strategy, sumTarget: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#888' }}>
                YES + NO 价格总和 ≤ 此值时触发对冲
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                下跌阈值
              </label>
              <input
                type="number"
                step="0.01"
                value={strategy.movePct}
                onChange={e => setStrategy({ ...strategy, movePct: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#888' }}>
                价格下跌超过此百分比时触发 Leg1
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                监控窗口（分钟）
              </label>
              <input
                type="number"
                value={strategy.windowMin}
                onChange={e => setStrategy({ ...strategy, windowMin: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#888' }}>
                在周期开始后的多少分钟内监控下跌信号
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                仓位大小（USDC）
              </label>
              <input
                type="number"
                step="0.1"
                value={strategy.positionSize}
                onChange={e => setStrategy({ ...strategy, positionSize: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                最大暴露（USDC）
              </label>
              <input
                type="number"
                value={strategy.maxExposure}
                onChange={e => setStrategy({ ...strategy, maxExposure: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#888' }}>
                单个市场的最大持仓价值
              </p>
            </div>

            {error && (
              <div style={{ background: '#ffebee', padding: 12, borderRadius: 8, marginBottom: 16, color: '#c62828', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '12px 20px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                上一步
              </button>
              <button
                onClick={saveStrategy}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? '保存中...' : '保存并继续'}
              </button>
            </div>
          </div>
        )}

        {/* 步骤 3: 选择市场 */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                搜索市场
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="输入关键词（如 bitcoin, ethereum）"
                  style={{
                    flex: 1,
                    padding: 10,
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                />
                <button
                  onClick={searchMarkets}
                  disabled={loading}
                  style={{
                    padding: '10px 16px',
                    background: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 14,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  搜索
                </button>
              </div>
            </div>

            {/* 搜索结果 */}
            <div style={{ maxHeight: 300, overflow: 'auto', marginBottom: 16 }}>
              {searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#888' }}>
                  点击搜索按钮查找市场
                </div>
              ) : (
                searchResults.map((market) => (
                  <div
                    key={market.marketId}
                    onClick={() => setSelectedMarket(market)}
                    style={{
                      padding: 12,
                      border: `2px solid ${selectedMarket?.marketId === market.marketId ? '#4caf50' : '#e0e0e0'}`,
                      borderRadius: 8,
                      marginBottom: 8,
                      cursor: 'pointer',
                      background: selectedMarket?.marketId === market.marketId ? '#e8f5e9' : 'white',
                    }}
                  >
                    <p style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 500 }}>
                      {market.question}
                    </p>
                    <p style={{ margin: '0 0 4px 0', fontSize: 12, color: '#666' }}>
                      ID: {market.marketId}
                    </p>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#888' }}>
                      <span>价差: {(market.spread * 100).toFixed(2)}%</span>
                      <span>流动性: ${market.liquidity?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      {market.tokens.map((token) => (
                        <span key={token.tokenId} style={{
                          padding: '4px 8px',
                          background: token.outcome === 'YES' ? '#e3f2fd' : '#ffebee',
                          borderRadius: 4,
                          fontSize: 11,
                        }}>
                          {token.outcome}: {token.price.toFixed(3)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {error && (
              <div style={{ background: '#ffebee', padding: 12, borderRadius: 8, marginBottom: 16, color: '#c62828', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  padding: '12px 20px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                上一步
              </button>
              <button
                onClick={saveMarket}
                disabled={loading || !selectedMarket}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: loading || !selectedMarket ? 'not-allowed' : 'pointer',
                  opacity: loading || !selectedMarket ? 0.7 : 1,
                }}
              >
                {loading ? '保存中...' : '完成配置'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
