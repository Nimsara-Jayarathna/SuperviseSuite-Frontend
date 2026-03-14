import { Button } from '@/components/ui/Button';

type FinalCTASectionProps = {
  onStudentPortal: () => void;
  onSupervisorAccess: () => void;
};

export function FinalCTASection({ onStudentPortal, onSupervisorAccess }: FinalCTASectionProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/35 bg-gradient-to-b from-slate-50/85 to-white/75 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.1)] backdrop-blur-md sm:p-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Start managing your research project better.
        </h2>
        <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
          Join supervisors and students using SuperviseSuite to keep research projects organized and
          on track.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button variant="primary" size="md" onClick={onStudentPortal}>
            Create Student Account
          </Button>
          <Button variant="secondary" size="md" onClick={onSupervisorAccess}>
            Supervisor Login
          </Button>
        </div>
      </div>
    </section>
  );
}
