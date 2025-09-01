import { apiClient } from '@/lib/api/backendClient';

export const noticeResolvers = {
  Query: {
    noticesByCategory: async (_: unknown, { category, gap }: { category: string; gap: number }) => {
      try {
        const response = await apiClient.get(`/notice_list/${category}`, { params: { gap } });
        return response.data.map((notice: any) => ({
          nid: notice.nid.toString(),
          title: notice.title,
          orgName: notice.org_name,
          postedAt: notice.posted_date,
          detailUrl: notice.detail_url,
          category: notice.category || notice.카테고리 || "",
          region: notice.org_region || "미지정",
          registration: notice.registration
        }));
      } catch (error) {
        console.error('Error fetching notices by category:', error);
        return [];
      }
    },

    notices: async (_: unknown, { gap }: { gap: number }) => {
      try {
        const response = await apiClient.get('/notice_list', { params: { gap } });
        return response.data.map((notice: any) => ({
          id: notice.nid.toString(),
          title: notice.title,
          orgName: notice.org_name,
          postedAt: notice.posted_date,
          url: notice.detail_url,
          region: notice.org_region || "미지정",
          registration: notice.registration
        }));
      } catch (error) {
        console.error('Error fetching all notices:', error);
        return [];
      }
    },
    
    noticesStatistics: async (_: unknown, { gap }: { gap: number }) => {
      try {
        const response = await apiClient.get('/notice_list_statistics', { params: { gap } });
        return response.data;
      } catch (error) {
        console.error('Error fetching notice statistics:', error);
        return [];
      }
    },

    searchNotices: async (_: unknown, { keywords, nots, minPoint, addWhere }: { 
      keywords: string; nots: string; minPoint: number; addWhere?: string 
    }) => {
      try {
        const response = await apiClient.post('/search_notice_list', {
          keywords,
          nots,
          min_point: minPoint,
          add_where: addWhere || "",
          base_sql: "",
          add_sql: ""
        });
        return response.data.map((notice: any) => ({
          nid: notice.nid.toString(),
          title: notice.title,
          orgName: notice.org_name,
          postedAt: notice.posted_date,
          detailUrl: notice.detail_url,
          category: notice.category || "",
          region: notice.org_region || "미지정",
          registration: notice.registration
        }));
      } catch (error) {
        console.error('Error searching notices:', error);
        return [];
      }
    },

    lastNotice: async (_: unknown, { orgName, field }: { orgName: string; field?: string }) => {
      try {
        const response = await apiClient.get(`/last_notice/${orgName}`, { 
          params: { field: field || 'title' } 
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching last notice:', error);
        return null;
      }
    },
  },

  Mutation: {
    upsertNotice: async (_: unknown, { data }: { data: any[] }) => {
      try {
        const response = await apiClient.post('/notice_list', data);
        return response.data;
      } catch (error) {
        console.error('Error upserting notice:', error);
        throw new Error('Failed to upsert notice');
      }
    },

    updateNoticeStatus: async (_: unknown, { nid, from, to }: { nid: number; from: string; to: string }) => {
      try {
        const response = await apiClient.post('/notice_list/status', { nid, from, to });
        return response.data;
      } catch (error) {
        console.error('Error updating notice status:', error);
        throw new Error('Failed to update notice status');
      }
    },
  },
};
