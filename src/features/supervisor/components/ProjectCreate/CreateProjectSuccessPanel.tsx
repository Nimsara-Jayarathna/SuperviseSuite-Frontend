import { dateFormatter } from '../../createProject.shared';
import type { CreateSupervisorProjectResponse } from '../../types';

type CreateProjectSuccessPanelProps = {
  createdProject: CreateSupervisorProjectResponse;
  primaryMilestone: CreateSupervisorProjectResponse['milestones'][number] | null;
};

export function CreateProjectSuccessPanel({
  createdProject,
  primaryMilestone,
}: CreateProjectSuccessPanelProps) {
  return (
    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-emerald-900">Project created</h2>
      <p className="mt-2 text-sm leading-7 text-emerald-800">
        {createdProject.title} was created with {createdProject.students.length} assigned student
        {createdProject.students.length === 1 ? '' : 's'} and the first milestone scheduled for{' '}
        {dateFormatter.format(new Date(primaryMilestone?.dueDate ?? createdProject.milestoneDate))}.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Lifecycle</p>
          <p className="mt-2 font-semibold text-emerald-950">
            {createdProject.lifecycleStatus.replace('_', ' ')}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Milestone</p>
          <p className="mt-2 font-semibold text-emerald-950">
            {primaryMilestone?.title ?? 'No milestone returned'}
          </p>
        </div>
      </div>
    </section>
  );
}
