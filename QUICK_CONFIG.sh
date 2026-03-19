#!/bin/bash

# 测试 API 配置
# 用于验证 API 密钥是否正确配置

echo "🔍 检查 Polymarket API 配置状态..."
echo ""

# 检查环境变量
HAS_API_KEY=${POLYMARKET_API_KEY:+true}
HAS_API_SECRET=${POLYMARKET_API_SECRET:+true}
HAS_PRIVATE_KEY=${WALLET_PRIVATE_KEY:+true}

if [ "$HAS_API_KEY" ] && [ "$HAS_API_SECRET" ] && [ "$HAS_PRIVATE_KEY" ]; then
    echo "✅ 环境变量已设置"
    echo ""
    echo "  POLYMARKET_API_KEY: ${POLYMARKET_API_KEY:0:10}..."
    echo "  POLYMARKET_API_SECRET: ${POLYMARKET_API_SECRET:0:10}..."
    echo "  WALLET_PRIVATE_KEY: ${WALLET_PRIVATE_KEY:0:10}..."
    echo ""
elif [ -f ".env.local" ]; then
    echo "✅ 检测到 .env.local 文件"
    echo ""
    echo "文件内容预览:"
    echo "---"
    grep -E "^(POLYMARKET|WALLET|POSITION|MAX_EXPOSURE)" .env.local | sed 's/=.*/=***/'
    echo "---"
    echo ""
else
    echo "❌ 未检测到 API 配置"
    echo ""
    echo "请使用以下任一方式配置："
    echo ""
    echo "方式1: 运行配置向导"
    echo "  ./setup-api.sh"
    echo ""
    echo "方式2: 创建 .env.local 文件"
    echo "  cp .env.example .env.local"
    echo "  # 然后编辑 .env.local 填入您的密钥"
    echo ""
    echo "方式3: 设置环境变量"
    echo "  export POLYMARKET_API_KEY=your_key"
    echo "  export POLYMARKET_API_SECRET=your_secret"
    echo "  export WALLET_PRIVATE_KEY=your_key"
    echo ""
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 API 连接..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 测试市场API
RESPONSE=$(curl -s -w "\n%{http_code}" "https://gamma-api.polymarket.com/markets?limit=1&active=true")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API 连接成功"
    echo ""
    echo "市场数据示例:"
    echo "$BODY" | jq '.[0] | {question: .question, id: .id}' 2>/dev/null || echo "$BODY"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ 配置验证成功！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "下一步："
    echo "1. 重启服务: pnpm dev"
    echo "2. 访问监控面板"
    echo "3. 检查市场列表是否显示真实数据"
else
    echo "❌ API 连接失败 (HTTP $HTTP_CODE)"
    echo ""
    echo "可能的原因："
    echo "• API 密钥无效或已过期"
    echo "• 网络连接问题"
    echo "• API 服务暂时不可用"
    echo ""
    echo "请检查您的配置并重试"
fi
