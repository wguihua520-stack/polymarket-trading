import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 允许的开发域名
  allowedDevOrigins: ['*.dev.coze.site'],
  
  // 图片配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
  
  // 输出配置 - standalone 模式优化部署大小
  output: 'standalone',
  
  // 实验性功能 - 排除大型依赖
  experimental: {
    serverComponentsExternalPackages: [
      // 区块链相关
      'ethers',
      // AWS SDK
      '@aws-sdk/client-s3',
      '@aws-sdk/lib-storage',
      // 数据库
      'pg',
      // 图像处理
      'sharp',
    ],
  },
  
  // Webpack 配置
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 排除大型可选依赖
      config.resolve.alias = {
        ...config.resolve.alias,
        // 排除不必要的模块
        'utf-8-validate': false,
        'bufferutil': false,
      };
    }
    // 忽略某些模块的警告
    config.ignoreWarnings = [
      { module: /node_modules\/ethers/ },
      { module: /node_modules\/@aws-sdk/ },
    ];
    return config;
  },
  
  // 减少构建输出
  swcMinify: true,
};

export default nextConfig;
