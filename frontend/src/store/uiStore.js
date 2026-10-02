import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set, get) => ({
      modals: {
        aiAnalysisOpen: false,
        retrofitDetailOpen: false,
        confirmOpen: false,
      },
      notifications: [],
      theme: 'dark',
      sidebarOpen: true,
      loading: false,
      openModal: (name) => {
        set((state) => ({
          modals: { ...state.modals, [name]: true },
        }));
      },
      closeModal: (name) => {
        set((state) => ({
          modals: { ...state.modals, [name]: false },
        }));
      },
      addNotification: (type, message, timeout = 5000) => {
        const id = Date.now();
        set((state) => ({
          notifications: [...state.notifications, { id, type, message }],
        }));
        setTimeout(() => {
          get().removeNotification(id);
        }, timeout);
      },
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        }));
      },
      toggleSidebar: () => {
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        }));
      },
      setLoading: (loading) => {
        set({ loading });
      },
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen }),
    }
  )
);
