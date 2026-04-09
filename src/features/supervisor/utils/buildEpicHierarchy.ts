import type { EpicGroup, JiraIssueSummary, StoryGroup } from '../types';

/**
 * Builds an epic/story/subtask hierarchy from a flat list of Jira issues.
 *
 * Classification rules (case-insensitive on issueType):
 *   - Epic:    issueType === 'epic'
 *   - Subtask: issueType === 'subtask' OR issueType === 'sub-task'
 *   - Story/Task: everything else (treated as a story-level item)
 *
 * Grouping rules:
 *   1. Each epic becomes an EpicGroup.
 *   2. Each story/task is assigned to the epic group whose key matches its parentKey.
 *      If no match → assigned to the "No Epic" group (epic: null).
 *   3. Each subtask is assigned to the StoryGroup whose story.issueKey matches its parentKey.
 *      If no parent story is found → treated as a story-level orphan in the "No Epic" group.
 *   4. Named epic groups appear first (in order of first appearance in the input array).
 *      The "No Epic" group appears last, and only if it contains items.
 */
export function buildEpicHierarchy(issues: JiraIssueSummary[]): EpicGroup[] {
  const epicGroups = new Map<string, EpicGroup>();
  const noEpicGroup: EpicGroup = { epic: null, storyGroups: [], orphanIssues: [] };

  // Maps issueKey → StoryGroup for subtask attachment
  const storyGroupByKey = new Map<string, StoryGroup>();

  // Partition issues by level
  const epics: JiraIssueSummary[] = [];
  const stories: JiraIssueSummary[] = [];
  const subtasks: JiraIssueSummary[] = [];

  for (const issue of issues) {
    const type = issue.issueType?.toLowerCase() ?? '';
    if (type === 'epic') {
      epics.push(issue);
    } else if (type === 'subtask' || type === 'sub-task') {
      subtasks.push(issue);
    } else {
      stories.push(issue);
    }
  }

  // Build epic groups (preserving input order)
  for (const epic of epics) {
    epicGroups.set(epic.issueKey, {
      epic,
      storyGroups: [],
      orphanIssues: [],
    });
  }

  // Assign stories to their epic group or to noEpicGroup
  for (const story of stories) {
    const storyGroup: StoryGroup = { story, subtasks: [] };
    storyGroupByKey.set(story.issueKey, storyGroup);

    const parentEpicGroup =
      story.parentKey != null ? epicGroups.get(story.parentKey) : undefined;

    if (parentEpicGroup) {
      parentEpicGroup.storyGroups.push(storyGroup);
    } else {
      noEpicGroup.storyGroups.push(storyGroup);
    }
  }

  // Attach subtasks to their parent story group; ungrouped → noEpicGroup orphans
  for (const subtask of subtasks) {
    const parentStoryGroup =
      subtask.parentKey != null ? storyGroupByKey.get(subtask.parentKey) : undefined;

    if (parentStoryGroup) {
      parentStoryGroup.subtasks.push(subtask);
    } else {
      noEpicGroup.orphanIssues.push(subtask);
    }
  }

  // Build result: named epics first, No Epic last (only if non-empty)
  const result: EpicGroup[] = Array.from(epicGroups.values());

  const noEpicIsEmpty =
    noEpicGroup.storyGroups.length === 0 && noEpicGroup.orphanIssues.length === 0;

  if (!noEpicIsEmpty) {
    result.push(noEpicGroup);
  }

  return result;
}
