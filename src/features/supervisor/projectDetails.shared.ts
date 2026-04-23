import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import type {
  SupervisorProjectDetail,
  SupervisorProjectDetailMilestone,
  SupervisorProjectDetailTab,
  SupervisorProjectLifecycle,
} from './types';

export const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export const TABS: SupervisorProjectDetailTab[] = [
  'overview',
  'team',
  'milestones',
  'files',
  'integrations',
  'github',
  'jira',
  'meetings',
];

export const FIELD_LIMITS = {
  title: 40,
  summary: 250,
  batch: 32,
  semester: 32,
  milestoneTitle: 40,
  milestoneDescription: 250,
} as const;

export const MILESTONE_STATUS_OPTIONS: SupervisorProjectDetailMilestone['status'][] = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'MISSED',
  'CANCELLED',
];

export const LIFECYCLE_OPTIONS: SupervisorProjectLifecycle[] = [
  'PLANNING',
  'ACTIVE',
  'AT_RISK',
  'BEHIND',
  'COMPLETED',
];

export type OverviewEditForm = {
  title: string;
  summary: string;
  batch: string;
  semester: string;
  lifecycleStatus: SupervisorProjectLifecycle;
};

export type SearchState = 'idle' | 'loading' | 'results' | 'empty' | 'error';

export type MilestoneForm = {
  title: string;
  description: string;
  dueDate: string;
  status: SupervisorProjectDetailMilestone['status'];
};

export type RequestModalState = {
  isOpen: boolean;
  status: 'loading' | 'success' | 'error';
  title: string;
  message: string;
  retryAction: (() => Promise<void>) | null;
};

export type MilestoneStatus = SupervisorProjectDetailMilestone['status'];

export function milestoneStatusBg(status: MilestoneStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-50 border-emerald-200';
    case 'IN_PROGRESS':
      return 'bg-sky-50 border-sky-200';
    case 'PLANNED':
      return 'bg-white border-slate-200';
    case 'MISSED':
      return 'bg-rose-50 border-rose-200';
    case 'CANCELLED':
      return 'bg-slate-50 border-slate-200';
    default:
      return 'bg-white border-slate-200';
  }
}

export function milestoneStatusPill(status: MilestoneStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'IN_PROGRESS':
      return 'bg-sky-100 text-sky-800 border border-sky-200';
    case 'PLANNED':
      return 'bg-slate-100 text-slate-600 border border-slate-200';
    case 'MISSED':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-400 border border-slate-200 line-through';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

export function milestoneStatusLabel(status: MilestoneStatus) {
  return status.replace('_', ' ');
}

export function memberDisplayName(member: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  return `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || member.email;
}

export function buildOverviewEditForm(project: SupervisorProjectDetail): OverviewEditForm {
  return {
    title: project.title,
    summary: project.summary ?? '',
    batch: project.batch ?? '',
    semester: project.semester ?? '',
    lifecycleStatus: project.lifecycleStatus,
  };
}

export function toNullableTrimmed(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toApiError(error: unknown, fallbackMessage: string): ApiError {
  return isApiException(error)
    ? error.apiError
    : {
        code: 'INTERNAL_ERROR',
        message: fallbackMessage,
        details: [],
        timestamp: new Date().toISOString(),
        status: 0,
        error: 'Unexpected Error',
        path: '',
        traceId: null,
      };
}

export function buildMilestoneForm(milestone: SupervisorProjectDetailMilestone): MilestoneForm {
  return {
    title: milestone.title,
    description: milestone.description ?? '',
    dueDate: milestone.dueDate,
    status: milestone.status,
  };
}

export function toTabLabel(tab: string) {
  return tab.charAt(0).toUpperCase() + tab.slice(1);
}
