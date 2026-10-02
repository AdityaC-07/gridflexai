import React from 'react';
import { useTourStore } from '../../store/tourStore';
import { getTourStepByIndex, getTotalSteps } from '../../constants/tourSteps';

export const TourModal = () => {
  const { currentStepIndex, isOpen, nextStep, skipTour, endTour } = useTourStore();
  const step = getTourStepByIndex(currentStepIndex);
  const totalSteps = getTotalSteps();

  if (!isOpen || !step) return null;

  const isLastStep = currentStepIndex === totalSteps - 1;
  const isStandalone = step.isStandalone;

  const handleNext = () => {
    if (isLastStep) {
      endTour();
    } else {
      nextStep();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: '#1A1A1A',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '500px',
          color: '#F5F1E8',
          border: '1px solid #D4841A',
        }}
      >
        <h2 style={{ color: '#D4841A', marginBottom: '0.5rem' }}>{step.title}</h2>
        {step.subtitle && (
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>{step.subtitle}</h3>
        )}
        {step.description && <p style={{ marginBottom: '1rem' }}>{step.description}</p>}
        {step.bullets && (
          <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
            {step.bullets.map((bullet, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>
                {bullet}
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          {!isStandalone && (
            <button
              onClick={skipTour}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid #666',
                color: '#F5F1E8',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Skip Tour
            </button>
          )}
          {isStandalone && step.skipText && (
            <button
              onClick={skipTour}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid #666',
                color: '#F5F1E8',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {step.skipText}
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#D4841A',
              border: 'none',
              color: '#0F0F0F',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {isLastStep ? 'End Tour' : step.ctaText || 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
