import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import type { LandingFeatureCard } from '../types';

type FeatureCardProps = Omit<LandingFeatureCard, 'id'> & {
  onClick?: () => void;
};

export function FeatureCard({ icon: Icon, title, description, onClick }: FeatureCardProps) {
  return (
    <Card
      surface="frosted"
      className={cn(
        'relative flex h-full flex-col rounded-2xl border-transparent',
        onClick && 'cursor-pointer',
      )}
      padding="md"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(145deg,rgba(255,255,255,0.8)_0%,rgba(255,255,255,0.45)_56%,rgba(14,165,233,0.14)_100%)]" />
      <div className="relative z-10">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={20} />
        </div>
        <h3 className="mb-1.5 text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}
