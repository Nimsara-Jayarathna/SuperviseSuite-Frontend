import { LogoMark } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';

type HeroSectionProps = {
  onStudentPortal: () => void;
  onSupervisorAccess: () => void;
};

export function HeroSection({ onStudentPortal, onSupervisorAccess }: HeroSectionProps) {
  return (
    <section className="relative grid gap-6 overflow-hidden bg-white/85 p-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="pointer-events-none absolute -right-10 top-6 hidden h-32 w-32 rounded-full bg-sky-100/60 blur-3xl lg:block" />
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

      <div className="hidden lg:flex lg:items-center lg:justify-center">
        <div className="relative flex h-56 w-full items-center justify-center">
          <div className="absolute h-40 w-40 rounded-full bg-sky-100/70 blur-3xl" />
          <div className="absolute right-6 top-6 h-6 w-6 rounded-full bg-white/90 hero-float-in" />
          <div className="absolute bottom-7 left-10 h-4 w-4 rounded-full bg-sky-200/80 hero-float-in" />
          <div className="hero-float-in hero-gentle-float relative flex h-48 w-48 items-center justify-center rounded-[2.75rem] bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.02]">
            <div className="flex h-36 w-36 items-center justify-center rounded-[2.25rem] bg-slate-50">
              <LogoMark size={144} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
