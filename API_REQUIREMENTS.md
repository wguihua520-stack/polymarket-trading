# Polymarket API 配置要求说明

## ✅ 必需的三个配置项

### 1. Polymarket API Key
**必需：✅ 是**
**用途：**
- API 身份认证
- 访问 Polymarket CLOB API
- 查询市场数据
- 提交订单

**获取方式：**
1. 访问 https://docs.polymarket.com/
2. 登录 Polymarket 账户
3. 进入 Developer Portal
4. 点击 "Create API Keys"
5. 复制 API Key

---

### 2. Polymarket API Secret
**必需：✅ 是**
**用途：**
- API 请求签名
- 验证请求合法性
- 安全通信

**获取方式：**
- 与 API Key 同时生成
- ⚠️ **只会显示一次，请立即保存！**
- 如果丢失需要重新生成

---

### 3. 钱包私钥 (WALLET_PRIVATE_KEY)
**必需：✅ 是**
**用途：**
- 签署链上交易
- 执行买卖订单
- 支付 Gas 费用
- 资金控制权

**获取方式（MetaMask）：**
1. 打开 MetaMask
2. 点击右上角账户头像
3. 选择 "账户详情"
4. 点击 "导出私钥"
5. 输入密码确认
6. 复制私钥（以 0x 开头的字符串）

**⚠️ 安全警告：**
- 使用专用交易钱包（不要用主钱包）
- 推荐使用 Safe 多签钱包
- 私钥泄露 = 资金丢失
- 永远不要分享给任何人

---

## 🎯 为什么都需要？

### API Key + Secret
```
Polymarket 服务器
    ↓
验证您的身份（API Key）
    ↓
验证请求合法性（API Secret 签名）
    ↓
允许访问市场和订单 API
```

### 钱包私钥
```
您的交易请求
    ↓
用私钥签名交易
    ↓
提交到 Polygon 区块链
    ↓
执行订单，资金转移
```

**简单说：**
- API Key + Secret = **身份认证**（证明你是谁）
- 钱包私钥 = **资金控制**（证明你能动用资金）

---

## 🔧 最简配置示例

创建 `.env.local` 文件：

```env
# Polymarket API 配置
POLYMARKET_API_KEY=你的API_KEY
POLYMARKET_API_SECRET=你的API_SECRET

# 钱包私钥
WALLET_PRIVATE_KEY=你的钱包私钥

# 策略参数（可选）
POSITION_SIZE=100
MAX_EXPOSURE=1000
```

---

## ❓ 常见问题

### Q: 可以只配置 API Key 不配置私钥吗？
**A:** 可以，但只能查看数据，不能交易。

### Q: 钱包里需要有什么？
**A:**
- USDC（用于交易，Polygon 网络）
- MATIC（用于支付 Gas 费）

### Q: 没有 Polymarket 账户怎么办？
**A:**
1. 访问 https://polymarket.com/
2. 连接 MetaMask 钱包
3. 完成注册（免费）

### Q: API Key 可以给多人使用吗？
**A:** 不建议。每个用户应该有独立的 API Key。

---

## 🚀 快速配置

### 方式1：运行配置向导
```bash
./setup-api.sh
```

### 方式2：直接编辑
```bash
cp .env.example .env.local
# 编辑 .env.local 填入您的密钥
```

### 方式3：命令行参数
```bash
./configure-env.sh API_KEY API_SECRET PRIVATE_KEY
```

---

## ✅ 配置完成后

1. **重启服务**
```bash
pnpm dev
```

2. **访问监控面板**
```
https://你的域名
```

3. **验证配置**
- 点击 "配置" 标签
- 检查是否显示 "已配置"

4. **检查市场数据**
- 点击 "市场列表" 标签
- 应该显示真实市场数据（而非模拟数据）

---

## 🔒 安全检查清单

- [ ] 使用专用交易钱包
- [ ] .env.local 已添加到 .gitignore
- [ ] 文件权限设置为 600
- [ ] 钱包有足够 USDC 和 MATIC
- [ ] 设置了合理的仓位大小
- [ ] 准备小额测试

---

**需要帮助？查看 SETUP_API.md 获取详细指南。**
