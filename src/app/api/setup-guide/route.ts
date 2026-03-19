import { NextRequest, NextResponse } from 'next/server';

/**
 * Polymarket API 设置向导
 * 帮助用户快速配置 API 密钥
 */
export async function GET(request: NextRequest) {
  const guide = {
    title: "Polymarket API 配置指南",
    steps: [
      {
        step: 1,
        title: "注册 Polymarket 账户",
        description: "如果还没有账户，需要先注册",
        actions: [
          "访问 https://polymarket.com/",
          "点击右上角 'Sign In'",
          "连接您的 Web3 钱包（MetaMask 等）"
        ],
        link: "https://polymarket.com/"
      },
      {
        step: 2,
        title: "获取 API 密钥",
        description: "从开发者门户获取 API 密钥",
        actions: [
          "访问 https://docs.polymarket.com/",
          "点击 'Get API Keys' 或 'Developer Portal'",
          "创建新的 API 密钥",
          "保存 API Key 和 API Secret"
        ],
        link: "https://docs.polymarket.com/",
        important: "⚠️ API Secret 只会显示一次，请妥善保存！"
      },
      {
        step: 3,
        title: "准备钱包私钥",
        description: "用于签署交易的私钥",
        actions: [
          "建议使用专用的交易钱包（不要用主钱包）",
          "推荐使用 Safe 多签钱包增加安全性",
          "从 MetaMask 导出私钥：账户详情 → 导出私钥"
        ],
        warning: "🔒 私钥泄露会导致资金损失！请务必保管好！"
      },
      {
        step: 4,
        title: "配置环境变量",
        description: "在项目中设置 API 密钥",
        actions: [
          "在项目根目录创建 .env.local 文件",
          "复制 .env.example 的内容",
          "填入您的 API 密钥和私钥",
          "重启服务"
        ],
        envTemplate: `# Polymarket API 配置
POLYMARKET_API_KEY=your_api_key_here
POLYMARKET_API_SECRET=your_api_secret_here

# 钱包私钥
WALLET_PRIVATE_KEY=your_wallet_private_key_here

# 策略参数（可选）
POSITION_SIZE=100
MAX_EXPOSURE=1000`
      }
    ],
    security: [
      "永远不要将 .env.local 文件提交到 Git",
      "使用专用钱包，不要用主钱包",
      "定期轮换 API 密钥",
      "设置合理的仓位大小",
      "先用小额资金测试"
    ],
    nextSteps: [
      "配置完成后重启服务",
      "访问监控面板验证配置",
      "检查市场列表是否显示真实数据",
      "小额测试交易流程"
    ]
  };

  return NextResponse.json({
    success: true,
    data: guide
  });
}

/**
 * 验证 API 配置
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, apiSecret, privateKey } = body;

    const results = {
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      hasPrivateKey: !!privateKey,
      validation: [] as string[]
    };

    if (!apiKey) {
      results.validation.push("❌ 缺少 POLYMARKET_API_KEY");
    } else {
      results.validation.push("✅ POLYMARKET_API_KEY 已设置");
    }

    if (!apiSecret) {
      results.validation.push("❌ 缺少 POLYMARKET_API_SECRET");
    } else {
      results.validation.push("✅ POLYMARKET_API_SECRET 已设置");
    }

    if (!privateKey) {
      results.validation.push("❌ 缺少 WALLET_PRIVATE_KEY");
    } else {
      results.validation.push("✅ WALLET_PRIVATE_KEY 已设置");
    }

    const isValid = results.hasApiKey && results.hasApiSecret && results.hasPrivateKey;

    return NextResponse.json({
      success: true,
      data: {
        isValid,
        results,
        message: isValid 
          ? "✅ 所有配置项已设置，请重启服务" 
          : "⚠️ 部分配置项缺失，请完善配置"
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
