import { apiClient } from '@/lib/api/backendClient';

export const noticeResolvers = {
  Query: {
    noticesByCategory: async (_: unknown, { category, gap }: { category: string; gap: number }) => {
      try {
        const response = await apiClient.get(`/notices/${category}`, { params: { gap } });
        return response.data.map((notice: any) => ({
          nid: notice.nid.toString(),
          title: notice.title,
          orgName: notice.org_name,
          postedAt: notice.posted_date,
          detailUrl: notice.detail_url,
          category: notice.카테고리 || "",
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
        const response = await apiClient.get('/notices', { params: { gap } });
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
        const response = await apiClient.get('/notices_statistics', { params: { gap } });
        return response.data;
      } catch (error) {
        console.error('Error fetching notice statistics:', error);
        return [];
      }
    },
  },
};
