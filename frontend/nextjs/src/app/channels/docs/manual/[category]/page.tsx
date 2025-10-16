'use client';

import { useState, useEffect, useRef } from 'react';
import { use } from 'react';
import { usePathname } from 'next/navigation';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Textarea
} from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Code,
  Eye,
  Hash,
  FileText
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { PageContainer } from '@/components/shared/PageContainer';
import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableCell } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { RadioButtonSet, InputWithIcon, ButtonWithIcon } from '@/components/shared/FormComponents';

import dynamic from 'next/dynamic';

// MDEditor 동적 임포트 (SSR 방지)
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

// ReactMarkdown 동적 임포트
const ReactMarkdown = dynamic(
  () => import('react-markdown'),
  { ssr: false }
);

// GraphQL 쿼리
const GET_MANUALS = `
  query GetManuals($category: String, $limit: Int, $offset: Int) {
    docsManualAll(category: $category, limit: $limit, offset: $offset) {
      manuals {
        id
        title
        content
        markdown_source
        format
        category
        file_path
        writer
        email
        created_at
        updated_at
        is_visible
        is_notice
        is_private
      }
      total_count
      page
      limit
    }
  }
`;

const GET_MANUAL = `
  query GetManual($id: Int!) {
    docsManualOne(id: $id) {
      id
      title
      content
      markdown_source
      format
      category
      file_path
      writer
      email
      created_at
      updated_at
      is_visible
      is_notice
      is_private
    }
  }
`;

const CREATE_MANUAL = `
  mutation CreateManual($input: DocsManualInput!) {
    docsManualCreate(input: $input) {
      id
      title
      content
      format
      category
      writer
      created_at
      updated_at
      is_visible
      is_notice
      is_private
    }
  }
`;

const UPDATE_MANUAL = `
  mutation UpdateManual($input: DocsManualInput!) {
    docsManualUpdate(input: $input) {
      id
      title
      content
      format
      category
      writer
      created_at
      updated_at
      is_visible
      is_notice
      is_private
    }
  }
`;

const DELETE_MANUAL = `
  mutation DeleteManual($input: DocsManualDeleteInput!) {
    docsManualDelete(input: $input) {
      id
      title
    }
  }
`;

const GET_CATEGORIES = `
  query GetCategories {
    docsCategories {
      categories
    }
  }
`;

const GET_LANG_MAPPINGS = `
  query GetLangMappings($area: String!) {
    mappingsLangByArea(area: $area) {
      id
      ko
      en
      isActive
    }
  }
`;

const SEARCH_MANUALS = `
  query SearchManuals($query: String!, $category: String, $limit: Int, $offset: Int) {
    docsManualSearch(query: $query, category: $category, limit: $limit, offset: $offset) {
      manuals {
        id
        title
        content
        markdown_source
        format
        category
        file_path
        writer
        email
        created_at
        updated_at
        is_visible
        is_notice
        is_private
      }
      total_count
      page
      limit
      query
    }
  }
`;

// 추가: 커스텀 스타일 클래스
const textareaClass = "text-color-primary-foreground focus:placeholder:text-transparent focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200";

