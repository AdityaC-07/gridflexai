import { useGridState } from '../context/GridStateContext';

export function useReliability() {
  const { reliabilityData, isLoading } = useGridState();
  return { reliabilityData, isLoading };
}
