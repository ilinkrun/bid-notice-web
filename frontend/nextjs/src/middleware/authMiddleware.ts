import { NextRequest, NextResponse } from 'next/server';

// 보호된 경로 정의
const PROTECTED_ROUTES = [
  '/profile',
  '/mybids',
  '/statistics', 
  '/channels',
  '/settings'
];

// 역할별 접근 가능한 경로
const ROLE_ROUTES = {
  guest: [
    '/',
    '/login',
    '/notices'
  ],
  viewer: [
    '/',
    '/login', 
    '/profile',
    '/notices',
    '/mybids',
    '/statistics/notice',
    '/statistics/logs_access',
    '/channels/board/manual'
  ],
  user: [
    '/',
    '/login',
    '/profile', 
    '/notices',
    '/mybids',
    '/statistics/notice',
    '/statistics/logs_access',
    '/channels/board/op',
    '/channels/board/manual'
  ],
  manager: [
    '/',
    '/login',
    '/profile',
    '/notices',
    '/mybids', 
    '/statistics',
    '/channels',
    '/settings/category',
    '/settings/default'
  ],
  admin: ['*'] // 모든 경로 접근 가능
};

// 경로 매칭 함수
const matchPath = (pattern: string, path: string): boolean => {
  if (pattern === '*') return true;
  if (pattern.endsWith('**')) {
    const basePattern = pattern.replace('/**', '').replace('**', '');
    return path === basePattern || path.startsWith(basePattern + '/');
  }
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(path);
  }
  return pattern === path || path.startsWith(pattern + '/');
};

// 토큰에서 사용자 역할 추출 (실제로는 GraphQL을 통해 검증해야 하지만, 여기서는 간단히 구현)
const getUserRoleFromToken = async (token: string): Promise<string> => {
  try {
    // 실제 환경에서는 GraphQL API를 호출하여 토큰을 검증하고 사용자 역할을 가져와야 함
    // 여기서는 localStorage나 쿠키에서 임시로 가져오는 방식으로 구현
    return 'guest'; // 기본값
  } catch (error) {
    return 'guest';
  }
};

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 정적 파일과 API 경로는 스킵
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 토큰 확인
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  let userRole = 'guest';

  if (token) {
    userRole = await getUserRoleFromToken(token);
  }

  // 사용자 역할에 따른 접근 권한 확인
  const allowedRoutes = ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES] || ROLE_ROUTES.guest;
  
  const hasAccess = allowedRoutes.some(route => matchPath(route, pathname));

  if (!hasAccess) {
    // 접근 권한이 없는 경우
    if (userRole === 'guest') {
      // 게스트 사용자는 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/login', request.url));
    } else {
      // 로그인한 사용자는 홈페이지로 리다이렉트
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 접근 권한이 있는 경우 계속 진행
  return NextResponse.next();
}