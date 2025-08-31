import { apiClient } from '@/lib/api/backendClient';

export const noticeResolvers = {
  Query: {
    noticesByCategory: async (_: unknown, { category, gap }: { category: string; gap: number }) => {
      try {
        const response = await apiClient.get(`/notices/${category}`, { params: { gap } });
        return response.data.map((notice: any) => ({
          nid: notice.nid.toString(),
          title: notice.제목,
          orgName: notice.기관명,
          postedAt: notice.작성일,
          detailUrl: notice.상세페이지주소,
          category: notice.카테고리 || "",
          region: notice.지역 || "미지정",
          registration: notice.등록
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
          title: notice.제목,
          orgName: notice.기관명,
          postedAt: notice.작성일,
          url: notice.상세페이지주소,
          region: notice.지역 || "미지정",
          registration: notice.등록
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
