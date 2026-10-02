export const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to GridFlex AI',
    subtitle: 'AI-powered energy savings & grid support',
    bullets: [
      'Identify 25% energy waste in your building',
      'Earn money during peak demand periods',
      'Maintain comfort while supporting the grid',
    ],
    target: null,
    position: 'center',
    navigation: null,
    action: null,
    ctaText: 'Start Tour',
    skipText: 'Skip Tour',
    isStandalone: true,
  },
  {
    id: 'dashboard',
    title: 'How Much Can You Shift?',
    description: 'See the total power from all enrolled buildings. This is your capacity to support the grid during peak hours.',
    target: '#total-fleet-demand',
    position: 'right',
    navigation: '/dashboard',
    action: null,
    ctaText: 'Next',
  },
  {
    id: 'buildings',
    title: 'Where Is Your Energy Going?',
    description: 'This chart shows real-time consumption and your solar. The efficiency badge shows if you are wasting energy compared to similar buildings.',
    target: '#energy-chart',
    position: 'left',
    navigation: '/buildings',
    action: null,
    ctaText: 'Next',
  },
  {
    id: 'retrofits',
    title: 'Save Money With AI Recommendations',
    description: 'GridFlex AI analyzed your building and generated retrofit options with ROI calculated.',
    target: '#retrofit-card',
    position: 'left',
    navigation: '/retrofits',
    action: null,
    ctaText: 'Next',
  },
  {
    id: 'grid-operator',
    title: 'Earn Money Supporting the Grid',
    description: 'When the grid is stressed, you can shift flexible loads to off-peak hours while maintaining comfort.',
    target: '#peak-alert',
    position: 'right',
    navigation: '/operator',
    action: null,
    ctaText: 'See Impact',
  },
];

export const getTourStep = (id) => TOUR_STEPS.find((step) => step.id === id);
export const getTourStepByIndex = (index) => TOUR_STEPS[index] || null;
export const getTotalSteps = () => TOUR_STEPS.length;
