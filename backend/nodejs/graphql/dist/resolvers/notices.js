import { apiClient, mysqlApiClient } from '@/lib/api/backendClient';
export const noticesResolvers = {
    Query: {
        noticesAll: async (_, { gap }) => {
            try {
                const response = await apiClient.get('/notice_list', { params: { gap: gap || 15 } });
                return response.data.map((notice) => ({
                    nid: parseInt(notice.nid),
                    title: notice.title,
                    orgName: notice.org_name,
                    postedAt: notice.posted_date,
                    detailUrl: notice.detail_url,
                    category: notice.category || notice.카테고리 || "",
                    region: notice.org_region || "미지정",
                    registration: notice.registration
                }));
            }
            catch (error) {
                console.error('Error fetching all notices:', error);
                return [];
            }
        },
        noticesByCategory: async (_, { category, gap }) => {
            try {
                const response = await apiClient.get(`/notice_list/${category}`, { params: { gap: gap || 15 } });
                return response.data.map((notice) => ({
                    nid: parseInt(notice.nid),
                    title: notice.title,
                    orgName: notice.org_name,
                    postedAt: notice.posted_date,
                    detailUrl: notice.detail_url,
                    category: notice.category || notice.카테고리 || "",
                    region: notice.org_region || "미지정",
                    registration: notice.registration
                }));
            }
            catch (error) {
                console.error('Error fetching notices by category:', error);
                return [];
            }
        },
        noticesStatistics: async (_, { gap }) => {
            try {
                const response = await apiClient.get('/notice_list_statistics', { params: { gap } });
                return response.data.map((item) => ({
                    orgName: item.org_name || item.orgName || '',
                    postedAt: item.posted_date || item.postedAt || '',
                    category: item.category || item.카테고리 || '',
                    region: item.org_region || item.region || item.지역 || '미지정'
                }));
            }
            catch (error) {
                console.error('Error fetching notice statistics:', error);
                return [];
            }
        },
        noticesRegionStatistics: async (_, { gap }) => {
            try {
                const response = await apiClient.get('/notice_list_statistics', { params: { gap: gap || 15 } });
                // 지역별로 공고 수 집계
                const regionStats = {};
                response.data.forEach((item) => {
                    const region = item.org_region || item.region || item.지역 || '미지정';
                    regionStats[region] = (regionStats[region] || 0) + 1;
                });
                // 객체를 배열로 변환하여 반환
                return Object.entries(regionStats).map(([region, noticeCount]) => ({
                    region,
                    noticeCount
                }));
            }
            catch (error) {
                console.error('Error fetching notice region statistics:', error);
                return [];
            }
        },
        noticesSearch: async (_, { keywords, nots, minPoint, addWhere }) => {
            try {
                const response = await apiClient.post('/search_notice_list', {
                    keywords,
                    nots,
                    min_point: minPoint,
                    add_where: addWhere || "",
                    base_sql: "",
                    add_sql: ""
                });
                return response.data.map((notice) => ({
                    nid: parseInt(notice.nid),
                    title: notice.title,
                    orgName: notice.org_name,
                    postedAt: notice.posted_date,
                    detailUrl: notice.detail_url,
                    category: notice.category || "",
                    region: notice.org_region || "미지정",
                    registration: notice.registration
                }));
            }
            catch (error) {
                console.error('Error searching notices:', error);
                return [];
            }
        },
        noticesOne: async (_, { orgName, field }) => {
            try {
                const response = await apiClient.get(`/last_notice/${orgName}`, {
                    params: { field: field || 'title' }
                });
                return response.data;
            }
            catch (error) {
                console.error('Error fetching last notice:', error);
                return null;
            }
        },
    },
    Mutation: {
        noticesUpsert: async (_, { data }) => {
            try {
                const response = await apiClient.post('/notice_list', data);
                return response.data;
            }
            catch (error) {
                console.error('Error upserting notice:', error);
                throw new Error('Failed to upsert notice');
            }
        },
        noticesUpdateToProgress: async (_, { nids }) => {
            try {
                const response = await apiClient.post('/notice_to_progress', { nids });
                return {
                    success: response.data.success || true,
                    message: response.data.message || `${nids.length}개의 입찰 공고가 진행 상태로 변경되었습니다.`
                };
            }
            catch (error) {
                console.error('Error processing notice to progress:', error);
                return {
                    success: false,
                    message: '입찰 공고 진행 처리 중 오류가 발생했습니다.'
                };
            }
        },
        noticesUpdateCategory: async (_, { nids, category }) => {
            try {
                const response = await mysqlApiClient.post('/update_notice_category', {
                    nids: nids,
                    category
                });
                return {
                    success: response.data.success || true,
                    message: response.data.message || `${nids.length}개의 공고 유형이 '${category}'로 변경되었습니다.`
                };
            }
            catch (error) {
                console.error('Error updating notice category:', error);
                return {
                    success: false,
                    message: '공고 유형 변경 중 오류가 발생했습니다.'
                };
            }
        },
        noticesExclude: async (_, { nids }) => {
            try {
                const response = await apiClient.post('/exclude_notices', {
                    nids: nids
                });
                return {
                    success: response.data.success || true,
                    message: response.data.message || `${nids.length}개의 공고가 업무에서 제외되었습니다.`
                };
            }
            catch (error) {
                console.error('Error excluding notices:', error);
                return {
                    success: false,
                    message: '공고 제외 처리 중 오류가 발생했습니다.'
                };
            }
        },
        noticesRestore: async (_, { nids }) => {
            try {
                const response = await apiClient.post('/restore_notices', {
                    nids: nids
                });
                return {
                    success: response.data.success || true,
                    message: response.data.message || `${nids.length}개의 공고가 업무에 복원되었습니다.`
                };
            }
            catch (error) {
                console.error('Error restoring notices:', error);
                return {
                    success: false,
                    message: '공고 복원 처리 중 오류가 발생했습니다.'
                };
            }
        },
    },
};
//# sourceMappingURL=notices.js.map