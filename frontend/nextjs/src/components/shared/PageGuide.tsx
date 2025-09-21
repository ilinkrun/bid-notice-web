'use client';

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import { GET_HELP_DOCUMENT_BY_SCOPE } from '@/lib/graphql/docs';

interface PageGuideProps {
  pageTitle: string;
  scopeHierarchy?: string;
  helpTooltip?: string;
  // 레거시 지원을 위한 props (deprecated)
  helpContent?: string;
}

export function PageGuide({
  pageTitle,
  scopeHierarchy,
  helpTooltip = "페이지 도움말을 확인하세요",
  helpContent // deprecated, 호환성을 위해 유지
}: PageGuideProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // scope_hierarchy가 제공되지 않은 경우 pageTitle로 자동 생성
  const defaultScopeHierarchy = scopeHierarchy || `application.${pageTitle.toLowerCase().replace(/\s+/g, '_')}`;

  // MySQL에서 페이지 가이드 조회
  const { data, loading, error } = useQuery(GET_HELP_DOCUMENT_BY_SCOPE, {
    client: getClient(),
    variables: {
      scope: 'page',
      scopeHierarchy: defaultScopeHierarchy
    },
    skip: !showDropdown, // 드롭다운이 열릴 때만 쿼리 실행
    fetchPolicy: 'cache-and-network'
  });

  // 데이터베이스에서 가져온 문서가 있는지 확인
  const dbDocument = data?.docsManualSearchByScope?.manuals?.[0];
  const hasDbContent = dbDocument && data?.docsManualSearchByScope?.total_count > 0;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-color-primary-muted-foreground">가이드를 불러오는 중...</span>
        </div>
      );
    }

    if (error) {
      console.error('Page guide loading error:', error);
    }

    // 데이터베이스에 페이지 가이드가 있으면 우선 사용
    if (hasDbContent) {
      return (
        <div className="space-y-4">
          <div className="guide-content-container">
            <div
              className="guide-content"
              dangerouslySetInnerHTML={{ __html: dbDocument.content }}
            />
          </div>
          <div className="text-xs text-color-primary-muted-foreground border-t pt-2">
            마지막 수정: {new Date(dbDocument.updated_at).toLocaleString()} | 작성자: {dbDocument.writer}
          </div>
        </div>
      );
    }
    // 레거시 helpContent가 있으면 사용 (호환성)
    else if (helpContent) {
      return (
        <div className="text-color-primary-foreground text-sm">
          {helpContent}
        </div>
      );
    }
    // 아무것도 없으면 기본 안내 메시지
    else {
      return (
        <div className="space-y-4">
          <div className="guide-content-container">
            <div className="guide-content text-color-primary-muted-foreground">
              이 페이지에 대한 가이드가 없습니다.
              <br />
              관리자에게 문의하여 가이드를 요청하세요.
            </div>
          </div>
          <div className="text-xs text-color-primary-muted-foreground">
            페이지: {pageTitle} | Scope: {defaultScopeHierarchy}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="relative ml-2">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-color-primary-muted hover:text-color-primary-foreground transition-colors"
        title={helpTooltip}
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {/* 툴팁 */}
      {showTooltip && !showDropdown && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50">
          {helpTooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}

      {/* 드롭다운 - 페이지 너비로 펼쳐짐 */}
      {showDropdown && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          {/* 드롭다운 콘텐츠 */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-screen max-w-full p-4 bg-color-primary-background border border-color-primary-foreground rounded-md shadow-lg z-50"
               style={{ left: '50vw', transform: 'translateX(-50%)' }}>
            <div className="mb-3">
              <h4 className="font-semibold text-color-primary-foreground text-sm">
                📖 {pageTitle} 페이지 가이드
              </h4>
            </div>
            {renderContent()}
          </div>
        </>
      )}
    </div>
  );
}