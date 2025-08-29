import { boardApiClient } from '@/lib/api/backendClient';

export const boardResolvers = {
  Query: {
    posts: async (_: any, { board }: { board: string }) => {
      try {
        console.log(`게시판 목록 조회 요청: ${board}`);
        // API 호출
        const response = await boardApiClient.get<any>(`/posts/${board}/`);
        return response.data.posts;
      } catch (error) {
        console.error('게시판 목록 조회 오류:', error);
        return [];
      }
    },
    post: async (_: any, { id, board }: { id: number, board: string }) => {
      try {
        console.log(`게시글 상세 조회 요청: ${board}, ${id}`);
        // API 호출
        const response = await boardApiClient.get<any>(`/posts/${board}/${id}`);
        return response.data;
      } catch (error) {
        console.error('게시글 상세 조회 오류:', error);
        return null;
      }
    },
  },
  Mutation: {
    createPost: async (_: any, { board, input }: { board: string, input: any }) => {
      try {
        console.log(`게시글 생성 요청: ${board}`, input);
        // API 호출
        const response = await boardApiClient.post<any>(`/posts/${board}`, {
          title: input.title,
          content: input.content,
          format: input.format || 'text',
          writer: input.writer,
          password: input.password,
        });
        
        console.log('게시글 생성 응답:', response.data);
        
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
            is_visible: 1
          };
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
          format: input.format,
          writer: input.writer,
          password: input.password,
        });
        console.log('게시글 수정 응답:', response.data);
        
        // API 응답이 { success: true } 형태인 경우
        if (response.data && response.data.success === true) {
          // 수정된 게시글 정보 조회
          return input;
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
  },
};
