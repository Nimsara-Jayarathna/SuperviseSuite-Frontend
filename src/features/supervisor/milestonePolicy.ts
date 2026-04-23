import type { MilestoneDraft } from './createProject.shared';
import type { SupervisorProjectDetailMilestone } from './types';

export type MilestoneStatus = SupervisorProjectDetailMilestone['status'];

const ALL_STATUSES: readonly MilestoneStatus[] = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'MISSED',
  'CANCELLED',
];
const OPEN_STATUSES: readonly MilestoneStatus[] = ['PLANNED', 'IN_PROGRESS'];
const TERMINAL_STATUSES: readonly MilestoneStatus[] = ['COMPLETED', 'MISSED', 'CANCELLED'];

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function isDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function getTodayLocalDateString(now: Date = new Date()) {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function isOpenMilestoneStatus(status: MilestoneStatus) {
  return OPEN_STATUSES.includes(status);
}

export function isTerminalMilestoneStatus(status: MilestoneStatus) {
  return TERMINAL_STATUSES.includes(status);
}

export function validateOpenStatusDueDate(
  dueDate: string,
  status: MilestoneStatus,
  today = getTodayLocalDateString(),
): string | null {
  if (!isDateString(dueDate)) {
    return 'Milestone due date is required.';
  }
  if (isOpenMilestoneStatus(status) && dueDate < today) {
    return 'Open milestones must use today or a future due date.';
  }
  return null;
}

export function validateCreateMilestonesPolicy(
  milestones: MilestoneDraft[],
  today = getTodayLocalDateString(),
): string | null {
  let previousDueDate: string | null = null;
  for (let index = 0; index < milestones.length; index += 1) {
    const dueDate = milestones[index].dueDate;
    const dueDateError = validateOpenStatusDueDate(dueDate, 'PLANNED', today);
    if (dueDateError) {
      return `Milestone ${index + 1}: ${dueDateError}`;
    }
    if (previousDueDate && dueDate < previousDueDate) {
      return `Milestone ${index + 1} due date must be on or after milestone ${index} due date.`;
    }
    previousDueDate = dueDate;
  }
  return null;
}

export function validateMilestoneAddPolicy(
  existingMilestones: SupervisorProjectDetailMilestone[],
  nextDueDate: string,
  today = getTodayLocalDateString(),
): string | null {
  const dueDateError = validateOpenStatusDueDate(nextDueDate, 'PLANNED', today);
  if (dueDateError) {
    return dueDateError;
  }

  const ordered = [...existingMilestones].sort((left, right) => left.sequenceNo - right.sequenceNo);
  const previous = ordered.length > 0 ? ordered[ordered.length - 1] : null;
  if (previous?.dueDate && nextDueDate < previous.dueDate) {
    return 'Milestone due date must be on or after the previous milestone due date.';
  }
  return null;
}

export function canSelectMilestoneStatus(params: {
  currentStatus: MilestoneStatus;
  nextStatus: MilestoneStatus;
  dueDate: string;
  today?: string;
}) {
  const { currentStatus, nextStatus, dueDate } = params;
  const today = params.today ?? getTodayLocalDateString();

  if (currentStatus === nextStatus) {
    return true;
  }
  if (currentStatus === 'COMPLETED') {
    return false;
  }
  if (isTerminalMilestoneStatus(currentStatus) && isOpenMilestoneStatus(nextStatus)) {
    return false;
  }
  if (isOpenMilestoneStatus(nextStatus) && isDateString(dueDate) && dueDate < today) {
    return false;
  }
  return true;
}

export function getVisibleMilestoneStatuses(params: {
  currentStatus: MilestoneStatus;
  dueDate: string;
  today?: string;
}): MilestoneStatus[] {
  const { currentStatus, dueDate } = params;
  const today = params.today ?? getTodayLocalDateString();
  return ALL_STATUSES.filter((nextStatus) =>
    canSelectMilestoneStatus({
      currentStatus,
      nextStatus,
      dueDate,
      today,
    }),
  );
}

export function validateMilestoneUpdatePolicy(params: {
  milestones: SupervisorProjectDetailMilestone[];
  targetMilestoneId: string;
  currentStatus: MilestoneStatus;
  nextStatus: MilestoneStatus;
  currentDueDate: string;
  nextDueDate: string;
  today?: string;
}): string | null {
  const { milestones, targetMilestoneId, currentStatus, nextStatus, currentDueDate, nextDueDate } =
    params;
  const today = params.today ?? getTodayLocalDateString();
  const statusChanged = currentStatus !== nextStatus;
  const dueDateChanged = currentDueDate !== nextDueDate;

  if (
    statusChanged &&
    !canSelectMilestoneStatus({ currentStatus, nextStatus, dueDate: nextDueDate, today })
  ) {
    if (currentStatus === 'COMPLETED') {
      return 'Completed milestones cannot be moved to another status.';
    }
    if (isTerminalMilestoneStatus(currentStatus) && isOpenMilestoneStatus(nextStatus)) {
      return 'Terminal milestones cannot move back to open states.';
    }
    return 'Open milestones must use today or a future due date.';
  }

  if (statusChanged || dueDateChanged) {
    const dueDateError = validateOpenStatusDueDate(nextDueDate, nextStatus, today);
    if (dueDateError) {
      return dueDateError;
    }
  }

  if (!dueDateChanged) {
    return null;
  }

  const ordered = [...milestones].sort((left, right) => left.sequenceNo - right.sequenceNo);
  const index = ordered.findIndex((milestone) => milestone.id === targetMilestoneId);
  if (index < 0) {
    return null;
  }

  const previous = index > 0 ? ordered[index - 1] : null;
  if (previous?.dueDate && nextDueDate < previous.dueDate) {
    return 'Milestone due date must be on or after the previous milestone due date.';
  }

  const next = index < ordered.length - 1 ? ordered[index + 1] : null;
  if (next?.dueDate && nextDueDate > next.dueDate) {
    return 'Milestone due date must be on or before the next milestone due date.';
  }

  return null;
}