export default function DocsManualPage({ params }: { params: Promise<any> }) {
  const { category } = use(params);
  const pathname = usePathname();
  const { navigate } = useUnifiedNavigation();
  const { startLoading, finishLoading, setCustomMessage } = useUnifiedLoading();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [manuals, setManuals] = useState<any[]>([]);
  const [selectedManual, setSelectedManual] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [langMappings, setLangMappings] = useState<any[]>([]);

  // 통합 로딩 관리
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newManual, setNewManual] = useState<any>({
    title: '',
    content: '',
    markdown_source: null,
    format: 'markdown',
    category: category || 'user_manual',
    writer: '',
    email: '',
    is_notice: false,
    is_private: false,
  });
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [editorMode, setEditorMode] = useState<'html' | 'markdown'>('markdown');
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // 카테고리 목록 조회
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const graphqlUrl = process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql';
        const response = await fetch(graphqlUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: GET_CATEGORIES,
          }),
        });

        const result = await response.json();
        if (result.data?.docsCategories?.categories) {
          setCategories(result.data.docsCategories.categories);
        }
      } catch (err) {
        console.error('카테고리 조회 오류:', err);
        setCategories(['사용자매뉴얼', '개발자매뉴얼', '운영매뉴얼', '운영가이드', '시스템가이드']);
      }
    };

    fetchCategories();
  }, []);

  // 언어 매핑 데이터 조회
  useEffect(() => {
    const fetchLangMappings = async () => {
      try {
        const graphqlUrl = process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql';
        const response = await fetch(graphqlUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: GET_LANG_MAPPINGS,
            variables: {
              area: 'docs'
            },
          }),
        });

        const result = await response.json();
        if (result.data?.mappingsLangByArea) {
          setLangMappings(result.data.mappingsLangByArea);
        }
      } catch (err) {
        console.error('언어 매핑 조회 오류:', err);
        // 매핑 데이터를 가져올 수 없는 경우 기본값 사용
        setLangMappings([
          { ko: '운영가이드', en: 'op_guide' },
          { ko: '시스템가이드', en: 'system_guide' }
        ]);
      }
    };

    fetchLangMappings();
  }, []);

  // 매뉴얼 목록 조회
  useEffect(() => {
    const fetchManuals = async () => {
      try {
        setCustomMessage('매뉴얼 목록을 불러오는 중입니다...');
        setError(null);

        const currentKoCategory = getCurrentCategoryKo();
        console.log('🔍 매뉴얼 조회 시작:', {
          urlCategory: category,
          koCategory: currentKoCategory,
          langMappings: langMappings.length
        });

        const graphqlUrl = process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql';

        const response = await fetch(graphqlUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchTerm ? SEARCH_MANUALS : GET_MANUALS,
            variables: searchTerm ? {
              query: searchTerm,
              category: currentKoCategory,
              limit: 100,
              offset: 0
            } : {
              category: currentKoCategory,
              limit: 100,
              offset: 0
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        console.log('📊 GraphQL 응답:', {
          data: result.data,
          errors: result.errors
        });

        if (result.errors) {
          console.error('GraphQL 에러:', result.errors);
          throw new Error(result.errors[0].message);
        }

        const dataKey = searchTerm ? 'docsManualSearch' : 'docsManualAll';
        if (!result.data || !result.data[dataKey]) {
          throw new Error('응답 구조가 올바르지 않습니다.');
        }

        setManuals(result.data[dataKey].manuals);
        finishLoading();
      } catch (err) {
        console.error('매뉴얼 목록 조회 오류:', err);
        const errorMessage = err instanceof Error ? err.message : '매뉴얼 목록을 불러오는데 실패했습니다.';
        setError(`매뉴얼 목록을 불러오는데 실패했습니다: ${errorMessage}`);
        finishLoading();
      }
    };

    // langMappings가 로드된 후에만 실행
    if (langMappings.length > 0) {
      fetchManuals();
    }
  }, [category, searchTerm, langMappings, finishLoading, setCustomMessage]);

  // 수정 모드 토글
  const handleEditToggle = () => {
    if (!selectedManual) return;
    setIsEditMode(true);
    setIsSourceMode(true);
  };

  // 삭제 클릭
  const handleDeleteClick = () => {
    if (!selectedManual) return;
    setIsDeleteDialogOpen(true);
  };

  // 삭제 확인
  const handleDeleteConfirm = async () => {
    if (!selectedManual) return;

    try {
      setCustomMessage('매뉴얼을 삭제하는 중입니다...');
      startLoading();
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: DELETE_MANUAL,
          variables: {
            input: {
              id: selectedManual.id
            },
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        console.error('삭제 오류:', result.errors);
        throw new Error(result.errors[0].message);
      }

      // 매뉴얼 목록 새로고침
      window.location.reload();

    } catch (err) {
      console.error('매뉴얼 삭제 오류:', err);
      setError('매뉴얼 삭제에 실패했습니다.');
      finishLoading();
    }
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!selectedManual) return;

    try {
      setCustomMessage('매뉴얼을 수정하는 중입니다...');
      startLoading();
      setError(null);

      const updateData = {
        id: parseInt(selectedManual.id.toString()),
        title: selectedManual.title.trim(),
        content: selectedManual.content,
        markdown_source: selectedManual.markdown_source || null,
        format: selectedManual.format || 'markdown',
        category: selectedManual.category,
        writer: selectedManual.writer.trim(),
        email: selectedManual.email || '',
        is_notice: selectedManual.is_notice || false,
        is_private: selectedManual.is_private || false,
      };

      if (!updateData.id || !updateData.title || !updateData.writer) {
        throw new Error('필수 입력값이 누락되었습니다.');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: UPDATE_MANUAL,
          variables: {
            input: updateData,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('서버 응답이 실패했습니다.');
      }

      const result = await response.json();

      if (result.errors) {
        console.error('Update errors:', result.errors);
        const errorMessage = result.errors[0]?.message || '매뉴얼 수정에 실패했습니다.';
        throw new Error(errorMessage);
      }

      if (!result.data?.docsManualUpdate) {
        throw new Error('매뉴얼 수정에 실패했습니다.');
      }

      const updatedManual = result.data.docsManualUpdate;

      finishLoading();

      // 수정 완료 후 해당 매뉴얼 상세 페이지로 리다이렉트
      const redirectUrl = `/channels/docs/manual/${category}/${updatedManual.id}`;
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('매뉴얼 수정 오류:', err);
      setError(err instanceof Error ? err.message : '매뉴얼 수정에 실패했습니다.');
      finishLoading();
      return;
    }
  };

  // 매뉴얼 생성
  const handleCreateManual = async () => {
    if (!newManual.title || !newManual.content || !newManual.writer) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      setCustomMessage('매뉴얼을 작성하는 중입니다...');
      startLoading();
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: CREATE_MANUAL,
          variables: {
            input: newManual,
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        console.error('Create errors:', result.errors);
        const errorMessage = result.errors[0]?.message || '매뉴얼 작성에 실패했습니다.';
        throw new Error(errorMessage);
      }

      if (!result.data?.docsManualCreate) {
        throw new Error('매뉴얼 작성에 실패했습니다.');
      }

      // 매뉴얼 목록 새로고침
      window.location.reload();

    } catch (error) {
      console.error('매뉴얼 작성 오류:', error);
      alert(error instanceof Error ? error.message : '매뉴얼 작성에 실패했습니다.');
      finishLoading();
    }
  };

  // 카테고리 변경 (한글 -> 영어로 변환 후 네비게이션)
  const handleCategoryChange = (koCategory: string) => {
    const enCategory = convertKoToEn(koCategory);
    if (enCategory !== category) {
      navigate(`/channels/docs/manual/${enCategory}`);
    }
  };

  // 검색 필터링
  const filteredManuals = manuals.filter(manual => {
    const matchesSearch = manual.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manual.writer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    try {
      // ISO 형식 날짜 처리
      const date = new Date(dateString);
      
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return dateString; // 원본 문자열 반환
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  // URL 파라미터(영어)를 한글로 변환
  const getCurrentCategoryKo = () => {
    const mapping = langMappings.find(m => m.en === category);
    return mapping ? mapping.ko : category;
  };

  // 한글 카테고리명을 영어로 변환
  const convertKoToEn = (koCategory: string) => {
    const mapping = langMappings.find(m => m.ko === koCategory);
    return mapping ? mapping.en : koCategory;
  };

  // 카테고리명 매핑
  const getCategoryInfo = () => {
    const currentKo = getCurrentCategoryKo();
    
    const categoryMap = {
      '사용자매뉴얼': { label: '사용자 매뉴얼', name: '사용자' },
      '개발자매뉴얼': { label: '개발자 매뉴얼', name: '개발자' },
      '운영매뉴얼': { label: '운영 매뉴얼', name: '운영' },
      '운영가이드': { label: '운영 가이드', name: '가이드' },
      '시스템가이드': { label: '시스템 가이드', name: '시스템' }
    };

    const categoryInfo = categoryMap[currentKo as keyof typeof categoryMap] || { label: '매뉴얼', name: currentKo };

    return {
      title: categoryInfo.label,
      breadcrumbs: [
        { label: '문서', href: '/channels/docs/manual/user_manual' },
        { label: categoryInfo.name, href: `/channels/docs/manual/${category}` }
      ]
    };
  };

  const { title, breadcrumbs } = getCategoryInfo();

  return (
    <PageContainer>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0.5">
        <div className="flex justify-between items-center mb-0.5">
          {activeTab === 'list' && (
            <>
              <div className="flex items-center space-x-4">
                <RadioButtonSet
                  options={langMappings.map(mapping => ({
                    value: mapping.ko,
                    label: mapping.ko
                  }))}
                  value={getCurrentCategoryKo()}
                  onChange={handleCategoryChange}
                />
                <div className="w-[300px]">
                  <InputWithIcon
                    placeholder="제목 또는 작성자로 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <ButtonWithIcon
                icon={<Plus className="mr-2 h-4 w-4" />}
                onClick={() => {
                  navigate(`/channels/docs/manual/${category}/new?format=markdown`);
                }}
              >
                글쓰기
              </ButtonWithIcon>
            </>
          )}
        </div>

        <TabsContent value="list" className="mt-0 p-0">
          <DataTable containerClassName="mt-0">
            <DataTableHeader>
              <DataTableRow isHoverable={false}>
                <DataTableCell isHeader className="w-[50px]">번호</DataTableCell>
                <DataTableCell isHeader>제목</DataTableCell>
                <DataTableCell isHeader className="w-[100px]">카테고리</DataTableCell>
                <DataTableCell isHeader className="w-[100px]">작성자</DataTableCell>
                <DataTableCell isHeader className="w-[100px]">작성일</DataTableCell>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {error ? (
                <DataTableRow isHoverable={false}>
                  <DataTableCell className="text-center py-4 text-red-500" colSpan={5}>
                    {error}
                  </DataTableCell>
                </DataTableRow>
              ) : filteredManuals.length === 0 ? (
                <DataTableRow isHoverable={false}>
                  <DataTableCell className="text-center py-4" colSpan={5}>
                    매뉴얼이 없습니다.
                  </DataTableCell>
                </DataTableRow>
              ) : (
                filteredManuals.map((manual) => (
                  <DataTableRow
                    key={manual.id}
                    onClick={() => {
                      navigate(`/channels/docs/manual/${category}/${manual.id}`);
                    }}
                  >
                    <DataTableCell>{manual.id}</DataTableCell>
                    <DataTableCell className="max-w-[400px] truncate">
                      {manual.is_notice && <span className="text-red-600 font-semibold">[공지] </span>}
                      {manual.is_private && <span className="text-color-primary-muted-foreground font-semibold">[비공개] </span>}
                      {manual.title}
                    </DataTableCell>
                    <DataTableCell>{manual.category}</DataTableCell>
                    <DataTableCell>{manual.writer}</DataTableCell>
                    <DataTableCell>{formatDate(manual.created_at)}</DataTableCell>
                  </DataTableRow>
                ))
              )}
            </DataTableBody>
          </DataTable>
        </TabsContent>

        <TabsContent value="detail" className="mt-0 p-0">
          {selectedManual && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <Button variant="outline" onClick={() => {
                  setActiveTab('list');
                  setSelectedManual(null);
                  setIsEditMode(false);
                }}>
                  목록으로
                </Button>
                {!isEditMode && user && (user.role === 'admin' || user.role === 'manager') && (
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleEditToggle}>
                      수정
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteClick}>
                      삭제
                    </Button>
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <div className="border-b pb-4 mb-4">
                  <h2 className="text-2xl font-bold mb-2">
                    {isEditMode ? (
                      <div>
                        <Input
                          value={selectedManual.title}
                          onChange={(e) => setSelectedManual({ ...selectedManual, title: e.target.value })}
                          className="text-2xl font-bold"
                        />
                        <div className="flex gap-4 mt-2">
                          <Select
                            value={selectedManual.category}
                            onValueChange={(value) => setSelectedManual({ ...selectedManual, category: value })}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {user?.role === 'admin' && (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="notice-edit"
                                checked={selectedManual.is_notice}
                                onCheckedChange={(checked) =>
                                  setSelectedManual({ ...selectedManual, is_notice: checked })
                                }
                              />
                              <label htmlFor="notice-edit" className="text-sm font-medium">
                                공지
                              </label>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="private-edit"
                              checked={selectedManual.is_private}
                              onCheckedChange={(checked) =>
                                setSelectedManual({ ...selectedManual, is_private: checked })
                              }
                            />
                            <label htmlFor="private-edit" className="text-sm font-medium">
                              비공개
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {selectedManual.is_notice && <span className="text-red-600 font-semibold">[공지] </span>}
                        {selectedManual.title}
                      </div>
                    )}
                  </h2>
                  <div className="flex justify-between text-sm text-color-primary-muted-foreground">
                    <div className="flex space-x-4">
                      <span>카테고리: {selectedManual.category}</span>
                      <span>작성자: {selectedManual.writer}</span>
                      <span>작성일: {formatDate(selectedManual.created_at)}</span>
                      {selectedManual.updated_at !== selectedManual.created_at && (
                        <span>수정일: {formatDate(selectedManual.updated_at)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="min-h-[300px] mb-4">
                  {isEditMode ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">에디터:</span>
                          <Tabs value={selectedManual.format === 'markdown' ? 'markdown' : 'html'} onValueChange={(value) => {
                            const newFormat = value as 'html' | 'markdown';
                            setEditorMode(newFormat);
                            setSelectedManual({ ...selectedManual, format: newFormat === 'markdown' ? 'markdown' : 'text' });
                          }}>
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="html" className="flex items-center gap-1">
                                <Code className="h-4 w-4" />
                                HTML
                              </TabsTrigger>
                              <TabsTrigger value="markdown" className="flex items-center gap-1">
                                <Hash className="h-4 w-4" />
                                Markdown
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                      </div>

                      {selectedManual.format === 'markdown' ? (
                        <div className="space-y-2">
                          <p className="text-sm text-color-primary-muted-foreground">
                            마크다운 문법을 사용하여 편집하세요.
                          </p>
                          <MDEditor
                            value={selectedManual.content}
                            onChange={(value) => setSelectedManual({
                              ...selectedManual,
                              content: value || '',
                              format: 'markdown'
                            })}
                            data-color-mode="light"
                            height={400}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-end mb-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsSourceMode(!isSourceMode)}
                              className="flex items-center gap-1"
                            >
                              {isSourceMode ? (
                                <>
                                  <Eye className="h-4 w-4" />
                                  <span>미리보기</span>
                                </>
                              ) : (
                                <>
                                  <Code className="h-4 w-4" />
                                  <span>HTML</span>
                                </>
                              )}
                            </Button>
                          </div>
                          {isSourceMode ? (
                            <Textarea
                              ref={contentRef}
                              value={selectedManual.content}
                              onChange={(e) => setSelectedManual({ ...selectedManual, content: e.target.value })}
                              className={`min-h-[300px] font-mono ${textareaClass}`}
                              placeholder="HTML 내용을 입력하세요."
                            />
                          ) : (
                            <div className="border rounded-md p-3 min-h-[300px]">
                              <div dangerouslySetInnerHTML={{ __html: selectedManual.content || '' }} />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {selectedManual.format === 'markdown' ? (
                        <div className="prose max-w-none">
                          <ReactMarkdown>{selectedManual.content || ''}</ReactMarkdown>
                        </div>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: selectedManual.content || '' }} />
                      )}
                    </div>
                  )}
                </div>

                {isEditMode && (
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => {
                      setIsEditMode(false);
                      setIsSourceMode(false);
                    }}>
                      취소
                    </Button>
                    <Button onClick={handleSaveEdit}>
                      저장
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>매뉴얼 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 매뉴얼을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 새 매뉴얼 작성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 매뉴얼 작성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">제목</label>
              <Input
                value={newManual.title}
                onChange={(e) => setNewManual({ ...newManual, title: e.target.value })}
                placeholder="제목을 입력하세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">카테고리</label>
                <Select
                  value={newManual.category}
                  onValueChange={(value) => setNewManual({ ...newManual, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">작성자</label>
                <Input
                  value={newManual.writer}
                  onChange={(e) => setNewManual({ ...newManual, writer: e.target.value })}
                  placeholder="작성자를 입력하세요"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">내용</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">에디터:</span>
                  <Tabs value={editorMode} onValueChange={(value) => {
                    setEditorMode(value as 'html' | 'markdown');
                    setNewManual({ ...newManual, format: value === 'markdown' ? 'markdown' : 'text' });
                  }}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="html" className="flex items-center gap-1">
                        <Code className="h-4 w-4" />
                        HTML
                      </TabsTrigger>
                      <TabsTrigger value="markdown" className="flex items-center gap-1">
                        <Hash className="h-4 w-4" />
                        Markdown
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {editorMode === 'markdown' ? (
                <div className="space-y-2">
                  <p className="text-sm text-color-primary-muted-foreground">
                    마크다운 문법을 사용하여 작성하세요.
                  </p>
                  <MDEditor
                    value={newManual.content}
                    onChange={(value) => setNewManual({
                      ...newManual,
                      content: value || '',
                      format: 'markdown'
                    })}
                    data-color-mode="light"
                    height={300}
                  />
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSourceMode(!isSourceMode)}
                      className="flex items-center gap-1"
                    >
                      {isSourceMode ? (
                        <>
                          <Eye className="h-4 w-4" />
                          <span>미리보기</span>
                        </>
                      ) : (
                        <>
                          <Code className="h-4 w-4" />
                          <span>HTML</span>
                        </>
                      )}
                    </Button>
                  </div>
                  {isSourceMode ? (
                    <Textarea
                      ref={contentRef}
                      value={newManual.content}
                      onChange={(e) => setNewManual({ ...newManual, content: e.target.value, format: 'text' })}
                      className={`min-h-[300px] font-mono ${textareaClass}`}
                      placeholder="HTML 내용을 입력하세요."
                    />
                  ) : (
                    <div className="border rounded-md p-4 min-h-[300px]">
                      {newManual.content ? (
                        <div dangerouslySetInnerHTML={{ __html: newManual.content }} />
                      ) : (
                        <p className="text-color-primary-muted-foreground">내용을 입력하세요</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreateManual}>
              작성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}