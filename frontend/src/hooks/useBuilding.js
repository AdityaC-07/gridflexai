import { useEffect } from 'react';
import BuildingService from '../services/buildingService';
import { useBuildingStore } from '../store/buildingStore';

export const useBuilding = (buildingId) => {
  const { currentBuilding, consumption, loading, error, setCurrentBuilding, setConsumption, setLoading, setError } = useBuildingStore();

  useEffect(() => {
    if (!buildingId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [building, consumptionData] = await Promise.all([
          BuildingService.fetchBuilding(buildingId),
          BuildingService.fetchConsumption(buildingId, 7),
        ]);
        setCurrentBuilding(building);
        setConsumption(consumptionData);
      } catch (err) {
        setError(err.message || 'Failed to fetch building data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [buildingId, setCurrentBuilding, setConsumption, setLoading, setError]);

  return { currentBuilding, consumption, loading, error };
};
