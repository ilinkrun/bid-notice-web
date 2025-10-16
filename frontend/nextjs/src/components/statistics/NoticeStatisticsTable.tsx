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
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { StatisticsTypeSelector } from './StatisticsTypeSelector';
import { GapSelector } from './GapSelector';
import { NoticeStatisticsChart } from './NoticeStatisticsChart';
import { PageHeader } from '@/components/shared/PageHeader';
import { processNoticeStatistics } from '@/lib/utils/statistics';
import { Table as TableIcon, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const GET_NOTICE_CATEGORIES = gql`
  query GetNoticeCategories {
    noticeCategoriesActive {
      sn
      category
      keywords
      nots
      minPoint
      creator
      use
    }
  }
`;

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
  
  // GraphQL 쿼리로 카테고리 데이터 가져오기
  const { data: categoriesData, loading: categoriesLoading } = useQuery(GET_NOTICE_CATEGORIES);
  const [statisticsType, setStatisticsType] = useState<string>(() => {
    const typeParam = searchParams.get('type');
    return typeParam ? (urlParamToType[typeParam] || defaultType) : defaultType;
  });
  const [viewType, setViewType] = useState<'table' | 'chart'>(() => {
    const modeParam = searchParams.get('mode');
    return (modeParam === 'chart' || modeParam === 'table') ? modeParam : defaultViewType;
  });
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [orgStatistics, setOrgStatistics] = useState<any[]>([]);
  const [isLoadingOrg, setIsLoadingOrg] = useState(false);
  const [orgUrls, setOrgUrls] = useState<{ [orgName: string]: string | null }>({});

  // 동적 카테고리 배열 생성
  const categoryLabels = useMemo(() => {
    if (categoriesData?.noticeCategoriesActive) {
      return categoriesData.noticeCategoriesActive.map((cat: any) => cat.category);
    }
    return ['공사점검', '성능평가', '기타']; // 기본값
  }, [categoriesData]);

  // 기관명 URL 조회 함수
  const getOrganizationUrl = async (orgName: string): Promise<string | null> => {
    try {
      if (!orgName || typeof orgName !== 'string') {
        return null;
      }

      const requestBody = {
        query: `
          query SettingsNoticeListByOrg($orgName: String!) {
            settingsNoticeListByOrg(orgName: $orgName) {
              oid
              orgName
              url
            }
          }
        `,
        variables: { orgName }
      };

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.error(`GraphQL request failed: ${response.status} ${response.statusText}`);
        return null;
      }

      const result = await response.json();

      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        return null;
      }

      if (result.data?.settingsNoticeListByOrg?.length > 0) {
        const orgSettings = result.data.settingsNoticeListByOrg[0];
        if (orgSettings.url) {
          return orgSettings.url.replace(/\$\{i\}/g, '1');
        }
      }
      return null;
    } catch (error) {
      console.error('기관 정보 조회 중 오류 발생:', error);
      return null;
    }
  };

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', typeToUrlParam[value]);
    navigate(`?${params.toString()}`);
    setStatisticsType(value);
  };

  const handleViewTypeChange = (value: 'table' | 'chart') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', value);
    navigate(`?${params.toString()}`);
    setViewType(value);
  };

  const categoryStatistics = useMemo(() => 
    processNoticeStatistics.category(initialData, 14, categoryLabels), [initialData, categoryLabels]);

  const regionStatistics = useMemo(() => 
    processNoticeStatistics.region(initialData, categoryLabels), [initialData, categoryLabels]);

  // URL 파라미터 변경 감지 및 상태 동기화
  useEffect(() => {
    const typeParam = searchParams.get('type');
    const modeParam = searchParams.get('mode');
    
    // 타입 동기화
    const newType = typeParam ? (urlParamToType[typeParam] || 'category') : 'category';
    if (newType !== statisticsType) {
      setStatisticsType(newType);
    }
    
    // 모드 동기화  
    const newMode = (modeParam === 'chart' || modeParam === 'table') ? modeParam : 'table';
    if (newMode !== viewType) {
      setViewType(newMode);
    }
  }, [searchParams]);

  // 기관별 통계 데이터 로드
  useEffect(() => {
    const loadOrgStatistics = () => {
      if (statisticsType === 'organization') {
        setIsLoadingOrg(true);
        try {
          const orgData = processNoticeStatistics.organization(initialData, categoryLabels);
          setOrgStatistics(orgData);
        } catch (error) {
          console.error('기관별 통계 데이터 로드 중 오류 발생:', error);
          setOrgStatistics([]);
        } finally {
          setIsLoadingOrg(false);
        }
      }
    };
    
    loadOrgStatistics();
  }, [statisticsType, initialData, categoryLabels]);

  // 기관명 URL 로드
  useEffect(() => {
    const loadOrgUrls = async () => {
      if (statisticsType === 'organization' && orgStatistics.length > 0) {
        const uniqueOrgNames = Array.from(new Set(orgStatistics.map(item => item.orgName).filter(Boolean))) as string[];
        const urlCache: { [orgName: string]: string | null } = {};

        for (const orgName of uniqueOrgNames) {
          if (orgUrls[orgName] === undefined) {
            try {
              const url = await getOrganizationUrl(orgName);
              urlCache[orgName] = url;
            } catch (error) {
              console.error(`Error loading URL for ${orgName}:`, error);
              urlCache[orgName] = null;
            }
          }
        }

        if (Object.keys(urlCache).length > 0) {
          setOrgUrls(prev => ({ ...prev, ...urlCache }));
        }
      }
    };

    loadOrgUrls().catch(console.error);
  }, [statisticsType, orgStatistics]);

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
        totals = processNoticeStatistics.calculateTotals(data, categoryLabels);
        break;
      case 'region':
        data = regionStatistics;
        totals = processNoticeStatistics.calculateTotals(data.flatMap(d => d.regions), categoryLabels);
        break;
      case 'organization':
        data = orgStatistics;
        totals = processNoticeStatistics.calculateTotals(data, categoryLabels);
        break;
      default:
        data = categoryStatistics;
        totals = processNoticeStatistics.calculateTotals(data, categoryLabels);
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
                    <div className="text-xs text-color-primary-muted-foreground">
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
          <TableRow className="bg-color-primary-hovered/50">
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
        <TableRow className="bg-color-primary-hovered/50">
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
    <div className="space-y-1">
      {/* 페이지 헤더 */}
      <PageHeader
        title="입찰공고 통계"
        breadcrumbs={[
          { label: '통계', href: '/statistics/notice' },
          { label: '입찰공고 통계', href: '/statistics/notice' }
        ]}
        helpTooltip="입찰공고 통계를 확인하세요"
        helpContent="입찰공고 통계 페이지에서는 카테고리별, 지역별, 기관별 통계를 표와 차트로 확인할 수 있습니다."
      />

      {!hideControls && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
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
                variant="outline"
                size="sm"
                onClick={() => handleViewTypeChange(type.value)}
                className={cn(
                  "flex items-center gap-2 transition-colors text-color-primary-foreground border-color-primary-foreground hover:bg-color-primary-hovered",
                  viewType === type.value
                    ? "bg-color-primary-muted font-semibold"
                    : ""
                )}
              >
                <type.icon className="h-4 w-4 text-color-primary-foreground" />
                <span>{type.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {hideControls && !hideTypeSelector && (
        <div className="flex justify-end">
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
                  {categoryLabels.map((label) => {
                    return (
                      <TableHead 
                        key={label}
                        className={cn(
                          "text-center", 
                          statisticsType === 'organization' && "cursor-pointer hover:text-primary",
                          statisticsType === 'organization' && sortColumn === label && "text-primary font-medium"
                        )}
                        onClick={() => statisticsType === 'organization' && handleSort(label)}
                      >
                        {label}
                      </TableHead>
                    );
                  })}
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
                        <div className="text-xs text-color-primary-muted-foreground">
                          ({item.dayOfWeek})
                        </div>
                      </TableCell>
                      {categoryLabels.map((label) => (
                        <TableCell key={label} className="text-center">{item[label] || 0}</TableCell>
                      ))}
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
                            <div className="text-xs text-color-primary-muted-foreground">
                              ({dateStats.dayOfWeek})
                            </div>
                          </TableCell>
                        )}
                        <TableCell>{stats.region}</TableCell>
                        {categoryLabels.map((label) => (
                          <TableCell key={label} className="text-center">{stats[label] || 0}</TableCell>
                        ))}
                        <TableCell className="text-center font-medium">{stats.subtotal}</TableCell>
                        <TableCell className="text-center font-medium">{stats.total}</TableCell>
                      </TableRow>
                    ))
                  ))
                ) : (
                  (sortedStatistics as any[]).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {(() => {
                          const orgUrl = orgUrls[item.orgName];
                          if (orgUrl) {
                            return (
                              <a
                                href={orgUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-color-primary-foreground hover:text-blue-600 hover:underline cursor-pointer"
                                title="기관 게시판 페이지로 이동"
                              >
                                {item.orgName}
                              </a>
                            );
                          } else {
                            return (
                              <span className="text-sm font-medium text-color-primary-foreground">
                                {item.orgName}
                              </span>
                            );
                          }
                        })()}
                      </TableCell>
                      {categoryLabels.map((label) => (
                        <TableCell key={label} className="text-center">{item[label] || 0}</TableCell>
                      ))}
                      <TableCell className="text-center font-medium">{item.subtotal}</TableCell>
                      <TableCell className="text-center font-medium">{item.total}</TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="bg-color-primary-hovered/50">
                  <TableCell colSpan={statisticsType === 'organization' ? 2 : statisticsType === 'region' ? 2 : 1} className="font-bold">
                    합계
                  </TableCell>
                  {categoryLabels.map((label) => (
                    <TableCell key={label} className="text-center font-bold">{totals[label] || 0}</TableCell>
                  ))}
                  <TableCell className="text-center font-bold">{totals.subtotal}</TableCell>
                  <TableCell className="text-center font-bold">{totals.total}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>
      ) : (
        <div className="overflow-hidden">
          {statisticsType === 'organization' ? (
            <div className="flex items-center justify-center h-96 text-color-primary-muted-foreground">
              <div className="text-center">
                <p className="text-lg mb-2">기관별 통계 차트</p>
                <p className="text-sm">기관별 데이터는 차트 형태로 제공되지 않습니다.</p>
                <p className="text-sm">표 형태로 데이터를 확인해주세요.</p>
              </div>
            </div>
          ) : (
            <NoticeStatisticsChart 
              data={statisticsType === 'category' ? statistics as CategoryChartData[] : statistics as RegionChartData[]}
              type={statisticsType as 'category' | 'region'}
              categoryLabels={categoryLabels}
            />
          )}
        </div>
      )}
    </div>
  );
} 