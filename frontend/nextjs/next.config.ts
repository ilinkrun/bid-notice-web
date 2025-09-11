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
  // 개발 환경에서 크로스 오리진 요청 허용
  allowedDevOrigins: [
    'bid.ilmaceng.com',
    'https://bid.ilmaceng.com'
  ],
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
  // 웹팩 설정 추가
  webpack: (config, { isServer }) => {
    // MDEditor 관련 모듈 최적화
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        assert: false,
        buffer: false,
      };
      
      // MDEditor가 의존하는 모듈들에 대한 알리아스 설정
      config.resolve.alias = {
        ...config.resolve.alias,
        '@uiw/react-md-editor$': '@uiw/react-md-editor/lib/index.js',
      };
    }

    // CSS 로딩 최적화
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    });

    return config;
  },
}

export default nextConfig;
