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

export function FeaturesSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/35 bg-white/60 p-6 pt-8 shadow-[0_20px_55px_rgba(15,23,42,0.12)] backdrop-blur-md sm:pt-10">
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

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {FEATURE_CARDS.map((card) => (
          <FeatureCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            description={card.description}
          />
        ))}
      </div>
    </section>
  );
}
