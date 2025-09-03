'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
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

// MDEditor CSS 임포트
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

// MDEditor 동적 임포트 (SSR 방지)
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

// GraphQL 쿼리
const CREATE_POST = `
  mutation CreatePost($board: String!, $input: CreatePostInput!) {
    createPost(board: $board, input: $input) {
      id
      title
      content
      markdown_source
      format
      writer
      password
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
    const result = marked(markdown || '');
    return typeof result === 'string' ? result : markdown || '';
  } catch (error) {
    console.error('Markdown conversion error:', error);
    return markdown || '';
  }
};

export default function NewPostPage({ params }: { params: Promise<any> }) {
  const { board } = use(params);
  const { navigate } = useUnifiedNavigation();
  const { startLoading, finishLoading, setCustomMessage } = useUnifiedLoading();
  const searchParams = useSearchParams();
  const formatParam = searchParams.get('format'); // 'format' 파라미터 확인
  
  const [newPost, setNewPost] = useState<any>({
    title: '',
    content: '',
    markdown_source: '',
    format: 'markdown', // 기본값 markdown
    writer: '',
    password: '',
  });
  const [editingMarkdown, setEditingMarkdown] = useState<string>(''); // 편집 중인 마크다운
  const [editorMode, setEditorMode] = useState<'html' | 'markdown'>('markdown'); // 기본값 markdown
  const [error, setError] = useState<string | null>(null);

  // board 값을 board_${board} 형식으로 변환
  const channelBoard = `board_${board}`;

  // URL 파라미터에 따라 초기 설정
  useEffect(() => {
    if (formatParam === 'markdown' || !formatParam) {
      setEditorMode('markdown');
      setNewPost(prev => ({ ...prev, format: 'markdown' }));
    }
  }, [formatParam]);

  // 게시글 생성
  const handleCreatePost = async () => {
    if (!newPost.title || !editingMarkdown || !newPost.writer || !newPost.password) {
      alert('모든 필드를 입력해주세요.');
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
      let markdownSourceToSave = null;
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
        writer: newPost.writer.trim(),
        password: newPost.password,
      };

      console.log('🚀 Frontend sending createData:', createData);

      if (!createData.title || !createData.writer || !createData.password) {
        throw new Error('필수 입력값이 누락되었습니다.');
      }

      const response = await fetch('/api/graphql', {
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
        const errorMessage = result.errors[0]?.message || '게시글 작성에 실패했습니다.';
        throw new Error(errorMessage);
      }

      if (!result.data?.createPost) {
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
      <div className="container mx-auto py-10">
        <Card>
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
    <div className="container mx-auto py-10">
      <Card>
        <CardContent>
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
              <div className="flex space-x-4 mb-4">
                <Input
                  value={newPost.writer}
                  onChange={(e) => setNewPost({ ...newPost, writer: e.target.value })}
                  className={inputClass}
                  placeholder="작성자"
                />
                <Input
                  type="password"
                  value={newPost.password}
                  onChange={(e) => setNewPost({ ...newPost, password: e.target.value })}
                  className={inputClass}
                  placeholder="비밀번호 (4자리 숫자)"
                  maxLength={4}
                />
              </div>
            </div>

            <div className="min-h-[300px] mb-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
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
                    마크다운 문법을 사용하여 작성하세요.
                  </p>
                  <MDEditor
                    value={editingMarkdown || ''}
                    onChange={(value) => {
                      const newMarkdown = value || '';
                      setEditingMarkdown(newMarkdown);
                      console.log('✏️ Markdown content updated:', newMarkdown);
                    }}
                    data-color-mode="light"
                    height={400}
                  />
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