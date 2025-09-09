import { boardApiClient } from '@/lib/api/backendClient';

// Temporary in-memory storage for markdown_source data
// TODO: This should be replaced with proper database storage
const markdownSourceStore = new Map<string, string>();

const getMarkdownStoreKey = (board: string, postId: number): string => {
  return `${board}:${postId}`;
};

interface PostInput {
  id?: number;
  title: string;
  content: string;
  markdown_source?: string;
  format?: string;
  writer: string;
  password: string;
  is_visible?: number | boolean;
}

interface CommentInput {
  id?: number;
  board: string;
  post_id: number;
  content: string;
  writer: string;
  password: string;
  is_visible?: boolean;
}

interface ApiResponse<T = unknown> {
  data: T;
  success?: boolean;
}

interface ErrorWithResponse {
  message?: string;
  response?: {
    data?: unknown;
    status?: number;
  };
  config?: {
    url?: string;
    method?: string;
    baseURL?: string;
  };
}

export const boardResolvers = {
  Query: {
    posts: async (_: unknown, { board }: { board: string }) => {
      try {
        console.log(`게시판 목록 조회 요청: ${board}`);
        // API 호출
        const response = await boardApiClient.get(`/posts/${board}/`);
        return response.data.posts;
      } catch (error) {
        console.error('게시판 목록 조회 오류:', error);
        return [];
      }
    },
    post: async (_: unknown, { id, board }: { id: number, board: string }) => {
      try {
        console.log(`게시글 상세 조회 요청: ${board}, ${id}`);
        // API 호출
        const response = await boardApiClient.get<ApiResponse>(`/posts/${board}/${id}`);
        const post = response.data;
        
        // In-memory store에서 markdown_source 확인
        if (post && !post.markdown_source) {
          const storeKey = getMarkdownStoreKey(board, id);
          const storedMarkdownSource = markdownSourceStore.get(storeKey);
          if (storedMarkdownSource) {
            console.log(`In-memory store에서 markdown_source 복원: ${storeKey}`);
            post.markdown_source = storedMarkdownSource;
          }
        }
        
        return post;
      } catch (error) {
        console.error('게시글 상세 조회 오류:', error);
        return null;
      }
    },
    comments: async (_: unknown, { board, post_id, page = 1, per_page = 50 }: { board: string, post_id: number, page?: number, per_page?: number }) => {
      try {
        console.log(`댓글 목록 조회 요청: ${board}, ${post_id}, page=${page}, per_page=${per_page}`);
        // API 호출
        const response = await boardApiClient.get<ApiResponse>(`/comments/${board}/${post_id}?page=${page}&per_page=${per_page}`);
        return response.data;
      } catch (error: any) {
        console.error('댓글 목록 조회 상세 오류:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          config: {
            url: error?.config?.url,
            method: error?.config?.method,
            baseURL: error?.config?.baseURL
          }
        });
        
        // 댓글 API가 구현되지 않았더라도 빈 결과 반환
        return {
          total_count: 0,
          page: page,
          per_page: per_page,
          comments: []
        };
      }
    },
    comment: async (_: unknown, { id }: { id: number }) => {
      try {
        console.log(`댓글 상세 조회 요청: ${id}`);
        // API 호출
        const response = await boardApiClient.get<ApiResponse>(`/comments/${id}`);
        return response.data;
      } catch (error) {
        console.error('댓글 상세 조회 오류:', error);
        return null;
      }
    },
  },
  Mutation: {
    createPost: async (_: unknown, { board, input }: { board: string, input: PostInput }) => {
      try {
        console.log(`게시글 생성 요청: ${board}`, input);
        // API 호출
        const response = await boardApiClient.post(`/posts/${board}`, {
          title: input.title,
          content: input.content,
          markdown_source: input.markdown_source || null,
          format: input.format || 'text',
          writer: input.writer,
          password: input.password,
        });
        
        console.log('게시글 생성 응답:', response.data);
        
        if (response.data && response.data.id) {
          // 생성된 게시글 ID로 다시 조회해서 정확한 데이터 반환
          const createdPostId = response.data.id;
          
          try {
            const getResponse = await boardApiClient.get(`/posts/${board}/${createdPostId}`);
            console.log('생성된 게시글 조회 응답:', getResponse.data);
            
            // Backend API가 markdown_source를 지원하지 않는 경우를 대비해서 
            // 입력으로 받은 markdown_source를 보존
            const savedPost = getResponse.data;
            if (!savedPost.markdown_source && input.markdown_source) {
              console.log('Backend API가 markdown_source를 지원하지 않아 클라이언트 데이터로 보완');
              // In-memory store에 markdown_source 저장
              const storeKey = getMarkdownStoreKey(board, createdPostId);
              markdownSourceStore.set(storeKey, input.markdown_source);
              savedPost.markdown_source = input.markdown_source;
            }
            
            return savedPost;
          } catch (error) {
            console.error('생성된 게시글 조회 오류:', error);
            // 조회 실패시 입력 데이터로 대체하되 ID는 설정
            return {
              ...input,
              id: createdPostId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_visible: 1
            };
          }
        } else {
          throw new Error('서버 응답이 올바르지 않습니다.');
        }
      } catch (error) {
        console.error('게시글 생성 오류:', error);
        if (error instanceof Error) {
          throw new Error(`게시글 생성에 실패했습니다: ${error.message}`);
        } else {
          throw new Error('게시글 생성에 실패했습니다.');
        }
      }
    },
    updatePost: async (_: any, { board, input }: { board: string, input: any }) => {
      try {
        console.log(`게시글 수정 요청: ${board}, ${input.id}`, input);
        // API 호출
        const response = await boardApiClient.put<any>(`/posts/${board}/${input.id}`, {
          title: input.title,
          content: input.content,
          markdown_source: input.markdown_source,
          format: input.format,
          writer: input.writer,
          password: input.password,
        });
        console.log('게시글 수정 응답:', response.data);
        
        // API 응답이 { success: true } 형태인 경우
        if (response.data && response.data.success === true) {
          // markdown_source가 있으면 in-memory store에 저장
          if (input.markdown_source) {
            const storeKey = getMarkdownStoreKey(board, input.id);
            markdownSourceStore.set(storeKey, input.markdown_source);
            console.log(`In-memory store에 markdown_source 저장: ${storeKey}`);
          }
          
          // 수정된 게시글 정보 조회
          return input;
        } else {
          throw new Error('게시글 수정 응답이 올바르지 않습니다.');
        }
      } catch (error) {
        console.error('게시글 수정 오류:', error);
        throw new Error('게시글 수정에 실패했습니다.');
      }
    },
    deletePost: async (_: any, { board, input }: { board: string, input: any }) => {
      try {
        console.log(`게시글 삭제 요청: ${board}, ${input.id}`);
        // API 호출 (is_visible을 0으로 변경)
        const response = await boardApiClient.put<any>(`/posts/${board}/${input.id}`, {
          password: input.password,
          is_visible: 0,
        });
        // API 응답이 { success: true } 형태인 경우
        if (response.data && response.data.success === true) {
          // 수정된 게시글 정보 조회
          return input;
        }
      } catch (error) {
        console.error('게시글 삭제 오류:', error);
        throw new Error('게시글 삭제에 실패했습니다.');
      }
    },
    createComment: async (_: any, { input }: { input: any }) => {
      try {
        console.log('댓글 생성 요청:', input);
        // API 호출
        const response = await boardApiClient.post<any>('/comments', {
          board: input.board,
          post_id: input.post_id,
          content: input.content,
          writer: input.writer,
          password: input.password,
          is_visible: input.is_visible !== false
        });
        
        console.log('댓글 생성 응답:', response.data);
        
        if (response.data) {
          // 응답 데이터 구조에 따라 처리
          if (response.data.id) {
            input.id = response.data.id;
          } else if (response.data.success === true) {
            // success가 true이면 임시 ID 생성
            input.id = Date.now();
          }
          
          return {
            ...input,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_visible: true
          };
        } else {
          throw new Error('서버 응답이 올바르지 않습니다.');
        }
      } catch (error: any) {
        console.error('댓글 생성 상세 오류:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          config: {
            url: error?.config?.url,
            method: error?.config?.method,
            baseURL: error?.config?.baseURL
          }
        });
        
        if (error?.response?.status === 404) {
          throw new Error('댓글 API 엔드포인트를 찾을 수 없습니다.');
        }
        
        if (error instanceof Error) {
          throw new Error(`댓글 생성에 실패했습니다: ${error.message}`);
        } else {
          throw new Error('댓글 생성에 실패했습니다.');
        }
      }
    },
    updateComment: async (_: any, { input }: { input: any }) => {
      try {
        console.log(`댓글 수정 요청: ${input.id}`, input);
        
        // 먼저 기존 댓글 정보 조회
        const getResponse = await boardApiClient.get<any>(`/comments/${input.id}`);
        console.log('댓글 조회 응답:', getResponse.data);
        
        if (!getResponse.data) {
          throw new Error('댓글을 찾을 수 없습니다.');
        }
        
        const existingComment = getResponse.data;
        
        // API 호출
        const response = await boardApiClient.put<any>(`/comments/${input.id}`, {
          content: input.content,
          password: input.password,
          is_visible: input.is_visible
        });
        console.log('댓글 수정 응답:', response.data);
        
        // API 응답이 { success: true } 형태인 경우
        if (response.data && response.data.success === true) {
          // 수정된 댓글 정보 반환 - 기존 댓글 정보 + 수정된 내용
          return {
            id: existingComment.id,
            board: existingComment.board,
            post_id: existingComment.post_id,
            content: input.content || existingComment.content,
            writer: existingComment.writer,
            created_at: existingComment.created_at,
            updated_at: new Date().toISOString(),
            is_visible: input.is_visible !== undefined ? input.is_visible : existingComment.is_visible
          };
        } else {
          throw new Error('댓글 수정 응답이 올바르지 않습니다.');
        }
      } catch (error: any) {
        console.error('댓글 수정 상세 오류:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          config: {
            url: error?.config?.url,
            method: error?.config?.method,
            baseURL: error?.config?.baseURL
          }
        });
        
        if (error?.response?.status === 401) {
          throw new Error('비밀번호가 일치하지 않습니다.');
        }
        
        if (error instanceof Error) {
          throw new Error(`댓글 수정에 실패했습니다: ${error.message}`);
        } else {
          throw new Error('댓글 수정에 실패했습니다.');
        }
      }
    },
    deleteComment: async (_: any, { input }: { input: any }) => {
      try {
        console.log(`댓글 삭제 요청: ${input.id}`);
        
        // 먼저 기존 댓글 정보 조회
        const getResponse = await boardApiClient.get<any>(`/comments/${input.id}`);
        console.log('삭제할 댓글 조회 응답:', getResponse.data);
        
        if (!getResponse.data) {
          throw new Error('댓글을 찾을 수 없습니다.');
        }
        
        const existingComment = getResponse.data;
        
        // API 호출
        const response = await boardApiClient.delete<any>(`/comments/${input.id}`, {
          data: { password: input.password }
        });
        
        console.log('댓글 삭제 응답:', response.data);
        
        // API 응답이 { success: true } 형태인 경우
        if (response.data && response.data.success === true) {
          return {
            id: existingComment.id,
            board: existingComment.board,
            post_id: existingComment.post_id,
            content: existingComment.content,
            writer: existingComment.writer,
            created_at: existingComment.created_at,
            updated_at: new Date().toISOString(),
            is_visible: false
          };
        } else {
          throw new Error('댓글 삭제 응답이 올바르지 않습니다.');
        }
      } catch (error: any) {
        console.error('댓글 삭제 상세 오류:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          config: {
            url: error?.config?.url,
            method: error?.config?.method,
            baseURL: error?.config?.baseURL
          }
        });
        
        if (error?.response?.status === 401) {
          throw new Error('비밀번호가 일치하지 않습니다.');
        }
        
        if (error instanceof Error) {
          throw new Error(`댓글 삭제에 실패했습니다: ${error.message}`);
        } else {
          throw new Error('댓글 삭제에 실패했습니다.');
        }
      }
    },
  },
};
