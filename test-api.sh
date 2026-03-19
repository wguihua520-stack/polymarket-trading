#!/bin/bash

echo "🧪 Polymarket 快速下跌对冲套利系统 - API测试脚本"
echo "================================================"
echo ""

BASE_URL="https://f4c28ba4-085f-4178-9a40-f562f72c46d1.dev.coze.site"

echo "1️⃣ 查看系统状态"
echo "GET $BASE_URL/api/engine/status"
curl -s $BASE_URL/api/engine/status | jq '.data.state | {isRunning, totalRounds}'
echo ""

echo "2️⃣ 查看配置信息"
echo "GET $BASE_URL/api/config"
curl -s $BASE_URL/api/config | jq '.data.config | {sumTarget, movePct, windowMin, positionSize}'
echo ""

echo "3️⃣ 启动交易引擎"
echo "POST $BASE_URL/api/engine/start"
curl -s -X POST $BASE_URL/api/engine/start | jq '.data.state | {isRunning}'
echo ""

echo "4️⃣ 模拟交易测试"
echo "POST $BASE_URL/api/test/simulate (full_test)"
curl -s -X POST $BASE_URL/api/test/simulate \
  -H 'Content-Type: application/json' \
  -d '{"action":"full_test"}' | jq '.data.summary'
echo ""

echo "5️⃣ 停止交易引擎"
echo "POST $BASE_URL/api/engine/stop"
curl -s -X POST $BASE_URL/api/engine/stop | jq '.data.state | {isRunning}'
echo ""

echo "✅ 测试完成！"
