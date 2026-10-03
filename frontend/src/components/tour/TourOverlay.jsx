import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTourStore } from '../../store/tourStore';
import { getTourStepByIndex, getTotalSteps } from '../../constants/tourSteps';
import { useGridState } from '../../context/GridStateContext';

/** Accessible, responsive spotlight and dialog for the guided tour. */
export function TourOverlay() {
  const { currentStepIndex, isOpen, nextStep, skipTour, endTour } = useTourStore();
  const { triggerCloudEvent } = useGridState();
  const step = getTourStepByIndex(currentStepIndex);
  const [rect, setRect] = useState(null);
  const [targetMissing, setTargetMissing] = useState(false);
  const isLast = currentStepIndex === getTotalSteps() - 1;

  const measure = useCallback(() => {
    if (!step?.target) {
      setRect(null);
      setTargetMissing(false);
      return;
    }
    const element = document.querySelector(step.target);
    if (!element) {
      setRect(null);
      setTargetMissing(true);
      console.warn(`Tour target not found: ${step.target}`);
      return;
    }
    setTargetMissing(false);
    element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    const bounds = element.getBoundingClientRect();
    setRect({ top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height });
  }, [step]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = window.setTimeout(measure, 180);
    const observer = new ResizeObserver(measure);
    const target = step?.target ? document.querySelector(step.target) : null;
    if (target) observer.observe(target);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [isOpen, measure, step]);

  useEffect(() => {
    if (!isOpen || !targetMissing) return undefined;
    const timer = window.setTimeout(() => {
      if (currentStepIndex < getTotalSteps() - 1) nextStep();
      else endTour();
    }, 1200);
    return () => clearTimeout(timer);
  }, [currentStepIndex, endTour, isOpen, nextStep, targetMissing]);

  const advance = useCallback(() => {
    if (step?.id === 'simulation') triggerCloudEvent(79);
    if (isLast) endTour();
    else nextStep();
  }, [endTour, isLast, nextStep, step, triggerCloudEvent]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') endTour();
      if (event.key === 'ArrowRight') advance();
      if (event.key === 'ArrowLeft' && currentStepIndex > 0) useTourStore.setState({ currentStepIndex: currentStepIndex - 1 });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [advance, currentStepIndex, endTour, isOpen]);

  if (!isOpen || !step) return null;

  const popup = rect && !targetMissing ? (() => {
    const gap = 16;
    let top = rect.top + rect.height + gap;
    let left = rect.left;
    if (step.position === 'top') top = rect.top - 240 - gap;
    if (step.position === 'left') { top = rect.top; left = rect.left - 420 - gap; }
    if (step.position === 'right') { top = rect.top; left = rect.left + rect.width + gap; }
    left = Math.max(16, Math.min(left, window.innerWidth - 416));
    top = Math.max(16, Math.min(top, window.innerHeight - 260));
    return { top, left };
  })() : null;

  return createPortal(
    <div className="tour-root">
      <div className="tour-backdrop" />
      {rect && !targetMissing && <div className="tour-highlight" style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }} />}
      <section className={`tour-dialog${popup ? ' tour-dialog-positioned' : ''}`} style={popup || undefined} role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-description">
        <div className="tour-count">Step {currentStepIndex + 1} of {getTotalSteps()}</div>
        <h2 id="tour-title">{step.title}</h2>
        <p id="tour-description">{step.description}</p>
        {targetMissing && <p className="tour-notice">This item is not available on this screen. Continue to the next step.</p>}
        <div className="tour-actions">
          {step.skipText && <button className="tour-secondary" onClick={skipTour}>{step.skipText}</button>}
          <button className="tour-primary" onClick={advance}>{step.ctaText || (isLast ? 'Done' : 'Next')}</button>
        </div>
      </section>
      <style>{`
        .tour-root { position: fixed; inset: 0; z-index: 9999; pointer-events: none; font-family: 'DM Sans', sans-serif; }
        .tour-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.7); }
        .tour-highlight { position: fixed; z-index: 1; border: 3px solid #D4841A; border-radius: 8px; pointer-events: none; box-shadow: 0 0 0 9999px rgba(0,0,0,.7), 0 0 22px rgba(212,132,26,.7); animation: tour-pulse 1.5s infinite; }
        .tour-dialog { position: fixed; z-index: 2; top: 50%; left: 50%; transform: translate(-50%,-50%); box-sizing: border-box; width: min(400px, calc(100vw - 32px)); padding: 24px; border: 2px solid #D4841A; border-radius: 10px; background: #1A1A1A; color: #F5F1E8; box-shadow: 0 8px 32px rgba(0,0,0,.5); pointer-events: auto; animation: tour-fade .2s ease-out; }
        .tour-dialog-positioned { transform: none; }
        .tour-count { margin-bottom: 10px; color: #B8A992; font-size: 12px; }
        .tour-dialog h2 { margin: 0 0 12px; color: #D4841A; font: 600 20px 'Space Grotesk', sans-serif; }
        .tour-dialog p { margin: 0; font: 400 14px/1.6 'DM Sans', sans-serif; }
        .tour-dialog .tour-notice { margin-top: 12px; color: #F5C66A; }
        .tour-actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 22px; }
        .tour-actions button { border-radius: 6px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .tour-primary { margin-left: auto; border: 1px solid #D4841A; background: #D4841A; color: #111; }
        .tour-secondary { border: 1px solid #777; background: transparent; color: #F5F1E8; }
        @keyframes tour-pulse { 50% { box-shadow: 0 0 0 9999px rgba(0,0,0,.7), 0 0 30px rgba(212,132,26,.9); } }
        @keyframes tour-fade { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 640px) { .tour-dialog-positioned { top: auto !important; left: 16px !important; bottom: 16px; width: calc(100vw - 32px); } }
        @media (prefers-reduced-motion: reduce) { .tour-highlight { animation: none; } }
      `}</style>
    </div>,
    document.body,
  );
}
