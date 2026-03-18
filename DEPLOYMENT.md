# Polymarket 快速下跌对冲套利系统

自动监控Polymarket比特币15分钟市场，执行快速下跌对冲套利策略。

## ⚠️ 重要安全提示

**这是一个涉及真实资金的自动交易系统，使用前请务必：**

1. ✅ 充分理解策略逻辑和风险
2. ✅ 在测试环境充分验证
3. ✅ 使用小额资金进行实盘测试
4. ✅ 配置合适的风险控制参数
5. ✅ 确保API密钥和私钥的安全存储

## 策略说明

### 核心逻辑
- **监控目标**：比特币15分钟市场
- **触发条件**：YES或NO价格在3秒内下跌≥15%
- **对冲条件**：Leg1价格 + Leg2价格 ≤ 0.93
- **理论利润**：(1 - sumPrice) × positionSize

### 执行流程
1. 每轮开始时，启动3分钟监控窗口
2. 检测到快速下跌信号后，执行Leg1（买入下跌侧）
3. 持续监控另一侧价格，满足对冲条件时执行Leg2
4. 完成对冲，锁定利润
5. 如果3分钟内无信号或无法对冲，放弃本轮

### 风险控制
- 只交易高流动性市场（买卖价差<5%）
- Leg2自动扣除1.56%手续费
- 单市场最大暴露自动控制
- 支持Safe账户自托管

## 系统架构

```
前端 (Next.js + React)
  ├─ 实时监控面板
  ├─ 交易历史记录
  ├─ 系统日志展示
  └─ 参数配置界面

后端 (Next.js API Routes)
  ├─ 价格监控服务 (WebSocket + REST API)
  ├─ 信号检测引擎
  ├─ 交易执行模块
  ├─ 风险控制系统
  └─ 日志记录系统
```

## 部署步骤

### 1. 环境准备

确保您的系统已安装：
- Node.js 20+
- pnpm 9.0+

### 2. 克隆项目

```bash
git clone <your-repo-url>
cd polymarket-arbitrage
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 配置环境变量

创建 `.env.local` 文件：

```env
# Polymarket API配置（必需）
POLYMARKET_API_KEY=your_api_key_here
POLYMARKET_API_SECRET=your_api_secret_here
WALLET_PRIVATE_KEY=your_wallet_private_key_here

# 策略参数（可选，使用默认值）
POSITION_SIZE=100
MAX_EXPOSURE=1000

# 环境
NODE_ENV=production
```

**获取API密钥：**
1. 访问 [Polymarket Developer Portal](https://docs.polymarket.com/)
2. 创建开发者账户
3. 生成API密钥和密钥

**钱包配置：**
1. 使用专用交易钱包（建议使用Safe多签钱包）
2. 导出钱包私钥（注意安全！）
3. 确保钱包中有足够的USDC（Polygon网络）

### 5. 本地开发

```bash
pnpm dev
```

访问 http://localhost:5000 查看监控面板

### 6. 生产部署

#### 方式1: Vercel（推荐）

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

#### 方式2: Docker

```bash
# 构建镜像
docker build -t polymarket-arbitrage .

# 运行容器
docker run -p 5000:5000 --env-file .env.local polymarket-arbitrage
```

#### 方式3: 传统服务器

```bash
# 构建
pnpm build

# 启动
pnpm start
```

## 使用指南

### 启动系统

1. 访问监控面板（默认 http://localhost:5000）
2. 点击"启动引擎"按钮
3. 系统将自动开始监控市场

### 监控面板

#### 系统状态
- 总轮次：已执行的交易轮次数
- 成功轮次：成功完成对冲的轮次数
- 失败轮次：未成功对冲的轮次数
- 净利润：累计净利润（USDC）

#### 当前轮次
- 轮次状态：IDLE / MONITORING / LEG1_EXECUTED / COMPLETED / FAILED
- Leg1信息：触发时间、价格、方向、下跌幅度
- Leg2信息：触发时间、价格、方向、手续费

#### 实时日志
- 按时间倒序显示最新日志
- 支持按级别过滤（INFO / WARN / ERROR / DEBUG）

#### 配置查看
- 查看当前策略参数
- 验证API配置状态

### 停止系统

1. 点击"停止引擎"按钮
2. 系统将完成当前轮次后停止
3. 所有持仓将在市场中保持

## API接口

### 启动引擎
```http
POST /api/engine/start
```

### 停止引擎
```http
POST /api/engine/stop
```

### 获取状态
```http
GET /api/engine/status
```

响应：
```json
{
  "success": true,
  "data": {
    "state": {
      "isRunning": true,
      "totalRounds": 10,
      "successfulRounds": 8,
      "failedRounds": 2,
      "totalProfit": 15.6,
      "totalLoss": 3.2,
      "lastUpdate": 1234567890
    },
    "currentRound": {...},
    "recentLogs": [...]
  }
}
```

### 获取市场列表
```http
GET /api/markets
```

### 获取配置
```http
GET /api/config
```

## 日志文件

日志文件位置：`/app/work/logs/bypass/trading.log`

日志格式：
```
[时间戳] [级别] [模块] 消息 | 数据
```

日志轮转：
- 单文件最大10MB
- 保留最近5个日志文件

## 风险管理

### 市场风险
- 价格波动可能导致对冲失败
- 极端行情下可能产生滑点
- 市场流动性不足可能导致无法成交

### 技术风险
- API连接中断
- WebSocket断连
- 订单提交失败

### 资金风险
- 手续费消耗
- 单边持仓风险
- 资金占用成本

### 应对措施
1. 设置合理的仓位大小
2. 监控系统健康状态
3. 定期检查日志
4. 准备应急资金
5. 使用止损策略

## 故障排查

### 引擎无法启动
- 检查环境变量配置
- 验证API密钥有效性
- 查看日志文件中的错误信息

### 无法获取市场数据
- 检查网络连接
- 验证Polymarket API状态
- 确认市场ID正确

### 交易失败
- 检查钱包余额
- 验证交易权限
- 确认市场状态为ACTIVE

### 日志不记录
- 检查日志目录权限
- 确认磁盘空间充足
- 验证日志配置

## 开发说明

### 技术栈
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui

### 目录结构
```
src/
├── app/
│   ├── api/              # API路由
│   │   ├── engine/       # 引擎控制API
│   │   ├── markets/      # 市场数据API
│   │   └── config/       # 配置API
│   ├── page.tsx          # 主页面
│   └── layout.tsx        # 布局
├── components/
│   ├── dashboard/        # 监控面板组件
│   └── ui/               # UI组件
├── lib/
│   ├── polymarket-client.ts  # Polymarket客户端
│   ├── price-monitor.ts      # 价格监控服务
│   ├── trading-engine.ts     # 交易引擎
│   └── logger.ts             # 日志系统
├── config/
│   └── strategy.ts           # 策略配置
└── types/
    └── trading.ts            # 类型定义
```

### 扩展功能
1. 添加更多市场支持
2. 实现多种套利策略
3. 集成更多交易所
4. 添加Telegram/邮件通知
5. 实现自动资金管理

## 免责声明

本项目仅供学习和研究使用。使用本系统进行实际交易的所有风险由用户自行承担。开发者不对任何直接或间接的损失负责。

在使用本系统前，请确保：
1. 您已充分理解交易策略和风险
2. 您有足够的知识和经验进行加密货币交易
3. 您已遵守所在地区的法律法规
4. 您已做好风险管理和资金管理

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交Issue或Pull Request。

---

**祝您交易顺利！** 🚀
