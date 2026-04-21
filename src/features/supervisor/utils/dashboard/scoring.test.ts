import { describe, expect, it } from 'vitest';
import type { SupervisorDashboardProjectItem } from '../../types';
import { ATTENTION_LIST_LIMIT, UPCOMING_LIST_LIMIT, UPCOMING_WINDOW_DAYS } from './constants';
import {
  computeAttentionProjects,
  computeUpcomingProjects,
  milestoneDeltaDays,
  staleDays,
  startOfDay,
  upcomingWindowLabel,
} from './scoring';

describe('dashboard scoring helpers', () => {
  it('upcomingWindowLabel formats overdue/today/tomorrow/future labels', () => {
    expect(upcomingWindowLabel(-1)).toBe('1 day overdue');
    expect(upcomingWindowLabel(-5)).toBe('5 days overdue');
    expect(upcomingWindowLabel(0)).toBe('Due today');
    expect(upcomingWindowLabel(1)).toBe('Due tomorrow');
    expect(upcomingWindowLabel(3)).toBe('Due in 3 days');
  });

  it('milestoneDeltaDays returns day delta relative to today', () => {
    const today = startOfDay(new Date(2026, 3, 20));
    expect(milestoneDeltaDays('2026-04-20', today)).toBe(0);
    expect(milestoneDeltaDays('2026-04-21', today)).toBe(1);
    expect(milestoneDeltaDays('2026-04-10', today)).toBe(-10);
    expect(milestoneDeltaDays(null, today)).toBeNull();
  });

  it('staleDays returns whole days since last activity', () => {
    const now = new Date('2026-04-22T00:00:00Z');
    expect(staleDays(null, now)).toBeNull();
    expect(staleDays('2026-04-22T00:00:00Z', now)).toBe(0);
    expect(staleDays('2026-04-21T00:00:00Z', now)).toBe(1);
  });

  it('computeAttentionProjects returns critical items first and respects limit', () => {
    const now = new Date(2026, 3, 20, 9, 0, 0);

    const projects: SupervisorDashboardProjectItem[] = [
      {
        id: 'p1',
        title: 'Behind + overdue',
        summary: null,
        lifecycleStatus: 'BEHIND',
        milestoneDate: '2026-04-10',
        lastActivityAt: '2026-04-01T00:00:00Z',
        progressPercent: 10,
        jiraHealthIndicator: 'BEHIND',
      },
      {
        id: 'p2',
        title: 'At risk',
        summary: null,
        lifecycleStatus: 'AT_RISK',
        milestoneDate: '2026-04-25',
        lastActivityAt: '2026-04-18T00:00:00Z',
        progressPercent: 50,
        jiraHealthIndicator: 'AT_RISK',
      },
      {
        id: 'p3',
        title: 'Healthy',
        summary: null,
        lifecycleStatus: 'ACTIVE',
        milestoneDate: null,
        lastActivityAt: '2026-04-20T00:00:00Z',
        progressPercent: 80,
        jiraHealthIndicator: 'HEALTHY',
      },
      {
        id: 'p4',
        title: 'Overdue milestone only',
        summary: null,
        lifecycleStatus: 'ACTIVE',
        milestoneDate: '2026-04-19',
        lastActivityAt: '2026-04-19T00:00:00Z',
        progressPercent: 80,
        jiraHealthIndicator: 'HEALTHY',
      },
      {
        id: 'p5',
        title: 'Another critical',
        summary: null,
        lifecycleStatus: 'BEHIND',
        milestoneDate: '2026-04-20',
        lastActivityAt: '2026-03-01T00:00:00Z',
        progressPercent: 0,
        jiraHealthIndicator: 'AT_RISK',
      },
    ];

    const items = computeAttentionProjects(projects, now);

    expect(items.length).toBeLessThanOrEqual(ATTENTION_LIST_LIMIT);
    expect(items[0]?.severity).toBe('critical');
    expect(items.some((item) => item.project.id === 'p3')).toBe(false);
  });

  it('computeUpcomingProjects respects window and limit', () => {
    const now = new Date(2026, 3, 20, 9, 0, 0);

    const projects: SupervisorDashboardProjectItem[] = [
      {
        id: 'p1',
        title: 'Overdue within window',
        summary: null,
        lifecycleStatus: 'ACTIVE',
        milestoneDate: '2026-04-10',
        lastActivityAt: null,
        progressPercent: 10,
        jiraHealthIndicator: null,
      },
      {
        id: 'p2',
        title: 'Due soon',
        summary: null,
        lifecycleStatus: 'ACTIVE',
        milestoneDate: '2026-04-22',
        lastActivityAt: null,
        progressPercent: 50,
        jiraHealthIndicator: null,
      },
      {
        id: 'p3',
        title: 'Too far out',
        summary: null,
        lifecycleStatus: 'ACTIVE',
        milestoneDate: '2026-06-01',
        lastActivityAt: null,
        progressPercent: 50,
        jiraHealthIndicator: null,
      },
      {
        id: 'p4',
        title: 'Completed should be excluded',
        summary: null,
        lifecycleStatus: 'COMPLETED',
        milestoneDate: '2026-04-22',
        lastActivityAt: null,
        progressPercent: 100,
        jiraHealthIndicator: null,
      },
    ];

    const items = computeUpcomingProjects(projects, now);

    expect(items.length).toBeLessThanOrEqual(UPCOMING_LIST_LIMIT);
    expect(items.every((item) => item.daysUntilMilestone >= -UPCOMING_WINDOW_DAYS)).toBe(true);
    expect(items.every((item) => item.daysUntilMilestone <= UPCOMING_WINDOW_DAYS)).toBe(true);
    expect(items.some((item) => item.project.id === 'p3')).toBe(false);
    expect(items.some((item) => item.project.id === 'p4')).toBe(false);
  });
});
