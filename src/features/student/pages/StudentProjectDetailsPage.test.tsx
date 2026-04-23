import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { StudentProjectDetailsPage } from './StudentProjectDetailsPage';

const {
  useStudentProjectMock,
  showBlockingErrorMock,
  clearBlockingErrorMock,
  getProjectGitHubDashboardMock,
} = vi.hoisted(() => ({
  useStudentProjectMock: vi.fn(),
  showBlockingErrorMock: vi.fn(),
  clearBlockingErrorMock: vi.fn(),
  getProjectGitHubDashboardMock: vi.fn(),
}));

vi.mock('../hooks/useStudentProject', () => ({
  useStudentProject: useStudentProjectMock,
}));

vi.mock('@/app/layout/BlockingErrorContext', () => ({
  useBlockingError: () => ({
    showBlockingError: showBlockingErrorMock,
    clearBlockingError: clearBlockingErrorMock,
  }),
}));

vi.mock('@/features/projects/hooks/useMeetingAnalytics', () => ({
  useMeetingAnalytics: () => null,
}));

vi.mock('@/features/projects/components/ProjectOverviewContent', () => ({
  ProjectOverviewContent: () => <div>overview-content</div>,
}));

vi.mock('@/features/projects/components/CommitActivitySection', () => ({
  CommitActivitySection: () => <div>commit-activity</div>,
}));

vi.mock('@/features/supervisor/components/ProjectDetail/jira/JiraHealthOverview', () => ({
  JiraHealthOverview: () => <div>jira-health</div>,
}));

vi.mock('@/components/ui/PageTabs', () => ({
  PageTabs: ({ value }: { value: string }) => <div>tabs:{value}</div>,
}));

vi.mock('../components/StudentFilesTabSection', () => ({
  StudentFilesTabSection: () => <div>files-tab</div>,
}));

vi.mock('../components/StudentMeetingsTabSection', () => ({
  StudentMeetingsTabSection: () => <div>meetings-tab</div>,
}));

vi.mock('../api/studentApi', () => ({
  studentApi: {
    getProjectMeetingChannels: vi.fn(),
    getProjectMeetingRecords: vi.fn(),
    getProjectGitHubDashboard: getProjectGitHubDashboardMock,
    getProjectGitHubActivityPage: vi.fn(),
    getProjectGitHubContributorsPage: vi.fn(),
    getJiraHealth: vi.fn(),
    getJiraSprintProgress: vi.fn(),
    getJiraWorkload: vi.fn(),
    getProjectJiraHierarchy: vi.fn(),
  },
}));

function renderPage(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/student/projects/:projectId" element={<StudentProjectDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('StudentProjectDetailsPage', () => {
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

    useStudentProjectMock.mockReturnValue({
      project: {
        id: 'project-1',
        title: 'My project',
        summary: 'Summary',
        status: 'ACTIVE',
        batch: null,
        semester: null,
        milestoneDate: null,
        lastActivityAt: null,
        progressPercent: 0,
        repositoryUrl: null,
        github: githubView,
        githubRepositories: {
          projectId: 'project-1',
          maxLinkedRepositories: 3,
          maxEnabledRepositories: 2,
          accessSources: [],
          repositories: [],
        },
        jira: null,
        leader: null,
        members: [],
        milestones: [],
        files: null,
      },
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    getProjectGitHubDashboardMock.mockResolvedValue(githubView);
  });

  it('renders milestones tab when ?tab=milestones', async () => {
    renderPage('/student/projects/project-1?tab=milestones');

    expect(await screen.findByText('Project Milestones')).toBeInTheDocument();
  });

  it('defaults invalid tab to overview', async () => {
    renderPage('/student/projects/project-1?tab=zzz');

    expect(await screen.findByText('overview-content')).toBeInTheDocument();
  });

  it('routes blocking errors to global blocking modal callback and returns null', () => {
    const error = {
      timestamp: '2026-04-12T00:00:00Z',
      status: 429,
      error: 'Too Many Requests',
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limited',
      path: '/api/student/projects/project-1',
      traceId: null,
      details: [],
    };

    useStudentProjectMock.mockReturnValue({
      project: null,
      isLoading: false,
      error,
      reload: vi.fn(),
    });

    const { container } = renderPage('/student/projects/project-1');

    expect(showBlockingErrorMock).toHaveBeenCalledTimes(1);
    expect(showBlockingErrorMock).toHaveBeenCalledWith(error, expect.any(Function));
    expect(container).toBeEmptyDOMElement();
  });

  it('fetches dashboard when switching GitHub repositories', async () => {
    const githubView = {
      repositoryLinked: true,
      repositories: [],
      primaryRepositoryUrl: null,
      activitySummary: { totalCommits: 0, lastActivityAt: null, status: 'idle' },
      contributorsPreview: [],
      recentCommitsPreview: [],
    };

    useStudentProjectMock.mockReturnValue({
      project: {
        id: 'project-1',
        title: 'My project',
        summary: 'Summary',
        status: 'ACTIVE',
        batch: null,
        semester: null,
        milestoneDate: null,
        lastActivityAt: null,
        progressPercent: 0,
        repositoryUrl: null,
        github: githubView,
        githubRepositories: {
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
        jira: null,
        leader: null,
        members: [],
        milestones: [],
        files: null,
      },
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    getProjectGitHubDashboardMock.mockResolvedValue(githubView);

    renderPage('/student/projects/project-1?tab=github');

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Switch' }));

    await user.click(await screen.findByRole('button', { name: /Repo Two/i }));

    await waitFor(() => {
      expect(getProjectGitHubDashboardMock).toHaveBeenCalledWith('project-1', false, 'link-2');
    });
  });
});
