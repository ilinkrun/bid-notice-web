'use client';

import { useEffect } from 'react';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';

interface DataLoadingWrapperProps {
  children: React.ReactNode;
}

export default function DataLoadingWrapper({ children }: DataLoadingWrapperProps) {
  const { startLoading } = useUnifiedLoading();

  // 컴포넌트 마운트 시 데이터 로딩 시작
  useEffect(() => {
    startLoading();
  }, [startLoading]);

  return <>{children}</>;
}