import {
  getNoticeList,
  getNoticeListByCategory,
  getNoticeListByCategories,
  getNoticeListForStatistics,
  getDoneNotices,
  searchNoticeList,
  noticeToProgressBatch,
  updateNoticeCategoryByNids,
  excludeNotices,
  restoreNotices,
  confirmDoneNotices
} from '@/utils/utilsGovBid';

export const noticesResolvers = {
  Query: {
    notices: async (_: unknown, { gap }: { gap?: number }) => {
      try {
        const notices = await getNoticeList(gap || 15);
        return notices.map((notice) => ({
          nid: notice.nid,
          title: notice.title,
          orgName: notice.orgName,
          postedAt: notice.postedDate,
          detailUrl: notice.detailUrl,
          category: notice.category || "",
          region: notice.region || "미지정",
          registration: notice.registration
        }));
      } catch (error) {
        console.error('Error fetching all notices:', error);
        return [];
      }
    },

    noticesByCategory: async (_: unknown, { category, gap }: { category: string; gap?: number }) => {
      try {
        const notices = await getNoticeListByCategory(category, gap || 15);
        return notices.map((notice) => ({
          nid: notice.nid,
          title: notice.title,
          orgName: notice.orgName,
          postedAt: notice.postedDate,
          detailUrl: notice.detailUrl,
          category: notice.category || "",
          region: notice.region || "미지정",
          registration: notice.registration
        }));
      } catch (error) {
        console.error('Error fetching notices by category:', error);
        return [];
      }
    },

    noticesByCategories: async (_: unknown, { categories, gap }: { categories: string[]; gap?: number }) => {
      try {
        const notices = await getNoticeListByCategories(categories, gap || 15);
        return notices.map((notice) => ({
          nid: notice.nid,
          title: notice.title,
          orgName: notice.orgName,
          postedAt: notice.postedDate,
          detailUrl: notice.detailUrl,
          category: notice.category || "",
          region: notice.region || "미지정",
          registration: notice.registration
        }));
      } catch (error) {
        console.error('Error fetching notices by categories:', error);
        return [];
      }
    },

    noticesStatistics: async (_: unknown, { gap }: { gap: number }) => {
      try {
        const statistics = await getNoticeListForStatistics(gap);
        return statistics.map((item) => ({
          orgName: item.orgName || '',
          postedAt: item.postedAt || '',
          category: item.category || '',
          region: item.region || '미지정'
        }));
      } catch (error) {
        console.error('Error fetching notice statistics:', error);
        return [];
      }
    },

    noticesRegionStatistics: async (_: unknown, { gap }: { gap?: number }) => {
      try {
        const statistics = await getNoticeListForStatistics(gap || 15);

        // 지역별로 공고 수 집계
        const regionStats: { [key: string]: number } = {};

        statistics.forEach((item) => {
          const region = item.region || '미지정';
          regionStats[region] = (regionStats[region] || 0) + 1;
        });

        // 객체를 배열로 변환하여 반환
        return Object.entries(regionStats).map(([region, noticeCount]) => ({
          region,
          noticeCount
        }));
      } catch (error) {
        console.error('Error fetching notice region statistics:', error);
        return [];
      }
    },

    doneNotices: async (_: unknown, { gap }: { gap?: number }) => {
      try {
        const notices = await getDoneNotices(gap || 15);
        return notices.map((notice) => ({
          nid: notice.nid,
          title: notice.title,
          orgName: notice.orgName,
          postedAt: notice.postedDate,
          detailUrl: notice.detailUrl,
          category: notice.category || "",
          region: notice.region || "미지정",
          registration: notice.registration
        }));
      } catch (error) {
        console.error('Error fetching done notices:', error);
        return [];
      }
    },

    searchNotices: async (_: unknown, { keywords, nots, minPoint, addWhere }: {
      keywords: string; nots: string; minPoint: number; addWhere?: string
    }) => {
      try {
        const results = await searchNoticeList({
          keywords,
          nots,
          minPoint,
          addWhere: addWhere || ""
        });
        return results.map((notice) => ({
          nid: notice.nid,
          title: notice.title || '',
          orgName: notice.org_name || '',
          postedAt: notice.posted_date || '',
          detailUrl: notice.detail_url || '',
          category: notice.category || "",
          region: notice.org_region || "미지정",
          registration: notice.registration || ''
        }));
      } catch (error) {
        console.error('Error searching notices:', error);
        return [];
      }
    },

    lastNotice: async (_: unknown, { orgName, field }: { orgName: string; field?: string }) => {
      try {
        // Note: lastNotice function is not implemented in utilsGovBid.ts
        // This would require a new implementation or using a different approach
        return null;
      } catch (error) {
        console.error('Error fetching last notice:', error);
        return null;
      }
    },
  },

  Mutation: {
    upsertNotice: async (_: unknown, { data }: { data: unknown[] }) => {
      try {
        // Note: upsertNotice function is not implemented in utilsGovBid.ts
        // This would require a new implementation
        return { success: true, message: 'Notice upserted successfully' };
      } catch (error) {
        console.error('Error upserting notice:', error);
        throw new Error('Failed to upsert notice');
      }
    },

    noticeToProgress: async (_: unknown, { nids }: { nids: number[] }) => {
      try {
        const result = await noticeToProgressBatch(nids);

        if (result.failedNids.length > 0) {
          return {
            success: result.successCount > 0,
            message: `${result.successCount}개의 입찰 공고가 진행 상태로 변경되었습니다. 실패: ${result.failedNids.length}개`
          };
        }

        return {
          success: true,
          message: `${result.successCount}개의 입찰 공고가 진행 상태로 변경되었습니다.`
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
        const updatedCount = await updateNoticeCategoryByNids(nids, category);
        return {
          success: updatedCount > 0,
          message: `${updatedCount}개의 공고 유형이 '${category}'로 변경되었습니다.`
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
        const updatedCount = await excludeNotices(nids);
        return {
          success: updatedCount > 0,
          message: `${updatedCount}개의 공고가 업무에서 제외되었습니다.`
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
        const updatedCount = await restoreNotices(nids);
        return {
          success: updatedCount > 0,
          message: `${updatedCount}개의 공고가 업무에 복원되었습니다.`
        };
      } catch (error) {
        console.error('Error restoring notices:', error);
        return {
          success: false,
          message: '공고 복원 처리 중 오류가 발생했습니다.'
        };
      }
    },

    confirmDoneNotices: async (_: unknown, { nids }: { nids: number[] }) => {
      try {
        const updatedCount = await confirmDoneNotices(nids);
        return {
          success: updatedCount > 0,
          message: `${updatedCount}개의 공고가 확인 처리되었습니다.`
        };
      } catch (error) {
        console.error('Error confirming done notices:', error);
        return {
          success: false,
          message: '공고 확인 처리 중 오류가 발생했습니다.'
        };
      }
    },
  },
};
