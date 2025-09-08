'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useCallback } from 'react';

// 전역 네비게이션 이벤트 관리를 위한 사용자 정의 이벤트
declare global {
  interface WindowEventMap {
    'navigation-start': CustomEvent<{ url: string; isMenuNavigation: boolean }>;
  }
}

export function useUnifiedNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const navigate = useCallback((url: string, options: { isMenuNavigation?: boolean } = {}) => {
    // 현재 페이지와 동일한 URL이면 무시
    if (pathname === url) {
      return;
    }

    const { isMenuNavigation = true } = options;

    // 기존 타이머 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    console.log(`🖱️ [단계 1] 메뉴 클릭 - 네비게이션 시작: ${url}`);
    
    // 네비게이션 시작 이벤트 발생 (usePageLoadingFlow에서 감지)
    window.dispatchEvent(new CustomEvent('navigation-start', { 
      detail: { url, isMenuNavigation } 
    }));

    // URL 즉시 변경 (단계 2)
    console.log('📍 [단계 2] URL 즉시 변경');
    window.history.pushState({}, '', url);
    
    // Next.js 라우터로 페이지 전환
    router.push(url);
    
    // 안전장치: 10초 후 강제로 네비게이션 완료 처리
    timeoutRef.current = setTimeout(() => {
      console.warn('⚠️ 네비게이션 타임아웃 - 강제 완료 처리');
      window.dispatchEvent(new CustomEvent('navigation-timeout'));
    }, 10000);
  }, [pathname, router]);

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