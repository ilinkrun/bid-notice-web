'use client';

import { useState, useEffect } from 'react';
import NoticeTable from '@/components/notices/NoticeTable';
import { Notice } from '@/types/notice';
import { useLoading } from '@/components/providers/LoadingProvider';

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
  const [currentCategory, setCurrentCategory] = useState(category);
  const themeClass = getCategoryTheme(currentCategory);
  const { setIsLoading } = useLoading();

  // 테마 색상 적용
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-primary-color', getThemeColor(currentCategory));
  }, [currentCategory]);

  // 페이지 로딩 완료시 로딩 상태 해제
  useEffect(() => {
    setIsLoading(false);
  }, [setIsLoading]);

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
          currentCategory={currentCategory}
          gap={gap}
        />
      </div>
    </div>
  );
} 