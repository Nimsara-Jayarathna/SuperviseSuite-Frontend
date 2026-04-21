import type { ProjectStepperStep } from './components/ProjectStepper';
import type { CreateSupervisorProjectResponse, SupervisorStudentSearchResult } from './types';
import { parseLocalDateOnly } from '@/lib/dateOnly';

export type DraftState = {
  title: string;
  batch: string;
  semester: string;
  summary: string;
};

export type MilestoneDraft = {
  title: string;
  description: string;
  dueDate: string;
};

export type SearchState = 'idle' | 'loading' | 'results' | 'empty' | 'error';

export type CreateProjectStepId = 1 | 2 | 3;

export type RequestModalState = {
  isOpen: boolean;
  status: 'loading' | 'success' | 'error';
  title: string;
  message: string;
};

export const INITIAL_DRAFT: DraftState = {
  title: '',
  batch: '2026',
  semester: 'Semester 1',
  summary: '',
};

export const INITIAL_MILESTONE: MilestoneDraft = {
  title: '',
  description: '',
  dueDate: '',
};

export const FIELD_LIMITS = {
  title: 40,
  batch: 32,
  semester: 32,
  summary: 250,
  milestoneTitle: 40,
  milestoneDescription: 250,
} as const;

export const CREATE_PROJECT_STEPS: readonly ProjectStepperStep[] = [
  {
    id: 1,
    label: 'Project basics',
    description: 'Capture the core project information first.',
  },
  {
    id: 2,
    label: 'Student assignment',
    description: 'Choose the registered students assigned to this project.',
  },
  {
    id: 3,
    label: 'Milestones',
    description: 'Add every milestone now, then create the project in one final request.',
  },
];

export const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function buildStudentLabel(student: SupervisorStudentSearchResult) {
  return `${student.firstName} ${student.lastName}`.trim() || student.email;
}

export function isMilestoneComplete(milestone: MilestoneDraft) {
  return milestone.title.trim().length > 0 && milestone.dueDate.length > 0;
}

export function milestoneSummaryTitle(milestone: MilestoneDraft) {
  const title = milestone.title.trim();
  return title.length > 0 ? title : 'Untitled milestone';
}

export function milestoneSummaryDescription(milestone: MilestoneDraft) {
  const description = milestone.description.trim();
  if (description.length > 0) return description;
  return isMilestoneComplete(milestone) ? 'No description added.' : 'Needs a title and due date.';
}

export function milestoneSummaryDate(milestone: MilestoneDraft): string | null {
  if (!milestone.dueDate) return null;
  const parsed = parseLocalDateOnly(milestone.dueDate);
  return parsed ? dateFormatter.format(parsed) : milestone.dueDate;
}

export function collapsePreview(text: string, maxChars = 60) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}...`;
}

export function earliestMilestone(
  milestones: CreateSupervisorProjectResponse['milestones'],
): CreateSupervisorProjectResponse['milestones'][number] | null {
  if (milestones.length === 0) return null;
  return milestones.reduce((earliest, milestone) => {
    const milestoneDate = parseLocalDateOnly(milestone.dueDate);
    const earliestDate = parseLocalDateOnly(earliest.dueDate);

    if (!milestoneDate) {
      return earliest;
    }

    if (!earliestDate) {
      return milestone;
    }

    return milestoneDate.getTime() < earliestDate.getTime() ? milestone : earliest;
  }, milestones[0]);
}
