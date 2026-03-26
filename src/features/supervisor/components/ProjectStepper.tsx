export type StepId = number;

export type ProjectStepperStep = {
  id: StepId;
  label: string;
  description: string;
};

export type ProjectStepperProps = {
  currentStep: StepId;
  steps: readonly ProjectStepperStep[];
  onStepClick?: (step: StepId) => void;
};

export function ProjectStepper({ currentStep, steps, onStepClick }: ProjectStepperProps) {
  return (
    <div className="rounded-3xl border border-border bg-white px-8 pb-6 pt-6 shadow-sm">
      <div className="flex justify-between">
        {steps.map((step) => {
          const isDone = step.id < currentStep;
          const isActive = step.id === currentStep;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick?.(step.id)}
              className="group flex flex-1 flex-col items-center gap-2 text-center"
            >
              <div
                className={[
                  'relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200',
                  isDone
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : isActive
                      ? 'border-slate-900 bg-white text-slate-900 shadow-[0_0_0_4px_rgba(15,23,42,0.08)]'
                      : 'border-border bg-white text-muted-foreground',
                ].join(' ')}
              >
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M2.5 7L5.5 10L11.5 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span>{String(step.id).padStart(2, '0')}</span>
                )}

                {isActive ? (
                  <span className="absolute inset-[-6px] animate-ping rounded-full border border-slate-200 opacity-60" />
                ) : null}
              </div>

              <div className="space-y-0.5">
                <p
                  className={[
                    'text-sm transition-colors',
                    isActive
                      ? 'font-semibold text-foreground'
                      : 'font-normal text-muted-foreground',
                  ].join(' ')}
                >
                  {step.label}
                </p>
                <p className="mx-auto max-w-[15rem] text-xs leading-5 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom progress segments */}
      <div className="mt-4 flex gap-1">
        {steps.map((step) => (
          <div
            key={step.id}
            className={[
              'h-1 flex-1 rounded-full transition-all duration-500',
              step.id < currentStep
                ? 'bg-slate-900 opacity-40'
                : step.id === currentStep
                  ? 'bg-slate-900'
                  : 'bg-border',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}
