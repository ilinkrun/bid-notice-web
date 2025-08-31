'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLoading } from '@/components/providers/LoadingProvider';
import { useEffect, useRef } from 'react';

export function useNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { setIsLoading } = useLoading();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const navigate = (url: string) => {
    // 현재 페이지와 동일한 URL이면 무시
    if (pathname === url) {
      return;
    }

    // 기존 타이머 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 로딩 상태 활성화
    setIsLoading(true);
    
    // 즉시 URL 변경
    window.history.pushState(null, '', url);
    
    // Next.js 라우터로 페이지 전환
    router.push(url);
    
    // 안전장치: 5초 후 강제 로딩 해제 (기존 10초에서 단축)
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  };

  // pathname 변경 감지하여 지연 후 로딩 해제
  useEffect(() => {
    // pathname이 변경되면 기존 타이머 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 페이지가 로드되기 시작했을 때만 네비게이션 로딩 해제
    // 데이터 로딩은 별도 관리되므로 즉시 해제하지 않음
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 50); // 50ms로 단축, 네비게이션 완료만 처리
    
  }, [pathname, setIsLoading]);

  // 컴포넌트 언마운트시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { navigate };
} 