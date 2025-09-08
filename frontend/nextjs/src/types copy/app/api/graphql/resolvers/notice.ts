import { apiClient } from '@/lib/api/backendClient';

interface NoticeData {
  nid: string;
  title: string;
  org_name: string;
  posted_date: string;
  detail_url: string;
  category?: string;
  카테고리?: string;
  org_region?: string;
  registration?: string;
}

interface StatisticsData {
  org_name?: string;
  orgName?: string;
  posted_date?: string;
  postedAt?: string;
  category?: string;
  카테고리?: string;
  org_region?: string;
  region?: string;
  지역?: string;
}

export const noticeResolvers = {
  Query: {
    noticesByCategory: async (_: unknown, { category, gap }: { category: string; gap: number }) => {
      try {
        const response = await apiClient.get(`/notice_list/${category}`, { params: { gap } });
        return response.data.map((notice: NoticeData) => ({
          nid: parseInt(notice.nid),
          title: notice.title,
          orgName: notice.org_name,
          postedAt: notice.posted_date,
          detailUrl: notice.detail_url,
          category: notice.category || notice.카테고리 || "",
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
        const response = await apiClient.get('/notice_list', { params: { gap } });
        return response.data.map((notice: NoticeData) => ({
          nid: parseInt(notice.nid),
          title: notice.title,
          orgName: notice.org_name,
          postedAt: notice.posted_date,
          detailUrl: notice.detail_url,
          category: notice.category || notice.카테고리 || "",
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
        const response = await apiClient.get('/notice_list_statistics', { params: { gap } });
        return response.data.map((item: StatisticsData) => ({
          orgName: item.org_name || item.orgName || '',
          postedAt: item.posted_date || item.postedAt || '',
          category: item.category || item.카테고리 || '',
          region: item.org_region || item.region || item.지역 || '미지정'
        }));
      } catch (error) {
        console.error('Error fetching notice statistics:', error);
        return [];
      }
    },

    searchNotices: async (_: unknown, { keywords, nots, minPoint, addWhere }: {
      keywords: string; nots: string; minPoint: number; addWhere?: string
    }) => {
      try {
        const response = await apiClient.post('/search_notice_list', {
          keywords,
          nots,
          min_point: minPoint,
          add_where: addWhere || "",
          base_sql: "",
          add_sql: ""
        });
        return response.data.map((notice: NoticeData) => ({
          nid: parseInt(notice.nid),
          title: notice.title,
          orgName: notice.org_name,
          postedAt: notice.posted_date,
          detailUrl: notice.detail_url,
          category: notice.category || "",
          region: notice.org_region || "미지정",
          registration: notice.registration
        }));
      } catch (error) {
        console.error('Error searching notices:', error);
        return [];
      }
    },

    lastNotice: async (_: unknown, { orgName, field }: { orgName: string; field?: string }) => {
      try {
        const response = await apiClient.get(`/last_notice/${orgName}`, {
          params: { field: field || 'title' }
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching last notice:', error);
        return null;
      }
    },
  },

  Mutation: {
    upsertNotice: async (_: unknown, { data }: { data: unknown[] }) => {
      try {
        const response = await apiClient.post('/notice_list', data);
        return response.data;
      } catch (error) {
        console.error('Error upserting notice:', error);
        throw new Error('Failed to upsert notice');
      }
    },

    noticeToProgress: async (_: unknown, { nids }: { nids: number[] }) => {
      try {
        const response = await apiClient.post('/notice_to_progress', { nids });
        return {
          success: response.data.success || true,
          message: response.data.message || `${nids.length}개의 입찰 공고가 진행 상태로 변경되었습니다.`
        };
      } catch (error) {
        console.error('Error processing notice to progress:', error);
        return {
          success: false,
          message: '입찰 공고 진행 처리 중 오류가 발생했습니다.'
        };
      }
    },

    updateNoticeCategory: async (_: unknown, { nids, category }: { nids: number[]; category: string }) => {
      try {
        // server_bid.py (포트 11303)로 요청 전송
        const response = await apiClient.post('/update_notice_category', { 
          nids: nids, 
          category 
        });
        return {
          success: response.data.success || true,
          message: response.data.message || `${nids.length}개의 공고 유형이 '${category}'로 변경되었습니다.`
        };
      } catch (error) {
        console.error('Error updating notice category:', error);
        return {
          success: false,
          message: '공고 유형 변경 중 오류가 발생했습니다.'
        };
      }
    },

    excludeNotices: async (_: unknown, { nids }: { nids: number[] }) => {
      try {
        // server_bid.py로 is_selected=-1 업데이트 요청
        const response = await apiClient.post('/exclude_notices', { 
          nids: nids
        });
        return {
          success: response.data.success || true,
          message: response.data.message || `${nids.length}개의 공고가 업무에서 제외되었습니다.`
        };
      } catch (error) {
        console.error('Error excluding notices:', error);
        return {
          success: false,
          message: '공고 제외 처리 중 오류가 발생했습니다.'
        };
      }
    },

    restoreNotices: async (_: unknown, { nids }: { nids: number[] }) => {
      try {
        // server_bid.py로 is_selected=0 업데이트 요청
        const response = await apiClient.post('/restore_notices', { 
          nids: nids
        });
        return {
          success: response.data.success || true,
          message: response.data.message || `${nids.length}개의 공고가 업무에 복원되었습니다.`
        };
      } catch (error) {
        console.error('Error restoring notices:', error);
        return {
          success: false,
          message: '공고 복원 처리 중 오류가 발생했습니다.'
        };
      }
    },
  },
};
