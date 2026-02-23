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
    <section className="border-t border-border bg-muted/30 py-24">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 sm:grid-cols-3">
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
