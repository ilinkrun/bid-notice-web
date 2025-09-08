'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { StatisticsTypeSelector } from './StatisticsTypeSelector';
import { GapSelector } from './GapSelector';
import { NoticeStatisticsChart } from './NoticeStatisticsChart';
import { processNoticeStatistics } from '@/lib/utils/statistics';
import { Table as TableIcon, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CategoryChartData {
  date: string;
  dayOfWeek: string;
  regions: {
    region: string;
    construction: number;
    performance: number;
    etc: number;
    subtotal: number;
    total: number;
  }[];
  construction: number;
  performance: number;
  etc: number;
  subtotal: number;
  total: number;
}

interface RegionChartData {
  date: string;
  dayOfWeek: string;
  regions: {
    region: string;
    construction: number;
    performance: number;
    etc: number;
    subtotal: number;
    total: number;
  }[];
  totals: {
    construction: number;
    performance: number;
    etc: number;
    subtotal: number;
    total: number;
  };
}

interface NoticeStatisticsTableProps {
  initialData: any[];
  defaultGap: string;
  defaultType?: string;
  defaultViewType?: 'table' | 'chart';
  hideControls?: boolean;
  hideTypeSelector?: boolean;
}

const typeToUrlParam: Record<string, string> = {
  'category': 'category',
  'region': 'region',
  'organization': 'orgName'
};

const urlParamToType: Record<string, string> = {
  'category': 'category',
  'region': 'region',
  'orgName': 'organization'
};

const viewTypes = [
  { value: 'table', label: '표', icon: TableIcon },
  { value: 'chart', label: '차트', icon: BarChart3 }
] as const;

export function NoticeStatisticsTable({ 
  initialData, 
  defaultGap,
  defaultType = 'category',
  defaultViewType = 'table',
  hideControls = false,
  hideTypeSelector = false
}: NoticeStatisticsTableProps) {
  const { navigate } = useUnifiedNavigation();
  const { finishLoading } = useUnifiedLoading();
  const searchParams = useSearchParams();
  const [statisticsType, setStatisticsType] = useState<string>(() => {
    const typeParam = searchParams.get('type');
    return typeParam ? (urlParamToType[typeParam] || defaultType) : defaultType;
  });
  const [viewType, setViewType] = useState<'table' | 'chart'>(defaultViewType);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [orgStatistics, setOrgStatistics] = useState<any[]>([]);
  const [isLoadingOrg, setIsLoadingOrg] = useState(false);

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', typeToUrlParam[value]);
    navigate(`?${params.toString()}`);
    setStatisticsType(value);
  };

  const handleViewTypeChange = (value: 'table' | 'chart') => {
    setViewType(value);
  };

  const categoryStatistics = useMemo(() => 
    processNoticeStatistics.category(initialData, 14), [initialData]);

  const regionStatistics = useMemo(() => 
    processNoticeStatistics.region(initialData), [initialData]);

  // 기관별 통계 데이터 로드
  useEffect(() => {
    const loadOrgStatistics = async () => {
      if (statisticsType === 'organization') {
        setIsLoadingOrg(true);
        try {
          const orgData = await processNoticeStatistics.organization(initialData);
          setOrgStatistics(orgData);
        } catch (error) {
          console.error('기관별 통계 데이터 로드 중 오류 발생:', error);
        } finally {
          setIsLoadingOrg(false);
        }
      }
    };
    
    loadOrgStatistics();
  }, [statisticsType, initialData]);

  // 통계 데이터 로딩 완료 감지: undefined에서 배열(빈 배열 포함)로 변경되면 로딩 완료
  useEffect(() => {
    if (initialData !== undefined) {
      // 데이터 로딩 완료 (비어있는 배열도 유효한 결과)
      console.log(`[NoticeStatisticsTable] 통계 데이터 로딩 완료: ${initialData?.length || 0}개 항목`);
      finishLoading();
    }
  }, [initialData, finishLoading]);

  // 선택된 통계 유형에 따른 데이터와 합계
  const { statistics, totals } = useMemo(() => {
    let data;
    let totals;
    
    switch (statisticsType) {
      case 'category':
        data = categoryStatistics;
        totals = processNoticeStatistics.calculateTotals(data);
        break;
      case 'region':
        data = regionStatistics;
        totals = processNoticeStatistics.calculateTotals(data.flatMap(d => d.regions));
        break;
      case 'organization':
        data = orgStatistics;
        totals = processNoticeStatistics.calculateTotals(data);
        break;
      default:
        data = categoryStatistics;
        totals = processNoticeStatistics.calculateTotals(data);
    }

    return { statistics: data, totals };
  }, [statisticsType, categoryStatistics, regionStatistics, orgStatistics]);

  // 정렬 처리 함수
  const handleSort = (column: string) => {
    if (statisticsType !== 'organization') return;
    
    if (sortColumn === column) {
      // 같은 컬럼을 다시 클릭하면 정렬 방향을 반대로 변경
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 컬럼을 클릭하면 해당 컬럼으로 정렬하고 오름차순으로 설정
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // 정렬된 데이터 계산
  const sortedStatistics = useMemo(() => {
    if (statisticsType !== 'organization' || !sortColumn) {
      return statistics;
    }

    return [...statistics].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }, [statistics, statisticsType, sortColumn, sortDirection]);

  // 첫 번째 컬럼의 헤더 텍스트 결정
  const getFirstColumnHeader = () => {
    switch (statisticsType) {
      case 'category':
        return '게시일';
      case 'region':
        return '날짜';
      case 'organization':
        return '기관명';
      default:
        return '게시일';
    }
  };

  // 첫 번째 컬럼의 데이터 결정
  const getFirstColumnData = (stats: any) => {
    switch (statisticsType) {
      case 'category':
        return stats.date;
      case 'region':
        return stats.date;
      case 'organization':
        return stats.orgName;
      default:
        return stats.date;
    }
  };

  const renderTableBody = () => {
    if (statisticsType === 'region' && Array.isArray(statistics)) {
      return (
        <TableBody>
          {statistics.map((dateStats, dateIndex) => (
            dateStats.regions.map((stats, regionIndex) => (
              <TableRow key={`${dateStats.date}-${stats.region}`}>
                {regionIndex === 0 && (
                  <TableCell rowSpan={dateStats.regions.length} className="align-top">
                    {dateStats.date}
                    <div className="text-xs text-muted-foreground">
                      ({dateStats.dayOfWeek})
                    </div>
                  </TableCell>
                )}
                <TableCell>{stats.region}</TableCell>
                <TableCell className="text-center">{stats.construction}</TableCell>
                <TableCell className="text-center">{stats.performance}</TableCell>
                <TableCell className="text-center">{stats.etc}</TableCell>
                <TableCell className="text-center font-medium">{stats.subtotal}</TableCell>
                <TableCell className="text-center font-medium">{stats.total}</TableCell>
              </TableRow>
            ))
          ))}
          <TableRow className="bg-muted/50">
            <TableCell colSpan={2} className="font-bold">
              합계
            </TableCell>
            <TableCell className="text-center font-bold">{totals.construction}</TableCell>
            <TableCell className="text-center font-bold">{totals.performance}</TableCell>
            <TableCell className="text-center font-bold">{totals.etc}</TableCell>
            <TableCell className="text-center font-bold">{totals.subtotal}</TableCell>
            <TableCell className="text-center font-bold">{totals.total}</TableCell>
          </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {Array.isArray(statistics) && statistics.map((stats: any) => (
          <TableRow key={`${getFirstColumnData(stats)}-${stats.date || ''}`}>
            <TableCell>{getFirstColumnData(stats)}</TableCell>
            {statisticsType === 'category' && (
              <TableCell>({stats.dayOfWeek})</TableCell>
            )}
            <TableCell className="text-center">{stats.construction}</TableCell>
            <TableCell className="text-center">{stats.performance}</TableCell>
            <TableCell className="text-center">{stats.etc}</TableCell>
            <TableCell className="text-center font-medium">{stats.subtotal}</TableCell>
            <TableCell className="text-center font-medium">{stats.total}</TableCell>
          </TableRow>
        ))}
        <TableRow className="bg-muted/50">
          <TableCell colSpan={statisticsType === 'organization' ? 2 : statisticsType === 'category' ? 2 : 2} className="font-bold">
            합계
          </TableCell>
          <TableCell className="text-center font-bold">{totals.construction}</TableCell>
          <TableCell className="text-center font-bold">{totals.performance}</TableCell>
          <TableCell className="text-center font-bold">{totals.etc}</TableCell>
          <TableCell className="text-center font-bold">{totals.subtotal}</TableCell>
          <TableCell className="text-center font-bold">{totals.total}</TableCell>
        </TableRow>
      </TableBody>
    );
  };

  return (
    <div className="space-y-4">
      {!hideControls && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2 w-full">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <StatisticsTypeSelector
              value={statisticsType}
              onValueChange={handleTypeChange}
            />
            <GapSelector defaultValue={defaultGap} />
          </div>
          <div className="flex items-center gap-2">
            {viewTypes.map((type) => (
              <Button
                key={type.value}
                variant={viewType === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleViewTypeChange(type.value)}
                className={cn(
                  "flex items-center gap-2 transition-colors",
                  viewType === type.value 
                    ? "bg-primary text-primary-foreground font-semibold shadow-md" 
                    : "hover:bg-muted"
                )}
              >
                <type.icon className={cn(
                  "h-4 w-4",
                  viewType === type.value ? "text-primary-foreground" : "text-muted-foreground"
                )} />
                <span>{type.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {hideControls && !hideTypeSelector && (
        <div className="flex justify-end px-2">
          <StatisticsTypeSelector
            value={statisticsType}
            onValueChange={handleTypeChange}
          />
        </div>
      )}

      {viewType === 'table' ? (
        <div className="overflow-x-auto">
          {statisticsType === 'organization' && isLoadingOrg ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {statisticsType === 'organization' && (
                    <TableHead className="w-[60px] text-center">번호</TableHead>
                  )}
                  <TableHead 
                    className={cn(
                      "w-[100px]", 
                      statisticsType === 'organization' && "cursor-pointer hover:text-primary",
                      statisticsType === 'organization' && sortColumn === 'orgName' && "text-primary font-medium"
                    )}
                    onClick={() => statisticsType === 'organization' && handleSort('orgName')}
                  >
                    {getFirstColumnHeader()}
                  </TableHead>
                  {statisticsType === 'region' && (
                    <TableHead className="w-[100px]">지역</TableHead>
                  )}
                  <TableHead 
                    className={cn(
                      "text-center", 
                      statisticsType === 'organization' && "cursor-pointer hover:text-primary",
                      statisticsType === 'organization' && sortColumn === 'construction' && "text-primary font-medium"
                    )}
                    onClick={() => statisticsType === 'organization' && handleSort('construction')}
                  >
                    공사점검
                  </TableHead>
                  <TableHead 
                    className={cn(
                      "text-center", 
                      statisticsType === 'organization' && "cursor-pointer hover:text-primary",
                      statisticsType === 'organization' && sortColumn === 'performance' && "text-primary font-medium"
                    )}
                    onClick={() => statisticsType === 'organization' && handleSort('performance')}
                  >
                    성능평가
                  </TableHead>
                  <TableHead 
                    className={cn(
                      "text-center", 
                      statisticsType === 'organization' && "cursor-pointer hover:text-primary",
                      statisticsType === 'organization' && sortColumn === 'etc' && "text-primary font-medium"
                    )}
                    onClick={() => statisticsType === 'organization' && handleSort('etc')}
                  >
                    기타
                  </TableHead>
                  <TableHead 
                    className={cn(
                      "text-center", 
                      statisticsType === 'organization' && "cursor-pointer hover:text-primary",
                      statisticsType === 'organization' && sortColumn === 'subtotal' && "text-primary font-medium"
                    )}
                    onClick={() => statisticsType === 'organization' && handleSort('subtotal')}
                  >
                    소계
                  </TableHead>
                  <TableHead 
                    className={cn(
                      "text-center", 
                      statisticsType === 'organization' && "cursor-pointer hover:text-primary",
                      statisticsType === 'organization' && sortColumn === 'total' && "text-primary font-medium"
                    )}
                    onClick={() => statisticsType === 'organization' && handleSort('total')}
                  >
                    전체
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statisticsType === 'category' ? (
                  (statistics as CategoryChartData[]).map((item) => (
                    <TableRow key={item.date}>
                      <TableCell className="font-medium">
                        {item.date}
                        <div className="text-xs text-muted-foreground">
                          ({item.dayOfWeek})
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.construction}</TableCell>
                      <TableCell className="text-center">{item.performance}</TableCell>
                      <TableCell className="text-center">{item.etc}</TableCell>
                      <TableCell className="text-center font-medium">{item.subtotal}</TableCell>
                      <TableCell className="text-center font-medium">{item.total}</TableCell>
                    </TableRow>
                  ))
                ) : statisticsType === 'region' ? (
                  (statistics as RegionChartData[]).map((dateStats) => (
                    dateStats.regions.map((stats, regionIndex) => (
                      <TableRow key={`${dateStats.date}-${stats.region}`}>
                        {regionIndex === 0 && (
                          <TableCell rowSpan={dateStats.regions.length} className="align-top">
                            {dateStats.date}
                            <div className="text-xs text-muted-foreground">
                              ({dateStats.dayOfWeek})
                            </div>
                          </TableCell>
                        )}
                        <TableCell>{stats.region}</TableCell>
                        <TableCell className="text-center">{stats.construction}</TableCell>
                        <TableCell className="text-center">{stats.performance}</TableCell>
                        <TableCell className="text-center">{stats.etc}</TableCell>
                        <TableCell className="text-center font-medium">{stats.subtotal}</TableCell>
                        <TableCell className="text-center font-medium">{stats.total}</TableCell>
                      </TableRow>
                    ))
                  ))
                ) : (
                  (sortedStatistics as any[]).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.orgName}</TableCell>
                      <TableCell className="text-center">{item.construction}</TableCell>
                      <TableCell className="text-center">{item.performance}</TableCell>
                      <TableCell className="text-center">{item.etc}</TableCell>
                      <TableCell className="text-center font-medium">{item.subtotal}</TableCell>
                      <TableCell className="text-center font-medium">{item.total}</TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={statisticsType === 'organization' ? 2 : 1} className="font-bold">
                    합계
                  </TableCell>
                  <TableCell className="text-center font-bold">{totals.construction}</TableCell>
                  <TableCell className="text-center font-bold">{totals.performance}</TableCell>
                  <TableCell className="text-center font-bold">{totals.etc}</TableCell>
                  <TableCell className="text-center font-bold">{totals.subtotal}</TableCell>
                  <TableCell className="text-center font-bold">{totals.total}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>
      ) : (
        <div className="overflow-hidden">
          <NoticeStatisticsChart 
            data={statisticsType === 'category' ? statistics as CategoryChartData[] : statistics as RegionChartData[]}
            type={statisticsType as 'category' | 'region'}
          />
        </div>
      )}
    </div>
  );
} 