# Vercel 一键部署步骤

## 第一步：准备 Git 仓库（如果还没有）

```bash
# 如果项目还没有 Git 仓库
git init
git add .
git commit -m "Initial commit"

# 推送到 GitHub/GitLab
git remote add origin <your-repo-url>
git push -u origin main
```

## 第二步：访问 Vercel

1. 访问: https://vercel.com/new
2. 使用 GitHub/GitLab 登录
3. 导入您的 Git 仓库

## 第三步：配置项目

- Framework: Next.js (自动识别)
- Root Directory: ./
- Build Command: pnpm build
- Output Directory: .next

## 第四步：添加环境变量（关键！）

在部署页面添加以下环境变量：

| 变量名 | 值 |
|--------|-----|
| POLYMARKET_API_KEY | 019cc244-caab-7bf1-884e-61392538582e |
| POLYMARKET_API_SECRET | HS5QdfZ0Yq7kqhXLSEpy90aS6V9_liZe5OWz6PTymNY= |
| WALLET_PRIVATE_KEY | 0x89a07674466649a1a49b170fbf8abb5358041a70e37d8b6311216d2b33f64c93 |
| POSITION_SIZE | 100 |
| MAX_EXPOSURE | 1000 |

## 第五步：点击 Deploy

等待部署完成（约2-3分钟）

## 第六步：验证部署

1. 访问分配的域名（如：your-app.vercel.app）
2. 点击"配置"标签，确认显示"已配置"
3. 点击"市场列表"，确认显示真实市场（非模拟）
4. 检查 "isMockData: false"

## 第七步：启动交易

1. 点击"启动引擎"按钮
2. 查看实时日志
3. 监控交易执行

---

## ⚠️ 重要提醒

### 钱包资金准备

您的钱包地址（从私钥计算）：
```
需要查询钱包地址？
使用 MetaMask 导入私钥即可查看地址
```

需要准备：
- USDC: 建议 50-100 USDC（Polygon网络）
- MATIC: 建议 1-2 MATIC（用于Gas费）

### 获取测试资金

1. **USDC（Polygon）**
   - 从交易所购买并提币到 Polygon 网络
   - 或使用跨链桥

2. **MATIC（Polygon）**
   - 从交易所购买并提币
   - 或访问 Polygon 水龙头（少量测试）

---

## 🎯 部署后检查清单

- [ ] 能访问 Vercel 域名
- [ ] 配置页面显示"已配置"
- [ ] 市场列表显示真实市场
- [ ] 钱包有 USDC 和 MATIC
- [ ] 启动交易引擎成功
- [ ] 第一笔交易执行正常

---

## 🆘 遇到问题？

### 仍然显示模拟数据
→ 检查 Vercel 环境变量是否正确设置

### API 连接失败
→ 检查 API 密钥是否有效
→ 尝试重新生成 API 密钥

### 交易失败
→ 检查钱包余额
→ 检查 Gas 费是否足够

---

**准备好了吗？开始部署吧！** 🚀
