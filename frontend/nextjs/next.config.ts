import type { NextConfig } from "next";

const nextConfig = {
  // reactStrictMode: true,
  typescript: {
    // 빌드 시 타입 에러를 무시합니다
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint 에러도 무시하려면 (선택사항)
    ignoreDuringBuilds: true,
  },
}

export default nextConfig;
