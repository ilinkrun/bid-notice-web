import {
  getMyBids,
  getMyBidsByStatus,
  getMyBidByNid,
  createMyBid,
  updateMyBid,
  upsertMyBid,
  deleteMyBid,
  getNoticeFiles,
  getNoticeDetails,
  updateNoticeDetails
} from '@/utils/utilsGovBid';

export const mybidsResolvers = {
  Query: {
    mybidsAll: async () => {
      try {
        const bids = await getMyBids();
        return bids.map((bd) => ({
          mid: bd.mid,
          nid: bd.nid,
          title: bd.title,
          status: bd.status,
          startedAt: bd.started_at || null,
          endedAt: bd.ended_at || null,
          memo: bd.memo || "",
          orgName: bd.org_name || "",
          postedAt: bd.posted_date || "",
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
        const bids = await getMyBidsByStatus(status);
        return bids.map((bd) => ({
          mid: bd.mid,
          nid: bd.nid,
          title: bd.title,
          status: bd.status,
          startedAt: bd.started_at || null,
          endedAt: bd.ended_at || null,
          memo: bd.memo || "",
          orgName: bd.org_name || "",
          postedAt: bd.posted_date || "",
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
        const bd = await getMyBidByNid(nid);
        if (!bd) {
          return null;
        }
        return {
          mid: bd.mid,
          nid: bd.nid,
          title: bd.title,
          status: bd.status,
          startedAt: bd.started_at || null,
          endedAt: bd.ended_at || null,
          memo: bd.memo || "",
          orgName: bd.org_name || "",
          postedAt: bd.posted_date || "",
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
        const result = await getNoticeFiles(nid);
        return result;
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
        const result = await getNoticeDetails(nid);
        return result;
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
        const insertId = await createMyBid(input);
        return { success: true, mid: insertId };
      } catch (error) {
        console.error('Error creating bid:', error);
        throw new Error('Failed to create bid');
      }
    },

    mybidUpdate: async (_: unknown, { input }: { input: { nid: number; status: string; memo?: string; detail?: string } }) => {
      try {
        let parsedDetail: any = undefined;

        if (input.detail) {
          try {
            parsedDetail = JSON.parse(input.detail);
          } catch (e) {
            console.error('Failed to parse detail JSON:', e);
            parsedDetail = null;
          }
        }

        const result = await updateMyBid(input.nid, {
          status: input.status,
          memo: input.memo || null,
          detail: parsedDetail
        });

        return result;
      } catch (error) {
        console.error('Error updating bid:', error);
        throw new Error('Failed to update bid');
      }
    },

    mybidUpsert: async (_: unknown, { input }: { input: any }) => {
      try {
        await upsertMyBid(input);
        return { success: true };
      } catch (error) {
        console.error('Error upserting bid:', error);
        throw new Error('Failed to upsert bid');
      }
    },

    mybidDelete: async (_: unknown, { mid }: { mid: number }) => {
      try {
        const success = await deleteMyBid(mid);
        return success;
      } catch (error) {
        console.error('Error deleting bid:', error);
        throw new Error('Failed to delete bid');
      }
    },

    noticeDetailsUpdate: async (_: unknown, { nid, input }: { nid: number; input: any }) => {
      try {
        const result = await updateNoticeDetails(nid, input);
        return result;
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
