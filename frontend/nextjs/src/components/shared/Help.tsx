'use client';

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface PageTitleHelpProps {
  helpTooltip?: string;
  helpContent?: string;
}

interface SectionTitleHelpProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function PageTitleHelp({
  helpTooltip = "도움말을 확인하세요",
  helpContent = "이 페이지에 대한 자세한 도움말입니다."
}: PageTitleHelpProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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
            <div className="text-color-primary-foreground text-sm">
              {helpContent}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function SectionTitleHelp({
  isOpen: externalIsOpen,
  onToggle: externalOnToggle
}: SectionTitleHelpProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // 외부에서 제어되는 경우와 내부에서 제어되는 경우를 구분
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const toggleOpen = externalOnToggle || (() => setInternalIsOpen(!internalIsOpen));

  return (
    <button
      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:transition-colors"
      onClick={toggleOpen}
      title="업무 가이드"
      style={{
        color: 'var(--color-primary-foreground)',
        backgroundColor: isOpen ? 'var(--color-primary-hovered)' : 'transparent'
      }}
      onMouseEnter={(e) => {
        if (!isOpen) {
          e.currentTarget.style.backgroundColor = 'var(--color-primary-hovered)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isOpen) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <HelpCircle className="w-4 h-4" />
    </button>
  );
}