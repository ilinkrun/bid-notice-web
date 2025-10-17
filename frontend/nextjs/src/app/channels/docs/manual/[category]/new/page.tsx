'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ButtonWithColorIcon } from '@/components/shared/FormComponents';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { DOCS_MANUAL_CREATE } from '../../graphql/mutations';
import { MAPPINGS_LANG_BY_AREA } from '../../graphql/queries';
import {
  ArrowLeft,
  X,
  Save
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent,
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Code,
  Hash
} from 'lucide-react';

import { marked } from 'marked';
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

// MDEditor CSS는 globals.css에서 @import로 로드됨

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

// 추가: 커스텀 스타일 클래스
const inputClass = "text-color-primary-foreground focus:placeholder:text-transparent focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200";

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
const uploadFile = async (file: File, setIsUploading: (loading: boolean) => void, editingMarkdown: string, setEditingMarkdown: (value: string) => void, isAuthenticated?: boolean, setUploadProgress?: (progress: number) => void) => {
  setIsUploading(true);
  try {
    console.log('🚀 파일 업로드 시작:', file.name, file.size, file.type);
    
    // 인증 상태 확인 (선택사항)
    if (isAuthenticated === false) {
      console.warn('사용자가 로그인하지 않았습니다');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    if (setUploadProgress) {
      setUploadProgress(50); // 중간 진행률 표시
    }
    
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
    
    console.log(`✅ 파일 업로드 완료: ${result.filename || file.name}`);
    
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    alert(`파일 업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  } finally {
    setIsUploading(false);
    if (setUploadProgress) {
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }
};

function NewManualContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { navigate } = useUnifiedNavigation();
  const { startLoading, finishLoading, setCustomMessage } = useUnifiedLoading();
  const { isAuthenticated, user } = useAuth();
  const category = params.category as string;
  const formatParam = searchParams.get('format'); // 'format' 파라미터 확인

  const [newManual, setNewManual] = useState<any>({
    title: '',
    content: '',
    markdown_source: '',
    format: 'markdown', // 기본값 markdown
    writer: '',
    email: '',
    is_notice: false,
    is_private: false,
  });
  const [editingMarkdown, setEditingMarkdown] = useState<string>(''); // 편집 중인 마크다운
  const [editorMode, setEditorMode] = useState<'html' | 'markdown'>('markdown'); // 기본값 markdown
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [langMappings, setLangMappings] = useState<LangMapping[]>([]);

  // 언어 매핑 데이터 조회
  useEffect(() => {
    const fetchLangMappings = async () => {
      try {
        const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || `http://localhost:${process.env.NEXT_PUBLIC_API_GRAPHQL_PORT || '21023'}/graphql`;
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

  const getCurrentCategoryKo = () => {
    const mapping = langMappings.find(m => m.en === category);
    return mapping ? mapping.ko : category;
  };

  // URL 파라미터에 따라 초기 설정
  useEffect(() => {
    if (formatParam === 'markdown' || !formatParam) {
      setEditorMode('markdown');
      setNewManual(prev => ({ ...prev, format: 'markdown' }));
    }
  }, [formatParam]);

  // 로그인된 사용자의 이름과 이메일을 자동 입력
  useEffect(() => {
    if (user) {
      setNewManual(prev => ({ 
        ...prev, 
        writer: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // 매뉴얼 생성
  const handleCreateManual = async () => {
    if (!newManual.title || !editingMarkdown) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    if (!user?.email) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      setCustomMessage('매뉴얼을 작성하는 중입니다...');
      startLoading();
      setError(null);
      
      console.log('💾 Saving new manual with editor mode:', editorMode);
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
      }

      const createData = {
        title: newManual.title.trim(),
        content: contentToSave,
        markdown_source: markdownSourceToSave,
        format: formatToSave,
        category: getCurrentCategoryKo(),
        writer: user.name || user.email,
        email: user.email,
        is_notice: newManual.is_notice || false,
        is_private: newManual.is_private || false,
      };

      console.log('🚀 Frontend sending createData:', createData);

      if (!createData.title || !createData.writer || !createData.email) {
        throw new Error('필수 입력값이 누락되었습니다.');
      }

      const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || `http://localhost:${process.env.NEXT_PUBLIC_API_GRAPHQL_PORT || '21023'}/graphql`;
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: DOCS_MANUAL_CREATE,
          variables: {
            input: createData,
          },
        }),
      });
      
      const result = await response.json();
      console.log('Create response:', result);
      
      if (result.errors) {
        console.error('Create errors:', result.errors);
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
        
        const errorMessage = result.errors[0]?.message || '매뉴얼 작성에 실패했습니다.';
        console.error('Error message:', errorMessage);
        throw new Error(errorMessage);
      }

      if (!result.data?.docsManualCreate) {
        throw new Error('매뉴얼 작성에 실패했습니다.');
      }

      finishLoading();
      
      // 저장 완료 후 목록 페이지로 이동
      window.location.href = `/channels/docs/manual/${category}`;
      
    } catch (error) {
      console.error('매뉴얼 작성 오류:', error);
      setError(error instanceof Error ? error.message : '매뉴얼 작성에 실패했습니다.');
      finishLoading();
    }
  };

  // 취소 버튼
  const handleCancel = () => {
    navigate(`/channels/docs/manual/${category}`);
  };

  if (error) {
    return (
      <div className="w-full">
        <Card className="border-0 shadow-none">
          <CardContent className="p-10 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => navigate(`/channels/docs/manual/${category}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="mb-4 flex justify-between items-center">
            <Button variant="outline" onClick={() => navigate(`/channels/docs/manual/${category}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
          </div>

          <div className="border rounded-lg p-4">
            <div className="border-b py-2 mb-4">
              <h1 className="text-2xl font-bold mb-2">
                <Input
                  value={newManual.title}
                  onChange={(e) => setNewManual({ ...newManual, title: e.target.value })}
                  className={`text-2xl font-bold ${inputClass}`}
                  placeholder="제목을 입력하세요"
                />
              </h1>
              
              {/* 공지글/비공개글 체크박스 */}
              <div className="flex gap-4 mt-2">
                {user?.role === 'admin' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notice"
                      checked={newManual.is_notice}
                      onCheckedChange={(checked) => 
                        setNewManual({ ...newManual, is_notice: checked })
                      }
                    />
                    <label htmlFor="notice" className="text-sm font-medium">
                      공지글
                    </label>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="private"
                    checked={newManual.is_private}
                    onCheckedChange={(checked) => 
                      setNewManual({ ...newManual, is_private: checked })
                    }
                  />
                  <label htmlFor="private" className="text-sm font-medium">
                    비공개글
                  </label>
                </div>
              </div>
            </div>

            <div className="min-h-[300px] mb-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 hidden">
                    <span className="text-sm font-medium">에디터:</span>
                    <Tabs value={editorMode} onValueChange={(value) => {
                      // HTML 모드는 비활성화
                      if (value === 'html') return;
                      
                      const newFormat = value as 'html' | 'markdown';
                      setEditorMode(newFormat);
                      setNewManual({ ...newManual, format: newFormat });
                      
                      // URL에 format 파라미터 추가
                      const searchParams = new URLSearchParams(window.location.search);
                      searchParams.set('format', newFormat);
                      const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
                      window.history.replaceState({}, '', newUrl);
                    }}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger 
                          value="html" 
                          className="flex items-center gap-1 opacity-50 cursor-not-allowed"
                          disabled
                        >
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
                
                <div className="space-y-2">
                  <p className="text-sm text-color-primary-muted-foreground">
                    마크다운 문법을 사용하여 작성하세요. 파일을 드래그 앤 드롭하거나 클립보드에서 붙여넣기할 수 있습니다.
                  </p>
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        파일을 업로드하는 중... {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : ''}
                      </div>
                      {uploadProgress > 0 && (
                        <div className="w-full rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
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
                            await uploadFile(file, setIsUploading, editingMarkdown, setEditingMarkdown, isAuthenticated, setUploadProgress);
                          }
                        }}
                        style={{ display: 'none' }}
                        id="file-upload-new"
                      />
                      <label 
                        htmlFor="file-upload-new" 
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
                          await uploadFile(file, setIsUploading, editingMarkdown, setEditingMarkdown, isAuthenticated, setUploadProgress);
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
                        previewOptions={{
                          remarkPlugins: [remarkBreaks, remarkGfm]
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <ButtonWithColorIcon
                icon={<X className="h-4 w-4" />}
                color="tertiary"
                mode="outline"
                onClick={handleCancel}
              >
                취소
              </ButtonWithColorIcon>
              <ButtonWithColorIcon
                icon={<Save className="h-4 w-4" />}
                color="secondary"
                mode="outline"
                onClick={handleCreateManual}
              >
                저장
              </ButtonWithColorIcon>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewManualPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewManualContent />
    </Suspense>
  );
}