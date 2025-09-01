'use client';

import { useEffect } from 'react';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';

interface UnifiedDataLoadingWrapperProps {
  children: React.ReactNode;
  data?: any; // 데이터가 로드되었음을 확인하는 용도
}

export default function UnifiedDataLoadingWrapper({ children, data }: UnifiedDataLoadingWrapperProps) {
  const { finishLoading } = useUnifiedLoading();

  // 데이터 로딩 완료 후 UI 안정화를 위해 300ms 대기 후 로딩 스피너 제거
  useEffect(() => {
    if (data !== undefined) {
      // 데이터 로딩이 완료되었으므로 300ms 후 스피너 제거
      const timer = setTimeout(() => {
        finishLoading();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [data, finishLoading]);

  return <>{children}</>;
}