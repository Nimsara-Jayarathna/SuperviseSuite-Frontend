import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { Check, GraduationCap, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { useRegistrationFlow } from '../../hooks/useRegistrationFlow';
import { isBlockingError } from '@/utils/errorSeverity';

type RegistrationFlow = ReturnType<typeof useRegistrationFlow>;

type Step3RoleSelectProps = {
  flow: RegistrationFlow;
};

const ROLE_OPTIONS = [
  {
    value: 'STUDENT',
    title: 'SLIIT Student',
    description: 'Manage your project submissions',
    icon: GraduationCap,
    accent: 'text-sky-600 bg-sky-50 border-sky-100',
  },
  {
    value: 'SUPERVISOR',
    title: 'SLIIT Supervisor',
    description: 'Oversee and evaluate student projects',
    icon: ShieldCheck,
    accent: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  },
] as const;

export function Step3RoleSelect({ flow }: Step3RoleSelectProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(flow.selectedRole);
  const blockingError = isBlockingError(flow.error);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {ROLE_OPTIONS.map((option) => {
          const selected = selectedRole === option.value;
          const Icon = option.icon;

          return (
            <button
              type="button"
              key={option.value}
              onClick={() => setSelectedRole(option.value)}
              className={cn(
                'group relative w-full rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all duration-200 hover:border-slate-300 hover:bg-slate-50/50',
                selected && 'border-primary bg-primary/5 ring-1 ring-primary/20',
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl border transition-colors',
                    selected ? 'border-primary/20 bg-primary/10 text-primary' : option.accent,
                  )}
                >
                  <Icon size={24} strokeWidth={selected ? 2.5 : 2} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">{option.title}</p>
                    {selected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {flow.error && !blockingError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {flow.error.message}
        </p>
      )}

      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selectedRole || flow.isLoading}
          onClick={() => selectedRole && flow.selectRole(selectedRole)}
          className="rounded-2xl shadow-sm"
        >
          {flow.isLoading ? 'Processing...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
