import { Settings } from '../types';
import { useBusinessStore } from './businessStore';
import { useUiStore } from './uiStore';

// Adapter hook maintaining seamless backward compatibility and reactive updates
export interface SettingsState {
  settings: Settings;
  theme: 'light' | 'dark';
  updateSettings: (newSettings: Partial<Settings>) => void;
  updateBusiness: (business: Partial<Settings['business']>) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  resetSettings: () => void;
}

export const useSettingsStore = (): SettingsState => {
  const biz = useBusinessStore((state) => {
    return (
      state.businesses.find((b) => b.id === state.activeBusinessId) ||
      state.businesses[0]
    );
  });
  const theme = useUiStore((state) => state.theme);

  return {
    settings: {
      ...biz,
      business: {
        name: biz.name,
        email: biz.email,
        phone: biz.phone,
        address: biz.address,
        website: biz.website,
        taxId: biz.taxId,
        bankDetails: biz.bankDetails,
        logo: biz.logo,
      },
    } as Settings,
    theme,
    updateSettings: (newSettings) => {
      const { business, ...rest } = newSettings;
      useBusinessStore.getState().updateActiveBusiness({
        ...rest,
        ...(business || {}),
      });
    },
    updateBusiness: (business) => {
      useBusinessStore.getState().updateActiveBusiness(business);
    },
    setTheme: (t) => {
      useUiStore.getState().setTheme(t);
    },
    toggleTheme: () => {
      useUiStore.getState().toggleTheme();
    },
    resetSettings: () => {
      useBusinessStore.getState().resetToDefault();
    },
  };
};
