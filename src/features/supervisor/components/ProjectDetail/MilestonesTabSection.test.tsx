import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MilestonesState } from '../../hooks/useProjectDetailsPageState';
import type { MilestoneStatus } from '../../projectDetails.shared';
import type { SupervisorProjectDetail, SupervisorProjectDetailMilestone } from '../../types';
import { MilestonesTabSection } from './MilestonesTabSection';

function buildMilestone(
  status: MilestoneStatus,
  overrides: Partial<SupervisorProjectDetailMilestone> = {},
): SupervisorProjectDetailMilestone {
  return {
    id: 'milestone-1',
    title: 'Milestone Alpha',
    description: 'Test milestone',
    dueDate: '2026-04-25',
    status,
    sequenceNo: 1,
    ...overrides,
  };
}

function buildProject(milestones: SupervisorProjectDetailMilestone[]): SupervisorProjectDetail {
  return {
    id: 'project-1',
    title: 'Project X',
    summary: null,
    lifecycleStatus: 'ACTIVE',
    batch: null,
    semester: null,
    milestoneDate: null,
    progressPercent: 0,
    lastActivityAt: null,
    repositoryUrl: null,
    github: {
      repositoryLinked: false,
      repositories: [],
      activitySummary: {
        totalCommits: 0,
        lastActivityAt: null,
        status: 'idle',
      },
      contributorsPreview: [],
      recentCommitsPreview: [],
    },
    jira: null,
    leader: null,
    members: [],
    milestones,
    milestoneInsights: null,
    files: null,
  };
}

function createMilestonesState(overrides: Partial<MilestonesState> = {}): MilestonesState {
  return {
    isAddingMilestone: false,
    isSavingMilestone: false,
    editingMilestoneId: null,
    quickStatusUpdatingId: null,
    newMilestoneForm: {
      title: '',
      description: '',
      dueDate: '',
      status: 'PLANNED',
    },
    editMilestoneForm: null,
    isEditMilestoneDirty: false,
    startAddMilestone: () => {},
    cancelAddMilestone: () => {},
    createMilestone: async () => {},
    startEditMilestone: () => {},
    cancelEditMilestone: () => {},
    saveMilestone: async () => {},
    setNewMilestoneField: () => {},
    setEditMilestoneField: () => {},
    submitQuickMilestoneStatus: async () => {},
    ...overrides,
  };
}

describe('MilestonesTabSection terminal lockdown', () => {
  it('disables edit and quick-status interactions for completed milestone cards', () => {
    const completed = buildMilestone('COMPLETED');
    const startEditMilestone = vi.fn();
    const state = createMilestonesState({ startEditMilestone });

    render(<MilestonesTabSection project={buildProject([completed])} milestones={state} />);

    const editButton = screen.getByTitle('Terminal milestones cannot be edited.');
    expect(editButton).toBeDisabled();
    fireEvent.click(editButton);
    expect(startEditMilestone).not.toHaveBeenCalled();

    const quickStatusButton = screen.getByRole('button', { name: 'Change milestone status' });
    expect(quickStatusButton).toBeDisabled();
    fireEvent.click(quickStatusButton);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('filters quick-status menu options for missed milestones', () => {
    const missed = buildMilestone('MISSED');
    const state = createMilestonesState();

    render(<MilestonesTabSection project={buildProject([missed])} milestones={state} />);

    const quickStatusButton = screen.getByRole('button', { name: 'Change milestone status' });
    expect(quickStatusButton).not.toBeDisabled();

    fireEvent.click(quickStatusButton);
    const menu = screen.getByRole('listbox');

    expect(within(menu).queryByText('PLANNED')).toBeNull();
    expect(within(menu).queryByText('IN PROGRESS')).toBeNull();
    expect(within(menu).getByText('MISSED')).toBeInTheDocument();
    expect(within(menu).getByText('COMPLETED')).toBeInTheDocument();
    expect(within(menu).getByText('CANCELLED')).toBeInTheDocument();
  });

  it('renders read-only completed status in edit form when editing a completed milestone row', () => {
    const completed = buildMilestone('COMPLETED');
    const state = createMilestonesState({
      editingMilestoneId: completed.id,
      editMilestoneForm: {
        title: completed.title,
        description: completed.description ?? '',
        dueDate: completed.dueDate,
        status: completed.status,
      },
    });

    const { container } = render(
      <MilestonesTabSection project={buildProject([completed])} milestones={state} />,
    );

    const select = container.querySelector('select');
    expect(select).not.toBeNull();
    expect(select).toBeDisabled();

    const optionValues = Array.from(select?.querySelectorAll('option') ?? []).map(
      (option) => option.value,
    );
    expect(optionValues).toEqual(['COMPLETED']);
  });

  it('keeps edit action enabled for non-terminal milestones', () => {
    const planned = buildMilestone('PLANNED');
    const startEditMilestone = vi.fn();
    const state = createMilestonesState({ startEditMilestone });

    render(<MilestonesTabSection project={buildProject([planned])} milestones={state} />);

    const editButton = screen.getByTitle('Edit milestone');
    expect(editButton).not.toBeDisabled();

    fireEvent.click(editButton);
    expect(startEditMilestone).toHaveBeenCalledTimes(1);
  });
});
