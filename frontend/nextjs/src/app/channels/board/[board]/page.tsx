'use client';

import { useState, useEffect, useRef } from 'react';
import { use } from 'react';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Tabs, 
  TabsContent,
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Input 
} from '@/components/ui/input';
import { 
  Textarea 
} from '@/components/ui/textarea';
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
  Plus, 
  Search, 
  ArrowLeft, 
  ArrowRight,
  Code,
  Eye,
  FileText,
  Hash
} from 'lucide-react';

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
const GET_POSTS = `
  query GetPosts($board: String!) {
    boardsPostsAll(board: $board) {
      id
      title
      writer
      created_at
      updated_at
      is_visible
    }
  }
`;

const GET_POST = `
  query GetPost($id: Int!, $board: String!) {
    boardsPostsOne(id: $id, board: $board) {
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

const CREATE_POST = `
  mutation CreatePost($board: String!, $input: CreatePostInput!) {
    createPost(board: $board, input: $input) {
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

export default function BoardPage({ params }: { params: Promise<any> }) {
  const { board } = use(params);
  const { navigate } = useUnifiedNavigation();
  const { startLoading, finishLoading, setCustomMessage } = useUnifiedLoading();
  const [activeTab, setActiveTab] = useState('list');
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  
  // 통합 로딩 관리
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [actionType, setActionType] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState<any>({
    title: '',
    content: '',
    markdown_source: null,
    format: 'text',
    writer: '',
    password: '',
  });
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [editorMode, setEditorMode] = useState<'html' | 'markdown'>('html'); // 에디터 모드 추가
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // board 값을 board_${board} 형식으로 변환
  const channelBoard = `board_${board}`;

  // 페이지 마운트시 초기화 - 로딩은 데이터 로딩 완료시 해제

  // 게시글 목록 조회
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setCustomMessage('게시글 목록을 불러오는 중입니다...');
        setError(null);
        
        const graphqlUrl = process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://1.231.118.217:11401/graphql';
        console.log('GraphQL URL:', graphqlUrl);
        console.log('Sending board variable:', channelBoard);
        
        const response = await fetch(graphqlUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: GET_POSTS,
            variables: {
              board: channelBoard,
            },
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('GraphQL Response:', result);
        
        if (result.errors) {
          console.error('GraphQL 에러:', result.errors);
          throw new Error(result.errors[0].message);
        }
        
        if (!result.data || !result.data.posts) {
          console.error('응답 구조가 올바르지 않습니다:', result);
          throw new Error('응답 구조가 올바르지 않습니다.');
        }
        
        console.log('게시글 목록 조회 성공:', result.data.posts);
        setPosts(result.data.posts);
        
        // 게시글 목록 로딩 완료
        finishLoading();
      } catch (err) {
        console.error('게시글 목록 조회 오류:', err);
        setError('게시글 목록을 불러오는데 실패했습니다.');
        finishLoading();
      }
    };
    
    fetchPosts();
  }, [channelBoard, finishLoading, setCustomMessage]);

  // 게시글 선택
  const handlePostSelect = async (post: any) => {
    try {
      setCustomMessage('게시글을 불러오는 중입니다...');
      startLoading();
      setError(null);
      
      console.log('게시글 선택:', post.id);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_POST,
          variables: {
            id: post.id,
            board: channelBoard,
          },
        }),
      });
      
      const result = await response.json();
      
      if (result.errors) {
        console.error('GraphQL 에러:', result.errors);
        throw new Error(result.errors[0].message);
      }
      
      // 전체 응답 로깅
      console.log('API 응답:', JSON.stringify(result, null, 2));
      
      // 데이터가 있는지 확인하고 password 값이 존재하는지 확인
      if (result.data && result.data.post) {
        const postData = result.data.post;
        console.log('게시글 상세 정보:', {
          id: postData.id,
          title: postData.title,
          password: typeof postData.password === 'string' ? '비밀번호 있음' : '비밀번호 없음',
          passwordType: typeof postData.password
        });
        
        // 비밀번호가 null이면 빈 문자열로 설정
        if (postData.password === null || postData.password === undefined) {
          postData.password = '';
        }
        
        setSelectedPost(postData);
        setActiveTab('detail');
        finishLoading();
      } else {
        throw new Error('게시글 정보를 가져올 수 없습니다.');
      }
    } catch (err) {
      console.error('게시글 상세 조회 오류:', err);
      setError('게시글을 불러오는데 실패했습니다.');
      finishLoading();
    }
  };

  // 수정 모드 토글
  const handleEditToggle = () => {
    if (!selectedPost) return;
    
    // 수정 전 선택된 게시글 정보 확인
    console.log('수정 시도: 게시글 정보', {
      id: selectedPost.id,
      password: selectedPost.password ? '존재함' : '없음',
      passwordType: typeof selectedPost.password
    });
    
    setActionType('edit');
    setPasswordError(''); // 비밀번호 오류 메시지 초기화
    setPasswordInput(''); // 비밀번호 입력 초기화
    setIsPasswordDialogOpen(true);
  };

  // 비밀번호 확인
  const handlePasswordCheck = () => {
    if (!selectedPost) {
      console.error('선택된 게시글이 없습니다.');
      return;
    }
    
    // 비밀번호 정보 로깅 (실제 운영 환경에서는 제거 필요)
    const passwordExists = selectedPost.password !== undefined && selectedPost.password !== null;
    console.log('비밀번호 확인 시도:', {
      입력비밀번호: passwordInput ? '입력됨' : '입력안됨',
      원본비밀번호: passwordExists ? '존재함' : '없음', 
      입력비밀번호길이: passwordInput.length,
      원본비밀번호길이: passwordExists ? String(selectedPost.password).length : 0,
      원본비밀번호타입: typeof selectedPost.password
    });
    
    // 문자열로 변환 및 공백 제거 후 비교
    const inputPwd = String(passwordInput || '').trim();
    const originalPwd = String(selectedPost.password || '').trim();
    
    // 직접 비교 수행
    const isMatch = inputPwd === originalPwd;
    console.log(`비밀번호 일치여부: ${isMatch}`);
    
    if (isMatch) {
      setIsPasswordDialogOpen(false);
      setPasswordInput('');
      setPasswordError('');
      
      if (actionType === 'edit') {
        setIsEditMode(true);
        setIsSourceMode(true);
        console.log('수정 모드로 전환 성공');
      } else if (actionType === 'delete') {
        setIsDeleteDialogOpen(true);
        console.log('삭제 확인 다이얼로그 오픈');
      }
    } else {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      console.error('비밀번호 불일치', { 
        입력길이: inputPwd.length, 
        원본길이: originalPwd.length
      });
    }
  };

  // Enter 키로 비밀번호 확인을 처리하는 함수
  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      console.log('Enter 키 감지: 비밀번호 확인 실행');
      handlePasswordCheck();
    }
  };

  // 삭제 클릭
  const handleDeleteClick = () => {
    if (!selectedPost) return;
    
    // 삭제 전 선택된 게시글 정보 확인
    console.log('삭제 시도: 게시글 정보', {
      id: selectedPost.id,
      password: selectedPost.password ? '존재함' : '없음',
      passwordType: typeof selectedPost.password
    });
    
    setActionType('delete');
    setPasswordError(''); // 비밀번호 오류 메시지 초기화
    setPasswordInput(''); // 비밀번호 입력 초기화
    setIsPasswordDialogOpen(true);
  };

  // 삭제 확인
  const handleDeleteConfirm = async () => {
    if (!selectedPost) return;
    
    try {
      setCustomMessage('게시글을 삭제하는 중입니다...');
      startLoading();
      setError(null);
      
      // 삭제를 위한 요청 데이터 로깅
      console.log('삭제 요청 데이터:', {
        boardName: channelBoard,
        postId: selectedPost.id,
        hasPassword: !!selectedPost.password
      });
      
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
              id: selectedPost.id,
              password: selectedPost.password || '',
            },
          },
        }),
      });
      
      const result = await response.json();
      
      if (result.errors) {
        console.error('삭제 오류:', result.errors);
        throw new Error(result.errors[0].message);
      }
      
      // 게시글 목록 새로고침
      const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_POSTS,
          variables: {
            board: channelBoard,
          },
        }),
      });
      
      const refreshResult = await refreshResponse.json();
      if (refreshResult.data?.posts) {
        setPosts(refreshResult.data.posts);
      }
      
      // 선택된 게시글 초기화
      setSelectedPost(null);
      
      // 삭제 다이얼로그 닫기
      setIsDeleteDialogOpen(false);
      
      // 목록 페이지로 이동
      setActiveTab('list');
      finishLoading();
      
    } catch (err) {
      console.error('게시글 삭제 오류:', err);
      setError('게시글 삭제에 실패했습니다.');
      finishLoading();
    }
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!selectedPost) return;
    
    try {
      setCustomMessage('게시글을 수정하는 중입니다...');
      startLoading();
      setError(null);
      
      // 서버로 전송할 데이터 구성
      const updateData = {
        id: parseInt(selectedPost.id.toString()),
        title: selectedPost.title.trim(),
        content: selectedPost.content,
        markdown_source: selectedPost.markdown_source || null,
        format: selectedPost.format || 'text',
        writer: selectedPost.writer.trim(),
        password: selectedPost.password
      };

      // 데이터 유효성 검사
      if (!updateData.id || !updateData.title || !updateData.writer || !updateData.password) {
        throw new Error('필수 입력값이 누락되었습니다.');
      }

      console.log('게시글 수정 요청:', channelBoard, updateData);
      
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
      
      if (!response.ok) {
        throw new Error('서버 응답이 실패했습니다.');
      }

      const result = await response.json();
      console.log('Update response:', result);
      
      if (result.errors) {
        console.error('Update errors:', result.errors);
        const errorMessage = result.errors[0]?.message || '게시글 수정에 실패했습니다.';
        throw new Error(errorMessage);
      }

      if (!result.data?.updatePost) {
        throw new Error('게시글 수정에 실패했습니다.');
      }

      const updatedPost = result.data.updatePost;
      
      finishLoading();
      
      // 수정 완료 후 해당 게시글 상세 페이지로 리다이렉트
      const redirectUrl = `/channels/board/${board}/${updatedPost.id}`;
      console.log('수정 완료, 리다이렉트 URL:', redirectUrl);
      
      // window.location.href를 사용한 강제 리다이렉트
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('게시글 수정 오류:', err);
      setError(err instanceof Error ? err.message : '게시글 수정에 실패했습니다.');
      finishLoading();
      return;
    }
  };

  // 게시글 생성
  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content || !newPost.writer || !newPost.password) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      setCustomMessage('게시글을 작성하는 중입니다...');
      startLoading();
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: CREATE_POST,
          variables: {
            board: channelBoard,
            input: newPost,
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

      // 게시글 목록 새로고침
      const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_POSTS,
          variables: {
            board: channelBoard,
          },
        }),
      });

      const refreshResult = await refreshResponse.json();
      if (refreshResult.data?.posts) {
        setPosts(refreshResult.data.posts);
      }

      // 입력 필드 초기화
      setNewPost({
        title: '',
        content: '',
        markdown_source: null,
        format: 'text',
        writer: '',
        password: '',
      });
      
      // 글쓰기 모달 닫기
      setIsCreateDialogOpen(false);
      
      // 목록 페이지로 이동
      setActiveTab('list');
      finishLoading();
      
    } catch (error) {
      console.error('게시글 작성 오류:', error);
      alert(error instanceof Error ? error.message : '게시글 작성에 실패했습니다.');
      finishLoading();
    }
  };

  // 채널 변경
  const handleChannelChange = (channelId: string) => {
    if (channelId !== board) {
      navigate(`/channels/board/${channelId}`);
    }
  };

  // 전역 드래그 앤 드롭 기본 동작 방지
  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const preventDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 전체 document에서 드래그 앤 드롭 기본 동작 방지
    document.addEventListener('dragover', preventDefault, false);
    document.addEventListener('dragenter', preventDefault, false);
    document.addEventListener('drop', preventDrop, false);

    return () => {
      document.removeEventListener('dragover', preventDefault, false);
      document.removeEventListener('dragenter', preventDefault, false);
      document.removeEventListener('drop', preventDrop, false);
    };
  }, []);

  // 검색 필터링
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.writer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 이미지 드래그 앤 드롭 이벤트 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 드래그 영역을 완전히 벗어날 때만 false로 설정
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    console.log('드롭 이벤트 발생:', e.dataTransfer.files.length, '개 파일');
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    console.log('이미지 파일 필터링 결과:', files.length, '개 이미지 파일');
    
    if (files.length === 0) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    
    try {
      setCustomMessage('이미지를 업로드하는 중입니다...');
      startLoading();
      console.log('이미지 업로드 시작:', files.map(f => f.name));
      
      // 모든 파일을 업로드하고 URL을 수집
      const uploadPromises = files.map(async (file, index) => {
        console.log(`파일 ${index + 1} 업로드 시작:`, file.name);
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        console.log(`파일 ${index + 1} 응답 상태:`, response.status);
        const result = await response.json();
        console.log(`파일 ${index + 1} 응답 결과:`, result);
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        return result.url;
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);
      
      // 업로드된 이미지 목록 업데이트
      setUploadedImages(prev => [...prev, ...uploadedUrls]);
      
      // 성공 메시지 표시
      console.log(`✅ ${uploadedUrls.length}개의 이미지가 성공적으로 업로드되었습니다.`);
      
      // 모든 이미지를 한 번에 텍스트에 삽입
      const imageTags = uploadedUrls.map(imageUrl => 
        editorMode === 'markdown' 
          ? `![업로드된 이미지](${imageUrl})`
          : `<img src="${imageUrl}" alt="업로드된 이미지" />`
      ).join('\n');
      
      const imageTagsWithNewlines = `\n${imageTags}\n`;
      
      if (isEditMode && selectedPost) {
        const cursorPos = contentRef.current?.selectionStart || selectedPost.content.length;
        const textBefore = selectedPost.content.substring(0, cursorPos);
        const textAfter = selectedPost.content.substring(cursorPos);
        
        setSelectedPost({
          ...selectedPost,
          content: textBefore + imageTagsWithNewlines + textAfter
        });
      } else if (activeTab === 'write' || isCreateDialogOpen) {
        // 글쓰기 모드일 때 처리
        const cursorPos = contentRef.current?.selectionStart || newPost.content.length;
        const textBefore = newPost.content.substring(0, cursorPos);
        const textAfter = newPost.content.substring(cursorPos);
        
        setNewPost({
          ...newPost,
          content: textBefore + imageTagsWithNewlines + textAfter,
          format: editorMode === 'markdown' ? 'markdown' : 'text'
        });
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.';
      alert(`❌ ${errorMessage}`);
      finishLoading();
    } finally {
      finishLoading();
    }
  };

  // 마크다운 에디터용 이미지 업로드 핸들러
  const handleMarkdownImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.url;
    } catch (error) {
      console.error('마크다운 이미지 업로드 오류:', error);
      throw error;
    }
  };

  // 비밀번호 다이얼로그 상태 관리 함수
  const handlePasswordDialogChange = (open: boolean) => {
    if (!open) {
      console.log('비밀번호 다이얼로그 닫기');
      setIsPasswordDialogOpen(false);
      // 다이얼로그가 닫힐 때 상태 초기화
      setPasswordInput('');
      setPasswordError('');
    } else if (open) {
      console.log('비밀번호 다이얼로그 열기');
      setIsPasswordDialogOpen(true);
    }
  };

  return (
    <div className="w-full">
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              {activeTab === 'list' && (
                <>
                  <div className="flex items-center space-x-4">
                    <Tabs defaultValue={board} onValueChange={handleChannelChange}>
                      <TabsList>
                        <TabsTrigger value="dev">개발</TabsTrigger>
                        <TabsTrigger value="op">운영</TabsTrigger>
                        <TabsTrigger value="manual">매뉴얼</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <div className="relative w-[300px]">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="제목 또는 작성자로 검색"
                        className={`pl-8 ${inputClass}`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={() => {
                    navigate(`/channels/board/${board}/new?format=markdown`);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    글쓰기
                  </Button>
                </>
              )}
            </div>

            <TabsContent value="list">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">번호</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead className="w-[100px]">작성자</TableHead>
                    <TableHead className="w-[100px]">작성일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {error ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredPosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        검색 결과가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPosts.map((post) => (
                      <TableRow 
                        key={post.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/channels/board/${board}/${post.id}`)}
                      >
                        <TableCell>{post.id}</TableCell>
                        <TableCell className="max-w-[400px] truncate">{post.title}</TableCell>
                        <TableCell>{post.writer}</TableCell>
                        <TableCell>{formatDate(post.created_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="detail">
              {selectedPost && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Button variant="outline" onClick={() => {
                      setActiveTab('list');
                      setSelectedPost(null);
                      setIsEditMode(false);
                    }}>
                      목록으로
                    </Button>
                    {!isEditMode && (
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

                  {(
                    <div className="border rounded-lg p-4">
                      <div className="border-b pb-4 mb-4">
                        <h2 className="text-2xl font-bold mb-2">
                          {isEditMode ? (
                            <Input
                              value={selectedPost.title}
                              onChange={(e) => setSelectedPost({ ...selectedPost, title: e.target.value })}
                              className={`text-2xl font-bold ${inputClass}`}
                            />
                          ) : (
                            selectedPost.title
                          )}
                        </h2>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <div className="flex space-x-4">
                            <span>작성자: {selectedPost.writer}</span>
                            <span>작성일: {formatDate(selectedPost.created_at)}</span>
                            {selectedPost.updated_at !== selectedPost.created_at && (
                              <span>수정일: {formatDate(selectedPost.updated_at)}</span>
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
                                <Tabs value={selectedPost.format === 'markdown' ? 'markdown' : 'html'} onValueChange={(value) => {
                                  const newFormat = value as 'html' | 'markdown';
                                  setEditorMode(newFormat);
                                  setSelectedPost({ ...selectedPost, format: newFormat === 'markdown' ? 'markdown' : 'text' });
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
                            
                            {selectedPost.format === 'markdown' ? (
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  마크다운 문법을 사용하여 편집하세요. 이미지를 드래그하여 업로드할 수 있습니다.
                                </p>
                                <MDEditor
                                  value={selectedPost.content}
                                  onChange={(value) => setSelectedPost({ 
                                    ...selectedPost, 
                                    content: value || '',
                                    format: 'markdown'
                                  })}
                                  data-color-mode="light"
                                  height={400}
                                  onDrop={async (event) => {
                                    const files = Array.from(event.dataTransfer.files).filter(file => 
                                      file.type.startsWith('image/')
                                    );
                                    
                                    for (const file of files) {
                                      try {
                                        const imageUrl = await handleMarkdownImageUpload(file);
                                        const imageMarkdown = `![${file.name}](${imageUrl})`;
                                        setSelectedPost({
                                          ...selectedPost,
                                          content: (selectedPost.content || '') + '\n' + imageMarkdown + '\n',
                                          format: 'markdown'
                                        });
                                      } catch (error) {
                                        console.error('이미지 업로드 실패:', error);
                                      }
                                    }
                                  }}
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
                                  <div 
                                    className={`relative transition-all duration-200 ${isDragging ? 'border-2 border-dashed border-primary bg-primary/10 rounded-md' : 'border border-transparent'}`}
                                    onDragEnter={handleDragEnter}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                  >
                                    <Textarea
                                      ref={contentRef}
                                      value={selectedPost.content}
                                      onChange={(e) => setSelectedPost({ ...selectedPost, content: e.target.value })}
                                      className={`min-h-[300px] font-mono ${textareaClass}`}
                                      placeholder="HTML 내용을 입력하세요. 이미지를 드래그하여 업로드할 수 있습니다."
                                    />
                                    {isDragging && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20 z-10 rounded-md">
                                        <div className="text-center">
                                          <p className="text-lg font-medium text-primary">📁 이미지를 여기에 놓으세요</p>
                                          <p className="text-sm text-muted-foreground">여러 이미지를 동시에 업로드할 수 있습니다</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="border rounded-md p-3 min-h-[300px]">
                                    <div dangerouslySetInnerHTML={{ 
                                      __html: selectedPost.content?.replace(/<img([^>]*)\ssrc=["']?\s*["']?([^>]*)>/gi, (match, attrs, rest) => {
                                        // Remove img tags with empty src attributes
                                        if (!attrs.includes('src=') || attrs.includes('src=""') || attrs.includes("src=''") || attrs.includes('src= ')) {
                                          return '';
                                        }
                                        return match;
                                      }) || ''
                                    }} />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {selectedPost.format === 'markdown' ? (
                              <div className="prose max-w-none">
                                <ReactMarkdown>{selectedPost.content || ''}</ReactMarkdown>
                              </div>
                            ) : (
                              <div dangerouslySetInnerHTML={{ 
                                __html: selectedPost.content?.replace(/<img([^>]*)\ssrc=["']?\s*["']?([^>]*)>/gi, (match, attrs, rest) => {
                                  // Remove img tags with empty src attributes
                                  if (!attrs.includes('src=') || attrs.includes('src=""') || attrs.includes("src=''") || attrs.includes('src= ')) {
                                    return '';
                                  }
                                  return match;
                                }) || ''
                              }} />
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
                  )}

                  {/* 댓글 섹션 - 수정 모드가 아닐 때만 표시 */}
                  {!isEditMode && (
                    <div className="border-t pt-6 mt-6">
                      <Comments 
                        board={channelBoard}
                        postId={selectedPost.id}
                        onCommentCountChange={(count) => {
                          // 댓글 수가 변경되면 필요에 따라 상태 업데이트
                          console.log('댓글 수 변경:', count);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="write">
              {(
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">새 게시글 작성</h2>
                    {/* 에디터 모드 선택 */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">에디터:</span>
                      <Tabs value={editorMode} onValueChange={(value) => setEditorMode(value as 'html' | 'markdown')}>
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

                  <div className="border rounded-lg p-4">
                    <div className="border-b pb-4 mb-4">
                      <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium mb-1">
                          제목
                        </label>
                        <Input
                          id="title"
                          value={newPost.title}
                          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                          placeholder="게시글 제목을 입력하세요"
                          className={`text-lg font-medium ${inputClass}`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="author" className="block text-sm font-medium mb-1">
                            작성자
                          </label>
                          <Input
                            id="author"
                            value={newPost.writer}
                            onChange={(e) => setNewPost({ ...newPost, writer: e.target.value })}
                            placeholder="작성자 이름을 입력하세요"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label htmlFor="password" className="block text-sm font-medium mb-1">
                            비밀번호
                          </label>
                          <Input
                            id="password"
                            type="password"
                            value={newPost.password}
                            onChange={(e) => setNewPost({ ...newPost, password: e.target.value })}
                            placeholder="비밀번호를 입력하세요"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="min-h-[300px] mb-4">
                      {editorMode === 'markdown' ? (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            마크다운 문법을 사용하여 작성하세요. 이미지를 드래그하여 업로드할 수 있습니다.
                          </p>
                          <MDEditor
                            value={newPost.content}
                            onChange={(value) => setNewPost({ 
                              ...newPost, 
                              content: value || '',
                              format: 'markdown'
                            })}
                            data-color-mode="light"
                            height={400}
                            onDrop={async (event) => {
                              const files = Array.from(event.dataTransfer.files).filter(file => 
                                file.type.startsWith('image/')
                              );
                              
                              for (const file of files) {
                                try {
                                  const imageUrl = await handleMarkdownImageUpload(file);
                                  const imageMarkdown = `![${file.name}](${imageUrl})`;
                                  setNewPost({
                                    ...newPost,
                                    content: (newPost.content || '') + '\n' + imageMarkdown + '\n',
                                    format: 'markdown'
                                  });
                                } catch (error) {
                                  console.error('이미지 업로드 실패:', error);
                                }
                              }
                            }}
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
                            <div 
                              className={`relative transition-all duration-200 ${isDragging ? 'border-2 border-dashed border-primary bg-primary/10 rounded-md' : 'border border-transparent'}`}
                              onDragEnter={handleDragEnter}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                            >
                              <Textarea
                                ref={contentRef}
                                value={newPost.content}
                                onChange={(e) => setNewPost({ ...newPost, content: e.target.value, format: 'text' })}
                                className={`min-h-[300px] font-mono ${textareaClass}`}
                                placeholder="HTML 내용을 입력하세요. 이미지를 드래그하여 업로드할 수 있습니다."
                              />
                              {isDragging && (
                                <div className="absolute inset-0 flex items-center justify-center bg-primary/20 z-10 rounded-md">
                                  <div className="text-center">
                                    <p className="text-lg font-medium text-primary">📁 이미지를 여기에 놓으세요</p>
                                    <p className="text-sm text-muted-foreground">여러 이미지를 동시에 업로드할 수 있습니다</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="border rounded-md p-4 min-h-[300px]">
                              {newPost.content ? (
                                <div dangerouslySetInnerHTML={{ 
                                  __html: newPost.content.replace(/<img([^>]*)\ssrc=["']?\s*["']?([^>]*)>/gi, (match, attrs, rest) => {
                                    // Remove img tags with empty src attributes
                                    if (!attrs.includes('src=') || attrs.includes('src=""') || attrs.includes("src=''") || attrs.includes('src= ')) {
                                      return '';
                                    }
                                    return match;
                                  })
                                }} />
                              ) : (
                                <p className="text-muted-foreground">내용을 입력하세요</p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('list')}
                      >
                        취소
                      </Button>
                      <Button onClick={handleCreatePost}>
                        저장
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 비밀번호 확인 다이얼로그 */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={handlePasswordDialogChange}>
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
                onKeyDown={handlePasswordKeyDown}
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
                  onClick={() => handlePasswordDialogChange(false)}>
                  취소
                </Button>
                <Button 
                  type="submit">
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

      {/* 새 게시글 작성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>새 게시글 작성</DialogTitle>
          </DialogHeader>
          {(
            <>
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-1">제목</label>
                  <Input
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="제목을 입력하세요"
                    className={inputClass}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">작성자</label>
                  <Input
                    value={newPost.writer}
                    onChange={(e) => setNewPost({ ...newPost, writer: e.target.value })}
                    placeholder="작성자를 입력하세요"
                    className={inputClass}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">비밀번호</label>
                  <Input
                    type="password"
                    value={newPost.password}
                    onChange={(e) => setNewPost({ ...newPost, password: e.target.value })}
                    placeholder="비밀번호를 입력하세요"
                    className={inputClass}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium">내용</label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsSourceMode(!isSourceMode)}
                    >
                      {isSourceMode ? <Eye className="h-4 w-4" /> : <Code className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {isSourceMode ? (
                    <div 
                      className={`relative transition-all duration-200 ${isDragging ? 'border-2 border-dashed border-primary bg-primary/10 rounded-md' : 'border border-transparent'}`}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Textarea
                        ref={contentRef}
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                        className={`min-h-[300px] font-mono ${textareaClass}`}
                        placeholder="내용을 입력하세요"
                      />
                      {isDragging && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20 z-10 rounded-md">
                          <div className="text-center">
                            <p className="text-lg font-medium text-primary">📁 이미지를 여기에 놓으세요</p>
                            <p className="text-sm text-muted-foreground">여러 이미지를 동시에 업로드할 수 있습니다</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-md p-4 min-h-[300px]">
                      {newPost.content ? (
                        <div dangerouslySetInnerHTML={{ 
                          __html: newPost.content.replace(/<img([^>]*)\ssrc=["']?\s*["']?([^>]*)>/gi, (match, attrs, rest) => {
                            // Remove img tags with empty src attributes
                            if (!attrs.includes('src=') || attrs.includes('src=""') || attrs.includes("src=''") || attrs.includes('src= ')) {
                              return '';
                            }
                            return match;
                          })
                        }} />
                      ) : (
                        <p className="text-muted-foreground">내용을 입력하세요</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleCreatePost}>
                  작성
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 