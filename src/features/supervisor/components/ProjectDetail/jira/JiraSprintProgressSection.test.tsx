import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useJiraSprintProgress } from '../../../hooks/useJiraSprintProgress';
import type { JiraSprintProgress } from '../../../types';
import { JiraSprintProgressSection } from './JiraSprintProgressSection';

vi.mock('../../../hooks/useJiraSprintProgress', () => ({
  useJiraSprintProgress: vi.fn(),
}));

const mockedUseJiraSprintProgress = vi.mocked(useJiraSprintProgress);

const BASE_PROGRESS: JiraSprintProgress = {
  activeSprint: {
    sprintId: 12,
    sprintName: 'Sprint 12',
    sprintState: 'active',
    startDate: '2026-04-01T00:00:00Z',
    endDate: '2026-04-14T00:00:00Z',
    sprintStartIssueCount: 15,
    completionPercent: 62,
    issuesDone: 13,
    issuesTotal: 21,
    sprintPointsDone: 28,
    sprintPointsTotal: 42,
    sprintPointsAvailable: true,
  },
  recentSprints: [
    {
      sprintId: 11,
      sprintName: 'Sprint 11',
      sprintState: 'closed',
      startDate: '2026-03-18T00:00:00Z',
      endDate: '2026-03-31T00:00:00Z',
      sprintStartIssueCount: 18,
      completionPercent: 100,
      issuesDone: 18,
      issuesTotal: 18,
      sprintPointsDone: 35,
      sprintPointsTotal: 35,
      sprintPointsAvailable: true,
    },
  ],
  velocityWeeks: [
    {
      weekStart: '2026-03-30T00:00:00Z',
      created: 8,
      resolved: 6,
      averageCycleDays: 2.3,
    },
  ],
  backlogGrowing: true,
  sprintDataAvailable: true,
};

type HookOverrides = Partial<{
  progress: JiraSprintProgress | null;
  isLoading: boolean;
  error: {
    code:
      | 'VALIDATION_ERROR'
      | 'BAD_REQUEST'
      | 'UNAUTHORIZED'
      | 'FORBIDDEN'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'SERVICE_UNAVAILABLE'
      | 'INTERNAL_ERROR';
    message: string;
    details: Array<{ field: string; issue: string }>;
    timestamp: string;
    status: number;
    error: string;
    path: string;
    traceId: string | null;
  } | null;
}>;

function mockHook(overrides: HookOverrides = {}) {
  const reload = vi.fn().mockResolvedValue(undefined);

  mockedUseJiraSprintProgress.mockReturnValue({
    progress: BASE_PROGRESS,
    isLoading: false,
    error: null,
    reload,
    ...overrides,
  });

  return { reload };
}

describe('JiraSprintProgressSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sprint insights when data is available', () => {
    mockHook();

    render(<JiraSprintProgressSection fetcher={vi.fn()} projectId="project-1" />);

    expect(screen.getByText('Sprint progress')).toBeInTheDocument();
    expect(screen.getByText('Active sprint')).toBeInTheDocument();
    expect(screen.getByText('Issue completion')).toBeInTheDocument();
    expect(screen.getByText('Story points')).toBeInTheDocument();
    expect(screen.getByText(/Projected:/)).toBeInTheDocument();
    expect(screen.getByText('Sprint velocity')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByText('Opened')).toBeInTheDocument();
    expect(screen.getByText('Net')).toBeInTheDocument();
    expect(screen.getByText('Avg cycle')).toBeInTheDocument();
    expect(screen.getByText('Need more Jira history for comparison insight.')).toBeInTheDocument();
    expect(screen.getByText('Recent sprints')).toBeInTheDocument();
  });

  it('switches active sprint card content when selecting a past sprint', () => {
    mockHook();

    render(<JiraSprintProgressSection fetcher={vi.fn()} projectId="project-1" />);

    const selector = screen.getByLabelText('Sprint');
    fireEvent.change(selector, { target: { value: 'id:11' } });

    expect(selector).toHaveValue('id:11');
    expect(screen.getByText('Selected sprint')).toBeInTheDocument();
    const issueText = screen.getByText(/of 18 issues done/);
    expect(issueText).toHaveTextContent(/18\s+of\s+18/);
  });

  it('renders empty state when sprint data is unavailable', () => {
    mockHook({
      progress: {
        ...BASE_PROGRESS,
        sprintDataAvailable: false,
      },
    });

    render(<JiraSprintProgressSection fetcher={vi.fn()} projectId="project-1" />);

    expect(screen.getByText('Sprint insights are unavailable')).toBeInTheDocument();
  });

  it('renders error state with retry when fetching fails', () => {
    const { reload } = mockHook({
      progress: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to load sprint progress',
        details: [],
        timestamp: '2026-04-01T00:00:00Z',
        status: 500,
        error: 'Internal Server Error',
        path: '/api/supervisor/projects/project-1/jira/sprint-progress',
        traceId: null,
      },
    });

    render(<JiraSprintProgressSection fetcher={vi.fn()} projectId="project-1" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load sprint progress')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });
});
