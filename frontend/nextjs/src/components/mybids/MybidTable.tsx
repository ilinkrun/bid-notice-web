'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Star, Loader2, Edit3 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useBidFilterStore } from '@/store/bidFilterStore';
import { useSettingsStore } from '@/store/settingsStore';
import { filterBids } from '@/lib/utils/filterBids';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useRouter, usePathname } from 'next/navigation';

const BID_STAGES = [
  { value: 'progress', label: '진행' },
  { value: 'bidding', label: '응찰' },
  { value: 'ended', label: '종료' },
];

// 각 단계별 변경 가능한 상태 옵션
const getStatusChangeOptions = (currentStatus) => {
  switch (currentStatus) {
    case 'progress': // 진행: 응찰, 낙찰, 패찰, 포기 가능
      return [
        { value: 'bidding', label: '응찰' },
        { value: '낙찰', label: '낙찰' },
        { value: '패찰', label: '패찰' },
        { value: '포기', label: '포기' },
      ];
    case 'bidding': // 응찰: 낙찰, 패찰, 진행, 포기 가능
      return [
        { value: '낙찰', label: '낙찰' },
        { value: '패찰', label: '패찰' },
        { value: 'progress', label: '진행' },
        { value: '포기', label: '포기' },
      ];
    case 'ended': // 종료: 진행, 응찰로만 변경 가능
      return [
        { value: 'progress', label: '진행' },
        { value: 'bidding', label: '응찰' },
      ];
    default:
      return [];
  }
};

