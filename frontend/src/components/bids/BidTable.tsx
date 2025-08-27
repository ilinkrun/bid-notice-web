'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Star, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBidFilterStore } from '@/store/bidFilterStore';
import { useSettingsStore } from '@/store/settingsStore';
import { filterBids } from '@/lib/utils/filterBids';
import { useNavigation } from '@/hooks/useNavigation';

const BID_STAGES = [
  { value: '준비', label: '준비' },
  { value: '응찰', label: '진행' },
  { value: '완료', label: '완료' },
];

export default function BidTable({ bids, currentStatus }) {
  const { navigate } = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedBids, setSelectedBids] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    field: 'started_at',
    order: 'desc',
  });
  const { filter } = useBidFilterStore();
  const { perPage } = useSettingsStore();
  const [isComposing, setIsComposing] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  // 검색어 입력 핸들러 수정
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    // 포커스 유지
    searchInputRef.current?.focus();
  };

  // 디바운스 처리 수정
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        const currentFocused = document.activeElement === searchInputRef.current;
        setDebouncedSearchTerm(searchTerm);
        // 포커스가 있었다면 다시 포커스 설정
        if (currentFocused) {
          searchInputRef.current.focus();
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 상태 변경 핸들러
  const handleStatusChange = async (value) => {
    try {
      // 1. UI 상태 즉시 업데이트
      // 2. URL 업데이트 준비
      const newSearchParams = new URLSearchParams(window.location.search);
      const newUrl = `/bids/${encodeURIComponent(value)}?${newSearchParams.toString()}`;
      
      // 3. URL 히스토리 업데이트 (페이지 새로고침 없이)
      navigate(newUrl);
    } catch (error) {
      console.error('상태 변경 중 오류 발생:', error);
      setIsLoading(false);
    }
  };

  // 정렬 함수
  const sortData = (a, b, field) => {
    const aValue = String(a[field] || ''); // 문자열로 변환
    const bValue = String(b[field] || ''); // 문자열로 변환

    if (field === 'started_at') {
      return sortConfig.order === 'asc'
        ? new Date(aValue).getTime() - new Date(bValue).getTime()
        : new Date(bValue).getTime() - new Date(aValue).getTime();
    }

    // 문자열 비교
    if (sortConfig.order === 'asc') {
      return aValue.localeCompare(bValue);
    }
    return bValue.localeCompare(aValue);
  };

  // 검색 및 정렬된 데이터
  const filteredAndSortedBids = bids
    .filter((bid) => {
      if (!debouncedSearchTerm) return true;
      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        bid.title.toLowerCase().includes(searchLower) ||
        bid.orgName.toLowerCase().includes(searchLower) ||
        (bid.region && bid.region.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => sortData(a, b, sortConfig.field));

  const filteredBids = filterBids(filteredAndSortedBids, filter);

  // 페이지네이션 로직
  const totalPages = perPage === 0 ? 1 : Math.ceil(filteredBids.length / perPage);
  const paginatedBids =
    perPage === 0 ? filteredBids : filteredBids.slice((currentPage - 1) * perPage, currentPage * perPage);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 페이지네이션 버튼 생성 함수
  const renderPaginationButtons = () => {
    const maxButtons = 10; // 최대 표시할 버튼 수
    
    // 페이지 범위 계산
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    // 시작 페이지 조정
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    return (
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="px-2"
        >
          {'<<'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-2"
        >
          {'<'}
        </Button>
        
        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-2"
        >
          {'>'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-2"
        >
          {'>>'}
        </Button>
      </div>
    );
  };

  // 정렬 토글
  const toggleSort = (field) => {
    setSortConfig({
      field,
      order: sortConfig.field === field && sortConfig.order === 'asc' ? 'desc' : 'asc',
    });
  };

  // 체크박스 토글
  const toggleCheckbox = (bid) => {
    setSelectedBids((prev) => (prev.includes(bid) ? prev.filter((id) => id !== bid) : [...prev, bid]));
  };

  // 즐겨찾기 토글 함수
  const handleAddToFavorites = () => {
    setFavorites((prev) => [...prev, ...selectedBids]);
  };

  return (
    <div>
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-base font-medium text-gray-700">데이터를 불러오는 중입니다...</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-4 mb-0">
        <div className="flex items-center gap-4 flex-1">
        <Select value={currentStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="단계 선택">
                {decodeURIComponent(currentStatus)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white">
              {BID_STAGES.map((stage) => (
                <SelectItem 
                  key={stage.value} 
                  value={stage.value} 
                  className="text-gray-700 hover:bg-gray-200"
                >
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex items-center gap-2 w-[500px]">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                ref={searchInputRef}
                placeholder="입찰 검색..."
                value={searchTerm}
                onChange={handleSearchInput}
                className="pl-8 bg-gray-100 border-gray-300 text-gray-700 placeholder-gray-500"
                autoComplete="off"
                type="text"
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => {
                  setIsComposing(false);
                  searchInputRef.current?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Process' || isComposing) {
                    return;
                  }
                }}
                onBlur={(e) => {
                  if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget as Node)) {
                    searchInputRef.current?.focus();
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={handleAddToFavorites}
          className="bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 h-10 w-10 flex items-center justify-center"
          title="즐겨찾기 추가"
        >
          <Star className="h-4 w-4 text-gray-500" />
        </Button>
        </div>

      </div>


      {/* 테이블 */}
      <div className="!border !border-gray-300 table-container !bg-white overflow-x-auto category-page [&_*]:!border-gray-300">
        <Table className="w-full min-w-[800px]">
          <TableHeader className="[&_tr]:!border-gray-300">
            <TableRow className="!border-gray-300">
              <TableHead className="w-[40px] !bg-gray-100 !text-gray-900 !border-gray-300">
                <Checkbox
                  checked={selectedBids.length === bids.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedBids(bids.map(bid => bid.bid));
                    } else {
                      setSelectedBids([]);
                    }
                  }}
                  aria-label="모든 항목 선택"
                  className="!border-gray-300"
                />
              </TableHead>
              <TableHead className="w-[100px] !bg-gray-100 !text-gray-900 !border-gray-300">
                <button
                  className="flex items-center gap-2 !font-medium !text-gray-900"
                  onClick={() => toggleSort('category')}
                >
                  유형
                </button>
              </TableHead>
              <TableHead className="w-[120px] !bg-gray-100 !text-gray-900 !border-gray-300">
                <button
                  className="flex items-center gap-2 !font-medium !text-gray-900"
                  onClick={() => toggleSort('orgName')}
                >
                  기관명
                </button>
              </TableHead>
              <TableHead className="w-auto !bg-gray-100 !text-gray-900 !border-gray-300">
                <button
                  className="flex items-center gap-2 !font-medium !text-gray-900"
                  onClick={() => toggleSort('title')}
                >
                  제목
                </button>
              </TableHead>
              <TableHead className="w-[80px] !bg-gray-100 !text-gray-900 !border-gray-300">
                <button
                  className="flex items-center gap-2 !font-medium !text-gray-900"
                  onClick={() => toggleSort('region')}
                >
                  지역
                </button>
              </TableHead>
              <TableHead className="w-[100px] !bg-gray-100 !text-gray-900 !border-gray-300">
                <button
                  className="flex items-center gap-2 !font-medium !text-gray-900"
                  onClick={() => toggleSort('started_at')}
                >
                  입찰일
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBids.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-[300px]" />
              </TableRow>
            ) : (
              paginatedBids.map((bid) => (
                <TableRow 
                  key={bid.bid}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <TableCell className="w-[40px]">
                    <Checkbox
                      checked={selectedBids.includes(bid.bid)}
                      onCheckedChange={() => toggleCheckbox(bid.bid)}
                      aria-label={`${bid.title} 선택`}
                    />
                  </TableCell>
                  <TableCell className="w-[100px] whitespace-nowrap">
                    {bid.category}
                  </TableCell>
                  <TableCell className="w-[120px] whitespace-nowrap">
                    {bid.orgName}
                  </TableCell>
                  <TableCell className="w-auto max-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/bids/${bid.nid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            {bid.title}
                          </a>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="w-[80px] whitespace-nowrap">
                    {bid.region}
                  </TableCell>
                  <TableCell className="w-[100px] whitespace-nowrap">
                    {bid.started_at.split('T')[0]}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {perPage > 0 && totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4 pagination">
          {renderPaginationButtons()}
        </div>
      )}
    </div>
  );
} 