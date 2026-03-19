#!/bin/bash

# Polymarket API 配置向导
# 帮助用户快速配置 API 密钥

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      Polymarket 快速下跌对冲套利系统 - API 配置向导         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否已有配置文件
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  检测到已存在 .env.local 文件${NC}"
    read -p "是否要覆盖现有配置？(y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消配置"
        exit 0
    fi
    # 备份现有配置
    cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✓ 已备份现有配置${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 1/3: 获取 API 密钥${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "如果您还没有 Polymarket API 密钥，请按以下步骤获取："
echo ""
echo "1. 访问 Polymarket Developer Portal:"
echo "   ${BLUE}https://docs.polymarket.com/${NC}"
echo ""
echo "2. 登录您的 Polymarket 账户"
echo ""
echo "3. 点击 'Get API Keys' 或 'Developer Portal'"
echo ""
echo "4. 创建新的 API 密钥，会获得："
echo "   • API Key (公钥)"
echo "   • API Secret (私钥)"
echo ""
echo -e "${YELLOW}⚠️  重要：API Secret 只会显示一次，请立即保存！${NC}"
echo ""
read -p "按 Enter 键继续..."

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 2/3: 准备钱包私钥${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⚠️  安全警告：${NC}"
echo "• 使用专用的交易钱包（不要用主钱包）"
echo "• 推荐使用 Safe 多签钱包增加安全性"
echo "• 私钥泄露会导致资金损失！"
echo ""
echo "从 MetaMask 导出私钥："
echo "1. 打开 MetaMask"
echo "2. 点击账户头像 → 账户详情"
echo "3. 点击 '导出私钥'"
echo "4. 输入密码确认"
echo "5. 复制私钥"
echo ""
read -p "按 Enter 键继续..."

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 3/3: 输入配置信息${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 输入 API Key
while true; do
    echo -e "${GREEN}请输入 Polymarket API Key:${NC}"
    read -p "> " API_KEY
    if [ -z "$API_KEY" ]; then
        echo -e "${RED}❌ API Key 不能为空${NC}"
    else
        break
    fi
done

# 输入 API Secret
while true; do
    echo ""
    echo -e "${GREEN}请输入 Polymarket API Secret:${NC}"
    read -p "> " API_SECRET
    if [ -z "$API_SECRET" ]; then
        echo -e "${RED}❌ API Secret 不能为空${NC}"
    else
        break
    fi
done

# 输入钱包私钥
while true; do
    echo ""
    echo -e "${GREEN}请输入钱包私钥:${NC}"
    read -p "> " PRIVATE_KEY
    if [ -z "$PRIVATE_KEY" ]; then
        echo -e "${RED}❌ 钱包私钥不能为空${NC}"
    else
        break
    fi
done

# 可选参数
echo ""
echo -e "${YELLOW}可选参数（直接按 Enter 使用默认值）:${NC}"
echo ""

read -p "每次交易金额 (USDC) [默认: 100]: " POSITION_SIZE
POSITION_SIZE=${POSITION_SIZE:-100}

read -p "单市场最大暴露 (USDC) [默认: 1000]: " MAX_EXPOSURE
MAX_EXPOSURE=${MAX_EXPOSURE:-1000}

# 生成 .env.local 文件
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}正在生成配置文件...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cat > .env.local << EOF
# Polymarket API 配置
POLYMARKET_API_KEY=${API_KEY}
POLYMARKET_API_SECRET=${API_SECRET}

# 钱包私钥
WALLET_PRIVATE_KEY=${PRIVATE_KEY}

# 策略参数
POSITION_SIZE=${POSITION_SIZE}
MAX_EXPOSURE=${MAX_EXPOSURE}

# 环境
NODE_ENV=production
EOF

# 设置文件权限
chmod 600 .env.local

echo -e "${GREEN}✅ 配置文件已创建: .env.local${NC}"
echo ""

# 验证配置
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}配置验证${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "✓ POLYMARKET_API_KEY: 已设置"
echo "✓ POLYMARKET_API_SECRET: 已设置"
echo "✓ WALLET_PRIVATE_KEY: 已设置"
echo "✓ POSITION_SIZE: ${POSITION_SIZE} USDC"
echo "✓ MAX_EXPOSURE: ${MAX_EXPOSURE} USDC"
echo ""

# 完成提示
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  ✅ 配置完成！                              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "下一步操作："
echo ""
echo "1. 重启服务："
echo "   ${BLUE}pnpm dev${NC}"
echo ""
echo "2. 访问监控面板验证配置："
echo "   ${BLUE}https://你的域名${NC}"
echo ""
echo "3. 检查 '配置' 页面是否显示 '已配置'"
echo ""
echo "4. 检查 '市场列表' 是否显示真实市场数据"
echo ""
echo -e "${YELLOW}⚠️  重要安全提示：${NC}"
echo "• .env.local 文件已被添加到 .gitignore"
echo "• 永远不要将此文件提交到 Git"
echo "• 建议定期轮换 API 密钥"
echo "• 首次使用请用小额资金测试"
echo ""
