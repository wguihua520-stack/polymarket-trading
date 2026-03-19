#!/bin/bash

# 快速查看系统状态
# 使用方法: ./check-status.sh

echo "================================"
echo "比特币15分钟涨跌预测系统状态"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[1] 引擎状态${NC}"
curl -s http://localhost:5000/api/engine/status | jq '{
  运行状态: .data.state.isRunning,
  总轮次: .data.state.totalRounds,
  成功轮次: .data.state.successfulRounds,
  失败轮次: .data.state.failedRounds,
  总利润: .data.state.totalProfit,
  总亏损: .data.state.totalLoss
}' 2>/dev/null || echo "引擎未响应"
echo ""

echo -e "${BLUE}[2] 当前市场${NC}"
curl -s http://localhost:5000/api/markets | jq '.data.markets[0:3][] | {
  问题: .question,
  YES价格: .yesPrice,
  NO价格: .noPrice,
  价差: .spread,
  流动性: .liquidity
}' 2>/dev/null || echo "市场未响应"
echo ""

echo -e "${BLUE}[3] 配置信息${NC}"
curl -s http://localhost:5000/api/config | jq '{
  API密钥: .data.hasApiKey,
  API密钥密文: .data.hasApiSecret,
  钱包私钥: .data.hasWalletKey,
  仓位大小: .data.positionSize,
  最大暴露: .data.maxExposure
}' 2>/dev/null || echo "配置未响应"
echo ""

echo -e "${BLUE}[4] 最新日志 (最近5条)${NC}"
curl -s http://localhost:5000/api/engine/status | jq '.data.recentLogs[-5:][] | {
  时间: .timestamp,
  级别: .level,
  分类: .category,
  消息: .message
}' 2>/dev/null || echo "日志未响应"
echo ""

echo "================================"
echo "系统访问地址: http://localhost:5000"
echo "================================"
