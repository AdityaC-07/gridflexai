import React, { useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTourStore } from '../store/tourStore';
import { getTourStepByIndex } from '../constants/tourSteps';

const TourContext = createContext(null);

/**
 * Tour Provider - manages tour state and auto-start
 */
export const TourProvider = ({ children }) => {
  const navigate = useNavigate();
  const {
    currentStepIndex,
    isOpen,
    isCompleted,
    hasSeenOnboarding,
    startTour,
    nextStep,
    skipTour,
    endTour,
    resetTour,
    setHasSeenOnboarding,
  } = useTourStore();

  // Start onboarding once on first visit. The flag is persisted by the store.
  useEffect(() => {
    if (!hasSeenOnboarding) {
      startTour();
    }
  }, [hasSeenOnboarding, startTour]);

  // Handle navigation when step changes
  useEffect(() => {
    if (!isOpen) return;
    const step = getTourStepByIndex(currentStepIndex);
    if (step?.navigation) {
      navigate(step.navigation);
    }
  }, [currentStepIndex, isOpen, navigate]);

  const value = {
    currentStepIndex,
    isOpen,
    isCompleted,
    hasSeenOnboarding,
    currentStep: getTourStepByIndex(currentStepIndex),
    startTour,
    nextStep,
    skipTour,
    endTour,
    resetTour,
    setHasSeenOnboarding,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};

/**
 * Hook to access tour state
 */
export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

/**
 * Hook to handle tour navigation
 */
export const useTourNavigation = () => {
  const navigate = useNavigate();
  const { currentStepIndex, isOpen } = useTourStore();

  useEffect(() => {
    if (!isOpen) return;
    const step = getTourStepByIndex(currentStepIndex);
    if (step?.navigation) {
      navigate(step.navigation);
    }
  }, [currentStepIndex, isOpen, navigate]);

  return { navigateToPage: navigate };
};

export default TourContext;
