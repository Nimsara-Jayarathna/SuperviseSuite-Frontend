import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useState } from 'react';
import type { useRegistrationFlow } from '../../hooks/useRegistrationFlow';

type RegistrationFlow = ReturnType<typeof useRegistrationFlow>;

type Step3RoleSelectProps = {
  flow: RegistrationFlow;
};

const ROLE_OPTIONS = [
  {
    value: 'STUDENT',
    title: 'SLIIT Student',
    description: 'Manage your project submissions',
  },
  {
    value: 'SUPERVISOR',
    title: 'SLIIT Supervisor',
    description: 'Oversee and evaluate student projects',
  },
] as const;

export function Step3RoleSelect({ flow }: Step3RoleSelectProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(flow.selectedRole);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {ROLE_OPTIONS.map((option) => {
          const selected = selectedRole === option.value;
          return (
            <button
              type="button"
              key={option.value}
              onClick={() => setSelectedRole(option.value)}
              className={cn(
                'w-full rounded-2xl border border-border bg-background p-4 text-left transition',
                selected && 'ring-2 ring-primary',
              )}
            >
              <div className="mb-2 h-8 w-8 rounded-lg bg-slate-100" />
              <p className="text-sm font-semibold text-foreground">{option.title}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </button>
          );
        })}
      </div>

      {flow.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {flow.error.message}
        </p>
      )}

      <div className="space-y-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selectedRole || flow.isLoading}
          onClick={() => selectedRole && flow.selectRole(selectedRole)}
        >
          Continue
        </Button>
        <Button variant="ghost" size="sm" onClick={flow.goBack} className="w-full">
          ← Back
        </Button>
      </div>
    </div>
  );
}
