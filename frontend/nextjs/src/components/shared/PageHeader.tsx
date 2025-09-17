'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PageTitleHelp } from './Help';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  helpTooltip?: string;
  helpContent?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, breadcrumbs, helpTooltip, helpContent, action }: PageHeaderProps) {
  return (
    <div className="relative w-full mb-1">
      <div className="flex items-end justify-between w-full">
        {/* 페이지 타이틀과 도움말 아이콘 - 좌측 */}
        <div className="flex items-end">
          <h1 className="text-xl font-semibold text-color-primary-foreground">
            {title}
          </h1>

          {/* 도움말 아이콘 - 8px 간격 */}
          <PageTitleHelp helpTooltip={helpTooltip} helpContent={helpContent} />
        </div>

        {/* 우측 영역: 브레드크럼과 액션 버튼 */}
        <div className="flex items-center space-x-4">
          {/* 브레드크럼 */}
          <nav className="flex items-center space-x-1 text-sm">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.href}>
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-color-primary-muted" />
                )}
                <Link
                  href={item.href}
                  className="text-color-primary-foreground hover:text-color-primary-linked transition-colors"
                >
                  {item.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>

          {/* 액션 버튼 - 가장 우측 */}
          {action && (
            <div className="flex items-center">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}