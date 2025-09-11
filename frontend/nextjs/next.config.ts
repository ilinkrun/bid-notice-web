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
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  // API 라우트의 요청 크기 제한 설정
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
}

export default nextConfig;
