'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  ArrowLeft,
  Edit,
  Trash2,
  Code,
  Eye,
  Hash,
  X,
  Save
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { PageContainer } from '@/components/shared/PageContainer';
import { Button } from '@/components/ui/button';
import { ButtonWithIcon, ButtonWithColorIcon } from '@/components/shared/FormComponents';
import { Input } from '@/components/ui/input';
import { DOCS_MANUAL_UPDATE, DOCS_MANUAL_DELETE, DOCS_MANUAL_ONE } from '../../graphql/mutations';
import { MAPPINGS_LANG_BY_AREA } from '../../graphql/queries';

import dynamic from 'next/dynamic';
import { marked } from 'marked';
import TurndownService from 'turndown';

// MDEditor CSS는 globals.css에서 @import로 로드됨

// MDEditor 동적 임포트 (간단한 버전)
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 border rounded">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-color-primary-muted-foreground">마크다운 에디터를 불러오는 중...</p>
        </div>
      </div>
    )
  }
);

// markdown-to-jsx로 대체
const ReactMarkdown = dynamic(
  () => import('react-markdown'),
  { ssr: false }
);

// MDEditor Preview 컴포넌트 동적 임포트
const MarkdownPreview = dynamic(
  () => import('@uiw/react-markdown-preview'),
  { ssr: false }
);

