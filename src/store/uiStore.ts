import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ModalType = 'upgrade' | 'search' | 'quickCreate' | 'payment' | null;

interface UiState {
  // Navigation & Drawer
  isSidebarOpen: boolean;
  activeNavigation: string;

  // Modals & Overlays
  activeModal: ModalType;
  modalPayload?: any;

  // Loading indicator
  globalLoading: boolean;

  // Theme preference
  theme: 'light' | 'dark';

  // Actions
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setActiveNavigation: (nav: string) => void;
  openModal: (modal: ModalType, payload?: any) => void;
  closeModal: () => void;
  setGlobalLoading: (loading: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      isSidebarOpen: false,
      activeNavigation: '/',
      activeModal: null,
      modalPayload: null,
      globalLoading: false,
      theme: 'light',

      openSidebar: () => set({ isSidebarOpen: true }),
      closeSidebar: () => set({ isSidebarOpen: false }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      setActiveNavigation: (nav) => set({ activeNavigation: nav }),

      openModal: (modal, payload) => set({ activeModal: modal, modalPayload: payload }),
      closeModal: () => set({ activeModal: null, modalPayload: null }),

      setGlobalLoading: (loading) => set({ globalLoading: loading }),

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

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        if (typeof document !== 'undefined') {
          if (next === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        set({ theme: next });
      },
    }),
    {
      name: 'egolepay-ui',
      partialize: (state) => ({ theme: state.theme }), // Only persist theme, avoid persisting transient modal states
    }
  )
);

