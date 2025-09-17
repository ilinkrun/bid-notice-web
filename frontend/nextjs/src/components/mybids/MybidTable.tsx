'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Star, Loader2, Edit3 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchInput, OutlineSelectBox, OutlineSelectItem } from '@/components/shared/FormComponents';
import { PageHeader } from '@/components/shared/PageHeader';
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
  console.log('MybidTable - bids data:', bids);
  console.log('MybidTable - first bid title:', bids?.[0]?.title);
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

  // 기관명 URL 조회 및 생성 함수
  const getOrganizationUrl = async (orgName: string): Promise<string | null> => {
    try {
      // GraphQL 쿼리로 기관 URL 가져오기
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        })
      });

      const result = await response.json();

      if (result.data?.settingsNoticeListByOrg?.length > 0) {
        const orgSettings = result.data.settingsNoticeListByOrg[0];
        if (orgSettings.url) {
          // URL에 ${i}가 포함된 경우 1로 치환하여 1페이지로 설정
          return orgSettings.url.replace(/\$\{i\}/g, '1');
        }
      }
      return null;
    } catch (error) {
      console.error('기관 정보 조회 중 오류 발생:', error);
      return null;
    }
  };

  // 기관명별 URL 캐시
  const [orgUrls, setOrgUrls] = useState<{ [orgName: string]: string | null }>({});

  // 입찰 목록이 변경될 때 기관명 URL들을 미리 로드
  useEffect(() => {
    const loadOrgUrls = async () => {
      const uniqueOrgNames = Array.from(new Set(bids.map(bid => bid.orgName).filter(Boolean))) as string[];
      const urlCache: { [orgName: string]: string | null } = {};
      
      console.log('Loading URLs for organizations:', uniqueOrgNames);
      
      for (const orgName of uniqueOrgNames) {
        if (orgUrls[orgName] === undefined) { // undefined인 경우에만 로드
          console.log('Loading URL for:', orgName);
          urlCache[orgName] = await getOrganizationUrl(orgName);
        }
      }
      
      if (Object.keys(urlCache).length > 0) {
        console.log('Setting URLs:', urlCache);
        setOrgUrls(prev => ({ ...prev, ...urlCache }));
      }
    };

    if (bids.length > 0) {
      loadOrgUrls();
    }
  }, [bids]); // orgUrls는 의존성에서 제외하여 무한루프 방지
  
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
                className="w-full p-2 border border-border rounded-md  text-color-primary-foreground"
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
                className="w-full p-2 border border-border rounded-md  text-color-primary-foreground"
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
                className="w-full p-2 border border-border rounded-md  text-color-primary-foreground"
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
                className="w-full p-2 border border-border rounded-md  text-color-primary-foreground"
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

  // 상태별 페이지 타이틀과 브레드크럼 생성
  const getPageInfo = () => {
    const statusMap = {
      'progress': { label: '진행', path: 'progress' },
      'bidding': { label: '응찰', path: 'bidding' },
      'ended': { label: '종료', path: 'ended' }
    };

    const currentStatusInfo = statusMap[localStatus] || { label: '진행', path: 'progress' };

    return {
      title: `${currentStatusInfo.label} 입찰`,
      breadcrumbs: [
        { label: '입찰', href: '/mybids/progress' },
        { label: currentStatusInfo.label, href: `/mybids/${currentStatusInfo.path}` }
      ]
    };
  };

  const { title, breadcrumbs } = getPageInfo();

  return (
    <div>
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-base font-medium text-color-primary-foreground">데이터를 불러오는 중입니다...</p>
          </div>
        </div>
      )}

      {/* 페이지 헤더 */}
      <PageHeader title={title} breadcrumbs={breadcrumbs} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <OutlineSelectBox
            value={localStatus}
            onValueChange={handleStatusSelection}
            placeholder="단계 선택"
          >
            {BID_STAGES.map((stage) => (
              <OutlineSelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </OutlineSelectItem>
            ))}
          </OutlineSelectBox>
          <div className="relative flex items-center gap-2 flex-1" style={{ minWidth: '10px' }}>
            <div className="relative flex-1" style={{ minWidth: '10px' }}>
              <SearchInput
                ref={searchInputRef}
                placeholder="입찰 검색..."
                value={searchTerm}
                onChange={handleSearchInput}
                className="w-full"
                autoComplete="off"
                type="text"
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => {
                  setIsComposing(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Process' || isComposing) {
                    return;
                  }
                }}
                onBlur={(e) => {
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
        {/* 종료 페이지에서만 상태별 필터 표시 */}
        {localStatus === 'ended' && (
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-color-primary-muted-foreground">상태:</span>
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
                  className="rounded border-border"
                />
                <span className="text-sm">{status}</span>
              </label>
            ))}
          </div>
        )}
        </div>

      </div>


      {/* 테이블 */}
      <div className="statistics-cell">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-auto cursor-pointer"
                data-sortable="true"
                data-sort-active={sortConfig.field === 'title'}
                onClick={() => toggleSort('title')}
              >
                제목
              </TableHead>
              <TableHead
                className="w-[100px] cursor-pointer"
                data-sortable="true"
                data-sort-active={sortConfig.field === 'postedAt'}
                onClick={() => toggleSort('postedAt')}
              >
                등록일
              </TableHead>
              <TableHead
                className="w-[80px] cursor-pointer"
                data-sortable="true"
                data-sort-active={sortConfig.field === 'category'}
                onClick={() => toggleSort('category')}
              >
                유형
              </TableHead>
              <TableHead
                className="w-[120px] cursor-pointer"
                data-sortable="true"
                data-sort-active={sortConfig.field === 'orgName'}
                onClick={() => toggleSort('orgName')}
              >
                기관명
              </TableHead>
              <TableHead
                className="w-[80px] cursor-pointer"
                data-sortable="true"
                data-sort-active={sortConfig.field === 'region'}
                onClick={() => toggleSort('region')}
              >
                지역
              </TableHead>
              {localStatus === 'ended' && (
                <TableHead
                  className="w-[80px] cursor-pointer"
                  data-sortable="true"
                  data-sort-active={sortConfig.field === 'status'}
                  onClick={() => toggleSort('status')}
                >
                  상태
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBids.length === 0 ? (
              <TableRow>
                <TableCell colSpan={localStatus === 'ended' ? 6 : 5} className="h-[300px]" />
              </TableRow>
            ) : (
              paginatedBids.map((bid) => (
                <TableRow
                  key={bid.mid}
                  onClick={() => {
                    window.location.href = `/mybids/${localStatus}/${bid.nid}`;
                  }}
                >
                  <TableCell className="w-auto max-w-0">
                  <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <a
                            href={bid.detailUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-color-primary-foreground hover:text-blue-600 truncate cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {bid.title || '[제목 없음]'}
                          </a>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="w-[100px] whitespace-nowrap">
                    {bid.postedAt ? bid.postedAt.split('T')[0] : bid.postedAt}
                  </TableCell>
                  <TableCell className="w-[80px] whitespace-nowrap">
                    {bid.category}
                  </TableCell>
                  <TableCell className="w-[120px] whitespace-nowrap">
                    {orgUrls[bid.orgName] ? (
                      <a
                        href={orgUrls[bid.orgName]!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-color-primary-foreground hover:text-blue-600 hover:underline cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                        title="기관 게시판 페이지로 이동"
                      >
                        {bid.orgName}
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-color-primary-foreground">
                        {bid.orgName}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="w-[80px] whitespace-nowrap">
                    {bid.region}
                  </TableCell>
                  {localStatus === 'ended' && (
                    <TableCell className="w-[80px] whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        bid.status === '낙찰' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        bid.status === '패찰' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        bid.status === '포기' ? 'text-color-primary-muted-foreground' :
                        'text-color-primary-muted-foreground'
                      }`}>
                        {bid.status}
                      </span>
                    </TableCell>
                  )}
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
            <div className="text-sm text-color-primary-muted-foreground">
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