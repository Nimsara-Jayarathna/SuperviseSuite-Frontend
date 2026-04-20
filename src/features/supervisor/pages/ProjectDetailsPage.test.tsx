import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { ProjectDetailsPage } from './ProjectDetailsPage';

const {
  useSupervisorProjectMock,
  useProjectDetailsPageStateMock,
  useProjectRepositoriesMock,
  getProjectGitHubDashboardMock,
} = vi.hoisted(() => ({
  useSupervisorProjectMock: vi.fn(),
  useProjectDetailsPageStateMock: vi.fn(),
  useProjectRepositoriesMock: vi.fn(),
  getProjectGitHubDashboardMock: vi.fn(),
}));

vi.mock('../hooks/useSupervisorProject', () => ({
  useSupervisorProject: useSupervisorProjectMock,
}));

vi.mock('../hooks/useProjectDetailsPageState', () => ({
  useProjectDetailsPageState: useProjectDetailsPageStateMock,
}));

vi.mock('../hooks/useProjectRepositories', () => ({
  useProjectRepositories: useProjectRepositoriesMock,
}));

vi.mock('../api/supervisorApi', () => ({
  supervisorApi: {
    getProjectGitHubDashboard: getProjectGitHubDashboardMock,
    getProjectGitHubActivityPage: vi.fn(),
    getProjectGitHubContributorsPage: vi.fn(),
    refreshProjectGitHub: vi.fn(),
    getProjectJiraAuthUrl: vi.fn(),
    completeJiraOAuth: vi.fn(),
    refreshProjectJira: vi.fn(),
    disconnectProjectJira: vi.fn(),
  },
}));

vi.mock('@/features/projects/components/CommitActivitySection', () => ({
  CommitActivitySection: () => <div>commit-activity</div>,
}));

vi.mock('../components/ProjectDetail/OverviewTabSection', () => ({
  OverviewTabSection: () => <div>overview-tab</div>,
}));

vi.mock('../components/ProjectDetail/TeamTabSection', () => ({
  TeamTabSection: () => <div>team-tab</div>,
}));

vi.mock('../components/ProjectDetail/MilestonesTabSection', () => ({
  MilestonesTabSection: () => <div>milestones-tab</div>,
}));

vi.mock('../components/ProjectDetail/FilesTabSection', () => ({
  FilesTabSection: () => <div>files-tab</div>,
}));

vi.mock('../components/ProjectDetail/MeetingsTabSection', () => ({
  MeetingsTabSection: () => <div>meetings-tab</div>,
}));

vi.mock('../components/ProjectDetail/JiraTabSection', () => ({
  JiraTabSection: () => <div>jira-tab</div>,
}));

vi.mock('../components/ProjectDetail/IntegrationsTabSection', () => ({
  IntegrationsTabSection: () => <div>integrations-tab</div>,
}));

vi.mock('@/components/ui/PageTabs', () => ({
  PageTabs: ({ value }: { value: string }) => <div>tabs:{value}</div>,
}));

function renderPage(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/supervisor/projects/:projectId" element={<ProjectDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProjectDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const githubView = {
      repositoryLinked: true,
      repositories: [],
      primaryRepositoryUrl: null,
      activitySummary: { totalCommits: 0, lastActivityAt: null, status: 'idle' },
      contributorsPreview: [],
      recentCommitsPreview: [],
    };

    const project = {
      id: 'project-1',
      title: 'My project',
      summary: 'Summary',
      lifecycleStatus: 'ACTIVE',
      batch: null,
      semester: null,
      milestoneDate: null,
      progressPercent: 0,
      lastActivityAt: null,
      repositoryUrl: null,
      github: githubView,
      githubRepositories: null,
      jira: null,
      leader: null,
      members: [],
      milestones: [],
      files: null,
    };

    useSupervisorProjectMock.mockReturnValue({
      project,
      isLoading: false,
      error: null,
      reload: vi.fn().mockResolvedValue(undefined),
    });

    useProjectDetailsPageStateMock.mockReturnValue({
      project,
      overview: {},
      team: {},
      milestones: {},
      requestModal: {
        state: { isOpen: false, status: 'loading', title: '', message: '', retryAction: null },
        close: vi.fn(),
        retryLastRequest: vi.fn(),
      },
      actions: {
        quickLifecycleStatus: 'ACTIVE',
        isUpdatingStatus: false,
        handleQuickStatusChange: vi.fn(),
        handleProjectUpdate: vi.fn(),
      },
    });

    useProjectRepositoriesMock.mockReturnValue({
      data: {
        projectId: 'project-1',
        maxLinkedRepositories: 3,
        maxEnabledRepositories: 2,
        accessSources: [],
        repositories: [
          {
            id: 'link-1',
            sourceId: null,
            accessType: null,
            githubRepositoryId: null,
            githubRepoId: 1,
            fullName: 'org/repo-one',
            name: 'Repo One',
            customName: null,
            ownerLogin: 'org',
            defaultBranch: 'main',
            url: 'https://example.com/repo-one',
            primary: true,
            enabled: true,
            linkedAt: '2026-04-01T00:00:00Z',
            lastSyncedAt: null,
            syncStatus: 'SUCCESS',
          },
          {
            id: 'link-2',
            sourceId: null,
            accessType: null,
            githubRepositoryId: null,
            githubRepoId: 2,
            fullName: 'org/repo-two',
            name: 'Repo Two',
            customName: null,
            ownerLogin: 'org',
            defaultBranch: 'main',
            url: 'https://example.com/repo-two',
            primary: false,
            enabled: true,
            linkedAt: '2026-04-01T00:00:00Z',
            lastSyncedAt: null,
            syncStatus: 'SUCCESS',
          },
        ],
      },
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    getProjectGitHubDashboardMock.mockResolvedValue(githubView);
  });

  it('defaults invalid tab to overview', async () => {
    renderPage('/supervisor/projects/project-1?tab=zzz');

    expect(await screen.findByText('overview-tab')).toBeInTheDocument();
  });

  it('fetches dashboard when switching GitHub repositories', async () => {
    renderPage('/supervisor/projects/project-1?tab=github');

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Switch' }));
    await user.click(await screen.findByRole('button', { name: /Repo Two/i }));

    await waitFor(() => {
      expect(getProjectGitHubDashboardMock).toHaveBeenCalledWith('project-1', false, 'link-2');
    });
  });
});
