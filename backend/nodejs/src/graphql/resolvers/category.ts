import { executeQuery } from '@/utils/database/mysql';

export interface NoticeCategoryData {
  sn: number;
  category: string;
  division?: string;
  keywords: string;
  nots: string;
  min_point: number;
  creator?: string;
  is_active: number;
}

export const categoryResolvers = {
  Query: {
    noticeCategoriesAll: async () => {
      try {
        const rows = await executeQuery(`
          SELECT sn, category, division, keywords, nots, min_point, creator, is_active
          FROM settings_notice_category
          ORDER BY sn ASC
        `);

        return (rows as NoticeCategoryData[]).map((category: NoticeCategoryData) => ({
          sn: category.sn,
          category: category.category,
          division: category.division,
          keywords: category.keywords,
          nots: category.nots,
          minPoint: category.min_point,
          creator: category.creator || '',
          isActive: category.is_active
        }));
      } catch (error) {
        console.error('Error fetching all notice categories:', error);
        return [];
      }
    },

    noticeCategoriesActive: async () => {
      try {
        const rows = await executeQuery(`
          SELECT sn, category, division, keywords, nots, min_point, creator, is_active
          FROM settings_notice_category
          WHERE is_active = 1
          ORDER BY sn ASC
        `);

        return (rows as NoticeCategoryData[]).map((category: NoticeCategoryData) => ({
          sn: category.sn,
          category: category.category,
          division: category.division,
          keywords: category.keywords,
          nots: category.nots,
          minPoint: category.min_point,
          creator: category.creator || '',
          isActive: category.is_active
        }));
      } catch (error) {
        console.error('Error fetching active notice categories:', error);
        return [];
      }
    },
  },
};