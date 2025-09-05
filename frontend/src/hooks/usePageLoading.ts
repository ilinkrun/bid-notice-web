'use client';

import { useEffect } from 'react';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';

/**
 * 페이지 로딩 상태를 자동으로 관리하는 Hook
 */
export function usePageLoading(options?: {
  loading?: boolean;
  data?: unknown;
  delay?: number;
}) {
  const { finishLoading } = useUnifiedLoading();
  const { loading = false, data, delay = 1000 } = options || {};

  useEffect(() => {
    // GraphQL 로딩이 있는 경우
    if (loading !== undefined && data !== undefined) {
      if (!loading && data !== undefined) {
        const timer = setTimeout(() => {
          finishLoading();
        }, 200); // GraphQL 데이터가 로드되면 빠르게 해제
        return () => clearTimeout(timer);
      }
    } else {
      // 일반적인 경우 (SSR, 정적 페이지 등)
      const timer = setTimeout(() => {
        finishLoading();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [loading, data, delay, finishLoading]);
}