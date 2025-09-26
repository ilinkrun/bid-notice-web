import { executeQuery } from '@/utils/mysql';

export interface NoticeCategoryData {
  sn: number;
  category: string;
  keywords: string;
  nots: string;
  min_point: number;
  creator?: string;
  use: number;
}

export const categoryResolvers = {
  Query: {
    noticeCategoriesAll: async () => {
      try {
        const rows = await executeQuery(`
          SELECT sn, category, keywords, nots, min_point, creator, \`use\`
          FROM settings_notice_category
          ORDER BY sn ASC
        `);
        
        return (rows as NoticeCategoryData[]).map((category: NoticeCategoryData) => ({
          sn: category.sn,
          category: category.category,
          keywords: category.keywords,
          nots: category.nots,
          minPoint: category.min_point,
          creator: category.creator || '',
          use: category.use
        }));
      } catch (error) {
        console.error('Error fetching all notice categories:', error);
        return [];
      }
    },

    noticeCategoriesActive: async () => {
      try {
        const rows = await executeQuery(`
          SELECT sn, category, keywords, nots, min_point, creator, \`use\`
          FROM settings_notice_category
          WHERE \`use\` = 1
          ORDER BY sn ASC
        `);
        
        return (rows as NoticeCategoryData[]).map((category: NoticeCategoryData) => ({
          sn: category.sn,
          category: category.category,
          keywords: category.keywords,
          nots: category.nots,
          minPoint: category.min_point,
          creator: category.creator || '',
          use: category.use
        }));
      } catch (error) {
        console.error('Error fetching active notice categories:', error);
        return [];
      }
    },
  },
};