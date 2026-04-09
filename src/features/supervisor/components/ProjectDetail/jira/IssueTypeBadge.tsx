type IssueTypeBadgeProps = {
  /** Raw issueType string from Jira (e.g. "Story", "Epic", "Subtask", "Bug", "Task") */
  type: string | null;
};

type BadgeStyle = {
  label: string;
  className: string;
};

function getBadgeStyle(type: string | null): BadgeStyle {
  const normalised = type?.toLowerCase() ?? '';
  switch (normalised) {
    case 'epic':
      return { label: 'Epic', className: 'bg-purple-100 text-purple-700' };
    case 'story':
      return { label: 'Story', className: 'bg-sky-100 text-sky-700' };
    case 'subtask':
    case 'sub-task':
      return { label: 'Subtask', className: 'bg-slate-100 text-slate-600' };
    case 'bug':
      return { label: 'Bug', className: 'bg-red-100 text-red-700' };
    case 'task':
      return { label: 'Task', className: 'bg-amber-100 text-amber-700' };
    default:
      return {
        label: type ?? 'Issue',
        className: 'bg-slate-100 text-slate-600',
      };
  }
}

export function IssueTypeBadge({ type }: IssueTypeBadgeProps) {
  const { label, className } = getBadgeStyle(type);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
