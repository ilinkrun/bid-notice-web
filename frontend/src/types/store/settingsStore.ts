import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PrimaryColor = 'red' | 'blue' | 'green' | 'orange' | 'pink' | 'purple' | 'gray';

interface SettingsState {
  perPage: number;
  primaryColor: PrimaryColor;
  setPerPage: (perPage: number) => void;
  setPrimaryColor: (color: PrimaryColor) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      perPage: 20,
      primaryColor: 'red',
      setPerPage: (perPage) => set({ perPage }),
      setPrimaryColor: (color) => set({ primaryColor: color }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
