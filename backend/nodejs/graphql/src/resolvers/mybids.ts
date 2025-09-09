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

export const mybidsResolvers = {
  Query: {
    mybidsAll: async () => {
      try {
        const response = await apiClient.get('/my_bids');
        return response.data.map((bd: BidData) => ({
          mid: parseInt(bd.mid),
          nid: parseInt(bd.nid),
          title: bd.title,
          status: bd.status,
          startedAt: bd.started_at || null,
          endedAt: bd.ended_at || null,
          memo: bd.memo || "",
          orgName: bd.org_name,
          postedAt: bd.posted_date,
          detail: bd.detail || "",
          category: bd.category || "",
          region: bd.org_region || "",
        }));
      } catch (error) {
        console.error('Error fetching all bids:', error);
        return [];
      }
    },

    mybidsByStatus: async (_: unknown, { status }: { status: string }) => {
      try {
        const response = await apiClient.get(`/my_bids/${status}`);
        return response.data.map((bd: BidData) => ({
          mid: parseInt(bd.mid),
          nid: parseInt(bd.nid),
          title: bd.title,
          status: bd.status,
          startedAt: bd.started_at || null,
          endedAt: bd.ended_at || null,
          memo: bd.memo || "",
          orgName: bd.org_name,
          postedAt: bd.posted_date,
          detail: bd.detail || "",
          category: bd.category || "",
          region: bd.org_region || "",
        }));
      } catch (error) {
        console.error('Error fetching bids by status:', error);
        return [];
      }
    },

    mybidsOne: async (_: unknown, { nid }: { nid: number }) => {
      try {
        const response = await apiClient.get(`/my_bids/detail/${nid}`);
        const bd = response.data;
        return {
          mid: parseInt(bd.mid),
          nid: parseInt(bd.nid),
          title: bd.title,
          status: bd.status,
          startedAt: bd.started_at || null,
          endedAt: bd.ended_at || null,
          memo: bd.memo || "",
          orgName: bd.org_name,
          postedAt: bd.posted_date,
          detail: bd.detail || "",
          category: bd.category || "",
          region: bd.org_region || "",
        };
      } catch (error) {
        console.error('Error fetching bid by nid:', error);
        return null;
      }
    },
  },

  Mutation: {
    mybidCreate: async (_: unknown, { input }: { input: any }) => {
      try {
        // TODO: Implement bid creation API call
        const response = await apiClient.post('/my_bids', input);
        return response.data;
      } catch (error) {
        console.error('Error creating bid:', error);
        throw new Error('Failed to create bid');
      }
    },

    mybidUpdate: async (_: unknown, { input }: { input: any }) => {
      try {
        // TODO: Implement bid update API call
        const response = await apiClient.put(`/my_bids/${input.mid}`, input);
        return response.data;
      } catch (error) {
        console.error('Error updating bid:', error);
        throw new Error('Failed to update bid');
      }
    },

    mybidDelete: async (_: unknown, { mid }: { mid: number }) => {
      try {
        // TODO: Implement bid deletion API call
        await apiClient.delete(`/my_bids/${mid}`);
        return true;
      } catch (error) {
        console.error('Error deleting bid:', error);
        throw new Error('Failed to delete bid');
      }
    },
  },
};