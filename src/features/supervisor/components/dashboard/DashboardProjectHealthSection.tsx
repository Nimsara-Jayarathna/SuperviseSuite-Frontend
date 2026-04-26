import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/feedback/EmptyState';
import { buttonStyles } from '@/components/ui/Button';
import type { SupervisorDashboardProjectItem } from '../../types';
import {
  formatMilestoneDate,
  jiraIndicatorClasses,
  jiraIndicatorLabel,
  statusClasses,
} from '../../utils/dashboard/presentation';

function ProjectHealthMobileCard({ project }: { project: SupervisorDashboardProjectItem }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold leading-tight text-foreground">
            {project.title}
          </p>
          <p
            className="mt-1 text-sm leading-5 text-muted-foreground"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.summary ?? 'No summary provided yet.'}
          </p>
        </div>
        <Link
          to={`/supervisor/projects/${project.id}`}
          className={buttonStyles({
            variant: 'primary',
            size: 'sm',
            className: 'h-8 rounded-full px-3 text-xs font-bold',
          })}
        >
          Open
        </Link>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-slate-100 pt-3 text-xs">
        <div className="space-y-1">
          <dt className="font-medium uppercase tracking-wide text-slate-500">Status</dt>
          <dd className="mt-1">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(project.lifecycleStatus)}`}
            >
              {project.lifecycleStatus.replace('_', ' ')}
            </span>
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="font-medium uppercase tracking-wide text-slate-500">Progress</dt>
          <dd className="text-base font-bold leading-none text-foreground">
            {project.progressPercent ?? 0}%
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="font-medium uppercase tracking-wide text-slate-500">Milestone</dt>
          <dd className="text-sm font-semibold text-foreground">
            {formatMilestoneDate(project.milestoneDate)}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="font-medium uppercase tracking-wide text-slate-500">Jira Health</dt>
          <dd className="mt-1">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${jiraIndicatorClasses(project.jiraHealthIndicator)}`}
            >
              {jiraIndicatorLabel(project.jiraHealthIndicator)}
            </span>
          </dd>
        </div>
      </dl>
    </article>
  );
}

type PagingStateHandlers = {
  setCurrentPage: (updater: number | ((page: number) => number)) => void;
};

type DashboardProjectHealthSectionProps = {
  isLoading: boolean;
  visibleProjects: SupervisorDashboardProjectItem[];
  pagedProjects: SupervisorDashboardProjectItem[];
  pageSize: number;
  safeCurrentPage: number;
  totalPages: number;
  pagingStateHandlers: PagingStateHandlers;
};

export function DashboardProjectHealthSection({
  isLoading,
  visibleProjects,
  pagedProjects,
  pageSize,
  safeCurrentPage,
  totalPages,
  pagingStateHandlers,
}: DashboardProjectHealthSectionProps) {
  const { setCurrentPage } = pagingStateHandlers;

  return (
    <section className="rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Project health</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Searchable overview with quick links into each project workspace.
          </p>
        </div>
        <Link to="/supervisor/projects" className={buttonStyles({ variant: 'ghost', size: 'md' })}>
          View all projects
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`dashboard-row-skeleton-${index}`}
              className="h-16 rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : visibleProjects.length > 0 ? (
        <div className="mt-5 space-y-3">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[920px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[44%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">Project</th>
                  <th className="px-3 py-3 whitespace-nowrap">Status</th>
                  <th className="px-3 py-3 whitespace-nowrap">Milestone</th>
                  <th className="px-3 py-3 whitespace-nowrap">Progress</th>
                  <th className="px-3 py-3 whitespace-nowrap">Jira Health</th>
                  <th className="px-3 py-3 whitespace-nowrap">Quick links</th>
                </tr>
              </thead>
              <tbody>
                {pagedProjects.map((project) => (
                  <tr key={project.id} className="border-b border-slate-100 last:border-0">
                    <td className="min-w-0 px-3 py-4 align-top">
                      <p className="truncate font-medium text-foreground" title={project.title}>
                        {project.title}
                      </p>
                      <p
                        className="mt-1 truncate text-muted-foreground"
                        title={project.summary ?? 'No summary provided yet.'}
                      >
                        {project.summary ?? 'No summary provided yet.'}
                      </p>
                    </td>
                    <td className="px-3 py-4 align-top whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(project.lifecycleStatus)}`}
                      >
                        {project.lifecycleStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-4 align-top whitespace-nowrap text-muted-foreground">
                      {formatMilestoneDate(project.milestoneDate)}
                    </td>
                    <td className="px-3 py-4 align-top whitespace-nowrap text-muted-foreground">
                      {project.progressPercent ?? 0}%
                    </td>
                    <td className="px-3 py-4 align-top whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${jiraIndicatorClasses(project.jiraHealthIndicator)}`}
                      >
                        {jiraIndicatorLabel(project.jiraHealthIndicator)}
                      </span>
                    </td>
                    <td className="px-3 py-4 align-top whitespace-nowrap">
                      <Link
                        to={`/supervisor/projects/${project.id}`}
                        className={buttonStyles({ variant: 'primary', size: 'sm' })}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {pagedProjects.map((project) => (
              <ProjectHealthMobileCard key={project.id} project={project} />
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(safeCurrentPage - 1) * pageSize + 1}-
              {Math.min(safeCurrentPage * pageSize, visibleProjects.length)} of{' '}
              {visibleProjects.length}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage <= 1}
              >
                Previous
              </button>
              <span className="text-xs text-muted-foreground">
                Page {safeCurrentPage} / {totalPages}
              </span>
              <button
                type="button"
                className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            title="No projects found"
            description="No supervised projects match your current filters."
          />
        </div>
      )}
    </section>
  );
}
