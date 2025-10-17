import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Server-side env vars
    BE_NODEJS_PORT: process.env.BE_NODEJS_PORT,
    API_GRAPHQL_PORT: process.env.API_GRAPHQL_PORT,
    API_REST_PORT: process.env.API_REST_PORT,

    // Make them available on client-side by re-exporting with NEXT_PUBLIC_ prefix
    NEXT_PUBLIC_BE_NODEJS_PORT: process.env.BE_NODEJS_PORT,
    NEXT_PUBLIC_API_GRAPHQL_PORT: process.env.API_GRAPHQL_PORT,
    NEXT_PUBLIC_API_REST_PORT: process.env.API_REST_PORT,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === 'true',
  },
  reactStrictMode: true,
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

    // Ignore node_modules from file watching
    config.watchOptions = {
      ...config.watchOptions,
      ignored: /node_modules/,
      aggregateTimeout: 300,
      poll: 1000,
    };

    return config;
  },
};

export default nextConfig;