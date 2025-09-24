'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Loader2, Edit3, Minus, Plus } from 'lucide-react';
import { type Notice } from '@/types/notice';
import { Checkbox } from '@/components/ui/checkbox';
import { UnifiedSelect } from '@/components/shared/UnifiedSelect';
import { useNoticeFilterStore } from '@/store/noticeFilterStore';
import { filterNotices } from '@/lib/utils/filterNotices';
import { AdvancedSearchModal } from '../notices/AdvancedSearchModal';
import { InputWithIcon, IconButton, OutlineSelectBox, OutlineSelectItem, ButtonWithColorIcon, RadioButtonSet, CheckButtonSet } from '@/components/shared/FormComponents';
import { NumberInput } from '@/components/shared/NumberInput';
import { PageHeader } from '@/components/shared/PageHeader';
import { useSettingsStore } from '@/store/settingsStore';
import { NoticeDetailModal } from '../notices/NoticeDetailModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// GraphQL mutation 정의
const NOTICE_TO_PROGRESS = gql`
  mutation NoticeToProgress($nids: [Int!]!) {
    noticeToProgress(nids: $nids) {
      success
      message
    }
  }
`;

const UPDATE_NOTICE_CATEGORY = gql`
  mutation UpdateNoticeCategory($nids: [Int!]!, $category: String!) {
    updateNoticeCategory(nids: $nids, category: $category) {
      success
      message
    }
  }
`;

const EXCLUDE_NOTICES = gql`
  mutation ExcludeNotices($nids: [Int!]!) {
    excludeNotices(nids: $nids) {
      success
      message
    }
  }
`;

const RESTORE_NOTICES = gql`
  mutation RestoreNotices($nids: [Int!]!) {
    restoreNotices(nids: $nids) {
      success
      message
    }
  }
`;

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


type SortField = '제목' | '기관명' | '작성일' | '지역' | '등록' | 'category' | 'region' | 'registration';
type SortOrder = 'asc' | 'desc';

interface NoticeTableProps {
  notices: Notice[];
  currentCategory?: string;
  currentCategories?: string[];
  gap?: number;
  sort?: string;
  order?: string;
  isWorkPage?: boolean;
  isIrrelevantPage?: boolean;
  isExcludedPage?: boolean;
}

// 기본 카테고리 (GraphQL 데이터가 로딩되지 않은 경우 사용)
const DEFAULT_CATEGORIES = [
  { value: '공사점검', label: '공사점검' },
  { value: '성능평가', label: '성능평가' },
  { value: '기타', label: '기타' },
  { value: '무관', label: '무관' },
  { value: '제외', label: '제외' },
];

const BID_STAGES = [
  { value: '무관', label: '무관' },
  { value: '관심', label: '관심' },
  { value: '입찰 준비', label: '입찰 준비' },
  { value: '응찰', label: '응찰' },
];

// DAY_GAP 환경변수 가져오기
const DEFAULT_GAP = process.env.NEXT_PUBLIC_DAY_GAP || '1';

