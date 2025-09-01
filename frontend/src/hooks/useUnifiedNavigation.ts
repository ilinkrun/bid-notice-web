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

    // 1. 즉시 URL 변경 (브라우저 주소창 업데이트)
    window.history.pushState({}, '', url);
    
    // 2. 로딩 시작
    startLoading();
    
    // 3. Next.js 라우터로 페이지 전환
    router.push(url);
    
    // 안전장치: 3초 후 강제 로딩 해제
    timeoutRef.current = setTimeout(() => {
      finishLoading();
    }, 3000);
  };

  // pathname 변경 감지
  useEffect(() => {
    // pathname이 변경되면 기존의 안전장치 타이머만 유지
    // 각 페이지에서 finishLoading()을 호출하거나, 3초 후 안전장치가 작동함
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