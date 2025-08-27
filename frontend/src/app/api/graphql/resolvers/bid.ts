import { apiClient } from '@/lib/api/backendClient';

export const bidResolvers = {
  Query: {
    bidByStatus: async (_: unknown, { status }: { status: string }) => {
      try {
        const response = await apiClient.get(`/bids/${status}`);
        return response.data.map((bd: any) => ({
          bid: bd.bid.toString(),
          nid: bd.nid.toString(),
          title: bd.title,
          status: bd.status,
          started_at: bd.started_at,
          ended_at: bd.ended_at,
          memo: bd.memo,
          orgName: bd.기관명,
          postedAt: bd.작성일,
          detail: bd.detail,
          category: bd.category || "",
          region: bd.지역 || "",
        }));
      } catch (error) {
        console.error('Error fetching bid by category:', error);
        return [];
      }
    },
  },
};
