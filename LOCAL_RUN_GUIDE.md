# 本地运行完整指南

## 📦 项目已打包

项目文件已导出到：`/tmp/polymarket-trading.tar.gz` (304KB)

---

## 🚀 本地运行步骤

### 第一步：下载项目

**方式1：在沙箱环境下载**
```
访问项目目录，下载 polymarket-trading.tar.gz
```

**方式2：使用 Git Clone（如果有远程仓库）**
```bash
git clone <your-repo-url>
cd polymarket-arbitrage
```

---

### 第二步：解压项目

```bash
# 解压到当前目录
tar -xzf polymarket-trading.tar.gz

# 进入项目目录
cd polymarket-arbitrage
```

---

### 第三步：安装依赖

**前提条件：**
- Node.js 20+ 
- pnpm 9.0+

**检查版本：**
```bash
node --version   # 需要 v20.0.0 或更高
pnpm --version   # 需要 9.0.0 或更高
```

**安装 pnpm（如果未安装）：**
```bash
npm install -g pnpm
```

**安装项目依赖：**
```bash
pnpm install
```

---

### 第四步：创建配置文件

创建 `.env.local` 文件：

```bash
cat > .env.local << 'EOF'
# Polymarket API 配置
POLYMARKET_API_KEY=019cc244-caab-7bf1-884e-61392538582e
POLYMARKET_API_SECRET=HS5QdfZ0Yq7kqhXLSEpy90aS6V9_liZe5OWz6PTymNY=

# 钱包私钥
WALLET_PRIVATE_KEY=0x89a07674466649a1a49b170fbf8abb5358041a70e37d8b6311216d2b33f64c93

# 策略参数
POSITION_SIZE=100
MAX_EXPOSURE=1000

# 环境
NODE_ENV=production
EOF
```

**设置安全权限：**
```bash
chmod 600 .env.local
```

---

### 第五步：构建项目

```bash
pnpm build
```

---

### 第六步：启动服务

**开发模式（支持热更新）：**
```bash
pnpm dev
```

**生产模式（推荐）：**
```bash
pnpm start
```

**使用 PM2（后台运行）：**
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start pnpm --name "trading-bot" -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs trading-bot

# 设置开机自启
pm2 save
pm2 startup
```

---

### 第七步：访问系统

**浏览器访问：**
```
http://localhost:5000
```

---

## ✅ 验证部署

### 1. 检查配置

访问配置页面：`http://localhost:5000` → 点击"配置"标签

**应该显示：**
- ✅ API Key: 已配置
- ✅ API Secret: 已配置
- ✅ 钱包私钥: 已配置

### 2. 检查市场数据

访问市场列表：`http://localhost:5000` → 点击"市场列表"标签

**应该显示：**
- 真实的比特币15分钟市场
- 市场数量 > 0
- `isMockData: false`

### 3. 测试API连接

```bash
# 检查系统状态
curl http://localhost:5000/api/engine/status

# 检查配置
curl http://localhost:5000/api/config

# 检查市场
curl http://localhost:5000/api/markets
```

---

## 💰 钱包准备

### 查看钱包地址

1. 打开 MetaMask
2. 导入私钥：`0x89a07674466649a1a49b170fbf8abb5358041a70e37d8b6311216d2b33f64c93`
3. 切换到 Polygon 网络
4. 查看钱包地址

### 准备资金

**USDC（Polygon网络）**
- 建议金额：50-100 USDC
- 获取方式：
  1. 从交易所购买并提币到 Polygon 网络
  2. 使用跨链桥（如 Hop、Multichain）

**MATIC（Polygon网络）**
- 建议金额：1-2 MATIC
- 用途：支付 Gas 费用
- 获取方式：
  1. 从交易所购买并提币
  2. 访问 Polygon 水龙头（少量测试）

---

## 🎯 启动交易

### 方式1：通过监控面板

1. 访问 `http://localhost:5000`
2. 点击 **"启动引擎"** 按钮
3. 观察系统状态
4. 查看实时日志

### 方式2：通过API

```bash
# 启动引擎
curl -X POST http://localhost:5000/api/engine/start

# 查看状态
curl http://localhost:5000/api/engine/status

# 停止引擎
curl -X POST http://localhost:5000/api/engine/stop
```

---

## 🔧 故障排查

### 问题1：端口 5000 被占用

**检查端口：**
```bash
lsof -i :5000
```

**修改端口：**
编辑 `.coze` 文件或使用环境变量：
```bash
PORT=3000 pnpm dev
```

### 问题2：API 连接失败

**检查：**
1. 网络连接是否正常
2. API 密钥是否有效
3. 防火墙是否阻止连接

**测试API：**
```bash
curl https://gamma-api.polymarket.com/markets?limit=1
```

### 问题3：交易失败

**检查：**
1. 钱包是否有 USDC
2. 钱包是否有 MATIC（Gas费）
3. 网络是否正常

---

## 📊 监控与维护

### 查看日志

**实时日志：**
```bash
tail -f /app/work/logs/bypass/trading.log
```

**日志位置：**
- 交易日志：`/app/work/logs/bypass/trading.log`
- 系统日志：`/app/work/logs/bypass/app.log`
- 开发日志：`/app/work/logs/bypass/dev.log`

### 定时任务（可选）

使用 cron 定期检查系统状态：

```bash
# 编辑 crontab
crontab -e

# 添加以下内容（每小时检查一次）
0 * * * * curl -s http://localhost:5000/api/engine/status | jq '.data.state.isRunning' | grep -q true || curl -X POST http://localhost:5000/api/engine/start
```

---

## 🔒 安全建议

1. **私钥安全**
   - 永远不要分享 `.env.local` 文件
   - 添加到 `.gitignore`
   - 定期更换私钥

2. **资金安全**
   - 使用专用交易钱包
   - 不要存放大额资金
   - 设置合理的仓位大小

3. **系统安全**
   - 定期更新依赖
   - 监控系统日志
   - 备份配置文件

---

## 📚 相关文档

- `DEPLOYMENT.md` - 完整部署指南
- `DEPLOY_REAL_TRADING.md` - 真实交易部署
- `NETWORK_ISSUE.md` - 网络问题排查
- `API_REQUIREMENTS.md` - API配置要求

---

## 🆘 需要帮助？

**查看日志：**
```bash
tail -f /app/work/logs/bypass/trading.log
```

**重启服务：**
```bash
pm2 restart trading-bot
```

**检查系统：**
```bash
curl http://localhost:5000/api/engine/status
```

---

**祝您交易顺利！** 🚀