interface LangMapping {
  id: number;
  area: string;
  ko: string;
  en: string;
  remark?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// GraphQL 쿼리는 mutations.ts에서 import됨

// 추가: 커스텀 스타일 클래스
const inputClass = "text-color-primary-foreground focus:placeholder:text-transparent focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200";
const textareaClass = "text-color-primary-foreground focus:placeholder:text-transparent focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200";

// 마크다운을 HTML로 변환하는 함수
const convertMarkdownToHtml = (markdown: string): string => {
  try {
    // 줄바꿈이 HTML에서도 반영되도록 breaks 옵션을 true로 설정
    marked.setOptions({
      breaks: true, // 줄바꿈을 <br>로 변환
      gfm: true, // GitHub Flavored Markdown 사용
    });
    
    const result = marked(markdown || '');
    return typeof result === 'string' ? result : markdown || '';
  } catch (error) {
    console.error('Markdown conversion error:', error);
    return markdown || '';
  }
};

// 파일 업로드 헬퍼 함수 (단순 업로드)
const uploadFile = async (file: File, setIsUploading: (loading: boolean) => void, editingMarkdown: string, setEditingMarkdown: (value: string) => void, setManual: any, manual: any) => {
  setIsUploading(true);
  try {
    console.log('🚀 파일 업로드 시작:', file.name, file.size, file.type);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`업로드 실패: ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ 업로드 성공:', result);
    
    // 이미지 파일인 경우 이미지 마크다운, 그 외는 링크 마크다운
    // URL에 공백이 있을 때는 <> 괄호로 감싸서 처리
    let fileMarkdown;
    if (file.type.startsWith('image/')) {
      fileMarkdown = `![${result.filename || file.name}](<${result.url}>)`;
    } else {
      fileMarkdown = `[${result.filename || file.name}](<${result.url}>)`;
    }
    
    const newValue = `${editingMarkdown}\n\n${fileMarkdown}`;
    setEditingMarkdown(newValue);
    setManual({ 
      ...manual, 
      format: 'markdown'
    });
    
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    if (error instanceof Error) {
      alert(`파일 업로드 실패: ${error.message}`);
    } else {
      alert('파일 업로드 중 오류가 발생했습니다.');
    }
  } finally {
    setIsUploading(false);
  }
};

// HTML을 마크다운으로 변환하는 함수
const convertHtmlToMarkdown = (html: string): string => {
  try {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-'
    });
    return turndownService.turndown(html || '');
  } catch (error) {
    console.error('HTML to markdown conversion error:', error);
    return html || '';
  }
};

export default function ManualDetailPage({ params }: { params: Promise<any> }) {
  const { category, id } = use(params);
  const { navigate } = useUnifiedNavigation();
  const { startLoading, finishLoading, setCustomMessage } = useUnifiedLoading();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode'); // 'edit' 모드 확인
  const formatParam = searchParams.get('format'); // 'format' 파라미터 확인
  
  const [manual, setManual] = useState<any>(null);
  const [originalMarkdownSource, setOriginalMarkdownSource] = useState<string>(''); // 원본 마크다운 저장
  const [editingMarkdown, setEditingMarkdown] = useState<string>(''); // 편집 중인 마크다운
  const [isEditMode, setIsEditMode] = useState(mode === 'edit');
  const [actionType, setActionType] = useState<'edit' | 'delete' | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [editorMode, setEditorMode] = useState<'html' | 'markdown'>('html');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [langMappings, setLangMappings] = useState<LangMapping[]>([]);

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
            query: MAPPINGS_LANG_BY_AREA,
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
          { id: 1, area: 'docs', ko: '운영가이드', en: 'op_guide', isActive: true, createdAt: '', updatedAt: '' },
          { id: 2, area: 'docs', ko: '시스템가이드', en: 'system_guide', isActive: true, createdAt: '', updatedAt: '' }
        ]);
      }
    };

    fetchLangMappings();
  }, []);

  // 매뉴얼 조회
  useEffect(() => {
    const fetchManual = async () => {
      try {
        setCustomMessage('매뉴얼을 불러오는 중입니다...');
        setError(null);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: DOCS_MANUAL_ONE,
            variables: {
              id: parseInt(id),
            },
          }),
        });
        
        const result = await response.json();
        
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }
        
        if (result.data && result.data.docsManualOne) {
          const manualData = result.data.docsManualOne;
          if (manualData.email === null || manualData.email === undefined) {
            manualData.email = '';
          }
          
          console.log('📝 Loading manual data:');
          console.log('manualData.markdown_source:', manualData.markdown_source);
          console.log('manualData.markdown_source type:', typeof manualData.markdown_source);
          console.log('manualData.markdown_source === null:', manualData.markdown_source === null);
          console.log('manualData.content:', manualData.content?.substring(0, 100) + '...');
          console.log('manualData.format:', manualData.format);
          console.log('formatParam from URL:', formatParam);
          
          // 마크다운 원본 소스 관리
          let markdownSource = '';
          let htmlContent = manualData.content || '';
          
          // 마크다운 원본이 데이터베이스에 저장되어 있는 경우 - 우선순위 1
          if (manualData.markdown_source && manualData.markdown_source.trim() !== '') {
            markdownSource = manualData.markdown_source;
            console.log('✅ 마크다운 원본 사용:', markdownSource.substring(0, 100) + '...');
            
            // 포맷을 마크다운으로 변경
            if (manualData.format !== 'markdown') {
              console.log('🔄 포맷을 마크다운으로 변경:', manualData.format, '->', 'markdown');
              manualData.format = 'markdown';
              setEditorMode('markdown');
            }
            
          } else if (manualData.format === 'markdown' && htmlContent.trim() !== '') {
            // 마크다운 원본은 없지만 포맷이 마크다운인 경우 - HTML을 마크다운으로 변환
            try {
              markdownSource = convertHtmlToMarkdown(htmlContent);
              console.log('🔄 HTML에서 마크다운으로 변환:', htmlContent.substring(0, 100) + '...', '->', markdownSource.substring(0, 100) + '...');
            } catch (error) {
              console.error('HTML to markdown conversion failed:', error);
              markdownSource = htmlContent;
            }
            
          } else {
            // 마크다운 원본도 없고 포맷도 마크다운이 아닌 경우 - HTML 모드로 유지
            console.log('📝 HTML 모드로 유지');
            setEditorMode('html');
          }
          
          setManual(manualData);
          setOriginalMarkdownSource(markdownSource);
          setEditingMarkdown(markdownSource);
          
          // URL에 format 파라미터가 있으면 해당 모드로 설정
          if (formatParam === 'markdown') {
            setEditorMode('markdown');
            if (!markdownSource && htmlContent) {
              const convertedMarkdown = convertHtmlToMarkdown(htmlContent);
              setEditingMarkdown(convertedMarkdown);
              setOriginalMarkdownSource(convertedMarkdown);
            }
          } else if (formatParam === 'html') {
            setEditorMode('html');
          }
          
        } else {
          throw new Error('매뉴얼을 찾을 수 없습니다.');
        }
        
        finishLoading();
      } catch (err) {
        console.error('매뉴얼 조회 오류:', err);
        setError(err instanceof Error ? err.message : '매뉴얼을 불러오는데 실패했습니다.');
        finishLoading();
      }
    };

    if (id) {
      fetchManual();
    }
  }, [id, formatParam, finishLoading, setCustomMessage]);

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

  // 편집 모드 시작
  const handleEditStart = () => {
    setIsEditMode(true);
    setActionType('edit');
    
    // 현재 에디터 모드에 따라 적절한 데이터 설정
    if (editorMode === 'markdown') {
      // 마크다운 모드: 마크다운 원본 사용
      setEditingMarkdown(originalMarkdownSource || manual?.markdown_source || '');
    } else {
      // HTML 모드: HTML 내용 사용
      setEditingMarkdown(manual?.content || '');
    }
  };

  // 편집 취소
  const handleEditCancel = () => {
    setIsEditMode(false);
    setActionType(null);
    setEditingMarkdown(originalMarkdownSource);
    setIsSourceMode(false);
  };

  // 매뉴얼 수정 저장
  const handleSaveEdit = async () => {
    if (!manual) return;

    try {
      setCustomMessage('매뉴얼을 수정하는 중입니다...');
      startLoading();
      setError(null);
      
      console.log('💾 Saving manual with editor mode:', editorMode);
      console.log('editingMarkdown:', editingMarkdown);
      
      // 저장할 데이터 준비
      let contentToSave = '';
      let markdownSourceToSave: string | null = null;
      let formatToSave = 'markdown';

      if (editorMode === 'markdown') {
        // 마크다운 모드: 편집중인 마크다운을 HTML로 변환해서 content에 저장
        markdownSourceToSave = editingMarkdown;
        contentToSave = convertMarkdownToHtml(editingMarkdown);
        formatToSave = 'markdown';
        
        console.log('📝 Markdown mode save:');
        console.log('markdownSourceToSave:', markdownSourceToSave);
        console.log('contentToSave (converted HTML):', contentToSave);
      } else {
        // HTML 모드: 편집중인 HTML을 content에 저장
        contentToSave = editingMarkdown;
        markdownSourceToSave = null;
        formatToSave = 'html';
        
        console.log('📝 HTML mode save:');
        console.log('contentToSave:', contentToSave);
      }

      const updateData = {
        id: parseInt(manual.id.toString()),
        title: manual.title.trim(),
        content: contentToSave,
        markdown_source: markdownSourceToSave,
        format: formatToSave,
        category: manual.category,
        writer: manual.writer.trim(),
        email: manual.email || '',
        is_notice: manual.is_notice || false,
        is_private: manual.is_private || false,
      };

      console.log('🚀 Frontend sending updateData:', updateData);

      if (!updateData.id || !updateData.title || !updateData.writer) {
        throw new Error('필수 입력값이 누락되었습니다.');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: DOCS_MANUAL_UPDATE,
          variables: {
            input: updateData,
          },
        }),
      });
      
      const result = await response.json();
      console.log('Update response:', result);
      
      if (result.errors) {
        console.error('Update errors:', result.errors);
        console.error('Full error details:', JSON.stringify(result.errors, null, 2));
        
        // 각 오류의 세부 정보 출력
        result.errors.forEach((error, index) => {
          console.error(`Error ${index + 1}:`, {
            message: error.message,
            locations: error.locations,
            path: error.path,
            extensions: error.extensions
          });
        });
        
        const errorMessage = result.errors[0]?.message || '매뉴얼 수정에 실패했습니다.';
        console.error('Error message:', errorMessage);
        throw new Error(errorMessage);
      }

      if (!result.data?.docsManualUpdate) {
        throw new Error('매뉴얼 수정에 실패했습니다.');
      }

      const updatedManual = result.data.docsManualUpdate;
      setManual(updatedManual);
      
      // 편집 모드 종료
      setIsEditMode(false);
      setActionType(null);
      setIsSourceMode(false);
      
      // 마크다운 원본 업데이트
      if (editorMode === 'markdown') {
        setOriginalMarkdownSource(editingMarkdown);
      }
      
      finishLoading();
      
    } catch (error) {
      console.error('매뉴얼 수정 오류:', error);
      setError(error instanceof Error ? error.message : '매뉴얼 수정에 실패했습니다.');
      finishLoading();
    }
  };

  // 삭제 확인 다이얼로그 열기
  const handleDeleteStart = () => {
    setActionType('delete');
    setIsDeleteDialogOpen(true);
  };

  // 매뉴얼 삭제
  const handleDeleteConfirm = async () => {
    if (!manual) return;

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
          query: DOCS_MANUAL_DELETE,
          variables: {
            input: {
              id: manual.id
            },
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        console.error('삭제 오류:', result.errors);
        throw new Error(result.errors[0].message);
      }

      finishLoading();
      
      // 삭제 완료 후 목록 페이지로 이동
      window.location.href = `/docs/manual/${category}`;

    } catch (error) {
      console.error('매뉴얼 삭제 오류:', error);
      setError(error instanceof Error ? error.message : '매뉴얼 삭제에 실패했습니다.');
      finishLoading();
    }
  };

  // 목록으로 돌아가기
  const handleBackToList = () => {
    navigate(`/docs/manual/${category}`);
  };

  if (error) {
    return (
      <PageContainer>
        <Card className="border-0 shadow-none">
          <CardContent className="p-10 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={handleBackToList}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!manual) {
    return (
      <PageContainer>
        <Card className="border-0 shadow-none">
          <CardContent className="p-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-color-primary-muted-foreground">매뉴얼을 불러오는 중...</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          {/* 상단 버튼 */}
          <div className="mb-4 flex justify-between items-center">
            <Button variant="outline" onClick={handleBackToList}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
            {!isEditMode && user && (user.role === 'admin' || user.role === 'manager' || user.email === manual.email) && (
              <div className="flex space-x-2">
                <ButtonWithIcon
                  icon={<Edit className="h-4 w-4" />}
                  onClick={handleEditStart}
                >
                  수정
                </ButtonWithIcon>
                {(user.role === 'admin' || user.role === 'manager') && (
                  <ButtonWithIcon
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={handleDeleteStart}
                    className="text-red-600 hover:text-red-700"
                  >
                    삭제
                  </ButtonWithIcon>
                )}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-4">
            {/* 제목 및 메타정보 */}
            <div className="border-b pb-4 mb-4">
              <h1 className="text-2xl font-bold mb-2">
                {isEditMode ? (
                  <Input
                    value={manual.title}
                    onChange={(e) => setManual({ ...manual, title: e.target.value })}
                    className={`text-2xl font-bold ${inputClass}`}
                    placeholder="제목을 입력하세요"
                  />
                ) : (
                  <div>
                    {manual.is_notice && <span className="text-red-600 font-semibold">[공지] </span>}
                    {manual.is_private && <span className="text-color-primary-muted-foreground font-semibold">[비공개] </span>}
                    {manual.title}
                  </div>
                )}
              </h1>
              
              {/* 편집 모드에서 공지글/비공개글 체크박스 */}
              {isEditMode && (
                <div className="flex gap-4 mt-2">
                  {user?.role === 'admin' && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notice-edit"
                        checked={manual.is_notice}
                        onCheckedChange={(checked) =>
                          setManual({ ...manual, is_notice: checked })
                        }
                      />
                      <label htmlFor="notice-edit" className="text-sm font-medium">
                        공지글
                      </label>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="private-edit"
                      checked={manual.is_private}
                      onCheckedChange={(checked) =>
                        setManual({ ...manual, is_private: checked })
                      }
                    />
                    <label htmlFor="private-edit" className="text-sm font-medium">
                      비공개글
                    </label>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between text-sm text-color-primary-muted-foreground mt-2">
                <div className="flex space-x-4">
                  <span>카테고리: {getCurrentCategoryKo()}</span>
                  <span>작성자: {manual.writer}</span>
                  <span>작성일: {formatDate(manual.created_at)}</span>
                  {manual.updated_at !== manual.created_at && (
                    <span>수정일: {formatDate(manual.updated_at)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* 내용 */}
            <div className="min-h-[300px] mb-4">
              {isEditMode ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">에디터:</span>
                      <Tabs value={editorMode} onValueChange={(value) => {
                        const newFormat = value as 'html' | 'markdown';
                        setEditorMode(newFormat);
                        
                        // 모드 변경 시 적절한 데이터로 전환
                        if (newFormat === 'markdown') {
                          // HTML -> 마크다운 모드로 변경
                          if (editorMode === 'html') {
                            const convertedMarkdown = convertHtmlToMarkdown(editingMarkdown);
                            setEditingMarkdown(convertedMarkdown);
                          } else {
                            setEditingMarkdown(originalMarkdownSource || manual.markdown_source || '');
                          }
                        } else {
                          // 마크다운 -> HTML 모드로 변경
                          if (editorMode === 'markdown') {
                            const convertedHtml = convertMarkdownToHtml(editingMarkdown);
                            setEditingMarkdown(convertedHtml);
                          } else {
                            setEditingMarkdown(manual.content || '');
                          }
                        }
                        
                        // URL에 format 파라미터 추가
                        const searchParams = new URLSearchParams(window.location.search);
                        searchParams.set('format', newFormat);
                        const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
                        window.history.replaceState({}, '', newUrl);
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
                        마크다운 문법을 사용하여 편집하세요. 파일을 드래그 앤 드롭하거나 클립보드에서 붙여넣기할 수 있습니다.
                      </p>
                      {isUploading && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          파일을 업로드하는 중...
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="file"
                            multiple
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              for (const file of files) {
                                await uploadFile(file, setIsUploading, editingMarkdown, setEditingMarkdown, setManual, manual);
                              }
                            }}
                            style={{ display: 'none' }}
                            id="file-upload-edit"
                          />
                          <label 
                            htmlFor="file-upload-edit" 
                            className="inline-flex items-center px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
                          >
                            📎 파일 업로드
                          </label>
                          <span className="text-xs text-color-primary-muted-foreground">또는 파일을 드래그해서 놓으세요</span>
                        </div>
                        <div
                          onDrop={async (event) => {
                            event.preventDefault();
                            const files = Array.from(event.dataTransfer?.files || []);
                            
                            for (const file of files) {
                              await uploadFile(file, setIsUploading, editingMarkdown, setEditingMarkdown, setManual, manual);
                            }
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDragEnter={(event) => event.preventDefault()}
                          onDragLeave={(event) => event.preventDefault()}
                        >
                          <MDEditor
                            value={editingMarkdown || ''}
                            onChange={(value) => {
                              const newMarkdown = value || '';
                              setEditingMarkdown(newMarkdown);
                              console.log('✏️ Markdown content updated:', newMarkdown);
                            }}
                            data-color-mode="auto"
                            height={400}
                            preview="live"
                          />
                        </div>
                      </div>
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
                          value={editingMarkdown}
                          onChange={(e) => setEditingMarkdown(e.target.value)}
                          className={`min-h-[300px] font-mono ${textareaClass}`}
                          placeholder="HTML 내용을 입력하세요."
                        />
                      ) : (
                        <div className="border rounded-md p-3 min-h-[300px]">
                          <div dangerouslySetInnerHTML={{ __html: editingMarkdown || '' }} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="whitespace-pre-wrap">
                  {manual.format === 'markdown' ? (
                    <div className="prose max-w-none">
                      {manual.markdown_source ? (
                        <MarkdownPreview source={manual.markdown_source} />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: manual.content || '' }} />
                      )}
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: manual.content || '' }} />
                  )}
                </div>
              )}
            </div>

            {/* 편집 모드 버튼 */}
            {isEditMode && (
              <div className="flex justify-end space-x-2">
                <ButtonWithColorIcon
                  icon={<X className="h-4 w-4" />}
                  color="tertiary"
                  mode="outline"
                  onClick={handleEditCancel}
                >
                  취소
                </ButtonWithColorIcon>
                <ButtonWithColorIcon
                  icon={<Save className="h-4 w-4" />}
                  color="secondary"
                  mode="outline"
                  onClick={handleSaveEdit}
                >
                  저장
                </ButtonWithColorIcon>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
    </PageContainer>
  );
}