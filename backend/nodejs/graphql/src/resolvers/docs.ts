import axios from 'axios';

// Docs API 클라이언트 설정
const DOCS_API_BASE_URL = process.env.DOCS_API_BASE_URL || 'http://localhost:11308';

const docsApiClient = axios.create({
  baseURL: DOCS_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface DocsManualInput {
  id?: number;
  email?: string;
  title: string;
  content: string;
  markdown_source?: string;
  format: string;
  category: string;
  file_path?: string;
  writer: string;
  is_visible?: boolean;
  is_notice?: boolean;
  is_private?: boolean;
}

export interface DocsManualDeleteInput {
  id: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  success?: boolean;
  message?: string;
}

export interface ErrorWithResponse {
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

export const docsResolvers = {
  Query: {
    docsManualAll: async (
      _parent: unknown,
      args: { category?: string; limit?: number; offset?: number }
    ) => {
      try {
        console.log('📚 docsManualAll 요청:', args);

        const params = new URLSearchParams();
        if (args.category) params.append('category', args.category);
        if (args.limit !== undefined) params.append('limit', args.limit.toString());
        if (args.offset !== undefined) params.append('offset', args.offset.toString());

        const url = `/docs/manual?${params.toString()}`;
        console.log('📚 요청 URL:', url);

        const response = await docsApiClient.get(url);
        console.log('📚 API 응답:', response.data);

        return {
          manuals: response.data.manuals || [],
          total_count: response.data.total_count || 0,
          page: response.data.page || 1,
          limit: response.data.limit || 100,
        };
      } catch (error) {
        const err = error as ErrorWithResponse;
        console.error('📚 docsManualAll 오류:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url,
        });
        throw new Error(`매뉴얼 목록 조회 실패: ${err.message}`);
      }
    },

    docsManualOne: async (_parent: unknown, args: { id: number }) => {
      try {
        console.log('📚 docsManualOne 요청:', args);

        const response = await docsApiClient.get(`/docs/manual/${args.id}`);
        console.log('📚 단일 매뉴얼 응답:', response.data);

        return response.data;
      } catch (error) {
        const err = error as ErrorWithResponse;
        console.error('📚 docsManualOne 오류:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });

        if (err.response?.status === 404) {
          throw new Error('매뉴얼을 찾을 수 없습니다');
        }
        throw new Error(`매뉴얼 조회 실패: ${err.message}`);
      }
    },

    docsManualSearch: async (
      _parent: unknown,
      args: { query: string; category?: string; limit?: number; offset?: number }
    ) => {
      try {
        console.log('📚 docsManualSearch 요청:', args);

        const params = new URLSearchParams();
        params.append('q', args.query);
        if (args.category) params.append('category', args.category);
        if (args.limit !== undefined) params.append('limit', args.limit.toString());
        if (args.offset !== undefined) params.append('offset', args.offset.toString());

        const url = `/docs/search?${params.toString()}`;
        console.log('📚 검색 URL:', url);

        const response = await docsApiClient.get(url);
        console.log('📚 검색 응답:', response.data);

        return {
          manuals: response.data.manuals || [],
          total_count: response.data.total_count || 0,
          page: response.data.page || 1,
          limit: response.data.limit || 100,
          query: response.data.query || args.query,
        };
      } catch (error) {
        const err = error as ErrorWithResponse;
        console.error('📚 docsManualSearch 오류:', err.message);
        throw new Error(`매뉴얼 검색 실패: ${err.message}`);
      }
    },

    docsCategories: async () => {
      try {
        console.log('📚 docsCategories 요청');

        const response = await docsApiClient.get('/docs/categories');
        console.log('📚 카테고리 응답:', response.data);

        return {
          categories: response.data.categories || [],
        };
      } catch (error) {
        const err = error as ErrorWithResponse;
        console.error('📚 docsCategories 오류:', err.message);
        // 기본 카테고리 반환
        return {
          categories: ['사용자매뉴얼', '개발자매뉴얼', '운영매뉴얼', '운영가이드', '시스템가이드'],
        };
      }
    },
  },

  Mutation: {
    docsManualCreate: async (_parent: unknown, args: { input: DocsManualInput }) => {
      try {
        console.log('📚 docsManualCreate 요청:', args.input);

        const formData = new URLSearchParams();
        formData.append('title', args.input.title);
        formData.append('content', args.input.content);
        formData.append('category', args.input.category);
        formData.append('writer', args.input.writer);
        formData.append('format_type', args.input.format);

        if (args.input.email) formData.append('email', args.input.email);
        if (args.input.is_notice !== undefined) formData.append('is_notice', args.input.is_notice.toString());
        if (args.input.is_private !== undefined) formData.append('is_private', args.input.is_private.toString());

        const response = await docsApiClient.post('/docs/manual', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        console.log('📚 생성 응답:', response.data);

        // 생성된 매뉴얼 조회
        const newManual = await docsApiClient.get(`/docs/manual/${response.data.id}`);
        return newManual.data;
      } catch (error) {
        const err = error as ErrorWithResponse;
        console.error('📚 docsManualCreate 오류:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        throw new Error(`매뉴얼 생성 실패: ${err.message}`);
      }
    },

    docsManualUpdate: async (_parent: unknown, args: { input: DocsManualInput }) => {
      try {
        console.log('📚 docsManualUpdate 요청:', args.input);

        if (!args.input.id) {
          throw new Error('매뉴얼 ID가 필요합니다');
        }

        const updateData: Record<string, any> = {};
        if (args.input.title !== undefined) updateData.title = args.input.title;
        if (args.input.content !== undefined) updateData.content = args.input.content;
        if (args.input.category !== undefined) updateData.category = args.input.category;
        if (args.input.writer !== undefined) updateData.writer = args.input.writer;
        if (args.input.email !== undefined) updateData.email = args.input.email;
        if (args.input.format !== undefined) updateData.format_type = args.input.format;
        if (args.input.is_notice !== undefined) updateData.is_notice = args.input.is_notice;
        if (args.input.is_private !== undefined) updateData.is_private = args.input.is_private;

        const formData = new URLSearchParams();
        Object.entries(updateData).forEach(([key, value]) => {
          formData.append(key, value.toString());
        });

        const response = await docsApiClient.put(`/docs/manual/${args.input.id}`, formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        console.log('📚 수정 응답:', response.data);

        // 수정된 매뉴얼 조회
        const updatedManual = await docsApiClient.get(`/docs/manual/${args.input.id}`);
        return updatedManual.data;
      } catch (error) {
        const err = error as ErrorWithResponse;
        console.error('📚 docsManualUpdate 오류:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        throw new Error(`매뉴얼 수정 실패: ${err.message}`);
      }
    },

    docsManualDelete: async (_parent: unknown, args: { input: DocsManualDeleteInput }) => {
      try {
        console.log('📚 docsManualDelete 요청:', args.input);

        // 삭제 전 매뉴얼 정보 조회
        const manualToDelete = await docsApiClient.get(`/docs/manual/${args.input.id}`);

        // 소프트 삭제 실행
        const response = await docsApiClient.delete(`/docs/manual/${args.input.id}`);
        console.log('📚 삭제 응답:', response.data);

        return manualToDelete.data;
      } catch (error) {
        const err = error as ErrorWithResponse;
        console.error('📚 docsManualDelete 오류:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });

        if (err.response?.status === 404) {
          throw new Error('매뉴얼을 찾을 수 없습니다');
        }
        throw new Error(`매뉴얼 삭제 실패: ${err.message}`);
      }
    },
  },
};