import { useCallback, useMemo } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import type { StudentProjectDetailTab } from '../../types';

const DEFAULT_TAB: StudentProjectDetailTab = 'overview';

const ALLOWED_TABS: StudentProjectDetailTab[] = [
  'overview',
  'team',
  'milestones',
  'files',
  'github',
  'jira',
  'meetings',
];

type UseStudentProjectDetailsTabsResult = {
  tabs: StudentProjectDetailTab[];
  activeTab: StudentProjectDetailTab;
  setActiveTab: (tab: StudentProjectDetailTab) => void;
};

export function useStudentProjectDetailsTabs(
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
): UseStudentProjectDetailsTabsResult {
  const tabs = useMemo(() => [...ALLOWED_TABS], []);
  const activeTab = useMemo(() => {
    const requestedTab = searchParams.get('tab') as StudentProjectDetailTab | null;
    if (requestedTab && tabs.includes(requestedTab)) {
      return requestedTab;
    }
    return DEFAULT_TAB;
  }, [searchParams, tabs]);

  const setActiveTab = useCallback(
    (tab: StudentProjectDetailTab) => {
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
