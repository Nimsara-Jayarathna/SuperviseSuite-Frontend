import { Activity, Calendar, FolderPlus, Link2 } from 'lucide-react';
import type { LandingStepCard } from '../types';

const STEPS: LandingStepCard[] = [
  {
    id: 'create-project',
    icon: FolderPlus,
    stepNumber: 1,
    title: 'Create Your Project',
    description: 'Students register their research project and connect GitHub repository.',
  },
  {
    id: 'track-development',
    icon: Activity,
    stepNumber: 2,
    title: 'Track Development',
    description: 'Supervisors review commits, branches, and pull requests in real-time.',
  },
  {
    id: 'manage-meetings',
    icon: Calendar,
    stepNumber: 3,
    title: 'Manage Meetings',
    description: 'Record meeting minutes and track action items with your supervisor.',
  },
  {
    id: 'sync-jira',
    icon: Link2,
    stepNumber: 4,
    title: 'Sync with Jira',
    description: 'Ensure research milestones align with development tasks automatically.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-slate-50/50 p-6">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">How it works</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          From setup to supervision in four simple steps.
        </h2>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {STEPS.map(({ id, icon: Icon, stepNumber, title, description }) => (
          <div key={id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50">
                <Icon className="h-5 w-5 text-sky-700" />
              </div>
              <div>
                <div className="text-xs font-medium text-sky-700">Step {stepNumber}</div>
                <h3 className="mt-1 text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
