import { apiClient } from '@/lib/api/backendClient';

export const settingsCategoryResolvers = {
  Query: {
    settingsCategorys: async (_: any) => {
      try {
        const response = await apiClient.get('/settings_categorys');
        console.log(`response.data: ${JSON.stringify(response.data)}`);
        return response.data
          .map((category: any) => ({
            sn: category.sn,
            keywords: category.keywords,
            nots: category.nots,
            minPoint: category.min_point,
            category: category.category,
            creator: category.creator || '',
            memo: category.memo || ''
          }))
          .sort((a: any, b: any) => a.sn - b.sn);
      } catch (error) {
        console.error('Error fetching settings categories:', error);
        return [];
      }
    },
  },
  Mutation: {
    createSettingsCategory: async (_: any, { input }: any) => {
      try {
        const response = await apiClient.post('/settings_categorys', {
          sn: input.sn,
          keywords: input.keywords,
          nots: input.nots,
          min_point: input.minPoint,
          category: input.category,
          creator: input.creator || '',
          memo: input.memo || ''
        });
        return {
          sn: response.data.sn,
          keywords: response.data.keywords,
          nots: response.data.nots,
          minPoint: response.data.min_point,
          category: response.data.category,
          creator: response.data.creator || '',
          memo: response.data.memo || ''
        };
      } catch (error) {
        console.error('Error creating settings category:', error);
        throw new Error('Failed to create settings category');
      }
    },
    updateSettingsCategory: async (_: any, { input }: any) => {
      try {
        const response = await apiClient.put(`/settings_categorys/${input.category}`, {
          sn: input.sn,
          keywords: input.keywords,
          nots: input.nots,
          min_point: input.minPoint,
          category: input.category,
          creator: input.creator || '',
          memo: input.memo || ''
        });
        return {
          sn: response.data.sn,
          keywords: response.data.keywords,
          nots: response.data.nots,
          minPoint: response.data.min_point,
          category: response.data.category,
          creator: response.data.creator || '',
          memo: response.data.memo || ''
        };
      } catch (error) {
        console.error('Error updating settings category:', error);
        throw new Error('Failed to update settings category');
      }
    },
  },
};