export default function NoticeTable({ notices, currentCategory, currentCategories, gap: initialGap, sort: initialSort, order: initialOrder, isWorkPage = false, isIrrelevantPage = false, isExcludedPage = false }: NoticeTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { navigate } = useUnifiedNavigation();
  const searchParams = useSearchParams();
  const [noticeToProgress] = useMutation(NOTICE_TO_PROGRESS);
  const [updateNoticeCategory] = useMutation(UPDATE_NOTICE_CATEGORY);
  const [excludeNotices] = useMutation(EXCLUDE_NOTICES);
  const [restoreNotices] = useMutation(RESTORE_NOTICES);
  
  // GraphQL 쿼리로 카테고리 데이터 가져오기
  const { data: categoriesData, loading: categoriesLoading } = useQuery(GET_NOTICE_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedNids, setSelectedNids] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [gap, setGap] = useState<number>(initialGap || parseInt(searchParams.get('gap') || DEFAULT_GAP, 10));
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
    field: (initialSort as SortField) || '작성일',
    order: (initialOrder as SortOrder) || 'desc',
  });
  const { filter } = useNoticeFilterStore();
  const { perPage } = useSettingsStore();
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isFavoriteModalOpen, setIsFavoriteModalOpen] = useState(false);
  const [isCategoryEditModalOpen, setIsCategoryEditModalOpen] = useState(false);
  const [isBidProcessModalOpen, setIsBidProcessModalOpen] = useState(false);
  const [localCategory, setLocalCategory] = useState(currentCategory || '공사점검');
  const [localCategories, setLocalCategories] = useState(currentCategories || ['공사점검']);
  const [selectedBidStage, setSelectedBidStage] = useState<string>(currentCategory === '무관' ? '무관' : '관심');
  const [isComposing, setIsComposing] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [isExcludeModalOpen, setIsExcludeModalOpen] = useState(false);
  const [excludeLoading, setExcludeLoading] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  // 동적 카테고리 옵션 생성
  const categoryOptions = React.useMemo(() => {
    if (categoriesData?.noticeCategoriesActive) {
      const dynamicCategories = categoriesData.noticeCategoriesActive.map((cat: any) => ({
        value: cat.category,
        label: cat.category
      }));
      
      // 무관, 제외 카테고리는 항상 포함
      const staticCategories = [
        { value: '무관', label: '무관' },
        { value: '제외', label: '제외' }
      ];
      
      return [...dynamicCategories, ...staticCategories];
    }
    return DEFAULT_CATEGORIES;
  }, [categoriesData]);

  // 업무 페이지용 카테고리 옵션 (무관, 제외 제외)
  const workPageCategoryOptions = React.useMemo(() => {
    if (categoriesData?.noticeCategoriesActive) {
      return categoriesData.noticeCategoriesActive.map((cat: any) => ({
        value: cat.category,
        label: cat.category
      }));
    }
    return DEFAULT_CATEGORIES.filter(cat => !['무관', '제외'].includes(cat.value));
  }, [categoriesData]);

  // 기관명 URL 조회 및 생성 함수
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

      // GraphQL 쿼리로 기관 URL 가져오기
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

  // 공고 목록이 변경될 때 기관명 URL들을 미리 로드
  useEffect(() => {
    const loadOrgUrls = async () => {
      const uniqueOrgNames = Array.from(new Set(notices.map(notice => notice.기관명).filter(Boolean))) as string[];
      const orgsToLoad = uniqueOrgNames.filter(orgName => orgUrls[orgName] === undefined);

      if (orgsToLoad.length === 0) return;

      // 병렬로 모든 기관 URL 로드
      const urlPromises = orgsToLoad.map(async (orgName) => {
        try {
          const url = await getOrganizationUrl(orgName);
          return { orgName, url };
        } catch (error) {
          console.error(`Error loading URL for ${orgName}:`, error);
          return { orgName, url: null };
        }
      });

      const results = await Promise.all(urlPromises);
      const urlCache = results.reduce((acc, { orgName, url }) => {
        acc[orgName] = url;
        return acc;
      }, {} as { [orgName: string]: string | null });

      if (Object.keys(urlCache).length > 0) {
        setOrgUrls(prev => ({ ...prev, ...urlCache }));
      }
    };

    if (notices.length > 0) {
      loadOrgUrls().catch(console.error);
    }
  }, [notices]); // orgUrls는 의존성에서 제외하여 무한루프 방지

  // currentCategory 변경시 localCategory 동기화
  useEffect(() => {
    setLocalCategory(currentCategory || '공사점검');
    setSelectedBidStage(currentCategory === '무관' ? '무관' : '관심');
  }, [currentCategory]);

  // 페이지 로딩 공통 함수
  const loadPage = async (url: string) => {
    try {
      // 로딩 상태 설정
      setIsLoading(true);

      // URL 히스토리 업데이트
      window.history.pushState({}, '', url);

      // 페이지 새로고침
      router.refresh();

      // 실제 데이터 로딩을 시뮬레이션하기 위한 지연
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('페이지 로딩 중 오류 발생:', error);
      throw error;
    } finally {
      // 모든 처리가 완료된 후 로딩 상태 해제
      setIsLoading(false);
    }
  };

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

  // gap 입력란 변경 핸들러
  const handleGapChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGap = parseInt(e.target.value, 10);
    if (!isNaN(newGap)) {
      try {
        // 1. UI 상태 즉시 업데이트
        setGap(newGap);

        // 2. URL 업데이트 준비
        const currentPath = window.location.pathname;
        const newSearchParams = new URLSearchParams(window.location.search);
        newSearchParams.set('gap', newGap.toString());
        const newUrl = `${currentPath}?${newSearchParams.toString()}`;

        // 3. URL 히스토리 업데이트 (페이지 새로고침 없이)
        navigate(newUrl);
      } catch (error) {
        console.error('간격 변경 중 오류 발생:', error);
        setIsLoading(false);
        // 에러 발생 시 원래 상태로 복구
        setGap(parseInt(searchParams.get('gap') || DEFAULT_GAP, 10));
      }
    }
  };

  // 카테고리 변경 핸들러
  const handleCategoryChange = async (value: string) => {
    try {
      // 1. UI 상태 즉시 업데이트
      setLocalCategory(value);

      // 2. URL 업데이트 준비 - 새로운 영어 슬러그 사용
      const newSearchParams = new URLSearchParams(window.location.search);
      let newUrl: string;

      const isNaraPage = pathname.includes('/notices/nara');
      const baseUrl = isNaraPage ? '/notices/nara' : '/notices/gov';
      
      if (value === '무관') {
        newUrl = `${baseUrl}/irrelevant?${newSearchParams.toString()}`;
      } else if (value === '제외') {
        newUrl = `${baseUrl}/excluded?${newSearchParams.toString()}`;
      } else {
        // 공사점검, 성능평가, 기타 -> work 페이지로 이동
        newSearchParams.delete('category');
        const otherParams = newSearchParams.toString();
        const categoryParam = `category=${value}`;
        const queryString = otherParams ? `${categoryParam}&${otherParams}` : categoryParam;
        newUrl = `${baseUrl}/work?${queryString}`;
      }

      // 3. URL 히스토리 업데이트 (페이지 새로고침 없이)
      navigate(newUrl);
    } catch (error) {
      console.error('카테고리 변경 중 오류 발생:', error);
      setIsLoading(false);
      // 에러 발생 시 원래 상태로 복구
      setLocalCategory(currentCategory || '공사점검');
    }
  };

  // 다중 카테고리 변경 핸들러 (업무 페이지용)
  const handleCategoriesChange = async (values: string[]) => {
    try {
      // 1. UI 상태 즉시 업데이트
      setLocalCategories(values);

      // 2. URL 업데이트 준비 - 쉼표를 인코딩하지 않도록 수동으로 구성
      const currentParams = new URLSearchParams(window.location.search);

      // category 파라미터 제거
      currentParams.delete('category');

      // 카테고리를 쉼표로 구분하여 설정 (URL 인코딩 방지)
      const categoryValue = values.length > 0 ? values.join(',') : '공사점검';

      // 기존 파라미터들과 새 category 파라미터를 결합
      const otherParams = currentParams.toString();
      const categoryParam = `category=${categoryValue}`;

      const queryString = otherParams
        ? `${categoryParam}&${otherParams}`
        : categoryParam;

      // 3. URL 히스토리 업데이트 (페이지 새로고침 없이)
      const isNaraPage = pathname.includes('/notices/nara');
      const baseUrl = isNaraPage ? '/notices/nara' : '/notices/gov';
      const newUrl = `${baseUrl}/work?${queryString}`;
      navigate(newUrl);
    } catch (error) {
      console.error('카테고리 변경 중 오류 발생:', error);
      setIsLoading(false);
      // 에러 발생 시 원래 상태로 복구
      setLocalCategories(currentCategories || ['공사점검']);
    }
  };

  // gap 값이 변경될 때 URL 업데이트 효과
  useEffect(() => {
    if (!searchParams.has('gap')) {
      const currentPath = window.location.pathname;
      const newSearchParams = new URLSearchParams(window.location.search);
      newSearchParams.set('gap', DEFAULT_GAP);
      const url = `${currentPath}?${newSearchParams.toString()}`;
      loadPage(url).catch(console.error);
    }
  }, [searchParams]);

  // URL 파라미터 변경을 감지하여 정렬 상태 동기화 (뒤로가기/앞으로가기 지원)
  useEffect(() => {
    const sortParam = searchParams.get('sort') as SortField;
    const orderParam = searchParams.get('order') as SortOrder;

    if (sortParam && orderParam) {
      // URL 파라미터가 현재 정렬 상태와 다른 경우에만 업데이트
      if (sortConfig.field !== sortParam || sortConfig.order !== orderParam) {
        setSortConfig({
          field: sortParam,
          order: orderParam,
        });
      }
    }
  }, [searchParams]);

  // 카테고리별 색상 테마 대신 일관된 배경색 사용
  // data-primary-color 설정을 제거하여 전체 페이지 배경에 영향을 주지 않음
  useEffect(() => {
    const root = document.documentElement;

    // 기존 카테고리별 색상 테마 제거
    root.removeAttribute('data-primary-color');

    console.log('기본 테마 사용, 카테고리:', currentCategory);
  }, [currentCategory]);

  // 정렬 함수
  const sortData = (a: Notice, b: Notice, field: SortField) => {
    const aValue = String(a[field] || ''); // 문자열로 변환
    const bValue = String(b[field] || ''); // 문자열로 변환

    if (field === '작성일') {
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
  const filteredAndSortedNotices = notices
    .filter((notice) => {
      if (!debouncedSearchTerm) return true;
      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        notice.제목.toLowerCase().includes(searchLower) ||
        notice.기관명.toLowerCase().includes(searchLower) ||
        (notice.지역 && notice.지역.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => sortData(a, b, sortConfig.field));

  console.log('Search Debug:', {
    searchTerm,
    totalNotices: notices.length,
    filteredNotices: filteredAndSortedNotices.length,
    notices: notices.map(n => ({ title: n.제목, org: n.기관명 }))
  });

  const filteredNotices = filterNotices(filteredAndSortedNotices, filter);

  console.log('Filter Debug:', {
    filter,
    afterFilterCount: filteredNotices.length
  });

  // 페이지네이션 로직
  const totalPages = perPage === 0 ? 1 : Math.ceil(filteredNotices.length / perPage);
  const paginatedNotices =
    perPage === 0 ? filteredNotices : filteredNotices.slice((currentPage - 1) * perPage, currentPage * perPage);

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
  const toggleSort = (field: SortField) => {
    const newOrder = sortConfig.field === field && sortConfig.order === 'asc' ? 'desc' : 'asc';
    setSortConfig({
      field,
      order: newOrder,
    });

    // URL 파라미터 업데이트
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('sort', field);
    currentParams.set('order', newOrder);

    const newUrl = `${pathname}?${currentParams.toString()}`;

    // 즉시 URL 업데이트 (브라우저 주소창에 반영)
    window.history.pushState({}, '', newUrl);
  };

  // 체크박스 토글
  const toggleCheckbox = (nid: number) => {
    setSelectedNids((prev) => (prev.includes(nid) ? prev.filter((id) => id !== nid) : [...prev, nid]));
  };

  // 입찰 진행 모달 열기
  const handleBidProcess = () => {
    if (selectedNids.length === 0) {
      alert('선택된 공고가 없습니다.');
      return;
    }
    setIsBidProcessModalOpen(true);
  };

  // 입찰 진행 확인 처리
  const handleConfirmBidProcess = async () => {
    if (selectedNids.length === 0) return;

    setProgressLoading(true);

    try {
      const { data } = await noticeToProgress({
        variables: {
          nids: selectedNids
        }
      });

      if (data?.noticeToProgress?.success) {
        // 처리 후 선택 초기화
        setSelectedNids([]);
        setIsBidProcessModalOpen(false);
        // /mybids/progress 페이지로 이동
        navigate('/mybids/progress');
      } else {
        throw new Error(data?.noticeToProgress?.message || '입찰 진행 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('입찰 진행 처리 중 오류 발생:', error);
      alert('입찰 진행 처리 중 오류가 발생했습니다.');
    } finally {
      setProgressLoading(false);
    }
  };

  // 유형 변경 모달 열기
  const handleCategoryEdit = () => {
    if (selectedNids.length === 0) {
      alert('선택된 공고가 없습니다.');
      return;
    }
    setLocalCategory(currentCategory || '공사점검');
    setIsCategoryEditModalOpen(true);
  };

  // 즐겨찾기 저장 (기존 기능 유지)
  const handleSaveFavorites = async () => {
    try {
      // TODO: API 호출하여 즐겨찾기 저장
      console.log('저장할 데이터:', {
        nids: selectedNids,
        category: localCategory,
        bidStage: selectedBidStage,
      });

      // 저장 후 모달 닫기
      setIsFavoriteModalOpen(false);
      setSelectedNids([]); // 선택 초기화
    } catch (error) {
      console.error('즐겨찾기 저장 중 오류 발생:', error);
      alert('즐겨찾기 저장 중 오류가 발생했습니다.');
    }
  };

  // 유형 변경 저장
  const handleSaveCategoryChange = async () => {
    if (selectedNids.length === 0) return;

    setCategoryLoading(true);

    try {
      const { data } = await updateNoticeCategory({
        variables: {
          nids: selectedNids,
          category: localCategory
        }
      });

      if (data?.updateNoticeCategory?.success) {
        // 성공 후 모달 닫기 및 선택 초기화
        setIsCategoryEditModalOpen(false);
        setSelectedNids([]);

        // 변경된 카테고리 페이지로 이동
        const currentSearchParams = new URLSearchParams(window.location.search);
        let newUrl: string;

        const isNaraPage = pathname.includes('/notices/nara');
        const baseUrl = isNaraPage ? '/notices/nara' : '/notices/gov';
        
        if (localCategory === '무관') {
          newUrl = `${baseUrl}/irrelevant?${currentSearchParams.toString()}`;
        } else if (localCategory === '제외') {
          newUrl = `${baseUrl}/excluded?${currentSearchParams.toString()}`;
        } else {
          // 공사점검, 성능평가, 기타 -> work 페이지로 이동
          currentSearchParams.delete('category');
          const otherParams = currentSearchParams.toString();
          const categoryParam = `category=${localCategory}`;
          const queryString = otherParams ? `${categoryParam}&${otherParams}` : categoryParam;
          newUrl = `${baseUrl}/work?${queryString}`;
        }
        navigate(newUrl);
      } else {
        throw new Error(data?.updateNoticeCategory?.message || '유형 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('유형 변경 중 오류 발생:', error);
      alert('유형 변경 중 오류가 발생했습니다.');
    } finally {
      setCategoryLoading(false);
    }
  };

  // 제외 모달 열기
  const handleExclude = () => {
    if (selectedNids.length === 0) {
      alert('선택된 공고가 없습니다.');
      return;
    }
    setIsExcludeModalOpen(true);
  };

  // 제외 확인 처리
  const handleConfirmExclude = async () => {
    if (selectedNids.length === 0) return;

    setExcludeLoading(true);

    try {
      const { data } = await excludeNotices({
        variables: {
          nids: selectedNids
        }
      });

      if (data?.excludeNotices?.success) {
        // 성공 후 모달 닫기 및 선택 초기화
        setIsExcludeModalOpen(false);
        setSelectedNids([]);

        // 제외 페이지로 이동
        const currentSearchParams = new URLSearchParams(window.location.search);
        const isNaraPage = pathname.includes('/notices/nara');
        const baseUrl = isNaraPage ? '/notices/nara' : '/notices/gov';
        const newUrl = `${baseUrl}/excluded?${currentSearchParams.toString()}`;
        navigate(newUrl);
      } else {
        throw new Error(data?.excludeNotices?.message || '제외 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('제외 처리 중 오류 발생:', error);
      alert('제외 처리 중 오류가 발생했습니다.');
    } finally {
      setExcludeLoading(false);
    }
  };

  // 복원 모달 열기
  const handleRestore = () => {
    if (selectedNids.length === 0) {
      alert('선택된 공고가 없습니다.');
      return;
    }
    setIsRestoreModalOpen(true);
  };

  // 복원 확인 처리
  const handleConfirmRestore = async () => {
    if (selectedNids.length === 0) return;

    setRestoreLoading(true);

    try {
      const { data } = await restoreNotices({
        variables: {
          nids: selectedNids
        }
      });

      if (data?.restoreNotices?.success) {
        // 성공 후 모달 닫기 및 선택 초기화
        setIsRestoreModalOpen(false);
        setSelectedNids([]);

        // 페이지 새로고침하여 변경된 데이터 반영
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(data?.restoreNotices?.message || '복원 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('복원 처리 중 오류 발생:', error);
      alert('복원 처리 중 오류가 발생했습니다.');
    } finally {
      setRestoreLoading(false);
    }
  };

  // 행 클릭 핸들러
  const handleRowClick = (notice: Notice, event: React.MouseEvent) => {
    // 체크박스와 제목 링크를 클릭한 경우는 제외
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' || // 체크박스
      target.tagName === 'A' || // 링크
      target.closest('button') || // 버튼
      target.closest('a') // 링크의 자식 요소
    ) {
      return;
    }
    setSelectedNotice(notice);
  };

  // 카테고리별 페이지 타이틀과 브레드크럼 생성
  const getPageInfo = () => {
    let pageTitle: string;
    let finalBreadcrumb: string;
    let href: string;

    if (isWorkPage) {
      const isNaraPage = pathname.includes('/notices/nara');
      pageTitle = isNaraPage ? '나라장터(업무)' : '관공서 공고(업무)';
      finalBreadcrumb = '업무';
      href = isNaraPage ? '/notices/nara/work?category=공사점검' : '/notices/gov/work?category=공사점검';
    } else if (isIrrelevantPage) {
      const isNaraPage = pathname.includes('/notices/nara');
      pageTitle = isNaraPage ? '나라장터(무관)' : '관공서 공고(무관)';
      finalBreadcrumb = '무관';
      href = isNaraPage ? '/notices/nara/irrelevant' : '/notices/gov/irrelevant';
    } else if (isExcludedPage) {
      const isNaraPage = pathname.includes('/notices/nara');
      pageTitle = isNaraPage ? '나라장터(제외)' : '관공서 공고(제외)';
      finalBreadcrumb = '제외';
      href = isNaraPage ? '/notices/nara/excluded' : '/notices/gov/excluded';
    } else {
      // Fallback for legacy routes
      const isNaraPage = pathname.includes('/notices/nara');
      const categoryLabel = CATEGORIES.find(cat => cat.value === currentCategory)?.label || currentCategory || '공사점검';
      pageTitle = isNaraPage ? `나라장터(${categoryLabel})` : `관공서 공고(${categoryLabel})`;
      finalBreadcrumb = categoryLabel;
      if (isNaraPage) {
        href = currentCategory === '무관' ? '/notices/nara/irrelevant' :
              currentCategory === '제외' ? '/notices/nara/excluded' :
              `/notices/nara/work?category=${encodeURIComponent(currentCategory || '공사점검')}`;
      } else {
        href = currentCategory === '무관' ? '/notices/gov/irrelevant' :
              currentCategory === '제외' ? '/notices/gov/excluded' :
              `/notices/gov/work?category=${encodeURIComponent(currentCategory || '공사점검')}`;
      }
    }

    const isNaraPage = pathname.includes('/notices/nara');
    const baseHref = isNaraPage ? '/notices/nara/work?category=공사점검' : '/notices/gov/work?category=공사점검';
    const baseLabel = isNaraPage ? '나라장터' : '관공서';
    
    return {
      title: pageTitle,
      breadcrumbs: [
        { label: '공고', href: baseHref },
        { label: baseLabel, href: baseHref },
        { label: finalBreadcrumb, href }
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

      <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <label htmlFor="gap-input" className="text-sm font-medium text-color-primary-foreground">최근</label>
                <NumberInput
                  id="gap-input"
                  min="0"
                  value={gap}
                  onChange={handleGapChange}
                  className="w-16"
                />
              </div>
            </div>
            <div className="relative flex items-center gap-2 flex-1" style={{ minWidth: '10px' }}>
              <div className="relative flex-1" style={{ minWidth: '10px' }}>
                <InputWithIcon
                  ref={searchInputRef}
                  placeholder="입찰공고 검색..."
                  value={searchTerm}
                  onChange={handleSearchInput}
                  className="w-full"
                  autoComplete="off"
                  type="text"
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => {
                    setIsComposing(false);
                    // 한글 입력 완료 후 자동 포커스는 제거 - 사용자가 직접 제어하도록 함
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Process' || isComposing) {
                      return;
                    }
                  }}
                  onBlur={(e) => {
                    // 포커스 해제 허용 - 검색 입력 필드에서 다른 곳으로 이동할 때 정상적으로 포커스 해제
                    // 기존 로직이 포커스를 강제로 유지하고 있었음
                  }}
                />
              </div>
              <AdvancedSearchModal />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isWorkPage ? (
              <CheckButtonSet
                options={workPageCategoryOptions}
                values={localCategories}
                onChange={handleCategoriesChange}
              />
            ) : (!isIrrelevantPage && !isExcludedPage) ? (
              <RadioButtonSet
                options={workPageCategoryOptions}
                value={localCategory}
                onChange={handleCategoryChange}
              />
            ) : null}
            <div className="flex items-center gap-2">
            {currentCategory === '제외' ? (
              <IconButton
                icon={<Plus className="h-4 w-4" />}
                onClick={handleRestore}
                title="업무에 복원"
              />
            ) : currentCategory !== '무관' && !(pathname.includes('/notices/nara') && isIrrelevantPage) && (
              <IconButton
                icon={<Minus className="h-4 w-4" />}
                onClick={handleExclude}
                title="업무에서 제외"
              />
            )}
            <IconButton
              icon={<Edit3 className="h-4 w-4" />}
              onClick={handleCategoryEdit}
              title="유형 변경"
            />
            {currentCategory !== '무관' && currentCategory !== '제외' && !(pathname.includes('/notices/nara') && isIrrelevantPage) && (
              <IconButton
                icon={<Star className="h-4 w-4" />}
                onClick={handleBidProcess}
                title="입찰 진행"
              />
            )}
            </div>
          </div>
        </div>

        {/* 테이블 */}
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedNids.length === notices.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedNids(notices.map(notice => notice.nid));
                      } else {
                        setSelectedNids([]);
                      }
                    }}
                    aria-label="모든 항목 선택"
                  />
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
                  className="w-auto cursor-pointer"
                  data-sortable="true"
                  data-sort-active={sortConfig.field === '제목'}
                  onClick={() => toggleSort('제목')}
                >
                  제목
                </TableHead>
                <TableHead
                  className="w-[100px] cursor-pointer"
                  data-sortable="true"
                  data-sort-active={sortConfig.field === '작성일'}
                  onClick={() => toggleSort('작성일')}
                >
                  작성일
                </TableHead>
                <TableHead
                  className="w-[120px] cursor-pointer"
                  data-sortable="true"
                  data-sort-active={sortConfig.field === '기관명'}
                  onClick={() => toggleSort('기관명')}
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
                {!(pathname.includes('/notices/nara') && (isIrrelevantPage || isWorkPage || isExcludedPage)) && (
                  <TableHead
                    className="w-[60px] cursor-pointer"
                    data-sortable="true"
                    data-sort-active={sortConfig.field === 'registration'}
                    onClick={() => toggleSort('registration')}
                  >
                    등록
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedNotices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={pathname.includes('/notices/nara') && (isIrrelevantPage || isWorkPage || isExcludedPage) ? 6 : 7} className="h-[300px]" />
                </TableRow>
              ) : (
                paginatedNotices.map((notice) => (
                  <TableRow
                    key={notice.nid}
                    onClick={(e) => handleRowClick(notice, e)}
                  >
                    <TableCell className="w-[40px]">
                      <Checkbox
                        checked={selectedNids.includes(notice.nid)}
                        onCheckedChange={() => toggleCheckbox(notice.nid)}
                        aria-label={`${notice.제목} 선택`}
                      />
                    </TableCell>
                    <TableCell className="w-[80px] whitespace-nowrap">
                      {notice.category}
                    </TableCell>
                    <TableCell className="w-auto max-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <a
                              href={`${notice.상세페이지주소}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-color-primary-foreground hover:text-blue-600 truncate cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              {notice.제목}
                            </a>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[100px] whitespace-nowrap">
                      {notice.작성일}
                    </TableCell>
                    <TableCell className="w-[120px] whitespace-nowrap">
                      {(() => {
                        const orgUrl = orgUrls[notice.기관명];

                        if (orgUrl) {
                          return (
                            <a
                              href={orgUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-color-primary-foreground hover:text-blue-600 hover:underline cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                              title="기관 게시판 페이지로 이동"
                            >
                              {notice.기관명}
                            </a>
                          );
                        } else {
                          return (
                            <span
                              className="text-sm font-medium text-color-primary-foreground"
                              title={`URL not found for ${notice.기관명}`}
                            >
                              {notice.기관명}
                            </span>
                          );
                        }
                      })()}
                    </TableCell>
                    <TableCell className="w-[80px] whitespace-nowrap">
                      {notice.지역}
                    </TableCell>
                    {!(pathname.includes('/notices/nara') && (isIrrelevantPage || isWorkPage || isExcludedPage)) && (
                      <TableCell className="w-[60px] whitespace-nowrap">
                        {notice.등록}
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
      </div>

      {/* 상세 정보 모달 */}
      {selectedNotice && (
        <NoticeDetailModal
          notice={selectedNotice}
          open={!!selectedNotice}
          onOpenChange={(open) => !open && setSelectedNotice(null)}
        />
      )}

      {/* 즐겨찾기 모달 (기존 기능 유지) */}
      <Dialog open={isFavoriteModalOpen} onOpenChange={setIsFavoriteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>유형 및 단계 조정</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>공고 유형</Label>
              <div className="flex flex-wrap gap-4">
                {categoryOptions.map((category) => (
                  <div key={category.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.value}`}
                      checked={localCategory === category.value}
                      onCheckedChange={() => setLocalCategory(category.value)}
                    />
                    <Label htmlFor={`category-${category.value}`}>{category.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>입찰 단계</Label>
              <div className="flex flex-wrap gap-4">
                {BID_STAGES.map((stage) => (
                  <div key={stage.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`stage-${stage.value}`}
                      checked={selectedBidStage === stage.value}
                      onCheckedChange={() => setSelectedBidStage(stage.value)}
                    />
                    <Label htmlFor={`stage-${stage.value}`}>{stage.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <ButtonWithColorIcon
              color="tertiary"
              mode="base"
              onClick={() => setIsFavoriteModalOpen(false)}
            >
              취소
            </ButtonWithColorIcon>
            <ButtonWithColorIcon
              color="secondary"
              mode="active"
              onClick={handleSaveFavorites}
            >
              저장
            </ButtonWithColorIcon>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 유형 변경 모달 */}
      <Dialog open={isCategoryEditModalOpen} onOpenChange={setIsCategoryEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>유형 변경</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>공고 유형</Label>
              <div className="flex flex-wrap gap-4">
                {categoryOptions.map((category) => (
                  <div key={category.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-category-${category.value}`}
                      checked={localCategory === category.value}
                      onCheckedChange={() => setLocalCategory(category.value)}
                    />
                    <Label htmlFor={`edit-category-${category.value}`}>{category.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <ButtonWithColorIcon
              color="tertiary"
              mode="base"
              onClick={() => setIsCategoryEditModalOpen(false)}
              disabled={categoryLoading}
            >
              취소
            </ButtonWithColorIcon>
            <ButtonWithColorIcon
              color="secondary"
              mode="active"
              onClick={handleSaveCategoryChange}
              disabled={categoryLoading}
            >
              {categoryLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  처리 중...
                </>
              ) : (
                '저장'
              )}
            </ButtonWithColorIcon>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 입찰 진행 확인 모달 */}
      <Dialog open={isBidProcessModalOpen} onOpenChange={setIsBidProcessModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>입찰 진행</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-color-primary-muted-foreground">
              선택된 {selectedNids.length}개 공고의 입찰 단계를 '진행'으로 변경하시겠습니까?
            </p>
          </div>
          <DialogFooter>
            <ButtonWithColorIcon
              color="tertiary"
              mode="base"
              onClick={() => setIsBidProcessModalOpen(false)}
              disabled={progressLoading}
            >
              취소
            </ButtonWithColorIcon>
            <ButtonWithColorIcon
              color="secondary"
              mode="active"
              onClick={handleConfirmBidProcess}
              disabled={progressLoading}
            >
              {progressLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  처리 중...
                </>
              ) : (
                '예'
              )}
            </ButtonWithColorIcon>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 제외 확인 모달 */}
      <Dialog open={isExcludeModalOpen} onOpenChange={setIsExcludeModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>업무에서 제외</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-color-primary-muted-foreground">
              선택된 {selectedNids.length}개 공고를 업무에서 제외할까요?
            </p>
            <p className="text-xs text-color-primary-muted-foreground mt-2">
              제외된 공고는 더 이상 목록에 표시되지 않습니다.
            </p>
          </div>
          <DialogFooter>
            <ButtonWithColorIcon
              color="tertiary"
              mode="base"
              onClick={() => setIsExcludeModalOpen(false)}
              disabled={excludeLoading}
            >
              취소
            </ButtonWithColorIcon>
            <ButtonWithColorIcon
              color="red"
              mode="active"
              onClick={handleConfirmExclude}
              disabled={excludeLoading}
            >
              {excludeLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  처리 중...
                </>
              ) : (
                '확인'
              )}
            </ButtonWithColorIcon>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 복원 확인 모달 */}
      <Dialog open={isRestoreModalOpen} onOpenChange={setIsRestoreModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>업무에 복원</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-color-primary-muted-foreground">
              선택된 {selectedNids.length}개 공고를 업무에 복원할까요?
            </p>
            <p className="text-xs text-color-primary-muted-foreground mt-2">
              복원된 공고는 다시 해당 카테고리 목록에 표시됩니다.
            </p>
          </div>
          <DialogFooter>
            <ButtonWithColorIcon
              color="tertiary"
              mode="base"
              onClick={() => setIsRestoreModalOpen(false)}
              disabled={restoreLoading}
            >
              취소
            </ButtonWithColorIcon>
            <ButtonWithColorIcon
              color="green"
              mode="active"
              onClick={handleConfirmRestore}
              disabled={restoreLoading}
            >
              {restoreLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  처리 중...
                </>
              ) : (
                '확인'
              )}
            </ButtonWithColorIcon>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
