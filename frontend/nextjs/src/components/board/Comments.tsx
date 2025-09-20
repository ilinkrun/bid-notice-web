'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ButtonWithIcon, ButtonWithColorIcon } from '@/components/shared/FormComponents';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MessageCircle, Edit, Trash2, Send, X, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Comment {
  id: number;
  board: string;
  post_id: number;
  content: string;
  writer: string;
  email: string;
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
    boardsCommentsAll(board: $board, post_id: $post_id, page: $page, per_page: $per_page) {
      total_count
      page
      per_page
      comments {
        id
        board
        post_id
        content
        writer
        email
        created_at
        updated_at
        is_visible
      }
    }
  }
`;

const CREATE_COMMENT = `
  mutation CreateComment($input: BoardCommentInput!) {
    boardsCommentCreate(input: $input) {
      id
      board
      post_id
      content
      writer
      email
      created_at
      updated_at
      is_visible
    }
  }
`;

const UPDATE_COMMENT = `
  mutation UpdateComment($input: BoardCommentInput!) {
    boardsCommentUpdate(input: $input) {
      id
      board
      post_id
      content
      writer
      email
      created_at
      updated_at
      is_visible
    }
  }
`;

const DELETE_COMMENT = `
  mutation DeleteComment($input: BoardCommentDeleteInput!) {
    boardsCommentDelete(input: $input) {
      id
    }
  }
`;

export default function Comments({ board, postId, onCommentCountChange }: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // 댓글 작성 관련 상태
  const [newComment, setNewComment] = useState({
    content: '',
    writer: '',
    email: ''
  });
  const [isWriting, setIsWriting] = useState(false);
  
  // 댓글 수정/삭제 관련 상태
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
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
      
      const commentsData: CommentsResponse = result.data.boardsCommentsAll;
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
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!newComment.content) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      console.log('댓글 작성 요청 데이터:', {
        board,
        post_id: postId,
        content: newComment.content,
        writer: user.name,
        email: user.email,
        is_visible: true
      });
      
      const requestBody = {
        query: CREATE_COMMENT,
        variables: {
          input: {
            board,
            post_id: postId,
            content: newComment.content,
            writer: user.name,
            email: user.email,
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
      
      if (!result.data?.boardsCommentCreate) {
        throw new Error('댓글 작성 응답 데이터가 없습니다.');
      }
      
      console.log('댓글 작성 성공:', result.data.boardsCommentCreate);
      
      // 댓글 목록 새로고침
      await fetchComments();
      
      // 입력 필드 초기화
      setNewComment({
        content: '',
        writer: '',
        email: ''
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

  // 이메일 기반 권한 확인 후 수정 실행
  const handleUpdateComment = async (commentId: number, content: string) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: UPDATE_COMMENT,
          variables: {
            input: {
              id: commentId,
              board,
              post_id: postId,
              content: content,
              writer: user.name,
              email: user.email,
              is_visible: true
            }
          }
        })
      });
      
      const result = await response.json();
      console.log('댓글 수정 GraphQL 응답:', result);
      
      if (result.errors) {
        console.error('댓글 수정 GraphQL 오류:', result.errors);
        const errorMessage = result.errors[0]?.message || '작성자만 수정할 수 있습니다.';
        alert(errorMessage);
        return;
      }
      
      if (!result.data?.boardsCommentUpdate) {
        console.error('댓글 수정 응답 데이터 없음:', result);
        alert('댓글 수정에 실패했습니다.');
        return;
      }
      
      console.log('댓글 수정 성공');
      await fetchComments();
      setEditingCommentId(null);
      
    } catch (error) {
      console.error('댓글 수정 오류:', error);
      alert('댓글 수정에 실패했습니다.');
    }
  };

  // 댓글 삭제 확인
  const handleDeleteConfirm = async () => {
    if (!targetCommentId || !user) return;

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
              email: user.email
            }
          }
        })
      });
      
      const result = await response.json();
      
      if (result.errors) {
        const errorMessage = result.errors[0]?.message || '작성자만 삭제할 수 있습니다.';
        alert(errorMessage);
        return;
      }
      
      if (!result.data?.boardsCommentDelete) {
        alert('댓글 삭제에 실패했습니다.');
        return;
      }
      
      await fetchComments();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 수정 버튼 클릭
  const handleEditClick = (comment: Comment) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    // 작성자 이메일 확인
    if (user.email !== comment.email) {
      alert('작성자만 수정할 수 있습니다.');
      return;
    }
    
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  // 삭제 버튼 클릭
  const handleDeleteClick = (comment: Comment) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    // 작성자 이메일 확인
    if (user.email !== comment.email) {
      alert('작성자만 삭제할 수 있습니다.');
      return;
    }
    
    setTargetCommentId(comment.id);
    setIsDeleteDialogOpen(true);
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
          <ButtonWithIcon
            icon={<Send className="h-4 w-4" />}
            onClick={() => {
              if (!user) {
                alert('댓글 작성을 위해 로그인해주세요.');
                return;
              }
              setIsWriting(true);
            }}
          >
            댓글 작성
          </ButtonWithIcon>
        )}
      </div>

      {/* 댓글 작성 폼 */}
      {isWriting && user && (
        <div className="guide-content-container">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleCreateComment();
          }}>
            <div className="space-y-3">
            <div className="mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">작성자: {user.name} ({user.email})</span>
            </div>
            <Textarea
              placeholder="댓글을 입력하세요"
              value={newComment.content}
              onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
              className="text-gray-800 dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 focus:placeholder:text-transparent focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <ButtonWithColorIcon
                icon={<X className="h-4 w-4" />}
                color="tertiary"
                mode="outline"
                onClick={() => {
                  setIsWriting(false);
                  setNewComment({ content: '', writer: '', email: '' });
                }}
              >
                취소
              </ButtonWithColorIcon>
              <ButtonWithColorIcon
                icon={<Save className="h-4 w-4" />}
                color="secondary"
                mode="outline"
                type="submit"
                disabled={loading}
              >
                {loading ? '작성 중...' : '저장'}
              </ButtonWithColorIcon>
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
            <div key={comment.id} className="guide-content-container">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{comment.writer}</span>
                  <span className="text-sm text-gray-500">
                    {formatDate(comment.created_at)}
                    {comment.updated_at !== comment.created_at && ' (수정됨)'}
                  </span>
                </div>
                <div className="flex gap-1">
                  {user && user.email === comment.email && editingCommentId !== comment.id && (
                    <>
                      <ButtonWithIcon
                        icon={<Edit className="h-3 w-3" />}
                        onClick={() => handleEditClick(comment)}
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                      >
                        수정
                      </ButtonWithIcon>
                      <ButtonWithIcon
                        icon={<Trash2 className="h-3 w-3" />}
                        onClick={() => handleDeleteClick(comment)}
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs text-red-600 hover:text-red-800"
                      >
                        삭제
                      </ButtonWithIcon>
                    </>
                  )}
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
                    <ButtonWithColorIcon
                      icon={<X className="h-4 w-4" />}
                      color="tertiary"
                      mode="outline"
                      onClick={() => setEditingCommentId(null)}
                    >
                      취소
                    </ButtonWithColorIcon>
                    <ButtonWithColorIcon
                      icon={<Save className="h-4 w-4" />}
                      color="secondary"
                      mode="outline"
                      onClick={() => handleUpdateComment(comment.id, editContent)}
                    >
                      저장
                    </ButtonWithColorIcon>
                  </div>
                </div>
              ) : (
                <div className="guide-content">
                  <p className="whitespace-pre-wrap">{comment.content}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>


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