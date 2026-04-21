import { Check, ChevronDown, ExternalLink, GitBranch, Github } from 'lucide-react';
import { CommitActivitySection } from '@/features/projects/components/CommitActivitySection';
import { LastSyncedBadge } from '@/components/ui/LastSyncedBadge';
import { SyncStatusBadge } from '@/components/ui/SyncStatusBadge';
import { studentApi } from '../../api/studentApi';
import type { ProjectGitHubActivity } from '../../types';
import type { ProjectGitHubRepositories } from '@/features/shared/types/github.types';
import { useStudentProjectGitHubDashboard } from '../../hooks/projectDetails/useStudentProjectGitHubDashboard';

type StudentProjectGitHubTabProps = {
  projectId: string | undefined;
  projectGithubView: ProjectGitHubActivity | null;
  githubRepositories: ProjectGitHubRepositories | null | undefined;
  isPageLoading: boolean;
  onRetryReloadProject: () => void;
};

export function StudentProjectGitHubTab({
  projectId,
  projectGithubView,
  githubRepositories,
  isPageLoading,
  onRetryReloadProject,
}: StudentProjectGitHubTabProps) {
  const {
    enabledRepositories,
    selectedRepoId,
    isRepoSelectorOpen,
    setRepoSelectorOpen,
    activeRepository,
    activeRepositorySyncStatus,
    githubView,
    isGitHubViewLoading,
    selectRepository,
    loadActivityPage,
    loadContributorsPage,
  } = useStudentProjectGitHubDashboard({
    projectId,
    projectGithubView,
    githubRepositories,
    fetchDashboard: studentApi.getProjectGitHubDashboard,
    fetchActivityPage: studentApi.getProjectGitHubActivityPage,
    fetchContributorsPage: studentApi.getProjectGitHubContributorsPage,
  });

  return (
    <div className="space-y-4">
      {activeRepository && (
        <section className="relative z-20">
          <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md sm:flex-row">
            {/* Left: icon + full repo identity */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Github className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Active repository
                </span>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0">
                  <span className="text-[15px] font-bold leading-tight text-slate-900">
                    {activeRepository.customName?.trim() ||
                      activeRepository.name ||
                      'Unnamed repository'}
                  </span>
                  {activeRepository.url && (
                    <a
                      href={activeRepository.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 transition-colors hover:text-indigo-600"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Visit
                    </a>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {activeRepository.fullName && (
                    <span className="text-[11px] text-slate-400">{activeRepository.fullName}</span>
                  )}
                  {activeRepository.defaultBranch && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <GitBranch className="h-3 w-3 text-indigo-400" />
                      {activeRepository.defaultBranch}
                    </span>
                  )}
                  {activeRepository.lastSyncedAt && activeRepositorySyncStatus === 'SUCCESS' && (
                    <LastSyncedBadge
                      lastSyncedAt={activeRepository.lastSyncedAt}
                      className="bg-transparent p-0 text-[11px] text-slate-400"
                      iconClassName="h-3 w-3 text-emerald-400"
                    />
                  )}
                  <SyncStatusBadge syncStatus={activeRepositorySyncStatus} mode="health" />
                </div>
              </div>
            </div>

            {/* Right: Switch only — students cannot refresh */}
            {enabledRepositories.length > 1 && (
              <div className="relative pt-0.5">
                <button
                  type="button"
                  onClick={() => setRepoSelectorOpen(!isRepoSelectorOpen)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                >
                  Switch
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                      isRepoSelectorOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isRepoSelectorOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setRepoSelectorOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 sm:left-auto sm:right-0 sm:min-w-[280px]">
                      {enabledRepositories.map((repo) => {
                        const isSelected = repo.id === selectedRepoId;
                        return (
                          <button
                            key={repo.id}
                            type="button"
                            onClick={() => {
                              void selectRepository(repo.id);
                              setRepoSelectorOpen(false);
                            }}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-all hover:bg-indigo-50 ${
                              isSelected ? 'bg-indigo-50/60' : 'bg-white'
                            }`}
                          >
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                isSelected
                                  ? 'bg-indigo-100 text-indigo-600'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              <Github className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className={`block truncate text-[13px] font-bold ${
                                  isSelected ? 'text-indigo-800' : 'text-slate-800'
                                }`}
                              >
                                {repo.customName?.trim() || repo.name || 'Unnamed repository'}
                              </span>
                              <span className="block truncate text-[11px] text-slate-400">
                                {repo.fullName}
                              </span>
                            </div>
                            {isSelected && <Check className="h-4 w-4 shrink-0 text-indigo-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <CommitActivitySection
        isLoading={isPageLoading || isGitHubViewLoading}
        error={null}
        data={githubView}
        onRetry={onRetryReloadProject}
        loadActivityPage={loadActivityPage}
        loadContributorsPage={loadContributorsPage}
        emptyStateDescription="Please wait for your supervisor to link a GitHub repository to this project. Repository management is restricted to supervisors."
      />
    </div>
  );
}
