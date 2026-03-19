# 比特币15分钟涨跌预测系统说明

## 📊 系统概述

这是一个基于 Polymarket 平台的比特币15分钟市场自动交易系统，通过**快速下跌对冲套利策略**实现盈利。

---

## 🎯 核心策略

### 策略名称：快速下跌对冲套利 (Quick Drop Hedge Arbitrage)

**核心思想**：在预测市场中，YES 和 NO 的价格之和理论上是 1。当市场出现剧烈波动时，可以利用价格偏差进行套利。

### 策略参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 对冲阈值 (Sum Target) | 0.93 | YES + NO 价格和 ≤ 0.93 时执行对冲 |
| 下跌阈值 (Move %) | 15% | 3秒内下跌 ≥ 15% 触发Leg1 |
| 监控窗口 (Window) | 3分钟 | 市场开放前3分钟监控信号 |
| 仓位大小 (Position) | 100 USDC | 每次交易金额 |
| 最大暴露 (Max Exposure) | 1000 USDC | 最大持仓风险 |
| 市场周期 (Duration) | 15分钟 | 比特币15分钟预测市场 |

---

## 🔄 交易流程

### 完整交易周期

```
开始新周期
    ↓
[监控阶段] 持续监控价格变化 (3分钟窗口)
    ↓
检测到快速下跌信号？
    ├─ 否 → 等待或超时结束
    └─ 是 → 执行 Leg1
              ↓
         [Leg1执行] 买入下跌侧
              ↓
         [Leg2监控] 等待对冲机会
              ↓
         价格总和 ≤ 0.93？
              ├─ 否 → 等待或超时结束
              └─ 是 → 执行 Leg2
                        ↓
                   [Leg2执行] 买入对冲侧
                        ↓
                   [完成] 计算利润
```

---

## 💡 策略详解

### Leg1：快速下跌买入

**触发条件**：
- 在监控窗口内（市场开放前3分钟）
- YES 或 NO 价格在 **3秒内下跌 ≥ 15%**

**执行动作**：
- 买入下跌侧（YES 或 NO）
- 仓位：100 USDC
- 记录买入价格

**示例**：
```
市场：Bitcoin above $65,000 in 15 minutes?
初始价格：YES = 0.50, NO = 0.50
监控中...
YES 价格突然下跌：
  - T+0s: YES = 0.50
  - T+3s: YES = 0.40 (下跌 20%)
  
触发 Leg1：
  - 买入 YES @ 0.40
  - 花费 100 USDC
```

### Leg2：对冲买入

**触发条件**：
- Leg1 已执行
- YES + NO 价格总和 ≤ **0.93**

**执行动作**：
- 买入对冲侧（如果Leg1买YES，则买NO）
- 仓位：100 USDC
- 记录买入价格

**示例（接上）**：
```
Leg1 已执行：YES @ 0.40

继续监控...
NO 价格上涨（因为YES下跌）：
  - NO = 0.52
  
检查对冲条件：
  - 价格总和 = 0.40 + 0.52 = 0.92
  - 0.92 < 0.93 ✓ 满足条件
  
触发 Leg2：
  - 买入 NO @ 0.52
  - 花费 100 USDC
```

### 利润计算

**理论利润** = (1 - 价格总和) × 仓位大小

**实际利润** = 理论利润 - 手续费

**示例（接上）**：
```
Leg1: YES @ 0.40 (100 USDC)
Leg2: NO @ 0.52 (100 USDC)

价格总和 = 0.40 + 0.52 = 0.92
理论利润 = (1 - 0.92) × 100 = 8 USDC
手续费 ≈ 0.5 USDC
实际利润 = 8 - 0.5 = 7.5 USDC

收益率 = 7.5 / 200 = 3.75%
```

### 为什么能盈利？

**关键原理**：
1. **价格总和偏差**：在剧烈波动时，YES + NO 可能暂时小于1
2. **时间窗口**：15分钟市场波动大，容易出现价格偏差
3. **快速反应**：系统自动监控，毫秒级响应
4. **对冲保护**：无论结果如何，持有YES+NO都能收回本金

**盈利保障**：
- 如果 YES 胜出：卖出 YES 获得 100 USDC（盈利 = 100 - 40 = 60 USDC）
- 如果 NO 胜出：卖出 NO 获得 100 USDC（盈利 = 100 - 52 = 48 USDC）
- 无论结果如何都盈利！

---

## 📈 系统监控

### 当前系统状态

```json
{
  "isRunning": true,
  "totalRounds": 0,
  "successfulRounds": 0,
  "failedRounds": 0,
  "totalProfit": 0,
  "totalLoss": 0
}
```

### 系统日志

系统会记录以下关键事件：

1. **引擎启动/停止**
   - `[ENGINE] Trading engine started`
   - `[ENGINE] Trading engine stopped`

2. **市场发现**
   - `[ENGINE] Found market: Bitcoin above $65,000 in 15 minutes?`
   - `[WARN] No suitable markets found`

3. **价格监控**
   - `[PRICE] Price update: YES = 0.4800`
   - `[PRICE] Price update: NO = 0.5200`

