'use client';

import { useRouter } from 'next/navigation';
import { useLoading } from '@/components/providers/LoadingProvider';
import { useEffect, useRef } from 'react';

export function useNavigation() {
  const router = useRouter();
  const { setIsLoading } = useLoading();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const navigate = (url: string) => {
    // 기존 타이머 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 1. 즉시 URL 변경 (브라우저 주소창 업데이트)
    window.history.pushState(null, '', url);
    
    // 2. 로딩 상태 활성화
    setIsLoading(true);
    
    // 3. Next.js 라우터로 페이지 전환
    router.push(url);
    
    // 4. 최대 10초 후에는 강제로 로딩 상태 해제
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 10000);
  };

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