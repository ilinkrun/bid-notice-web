import { apiClient, mysqlApiClient } from '../lib/api/backendClient';

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
  detail_url: string;
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
          detailUrl: bd.detail_url || "",
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
          detailUrl: bd.detail_url || "",
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
          detailUrl: bd.detail_url || "",
          category: bd.category || "",
          region: bd.org_region || "",
        };
      } catch (error) {
        console.error('Error fetching bid by nid:', error);
        return null;
      }
    },

    noticeFiles: async (_: unknown, { nid }: { nid: number }) => {
      try {
        const response = await apiClient.get(`/notice_files/${nid}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching notice files:', error);
        return {
          success: false,
          nid: nid,
          files: [],
          total_count: 0
        };
      }
    },

    noticeDetails: async (_: unknown, { nid }: { nid: number }) => {
      try {
        const response = await apiClient.get(`/notice_details/${nid}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching notice details:', error);
        return {
          success: false,
          nid: nid,
          details: {
            title: "",
            notice_num: "",
            org_dept: "",
            org_tel: "",
            body_html: "",
            detail_url: "",
            category: ""
          },
          message: "공고 상세정보를 불러올 수 없습니다."
        };
      }
    },
  },

  Mutation: {
    mybidCreate: async (_: unknown, { input }: { input: any }) => {
      try {
        const response = await apiClient.post('/my_bids', input);
        return response.data;
      } catch (error) {
        console.error('Error creating bid:', error);
        throw new Error('Failed to create bid');
      }
    },

    mybidUpdate: async (_: unknown, { input }: { input: { nid: number; status: string; memo?: string; detail?: string } }) => {
      try {
        const requestData: any = {
          nid: input.nid,
          status: input.status
        };
        
        if (input.memo) {
          requestData.memo = input.memo;
        }
        
        if (input.detail) {
          try {
            requestData.detail = JSON.parse(input.detail);
          } catch (e) {
            console.error('Failed to parse detail JSON:', e);
            requestData.detail = null;
          }
        }
        
        const response = await apiClient.put(`/my_bids/${input.nid}`, requestData);
        return response.data;
      } catch (error) {
        console.error('Error updating bid:', error);
        throw new Error('Failed to update bid');
      }
    },

    mybidUpsert: async (_: unknown, { input }: { input: any }) => {
      try {
        const response = await apiClient.post('/my_bids/upsert', input);
        return response.data;
      } catch (error) {
        console.error('Error upserting bid:', error);
        throw new Error('Failed to upsert bid');
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

    noticeDetailsUpdate: async (_: unknown, { nid, input }: { nid: number; input: any }) => {
      try {
        const response = await apiClient.put(`/notice_details/${nid}`, input);
        return response.data;
      } catch (error) {
        console.error('Error updating notice details:', error);
        return {
          success: false,
          message: "공고 상세정보 업데이트에 실패했습니다.",
          nid: nid
        };
      }
    },
  },
};