'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MessageCircle, Edit, Trash2, Send } from 'lucide-react';

interface Comment {
  id: number;
  board: string;
  post_id: number;
  content: string;
  writer: string;
  created_at: string;
  updated_at: string;
  is_visible: boolean;
}

interface CommentsResponse {
  total_count: number;
  page: number;
  per_page: number;
  comments: Comment[];
}

interface CommentsProps {
  board: string;
  postId: number;
  onCommentCountChange?: (count: number) => void;
}

// GraphQL 쿼리들
const GET_COMMENTS = `
  query GetComments($board: String!, $post_id: Int!, $page: Int, $per_page: Int) {
    comments(board: $board, post_id: $post_id, page: $page, per_page: $per_page) {
      total_count
      page
      per_page
      comments {
        id
        board
        post_id
        content
        writer
        created_at
        updated_at
        is_visible
      }
    }
  }
`;

const CREATE_COMMENT = `
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
      board
      post_id
      content
      writer
      created_at
      updated_at
      is_visible
    }
  }
`;

const UPDATE_COMMENT = `
  mutation UpdateComment($input: UpdateCommentInput!) {
    updateComment(input: $input) {
      id
      board
      post_id
      content
      writer
      created_at
      updated_at
      is_visible
    }
  }
`;

const DELETE_COMMENT = `
  mutation DeleteComment($input: DeleteCommentInput!) {
    deleteComment(input: $input) {
      id
    }
  }
`;

