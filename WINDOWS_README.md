# 🚀 Windows 快速开始指南

## 📥 第一步：下载项目

### 在浏览器中访问：
```
http://localhost:5000/download.tar.gz
```

文件会自动下载到您的下载文件夹（通常是 `C:\Users\你的用户名\Downloads\`）

---

## 📦 第二步：解压文件

### Windows 10/11 自带解压：
1. 找到下载的 `download.tar.gz`
2. 右键 → **解压到当前文件夹**
3. 如果提示无法解压，继续下一步

### 安装解压工具（如果需要）：
- **7-Zip**: https://www.7-zip.org/ （免费）
- **WinRAR**: https://www.rarlab.com/ （试用）

---

## 🛠️ 第三步：安装 Node.js

1. 访问: https://nodejs.org/
2. 下载 **LTS 版本**（推荐 v20+）
3. 运行安装程序，一路 Next
4. 安装完成后，打开 **PowerShell** 或 **CMD**，验证：
   ```
   node --version
   npm --version
   ```

---

## 🚀 第四步：运行项目

### 方式1：双击运行（最简单）

1. 打开解压后的文件夹
2. 双击运行 `local-start.bat`
3. 等待安装和构建完成
4. 浏览器访问 `http://localhost:5000`

### 方式2：PowerShell 运行

```powershell
# 1. 打开 PowerShell
# 2. 导航到项目目录
cd C:\Users\你的用户名\Downloads\polymarket-arbitrage

# 3. 如果提示执行策略错误，先运行：
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# 4. 运行启动脚本
.\local-start.ps1
```

### 方式3：手动执行命令

```powershell
# 进入项目目录
cd C:\Users\你的用户名\Downloads\polymarket-arbitrage

# 安装 pnpm
npm install -g pnpm

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 启动服务
pnpm start
```

---

## ⚙️ 第五步：创建配置文件

如果启动时提示缺少 `.env.local`：

1. 在项目根目录创建文件 `.env.local`
2. 用记事本打开，粘贴以下内容：

```env
# Polymarket API 配置
POLYMARKET_API_KEY=019cc244-caab-7bf1-884e-61392538582e
POLYMARKET_API_SECRET=HS5QdfZ0Yq7kqhXLSEpy90aS6V9_liZe5OWz6PTymNY=

# 钱包私钥
WALLET_PRIVATE_KEY=0x89a07674466649a1a49b170fbf8abb5358041a70e37d8b6311216d2b33f64c93

# 策略参数
POSITION_SIZE=100
MAX_EXPOSURE=1000
```

3. 保存并关闭

---

## 🌐 第六步：访问系统

打开浏览器，访问：
```
http://localhost:5000
```

---

## 💰 准备钱包（可选）

如果需要真实交易：

### 1. 安装 MetaMask
- Chrome: https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn
- Edge: https://microsoftedge.microsoft.com/addons/detail/metamask/eblifkhkhkpngomahbflejpbnebfccah

### 2. 导入私钥
- 打开 MetaMask
- 点击右上角圆形图标
- 选择 "导入账户"
- 粘贴私钥: `0x89a07674466649a1a49b170fbf8abb5358041a70e37d8b6311216d2b33f64c93`

### 3. 切换到 Polygon 网络
- 点击网络选择器
- 添加网络 → Polygon Mainnet

### 4. 准备资金
- **USDC**: 50-100 USDC (Polygon 网络)
- **MATIC**: 1-2 MATIC (Gas 费用)

---

## ⚠️ 常见问题

### Q1: 双击 .bat 文件一闪而过
**解决**: 在 CMD 中手动运行，查看错误信息

### Q2: 提示 "pnpm 不是内部或外部命令"
**解决**: 
```powershell
npm install -g pnpm
```

### Q3: 端口 5000 被占用
**解决**:
```powershell
# 查找占用进程
netstat -ano | findstr :5000

# 结束进程（替换 PID）
taskkill /PID 进程号 /F
```

### Q4: PowerShell 执行策略错误
**解决**:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Q5: 无法访问 localhost:5000
**解决**:
1. 检查防火墙，允许 Node.js
2. 确认服务已启动（CMD 窗口未关闭）

---

## 📚 详细文档

解压后，查看以下文档：

- `WINDOWS_GUIDE.md` - Windows 完整指南
- `STRATEGY_EXPLANATION.md` - 策略详解
- `STRATEGY_VISUALIZATION.md` - 可视化流程
- `LOCAL_RUN_GUIDE.md` - 本地运行指南

---

## 🎯 完整步骤总结

1. ✅ 在浏览器下载 `download.tar.gz`
2. ✅ 解压到本地文件夹
3. ✅ 安装 Node.js (https://nodejs.org/)
4. ✅ 双击运行 `local-start.bat`
5. ✅ 访问 `http://localhost:5000`
6. ✅ 安装 MetaMask 并导入私钥（可选）
7. ✅ 准备 USDC 和 MATIC（可选）
8. ✅ 开始交易！

---

**祝您使用顺利！** 🎉
