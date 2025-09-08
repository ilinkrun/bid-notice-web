import { apiClient } from '@/lib/api/backendClient';

interface BidData {
  mid: string;
  nid: string;
  title: string;
  status: string;
  started_at: string;
  ended_at: string;
  memo: string;
  org_name: string;
  posted_date: string;
  detail: string;
  category?: string;
  org_region?: string;
}

export const bidResolvers = {
  Query: {
    myBids: async () => {
      try {
        const response = await apiClient.get('/my_bids');
        return response.data.map((bd: BidData) => ({
          mid: parseInt(bd.mid),
          nid: parseInt(bd.nid),
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
        return response.data.map((bd: BidData) => ({
          mid: parseInt(bd.mid),
          nid: parseInt(bd.nid),
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

    bidByNid: async (_: unknown, { nid }: { nid: number }) => {
      try {
        const response = await apiClient.get(`/my_bids/detail/${nid}`);
        const bd = response.data;
        return {
          mid: parseInt(bd.mid),
          nid: parseInt(bd.nid),
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
        };
      } catch (error) {
        console.error('Error fetching bid by nid:', error);
        return null;
      }
    },
  },
};
