import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BidFilter {
  categories: string[];
  endDate: Date | null;
  period: number;
  startedEndDate: Date | null;
  startedPeriod: number;
  excludedOrgs: string;
  includedOrgs: string;
  excludedRegions: string;
  includedRegions: string;
}

interface BidFilterState {
  filter: BidFilter;
  setFilter: (filter: BidFilter) => void;
  resetFilter: () => void;
}

const initialFilter: BidFilter = {
  categories: [],
  endDate: null,
  period: 14,
  startedEndDate: null,
  startedPeriod: 14,
  excludedOrgs: '',
  includedOrgs: '',
  excludedRegions: '',
  includedRegions: '',
};

export const useBidFilterStore = create<BidFilterState>()(
  persist(
    (set) => ({
      filter: initialFilter,
      setFilter: (filter) => set({ filter }),
      resetFilter: () => set({ filter: initialFilter }),
    }),
    {
      name: 'bid-filter',
    }
  )
); 