'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft
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

import dynamic from 'next/dynamic';
import { marked } from 'marked';
import { smartUpload } from '@/utils/chunkedUpload';

// MDEditor CSS 임포트 (에러 처리 및 대체 방법)
const loadMDEditorCSS = () => {
  try {
    // 먼저 기본 CSS 로드 시도
    require('@uiw/react-md-editor/markdown-editor.css');
    require('@uiw/react-markdown-preview/markdown.css');
    return true;
  } catch (error) {
    console.warn('MDEditor CSS loading failed, trying alternative method:', error);
    
    // 대체 방법: 동적으로 CSS 링크 추가
    try {
      if (typeof document !== 'undefined') {
        const cssLinks = [
          'https://unpkg.com/@uiw/react-md-editor/markdown-editor.css',
          'https://unpkg.com/@uiw/react-markdown-preview/markdown.css'
        ];
        
        cssLinks.forEach(href => {
          if (!document.querySelector(`link[href="${href}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
          }
        });
        return true;
      }
    } catch (fallbackError) {
      console.error('Fallback CSS loading also failed:', fallbackError);
    }
    
    return false;
  }
};

// CSS 로드 시도
loadMDEditorCSS();

// MDEditor 동적 임포트 (SSR 방지, 타임아웃 처리 포함)
const MDEditor = dynamic(
  () => {
    // 타임아웃 Promise 생성 (5초)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('MDEditor 로딩 타임아웃'));
      }, 5000);
    });

    // MDEditor import Promise 생성
    const importPromise = import('@uiw/react-md-editor');

    // Promise.race로 타임아웃 처리
    return Promise.race([importPromise, timeoutPromise])
      .catch((error) => {
        console.error('MDEditor import failed:', error);
        // 로딩 실패 시 기본 텍스트 에리어 반환
        return {
          default: ({ value, onChange, ...props }: any) => (
            <div className="space-y-2">
              <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border">
                ⚠️ 마크다운 에디터를 불러올 수 없어 기본 텍스트 에디터를 사용합니다.
              </div>
              <textarea
                value={value || ''}
                onChange={(e) => onChange?.(e.target.value)}
                className="w-full min-h-[400px] p-3 border rounded font-mono text-sm resize-y"
                placeholder="마크다운을 입력하세요..."
                {...props}
              />
            </div>
          )
        };
      });
  },
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 border rounded">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">마크다운 에디터를 불러오는 중...</p>
          <p className="text-xs text-gray-500 mt-2">5초 이상 걸리면 기본 에디터를 사용합니다.</p>
        </div>
      </div>
    )
  }
);

// GraphQL 쿼리
const CREATE_POST = `
  mutation CreatePost($board: String!, $input: BoardPostInput!) {
    boardsPostCreate(board: $board, input: $input) {
      id
      title
      content
      markdown_source
      format
      writer
      email
      created_at
      updated_at
      is_visible
    }
  }
`;

// 추가: 커스텀 스타일 클래스
const inputClass = "text-gray-800 focus:placeholder:text-transparent focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200";

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

// 파일 업로드 헬퍼 함수 (청크 업로드 사용)
const uploadFile = async (file: File, setIsUploading: (loading: boolean) => void, editingMarkdown: string, setEditingMarkdown: (value: string) => void, isAuthenticated?: boolean, setUploadProgress?: (progress: number) => void) => {
  setIsUploading(true);
  try {
    console.log('🚀 스마트 업로드 시작:', file.name, file.size, file.type);
    
    // 인증 상태 확인 (선택사항)
    if (isAuthenticated === false) {
      console.warn('사용자가 로그인하지 않았습니다');
    }
    
    const result = await smartUpload(file, {
      onProgress: (progress) => {
        console.log(`업로드 진행률: ${Math.round(progress)}%`);
        if (setUploadProgress) {
          setUploadProgress(progress);
        }
      },
      maxSingleUploadSize: 500 * 1024 // 500KB 이상은 청크 업로드
    });
    
    console.log('✅ 업로드 성공:', result);
    
    // 이미지 파일인 경우 이미지 마크다운, 그 외는 링크 마크다운
    let fileMarkdown;
    if (file.type.startsWith('image/')) {
      fileMarkdown = `![${result.filename}](${result.url})`;
    } else {
      fileMarkdown = `[${result.filename}](${result.url})`;
    }
    
    const newValue = `${editingMarkdown}\n\n${fileMarkdown}`;
    setEditingMarkdown(newValue);
    
    console.log(`✅ 파일 업로드 완료: ${result.filename}`);
    
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    alert(`파일 업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  } finally {
    setIsUploading(false);
    if (setUploadProgress) {
      setUploadProgress(0);
    }
  }
};

export default function NewPostPage({ params }: { params: Promise<any> }) {
  const { board } = use(params);
  const { navigate } = useUnifiedNavigation();
  const { startLoading, finishLoading, setCustomMessage } = useUnifiedLoading();
  const { isAuthenticated, user } = useAuth();
  const searchParams = useSearchParams();
  const formatParam = searchParams.get('format'); // 'format' 파라미터 확인
  
  const [newPost, setNewPost] = useState<any>({
    title: '',
    content: '',
    markdown_source: '',
    format: 'markdown', // 기본값 markdown
    writer: '',
    email: '',
  });
  const [editingMarkdown, setEditingMarkdown] = useState<string>(''); // 편집 중인 마크다운
  const [editorMode, setEditorMode] = useState<'html' | 'markdown'>('markdown'); // 기본값 markdown
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // board 값이 이미 board_ 접두사를 포함하는지 확인
  const channelBoard = board.startsWith('board_') ? board : `board_${board}`;

  // URL 파라미터에 따라 초기 설정
  useEffect(() => {
    if (formatParam === 'markdown' || !formatParam) {
      setEditorMode('markdown');
      setNewPost(prev => ({ ...prev, format: 'markdown' }));
    }
  }, [formatParam]);

  // 로그인된 사용자의 이름과 이메일을 자동 입력
  useEffect(() => {
    if (user) {
      setNewPost(prev => ({ 
        ...prev, 
        writer: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // 게시글 생성
  const handleCreatePost = async () => {
    if (!newPost.title || !editingMarkdown) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    if (!user?.email) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      setCustomMessage('게시글을 작성하는 중입니다...');
      startLoading();
      setError(null);
      
      console.log('💾 Saving new post with editor mode:', editorMode);
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
        title: newPost.title.trim(),
        content: contentToSave,
        markdown_source: markdownSourceToSave,
        format: formatToSave,
        writer: user.name || user.email,
        email: user.email,
      };

      console.log('🚀 Frontend sending createData:', createData);

      if (!createData.title || !createData.writer || !createData.email) {
        throw new Error('필수 입력값이 누락되었습니다.');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: CREATE_POST,
          variables: {
            board: channelBoard,
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
        
        const errorMessage = result.errors[0]?.message || '게시글 작성에 실패했습니다.';
        console.error('Error message:', errorMessage);
        throw new Error(errorMessage);
      }

      if (!result.data?.boardsPostCreate) {
        throw new Error('게시글 작성에 실패했습니다.');
      }

      finishLoading();
      
      // 저장 완료 후 목록 페이지로 이동
      window.location.href = `/channels/board/${board}`;
      
    } catch (error) {
      console.error('게시글 작성 오류:', error);
      setError(error instanceof Error ? error.message : '게시글 작성에 실패했습니다.');
      finishLoading();
    }
  };

  // 취소 버튼
  const handleCancel = () => {
    navigate(`/channels/board/${board}`);
  };

  if (error) {
    return (
      <div className="w-full">
        <Card className="border-0 shadow-none">
          <CardContent className="p-10 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => navigate(`/channels/board/${board}`)}>
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
            <Button variant="outline" onClick={() => navigate(`/channels/board/${board}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
          </div>

          <div className="border rounded-lg p-4">
            <div className="border-b pb-4 mb-4">
              <h1 className="text-2xl font-bold mb-2">
                <Input
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className={`text-2xl font-bold ${inputClass}`}
                  placeholder="제목을 입력하세요"
                />
              </h1>
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
                      setNewPost({ ...newPost, format: newFormat });
                      
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
                  <p className="text-sm text-muted-foreground">
                    마크다운 문법을 사용하여 작성하세요. 파일을 드래그 앤 드롭하거나 클립보드에서 붙여넣기할 수 있습니다.
                  </p>
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        파일을 업로드하는 중... {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : ''}
                      </div>
                      {uploadProgress > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  )}
                  {typeof window !== 'undefined' ? (
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
                        <span className="text-xs text-gray-500">또는 파일을 드래그해서 놓으세요</span>
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
                          data-color-mode="light"
                          height={400}
                          preview="live"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-96 border rounded">
                      <p className="text-sm text-gray-600">에디터를 초기화하는 중...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                취소
              </Button>
              <Button onClick={handleCreatePost}>
                저장
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}