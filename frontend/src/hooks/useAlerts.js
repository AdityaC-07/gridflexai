import { useGridState } from '../context/GridStateContext';

export function useAlerts() {
  const { alerts, isLoading } = useGridState();
  return { alerts, isLoading };
}
