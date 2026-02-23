import { Button } from '@/components/ui/Button';

type HeroSectionProps = {
  onStudentPortal: () => void;
  onSupervisorAccess: () => void;
};

export function HeroSection({ onStudentPortal, onSupervisorAccess }: HeroSectionProps) {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-[var(--nav-height)]">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          Now in Public Beta
        </div>
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
          Streamline Your <span className="gradient-text">Research Supervision.</span>
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
          The all-in-one dashboard connecting Supervisors and Students. Track GitHub commits, manage
          meeting minutes, and sync directly with Jira.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button variant="hero" size="lg" onClick={onStudentPortal}>
            Student Portal
          </Button>
          <Button variant="hero-outline" size="lg" onClick={onSupervisorAccess}>
            Supervisor Access
          </Button>
        </div>
      </div>
    </section>
  );
}
