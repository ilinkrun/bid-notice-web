'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Hash
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Tabs, 
  TabsContent,
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import Comments from '@/components/board/Comments';

import dynamic from 'next/dynamic';
import { marked } from 'marked';
import TurndownService from 'turndown';

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

// GraphQL 쿼리
const GET_POST = `
  query GetPost($id: Int!, $board: String!) {
    boardsPostsOne(id: $id, board: $board) {
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

const UPDATE_POST = `
  mutation UpdatePost($board: String!, $input: BoardPostInput!) {
    boardsPostUpdate(board: $board, input: $input) {
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

const DELETE_POST = `
  mutation DeletePost($board: String!, $input: BoardPostDeleteInput!) {
    boardsPostDelete(board: $board, input: $input) {
      id
      title
      content
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
const textareaClass = "text-gray-800 focus:placeholder:text-transparent focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200";

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

// 파일 업로드 헬퍼 함수 (청크 업로드 지원)
const uploadFile = async (file: File, setIsUploading: (loading: boolean) => void, editingMarkdown: string, setEditingMarkdown: (value: string) => void, setPost: any, post: any) => {
  setIsUploading(true);
  try {
    // 스마트 업로드 사용 (작은 파일은 일반 업로드, 큰 파일은 청크 업로드)
    const { smartUpload } = await import('@/utils/chunkedUpload');
    
    const result = await smartUpload(file, {
      onProgress: (progress) => {
        console.log(`업로드 진행률: ${Math.round(progress)}%`);
      },
      maxSingleUploadSize: 500 * 1024 // 500KB 이상은 청크 업로드
    });
    
    // 이미지 파일인 경우 이미지 마크다운, 그 외는 링크 마크다운
    let fileMarkdown;
    if (file.type.startsWith('image/')) {
      fileMarkdown = `![${result.filename}](${result.url})`;
    } else {
      fileMarkdown = `[${result.filename}](${result.url})`;
    }
    
    const newValue = `${editingMarkdown}\n\n${fileMarkdown}`;
    setEditingMarkdown(newValue);
    setPost({ 
      ...post, 
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

export default function PostDetailPage({ params }: { params: Promise<any> }) {
  const { board, id } = use(params);
  const { navigate } = useUnifiedNavigation();
  const { startLoading, finishLoading, setCustomMessage } = useUnifiedLoading();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode'); // 'edit' 모드 확인
  const formatParam = searchParams.get('format'); // 'format' 파라미터 확인
  
  const [post, setPost] = useState<any>(null);
  const [originalMarkdownSource, setOriginalMarkdownSource] = useState<string>(''); // 원본 마크다운 저장
  const [editingMarkdown, setEditingMarkdown] = useState<string>(''); // 편집 중인 마크다운
  const [isEditMode, setIsEditMode] = useState(mode === 'edit');
  // 이메일 기반 인증으로 변경되어 비밀번호 관련 상태 제거
  const [actionType, setActionType] = useState<'edit' | 'delete' | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [editorMode, setEditorMode] = useState<'html' | 'markdown'>('html');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // board 값이 이미 board_ 접두사를 포함하는지 확인
  const channelBoard = board.startsWith('board_') ? board : `board_${board}`;

  // 게시글 조회
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setCustomMessage('게시글을 불러오는 중입니다...');
        setError(null);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: GET_POST,
            variables: {
              id: parseInt(id),
              board: channelBoard,
            },
          }),
        });
        
        const result = await response.json();
        
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }
        
        if (result.data && result.data.boardsPostsOne) {
          const postData = result.data.boardsPostsOne;
          if (postData.email === null || postData.email === undefined) {
            postData.email = '';
          }
          
          console.log('📝 Loading post data:');
          console.log('postData.markdown_source:', postData.markdown_source);
          console.log('postData.markdown_source type:', typeof postData.markdown_source);
          console.log('postData.markdown_source === null:', postData.markdown_source === null);
          console.log('postData.content:', postData.content?.substring(0, 100) + '...');
          console.log('postData.format:', postData.format);
          console.log('formatParam from URL:', formatParam);
          
          // 마크다운 원본 소스 관리
          let markdownSource = '';
          let htmlContent = postData.content || '';
          
          // 마크다운 원본이 데이터베이스에 저장되어 있는 경우 - 우선순위 1
          if (postData.markdown_source && postData.markdown_source.trim() !== '') {
            markdownSource = postData.markdown_source;
            console.log('✅ Found stored markdown_source from database:', markdownSource.substring(0, 100) + '...');
          }
          // 마크다운 원본이 없고 format이 markdown인 경우, content를 마크다운으로 간주 - 우선순위 2
          else if (postData.format === 'markdown') {
            markdownSource = postData.content || '';
            htmlContent = convertMarkdownToHtml(markdownSource);
            console.log('📄 No markdown_source found, treating content as markdown:', markdownSource.substring(0, 100) + '...');
          }
          // HTML/텍스트 형식인 경우, 필요시 HTML을 마크다운으로 변환 - 우선순위 3
          else {
            markdownSource = convertHtmlToMarkdown(postData.content || '');
            console.log('🔄 Converting HTML to markdown for editing:', markdownSource.substring(0, 100) + '...');
          }
          
          // 상태 설정 - 편집용과 원본 모두 동일한 값으로 설정
          setOriginalMarkdownSource(markdownSource);
          setEditingMarkdown(markdownSource);
          console.log('🎯 Set editingMarkdown to:', markdownSource.substring(0, 100) + '...');
          
          // editor 모드 결정 - URL 파라미터 우선
          let initialEditorMode: 'html' | 'markdown';
          if (formatParam === 'markdown') {
            initialEditorMode = 'markdown';
            console.log('🔗 URL format=markdown parameter detected, forcing markdown mode');
          } else {
            initialEditorMode = postData.format === 'markdown' ? 'markdown' : 'html';
            console.log('📋 Using post format for editor mode:', postData.format, '->', initialEditorMode);
          }
          
          // 표시용 content 설정 (상세보기용)
          let displayContent = htmlContent;
          if (postData.format === 'markdown' && formatParam !== 'markdown') {
            // 마크다운 게시글을 상세보기할 때는 변환된 HTML 표시
            displayContent = convertMarkdownToHtml(markdownSource);
          }
          
          console.log('📄 Final display content setup:');
          console.log('displayContent length:', displayContent?.length || 0);
          console.log('markdownSource length:', markdownSource?.length || 0);
          console.log('postData.format:', postData.format);
          
          setPost({ ...postData, content: displayContent });
          setEditorMode(initialEditorMode);
          console.log(`🎯 Set editor mode to: ${initialEditorMode}`);
          finishLoading();
        } else {
          throw new Error('게시글을 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('게시글 조회 오류:', err);
        setError('게시글을 불러오는데 실패했습니다.');
        finishLoading();
      }
    };
    
    fetchPost();
  }, [id, channelBoard, finishLoading, setCustomMessage]);

  // URL mode 파라미터 변경시 수정 모드 동기화
  useEffect(() => {
    setIsEditMode(mode === 'edit');
    if (mode === 'edit') {
      setIsSourceMode(true);
    }
  }, [mode]);

  // 수정 버튼 클릭
  const handleEditClick = () => {
    if (!post) return;
    
    setActionType('edit');
    handlePermissionCheck();
  };

  // 삭제 버튼 클릭
  const handleDeleteClick = () => {
    if (!post) return;
    
    setActionType('delete');
    handlePermissionCheck();
  };

  // 이메일 기반 권한 확인
  const handlePermissionCheck = () => {
    if (!post) {
      console.error('선택된 게시글이 없습니다.');
      return;
    }
    
    // 작성자 이메일과 현재 사용자 이메일 비교
    const postEmail = post.email?.trim().toLowerCase();
    const userEmail = user?.email?.trim().toLowerCase();
    
    console.log('수정/삭제 권한 확인:', {
      postEmail,
      userEmail,
      액션: actionType
    });
    
    // 로그인한 사용자의 이메일과 게시글 작성자 이메일이 일치하는지 확인
    if (userEmail && postEmail && userEmail === postEmail) {
      if (actionType === 'edit') {
        // URL에 mode=edit&format=markdown 파라미터 추가 (기본 마크다운 모드)
        navigate(`/channels/board/${board}/${id}?mode=edit&format=markdown`);
      } else if (actionType === 'delete') {
        setIsDeleteDialogOpen(true);
      }
    } else {
      alert('작성자만 수정/삭제할 수 있습니다.');
    }
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!post) return;
    
    try {
      setCustomMessage('게시글을 수정하는 중입니다...');
      startLoading();
      setError(null);
      
      console.log('💾 Saving post with editor mode:', editorMode);
      console.log('editingMarkdown:', editingMarkdown);
      console.log('post.content:', post.content);
      
      // 저장할 데이터 준비
      let contentToSave = '';
      let markdownSourceToSave: string | null = null;
      let formatToSave = editorMode;

      if (editorMode === 'markdown') {
        // 마크다운 모드: 편집중인 마크다운을 HTML로 변환해서 content에 저장
        markdownSourceToSave = editingMarkdown;
        contentToSave = convertMarkdownToHtml(editingMarkdown);
        formatToSave = 'markdown';
        
        console.log('📝 Markdown mode save:');
        console.log('markdownSourceToSave:', markdownSourceToSave);
        console.log('contentToSave (converted HTML):', contentToSave);
        
        // 다음 편집을 위해 원본 마크다운도 업데이트
        setOriginalMarkdownSource(editingMarkdown);
      } else {
        // HTML/텍스트 모드: post.content를 그대로 저장, markdown_source는 null
        contentToSave = post.content;
        markdownSourceToSave = null;
        formatToSave = 'html';
        
        console.log('🏷️ HTML mode save:');
        console.log('contentToSave:', contentToSave);
      }

      const updateData = {
        id: parseInt(post.id.toString()),
        title: post.title.trim(),
        content: contentToSave,
        markdown_source: markdownSourceToSave,
        format: formatToSave,
        writer: post.writer.trim(),
        email: user?.email || post.email
      };

      console.log('🚀 Frontend sending updateData:', updateData);

      if (!updateData.id || !updateData.title || !updateData.writer || !updateData.email) {
        throw new Error('필수 입력값이 누락되었습니다.');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: UPDATE_POST,
          variables: {
            board: channelBoard,
            input: updateData,
          },
        }),
      });
      
      const result = await response.json();
      
      console.log('✅ GraphQL 응답:', result);
      
      if (result.errors) {
        console.error('❌ GraphQL 에러:', result.errors);
        throw new Error(result.errors[0].message);
      }

      console.log('📝 result.data?.boardsPostUpdate:', result.data?.boardsPostUpdate);
      
      if (!result.data?.boardsPostUpdate) {
        console.error('❌ boardsPostUpdate 데이터가 없음');
        throw new Error('게시글 수정에 실패했습니다.');
      }

      console.log('✅ 게시글 수정 성공, 페이지 이동 시작');
      finishLoading();
      
      // 저장 완료 후 상세보기 화면으로 이동
      const targetUrl = `/channels/board/${board}/${id}`;
      console.log('🔄 페이지 이동 시도:', targetUrl);
      console.log('📍 현재 URL:', window.location.href);
      
      // URL 직접 변경으로 이동 (쿼리 파라미터 제거)
      window.location.href = targetUrl;
      console.log('✅ window.location.href로 페이지 이동 완료');
      
    } catch (err) {
      console.error('게시글 수정 오류:', err);
      setError(err instanceof Error ? err.message : '게시글 수정에 실패했습니다.');
      finishLoading();
    }
  };

  // 삭제 확인
  const handleDeleteConfirm = async () => {
    if (!post) return;
    
    try {
      setCustomMessage('게시글을 삭제하는 중입니다...');
      startLoading();
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: DELETE_POST,
          variables: {
            board: channelBoard,
            input: {
              id: post.id,
              email: user?.email || post.email || '',
            },
          },
        }),
      });
      
      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      // 삭제 성공시 목록 페이지로 이동
      navigate(`/channels/board/${board}`);
      finishLoading();
      
    } catch (err) {
      console.error('게시글 삭제 오류:', err);
      setError('게시글 삭제에 실패했습니다.');
      finishLoading();
    }
  };

  // 수정 취소
  const handleCancelEdit = () => {
    navigate(`/channels/board/${board}/${id}`);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  if (!post) {
    return (
      <div className="w-full">
        <Card className="border-0 shadow-none">
          <CardContent className="p-10 text-center">
            로딩 중...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="mb-4 flex justify-between items-start">
            <div className="flex items-center">
              <Button variant="outline" onClick={() => navigate(`/channels/board/${board}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                목록으로
              </Button>
            </div>
            <div className="flex-1 mx-6">
              <h1 className="text-2xl font-bold mb-2">
                {isEditMode ? (
                  <Input
                    value={post.title}
                    onChange={(e) => setPost({ ...post, title: e.target.value })}
                    className={`text-2xl font-bold ${inputClass}`}
                  />
                ) : (
                  post.title
                )}
              </h1>
              {!isEditMode && (
                <div className="flex space-x-4 text-sm text-muted-foreground">
                  <span>작성자: {post.writer}</span>
                  <span>작성일: {formatDate(post.created_at)}</span>
                  {post.updated_at !== post.created_at && (
                    <span>수정일: {formatDate(post.updated_at)}</span>
                  )}
                </div>
              )}
            </div>
            {!isEditMode && post && (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleEditClick}>
                  <Edit className="mr-2 h-4 w-4" />
                  수정
                </Button>
                <Button variant="destructive" onClick={handleDeleteClick}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </Button>
              </div>
            )}
          </div>

          <div className="border rounded-lg p-4">

            <div className="min-h-[300px] mb-4">
              {isEditMode ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 hidden">
                      <span className="text-sm font-medium">에디터:</span>
                      <Tabs value={editorMode} onValueChange={(value) => {
                        const newFormat = value as 'html' | 'markdown';
                        
                        console.log('🔄 Editor mode change:', editorMode, '->', newFormat);
                        
                        // 마크다운에서 HTML로 전환시
                        if (editorMode === 'markdown' && newFormat === 'html') {
                          // 현재 편집중인 마크다운을 HTML로 변환해서 post.content에 설정
                          const convertedHtml = convertMarkdownToHtml(editingMarkdown);
                          setPost({ ...post, content: convertedHtml, format: newFormat });
                          console.log('📝➡️🏷️ Markdown to HTML conversion completed');
                        } 
                        // HTML에서 마크다운으로 전환시
                        else if (editorMode === 'html' && newFormat === 'markdown') {
                          // 원본 마크다운을 우선 사용
                          let markdownToEdit = originalMarkdownSource;
                          if (!markdownToEdit || markdownToEdit.trim() === '') {
                            markdownToEdit = convertHtmlToMarkdown(post.content);
                            console.log('🏷️➡️📝 No original markdown, converting HTML to markdown');
                          } else {
                            console.log('🏷️➡️📝 Using original markdown_source for editing');
                          }
                          setEditingMarkdown(markdownToEdit);
                          console.log('📝 Set editing markdown content:', markdownToEdit.substring(0, 100) + '...');
                        }
                        
                        setEditorMode(newFormat);
                        
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
                  
                  {editorMode === 'markdown' ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        마크다운 문법을 사용하여 편집하세요. 파일을 드래그 앤 드롭하거나 클립보드에서 붙여넣기할 수 있습니다.
                      </p>
                      {isUploading && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          파일을 업로드하는 중...
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
                                  await uploadFile(file, setIsUploading, editingMarkdown, setEditingMarkdown, setPost, post);
                                }
                              }}
                              style={{ display: 'none' }}
                              id="file-upload"
                            />
                            <label 
                              htmlFor="file-upload" 
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
                                await uploadFile(file, setIsUploading, editingMarkdown, setEditingMarkdown, setPost, post);
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
                                setPost({ 
                                  ...post, 
                                  format: 'markdown'
                                });
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
                          value={post.content}
                          onChange={(e) => setPost({ ...post, content: e.target.value })}
                          className={`min-h-[300px] font-mono ${textareaClass}`}
                          placeholder="HTML 내용을 입력하세요."
                        />
                      ) : (
                        <div className="border rounded-md p-3 min-h-[300px]">
                          <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="min-h-[300px] border rounded-md p-4">
                  {post.format === 'markdown' ? (
                    <div className="prose max-w-none">
                      {originalMarkdownSource && originalMarkdownSource.trim() ? (
                        <MarkdownPreview 
                          source={originalMarkdownSource}
                          data-color-mode="light"
                          wrapperElement={{
                            "data-color-mode": "light"
                          }}
                        />
                      ) : post.content && post.content.trim() ? (
                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                      ) : (
                        <div className="text-gray-500 italic">내용이 없습니다.</div>
                      )}
                    </div>
                  ) : (
                    <>
                      {post.content && post.content.trim() ? (
                        <div 
                          className="whitespace-pre-wrap break-words"
                          dangerouslySetInnerHTML={{ __html: post.content }} 
                        />
                      ) : (
                        <div className="text-gray-500 italic">내용이 없습니다.</div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {isEditMode && (
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  취소
                </Button>
                <Button onClick={handleSaveEdit}>
                  저장
                </Button>
              </div>
            )}
          </div>

          {/* 댓글 섹션 - 수정 모드가 아닐 때만 표시 */}
          {!isEditMode && (
            <div className="border-t pt-6 mt-6">
              <Comments 
                board={channelBoard}
                postId={post.id}
                onCommentCountChange={(count) => {
                  console.log('댓글 수 변경:', count);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>


      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
    </div>
  );
}