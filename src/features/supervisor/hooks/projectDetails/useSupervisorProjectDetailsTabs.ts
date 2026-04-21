import { useCallback, useMemo } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { TABS } from '../../projectDetails.shared';
import type { SupervisorProjectDetailTab } from '../../types';

const DEFAULT_TAB: SupervisorProjectDetailTab = 'overview';

type UseSupervisorProjectDetailsTabsResult = {
  tabs: SupervisorProjectDetailTab[];
  activeTab: SupervisorProjectDetailTab;
  setActiveTab: (tab: SupervisorProjectDetailTab) => void;
};

export function useSupervisorProjectDetailsTabs(
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
): UseSupervisorProjectDetailsTabsResult {
  const tabs = useMemo(() => [...TABS], []);

  const activeTab = useMemo(() => {
    const requestedTab = searchParams.get('tab') as SupervisorProjectDetailTab | null;
    if (requestedTab && tabs.includes(requestedTab)) {
      return requestedTab;
    }
    return DEFAULT_TAB;
  }, [searchParams, tabs]);

  const setActiveTab = useCallback(
    (tab: SupervisorProjectDetailTab) => {
      const nextParams = new URLSearchParams(searchParams);
      if (tab === DEFAULT_TAB) {
        nextParams.delete('tab');
      } else {
        nextParams.set('tab', tab);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return { tabs, activeTab, setActiveTab };
}
