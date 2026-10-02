import { create } from 'zustand';

export const useRetrofitStore = create((set, get) => ({
  retrofits: [],
  selectedRetrofits: [],
  portfolioSummary: {
    total_capex: 0,
    annual_savings: 0,
    blended_payback: 0,
    confidence: 0,
  },
  loading: false,
  setRetrofits: (retrofits) => {
    set({ retrofits });
  },
  setPortfolioSummary: (summary) => {
    set({ portfolioSummary: summary });
  },
  toggleRetrofit: (retrofitId) => {
    set((state) => {
      const isSelected = state.selectedRetrofits.includes(retrofitId);
      return {
        selectedRetrofits: isSelected
          ? state.selectedRetrofits.filter((id) => id !== retrofitId)
          : [...state.selectedRetrofits, retrofitId],
      };
    });
  },
  clearSelection: () => {
    set({ selectedRetrofits: [] });
  },
  setLoading: (loading) => {
    set({ loading });
  },
  getSelectedCount: () => get().selectedRetrofits.length,
  getTotalInvestment: () => {
    const { retrofits, selectedRetrofits } = get();
    return retrofits
      .filter((r) => selectedRetrofits.includes(r.id))
      .reduce((sum, r) => sum + (r.capex_rupees || 0), 0);
  },
  getAnnualSavings: () => {
    const { retrofits, selectedRetrofits } = get();
    return retrofits
      .filter((r) => selectedRetrofits.includes(r.id))
      .reduce((sum, r) => sum + (r.annual_savings_rupees || 0), 0);
  },
  getBlendedPayback: () => {
    const totalInv = get().getTotalInvestment();
    const annualSav = get().getAnnualSavings();
    return annualSav > 0 ? totalInv / annualSav : 0;
  },
}));
