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
  const [isDetailExpanded, setIsDetailExpanded] = useState(true);

  // 페이지 타이틀
  const pageTitle = `${orgName} 스크래핑 설정`;

  const handleTabClick = (tab: 'list' | 'detail') => {
    // oid 파라미터가 있으면 oid 기반으로, 없으면 orgName 기반으로 처리
    if (params.oid) {
      navigate(`/settings/scrapping/${params.oid}/${tab}`);
    } else {
      navigate(`/settings/scrapping/${encodeURIComponent(orgName)}/${tab}`);
    }
  };

  // 현재 활성 탭 확인
  const activeTab = pathname.endsWith('/list') ? 'list' : pathname.endsWith('/detail') ? 'detail' : 'list';

  // 설정 페이지 정보 생성
  const getPageInfo = () => {
    return {
      title: `${orgName} 스크래핑 설정`,
      breadcrumbs: [
        { label: '설정', href: '/settings/scrapping' },
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
          helpContent="스크래핑 설정에서는 공고 목록과 상세 정보를 수집하는 규칙을 설정할 수 있습니다. 목록 설정과 상세 설정을 각각 구성하세요."
        />

        {/* 목록 스크랩 설정 섹션 */}
        {activeTab === 'list' && (
          <SectionWithGuide
            title="목록 스크랩 설정"
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
            <div className="flex items-center">
              <DropdownSectionHeader
                title="상세 스크랩 설정"
                icon={<FileText className="w-5 h-5" />}
                isExpanded={isDetailExpanded}
                onToggle={() => setIsDetailExpanded(!isDetailExpanded)}
                borderColor="#d1d5db"
                accentColor="#6366f1"
              />
              <div className="ml-2">
                <SectionTitleHelp
                  isOpen={isDetailGuideOpen}
                  onToggle={() => setIsDetailGuideOpen(!isDetailGuideOpen)}
                />
              </div>
            </div>
            {/* 업무 가이드 슬라이드 영역 */}
            {isDetailGuideOpen && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">📖 상세 스크랩 설정 업무 가이드</h4>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                  <h5 className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">작성 가이드</h5>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• <strong>키:</strong> 데이터를 식별하는 고유 이름 (예: title, content, file_url)</li>
                    <li>• <strong>XPath:</strong> HTML에서 해당 데이터를 추출할 경로</li>
                    <li>• <strong>타겟:</strong> 추출할 속성 (text, href, src 등)</li>
                    <li>• <strong>콜백:</strong> 추출 후 적용할 변환 함수</li>
                  </ul>
                </div>

                <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                  <div>
                    <h5 className="font-medium">📋 기본 설정</h5>
                    <ul className="ml-4 space-y-1 text-xs">
                      <li>• <strong>기관명:</strong> 스크랩 대상 기관의 이름</li>
                      <li className="ml-4 text-blue-700 dark:text-blue-300">- 예: 강북구청, 서울시청 등</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium">🔧 요소 설정</h5>
                    <ul className="ml-4 space-y-1 text-xs">
                      <li>• <strong>제목:</strong> 공고 제목을 추출할 XPath</li>
                      <li className="ml-4 text-blue-700 dark:text-blue-300">- 예: //h3[@class="title"]/text()</li>
                      <li>• <strong>본문:</strong> 공고 본문을 추출할 XPath</li>
                      <li className="ml-4 text-blue-700 dark:text-blue-300">- 예: //div[@class="content"]</li>
                      <li>• <strong>파일이름:</strong> 첨부파일 이름을 추출할 XPath</li>
                      <li className="ml-4 text-blue-700 dark:text-blue-300">- 예: //a[@class="file"]/text()</li>
                      <li>• <strong>파일주소:</strong> 첨부파일 URL을 추출할 XPath</li>
                      <li className="ml-4 text-blue-700 dark:text-blue-300">- 예: //a[@class="file"]/@href</li>
                      <li>• <strong>미리보기:</strong> 미리보기 링크를 추출할 XPath</li>
                      <li>• <strong>공고구분:</strong> 공고 유형을 추출할 XPath</li>
                      <li className="ml-4 text-blue-700 dark:text-blue-300">- 예: //span[@class="category"]/text()</li>
                      <li>• <strong>공고번호:</strong> 공고 번호를 추출할 XPath</li>
                      <li>• <strong>담당부서:</strong> 담당 부서명을 추출할 XPath</li>
                      <li>• <strong>담당자:</strong> 담당자명을 추출할 XPath</li>
                      <li>• <strong>연락처:</strong> 연락처를 추출할 XPath</li>
                      <li>• <strong>샘플 URL:</strong> 테스트용 상세 페이지 URL</li>
                      <li className="ml-4 text-blue-700 dark:text-blue-300">- 실제 공고 페이지 URL을 입력하여 XPath 테스트에 사용</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium">📝 XPath 작성 가이드</h5>
                    <ul className="ml-4 space-y-1 text-xs">
                      <li>• <strong>텍스트 추출:</strong> //element/text()</li>
                      <li>• <strong>속성 추출:</strong> //element/@attribute</li>
                      <li>• <strong>HTML 추출:</strong> //element (전체 HTML)</li>
                      <li>• <strong>클래스 선택:</strong> //div[@class="classname"]</li>
                      <li>• <strong>ID 선택:</strong> //div[@id="elementid"]</li>
                      <li>• <strong>n번째 요소:</strong> (//element)[n]</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            {isDetailExpanded && (
              <div className="mt-4">
                {children}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}