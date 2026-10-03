/** Ordered onboarding steps; targets are CSS selectors on their destination pages. */
export const TOUR_STEPS = [
  { id: 'welcome', title: 'Welcome to GridFlex AI', description: "AI-powered energy savings and grid support. See how to save money, earn during peaks, and keep your building comfortable.", target: null, navigation: null, position: 'center', ctaText: 'Start Tour', skipText: 'Skip Tour', isStandalone: true },
  { id: 'dashboard', title: 'How Much Can You Shift?', description: 'This card shows your total power from enrolled buildings: capacity to support the grid during peak hours and earn money.', target: '#kpi-fleet-demand', navigation: '/dashboard', position: 'right', ctaText: 'Next' },
  { id: 'buildings', title: 'Where Is Your Energy Going?', description: "The chart shows consumption and solar generation. The efficiency badge helps reveal when a building is wasting energy.", target: '#energy-consumption-chart', navigation: '/buildings', position: 'bottom', ctaText: 'Next' },
  { id: 'retrofits', title: 'Save Money With AI Recommendations', description: 'GridFlex AI generates retrofit options with estimated savings, investment, and payback so you can choose the right improvements.', target: '#retrofit-card-1', navigation: '/retrofits', position: 'right', ctaText: 'Next' },
  { id: 'grid-operator', title: 'Earn Money Supporting the Grid', description: 'Shift flexible loads away from peak hours. Automated demand response helps the grid while keeping comfort in view.', target: '#peak-demand-alert', navigation: '/operator', position: 'bottom', ctaText: 'See Impact' },
  { id: 'simulation', title: 'GridFlex Keeps Things Running', description: 'Trigger a simulated solar cloud event and see how GridFlex responds to protect critical loads.', target: '#trigger-cloud-event-button', navigation: '/simulation', position: 'left', ctaText: 'See Results' },
  { id: 'completion', title: "You're Ready!", description: 'You have seen how GridFlex identifies energy waste, supports the grid, and responds to changing conditions. Use the ? button anytime to replay this tour.', target: null, navigation: '/dashboard', position: 'center', ctaText: 'Go to Dashboard', isStandalone: true },
];

export const getTourStep = (id) => TOUR_STEPS.find((step) => step.id === id) ?? null;
export const getTourStepByIndex = (index) => TOUR_STEPS[index] ?? null;
export const getTotalSteps = () => TOUR_STEPS.length;
