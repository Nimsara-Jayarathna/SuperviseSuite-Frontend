import { LogoMark } from '@/components/brand/Logo';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type HeroSectionProps = {
  onStudentPortal: () => void;
  onSupervisorAccess: () => void;
};

export function HeroSection({ onStudentPortal, onSupervisorAccess }: HeroSectionProps) {
  return (
    <Card
      className="grid gap-6 bg-white/85 lg:grid-cols-[minmax(0,1fr)_140px] lg:items-center"
      padding="lg"
    >
      <div className="max-w-4xl">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Streamline Your <span className="gradient-text">Research Supervision.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          The all-in-one dashboard connecting Supervisors and Students. Track GitHub commits, manage
          meeting minutes, and sync directly with Jira.
        </p>
        <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button variant="primary" size="md" onClick={onStudentPortal}>
            Student Portal
          </Button>
          <Button variant="secondary" size="md" onClick={onSupervisorAccess}>
            Supervisor Access
          </Button>
        </div>
      </div>

      <div className="hidden lg:flex lg:justify-end">
        <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-white/80 shadow-sm ring-1 ring-slate-200">
          <LogoMark size={68} />
        </div>
      </div>
    </Card>
  );
}
