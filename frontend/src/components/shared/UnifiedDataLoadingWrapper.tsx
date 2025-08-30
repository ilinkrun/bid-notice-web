'use client';

import { useEffect } from 'react';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';

interface UnifiedDataLoadingWrapperProps {
  children: React.ReactNode;
  data?: any; // 데이터가 로드되었음을 확인하는 용도
}

export default function UnifiedDataLoadingWrapper({ children, data }: UnifiedDataLoadingWrapperProps) {
  const { finishLoading } = useUnifiedLoading();

  // 데이터가 로드되면 로딩 해제
  useEffect(() => {
    if (data !== undefined) {
      // 통합 로딩 완료
      finishLoading();
    }
  }, [data, finishLoading]);

  return <>{children}</>;
}