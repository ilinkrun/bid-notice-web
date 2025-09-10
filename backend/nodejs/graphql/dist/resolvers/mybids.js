import { apiClient } from '@/lib/api/backendClient';
export const mybidsResolvers = {
    Query: {
        mybidsAll: async () => {
            try {
                const response = await apiClient.get('/my_bids');
                return response.data.map((bd) => ({
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
            }
            catch (error) {
                console.error('Error fetching all bids:', error);
                return [];
            }
        },
        mybidsByStatus: async (_, { status }) => {
            try {
                const response = await apiClient.get(`/my_bids/${status}`);
                return response.data.map((bd) => ({
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
            }
            catch (error) {
                console.error('Error fetching bids by status:', error);
                return [];
            }
        },
        mybidsOne: async (_, { nid }) => {
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
            }
            catch (error) {
                console.error('Error fetching bid by nid:', error);
                return null;
            }
        },
    },
    Mutation: {
        mybidCreate: async (_, { input }) => {
            try {
                const response = await apiClient.post('/my_bids', input);
                return response.data;
            }
            catch (error) {
                console.error('Error creating bid:', error);
                throw new Error('Failed to create bid');
            }
        },
        mybidUpdate: async (_, { input }) => {
            try {
                const response = await apiClient.put(`/my_bids/${input.mid}`, input);
                return response.data;
            }
            catch (error) {
                console.error('Error updating bid:', error);
                throw new Error('Failed to update bid');
            }
        },
        mybidUpsert: async (_, { input }) => {
            try {
                const response = await apiClient.post('/my_bids/upsert', input);
                return response.data;
            }
            catch (error) {
                console.error('Error upserting bid:', error);
                throw new Error('Failed to upsert bid');
            }
        },
        mybidDelete: async (_, { mid }) => {
            try {
                // TODO: Implement bid deletion API call
                await apiClient.delete(`/my_bids/${mid}`);
                return true;
            }
            catch (error) {
                console.error('Error deleting bid:', error);
                throw new Error('Failed to delete bid');
            }
        },
    },
};
//# sourceMappingURL=mybids.js.map