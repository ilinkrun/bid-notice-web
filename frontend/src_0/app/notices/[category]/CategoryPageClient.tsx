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
  '공사점검': 'theme-construction',
  '성능평가': 'theme-performance',
  '기타': 'theme-etc',
  '무관': 'theme-default'
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

  // 데이터 렌더링 완료 후 로딩 해제
  useEffect(() => {
    if (notices !== undefined) {
      // 데이터 로딩 완료 (빈 배열 포함)
      finishLoading();
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