# 部署到 Vercel 指南

## 方法一：GitHub 导入（推荐）

### 步骤 1：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 创建新仓库，例如 `polymarket-trading`
3. **不要**勾选 "Add a README file"

### 步骤 2：推送代码到 GitHub

在沙箱环境执行以下命令：

```bash
cd /workspace/projects

# 添加远程仓库（替换为你的用户名）
git remote add origin https://github.com/你的用户名/polymarket-trading.git

# 推送代码
git push -u origin main
```

或者如果你使用 SSH：
```bash
git remote add origin git@github.com:你的用户名/polymarket-trading.git
git push -u origin main
```

### 步骤 3：导入到 Vercel

1. 访问 https://vercel.com/new
2. 选择 "Import Git Repository"
3. 选择你刚创建的 `polymarket-trading` 仓库
4. 点击 Import

### 步骤 4：配置环境变量

在 Vercel 部署页面：

1. 展开 "Environment Variables"
2. 添加以下变量：

| Name | Value |
|------|-------|
| `WALLET_PRIVATE_KEY` | 你的钱包私钥（不带0x） |
| `POLYMARKET_API_KEY` | Polymarket API Key |
| `POLYMARKET_API_SECRET` | Polymarket API Secret |
| `POSITION_SIZE` | 1 |
| `MAX_EXPOSURE` | 100 |

### 步骤 5：部署

点击 "Deploy" 按钮，等待部署完成。

---

## 方法二：下载代码本地部署

### 步骤 1：下载项目代码

在 Windows PowerShell 执行：

```powershell
# 创建项目目录
mkdir C:\projects\polymarket-trading
cd C:\projects\polymarket-trading

# 初始化 Git
git init

# 从沙箱克隆（如果有远程仓库）
# 或者手动复制文件
```

### 步骤 2：安装依赖

```powershell
npm install -g pnpm
pnpm install
```

### 步骤 3：创建 .env 文件

创建 `.env` 文件：
```
WALLET_PRIVATE_KEY=你的私钥
POLYMARKET_API_KEY=你的API_Key
POLYMARKET_API_SECRET=你的API_Secret
```

### 步骤 4：部署到 Vercel

```powershell
vercel --prod
```

---

## 验证部署

部署完成后访问：
```
https://你的项目名.vercel.app/api/status
```

预期响应：
```json
{
  "success": true,
  "data": {
    "mode": "production",
    "connectivity": { "reachable": true },
    "config": { "isConfigured": true },
    "wallet": { "connected": true }
  }
}
```

---

## 常见问题

### Q: 推送到 GitHub 失败？
需要先配置 GitHub 认证：
```bash
git config --global user.email "你的邮箱"
git config --global user.name "你的名字"
```

### Q: Vercel 部署失败？
检查 `.vercelignore` 文件，确保没有忽略必要文件。

### Q: 环境变量不生效？
在 Vercel Dashboard → Settings → Environment Variables 中检查。
