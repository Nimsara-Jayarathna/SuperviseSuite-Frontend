import { AlertCircle } from 'lucide-react';
import type { JiraHierarchy } from '@/features/supervisor/types';
import { JiraHierarchyNode } from './JiraHierarchyNode';
import { JiraHierarchySkeleton } from './JiraHierarchySkeleton';

type Props = {
  isLoading: boolean;
  error: { message: string } | null;
  data: JiraHierarchy | null;
};

export function JiraHierarchyView({ isLoading, error, data }: Props) {
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
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            Issues ({data.roots.length})
          </h3>
          <div className="space-y-1">
            {data.roots.map((node) => (
              <JiraHierarchyNode key={node.issueKey} node={node} depth={0} />
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
            {data.orphans.map((node) => (
              <JiraHierarchyNode key={node.issueKey} node={node} depth={0} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
