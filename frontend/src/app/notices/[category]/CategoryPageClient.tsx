'use client';

import { useState, useEffect } from 'react';
import NoticeTable from '@/components/notices/NoticeTable';
import { Notice } from '@/types/notice';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';

interface CategoryPageClientProps {
  notices: Notice[];
  category: string;
  gap: number;
}

// 카테고리별 테마 매핑
const categoryThemes = {
  '공사점검': 'theme-performance',
  '성능평가': 'theme-performance',
  '기타': 'theme-performance',
  '무관': 'theme-default',
  '제외': 'theme-default'
} as const;

type CategoryType = keyof typeof categoryThemes;

function getCategoryTheme(category: string): string {
  return categoryThemes[category as CategoryType] || 'theme-default';
}

export default function CategoryPageClient({ notices, category, gap }: CategoryPageClientProps) {
  const themeClass = getCategoryTheme(category);
  const { finishLoading } = useUnifiedLoading();

  // 테마 색상 적용
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-primary-color', getThemeColor(category));
  }, [category]);

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

  // 카테고리에 따른 테마 색상 설정
  const getThemeColor = (category: string) => {
    switch (category) {
      case '공사점검':
        return 'pink';
      case '성능평가':
        return 'green';
      case '기타':
        return 'blue';
      case '제외':
        return 'gray';
      default:
        return 'gray';
    }
  };

  return (
    <div className={`${themeClass} category-page`}>
      <div className="container mx-auto px-4 py-8">
        <NoticeTable 
          notices={notices} 
          currentCategory={category}
          gap={gap}
        />
      </div>
    </div>
  );
} 