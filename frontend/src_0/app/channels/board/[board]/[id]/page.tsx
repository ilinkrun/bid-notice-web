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
import { 
  Tabs, 
  TabsContent,
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import Comments from '@/components/board/Comments';

import dynamic from 'next/dynamic';

// MDEditor 동적 임포트 (SSR 방지)
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

// markdown-to-jsx로 대체
const ReactMarkdown = dynamic(
  () => import('react-markdown'),
  { ssr: false }
);

// GraphQL 쿼리
const GET_POST = `
  query GetPost($id: Int!, $board: String!) {
    post(id: $id, board: $board) {
      id
      title
      content
      format
      writer
      password
      created_at
      updated_at
      is_visible
    }
  }
`;

const UPDATE_POST = `
  mutation UpdatePost($board: String!, $input: UpdatePostInput!) {
    updatePost(board: $board, input: $input) {
      id
      title
      content
      format
      writer
      password
      created_at
      updated_at
      is_visible
    }
  }
`;

const DELETE_POST = `
  mutation DeletePost($board: String!, $input: DeletePostInput!) {
    deletePost(board: $board, input: $input) {
      id
      title
      content
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
const textareaClass = "text-gray-800 focus:placeholder:text-transparent focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200";

export default function PostDetailPage({ params }: { params: Promise<any> }) {
  const { board, id } = use(params);
  const { navigate } = useUnifiedNavigation();
  const { startLoading, finishLoading, setCustomMessage } = useUnifiedLoading();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode'); // 'edit' 모드 확인
  
  const [post, setPost] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(mode === 'edit');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [actionType, setActionType] = useState<'edit' | 'delete' | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [editorMode, setEditorMode] = useState<'html' | 'markdown'>('html');
  const [error, setError] = useState<string | null>(null);

  // board 값을 channel_${board} 형식으로 변환
  const channelBoard = `channel_${board}`;

  // 게시글 조회
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setCustomMessage('게시글을 불러오는 중입니다...');
        setError(null);
        
        const response = await fetch('/api/graphql', {
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
        
        if (result.data && result.data.post) {
          const postData = result.data.post;
          if (postData.password === null || postData.password === undefined) {
            postData.password = '';
          }
          setPost(postData);
          setEditorMode(postData.format === 'markdown' ? 'markdown' : 'html');
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
    setPasswordError('');
    setPasswordInput('');
    setIsPasswordDialogOpen(true);
  };

  // 삭제 버튼 클릭
  const handleDeleteClick = () => {
    if (!post) return;
    
    setActionType('delete');
    setPasswordError('');
    setPasswordInput('');
    setIsPasswordDialogOpen(true);
  };

  // 비밀번호 확인
  const handlePasswordCheck = () => {
    if (!post) {
      console.error('선택된 게시글이 없습니다.');
      return;
    }
    
    const passwordExists = post.password !== undefined && post.password !== null;
    console.log('비밀번호 확인 시도:', {
      입력비밀번호: passwordInput ? '입력됨' : '입력안됨',
      원본비밀번호: passwordExists ? '존재함' : '없음',
    });
    
    const inputPwd = String(passwordInput || '').trim();
    const originalPwd = String(post.password || '').trim();
    const isMatch = inputPwd === originalPwd;
    
    if (isMatch) {
      setIsPasswordDialogOpen(false);
      setPasswordInput('');
      setPasswordError('');
      
      if (actionType === 'edit') {
        // URL에 mode=edit 파라미터 추가
        navigate(`/channels/board/${board}/${id}?mode=edit`);
      } else if (actionType === 'delete') {
        setIsDeleteDialogOpen(true);
      }
    } else {
      setPasswordError('비밀번호가 일치하지 않습니다.');
    }
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!post) return;
    
    try {
      setCustomMessage('게시글을 수정하는 중입니다...');
      startLoading();
      setError(null);
      
      const updateData = {
        id: parseInt(post.id.toString()),
        title: post.title.trim(),
        content: post.content,
        format: post.format || 'text',
        writer: post.writer.trim(),
        password: post.password
      };

      if (!updateData.id || !updateData.title || !updateData.writer || !updateData.password) {
        throw new Error('필수 입력값이 누락되었습니다.');
      }

      const response = await fetch('/api/graphql', {
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
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      if (!result.data?.updatePost) {
        throw new Error('게시글 수정에 실패했습니다.');
      }

      const updatedPost = result.data.updatePost;
      setPost(updatedPost);
      
      // URL에서 mode 파라미터 제거
      navigate(`/channels/board/${board}/${id}`);
      finishLoading();
      
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
      
      const response = await fetch('/api/graphql', {
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
              password: post.password || '',
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

  if (!post) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="p-10 text-center">
            로딩 중...
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
            {!isEditMode && (
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
            <div className="border-b pb-4 mb-4">
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
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex space-x-4">
                  <span>작성자: {post.writer}</span>
                  <span>작성일: {formatDate(post.created_at)}</span>
                  {post.updated_at !== post.created_at && (
                    <span>수정일: {formatDate(post.updated_at)}</span>
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
                      <Tabs value={post.format === 'markdown' ? 'markdown' : 'html'} onValueChange={(value) => {
                        const newFormat = value as 'html' | 'markdown';
                        setEditorMode(newFormat);
                        setPost({ ...post, format: newFormat === 'markdown' ? 'markdown' : 'text' });
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
                  
                  {post.format === 'markdown' ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        마크다운 문법을 사용하여 편집하세요.
                      </p>
                      <MDEditor
                        value={post.content}
                        onChange={(value) => setPost({ 
                          ...post, 
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
                <div className="whitespace-pre-wrap">
                  {post.format === 'markdown' ? (
                    <div className="prose max-w-none">
                      <ReactMarkdown>{post.content || ''}</ReactMarkdown>
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
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

      {/* 비밀번호 확인 다이얼로그 */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 확인</DialogTitle>
            <DialogDescription>
              게시글 {actionType === 'edit' ? '수정' : '삭제'}을 위해 비밀번호를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <form onSubmit={(e) => {
              e.preventDefault();
              handlePasswordCheck();
            }}>
              <Input
                type="password"
                placeholder="비밀번호"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={passwordError ? `border-red-500 ${inputClass}` : inputClass}
                autoFocus
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
              <div className="flex justify-end space-x-2 mt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsPasswordDialogOpen(false)}>
                  취소
                </Button>
                <Button type="submit">
                  확인
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

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