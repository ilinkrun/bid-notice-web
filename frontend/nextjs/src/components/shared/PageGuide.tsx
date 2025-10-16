'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { HelpCircle } from 'lucide-react';
import { SectionTitleHelp } from '@/components/shared/Help';
import { GuideSlide } from '@/components/shared/GuideSlide';
import { usePathname } from 'next/navigation';
import { getClient } from '@/lib/api/graphqlClient';
import { CONVERT_KO_TO_EN } from '@/lib/graphql/mappings';

// 페이지 가이드 상태 관리
interface PageGuideState {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const PageGuideContext = createContext<PageGuideState | null>(null);

// 페이지 가이드 상태 훅
 const usePageGuideState = () => {
  const context = useContext(PageGuideContext);
  if (!context) {
    // Context가 없으면 로컬 상태 사용
    return useState(false);
  }
  return [context.isOpen, context.setIsOpen] as const;
};

interface PageGuideProps {
  pageTitle: string;
  scopeHierarchy?: string;
  helpTooltip?: string;
  // 레거시 지원을 위한 props (deprecated)
  helpContent?: string;
  // 렌더링 모드: button-only(버튼만), slide-only(슬라이드만), both(둘다)
  renderMode?: 'button-only' | 'slide-only' | 'both';
  // 자동 생성 시 최대 깊이 제한 (기본값: 3 = application.domain.page)
  maxDepth?: number;
}

// URL 기반 scope_hierarchy 생성 함수 (mappings_lang 테이블 사용)
const generateScopeHierarchyWithMapping = async (
  pathname: string,
  pageTitle: string,
  apolloClient: any,
  maxDepth: number = 3
): Promise<string> => {
  try {
    // URL을 경로별로 분해
    const pathParts = pathname.split('/').filter(part => part !== '');
    // 기본 구조: application.domain.page[.section]
    let hierarchy = 'application';
    let currentDepth = 1; // 'application'이 이미 깊이 1

    // URL 경로를 순회하며 mappings_lang에서 영문 변환 시도 (maxDepth까지만)
    for (const part of pathParts) {
      if (currentDepth >= maxDepth) break; // 최대 깊이 도달 시 중단

      try {
        const { data } = await apolloClient.query({
          query: CONVERT_KO_TO_EN,
          variables: {
            scope: 'section',
            ko: part
          },
          fetchPolicy: 'cache-first'
        });

        if (data?.mappingsLangKoToEn) {
          hierarchy += `.${data.mappingsLangKoToEn}`;
        } else {
          hierarchy += `.${part}`;
        }
        currentDepth++;
      } catch (error) {
        // 매핑이 없으면 원본 값 사용
        hierarchy += `.${part}`;
        currentDepth++;
      }
    }

    // 페이지 타이틀은 maxDepth 제한에 관계없이 추가하지 않음 (페이지 가이드는 도메인 레벨에서 관리)
    // 필요 시 별도 옵션으로 제어할 수 있도록 향후 확장 가능

    return hierarchy;
  } catch (error) {
    console.error('Error in generateScopeHierarchyWithMapping:', error);
    // 에러 시 기본 폴백
    return generateScopeHierarchyFallback(pathname, pageTitle, maxDepth);
  }
};

// 정적 폴백 함수
const generateScopeHierarchyFallback = (pathname: string, pageTitle: string, maxDepth: number = 3): string => {
  const pathParts = pathname.split('/').filter(part => part !== '');
  // maxDepth에 따라 경로 제한 (application 포함하여 계산)
  const limitedParts = pathParts.slice(0, maxDepth - 1);
  return ['application', ...limitedParts].join('.');
};

export function PageGuide({
  pageTitle,
  scopeHierarchy,
  helpTooltip = "페이지 도움말을 확인하세요",
  helpContent, // deprecated, 호환성을 위해 유지
  renderMode = 'both',
  maxDepth = 3 // 기본값: application.domain.page (3레벨)
}: PageGuideProps) {
  const [isGuideOpen, setIsGuideOpen] = usePageGuideState();
  const [dynamicScopeHierarchy, setDynamicScopeHierarchy] = useState<string>('');
  const pathname = usePathname();

  // 컬포너트 마운트 시 scope_hierarchy 생성
  useEffect(() => {
    const generateHierarchy = async () => {
      if (scopeHierarchy) {
        setDynamicScopeHierarchy(scopeHierarchy);
        return;
      }

      let generatedScopeHierarchy: string;

      try {
        // mappings_lang 테이블을 사용한 동적 매핑
        generatedScopeHierarchy = await generateScopeHierarchyWithMapping(pathname, pageTitle, getClient(), maxDepth);
      } catch (error) {
        console.error('Error generating dynamic scope hierarchy for page:', error);
        generatedScopeHierarchy = generateScopeHierarchyFallback(pathname, pageTitle, maxDepth);
      }

      console.log('=== PAGE GUIDE SCOPE HIERARCHY DEBUG ===');
      console.log('pathname:', pathname);
      console.log('pageTitle:', pageTitle);
      console.log('generated scope_hierarchy:', generatedScopeHierarchy);

      setDynamicScopeHierarchy(generatedScopeHierarchy);
    };

    generateHierarchy();
  }, [pathname, pageTitle, scopeHierarchy, maxDepth]);

  // 페이지 가이드 타이틀 생성
  const guideTitle = `[가이드]${pageTitle}`;

  return (
    <div>
      {/* 버튼 렌더링 */}
      {(renderMode === 'button-only' || renderMode === 'both') && (
        <SectionTitleHelp
          title={guideTitle}
          category="운영가이드"
          isOpen={isGuideOpen}
          onToggle={() => setIsGuideOpen(!isGuideOpen)}
        />
      )}

      {/* 슬라이드 렌더링 */}
      {(renderMode === 'slide-only' || renderMode === 'both') && dynamicScopeHierarchy && (
        <GuideSlide
          isOpen={isGuideOpen}
          title={guideTitle}
          category="운영가이드"
          scope="page"
          scopeHierarchy={dynamicScopeHierarchy}
          helpContent={helpContent} // 레거시 지원
        />
      )}
    </div>
  );
}