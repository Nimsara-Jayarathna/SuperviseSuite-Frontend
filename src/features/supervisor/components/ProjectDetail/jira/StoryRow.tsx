import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { StoryGroup } from '@/features/supervisor/types';
import { IssueTypeBadge } from './IssueTypeBadge';

type StoryRowProps = {
  storyGroup: StoryGroup;
  onIssueClick: (issueKey: string) => void;
};

export function StoryRow({ storyGroup, onIssueClick }: StoryRowProps) {
  const { story, subtasks } = storyGroup;
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubtasks = subtasks.length > 0;

  return (
    <div className="border-t border-slate-100 first:border-t-0">
      {/* Story row */}
      <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50">
        {/* Expand chevron — only shown when subtasks exist */}
        <button
          type="button"
          className="shrink-0 text-slate-400 hover:text-slate-600 disabled:invisible"
          disabled={!hasSubtasks}
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        <IssueTypeBadge type={story.issueType} />

        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onIssueClick(story.issueKey)}
        >
          <span className="block truncate text-sm font-medium text-sky-700 hover:underline">
            {story.issueKey}
          </span>
          <span className="block truncate text-sm text-slate-700">
            {story.summary ?? '(no title)'}
          </span>
        </button>

        {/* Assignee */}
        {story.assigneeDisplayName ? (
          <span className="shrink-0 text-xs text-slate-500">{story.assigneeDisplayName}</span>
        ) : null}

        {/* Status chip */}
        {story.statusName ? (
          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
            {story.statusName}
          </span>
        ) : null}
      </div>

      {/* Subtask rows — indented */}
      {isExpanded && hasSubtasks ? (
        <div className="pl-8">
          {subtasks.map((subtask) => (
            <div
              key={subtask.issueKey}
              className="flex items-center gap-2 border-t border-slate-100 px-4 py-2 hover:bg-slate-50"
            >
              <IssueTypeBadge type={subtask.issueType} />

              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onIssueClick(subtask.issueKey)}
              >
                <span className="block truncate text-xs font-medium text-sky-700 hover:underline">
                  {subtask.issueKey}
                </span>
                <span className="block truncate text-xs text-slate-600">
                  {subtask.summary ?? '(no title)'}
                </span>
              </button>

              {subtask.statusName ? (
                <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                  {subtask.statusName}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
