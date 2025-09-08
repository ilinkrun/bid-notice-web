'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';

export default function ScrappingSettingsRedirectPage() {
  const params = useParams();
  const { navigate } = useUnifiedNavigation();

  const orgName = params.orgName as string;

  useEffect(() => {
    // 기본적으로 목록 탭으로 리디렉션
    navigate(`/settings/scrapping/${orgName}/list`);
  }, [orgName, navigate]);

  // 리디렉션 중 로딩 표시
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">페이지를 로드하고 있습니다...</p>
        </div>
      </div>
    </div>
  );
}