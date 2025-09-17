'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  title?: string;
  titleClassName?: string;
  containerClassName?: string;
}

/**
 * 모든 페이지에서 일관된 다크 모드 스타일을 적용하기 위한 컨테이너 컴포넌트
 * 통계 페이지의 다크 모드 스타일을 기반으로 제작
 */
export function PageContainer({
  children,
  className,
  title,
  titleClassName,
  containerClassName
}: PageContainerProps) {
  return (
    <div className={cn(
      className
    )}>
      <div className={cn("page-content-container w-full py-2", containerClassName)} style={{ paddingLeft: 'var(--container-padding-x)', paddingRight: 'calc(var(--container-padding-x) - var(--scrollbar-width))' }}>
        {title && (
          <h1 className={cn(
            "text-xl font-bold pt-1 pl-1 text-foreground mb-4",
            titleClassName
          )}>
            {title}
          </h1>
        )}
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
}