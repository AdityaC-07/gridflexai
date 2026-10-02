import React, { useEffect } from 'react';
import { useTourStore } from '../store/tourStore';

export const TourProvider = ({ children }) => {
  const { hasSeenOnboarding, startTour, setHasSeenOnboarding } = useTourStore();

  useEffect(() => {
    if (!hasSeenOnboarding) {
      startTour();
    }
  }, [hasSeenOnboarding, startTour]);

  return <>{children}</>;
};
