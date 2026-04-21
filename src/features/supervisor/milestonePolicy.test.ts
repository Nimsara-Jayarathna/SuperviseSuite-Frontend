import { describe, expect, it } from 'vitest';
import type { SupervisorProjectDetailMilestone } from './types';
import {
  canSelectMilestoneStatus,
  getVisibleMilestoneStatuses,
  getTodayLocalDateString,
  validateCreateMilestonesPolicy,
  validateMilestoneAddPolicy,
  validateMilestoneUpdatePolicy,
} from './milestonePolicy';

function milestone(
  id: string,
  sequenceNo: number,
  dueDate: string,
  status: SupervisorProjectDetailMilestone['status'] = 'PLANNED',
): SupervisorProjectDetailMilestone {
  return {
    id,
    title: `M${sequenceNo}`,
    description: null,
    dueDate,
    status,
    sequenceNo,
  };
}

describe('milestonePolicy', () => {
  it('returns today local date in YYYY-MM-DD format', () => {
    expect(getTodayLocalDateString(new Date('2026-04-19T10:00:00'))).toBe('2026-04-19');
  });

  it('rejects create payload with past planned milestone', () => {
    const error = validateCreateMilestonesPolicy(
      [{ title: 'M1', description: '', dueDate: '2026-04-18' }],
      '2026-04-19',
    );
    expect(error).toContain('Open milestones must use today or a future due date');
  });

  it('rejects create payload with chronology violations', () => {
    const error = validateCreateMilestonesPolicy(
      [
        { title: 'M1', description: '', dueDate: '2026-04-20' },
        { title: 'M2', description: '', dueDate: '2026-04-19' },
      ],
      '2026-04-19',
    );
    expect(error).toContain('must be on or after');
  });

  it('rejects adding milestone earlier than last sequence due date', () => {
    const error = validateMilestoneAddPolicy(
      [milestone('1', 1, '2026-04-20'), milestone('2', 2, '2026-04-22')],
      '2026-04-21',
      '2026-04-19',
    );
    expect(error).toContain('previous milestone due date');
  });

  it('blocks completed milestone regressions', () => {
    expect(
      canSelectMilestoneStatus({
        currentStatus: 'COMPLETED',
        nextStatus: 'PLANNED',
        dueDate: '2026-04-20',
        today: '2026-04-19',
      }),
    ).toBe(false);
  });

  it('hides open statuses for terminal milestones', () => {
    const visibleForMissed = getVisibleMilestoneStatuses({
      currentStatus: 'MISSED',
      dueDate: '2026-04-10',
      today: '2026-04-19',
    });
    const visibleForCancelled = getVisibleMilestoneStatuses({
      currentStatus: 'CANCELLED',
      dueDate: '2026-04-10',
      today: '2026-04-19',
    });

    expect(visibleForMissed).not.toContain('PLANNED');
    expect(visibleForMissed).not.toContain('IN_PROGRESS');
    expect(visibleForCancelled).not.toContain('PLANNED');
    expect(visibleForCancelled).not.toContain('IN_PROGRESS');
  });

  it('shows only completed for completed milestones', () => {
    expect(
      getVisibleMilestoneStatuses({
        currentStatus: 'COMPLETED',
        dueDate: '2026-04-10',
        today: '2026-04-19',
      }),
    ).toEqual(['COMPLETED']);
  });

  it('allows legacy-open milestone to keep same status', () => {
    expect(
      canSelectMilestoneStatus({
        currentStatus: 'PLANNED',
        nextStatus: 'PLANNED',
        dueDate: '2026-04-18',
        today: '2026-04-19',
      }),
    ).toBe(true);
  });

  it('rejects update due date outside sequence neighbors', () => {
    const error = validateMilestoneUpdatePolicy({
      milestones: [
        milestone('1', 1, '2026-04-20'),
        milestone('2', 2, '2026-04-22'),
        milestone('3', 3, '2026-04-24'),
      ],
      targetMilestoneId: '2',
      currentStatus: 'PLANNED',
      nextStatus: 'PLANNED',
      currentDueDate: '2026-04-22',
      nextDueDate: '2026-04-25',
      today: '2026-04-19',
    });
    expect(error).toContain('next milestone due date');
  });
});
