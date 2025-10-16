'use client';

import { useState } from 'react';
import { Table, ChartBar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorScrapingChart } from '@/components/statistics/ErrorScrapingChart';
import { ErrorScrapingTable } from '@/components/statistics/ErrorScrapingTable';

interface ErrorScraping {
  id: string;
  orgName: string;
  errorMessage: string;
  time: string;
}

interface ErrorScrapingContentProps {
  initialData: ErrorScraping[];
}

export default function ErrorScrapingContent({ initialData }: ErrorScrapingContentProps) {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  return (
    <div className="statistics-cell">
      {viewMode === 'table' ? (
        <ErrorScrapingTable initialData={initialData} />
      ) : (
        <ErrorScrapingChart initialData={initialData} />
      )}
    </div>
  );
} 