4. **信号触发**
   - `[SIGNAL] Quick drop detected: YES dropped 15.5%`
   - `[SIGNAL] Hedge opportunity detected: sum=0.9150 <= 0.93`

5. **交易执行**
   - `[LEG1] Leg1 executed: YES @ 0.4000`
   - `[LEG2] Leg2 executed: NO @ 0.5200`

6. **轮次完成**
   - `[ROUND] Round completed successfully, profit: 7.5000 USDC`
   - `[WARN] Round failed: No signal in monitoring window`

---

## 🎲 比特币15分钟市场特点

### 市场类型

Polymarket 上的比特币15分钟市场通常有以下几种：

1. **价格阈值型**
   - "Will Bitcoin be above $65,000 in 15 minutes?"
   - "Will Bitcoin break $66,000 in the next 15 minutes?"

2. **涨跌幅度型**
   - "Will Bitcoin increase by more than 1% in the next 15 minutes?"
   - "Will Bitcoin drop 2% in the next 15 minutes?"

3. **波动率型**
   - "Will Bitcoin move more than $500 in 15 minutes?"

### 为什么选择15分钟市场？

**优势**：
- ⚡ **高波动性**：短期市场波动大，价格偏差机会多
- 🔄 **高频周期**：每15分钟一个新周期，交易机会多
- 💰 **高流动性**：比特币市场参与者多，流动性好
- 🎯 **快速验证**：15分钟后即知结果，反馈快

**风险**：
- 需要快速响应（自动化系统解决）
- 波动可能不触发信号（策略容错）
- 网络延迟影响执行（本地部署优化）

---

## 🔧 系统配置

### 当前配置（.env.local）

```bash
# Polymarket API
POLYMARKET_API_KEY=019cc244-caab-7bf1-884e-61392538582e
POLYMARKET_API_SECRET=HS5QdfZ0Yq7kqhXLSEpy90aS6V9_liZe5OWz6PTymNY=

# 钱包私钥
WALLET_PRIVATE_KEY=0x89a07674466649a1a49b170fbf8abb5358041a70e37d8b6311216d2b33f64c93

# 策略参数
POSITION_SIZE=100
MAX_EXPOSURE=1000
```

### 参数调优建议

根据市场情况，可以调整以下参数：

1. **激进模式**（高频交易）
   - `movePct`: 0.10 (10%下跌触发)
   - `sumTarget`: 0.95 (更容易对冲)
   - 风险：更多交易，单笔利润低

2. **保守模式**（稳健收益）
   - `movePct`: 0.20 (20%下跌触发)
   - `sumTarget`: 0.90 (更大价差)
   - 风险：交易机会少，单笔利润高

3. **当前配置**（平衡模式）
   - `movePct`: 0.15 (15%下跌触发)
   - `sumTarget`: 0.93 (合理价差)
   - 平衡交易频率和利润率

---

## 📊 预期收益

### 理论收益模型

假设：
- 每小时 4 个周期
- 每天监控 8 小时
- 成功率 30%
- 平均利润 7 USDC/轮

**每日预期收益**：
```
每日轮次 = 4 × 8 = 32 轮
成功轮次 = 32 × 30% = 9.6 轮
每日利润 = 9.6 × 7 = 67.2 USDC
```

**月度预期收益**：
```
月度利润 = 67.2 × 30 = 2,016 USDC
```

### 风险提示

⚠️ **重要声明**：
- 以上为理论计算，实际收益取决于市场波动
- 策略可能不触发信号（无交易）
- 网络问题可能导致交易失败
- 市场规则变化可能影响策略

---

## 🚀 启动交易

### 方式1：通过监控面板

1. 访问 `http://localhost:5000`
2. 点击 **"启动引擎"** 按钮
3. 观察系统状态和日志
4. 等待交易机会

### 方式2：通过API

```bash
# 启动引擎
curl -X POST http://localhost:5000/api/engine/start

# 查看状态
curl http://localhost:5000/api/engine/status

# 查看市场
curl http://localhost:5000/api/markets
```

---

## 🔍 监控与调优

### 实时监控

在监控面板可以看到：
- ✅ 系统运行状态
- 📊 当前市场数据
- 📝 实时交易日志
- 💰 累计收益统计
- ⚙️ 策略配置

### 性能指标

关注以下指标：
- **成功率** = 成功轮次 / 总轮次
- **平均利润** = 总利润 / 成功轮次
- **最大回撤** = 单轮最大亏损
- **夏普比率** = 平均收益 / 收益波动

---

## 📚 相关文档

- `LOCAL_RUN_GUIDE.md` - 本地运行指南
- `DEPLOYMENT.md` - 部署方案
- `API_REQUIREMENTS.md` - API配置
- `NETWORK_ISSUE.md` - 网络问题说明

---

## ⚠️ 免责声明

本系统仅供学习和研究使用，不构成任何投资建议。加密货币和预测市场交易存在高风险，请谨慎评估自己的风险承受能力。使用本系统产生的任何盈亏由用户自行承担。

---

**系统已准备就绪，开始您的量化交易之旅！** 🚀
