'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { gql, useQuery } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

const GET_LOG_SCRAPINGS = gql`
  query GetLogScrapings($gap: Int!) {
    logScrapings(gap: $gap) {
      time
      scrapedCount
      orgName
      insertedCount
    }
  }
`;

interface LogScraping {
  time: string;
  scrapedCount: number;
  orgName: string;
  insertedCount: number;
}

interface LogScrapingStatisticsTableProps {
  initialData: LogScraping[];
  defaultGap: string;
}

export function LogScrapingStatisticsTable({
  initialData,
  defaultGap,
}: LogScrapingStatisticsTableProps) {
  const { navigate } = useUnifiedNavigation();
  const { finishLoading } = useUnifiedLoading();
  const searchParams = useSearchParams();
  const [gap, setGap] = useState(defaultGap);

  const { data, loading, error } = useQuery(GET_LOG_SCRAPINGS, {
    variables: { gap: parseInt(gap, 10) },
    fetchPolicy: 'no-cache',
  });

  const logScrapings = data?.logScrapings || initialData;

  // 쿼리 완료시 로딩 스피너 해제
  useEffect(() => {
    if (!loading && (data || error)) {
      finishLoading();
    }
  }, [loading, data, error, finishLoading]);

  useEffect(() => {
    const currentGap = searchParams.get('gap');
    if (currentGap) {
      setGap(currentGap);
    }
  }, [searchParams]);

  const handleGapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGap(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validGap = parseInt(gap, 10);
    if (!isNaN(validGap) && validGap > 0) {
      navigate(`/statistics/logs_scraping?gap=${gap}`);
    }
  };

  if (error) {
    return <div>데이터를 불러오는 중 오류가 발생했습니다.</div>;
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={gap}
            onChange={handleGapChange}
            className="w-24"
            min="1"
          />
          <span>일 전부터의 통계</span>
        </div>
        <Button type="submit">조회</Button>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>시간</TableHead>
              <TableHead>기관명</TableHead>
              <TableHead className="text-right">스크랩 건수</TableHead>
              <TableHead className="text-right">신규 추가 건수</TableHead>
              <TableHead className="text-right">신규 비율</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : logScrapings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              logScrapings.map((log: LogScraping) => {
                const successRate = (log.insertedCount / log.scrapedCount) * 100 || 0;
                return (
                  <TableRow key={`${log.time}-${log.orgName}`}>
                    <TableCell>{formatDate(log.time)}</TableCell>
                    <TableCell>{log.orgName}</TableCell>
                    <TableCell className="text-right">{log.scrapedCount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{log.insertedCount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{successRate.toFixed(1)}%</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 