# 手动创建项目指南

由于您在本地 Windows 无法访问沙箱环境，请按以下步骤手动创建项目。

## 第一步：创建项目目录

在 Windows 上创建文件夹：
```
C:\projects\polymarket-trading
```

或者在任意位置创建，比如桌面：
```
C:\Users\你的用户名\Desktop\polymarket-trading
```

## 第二步：创建基础配置文件

在项目根目录创建以下文件：

### 1. package.json
创建文件 `package.json`，内容见下一个文件

### 2. tsconfig.json
创建文件 `tsconfig.json`，内容见后续文件

### 3. .env.local
创建文件 `.env.local`，内容见后续文件

### 4. next.config.ts
创建文件 `next.config.ts`，内容见后续文件

## 第三步：创建目录结构

创建以下文件夹结构：
```
polymarket-trading/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── engine/
│   │   │   │   ├── start/
│   │   │   │   ├── stop/
│   │   │   │   └── status/
│   │   │   ├── markets/
│   │   │   └── config/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── dashboard/
│   │   └── ui/
│   ├── lib/
│   ├── config/
│   └── types/
└── public/
```

## 第四步：复制文件内容

我会逐个输出每个文件的完整内容，您需要：
1. 创建对应的文件
2. 复制粘贴内容
3. 保存文件

## 预计需要创建的文件数量

核心文件（必须）：
- 配置文件：4个
- 类型定义：1个
- 核心库：4个
- API路由：6个
- 页面组件：10个

总计约 25 个核心文件。

## 开始创建

请回复 "开始"，我将逐个输出文件内容。
每输出一个文件，我会标注：
```
文件路径: src/types/trading.ts
```

您按照路径创建文件并复制内容即可。

## 预计时间

- 创建目录结构：2分钟
- 复制粘贴文件：15-20分钟
- 安装依赖运行：5分钟

总计约 25-30 分钟即可完成。

---

准备好后，请回复 "开始"！
