import { Notice } from '@/types/notice';
import { NoticeFilter } from '@/store/noticeFilterStore';
import { subDays } from 'date-fns';

export function filterNotices(notices: Notice[], filter: NoticeFilter): Notice[] {
  return notices.filter((notice) => {
    // 카테고리 필터링
    if (filter.categories.length > 0 && !filter.categories.includes(notice.category || '')) {
      return false;
    }

    // 작성일 필터링
    if (filter.endDate) {
      const endDate = new Date(filter.endDate);
      const startDate = subDays(endDate, filter.period);
      const noticeDate = new Date(notice.postedAt || notice.작성일);
      if (noticeDate < startDate || noticeDate > endDate) {
        return false;
      }
    }

    // 스크랩일 필터링 (스크랩 기능이 구현되어 있다고 가정)
    if (filter.scrapEndDate && notice.scrapDate) {
      const endDate = new Date(filter.scrapEndDate);
      const startDate = subDays(endDate, filter.scrapPeriod);
      const scrapDate = new Date(notice.scrapDate);
      if (scrapDate < startDate || scrapDate > endDate) {
        return false;
      }
    }

    // 기관 필터링
    if (filter.excludedOrgs) {
      const excludedOrgList = filter.excludedOrgs.split(',').map((org) => org.trim());
      const orgName = notice.orgName || notice.기관명;
      if (excludedOrgList.some((org) => orgName?.includes(org))) {
        return false;
      }
    }

    if (filter.includedOrgs) {
      const includedOrgList = filter.includedOrgs.split(',').map((org) => org.trim());
      const orgName = notice.orgName || notice.기관명;
      if (!includedOrgList.some((org) => orgName?.includes(org))) {
        return false;
      }
    }

    // 지역 필터링
    if (filter.excludedRegions && notice.region) {
      const excludedRegionList = filter.excludedRegions.split(',').map((region) => region.trim());
      if (excludedRegionList.some((region) => notice.region?.includes(region))) {
        return false;
      }
    }

    if (filter.includedRegions && notice.region) {
      const includedRegionList = filter.includedRegions.split(',').map((region) => region.trim());
      if (!includedRegionList.some((region) => notice.region?.includes(region))) {
        return false;
      }
    }

    return true;
  });
}
