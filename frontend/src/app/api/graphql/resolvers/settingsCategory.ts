import { apiClient } from '@/lib/api/backendClient';

export const settingsCategoryResolvers = {
  Query: {
    settingsCategorys: async (_: any) => {
      try {
        const response = await apiClient.get('/settings_notice_categorys');
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

    settingsCategoryByCategory: async (_: any, { category }: { category: string }) => {
      try {
        const response = await apiClient.get(`/settings_notice_categorys/${category}`);
        return response.data.map((item: any) => ({
          sn: item.sn,
          keywords: item.keywords,
          nots: item.nots,
          minPoint: item.min_point,
          category: item.category,
          creator: item.creator || '',
          memo: item.memo || ''
        }));
      } catch (error) {
        console.error('Error fetching settings category by category:', error);
        return [];
      }
    },

    parseKeywordWeights: async (_: any, { keywordWeightStr }: { keywordWeightStr: string }) => {
      try {
        const response = await apiClient.get('/parse_keyword_weights', {
          params: { keyword_weight_str: keywordWeightStr }
        });
        return response.data;
      } catch (error) {
        console.error('Error parsing keyword weights:', error);
        return [];
      }
    },
  },
  Mutation: {
    categoryWeightSearch: async (_: any, { 
      keywords, minPoint, field, tableName, addFields, addWhere 
    }: {
      keywords: string;
      minPoint: number;
      field?: string;
      tableName?: string;
      addFields?: string[];
      addWhere?: string;
    }) => {
      try {
        const response = await apiClient.post('/category_weight_search', {
          keywords,
          min_point: minPoint,
          field: field || 'title',
          table_name: tableName || 'notice_list',
          add_fields: addFields || ['detail_url', 'posted_date', 'org_name'],
          add_where: addWhere || ''
        });
        
        return response.data.map((notice: any) => ({
          nid: notice.nid?.toString(),
          title: notice.title,
          orgName: notice.org_name,
          postedAt: notice.posted_date,
          detailUrl: notice.detail_url,
          category: notice.category || "",
          region: notice.org_region || "미지정",
        }));
      } catch (error) {
        console.error('Error in category weight search:', error);
        throw new Error('Failed to search by category weight');
      }
    },

    filterNoticeList: async (_: any, { notStr, dicts, field }: {
      notStr: string;
      dicts: any[];
      field?: string;
    }) => {
      try {
        const response = await apiClient.post('/filter_notice_list', {
          not_str: notStr,
          dicts,
          field: field || 'title'
        });
        
        return response.data.map((notice: any) => ({
          nid: notice.nid?.toString(),
          title: notice.title,
          orgName: notice.org_name,
          postedAt: notice.posted_date,
          detailUrl: notice.detail_url,
          category: notice.category || "",
          region: notice.org_region || "미지정",
        }));
      } catch (error) {
        console.error('Error filtering notice list:', error);
        throw new Error('Failed to filter notice list');
      }
    },

    createSettingsCategory: async (_: any, { input }: any) => {
      try {
        const response = await apiClient.post('/settings_notice_categorys', {
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
        const response = await apiClient.put(`/settings_notice_categorys/${input.category}`, {
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
