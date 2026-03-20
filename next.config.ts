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
  
  // 服务端外部包（Next.js 16 新语法）
  serverExternalPackages: ['ethers'],
  
  // Turbopack 配置（Next.js 16 默认）
  turbopack: {},
};

export default nextConfig;
