import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings } from '../types';
import { SAMPLE_SETTINGS, SAMPLE_LOGO_DATA_URI } from './sampleData';

interface SettingsState {
  settings: Settings;
  theme: 'light' | 'dark';
  updateSettings: (newSettings: Partial<Settings>) => void;
  updateBusiness: (business: Partial<Settings['business']>) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        ...SAMPLE_SETTINGS,
        business: {
          ...SAMPLE_SETTINGS.business,
          logo: SAMPLE_LOGO_DATA_URI,
        },
      },
      theme: 'light',
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      updateBusiness: (business) =>
        set((state) => ({
          settings: {
            ...state.settings,
            business: { ...state.settings.business, ...business },
          },
        })),
      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        set({ theme });
      },
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'light' ? 'dark' : 'light';
          if (typeof document !== 'undefined') {
            if (next === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
          return { theme: next };
        }),
      resetSettings: () =>
        set({
          settings: {
            ...SAMPLE_SETTINGS,
            business: {
              ...SAMPLE_SETTINGS.business,
              logo: SAMPLE_LOGO_DATA_URI,
            },
          },
        }),
    }),
    {
      name: 'Egolepay-settings',
    }
  )
);
