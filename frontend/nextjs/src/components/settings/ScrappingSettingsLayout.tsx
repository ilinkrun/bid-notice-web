'use client';

import { useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, List, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionWithGuide } from '@/components/shared/SectionWithGuide';

interface ScrappingSettingsLayoutProps {
  children: React.ReactNode;
  orgName: string;
  isActive?: boolean;
  region?: string;
}

export function ScrappingSettingsLayout({ children, orgName }: ScrappingSettingsLayoutProps) {
  const { navigate } = useUnifiedNavigation();
  const pathname = usePathname();
  const params = useParams();

  // 섹션 접힘/펼침 상태
  const [isListExpanded, setIsListExpanded] = useState(true);

  // 페이지 타이틀
  const hasOidParam = !!params.oid;
  const pageTitle = hasOidParam ? '스크래핑 설정' : `${orgName} 스크래핑 설정`;

  const handleTabClick = (tab: 'list' | 'detail') => {
    // oid 파라미터가 있으면 oid 기반으로, 없으면 orgName 기반으로 처리
    if (params.oid) {
      navigate(`/settings/scrapping/${params.oid}/${tab}`);
    } else {
      navigate(`/settings/scrapping/${encodeURIComponent(orgName)}/${tab}`);
    }
  };

  // 현재 활성 탭 확인
  const activeTab = pathname.endsWith('/list') ? 'list' : pathname.endsWith('/detail') ? 'detail' : null;

  // 설정 페이지 정보 생성
  const getPageInfo = () => {
    // oid 파라미터가 있는 경우 (숫자 ID로 접근하는 경우) 조직명 없이 "스크래핑 설정"만 표시
    const hasOidParam = !!params.oid;
    const title = hasOidParam ? '스크래핑 설정' : `${orgName} 스크래핑 설정`;

    return {
      title,
      breadcrumbs: [
        { label: '설정', href: '/settings' },
        { label: '스크래핑 설정', href: '/settings/scrapping' },
        { label: orgName, href: `/settings/scrapping/${encodeURIComponent(orgName)}/list` }
      ]
    };
  };

  const { title, breadcrumbs } = getPageInfo();

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <PageHeader
          title={title}
          breadcrumbs={breadcrumbs}
          helpTooltip="스크래핑 설정 방법을 확인하세요"
        />

        {/* 목록 스크래핑 설정 섹션 */}
        {activeTab === 'list' && (
          <SectionWithGuide
            title="목록 스크래핑 설정"
            icon={<List className="w-5 h-5" />}
            accentColor="#6366f1"
            category="운영가이드"
            pageTitle={pageTitle}
            isExpanded={isListExpanded}
            onToggle={setIsListExpanded}
          >
            <div className="mt-4">
              {children}
            </div>
          </SectionWithGuide>
        )}

        {/* 상세 스크랩 설정 섹션 */}
        {activeTab === 'detail' && (
          <div>
            {children}
          </div>
        )}

        {/* 통합 페이지 - 섹션 래퍼 없이 직접 렌더링 */}
        {activeTab === null && (
          <div>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}