# Polymarket 快速下跌对冲套利系统

自动监控比特币15分钟市场，执行快速下跌对冲套利策略。

## 功能特性

- ✅ 实时监控 Polymarket 比特币价格预测市场
- ✅ 自动检测快速下跌信号（3秒内下跌≥15%）
- ✅ 自动执行 Leg1（首次买入）和 Leg2（对冲买入）
- ✅ 支持模拟模式和生产模式
- ✅ 完整的配置向导界面
- ✅ 实时日志和持仓追踪

## 快速开始

### 1. 部署环境

确保部署环境满足以下要求：
- Node.js 18+
- 网络可访问 Polymarket API（`https://clob.polymarket.com`）

### 2. 配置凭证

点击页面右上角「配置」按钮，按向导完成配置：

#### 步骤 1：配置凭证

| 字段 | 说明 | 获取方式 |
|------|------|----------|
| 钱包私钥 | Polygon 钱包私钥 | MetaMask → 账户详情 → 导出私钥 |
| API Key | Polymarket API Key | Polymarket 设置 → API |
| API Secret | Polymarket API Secret | 同上 |

#### 步骤 2：策略参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 对冲阈值 | 0.93 | YES+NO ≤ 此值时触发对冲 |
| 下跌阈值 | 15% | 价格下跌超过此百分比触发 Leg1 |
| 监控窗口 | 3 分钟 | 周期开始后的监控时间 |
| 仓位大小 | 1 USDC | 每次交易金额 |
| 最大暴露 | 100 USDC | 单市场最大持仓 |

#### 步骤 3：选择市场

搜索并选择要交易的比特币市场。

### 3. 启动交易

配置完成后：
1. 确保钱包有足够 USDC（Polygon 网络）
2. 点击「启动引擎」开始自动交易
3. 观察日志和持仓变化

## 环境变量配置

也可以通过环境变量配置：

```bash
# 必需
WALLET_PRIVATE_KEY=your_private_key
POLYMARKET_API_KEY=your_api_key
POLYMARKET_API_SECRET=your_api_secret

# 可选
POSITION_SIZE=1
MAX_EXPOSURE=100
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/status` | GET | 系统状态 |
| `/api/balance` | GET/POST | 余额查询/设置 |
| `/api/price` | GET | 实时价格 |
| `/api/positions` | GET | 持仓查询 |
| `/api/cycle` | GET | 周期信息 |
| `/api/config/credentials` | GET/POST/DELETE | 凭证管理 |
| `/api/config/strategy` | GET/PUT | 策略配置 |
| `/api/config/markets` | GET/POST/DELETE | 市场配置 |
| `/api/polymarket/search` | GET | 市场搜索 |

## 策略原理

### Leg1 - 首次买入
当检测到 YES 或 NO 价格在 3 秒内下跌 ≥15% 时，自动买入下跌侧。

### Leg2 - 对冲买入
当 Leg1 价格 + 另一侧价格 ≤ 0.93 时，买入另一侧完成对冲。

### 利润计算
```
理论利润 = 1 - (Leg1价格 + Leg2价格) - 手续费
```

例如：
- Leg1: YES = 0.40
- Leg2: NO = 0.50
- 总和 = 0.90
- 利润 = 1 - 0.90 = 0.10 USDC（10%）

## 安全提示

⚠️ **重要警告**

1. **私钥安全**：私钥泄露会导致所有资产丢失
2. **小额测试**：建议先用小额资金测试策略
3. **监控日志**：密切关注交易日志，及时发现异常
4. **风险控制**：设置合理的最大暴露金额
5. **网络环境**：确保网络稳定，避免交易中断

## 运行模式

### 模拟模式
- 当 Polymarket API 不可达或未配置凭证时自动启用
- 提供完整的价格模拟和交易流程
- 适合测试和演示

### 生产模式
- 当 API 可达且凭证配置完整时自动启用
- 执行真实交易
- 需要确保钱包有足够 USDC

## 故障排查

### API 连接失败
- 检查网络是否能访问 `https://clob.polymarket.com`
- 检查防火墙设置

### 订单失败
- 检查钱包 USDC 余额
- 检查价格是否在有效范围内
- 检查 API 凭证是否正确

### 模式切换问题
- 清除浏览器缓存
- 重新配置凭证
- 检查环境变量

## 技术栈

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- ethers.js 6
- Tailwind CSS 4

## 许可证

MIT
