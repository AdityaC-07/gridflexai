import { useGridState } from '../context/GridStateContext';

export function useFeederState() {
  const { feederState, isLoading, error, refreshAll, isCloudEvent } = useGridState();
  return { feederState, isLoading, error, refreshFeederState: refreshAll, isCloudEvent };
}
