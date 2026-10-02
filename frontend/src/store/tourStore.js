import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTourStore = create(
  persist(
    (set, get) => ({
      currentStepIndex: 0,
      isOpen: false,
      isCompleted: false,
      hasSeenOnboarding: false,
      startTour: () => {
        set({ isOpen: true, currentStepIndex: 0, isCompleted: false });
      },
      nextStep: () => {
        const { currentStepIndex } = get();
        set({ currentStepIndex: currentStepIndex + 1 });
      },
      skipTour: () => {
        set({ isCompleted: true, isOpen: false, hasSeenOnboarding: true });
      },
      endTour: () => {
        set({ isOpen: false, isCompleted: true, hasSeenOnboarding: true });
      },
      resetTour: () => {
        set({ currentStepIndex: 0, isOpen: true, isCompleted: false });
      },
      setHasSeenOnboarding: (value) => {
        set({ hasSeenOnboarding: value });
      },
    }),
    {
      name: 'gridflex-tour',
      partialize: (state) => ({ hasSeenOnboarding: state.hasSeenOnboarding }),
    }
  )
);
