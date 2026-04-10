import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { JiraHierarchy } from '@/features/supervisor/types';
import { JiraHierarchyNode } from './JiraHierarchyNode';
import { JiraHierarchySkeleton } from './JiraHierarchySkeleton';
import { sortNodes } from './jiraHierarchySort';

type Props = {
  isLoading: boolean;
  error: { message: string } | null;
  data: JiraHierarchy | null;
};

function sortRootNodes(nodes: JiraHierarchy['roots']): JiraHierarchy['roots'] {
  return [...nodes].sort((a, b) => {
    const aEpic = a.issueType === 'Epic';
    const bEpic = b.issueType === 'Epic';
    if (aEpic !== bEpic) {
      return aEpic ? -1 : 1;
    }
    return a.issueKey.localeCompare(b.issueKey);
  });
}

export function JiraHierarchyView({ isLoading, error, data }: Props) {
  const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);

  if (isLoading) {
    return <JiraHierarchySkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{error.message}</span>
      </div>
    );
  }

  if (!data || (data.roots.length === 0 && data.orphans.length === 0)) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-400">
        No Jira issues found for this project yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.roots.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
            <span>Issues ({data.roots.length})</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpandAll(true)}
                className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                Expand all
              </button>
              <span className="text-slate-200">|</span>
              <button
                type="button"
                onClick={() => setExpandAll(false)}
                className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                Collapse all
              </button>
            </div>
          </h3>
          <div className="space-y-1">
            {sortRootNodes(sortNodes(data.roots)).map((node) => (
              <JiraHierarchyNode
                key={node.issueKey}
                node={node}
                depth={0}
                forceExpanded={expandAll}
              />
            ))}
          </div>
        </section>
      )}

      {data.orphans.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            Unlinked Issues ({data.orphans.length})
          </h3>
          <div className="space-y-1">
            {sortNodes(data.orphans).map((node) => (
              <JiraHierarchyNode
                key={node.issueKey}
                node={node}
                depth={0}
                forceExpanded={expandAll}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
