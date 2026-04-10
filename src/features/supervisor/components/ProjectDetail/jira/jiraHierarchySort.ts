import type { JiraHierarchyNode } from '@/features/supervisor/types';

export const ISSUE_TYPE_ORDER: Record<string, number> = {
  Epic: -1,
  Story: 0,
  Task: 1,
  Bug: 2,
  Subtask: 3,
};

export function sortNodes(nodes: JiraHierarchyNode[]): JiraHierarchyNode[] {
  return [...nodes].sort((a, b) => {
    const typeA = ISSUE_TYPE_ORDER[a.issueType] ?? 99;
    const typeB = ISSUE_TYPE_ORDER[b.issueType] ?? 99;
    if (typeA !== typeB) return typeA - typeB;
    const ptsA = a.storyPoints ?? -1;
    const ptsB = b.storyPoints ?? -1;
    if (ptsB !== ptsA) return ptsB - ptsA;
    return a.issueKey.localeCompare(b.issueKey);
  });
}