export default function BidTable({ bids, currentStatus }) {
  const { navigate } = useUnifiedNavigation();
  const pathname = usePathname();
  const [localStatus, setLocalStatus] = useState(currentStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedBids, setSelectedBids] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    field: 'postedAt',
    order: 'desc',
  });
  const { filter } = useBidFilterStore();
  const { perPage } = useSettingsStore();
  const [isComposing, setIsComposing] = useState(false);
  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // 동적 필드 상태들
  const [bidAmount, setBidAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [createProject, setCreateProject] = useState(false);
  const [pm, setPm] = useState('');
  const [giveupReason, setGiveupReason] = useState('');
  
  // 종료 페이지에서 사용할 상태별 필터링
  const [endedStatusFilters, setEndedStatusFilters] = useState({
    '낙찰': true,
    '패찰': true,
    '포기': true,
  });

  // URL 변경시 localStatus 동기화
  useEffect(() => {
    const pathSegments = pathname.split('/');
    const statusFromPath = pathSegments[pathSegments.length - 1];
    if (statusFromPath && statusFromPath !== localStatus) {
      setLocalStatus(statusFromPath);
    }
  }, [pathname]);

  // currentStatus prop 변경시 localStatus 동기화
  useEffect(() => {
    setLocalStatus(currentStatus);
  }, [currentStatus]);

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

  // 상태 선택 핸들러 (드롭다운)
  const handleStatusSelection = async (value) => {
    try {
      // 1. UI 상태 즉시 업데이트
      // 2. URL 업데이트 준비
      const newSearchParams = new URLSearchParams(window.location.search);
      const newUrl = `/mybids/${encodeURIComponent(value)}?${newSearchParams.toString()}`;
      
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

    if (field === 'started_at' || field === 'postedAt') {
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
      // 검색 필터
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const matchesSearch = (
          bid.title.toLowerCase().includes(searchLower) ||
          bid.orgName.toLowerCase().includes(searchLower) ||
          (bid.region && bid.region.toLowerCase().includes(searchLower))
        );
        if (!matchesSearch) return false;
      }
      
      // 종료 페이지에서 상태별 필터링
      if (localStatus === 'ended') {
        const bidStatus = bid.status;
        if (!endedStatusFilters[bidStatus]) {
          return false;
        }
      }
      
      return true;
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



  // 모달 열기시 필드 초기화
  const handleStatusChangeModal = () => {
    if (selectedBids.length === 0) {
      alert('선택된 항목이 없습니다.');
      return;
    }
    // 필드들 초기화
    setSelectedStatus('');
    setBidAmount('');
    setMemo('');
    setCreateProject(false);
    setPm('');
    setGiveupReason('');
    setIsStatusChangeModalOpen(true);
  };

  // 입찰 단계 변경 확인 처리
  const handleConfirmStatusChange = () => {
    if (!selectedStatus) {
      alert('변경할 단계를 선택해주세요.');
      return;
    }
    
    // TODO: API 호출하여 단계 변경
    const changeData = {
      bids: selectedBids,
      newStatus: selectedStatus,
      bidAmount: selectedStatus === 'bidding' ? bidAmount : undefined,
      memo: ['bidding', '낙찰', '패찰', '포기'].includes(selectedStatus) ? memo : undefined,
      createProject: selectedStatus === '낙찰' ? createProject : undefined,
      pm: selectedStatus === '낙찰' ? pm : undefined,
      giveupReason: selectedStatus === '포기' ? giveupReason : undefined,
    };
    
    console.log('입찰 단계 변경:', changeData);
    
    setSelectedBids([]);
    setIsStatusChangeModalOpen(false);
    const statusLabel = getStatusChangeOptions(localStatus).find(option => option.value === selectedStatus)?.label || selectedStatus;
    alert(`입찰 단계가 '${statusLabel}'로 변경되었습니다.`);
  };

  // 동적 필드 렌더링
  const renderDynamicFields = () => {
    switch (selectedStatus) {
      case 'bidding': // 응찰
        return (
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="bidAmount">응찰가</Label>
              <Input
                id="bidAmount"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="응찰 금액을 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="memo">메모</Label>
              <textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="메모를 입력하세요"
              />
            </div>
          </div>
        );
      
      case '낙찰':
        return (
          <div className="space-y-4 mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createProject"
                checked={createProject}
                onCheckedChange={(checked) => setCreateProject(checked as boolean)}
              />
              <Label htmlFor="createProject">프로젝트 생성</Label>
            </div>
            <div>
              <Label htmlFor="pm">PM</Label>
              <Input
                id="pm"
                value={pm}
                onChange={(e) => setPm(e.target.value)}
                placeholder="PM을 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="memo">메모</Label>
              <textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="메모를 입력하세요"
              />
            </div>
          </div>
        );
      
      case '패찰':
        return (
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="memo">메모</Label>
              <textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="메모를 입력하세요"
              />
            </div>
          </div>
        );
      
      case '포기':
        return (
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="giveupReason">포기 이유</Label>
              <Input
                id="giveupReason"
                value={giveupReason}
                onChange={(e) => setGiveupReason(e.target.value)}
                placeholder="포기 이유를 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="memo">메모</Label>
              <textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="메모를 입력하세요"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
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
        <Select value={localStatus} onValueChange={handleStatusSelection}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="단계 선택">
                {BID_STAGES.find(stage => stage.value === localStatus)?.label || localStatus}
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
        {/* 종료 페이지에서만 상태별 필터 표시 */}
        {localStatus === 'ended' && (
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-gray-600">상태:</span>
            {Object.entries(endedStatusFilters).map(([status, checked]) => (
              <label key={status} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    setEndedStatusFilters(prev => ({
                      ...prev,
                      [status]: e.target.checked
                    }))
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{status}</span>
              </label>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          onClick={handleStatusChangeModal}
          className="bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 h-10 w-10 flex items-center justify-center"
          title="입찰 단계 변경"
        >
          <Edit3 className="h-4 w-4 text-gray-500" />
        </Button>
        </div>

      </div>


      {/* 테이블 */}
      <div className="border border-gray-300 table-container bg-white overflow-x-auto category-page">
        <Table className="w-full min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] [background:var(--table-header-bg)_!important] text-white">
                <Checkbox
                  checked={selectedBids.length === bids.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedBids(bids.map(bid => parseInt(bid.mid)));
                    } else {
                      setSelectedBids([]);
                    }
                  }}
                  aria-label="모든 항목 선택"
                  className="!w-4 !h-4 !min-w-4 !min-h-4 !max-w-4 !max-h-4 !bg-white !border-white hover:!bg-white focus:!bg-white data-[state=checked]:!bg-white data-[state=unchecked]:!bg-white data-[state=checked]:!text-[var(--table-header-bg)]"
                />
              </TableHead>
              <TableHead className="w-[100px] [background:var(--table-header-bg)_!important] text-white">
                <button
                  className="flex items-center gap-2 text-white"
                  onClick={() => toggleSort('category')}
                >
                  유형
                </button>
              </TableHead>
              <TableHead className="w-[120px] [background:var(--table-header-bg)_!important] text-white">
                <button
                  className="flex items-center gap-2 text-white"
                  onClick={() => toggleSort('orgName')}
                >
                  기관명
                </button>
              </TableHead>
              <TableHead className="w-auto [background:var(--table-header-bg)_!important] text-white">
                <button
                  className="flex items-center gap-2 text-white"
                  onClick={() => toggleSort('title')}
                >
                  제목
                </button>
              </TableHead>
              <TableHead className="w-[80px] [background:var(--table-header-bg)_!important] text-white">
                <button
                  className="flex items-center gap-2 text-white"
                  onClick={() => toggleSort('region')}
                >
                  지역
                </button>
              </TableHead>
              {localStatus === 'ended' && (
                <TableHead className="w-[80px] [background:var(--table-header-bg)_!important] text-white">
                  <button
                    className="flex items-center gap-2 text-white"
                    onClick={() => toggleSort('status')}
                  >
                    상태
                  </button>
                </TableHead>
              )}
              <TableHead className="w-[100px] [background:var(--table-header-bg)_!important] text-white">
                <button
                  className="flex items-center gap-2 text-white"
                  onClick={() => toggleSort('postedAt')}
                >
                  등록일
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBids.length === 0 ? (
              <TableRow>
                <TableCell colSpan={localStatus === 'ended' ? 7 : 6} className="h-[300px]" />
              </TableRow>
            ) : (
              paginatedBids.map((bid) => (
                <TableRow 
                  key={bid.mid}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    window.location.href = `/mybids/${localStatus}/${bid.nid}`;
                  }}
                >
                  <TableCell className="w-[40px]">
                    <Checkbox
                      checked={selectedBids.includes(bid.mid)}
                      onCheckedChange={() => toggleCheckbox(bid.mid)}
                      onClick={(e) => e.stopPropagation()}
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
                            href={bid.detailUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
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
                  {localStatus === 'ended' && (
                    <TableCell className="w-[80px] whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        bid.status === '낙찰' ? 'bg-green-100 text-green-800' :
                        bid.status === '패찰' ? 'bg-red-100 text-red-800' :
                        bid.status === '포기' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {bid.status}
                      </span>
                    </TableCell>
                  )}
                  <TableCell className="w-[100px] whitespace-nowrap">
                    {bid.postedAt ? bid.postedAt.split('T')[0] : bid.postedAt}
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

      {/* 입찰 단계 변경 모달 */}
      <Dialog open={isStatusChangeModalOpen} onOpenChange={setIsStatusChangeModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>입찰 단계 변경</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>변경할 단계</Label>
              <div className="flex flex-wrap gap-4">
                {getStatusChangeOptions(localStatus).map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={selectedStatus === option.value}
                      onCheckedChange={() => setSelectedStatus(option.value)}
                    />
                    <Label htmlFor={`status-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            {renderDynamicFields()}
            <div className="text-sm text-gray-600">
              선택된 {selectedBids.length}개 항목의 단계를 변경합니다.
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsStatusChangeModalOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleConfirmStatusChange}>
              변경
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
} 