'use client';

import { useState, useEffect } from 'react';
import NoticeTable from '@/components/notices/NoticeTable';
import { Notice } from '@/types/notice';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { PageContainer } from '@/components/shared/PageContainer';

interface CategoryPageClientProps {
  notices: Notice[];
  category: string;
  gap: number;
}

// 통계 페이지 기반으로 통일된 테마 사용

export default function CategoryPageClient({ notices, category, gap }: CategoryPageClientProps) {
  const { finishLoading } = useUnifiedLoading();

  // 공고 데이터 로딩 완료 감지: undefined에서 배열(빈 배열 포함)로 변경되면 로딩 완료
  useEffect(() => {
    if (notices !== undefined) {
      // 데이터 로딩 완료 (비어있는 배열도 유효한 결과)
      console.log(`[CategoryPageClient] 데이터 로딩 완료: ${notices.length}개 공고`);
      // UI 렌더링이 완료되도록 짧은 지연 후 로딩 완료
      setTimeout(() => {
        finishLoading();
      }, 100);
    }
  }, [notices, finishLoading]);

  return (
    <PageContainer>
      <div className="category-page statistics-cell">
        <NoticeTable
          notices={notices}
          currentCategory={category}
          gap={gap}
        />
      </div>
    </PageContainer>
  );
} 