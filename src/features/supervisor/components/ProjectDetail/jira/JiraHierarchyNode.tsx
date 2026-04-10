import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { JiraHierarchyNode as NodeType } from '@/features/supervisor/types';

const ISSUE_TYPE_COLORS: Record<string, string> = {
  Epic: 'bg-purple-100 text-purple-700 border-purple-200',
  Story: 'bg-sky-100 text-sky-700 border-sky-200',
  Task: 'bg-blue-100 text-blue-700 border-blue-200',
  Bug: 'bg-rose-100 text-rose-700 border-rose-200',
  Subtask: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_COLORS: Record<string, string> = {
  'To Do': 'bg-slate-100 text-slate-500',
  'In Progress': 'bg-amber-100 text-amber-700',
  Done: 'bg-emerald-100 text-emerald-700',
};

type Props = {
  node: NodeType;
  depth?: number;
};

export function JiraHierarchyNode({ node, depth = 0 }: Props) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const typeColor =
    ISSUE_TYPE_COLORS[node.issueType] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  const statusColor = STATUS_COLORS[node.status] ?? 'bg-slate-100 text-slate-500';

  return (
    <div className={depth > 0 ? 'ml-5 border-l border-slate-200 pl-3' : ''}>
      <div
        className={`group flex items-start gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm transition-all hover:border-slate-200 hover:shadow-md ${depth === 0 ? 'mb-1' : 'my-0.5'}`}
      >
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          disabled={!hasChildren}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all ${hasChildren ? 'cursor-pointer hover:bg-slate-100' : 'cursor-default opacity-0'}`}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <ChevronRight
            className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          />
        </button>

        <span
          className={`mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${typeColor}`}
        >
          {node.issueType}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">{node.issueKey}</span>
            <span className="truncate text-sm font-semibold text-slate-800">{node.summary}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${statusColor}`}>
              {node.status}
            </span>
            {node.assigneeDisplayName && (
              <span className="text-[11px] text-slate-400">{node.assigneeDisplayName}</span>
            )}
            {node.storyPoints != null && (
              <span className="text-[11px] font-semibold text-slate-400">
                {node.storyPoints} pts
              </span>
            )}
          </div>
        </div>

        {hasChildren && (
          <span className="mt-0.5 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
            {node.children.length}
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <JiraHierarchyNode key={child.issueKey} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
