import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NoticeFilter {
  categories: string[];
  endDate: Date | null;
  period: number;
  scrapEndDate: Date | null;
  scrapPeriod: number;
  excludedOrgs: string;
  includedOrgs: string;
  excludedRegions: string;
  includedRegions: string;
}

interface NoticeFilterState {
  filter: NoticeFilter;
  setFilter: (filter: NoticeFilter) => void;
  resetFilter: () => void;
}

const initialFilter: NoticeFilter = {
  categories: [],
  endDate: null,
  period: 14,
  scrapEndDate: null,
  scrapPeriod: 14,
  excludedOrgs: '',
  includedOrgs: '',
  excludedRegions: '',
  includedRegions: '',
};

export const useNoticeFilterStore = create<NoticeFilterState>()(
  persist(
    (set) => ({
      filter: initialFilter,
      setFilter: (filter) => set({ filter }),
      resetFilter: () => set({ filter: initialFilter }),
    }),
    {
      name: 'notice-filter',
    }
  )
);
