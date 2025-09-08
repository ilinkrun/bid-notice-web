import { Bid } from '@/types/bid';
import { BidFilter } from '@/store/bidFilterStore';
import { subDays } from 'date-fns';

export function filterBids(bids: Bid[], filter: BidFilter): Bid[] {
  return bids.filter((bid) => {
    // 카테고리 필터링
    if (filter.categories.length > 0 && !filter.categories.includes(bid.category || '')) {
      return false;
    }

    // 작성일 필터링
    if (filter.endDate) {
      const endDate = new Date(filter.endDate);
      const startDate = subDays(endDate, filter.period);
      const bidDate = new Date(bid.postedAt);
      if (bidDate < startDate || bidDate > endDate) {
        return false;
      }
    }

    // 시작일 필터링
    if (filter.startedEndDate) {
      const endDate = new Date(filter.startedEndDate);
      const startDate = subDays(endDate, filter.startedPeriod);
      const bidStartDate = new Date(bid.started_at);
      if (bidStartDate < startDate || bidStartDate > endDate) {
        return false;
      }
    }

    // 기관 필터링
    if (filter.excludedOrgs) {
      const excludedOrgList = filter.excludedOrgs.split(',').map((org) => org.trim());
      if (excludedOrgList.some((org) => bid.orgName.includes(org))) {
        return false;
      }
    }

    if (filter.includedOrgs) {
      const includedOrgList = filter.includedOrgs.split(',').map((org) => org.trim());
      if (!includedOrgList.some((org) => bid.orgName.includes(org))) {
        return false;
      }
    }

    // 지역 필터링
    if (filter.excludedRegions && bid.region) {
      const excludedRegionList = filter.excludedRegions.split(',').map((region) => region.trim());
      if (excludedRegionList.some((region) => bid.region?.includes(region))) {
        return false;
      }
    }

    if (filter.includedRegions && bid.region) {
      const includedRegionList = filter.includedRegions.split(',').map((region) => region.trim());
      if (!includedRegionList.some((region) => bid.region?.includes(region))) {
        return false;
      }
    }

    return true;
  });
} 