# 获取Polymarket API密钥指南

## 第一步：注册Polymarket账户

1. 访问 https://polymarket.com/
2. 点击右上角 "Sign In" 注册账户
3. 连接您的Web3钱包（MetaMask等）

## 第二步：获取API密钥

1. 访问 Polymarket Developer Portal:
   https://docs.polymarket.com/

2. 点击 "Get API Keys" 或类似入口

3. 创建新的API密钥，会获得：
   - API Key
   - API Secret

## 第三步：获取钱包私钥

⚠️ **重要安全提示：**
- 使用专用的交易钱包（不要用主钱包）
- 建议使用Safe多签钱包
- 私钥泄露会导致资金损失！

### MetaMask导出私钥步骤：
1. 打开MetaMask
2. 点击账户头像 → 账户详情
3. 点击"导出私钥"
4. 输入密码确认
5. 复制私钥

## 第四步：配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
# Polymarket API配置
POLYMARKET_API_KEY=你的API_KEY
POLYMARKET_API_SECRET=你的API_SECRET

# 钱包私钥
WALLET_PRIVATE_KEY=你的钱包私钥

# 策略参数（可选）
POSITION_SIZE=100
MAX_EXPOSURE=1000
```

## 第五步：重启服务

```bash
# 重启开发服务器
pnpm dev
```

## 第六步：验证配置

访问监控面板的"配置"页面，检查：
- ✅ API Key: 已配置
- ✅ API Secret: 已配置
- ✅ 钱包私钥: 已配置

## 故障排查

### 问题：API密钥无效
- 检查密钥是否正确复制
- 确认密钥未过期
- 验证API权限设置

### 问题：钱包余额不足
- 确保钱包有足够USDC（Polygon网络）
- 检查Gas费用（MATIC）

### 问题：网络连接失败
- 检查网络代理设置
- 确认Polymarket API可访问
- 查看防火墙配置

## 安全建议

1. **永远不要**将 `.env.local` 文件提交到Git
2. **定期轮换**API密钥
3. **使用硬件钱包**存储大额资金
4. **设置IP白名单**限制API访问
5. **监控账户活动**及时发现异常

## 测试步骤

配置完成后：

1. 访问监控面板
2. 点击"市场列表"标签
3. 应该能看到比特币15分钟市场
4. 点击"启动引擎"开始运行

---

需要帮助？查看 DEPLOYMENT.md 获取完整部署指南。
