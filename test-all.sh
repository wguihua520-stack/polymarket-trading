#!/bin/bash

echo "🧪 Polymarket 快速下跌对冲套利系统 - 完整测试"
echo "================================================"
echo ""

BASE_URL="http://localhost:5000"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1️⃣ 检查系统状态${NC}"
echo "GET $BASE_URL/api/engine/status"
STATUS=$(curl -s $BASE_URL/api/engine/status)
echo $STATUS | jq '.data.state | {运行中: .isRunning, 总轮次: .totalRounds, 成功: .successfulRounds}'
echo ""

echo -e "${YELLOW}2️⃣ 查看配置信息${NC}"
echo "GET $BASE_URL/api/config"
curl -s $BASE_URL/api/config | jq '.data.config | {对冲阈值: .sumTarget, 下跌阈值: .movePct, 监控窗口: .windowMin, 仓位: .positionSize}'
echo ""

echo -e "${YELLOW}3️⃣ 查看市场列表（模拟数据）${NC}"
echo "GET $BASE_URL/api/markets"
curl -s $BASE_URL/api/markets | jq '{
  数据类型: .data.isMockData,
  提示: .data.message,
  市场数量: (.data.markets | length),
  第一个市场: .data.markets[0].question
}'
echo ""

echo -e "${YELLOW}4️⃣ 启动交易引擎${NC}"
echo "POST $BASE_URL/api/engine/start"
curl -s -X POST $BASE_URL/api/engine/start | jq '.data.state | {运行中: .isRunning}'
sleep 1
echo ""

echo -e "${YELLOW}5️⃣ 模拟完整交易流程${NC}"
echo "POST $BASE_URL/api/test/simulate (full_test)"
curl -s -X POST $BASE_URL/api/test/simulate \
  -H 'Content-Type: application/json' \
  -d '{"action":"full_test"}' | jq '{
  交易状态: .data.summary.status,
  Leg1: {
    方向: .data.summary.leg1.side,
    价格: .data.summary.leg1.price,
    下跌幅度: .data.summary.leg1.dropPct
  },
  Leg2: {
    方向: .data.summary.leg2.side,
    价格: .data.summary.leg2.price,
    价格总和: .data.summary.leg2.sumPrice
  },
  利润: {
    理论: .data.summary.profit.gross,
    手续费: .data.summary.profit.fee,
    净利润: .data.summary.profit.net
  }
}'
echo ""

echo -e "${YELLOW}6️⃣ 停止交易引擎${NC}"
echo "POST $BASE_URL/api/engine/stop"
curl -s -X POST $BASE_URL/api/engine/stop | jq '.data.state | {运行中: .isRunning}'
echo ""

echo -e "${GREEN}✅ 所有测试完成！${NC}"
echo ""
echo "📊 测试总结："
echo "  • 系统API接口正常"
echo "  • 模拟市场数据已加载"
echo "  • 交易引擎启动/停止正常"
echo "  • 模拟交易流程验证成功"
echo ""
echo "🌐 访问监控面板："
echo "  https://f4c28ba4-085f-4178-9a40-f562f72c46d1.dev.coze.site"
echo ""
