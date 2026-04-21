import type { SupervisorDashboardProjectItem } from '../../types';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function statusClasses(status: string) {
  if (status === 'ACTIVE') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'AT_RISK') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'BEHIND') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (status === 'COMPLETED') return 'border-slate-300 bg-slate-100 text-slate-700';
  return 'border-sky-200 bg-sky-50 text-sky-700';
}

export function jiraIndicatorClasses(indicator: string | null) {
  if (indicator === 'AT_RISK') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (indicator === 'BEHIND') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (indicator === 'HEALTHY') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-slate-200 bg-slate-100 text-slate-400';
}

export function jiraIndicatorLabel(
  indicator: SupervisorDashboardProjectItem['jiraHealthIndicator'],
) {
  if (indicator === 'AT_RISK') return 'At Risk';
  if (indicator === 'BEHIND') return 'Behind';
  if (indicator === 'HEALTHY') return 'Healthy';
  if (indicator === 'NOT_CONNECTED') return 'Not linked';
  return '-';
}

export function formatMilestoneDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : 'Not set';
}
