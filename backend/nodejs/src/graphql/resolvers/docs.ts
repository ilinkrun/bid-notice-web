import { executeQuery } from '@/utils/mysql';

// 간단한 메모리 캐시 구현 (mappings.ts와 동일한 패턴)
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem>();
  private defaultTTL = 5 * 60 * 1000; // 5분

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  clearByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new SimpleCache();

// 데이터베이스 결과를 GraphQL 형식으로 변환
const formatDocsManual = (row: any) => ({
  id: row.id,
  email: row.email || null,
  title: row.title,
  content: row.content,
  markdown_source: row.markdown_source || null,
  format: row.format || 'markdown',
  category: row.category,
  file_path: row.file_path || null,
  writer: row.writer,
  created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
  updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  is_visible: Boolean(row.is_visible),
  is_notice: Boolean(row.is_notice),
  is_private: Boolean(row.is_private),
  scope: row.scope || null,
  parent_scope_id: row.parent_scope_id || null,
  scope_hierarchy: row.scope_hierarchy || null,
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
  scope?: string;
  parent_scope_id?: number;
  scope_hierarchy?: string;
}

export interface DocsManualDeleteInput {
  id: number;
}

export const docsResolvers = {
  Query: {
    docsManualAll: async (
      _parent: unknown,
      args: { category?: string; limit?: number; offset?: number }
    ) => {
      const cacheKey = `docs_manual_all_${args.category || 'all'}_${args.limit || 100}_${args.offset || 0}`;
      let result = cache.get(cacheKey);
      
      if (!result) {
        try {
          console.log('📚 docsManualAll 요청:', args);

          let query = 'SELECT * FROM docs_manual WHERE is_visible = 1';
          const queryParams: any[] = [];

          if (args.category) {
            query += ' AND category = ?';
            queryParams.push(args.category);
          }

          // 총 개수 조회
          const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
          const countResult = await executeQuery(countQuery, queryParams) as any[];
          const totalCount = countResult[0]?.total || 0;

          // 정렬 및 페이징 추가
          query += ' ORDER BY created_at DESC';
          
          if (args.limit !== undefined) {
            query += ' LIMIT ?';
            queryParams.push(args.limit);
          }
          
          if (args.offset !== undefined) {
            query += ' OFFSET ?';
            queryParams.push(args.offset);
          }

          console.log('📚 실행 쿼리:', query, queryParams);

          const rows = await executeQuery(query, queryParams) as any[];
          const manuals = rows.map(formatDocsManual);

          result = {
            manuals,
            total_count: totalCount,
            page: Math.floor((args.offset || 0) / (args.limit || 100)) + 1,
            limit: args.limit || 100,
          };

          cache.set(cacheKey, result);
          console.log('📚 조회 결과:', { count: manuals.length, total: totalCount });
        } catch (error) {
          console.error('📚 docsManualAll 오류:', error);
          throw new Error(`매뉴얼 목록 조회 실패: ${error}`);
        }
      }
      
      return result;
    },

    docsManualOne: async (_parent: unknown, args: { id: number }) => {
      try {
        console.log('📚 docsManualOne 요청:', args);

        const rows = await executeQuery(
          'SELECT * FROM docs_manual WHERE id = ?',
          [args.id]
        ) as any[];

        if (rows.length === 0) {
          throw new Error('매뉴얼을 찾을 수 없습니다');
        }

        const manual = formatDocsManual(rows[0]);
        console.log('📚 단일 매뉴얼 조회 완료:', manual.id);
        
        return manual;
      } catch (error) {
        console.error('📚 docsManualOne 오류:', error);
        throw new Error(`매뉴얼 조회 실패: ${error}`);
      }
    },

    docsManualSearch: async (
      _parent: unknown,
      args: { query: string; category?: string; limit?: number; offset?: number }
    ) => {
      const cacheKey = `docs_manual_search_${args.query}_${args.category || 'all'}_${args.limit || 100}_${args.offset || 0}`;
      let result = cache.get(cacheKey);
      
      if (!result) {
        try {
          console.log('📚 docsManualSearch 요청:', args);

          let query = 'SELECT * FROM docs_manual WHERE is_visible = 1 AND (title LIKE ? OR content LIKE ?)';
          const queryParams: any[] = [`%${args.query}%`, `%${args.query}%`];

          if (args.category) {
            query += ' AND category = ?';
            queryParams.push(args.category);
          }

          // 총 개수 조회
          const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
          const countResult = await executeQuery(countQuery, queryParams) as any[];
          const totalCount = countResult[0]?.total || 0;

          // 정렬 및 페이징 추가
          query += ' ORDER BY created_at DESC';
          
          if (args.limit !== undefined) {
            query += ' LIMIT ?';
            queryParams.push(args.limit);
          }
          
          if (args.offset !== undefined) {
            query += ' OFFSET ?';
            queryParams.push(args.offset);
          }

          console.log('📚 검색 쿼리:', query, queryParams);

          const rows = await executeQuery(query, queryParams) as any[];
          const manuals = rows.map(formatDocsManual);

          result = {
            manuals,
            total_count: totalCount,
            page: Math.floor((args.offset || 0) / (args.limit || 100)) + 1,
            limit: args.limit || 100,
            query: args.query,
          };

          cache.set(cacheKey, result);
          console.log('📚 검색 결과:', { count: manuals.length, total: totalCount });
        } catch (error) {
          console.error('📚 docsManualSearch 오류:', error);
          throw new Error(`매뉴얼 검색 실패: ${error}`);
        }
      }
      
      return result;
    },

    docsManualSearchByScope: async (
      _parent: unknown,
      args: { scope: string; scope_hierarchy: string; limit?: number; offset?: number }
    ) => {
      const cacheKey = `docs_manual_search_scope_${args.scope}_${args.scope_hierarchy}_${args.limit || 100}_${args.offset || 0}`;
      let result = cache.get(cacheKey);

      if (!result) {
        try {
          console.log('📚 docsManualSearchByScope 요청:', args);

          let query = 'SELECT * FROM docs_manual WHERE is_visible = 1 AND scope = ? AND scope_hierarchy = ?';
          const queryParams: any[] = [args.scope, args.scope_hierarchy];

          // 총 개수 조회
          const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
          const countResult = await executeQuery(countQuery, queryParams) as any[];
          const totalCount = countResult[0]?.total || 0;

          // 정렬 및 페이징 추가
          query += ' ORDER BY created_at DESC';

          if (args.limit !== undefined) {
            query += ' LIMIT ?';
            queryParams.push(args.limit);
          }

          if (args.offset !== undefined) {
            query += ' OFFSET ?';
            queryParams.push(args.offset);
          }

          console.log('📚 scope 검색 쿼리:', query, queryParams);

          const rows = await executeQuery(query, queryParams) as any[];
          const manuals = rows.map(formatDocsManual);

          result = {
            manuals,
            total_count: totalCount,
            page: Math.floor((args.offset || 0) / (args.limit || 100)) + 1,
            limit: args.limit || 100,
            query: `${args.scope}:${args.scope_hierarchy}`,
          };

          cache.set(cacheKey, result);
          console.log('📚 scope 검색 결과:', { count: manuals.length, total: totalCount });
        } catch (error) {
          console.error('📚 docsManualSearchByScope 오류:', error);
          throw new Error(`scope 기반 매뉴얼 검색 실패: ${error}`);
        }
      }

      return result;
    },

    docsCategories: async () => {
      const cacheKey = 'docs_categories';
      let result = cache.get(cacheKey);

      if (!result) {
        try {
          console.log('📚 docsCategories 요청');

          const rows = await executeQuery(
            'SELECT DISTINCT category FROM docs_manual WHERE is_visible = 1 AND category IS NOT NULL ORDER BY category'
          ) as any[];

          const categories = rows.map(row => row.category);

          result = {
            categories: categories.length > 0 ? categories : ['사용자매뉴얼', '개발자매뉴얼', '운영매뉴얼', '운영가이드', '시스템가이드'],
          };

          cache.set(cacheKey, result);
          console.log('📚 카테고리 조회 완료:', result.categories);
        } catch (error) {
          console.error('📚 docsCategories 오류:', error);
          // 기본 카테고리 반환
          result = {
            categories: ['사용자매뉴얼', '개발자매뉴얼', '운영매뉴얼', '운영가이드', '시스템가이드'],
          };
        }
      }

      return result;
    },
  },

  Mutation: {
    docsManualCreate: async (_parent: unknown, args: { input: DocsManualInput }) => {
      try {
        console.log('📚 docsManualCreate 요청:', args.input);

        const {
          title, content, category, writer, format, email, is_notice, is_private,
          markdown_source, file_path, scope, parent_scope_id, scope_hierarchy
        } = args.input;

        const result = await executeQuery(
          `INSERT INTO docs_manual
           (title, content, category, writer, format, email, is_notice, is_private,
            markdown_source, file_path, is_visible, scope, parent_scope_id, scope_hierarchy)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            title,
            content,
            category,
            writer,
            format || 'markdown',
            email || null,
            is_notice ? 1 : 0,
            is_private ? 1 : 0,
            markdown_source || null,
            file_path || null,
            1, // is_visible 기본값
            scope || 'section', // scope 기본값
            parent_scope_id || null,
            scope_hierarchy || null
          ]
        ) as any;

        // 캐시 초기화
        cache.clearByPrefix('docs_manual');
        cache.clearByPrefix('docs_categories');

        // 생성된 매뉴얼 조회
        const rows = await executeQuery(
          'SELECT * FROM docs_manual WHERE id = ?',
          [result.insertId]
        ) as any[];

        if (rows.length === 0) {
          throw new Error('생성된 매뉴얼을 찾을 수 없습니다');
        }

        const newManual = formatDocsManual(rows[0]);
        console.log('📚 매뉴얼 생성 완료:', newManual.id);
        
        return newManual;
      } catch (error) {
        console.error('📚 docsManualCreate 오류:', error);
        throw new Error(`매뉴얼 생성 실패: ${error}`);
      }
    },

    docsManualUpdate: async (_parent: unknown, args: { input: DocsManualInput }) => {
      try {
        console.log('📚 docsManualUpdate 요청:', args.input);

        if (!args.input.id) {
          throw new Error('매뉴얼 ID가 필요합니다');
        }

        // 업데이트할 필드들을 동적으로 구성
        const updateFields = [];
        const updateValues = [];

        if (args.input.title !== undefined) {
          updateFields.push('title = ?');
          updateValues.push(args.input.title);
        }
        if (args.input.content !== undefined) {
          updateFields.push('content = ?');
          updateValues.push(args.input.content);
        }
        if (args.input.category !== undefined) {
          updateFields.push('category = ?');
          updateValues.push(args.input.category);
        }
        if (args.input.writer !== undefined) {
          updateFields.push('writer = ?');
          updateValues.push(args.input.writer);
        }
        if (args.input.email !== undefined) {
          updateFields.push('email = ?');
          updateValues.push(args.input.email);
        }
        if (args.input.format !== undefined) {
          updateFields.push('format = ?');
          updateValues.push(args.input.format);
        }
        if (args.input.is_notice !== undefined) {
          updateFields.push('is_notice = ?');
          updateValues.push(args.input.is_notice ? 1 : 0);
        }
        if (args.input.is_private !== undefined) {
          updateFields.push('is_private = ?');
          updateValues.push(args.input.is_private ? 1 : 0);
        }
        if (args.input.markdown_source !== undefined) {
          updateFields.push('markdown_source = ?');
          updateValues.push(args.input.markdown_source);
        }
        if (args.input.file_path !== undefined) {
          updateFields.push('file_path = ?');
          updateValues.push(args.input.file_path);
        }
        if (args.input.scope !== undefined) {
          updateFields.push('scope = ?');
          updateValues.push(args.input.scope);
        }
        if (args.input.parent_scope_id !== undefined) {
          updateFields.push('parent_scope_id = ?');
          updateValues.push(args.input.parent_scope_id);
        }
        if (args.input.scope_hierarchy !== undefined) {
          updateFields.push('scope_hierarchy = ?');
          updateValues.push(args.input.scope_hierarchy);
        }

        if (updateFields.length === 0) {
          throw new Error('업데이트할 필드가 없습니다');
        }

        updateValues.push(args.input.id);

        await executeQuery(
          `UPDATE docs_manual SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );

        // 캐시 초기화
        cache.clearByPrefix('docs_manual');
        cache.clearByPrefix('docs_categories');

        // 수정된 매뉴얼 조회
        const rows = await executeQuery(
          'SELECT * FROM docs_manual WHERE id = ?',
          [args.input.id]
        ) as any[];

        if (rows.length === 0) {
          throw new Error('매뉴얼을 찾을 수 없습니다');
        }

        const updatedManual = formatDocsManual(rows[0]);
        console.log('📚 매뉴얼 수정 완료:', updatedManual.id);
        
        return updatedManual;
      } catch (error) {
        console.error('📚 docsManualUpdate 오류:', error);
        throw new Error(`매뉴얼 수정 실패: ${error}`);
      }
    },

    docsManualDelete: async (_parent: unknown, args: { input: DocsManualDeleteInput }) => {
      try {
        console.log('📚 docsManualDelete 요청:', args.input);

        // 삭제 전 매뉴얼 정보 조회
        const rows = await executeQuery(
          'SELECT * FROM docs_manual WHERE id = ?',
          [args.input.id]
        ) as any[];

        if (rows.length === 0) {
          throw new Error('매뉴얼을 찾을 수 없습니다');
        }

        const manualToDelete = formatDocsManual(rows[0]);

        // 소프트 삭제 실행 (is_visible = 0으로 변경)
        await executeQuery(
          'UPDATE docs_manual SET is_visible = 0 WHERE id = ?',
          [args.input.id]
        );

        // 캐시 초기화
        cache.clearByPrefix('docs_manual');
        cache.clearByPrefix('docs_categories');

        console.log('📚 매뉴얼 삭제 완료:', args.input.id);
        
        return manualToDelete;
      } catch (error) {
        console.error('📚 docsManualDelete 오류:', error);
        throw new Error(`매뉴얼 삭제 실패: ${error}`);
      }
    },
  },
};