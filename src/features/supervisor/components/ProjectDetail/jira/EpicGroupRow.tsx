import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { EpicGroup } from '@/features/supervisor/types';
import { IssueTypeBadge } from './IssueTypeBadge';
import { StoryRow } from './StoryRow';

type EpicGroupRowProps = {
  group: EpicGroup;
  onIssueClick: (issueKey: string) => void;
};

export function EpicGroupRow({ group, onIssueClick }: EpicGroupRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { epic, storyGroups, orphanIssues } = group;

  const storyCount = storyGroups.length;
  const subtaskCount = storyGroups.reduce((sum, sg) => sum + sg.subtasks.length, 0);
  const isNoEpic = epic === null;

  const totalChildCount = storyCount + orphanIssues.length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Epic header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 ${isNoEpic ? 'bg-slate-50' : 'bg-purple-50/60'}`}
      >
        {/* Expand/collapse toggle */}
        <button
          type="button"
          className="shrink-0 text-slate-400 hover:text-slate-600"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-label={isExpanded ? 'Collapse epic' : 'Expand epic'}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {isNoEpic ? (
          <span className="text-sm font-medium italic text-slate-500">No Epic</span>
        ) : (
          <>
            <IssueTypeBadge type="Epic" />

            {/* Epic key + title — clickable */}
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => onIssueClick(epic.issueKey)}
            >
              <span className="text-xs font-semibold text-purple-700 hover:underline">
                {epic.issueKey}
              </span>
              <span className="ml-2 truncate text-sm font-semibold text-slate-800">
                {epic.summary ?? '(no title)'}
              </span>
            </button>
          </>
        )}

        {/* Stats */}
        <div className="ml-auto flex shrink-0 items-center gap-3 text-xs text-slate-500">
          <span>{storyCount} {storyCount === 1 ? 'story' : 'stories'}</span>
          <span>{subtaskCount} {subtaskCount === 1 ? 'subtask' : 'subtasks'}</span>
          {!isNoEpic && epic.statusName ? (
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">
              {epic.statusName}
            </span>
          ) : null}
        </div>
      </div>

      {/* Child rows */}
      {isExpanded && totalChildCount > 0 ? (
        <div>
          {storyGroups.map((sg) => (
            <StoryRow
              key={sg.story.issueKey}
              storyGroup={sg}
              onIssueClick={onIssueClick}
            />
          ))}
          {orphanIssues.map((issue) => (
            <div
              key={issue.issueKey}
              className="flex items-center gap-2 border-t border-slate-100 px-4 py-2.5 hover:bg-slate-50"
            >
              <IssueTypeBadge type={issue.issueType} />
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onIssueClick(issue.issueKey)}
              >
                <span className="block truncate text-xs font-medium text-sky-700 hover:underline">
                  {issue.issueKey}
                </span>
                <span className="block truncate text-sm text-slate-700">
                  {issue.summary ?? '(no title)'}
                </span>
              </button>
              {issue.statusName ? (
                <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                  {issue.statusName}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* Empty epic body */}
      {isExpanded && totalChildCount === 0 ? (
        <p className="px-4 py-3 text-sm text-slate-400 italic">No issues in this epic</p>
      ) : null}
    </div>
  );
}
