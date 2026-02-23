import type { LandingFeatureCard } from '../types';

type FeatureCardProps = Omit<LandingFeatureCard, 'id'>;

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="group cursor-pointer rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/20 hover:shadow-md">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon size={20} />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
