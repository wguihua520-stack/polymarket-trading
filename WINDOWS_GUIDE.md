# Windows 系统完整操作指南

## 📥 第一步：下载项目

### 方式1：浏览器直接下载（推荐）

1. 打开浏览器（Chrome/Edge/Firefox）
2. 在地址栏输入：
   ```
   http://localhost:5000/download.tar.gz
   ```
3. 按回车，文件会自动下载
4. 默认保存位置：`C:\Users\你的用户名\Downloads\download.tar.gz`

### 方式2：从项目目录复制

如果您能访问项目文件夹：
1. 找到项目根目录
2. 复制文件 `polymarket-trading-complete.tar.gz`
3. 粘贴到您的电脑

---

## 📦 第二步：解压项目

### Windows 10/11 自带解压

1. 找到下载的 `download.tar.gz` 文件
2. 右键 → **解压到当前文件夹**
3. 如果无法解压，继续下一步

### 安装解压工具（如果需要）

**选项1：7-Zip（免费）**
```
1. 访问: https://www.7-zip.org/download.html
2. 下载 7-Zip for Windows
3. 安装后，右键文件 → 7-Zip → 解压
```

**选项2：WinRAR**
```
1. 访问: https://www.rarlab.com/download.htm
2. 下载 WinRAR for Windows
3. 安装后，右键文件 → 解压文件
```

### 使用 PowerShell 解压

```powershell
# 打开 PowerShell（以管理员身份）
# 导航到下载目录
cd $env:USERPROFILE\Downloads

# 使用 tar 命令解压（Windows 10 1803+）
tar -xzf download.tar.gz

# 或者使用 Expand-Archive
Expand-Archive -Path download.tar.gz -DestinationPath .\polymarket
```

---

## 🛠️ 第三步：安装运行环境

### 1. 安装 Node.js

**下载地址**: https://nodejs.org/

**安装步骤**:
```
1. 访问 Node.js 官网
2. 下载 LTS 版本（长期支持版，推荐 v20+）
3. 运行安装程序
4. 勾选 "Automatically install the necessary tools" 
5. 一路 Next 完成安装
```

**验证安装**:
```powershell
# 打开 PowerShell
node --version
# 应显示: v20.x.x

npm --version
# 应显示: 10.x.x
```

### 2. 安装 pnpm

```powershell
# 在 PowerShell 中执行
npm install -g pnpm

# 验证安装
pnpm --version
# 应显示: 9.x.x
```

---

## 🚀 第四步：运行项目

### 1. 打开项目目录

```powershell
# 在 PowerShell 中导航到解压后的目录
cd C:\Users\你的用户名\Downloads\polymarket-arbitrage
```

### 2. 创建配置文件

在项目根目录创建文件 `.env.local`：

```powershell
# 使用记事本创建
notepad .env.local
```

**复制以下内容到记事本**:
```env
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
```

保存并关闭记事本。

### 3. 运行启动脚本

```powershell
# 方式1：使用 PowerShell 脚本
.\local-start.ps1

# 方式2：如果脚本无法执行，手动执行命令
pnpm install
pnpm build
pnpm start
```

### 4. 如果脚本执行权限错误

```powershell
# 允许执行脚本
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# 然后再运行
.\local-start.ps1
```

---

## 🌐 第五步：访问系统

打开浏览器，访问：
```
http://localhost:5000
```

您应该能看到：
- ✅ 监控面板
- ✅ 市场列表
- ✅ 配置信息
- ✅ 实时日志

---

## 💰 第六步：准备钱包

### 1. 安装 MetaMask

```
1. 访问: https://metamask.io/
2. 下载 Chrome/Edge 扩展
3. 创建或导入钱包
```

### 2. 导入私钥

```
1. 打开 MetaMask
2. 点击右上角圆形图标
3. 选择 "导入账户"
4. 粘贴私钥: 0x89a07674466649a1a49b170fbf8abb5358041a70e37d8b6311216d2b33f64c93
5. 点击 "导入"
```

### 3. 切换到 Polygon 网络

```
1. MetaMask 顶部网络选择器
2. 添加网络 → Polygon Mainnet
3. 或使用 Chain ID: 137
```

### 4. 准备资金

**USDC（Polygon网络）**:
- 建议金额: 50-100 USDC
- 用途: 交易本金

**MATIC（Polygon网络）**:
- 建议金额: 1-2 MATIC
- 用途: Gas 费用

**获取方式**:
```
1. 从交易所购买 USDC 和 MATIC
2. 提币到 Polygon 网络
3. 粘贴您的钱包地址
```

---

## ⚠️ 常见问题

### 问题1：pnpm 命令找不到

```powershell
# 重新安装 pnpm
npm install -g pnpm

# 如果还不行，使用 npm
npm install
npm run build
npm start
```

### 问题2：端口 5000 被占用

```powershell
# 查找占用端口的进程
netstat -ano | findstr :5000

# 结束进程（PID 是上面命令显示的最后一列数字）
taskkill /PID 进程号 /F

# 或者使用其他端口
$env:PORT=3000; pnpm start
```

### 问题3：无法访问 localhost:5000

```powershell
# 检查防火墙
# 允许 Node.js 通过防火墙

# 检查服务是否启动
netstat -ano | findstr :5000
# 应该显示 LISTENING
```

### 问题4：构建失败

```powershell
# 清理并重新安装
Remove-Item -Recurse -Force node_modules
Remove-Item -Force pnpm-lock.yaml
pnpm install
pnpm build
```

### 问题5：PowerShell 编码问题

```powershell
# 设置 UTF-8 编码
chcp 65001

# 或使用 CMD
cmd
```

---

## 🔧 高级配置

### 使用 PM2 后台运行（可选）

```powershell
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start "pnpm start" --name "trading-bot"

# 查看状态
pm2 status

# 查看日志
pm2 logs trading-bot

# 开机自启
pm2 save
pm2-startup
```

### 创建桌面快捷方式

1. 右键桌面 → 新建 → 快捷方式
2. 输入路径: `http://localhost:5000`
3. 命名: "Polymarket Trading"

---

## 📊 验证清单

安装完成后，请验证：

- [ ] Node.js 已安装（`node --version`）
- [ ] pnpm 已安装（`pnpm --version`）
- [ ] 项目已解压
- [ ] .env.local 已创建
- [ ] 依赖已安装（`pnpm install`）
- [ ] 项目已构建（`pnpm build`）
- [ ] 服务已启动（`pnpm start`）
- [ ] 浏览器可访问 `http://localhost:5000`
- [ ] MetaMask 已安装
- [ ] 私钥已导入
- [ ] Polygon 网络已配置
- [ ] 钱包已有 USDC 和 MATIC

---

## 🆘 需要帮助？

如果遇到问题：

1. **截图错误信息**
2. **检查日志**: 查看终端输出的错误
3. **验证配置**: 确认 .env.local 文件内容正确
4. **检查网络**: 确认可以访问互联网

**常用检查命令**:
```powershell
# 检查 Node.js
node --version

# 检查 pnpm
pnpm --version

# 检查项目文件
dir

# 检查配置文件
type .env.local

# 测试网络连接
Test-NetConnection polymarket.com -Port 443
```

---

## 📚 相关资源

- **Node.js**: https://nodejs.org/
- **pnpm**: https://pnpm.io/
- **MetaMask**: https://metamask.io/
- **Polygon**: https://polygon.technology/
- **Polymarket**: https://polymarket.com/

---

**按照以上步骤，您就可以在 Windows 上成功运行系统了！** 🚀
