import { executeQuery } from '../lib/mysql.js';

// 간단한 메모리 캐시 구현
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
const formatLangMapping = (row: any) => ({
  id: row.id,
  area: row.area,
  ko: row.ko,
  en: row.en,
  remark: row.remark || null,
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mappingsResolvers = {
  Query: {
    // 전체 매핑 데이터 조회
    mappingsLangAll: async () => {
      const cacheKey = 'lang_mappings_all';
      let result = cache.get(cacheKey);
      
      if (!result) {
        try {
          const rows = await executeQuery(
            'SELECT * FROM mappings_lang ORDER BY area, ko'
          ) as any[];
          
          result = rows.map(formatLangMapping);
          cache.set(cacheKey, result);
        } catch (error) {
          console.error('Error fetching all lang mappings:', error);
          throw new Error('Failed to fetch language mappings');
        }
      }
      
      return result;
    },

    // 영역별 매핑 데이터 조회 (활성 데이터만)
    mappingsLangByArea: async (_: unknown, { area }: { area: string }) => {
      const cacheKey = `lang_mappings_area_${area}_active`;
      let result = cache.get(cacheKey);
      
      if (!result) {
        try {
          const rows = await executeQuery(
            'SELECT * FROM mappings_lang WHERE area = ? AND is_active = 1 ORDER BY ko',
            [area]
          ) as any[];
          
          result = rows.map(formatLangMapping);
          cache.set(cacheKey, result);
        } catch (error) {
          console.error('Error fetching lang mappings by area:', error);
          throw new Error('Failed to fetch language mappings by area');
        }
      }
      
      return result;
    },

    // 특정 매핑 데이터 조회
    mappingsLangById: async (_: unknown, { id }: { id: number }) => {
      try {
        const rows = await executeQuery(
          'SELECT * FROM mappings_lang WHERE id = ?',
          [id]
        ) as any[];
        
        return rows.length > 0 ? formatLangMapping(rows[0]) : null;
      } catch (error) {
        console.error('Error fetching lang mapping by id:', error);
        throw new Error('Failed to fetch language mapping');
      }
    },

    // 한글->영어 변환 (활성 데이터만)
    mappingsLangKoToEn: async (_: unknown, { area, ko }: { area: string; ko: string }) => {
      const cacheKey = `lang_mapping_ko_to_en_${area}_${ko}_active`;
      let result = cache.get(cacheKey);
      
      if (result === null) {
        try {
          const rows = await executeQuery(
            'SELECT en FROM mappings_lang WHERE area = ? AND ko = ? AND is_active = 1',
            [area, ko]
          ) as any[];
          
          result = rows.length > 0 ? rows[0].en : null;
          cache.set(cacheKey, result);
        } catch (error) {
          console.error('Error converting ko to en:', error);
          throw new Error('Failed to convert Korean to English');
        }
      }
      
      return result;
    },

    // 영어->한글 변환 (활성 데이터만)
    mappingsLangEnToKo: async (_: unknown, { area, en }: { area: string; en: string }) => {
      const cacheKey = `lang_mapping_en_to_ko_${area}_${en}_active`;
      let result = cache.get(cacheKey);
      
      if (result === null) {
        try {
          const rows = await executeQuery(
            'SELECT ko FROM mappings_lang WHERE area = ? AND en = ? AND is_active = 1',
            [area, en]
          ) as any[];
          
          result = rows.length > 0 ? rows[0].ko : null;
          cache.set(cacheKey, result);
        } catch (error) {
          console.error('Error converting en to ko:', error);
          throw new Error('Failed to convert English to Korean');
        }
      }
      
      return result;
    },
  },

  Mutation: {
    // 매핑 데이터 생성
    mappingsLangCreate: async (_: unknown, { input }: { input: any }) => {
      try {
        const { area, ko, en, remark, isActive } = input;
        
        const result = await executeQuery(
          'INSERT INTO mappings_lang (area, ko, en, remark, is_active) VALUES (?, ?, ?, ?, ?)',
          [area, ko, en, remark || null, isActive !== undefined ? (isActive ? 1 : 0) : 1]
        ) as any;
        
        // 캐시 초기화
        cache.clearByPrefix('lang_mappings');
        cache.clearByPrefix('lang_mapping_');
        
        // 생성된 데이터 조회
        const rows = await executeQuery(
          'SELECT * FROM mappings_lang WHERE id = ?',
          [result.insertId]
        ) as any[];
        
        return formatLangMapping(rows[0]);
      } catch (error) {
        console.error('Error creating lang mapping:', error);
        if (error instanceof Error && error.message.includes('Duplicate entry')) {
          throw new Error('Language mapping already exists for this area and language pair');
        }
        throw new Error('Failed to create language mapping');
      }
    },

    // 매핑 데이터 수정
    mappingsLangUpdate: async (_: unknown, { input }: { input: any }) => {
      try {
        const { id, area, ko, en, remark, isActive } = input;
        
        // 업데이트할 필드들을 동적으로 구성
        const updateFields = [];
        const updateValues = [];
        
        if (area !== undefined) {
          updateFields.push('area = ?');
          updateValues.push(area);
        }
        if (ko !== undefined) {
          updateFields.push('ko = ?');
          updateValues.push(ko);
        }
        if (en !== undefined) {
          updateFields.push('en = ?');
          updateValues.push(en);
        }
        if (remark !== undefined) {
          updateFields.push('remark = ?');
          updateValues.push(remark);
        }
        if (isActive !== undefined) {
          updateFields.push('is_active = ?');
          updateValues.push(isActive ? 1 : 0);
        }
        
        if (updateFields.length === 0) {
          throw new Error('No fields to update');
        }
        
        updateValues.push(id);
        
        await executeQuery(
          `UPDATE mappings_lang SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
        
        // 캐시 초기화
        cache.clearByPrefix('lang_mappings');
        cache.clearByPrefix('lang_mapping_');
        
        // 수정된 데이터 조회
        const rows = await executeQuery(
          'SELECT * FROM mappings_lang WHERE id = ?',
          [id]
        ) as any[];
        
        if (rows.length === 0) {
          throw new Error('Language mapping not found');
        }
        
        return formatLangMapping(rows[0]);
      } catch (error) {
        console.error('Error updating lang mapping:', error);
        if (error instanceof Error && error.message.includes('Duplicate entry')) {
          throw new Error('Language mapping already exists for this area and language pair');
        }
        throw new Error('Failed to update language mapping');
      }
    },

    // 매핑 데이터 삭제
    mappingsLangDelete: async (_: unknown, { id }: { id: number }) => {
      try {
        const result = await executeQuery(
          'DELETE FROM mappings_lang WHERE id = ?',
          [id]
        ) as any;
        
        // 캐시 초기화
        cache.clearByPrefix('lang_mappings');
        cache.clearByPrefix('lang_mapping_');
        
        return result.affectedRows > 0;
      } catch (error) {
        console.error('Error deleting lang mapping:', error);
        throw new Error('Failed to delete language mapping');
      }
    },

    // 매핑 캐시 초기화
    mappingsLangClearCache: async (_: unknown, { area }: { area?: string }) => {
      try {
        if (area) {
          cache.clearByPrefix(`lang_mappings_area_${area}`);
          cache.clearByPrefix(`lang_mapping_ko_to_en_${area}`);
          cache.clearByPrefix(`lang_mapping_en_to_ko_${area}`);
        } else {
          cache.clearByPrefix('lang_mappings');
          cache.clearByPrefix('lang_mapping_');
        }
        
        return true;
      } catch (error) {
        console.error('Error clearing cache:', error);
        return false;
      }
    },
  },
};