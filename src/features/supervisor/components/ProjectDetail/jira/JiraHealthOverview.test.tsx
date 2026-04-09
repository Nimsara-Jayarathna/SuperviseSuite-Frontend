import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiException } from '../../../../../services/apiClient';
import type { ApiError } from '../../../../../types';
import { useJiraHealth } from '../../../hooks/useJiraHealth';
import type { JiraHealth } from '../../../types';
import { JiraHealthOverview } from './JiraHealthOverview';

vi.mock('../../../hooks/useJiraHealth', () => ({
  useJiraHealth: vi.fn(),
}));

const mockedUseJiraHealth = vi.mocked(useJiraHealth);

const BASE_HEALTH: JiraHealth = {
  completionPercent: 80,
  openIssues: 3,
  overdueIssues: 1,
  highPriorityOpen: 1,
  statusBreakdown: {
    toDo: 1,
    inProgress: 2,
    done: 10,
  },
  typeDistribution: [
    { type: 'Task', count: 8 },
    { type: 'Bug', count: 2 },
  ],
  bugRatio: 20,
  lastSyncedAt: '2026-04-08T10:10:00Z',
};

const JIRA_REFRESH_RETRY_MESSAGE =
  'Unable to refresh Jira data right now. Jira may be temporarily unreachable. Please try again.';
const JIRA_REAUTH_MESSAGE = 'Jira authorization has expired. Reconnect Jira and try again.';
const JIRA_RATE_LIMIT_MESSAGE = 'Jira rate limit reached. Wait a minute and try again.';

function makeApiException(overrides: Partial<ApiError> = {}): ApiException {
  return new ApiException({
    timestamp: '2026-04-08T10:10:00Z',
    status: 503,
    error: 'Service Unavailable',
    code: 'SERVICE_UNAVAILABLE',
    message: 'Unable to reach the server. Please check your connection and try again.',
    path: '/api/supervisor/projects/project-1/jira/refresh',
    traceId: null,
    details: [],
    ...overrides,
  });
}

type HookOverrides = Partial<{
  health: JiraHealth | null;
  isLoading: boolean;
  error: ApiError | null;
}>;

function mockJiraHealthHook(overrides: HookOverrides = {}) {
  const reload = vi.fn().mockResolvedValue(undefined);
  const applyHealth = vi.fn();

  mockedUseJiraHealth.mockReturnValue({
    health: BASE_HEALTH,
    isLoading: false,
    error: null,
    reload,
    applyHealth,
    ...overrides,
  });

  return { reload, applyHealth };
}

describe('JiraHealthOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('auto-refreshes once when Jira is connected but has never synced', async () => {
    const refreshedHealth: JiraHealth = {
      ...BASE_HEALTH,
      lastSyncedAt: '2026-04-08T10:20:00Z',
    };
    const syncer = vi.fn().mockResolvedValue(refreshedHealth);

    mockJiraHealthHook({
      health: {
        ...BASE_HEALTH,
        lastSyncedAt: null,
      },
    });

    render(
      <JiraHealthOverview
        fetcher={vi.fn()}
        syncer={syncer}
        projectId="project-1"
        workspaceName="supervise-suite"
      />,
    );

    await waitFor(() => {
      expect(syncer).toHaveBeenCalledTimes(1);
    });
  });

  it('shows Jira-specific retry guidance when refresh cannot reach Jira', async () => {
    const user = userEvent.setup();
    const { applyHealth } = mockJiraHealthHook();
    const syncer = vi.fn().mockRejectedValue(makeApiException());

    render(
      <JiraHealthOverview
        fetcher={vi.fn()}
        syncer={syncer}
        projectId="project-1"
        workspaceName="supervise-suite"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeNull();
    });

    expect(screen.queryByText(JIRA_REFRESH_RETRY_MESSAGE)).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeNull();
    expect(screen.queryByText('Project health')).not.toBeNull();
    expect(applyHealth).not.toHaveBeenCalled();
  });

  it('retries refresh from banner and clears the banner after a successful retry', async () => {
    const user = userEvent.setup();
    const refreshedHealth: JiraHealth = {
      ...BASE_HEALTH,
      completionPercent: 92,
      lastSyncedAt: '2026-04-08T10:15:00Z',
    };

    const { applyHealth } = mockJiraHealthHook();
    const syncer = vi
      .fn()
      .mockRejectedValueOnce(makeApiException())
      .mockResolvedValueOnce(refreshedHealth);

    render(
      <JiraHealthOverview
        fetcher={vi.fn()}
        syncer={syncer}
        projectId="project-1"
        workspaceName="supervise-suite"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(screen.queryByText(JIRA_REFRESH_RETRY_MESSAGE)).not.toBeNull();
    });

    await user.click(screen.getByRole('button', { name: 'Try Again' }));

    await waitFor(() => {
      expect(syncer).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(applyHealth).toHaveBeenCalledWith(
        expect.objectContaining({ lastSyncedAt: refreshedHealth.lastSyncedAt }),
      );
    });

    await waitFor(() => {
      expect(screen.queryByText(JIRA_REFRESH_RETRY_MESSAGE)).toBeNull();
    });
  });

  it('shows reconnect guidance when Jira authorization has expired', async () => {
    const user = userEvent.setup();
    mockJiraHealthHook();
    const syncer = vi
      .fn()
      .mockRejectedValue(
        makeApiException({ status: 401, code: 'UNAUTHORIZED', error: 'Unauthorized' }),
      );

    render(
      <JiraHealthOverview
        fetcher={vi.fn()}
        syncer={syncer}
        projectId="project-1"
        workspaceName="supervise-suite"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(screen.queryByText(JIRA_REAUTH_MESSAGE)).not.toBeNull();
    });
  });

  it('shows rate limit guidance when Jira returns too many requests', async () => {
    const user = userEvent.setup();
    mockJiraHealthHook();
    const syncer = vi.fn().mockRejectedValue(makeApiException({ status: 429 }));

    render(
      <JiraHealthOverview
        fetcher={vi.fn()}
        syncer={syncer}
        projectId="project-1"
        workspaceName="supervise-suite"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(screen.queryByText(JIRA_RATE_LIMIT_MESSAGE)).not.toBeNull();
    });
  });
});
