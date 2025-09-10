/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // reactStrictMode: true,
  typescript: {
    // 빌드 시 타입 에러를 무시합니다
    ignoreBuildErrors: true,
  },
  // ESLint 검사 비활성화
  eslint: {
    ignoreDuringBuilds: true,
  },
  // hydration 경고 무시
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // 추가 설정
  experimental: {
    optimizeCss: false,
  },
  // Next.js 로고 비활성화
  devIndicators: false,
  // Cross-origin 요청 허용
  allowedDevOrigins: ['1.231.118.217:11501'],
  async headers() {
    return [
      {
        source: '/_next/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.module.rules.push({
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
        },
      });
    }
    return config;
  },
};

export default nextConfig;
