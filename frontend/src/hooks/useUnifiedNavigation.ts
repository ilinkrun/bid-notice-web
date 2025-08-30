'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { useEffect, useRef } from 'react';

export function useUnifiedNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { startLoading, finishLoading } = useUnifiedLoading();
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

    // 로딩 시작
    startLoading();
    
    // 즉시 URL 변경
    window.history.pushState(null, '', url);
    
    // Next.js 라우터로 페이지 전환
    router.push(url);
    
    // 안전장치: 10초 후 강제 로딩 해제
    timeoutRef.current = setTimeout(() => {
      finishLoading();
    }, 10000);
  };

  // pathname 변경 감지 - 로딩은 각 페이지에서 명시적으로 해제
  useEffect(() => {
    // pathname이 변경되면 안전장치 타이머는 그대로 유지
    // 각 페이지 컴포넌트에서 데이터 로딩 완료시 finishLoading() 호출해야 함
  }, [pathname]);

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