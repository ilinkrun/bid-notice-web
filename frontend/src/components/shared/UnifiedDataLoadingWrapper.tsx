'use client';

import { useEffect } from 'react';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';

interface UnifiedDataLoadingWrapperProps {
  children: React.ReactNode;
  data?: any; // 데이터가 로드되었음을 확인하는 용도
}

export default function UnifiedDataLoadingWrapper({ children, data }: UnifiedDataLoadingWrapperProps) {
  const { finishLoading } = useUnifiedLoading();

  // GraphQL/REST 데이터 로딩 완료 감지: undefined에서 실제 데이터(빈 객체 포함)로 변경되면 로딩 완료
  useEffect(() => {
    if (data !== undefined) {
      // 데이터 로딩 완료 (null이나 빈 객체도 유효한 결과)
      console.log('[UnifiedDataLoadingWrapper] 데이터 로딩 완료:', data);
      finishLoading();
    }
  }, [data, finishLoading]);

  return <>{children}</>;
}