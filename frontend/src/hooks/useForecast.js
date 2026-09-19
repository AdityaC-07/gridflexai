import { useGridState } from '../context/GridStateContext';

export function useForecast() {
  const { forecastData, isLoading, error } = useGridState();
  return { forecastData, isLoading, error };
}
