import { useEffect } from 'react';
import RetrofitService from '../services/retrofitService';
import { useRetrofitStore } from '../store/retrofitStore';

export const useRetrofits = (buildingId) => {
  const { retrofits, portfolioSummary, loading, setRetrofits, setPortfolioSummary, setLoading } = useRetrofitStore();

  useEffect(() => {
    if (!buildingId) return;

    const fetchRetrofits = async () => {
      setLoading(true);
      try {
        const data = await RetrofitService.fetchRetrofits(buildingId);
        if (Array.isArray(data)) {
          setRetrofits(data);
        } else if (data.retrofits) {
          setRetrofits(data.retrofits);
          setPortfolioSummary(data.portfolio_summary);
        }
      } catch (err) {
        console.error('Failed to fetch retrofits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRetrofits();
  }, [buildingId, setRetrofits, setPortfolioSummary, setLoading]);

  return { retrofits, portfolioSummary, loading };
};
