import { useGridState } from '../context/GridStateContext';

export function useOptimization() {
  const { optimizationData, approvalStatus, runOptimization, approveDecision, isLoading } = useGridState();
  return { optimizationData, approvalStatus, runOptimization, approveDecision, isLoading };
}
