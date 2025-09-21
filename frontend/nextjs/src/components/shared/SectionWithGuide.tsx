'use client';

import React, { useState } from 'react';
import { DropdownSectionHeader } from '@/components/shared/FormComponents';
import { SectionTitleHelp } from '@/components/shared/Help';
import { GuideSlide } from '@/components/shared/GuideSlide';

interface SectionWithGuideProps {
  title: string;
  icon?: React.ReactNode;
  accentColor?: string;
  category?: string;
  pageTitle?: string;
  scope?: 'application' | 'domain' | 'page' | 'section' | 'component';
  scopeHierarchy?: string;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function SectionWithGuide({
  title,
  icon,
  accentColor,
  category = "운영가이드",
  pageTitle = "",
  scope = "section",
  scopeHierarchy,
  isExpanded: controlledExpanded,
  onToggle,
  children,
  className = ""
}: SectionWithGuideProps) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // 외부에서 제어되는 경우와 내부에서 제어되는 경우를 구분
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const handleToggle = () => {
    const newExpanded = !isExpanded;
    if (onToggle) {
      onToggle(newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  };

  // 동적 가이드 타이틀 생성
  const guideTitle = pageTitle 
    ? `[가이드]${pageTitle} > ${title}`
    : `[가이드]${title}`;

  return (
    <div className={className}>
      {/* 섹션 헤더와 도움말 버튼 */}
      <div className="flex items-center gap-2">
        <DropdownSectionHeader
          title={title}
          icon={icon}
          isExpanded={isExpanded}
          onToggle={handleToggle}
          accentColor={accentColor}
        />
        <SectionTitleHelp
          title={guideTitle}
          category={category}
          isOpen={isGuideOpen}
          onToggle={() => setIsGuideOpen(!isGuideOpen)}
        />
      </div>

      {/* 가이드 슬라이드 */}
      <GuideSlide
        isOpen={isGuideOpen}
        title={guideTitle}
        category={category}
        scope={scope}
        scopeHierarchy={scopeHierarchy}
      />

      {/* 섹션 내용 */}
      {isExpanded && (
        <div className="mt-2 space-y-0">
          {children}
        </div>
      )}
    </div>
  );
}