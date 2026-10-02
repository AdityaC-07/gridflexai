import { useEffect, useRef } from 'react';
import GridService from '../services/gridService';
import { useGridStore } from '../store/gridStore';

export const useGrid = (pollInterval = 300000) => {
  const { gridState, loading, setGridState, setLoading } = useGridStore();
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchGridState = async () => {
      setLoading(true);
      try {
        const state = await GridService.fetchGridState();
        setGridState(state);
      } catch (err) {
        console.error('Failed to fetch grid state:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGridState();

    if (pollInterval > 0) {
      intervalRef.current = setInterval(fetchGridState, pollInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pollInterval, setGridState, setLoading]);

  return { gridState, loading };
};
