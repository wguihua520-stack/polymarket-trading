#!/bin/bash

# 快速配置脚本 - 从剪贴板或参数读取配置

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Polymarket API 快速配置工具                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 检查参数
if [ "$#" -ge 3 ]; then
    API_KEY=$1
    API_SECRET=$2
    PRIVATE_KEY=$3
    POSITION_SIZE=${4:-100}
    MAX_EXPOSURE=${5:-1000}
    
    echo "✓ 从参数读取配置"
else
    echo "使用方法:"
    echo "  ./configure-env.sh <API_KEY> <API_SECRET> <PRIVATE_KEY> [POSITION_SIZE] [MAX_EXPOSURE]"
    echo ""
    echo "示例:"
    echo "  ./configure-env.sh abc123 def456 0x123... 100 1000"
    echo ""
    echo "或使用交互式配置："
    echo "  ./setup-api.sh"
    exit 1
fi

# 创建配置文件
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

chmod 600 .env.local

echo ""
echo "✅ 配置文件已创建: .env.local"
echo ""
echo "配置内容："
echo "  • API_KEY: ${API_KEY:0:10}..."
echo "  • API_SECRET: ${API_SECRET:0:10}..."
echo "  • PRIVATE_KEY: ${PRIVATE_KEY:0:10}..."
echo "  • POSITION_SIZE: ${POSITION_SIZE} USDC"
echo "  • MAX_EXPOSURE: ${MAX_EXPOSURE} USDC"
echo ""
echo "下一步：重启服务 (pnpm dev)"
