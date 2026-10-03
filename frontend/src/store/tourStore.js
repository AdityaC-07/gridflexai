import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'gridflex-tour';
const initialPersisted = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { hasSeenOnboarding: saved.hasSeenOnboarding ?? saved.state?.hasSeenOnboarding ?? false };
  }
  catch { return {}; }
})();

let state = {
  currentStepIndex: 0,
  isOpen: false,
  isCompleted: false,
  hasSeenOnboarding: Boolean(initialPersisted.hasSeenOnboarding),
};
const listeners = new Set();

const setState = (update) => {
  state = { ...state, ...(typeof update === 'function' ? update(state) : update) };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ hasSeenOnboarding: state.hasSeenOnboarding })); }
  catch { /* Storage can be disabled; tour remains usable for this session. */ }
  listeners.forEach((listener) => listener());
};

const actions = {
  startTour: () => setState({ isOpen: true, currentStepIndex: 0, isCompleted: false }),
  nextStep: () => setState((current) => ({ currentStepIndex: current.currentStepIndex + 1 })),
  skipTour: () => setState({ isCompleted: true, isOpen: false, hasSeenOnboarding: true }),
  endTour: () => setState({ isOpen: false, isCompleted: true, hasSeenOnboarding: true }),
  resetTour: () => setState({ currentStepIndex: 0, isOpen: true, isCompleted: false }),
  setHasSeenOnboarding: (value) => setState({ hasSeenOnboarding: value }),
};

/** Tiny selector store for onboarding state, persisted under the documented key. */
export function useTourStore(selector = (value) => value) {
  const snapshot = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => state,
    () => state,
  );
  return { ...selector(snapshot), ...actions };
}

useTourStore.getState = () => ({ ...state, ...actions });
useTourStore.setState = setState;
