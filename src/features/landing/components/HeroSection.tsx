import { FileText, GitCommitHorizontal, Webhook } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';

type HeroSectionProps = {
  onStudentPortal: () => void;
  onSupervisorAccess: () => void;
};

export function HeroSection({ onStudentPortal, onSupervisorAccess }: HeroSectionProps) {
  const highlights = [
    {
      id: 'github',
      icon: GitCommitHorizontal,
      label: 'GitHub progress tracking',
    },
    {
      id: 'meetings',
      icon: FileText,
      label: 'Meeting minutes & action items',
    },
    {
      id: 'jira',
      icon: Webhook,
      label: 'Jira sync (coming soon)',
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="max-w-4xl">
          <div className="inline-flex items-center rounded-full border border-border bg-white/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            Now in Public Beta
          </div>
          <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Streamline Your <span className="gradient-text">Research Supervision.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            The all-in-one dashboard connecting Supervisors and Students. Track GitHub commits,
            manage meeting minutes, and sync directly with Jira.
          </p>
          <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button variant="hero" size="lg" className="rounded-2xl px-5" onClick={onStudentPortal}>
              Student Portal
            </Button>
            <Button
              variant="hero-outline"
              size="lg"
              className="rounded-2xl px-5"
              onClick={onSupervisorAccess}
            >
              Supervisor Access
            </Button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {highlights.map((highlight) => {
              const Icon = highlight.icon;

              return (
                <div
                  key={highlight.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <Icon size={18} />
                  </span>
                  <span className="text-sm font-medium text-foreground">{highlight.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden lg:flex lg:justify-end">
          <div className="flex w-full max-w-[22rem] flex-col items-center rounded-[2rem] border border-slate-200 bg-white/80 px-8 py-8 shadow-sm backdrop-blur-sm">
            <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-sky-100">
              <LogoMark size={72} />
            </div>
            <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Unified workspace
            </p>
            <p className="mt-3 text-center text-sm leading-7 text-muted-foreground">
              One place for student updates, supervisor reviews, meeting records, and delivery
              tracking.
            </p>
            <div className="mt-6 grid w-full gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-foreground">
                Student and supervisor flows
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-foreground">
                Project progress in one view
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
