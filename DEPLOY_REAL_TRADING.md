# 启用真实交易部署指南

## ⚠️ 当前限制
- 沙箱环境网络受限，无法访问 Polymarket API
- 需要部署到有完整网络访问的环境

## 🎯 部署方案

### 方案1: Vercel（推荐，免费）

**优点：**
- 免费，无需服务器
- 自动HTTPS
- 全球CDN加速
- 简单易用

**步骤：**

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署项目
vercel --prod

# 4. 配置环境变量
# 在 Vercel Dashboard 中添加：
# - POLYMARKET_API_KEY
# - POLYMARKET_API_SECRET
# - WALLET_PRIVATE_KEY
# - POSITION_SIZE
# - MAX_EXPOSURE
```

**环境变量配置：**
1. 访问 https://vercel.com/dashboard
2. 选择您的项目
3. Settings → Environment Variables
4. 添加所有配置项
5. 重新部署

---

### 方案2: Railway（推荐，简单）

**优点：**
- 支持自动部署
- 内置环境变量管理
- 免费额度充足

**步骤：**

```bash
# 1. 安装 Railway CLI
npm i -g @railway/cli

# 2. 登录 Railway
railway login

# 3. 初始化项目
railway init

# 4. 配置环境变量
railway variables set POLYMARKET_API_KEY=your_key
railway variables set POLYMARKET_API_SECRET=your_secret
railway variables set WALLET_PRIVATE_KEY=your_key
railway variables set POSITION_SIZE=100
railway variables set MAX_EXPOSURE=1000

# 5. 部署
railway up
```

---

### 方案3: 自己的服务器

**优点：**
- 完全控制
- 无限制
- 可自定义配置

**步骤：**

```bash
# 1. 准备服务器（需要 Node.js 20+）
ssh user@your-server

# 2. 克隆项目
git clone <your-repo>
cd polymarket-arbitrage

# 3. 安装依赖
pnpm install

# 4. 创建配置文件
cat > .env.local << 'EOF'
POLYMARKET_API_KEY=019cc244-caab-7bf1-884e-61392538582e
POLYMARKET_API_SECRET=HS5QdfZ0Yq7kqhXLSEpy90aS6V9_liZe5OWz6PTymNY=
WALLET_PRIVATE_KEY=0x89a07674466649a1a49b170fbf8abb5358041a70e37d8b6311216d2b33f64c93
POSITION_SIZE=100
MAX_EXPOSURE=1000
NODE_ENV=production
EOF

# 5. 构建项目
pnpm build

# 6. 使用 PM2 启动（推荐）
npm i -g pm2
pm2 start pnpm --name "trading-bot" -- start
pm2 save
pm2 startup
```

---

### 方案4: Docker 部署

**步骤：**

```bash
# 1. 创建 Dockerfile（如果不存在）
cat > Dockerfile << 'EOF'
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm
RUN pnpm install
COPY . .
RUN pnpm build
EXPOSE 5000
CMD ["pnpm", "start"]
EOF

# 2. 构建镜像
docker build -t polymarket-trading .

# 3. 运行容器
docker run -d \
  -p 5000:5000 \
  -e POLYMARKET_API_KEY=019cc244-caab-7bf1-884e-61392538582e \
  -e POLYMARKET_API_SECRET=HS5QdfZ0Yq7kqhXLSEpy90aS6V9_liZe5OWz6PTymNY= \
  -e WALLET_PRIVATE_KEY=0x89a07674466649a1a49b170fbf8abb5358041a70e37d8b6311216d2b33f64c93 \
  -e POSITION_SIZE=100 \
  -e MAX_EXPOSURE=1000 \
  --name trading-bot \
  polymarket-trading
```

---

## 📝 部署前检查清单

### 资金准备
- [ ] USDC（Polygon网络）- 用于交易
- [ ] MATIC（Polygon网络）- 用于Gas费
- [ ] 建议初始资金：50-100 USDC + 1-2 MATIC

### 安全检查
- [ ] 使用专用交易钱包（已配置）
- [ ] 私钥安全保存（已配置）
- [ ] 设置合理仓位（POSITION_SIZE=100）
- [ ] 设置最大暴露（MAX_EXPOSURE=1000）

### 技术准备
- [ ] 项目代码准备
- [ ] 环境变量配置
- [ ] 域名（可选）
- [ ] SSL证书（自动或手动）

---

## ⚡ 快速部署（Vercel 一键部署）

### 步骤1: 准备代码

```bash
# 确认代码已提交
git status
git add .
git commit -m "Ready for production deployment"
git push
```

### 步骤2: 部署到 Vercel

1. 访问 https://vercel.com/new
2. 导入您的 Git 仓库
3. 配置项目：
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: pnpm build
   - Output Directory: .next

4. **重要：添加环境变量**
   ```
   POLYMARKET_API_KEY=019cc244-caab-7bf1-884e-61392538582e
   POLYMARKET_API_SECRET=HS5QdfZ0Yq7kqhXLSEpy90aS6V9_liZe5OWz6PTymNY=
   WALLET_PRIVATE_KEY=0x89a07674466649a1a49b170fbf8abb5358041a70e37d8b6311216d2b33f64c93
   POSITION_SIZE=100
   MAX_EXPOSURE=1000
   ```

5. 点击 Deploy

### 步骤3: 验证部署

1. 访问您的 Vercel 域名
2. 检查"配置"页面是否显示已配置
3. 检查"市场列表"是否显示真实市场数据
4. 检查是否显示 "isMockData: false"

---

## 🎯 部署后操作

### 1. 验证系统
- [ ] 访问监控面板
- [ ] 检查API连接状态
- [ ] 确认市场数据显示
- [ ] 检查钱包余额

### 2. 启动交易
- [ ] 点击"启动引擎"
- [ ] 观察系统运行
- [ ] 查看实时日志
- [ ] 监控第一笔交易

### 3. 监控维护
- [ ] 定期检查日志
- [ ] 监控账户余额
- [ ] 检查交易执行
- [ ] 调整策略参数

---

## 🆘 常见问题

### Q: 部署后仍然显示模拟数据？
A: 检查环境变量是否正确配置，重新部署项目

### Q: API 连接失败？
A: 检查API密钥是否有效，网络是否正常

### Q: 钱包余额不足？
A: 向钱包地址充值 USDC 和 MATIC（Polygon网络）

### Q: 如何停止交易？
A: 访问监控面板，点击"停止引擎"按钮

---

## 📞 技术支持

如需帮助，请查看：
- DEPLOYMENT.md - 详细部署指南
- NETWORK_ISSUE.md - 网络问题排查
- API_REQUIREMENTS.md - API配置说明

---

**准备好了吗？选择一个部署方案开始吧！** 🚀
