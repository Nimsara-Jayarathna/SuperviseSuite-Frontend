import { act, renderHook, waitFor } from '@testing-library/react';
import { useSupervisorProjectJiraFlow } from './useSupervisorProjectJiraFlow';

const supervisorApiMock = vi.hoisted(() => ({
  getProjectJiraAuthUrl: vi.fn(),
  completeJiraOAuth: vi.fn(),
  refreshProjectJira: vi.fn(),
  disconnectProjectJira: vi.fn(),
}));

vi.mock('../../api/supervisorApi', () => ({
  supervisorApi: supervisorApiMock,
}));

function createRefreshModal() {
  return {
    showLoading: vi.fn(),
    showSuccess: vi.fn(),
    showError: vi.fn(),
    hide: vi.fn(),
  };
}

type HookProps = {
  searchParams: URLSearchParams;
};

function renderJiraFlowHook(initialSearchParams = new URLSearchParams()) {
  const refreshModal = createRefreshModal();
  const reloadProject = vi.fn().mockResolvedValue(undefined);
  const setSearchParams = vi.fn();
  const navigateToUrl = vi.fn();

  const hook = renderHook(
    ({ searchParams }: HookProps) =>
      useSupervisorProjectJiraFlow({
        projectId: 'project-1',
        searchParams,
        setSearchParams,
        reloadProject,
        refreshModal,
        navigateToUrl,
      }),
    {
      initialProps: {
        searchParams: initialSearchParams,
      },
    },
  );

  return {
    ...hook,
    refreshModal,
    reloadProject,
    setSearchParams,
    navigateToUrl,
  };
}

describe('useSupervisorProjectJiraFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('keeps the Jira connect button in redirecting state after starting a valid Atlassian redirect', async () => {
    supervisorApiMock.getProjectJiraAuthUrl.mockResolvedValue({
      url: 'https://auth.atlassian.com/authorize?client_id=client-1',
    });

    const { navigateToUrl, result } = renderJiraFlowHook();

    await act(async () => {
      await result.current.handleConnectJira();
    });

    expect(supervisorApiMock.getProjectJiraAuthUrl).toHaveBeenCalledWith('project-1');
    expect(navigateToUrl).toHaveBeenCalledWith(
      'https://auth.atlassian.com/authorize?client_id=client-1',
    );
    expect(result.current.isConnectingJira).toBe(true);
  });

  it('resets redirecting state when the project page is restored without Jira callback params', async () => {
    supervisorApiMock.getProjectJiraAuthUrl.mockResolvedValue({
      url: 'https://auth.atlassian.com/authorize?client_id=client-1',
    });

    const { result } = renderJiraFlowHook();

    await act(async () => {
      await result.current.handleConnectJira();
    });

    expect(result.current.isConnectingJira).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('pageshow'));
    });

    expect(result.current.isConnectingJira).toBe(false);
  });

  it('does not reset redirecting state on pageshow while Jira callback params are present', async () => {
    supervisorApiMock.getProjectJiraAuthUrl.mockResolvedValue({
      url: 'https://auth.atlassian.com/authorize?client_id=client-1',
    });
    supervisorApiMock.completeJiraOAuth.mockReturnValue(new Promise(() => undefined));

    const { result, rerender } = renderJiraFlowHook();

    await act(async () => {
      await result.current.handleConnectJira();
    });

    expect(result.current.isConnectingJira).toBe(true);

    rerender({
      searchParams: new URLSearchParams('jiraCode=code-1&jiraState=state-1'),
    });

    await waitFor(() => {
      expect(supervisorApiMock.completeJiraOAuth).toHaveBeenCalledWith({
        code: 'code-1',
        state: 'state-1',
        error: null,
        errorDescription: null,
      });
    });

    act(() => {
      window.dispatchEvent(new Event('pageshow'));
    });

    expect(result.current.isConnectingJira).toBe(true);
  });
});
