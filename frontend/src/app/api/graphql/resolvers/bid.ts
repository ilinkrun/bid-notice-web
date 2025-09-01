import { apiClient } from '@/lib/api/backendClient';

export const bidResolvers = {
  Query: {
    myBids: async () => {
      try {
        const response = await apiClient.get('/my_bids');
        return response.data.map((bd: any) => ({
          bid: bd.bid.toString(),
          nid: bd.nid.toString(),
          title: bd.title,
          status: bd.status,
          started_at: bd.started_at,
          ended_at: bd.ended_at,
          memo: bd.memo,
          orgName: bd.org_name,
          postedAt: bd.posted_date,
          detail: bd.detail,
          category: bd.category || "",
          region: bd.org_region || "",
        }));
      } catch (error) {
        console.error('Error fetching my bids:', error);
        return [];
      }
    },

    bidByStatus: async (_: unknown, { status }: { status: string }) => {
      try {
        const response = await apiClient.get(`/my_bids/${status}`);
        return response.data.map((bd: any) => ({
          bid: bd.bid.toString(),
          nid: bd.nid.toString(),
          title: bd.title,
          status: bd.status,
          started_at: bd.started_at,
          ended_at: bd.ended_at,
          memo: bd.memo,
          orgName: bd.org_name,
          postedAt: bd.posted_date,
          detail: bd.detail,
          category: bd.category || "",
          region: bd.org_region || "",
        }));
      } catch (error) {
        console.error('Error fetching bid by status:', error);
        return [];
      }
    },
  },
};
