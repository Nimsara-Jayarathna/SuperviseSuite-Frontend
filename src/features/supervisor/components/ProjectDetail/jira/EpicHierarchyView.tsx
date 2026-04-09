import { useState, useEffect, useMemo } from 'react';
import { useJiraIssues } from '../../../hooks/useJiraIssues';
import { buildEpicHierarchy } from '../../../utils/buildEpicHierarchy';
import { EpicGroupRow } from './EpicGroupRow';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { JiraIssueSummary } from '@/features/supervisor/types';

type EpicHierarchyViewProps = {
  projectId: string;
  fetcher: (projectId: string) => Promise<JiraIssueSummary[]>;
  onIssueClick: (issueKey: string) => void;
};

const ALL_EPICS_VALUE = '__all__';

export function EpicHierarchyView({
  projectId,
  fetcher,
  onIssueClick,
}: EpicHierarchyViewProps) {
  const { issues, isLoading, error, reload } = useJiraIssues(fetcher, projectId);
  const [selectedEpicKey, setSelectedEpicKey] = useState<string>(ALL_EPICS_VALUE);

  // Reset epic filter whenever the project (sprint context) changes
  useEffect(() => {
    setSelectedEpicKey(ALL_EPICS_VALUE);
  }, [projectId]);

  const allGroups = useMemo(
    () => buildEpicHierarchy(issues ?? []),
    [issues],
  );

  const namedEpics = useMemo(
    () => allGroups.filter((g) => g.epic !== null).map((g) => g.epic!),
    [allGroups],
  );

  const filteredGroups = useMemo(() => {
    if (selectedEpicKey === ALL_EPICS_VALUE) return allGroups;
    return allGroups.filter(
      (g) => g.epic?.issueKey === selectedEpicKey,
    );
  }, [allGroups, selectedEpicKey]);

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`hierarchy-skeleton-${i}`}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <div className="h-3 w-48 rounded bg-slate-200" />
            <div className="mt-3 h-2.5 w-full rounded bg-slate-100" />
            <div className="mt-2 h-2.5 w-3/4 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={reload} />;
  }

  if (!issues || issues.length === 0) {
    return (
      <EmptyState
        title="No issues found"
        description="No Jira issues have been synced for this project yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Epic filter */}
      {namedEpics.length > 0 ? (
        <div className="flex items-center gap-2">
          <label
            htmlFor="epic-filter"
            className="shrink-0 text-sm font-medium text-slate-600"
          >
            Filter by epic
          </label>
          <select
            id="epic-filter"
            value={selectedEpicKey}
            onChange={(e) => setSelectedEpicKey(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value={ALL_EPICS_VALUE}>All Epics</option>
            {namedEpics.map((epic) => (
              <option key={epic.issueKey} value={epic.issueKey}>
                {epic.issueKey} — {epic.summary ?? '(no title)'}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* Epic groups */}
      {filteredGroups.length === 0 ? (
        <EmptyState
          title="No matching issues"
          description="No issues found for the selected epic."
        />
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group) => (
            <EpicGroupRow
              key={group.epic?.issueKey ?? '__no_epic__'}
              group={group}
              onIssueClick={onIssueClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
