'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
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
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';

interface ErrorScraping {
  id: string;
  orgName: string;
  errorMessage: string;
  time: string;
}

interface ErrorScrapingStatisticsTableProps {
  initialData: ErrorScraping[];
  defaultGap: string;
}

// 컬럼 타입 및 표시 이름 매핑
type SortableColumn = 'time' | 'orgName' | 'errorMessage';
type SortDirection = 'asc' | 'desc';

const columnDisplayNames: Record<SortableColumn, string> = {
  'time': '시간',
  'orgName': '기관명',
  'errorMessage': '오류 메시지'
};

export function ErrorScrapingStatisticsTable({
  initialData,
  defaultGap,
}: ErrorScrapingStatisticsTableProps) {
  const { navigate } = useUnifiedNavigation();
  const { finishLoading } = useUnifiedLoading();
  const searchParams = useSearchParams();

  // URL 파라미터에서 초기값 가져오기
  const [gap, setGap] = useState(() => {
    const gapParam = searchParams.get('gap');
    return gapParam || defaultGap;
  });

  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(() => {
    const sort = searchParams.get('sort') as SortableColumn | null;
    return sort || null;
  });

  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    const order = searchParams.get('order') as SortDirection | null;
    return order === 'desc' ? 'desc' : 'asc';
  });

  const [searchQuery, setSearchQuery] = useState(() => {
    const keyword = searchParams.get('keyword');
    return keyword || '';
  });

  // URL 파라미터로 상태 업데이트
  useEffect(() => {
    const gapParam = searchParams.get('gap');
    const sort = searchParams.get('sort') as SortableColumn | null;
    const order = searchParams.get('order') as SortDirection | null;
    const keyword = searchParams.get('keyword');

    if (gapParam) setGap(gapParam);
    if (sort) setSortColumn(sort);
    if (order) setSortDirection(order === 'desc' ? 'desc' : 'asc');
    if (keyword !== null) setSearchQuery(keyword);
  }, [searchParams]);

  // 초기 데이터가 있거나 렌더링 완료시 로딩 해제
  useEffect(() => {
    if (initialData !== undefined) {
      finishLoading();
    }
  }, [initialData, finishLoading]);

  // URL 업데이트 함수 (페이지 리로드)
  const updateURLAndReload = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    // 파라미터 업데이트
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    // 페이지 리로드
    window.location.href = `/statistics/errors_scraping?${newParams.toString()}`;
  };

  // URL 업데이트 함수 (정렬용 - 리로드 없이)
  const updateURL = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    // 파라미터 업데이트
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    navigate(`/statistics/errors_scraping?${newParams.toString()}`);
  };

  // 폼 제출 핸들러 (gap 변경 시 페이지 리로드)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateURLAndReload({ gap });
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  // 검색 폼 제출 핸들러 (Enter 키 입력 시)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateURLAndReload({ keyword: searchQuery || null });
  };

  // 정렬 핸들러
  const handleSort = (column: SortableColumn) => {
    let newDirection: SortDirection = 'asc';

    if (sortColumn === column) {
      // 같은 컬럼을 다시 클릭하면 정렬 방향을 반대로 변경
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }

    setSortColumn(column);
    setSortDirection(newDirection);

    // URL 업데이트
    updateURL({
      sort: column,
      order: newDirection
    });
  };

  // 필터링 및 정렬된 데이터 계산
  const filteredAndSortedData = useMemo(() => {
    // 검색어로 필터링
    let filteredData = initialData;

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filteredData = initialData.filter(item => {
        // 기관명에서 검색
        const orgNameMatch = item.orgName.toLowerCase().includes(query);

        // 오류 메시지에서 검색
        const errorMessageMatch = item.errorMessage.toLowerCase().includes(query);

        // 날짜에서 검색 (원본 time과 포맷된 날짜 모두 검색)
        const formattedDate = formatDate(item.time);
        const timeMatch = item.time.toLowerCase().includes(query) || formattedDate.toLowerCase().includes(query);

        return orgNameMatch || errorMessageMatch || timeMatch;
      });
    }

    // 정렬할 컬럼이 없으면 필터링된 데이터 반환
    if (!sortColumn) return filteredData;

    // 정렬 로직
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // 문자열 비교
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [initialData, sortColumn, sortDirection, searchQuery]);

  // 정렬 아이콘 렌더링 함수
  const renderSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-4 w-4 inline" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-4 w-4 inline" />
      : <ArrowDown className="ml-1 h-4 w-4 inline" />;
  };

  // 검색 결과 초기화 핸들러
  const handleClearSearch = () => {
    setSearchQuery('');
    updateURL({ q: null });
  };

  // 정렬 초기화 핸들러
  const handleClearSort = () => {
    setSortColumn(null);
    setSortDirection('asc');
    updateURL({ sort: null, order: null });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        {/* 갭 입력 폼 */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            type="number"
            value={gap}
            onChange={(e) => setGap(e.target.value)}
            className="w-24"
            min="1"
          />
          <span>일 전부터의 통계</span>
        </form>

        {/* 검색 입력 필드 */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-color-primary-muted-foreground h-4 w-4" />
            <Input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-8 w-full md:w-64"
              placeholder="기관명 또는 오류 메시지 검색..."
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                onClick={handleClearSearch}
              >
                ✕
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* 활성화된 필터 표시 - 비활성화됨 */}
      {false && (searchQuery || sortColumn) && (
        <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
          <span className="text-color-primary-muted-foreground">활성 필터:</span>
          {searchQuery && (
            <div className="px-2 py-1 rounded-md flex items-center gap-1">
              <span>검색: {searchQuery}</span>
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={handleClearSearch}>
                ✕
              </Button>
            </div>
          )}
          {sortColumn && (
            <div className="px-2 py-1 rounded-md flex items-center gap-1">
              <span>정렬: {columnDisplayNames[sortColumn as string] || sortColumn} ({sortDirection === 'asc' ? '오름차순' : '내림차순'})</span>
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={handleClearSort}>
                ✕
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => handleSort('time')}
                className="cursor-pointer hover:bg-color-primary-hovered"
              >
                시간 {renderSortIcon('time')}
              </TableHead>
              <TableHead
                onClick={() => handleSort('orgName')}
                className="cursor-pointer hover:bg-color-primary-hovered"
              >
                기관명 {renderSortIcon('orgName')}
              </TableHead>
              <TableHead
                onClick={() => handleSort('errorMessage')}
                className="cursor-pointer hover:bg-color-primary-hovered"
              >
                오류 메시지 {renderSortIcon('errorMessage')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6">
                  {searchQuery ? '검색 결과가 없습니다.' : '데이터가 없습니다.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedData.map((item) => {
                return (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.time)}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-color-primary-foreground">
                        {item.orgName || '에러 없음'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.errorMessage}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 검색 결과 요약 */}
      <div className="mt-2 text-sm text-color-primary-muted-foreground flex justify-between items-center">
        <div>
          {searchQuery && `검색 결과: 총 ${filteredAndSortedData.length}개 항목`}
        </div>
        <div>
          총 {filteredAndSortedData.length}개 항목 (전체 {initialData.length}개)
        </div>
      </div>
    </div>
  );
}
