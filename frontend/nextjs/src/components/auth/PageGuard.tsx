'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

interface PageGuardProps {
  children: React.ReactNode;
}

interface AccessCheckResult {
  hasAccess: boolean;
  role: string;
  message: string;
  redirectTo?: string;
}

export const PageGuard: React.FC<PageGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { checkPageAccess, isLoading: permLoading } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  
  const [accessResult, setAccessResult] = useState<AccessCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading || permLoading) return;
      
      // 정적 파일, 업로드 파일, API 경로는 권한 검사에서 제외
      const staticPaths = [
        '/uploads/',
        '/images/',
        '/_next/',
        '/api/',
        '/favicon',
        '/robots.txt',
        '/sitemap.xml'
      ];
      
      const isStaticPath = staticPaths.some(path => pathname.startsWith(path)) || 
                          pathname.includes('.png') ||
                          pathname.includes('.jpg') ||
                          pathname.includes('.jpeg') ||
                          pathname.includes('.gif') ||
                          pathname.includes('.svg') ||
                          pathname.includes('.ico') ||
                          pathname.includes('.pdf') ||
                          pathname.includes('.xlsx') ||
                          pathname.includes('.docx');
      
      if (isStaticPath) {
        setAccessResult({ hasAccess: true, role: 'guest', message: '정적 파일 접근' });
        setIsChecking(false);
        return;
      }
      
      setIsChecking(true);
      
      try {
        const result = await checkPageAccess(pathname);
        setAccessResult(result);

        // 접근 권한이 없고 리다이렉트가 필요한 경우
        if (!result.hasAccess && result.redirectTo) {
          setTimeout(() => {
            router.push(result.redirectTo!);
          }, 1500); // 1.5초 후 리다이렉트
        }
      } catch (error) {
        console.error('Error checking page access:', error);
        setAccessResult({
          hasAccess: false,
          role: 'guest',
          message: '페이지 접근 권한을 확인하는 중 오류가 발생했습니다.',
          redirectTo: '/login'
        });
      }
      
      setIsChecking(false);
    };

    checkAccess();
  }, [pathname, authLoading, permLoading, checkPageAccess, router]);

  // 로딩 중
  if (authLoading || permLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">페이지 접근 권한을 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  // 접근 권한이 없는 경우
  if (accessResult && !accessResult.hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <svg 
              className="w-16 h-16 mx-auto text-red-500 mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">접근 권한이 없습니다</h1>
          <p className="text-muted-foreground mb-4">{accessResult.message}</p>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">현재 권한: {getRoleName(accessResult.role)}</p>
            {accessResult.redirectTo && (
              <p className="text-sm text-blue-600">
                {accessResult.redirectTo === '/login' ? '로그인 페이지' : '메인 페이지'}로 이동합니다...
              </p>
            )}
          </div>

          <div className="mt-6 space-x-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors"
            >
              뒤로가기
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 접근 권한이 있는 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
};

// 역할 이름 변환 함수
const getRoleName = (role: string): string => {
  switch (role) {
    case 'admin': return '관리자';
    case 'manager': return '매니저';
    case 'user': return '일반사용자';
    case 'viewer': return '조회자';
    case 'guest': return '게스트';
    default: return '알 수 없음';
  }
};