'use client';

import { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DataTableProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

interface DataTableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface DataTableBodyProps {
  children: ReactNode;
  className?: string;
}

interface DataTableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  isHoverable?: boolean;
}

interface DataTableCellProps {
  children: ReactNode;
  className?: string;
  isHeader?: boolean;
  colSpan?: number;
  onClick?: () => void;
}

/**
 * 다크 모드를 지원하는 재사용 가능한 데이터 테이블 컴포넌트
 * 통계 페이지의 스타일을 기반으로 제작
 */
export function DataTable({ children, className, containerClassName }: DataTableProps) {
  return (
    <div className={cn(
      "rounded-md border border-border bg-card overflow-x-auto",
      "data-table-container",
      containerClassName
    )}>
      <Table className={cn("w-full min-w-[800px]", className)}>
        {children}
      </Table>
    </div>
  );
}

export function DataTableHeader({ children, className }: DataTableHeaderProps) {
  return (
    <TableHeader className={cn("bg-muted", className)}>
      {children}
    </TableHeader>
  );
}

export function DataTableBody({ children, className }: DataTableBodyProps) {
  return (
    <TableBody className={cn("bg-card", className)}>
      {children}
    </TableBody>
  );
}

export function DataTableRow({
  children,
  className,
  onClick,
  isHoverable = true
}: DataTableRowProps) {
  return (
    <TableRow
      className={cn(
        isHoverable && "hover:bg-muted/50 dark:hover:bg-[hsl(240_3.7%_25%)] cursor-pointer",
        isHoverable && "dark:hover:[&>td]:text-[hsl(240_10%_3.9%)]",
        className
      )}
      onClick={onClick}
    >
      {children}
    </TableRow>
  );
}

export function DataTableCell({ children, className, isHeader = false, colSpan, onClick }: DataTableCellProps) {
  if (isHeader) {
    return (
      <TableHead
        className={cn(
          "bg-muted text-foreground font-medium",
          onClick && "cursor-pointer",
          className
        )}
        colSpan={colSpan}
        onClick={onClick}
      >
        {children}
      </TableHead>
    );
  }

  return (
    <TableCell
      className={cn(
        "text-foreground",
        onClick && "cursor-pointer",
        className
      )}
      colSpan={colSpan}
      onClick={onClick}
    >
      {children}
    </TableCell>
  );
}