export default function Comments({ board, postId, onCommentCountChange }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // 댓글 작성 관련 상태
  const [newComment, setNewComment] = useState({
    content: '',
    writer: '',
    password: ''
  });
  const [isWriting, setIsWriting] = useState(false);
  
  // 댓글 수정/삭제 관련 상태
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [actionType, setActionType] = useState<'edit' | 'delete' | null>(null);
  const [targetCommentId, setTargetCommentId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 댓글 목록 조회
  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_COMMENTS,
          variables: {
            board,
            post_id: postId,
            page: 1,
            per_page: 100
          }
        })
      });
      
      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      const commentsData: CommentsResponse = result.data.comments;
      setComments(commentsData.comments);
      setTotalCount(commentsData.total_count);
      onCommentCountChange?.(commentsData.total_count);
    } catch (error) {
      console.error('댓글 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [board, postId]);

  // 댓글 작성
  const handleCreateComment = async () => {
    if (!newComment.content || !newComment.writer || !newComment.password) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    if (newComment.password.length !== 4 || !/^\d{4}$/.test(newComment.password)) {
      alert('비밀번호는 4자리 숫자여야 합니다.');
      return;
    }

    try {
      setLoading(true);
      
      console.log('댓글 작성 요청 데이터:', {
        board,
        post_id: postId,
        content: newComment.content,
        writer: newComment.writer,
        password: newComment.password,
        is_visible: true
      });
      
      const requestBody = {
        query: CREATE_COMMENT,
        variables: {
          input: {
            board,
            post_id: postId,
            content: newComment.content,
            writer: newComment.writer,
            password: newComment.password,
            is_visible: true
          }
        }
      };
      
      console.log('GraphQL 요청:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('응답 상태:', response.status, response.statusText);
      
      const result = await response.json();
      console.log('GraphQL 응답:', JSON.stringify(result, null, 2));
      
      if (result.errors) {
        console.error('GraphQL 에러:', result.errors);
        throw new Error(result.errors[0].message);
      }
      
      if (!result.data?.createComment) {
        throw new Error('댓글 작성 응답 데이터가 없습니다.');
      }
      
      console.log('댓글 작성 성공:', result.data.createComment);
      
      // 댓글 목록 새로고침
      await fetchComments();
      
      // 입력 필드 초기화
      setNewComment({
        content: '',
        writer: '',
        password: ''
      });
      setIsWriting(false);
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '댓글 작성에 실패했습니다.';
      alert(`댓글 작성 실패: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 확인 후 액션 실행
  const handlePasswordSubmit = async () => {
    if (!passwordInput || !targetCommentId) return;

    try {
      if (actionType === 'edit') {
        console.log('댓글 수정 요청:', {
          targetCommentId,
          editContent,
          passwordInput
        });
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: UPDATE_COMMENT,
            variables: {
              input: {
                id: targetCommentId,
                content: editContent,
                password: passwordInput,
                is_visible: true
              }
            }
          })
        });
        
        const result = await response.json();
        console.log('댓글 수정 GraphQL 응답:', result);
        
        if (result.errors) {
          console.error('댓글 수정 GraphQL 오류:', result.errors);
          const errorMessage = result.errors[0]?.message || '비밀번호가 일치하지 않습니다.';
          setPasswordError(errorMessage);
          return;
        }
        
        if (!result.data?.updateComment) {
          console.error('댓글 수정 응답 데이터 없음:', result);
          setPasswordError('댓글 수정에 실패했습니다.');
          return;
        }
        
        console.log('댓글 수정 성공');
        await fetchComments();
        setEditingCommentId(null);
        
      } else if (actionType === 'delete') {
        setIsPasswordDialogOpen(false);
        setIsDeleteDialogOpen(true);
        return; // 삭제 확인 다이얼로그를 표시하고 여기서 멈춤
      }
      
      // 성공 시 다이얼로그 닫기
      setIsPasswordDialogOpen(false);
      setPasswordInput('');
      setPasswordError('');
    } catch (error) {
      console.error('액션 실행 오류:', error);
      setPasswordError('작업에 실패했습니다.');
    }
  };

  // 댓글 삭제 확인
  const handleDeleteConfirm = async () => {
    if (!targetCommentId || !passwordInput) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: DELETE_COMMENT,
          variables: {
            input: {
              id: targetCommentId,
              password: passwordInput
            }
          }
        })
      });
      
      const result = await response.json();
      
      if (result.errors) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }
      
      await fetchComments();
      setIsDeleteDialogOpen(false);
      setPasswordInput('');
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 수정 버튼 클릭
  const handleEditClick = (comment: Comment) => {
    setTargetCommentId(comment.id);
    setEditContent(comment.content);
    setActionType('edit');
    setPasswordInput('');
    setPasswordError('');
    setIsPasswordDialogOpen(true);
  };

  // 삭제 버튼 클릭
  const handleDeleteClick = (commentId: number) => {
    setTargetCommentId(commentId);
    setActionType('delete');
    setPasswordInput('');
    setPasswordError('');
    setIsPasswordDialogOpen(true);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <div className="space-y-4">
      {/* 댓글 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">댓글 ({totalCount})</span>
        </div>
        {!isWriting && (
          <Button 
            onClick={() => setIsWriting(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            댓글 작성
          </Button>
        )}
      </div>

      {/* 댓글 작성 폼 */}
      {isWriting && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleCreateComment();
          }}>
            <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="작성자"
                value={newComment.writer}
                onChange={(e) => setNewComment({ ...newComment, writer: e.target.value })}
                className="text-gray-800 focus:placeholder:text-transparent focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                autoComplete="off"
              />
              <Input
                type="password"
                placeholder="비밀번호 (4자리 숫자)"
                value={newComment.password}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 4) {
                    setNewComment({ ...newComment, password: value });
                  }
                }}
                maxLength={4}
                className="text-gray-800 focus:placeholder:text-transparent focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                autoComplete="off"
              />
            </div>
            <Textarea
              placeholder="댓글을 입력하세요"
              value={newComment.content}
              onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
              className="text-gray-800 focus:placeholder:text-transparent focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsWriting(false);
                  setNewComment({ content: '', writer: '', password: '' });
                }}
              >
                취소
              </Button>
              <Button 
                type="submit"
                disabled={loading}
              >
                {loading ? '작성 중...' : '댓글 작성'}
              </Button>
            </div>
            </div>
          </form>
        </div>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            첫 번째 댓글을 작성해보세요!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{comment.writer}</span>
                  <span className="text-sm text-gray-500">
                    {formatDate(comment.created_at)}
                    {comment.updated_at !== comment.created_at && ' (수정됨)'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditClick(comment)}
                    className="h-7 w-7 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteClick(comment.id)}
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {editingCommentId === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setEditingCommentId(null)}
                    >
                      취소
                    </Button>
                    <Button size="sm">
                      저장
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{comment.content}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* 비밀번호 확인 다이얼로그 */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 확인</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionType === 'edit' && (
              <div>
                <label className="text-sm font-medium mb-2 block">수정할 내용</label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            <div>
              <Input
                type="password"
                placeholder="비밀번호 (4자리 숫자)"
                value={passwordInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 4) {
                    setPasswordInput(value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePasswordSubmit();
                  }
                }}
                maxLength={4}
                className="text-gray-800 focus:placeholder:text-transparent focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                autoComplete="off"
                autoFocus
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handlePasswordSubmit}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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