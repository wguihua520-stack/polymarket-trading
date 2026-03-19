#!/bin/bash

# Polymarket 交易系统 - 本地快速启动脚本
# 使用方法: ./local-start.sh

echo "=================================="
echo "Polymarket 快速下跌对冲套利系统"
echo "=================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js
echo -e "${YELLOW}[1/6] 检查 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    echo "请安装 Node.js 20+ : https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# 检查 pnpm
echo -e "${YELLOW}[2/6] 检查 pnpm...${NC}"
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm 未安装，正在安装...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}✅ pnpm $(pnpm --version)${NC}"

# 检查 .env.local
echo -e "${YELLOW}[3/6] 检查配置文件...${NC}"
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local 不存在${NC}"
    echo ""
    echo "请创建配置文件："
    echo ""
    echo "cat > .env.local << 'EOF'"
    echo "POLYMARKET_API_KEY=your_api_key"
    echo "POLYMARKET_API_SECRET=your_api_secret"
    echo "WALLET_PRIVATE_KEY=your_private_key"
    echo "EOF"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ 配置文件已存在${NC}"

# 设置权限
chmod 600 .env.local

# 安装依赖
echo -e "${YELLOW}[4/6] 安装依赖...${NC}"
pnpm install
echo -e "${GREEN}✅ 依赖安装完成${NC}"

# 构建项目
echo -e "${YELLOW}[5/6] 构建项目...${NC}"
pnpm build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 构建完成${NC}"

# 启动服务
echo -e "${YELLOW}[6/6] 启动服务...${NC}"
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🚀 服务即将启动！${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "访问地址: http://localhost:5000"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

pnpm start
