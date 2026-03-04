import { Button } from '@/components/ui/Button';
import { FileText, GitCommitHorizontal, Webhook } from 'lucide-react';
import type { LandingFeatureCard } from '../types';
import { FeatureCard } from './FeatureCard';

const FEATURE_CARDS: LandingFeatureCard[] = [
  {
    id: 'github-tracking',
    icon: GitCommitHorizontal,
    title: 'GitHub Tracking',
    description: 'Monitor commits, branches, and pull requests in real time.',
  },
  {
    id: 'jira-integration',
    icon: Webhook,
    title: 'Jira Integration',
    description: 'Sync tasks and action items directly with your Jira board.',
  },
  {
    id: 'meeting-minutes',
    icon: FileText,
    title: 'Meeting Minutes',
    description: 'Record, organize, and share meeting notes effortlessly.',
  },
];

type FeaturesSectionProps = {
  onGetStarted: () => void;
};

export function FeaturesSection({ onGetStarted }: FeaturesSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
      <div className="rounded-3xl border border-border bg-white/85 p-5 shadow-sm sm:p-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Built for active supervision
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Keep progress, meetings, and delivery in one shared workflow.
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
            Bring project tracking, supervisor reviews, and student updates into the same working
            space without jumping between separate tools.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {FEATURE_CARDS.map((card) => (
            <FeatureCard
              key={card.id}
              icon={card.icon}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Ready to start?</p>
            <p className="text-sm text-muted-foreground">
              Create a workspace and bring your project updates into one place.
            </p>
          </div>
          <Button variant="hero" size="md" className="h-10 rounded-2xl px-4" onClick={onGetStarted}>
            Create an account
          </Button>
        </div>
      </div>
    </section>
  );
}
