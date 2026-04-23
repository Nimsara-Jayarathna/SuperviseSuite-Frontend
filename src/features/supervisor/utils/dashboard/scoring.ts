import type { SupervisorDashboardProjectItem } from '../../types';
import {
  ATTENTION_LIST_LIMIT,
  DAY_IN_MS,
  UPCOMING_LIST_LIMIT,
  UPCOMING_WINDOW_DAYS,
} from './constants';
import { diffDaysDateOnly } from '@/lib/dateOnly';

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function milestoneDeltaDays(value: string | null, today: Date): number | null {
  if (!value) return null;
  return diffDaysDateOnly(value, today);
}

export function staleDays(value: string | null, now: Date): number | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / DAY_IN_MS));
}

export function upcomingWindowLabel(daysUntil: number): string {
  if (daysUntil < 0) {
    const overdue = Math.abs(daysUntil);
    return overdue === 1 ? '1 day overdue' : `${overdue} days overdue`;
  }
  if (daysUntil === 0) return 'Due today';
  if (daysUntil === 1) return 'Due tomorrow';
  return `Due in ${daysUntil} days`;
}

export function upcomingWindowClasses(daysUntil: number): string {
  if (daysUntil < 0) return 'border-rose-200 bg-rose-50 text-rose-700';
  if (daysUntil <= 3) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (daysUntil <= UPCOMING_WINDOW_DAYS) return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

export type AttentionItem = {
  project: SupervisorDashboardProjectItem;
  score: number;
  reasons: string[];
  summaryText: string;
  severity: 'critical' | 'warning';
  daysUntilMilestone: number | null;
  inactivityDays: number | null;
};

export type UpcomingMilestoneItem = {
  project: SupervisorDashboardProjectItem;
  daysUntilMilestone: number;
};

export function attentionSummaryText(
  project: SupervisorDashboardProjectItem,
  daysUntilMilestone: number | null,
): string {
  if (daysUntilMilestone !== null && daysUntilMilestone < 0) {
    const overdueDays = Math.abs(daysUntilMilestone);
    return overdueDays === 1
      ? 'Primary milestone is overdue by 1 day and requires recovery.'
      : `Primary milestone is overdue by ${overdueDays} days and requires recovery.`;
  }

  if (project.lifecycleStatus === 'BEHIND') {
    return 'Lifecycle is behind. Prioritize blocker removal and milestone recovery.';
  }
  if (project.lifecycleStatus === 'AT_RISK') {
    return 'Lifecycle is at risk. Confirm owners and protect near-term scope.';
  }

  if (daysUntilMilestone !== null && daysUntilMilestone <= 7) {
    if (daysUntilMilestone === 0) {
      return 'Primary milestone is due today. Run a readiness check now.';
    }
    if (daysUntilMilestone === 1) {
      return 'Primary milestone is due tomorrow. Validate readiness today.';
    }
    return `Primary milestone is due in ${daysUntilMilestone} days. Validate readiness this week.`;
  }

  return 'Execution signals indicate this project should be reviewed this cycle.';
}

export function computeAttentionProjects(
  projects: SupervisorDashboardProjectItem[],
  now: Date,
): AttentionItem[] {
  const today = startOfDay(now);

  return projects
    .map((project) => {
      const reasons: string[] = [];
      let score = 0;

      const daysUntilMilestone = milestoneDeltaDays(project.milestoneDate, today);
      const inactivityDays = staleDays(project.lastActivityAt, now);

      if (project.lifecycleStatus === 'BEHIND') {
        score += 90;
        reasons.push('Lifecycle is marked behind.');
      } else if (project.lifecycleStatus === 'AT_RISK') {
        score += 70;
        reasons.push('Lifecycle is marked at risk.');
      }

      if (project.jiraHealthIndicator === 'BEHIND') {
        score += 50;
        reasons.push('Jira execution trend is behind.');
      } else if (project.jiraHealthIndicator === 'AT_RISK') {
        score += 35;
        reasons.push('Jira execution trend is at risk.');
      }

      if (daysUntilMilestone !== null) {
        if (daysUntilMilestone < 0) {
          score += 45 + Math.min(Math.abs(daysUntilMilestone), 20);
          reasons.push(`Milestone is ${Math.abs(daysUntilMilestone)} day(s) overdue.`);
        } else if (daysUntilMilestone <= 3) {
          score += 25;
          reasons.push('Milestone due within 3 days.');
        } else if (daysUntilMilestone <= UPCOMING_WINDOW_DAYS) {
          score += 12;
          reasons.push(`Milestone due within ${UPCOMING_WINDOW_DAYS} days.`);
        }
      }

      if (inactivityDays !== null) {
        if (inactivityDays >= 14) {
          score += 25;
          reasons.push(`No recent activity for ${inactivityDays} days.`);
        } else if (inactivityDays >= 7) {
          score += 12;
          reasons.push(`Limited activity in the last ${inactivityDays} days.`);
        }
      }

      if (
        daysUntilMilestone !== null &&
        daysUntilMilestone <= 7 &&
        (project.progressPercent ?? 0) < 40
      ) {
        score += 15;
        reasons.push('Progress is low for a near-term milestone.');
      }

      const severity: AttentionItem['severity'] =
        score >= 95 ||
        project.lifecycleStatus === 'BEHIND' ||
        project.jiraHealthIndicator === 'BEHIND' ||
        (daysUntilMilestone !== null && daysUntilMilestone < 0)
          ? 'critical'
          : 'warning';

      return {
        project,
        score,
        reasons: reasons.slice(0, 3),
        summaryText: attentionSummaryText(project, daysUntilMilestone),
        severity,
        daysUntilMilestone,
        inactivityDays,
      };
    })
    .filter((item) => item.score >= 45)
    .sort((left, right) => {
      if (left.severity !== right.severity) {
        return left.severity === 'critical' ? -1 : 1;
      }
      if (left.score !== right.score) {
        return right.score - left.score;
      }
      const leftDays = left.daysUntilMilestone ?? Number.POSITIVE_INFINITY;
      const rightDays = right.daysUntilMilestone ?? Number.POSITIVE_INFINITY;
      if (leftDays !== rightDays) {
        return leftDays - rightDays;
      }
      return (right.inactivityDays ?? -1) - (left.inactivityDays ?? -1);
    })
    .slice(0, ATTENTION_LIST_LIMIT);
}

export function computeUpcomingProjects(
  projects: SupervisorDashboardProjectItem[],
  now: Date,
): UpcomingMilestoneItem[] {
  const today = startOfDay(now);

  return projects
    .filter((project) => Boolean(project.milestoneDate) && project.lifecycleStatus !== 'COMPLETED')
    .map((project) => ({
      project,
      daysUntilMilestone: milestoneDeltaDays(project.milestoneDate, today),
    }))
    .filter(
      (item): item is { project: SupervisorDashboardProjectItem; daysUntilMilestone: number } =>
        item.daysUntilMilestone !== null &&
        item.daysUntilMilestone >= -UPCOMING_WINDOW_DAYS &&
        item.daysUntilMilestone <= UPCOMING_WINDOW_DAYS,
    )
    .sort((left, right) => left.daysUntilMilestone - right.daysUntilMilestone)
    .slice(0, UPCOMING_LIST_LIMIT);
}
