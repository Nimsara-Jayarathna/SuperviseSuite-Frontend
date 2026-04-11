import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';
import type { useRegistrationFlow } from '../../hooks/useRegistrationFlow';
import type { RegisterConfig } from '../../types';

type RegistrationFlow = ReturnType<typeof useRegistrationFlow>;

type Step1EmailInputProps = {
  flow: RegistrationFlow;
  config: RegisterConfig;
};

function matchDomain(email: string, config: RegisterConfig): 'STUDENT' | 'SUPERVISOR' | null {
  const e = email.toLowerCase();
  if (config.studentDomain && e.endsWith(config.studentDomain)) return 'STUDENT';
  if (config.supervisorDomain && e.endsWith(config.supervisorDomain)) return 'SUPERVISOR';
  return null;
}

function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function Step1EmailInput({ flow, config }: Step1EmailInputProps) {
  const [email, setEmail] = useState(flow.email ?? '');
  const errorMessage = flow.error?.message ?? null;
  const hasAt = email.includes('@');
  const matchedRole = matchDomain(email, config);
  const hasInvalidFormat = hasAt && !isValidEmailFormat(email);
  const showDomainWarning =
    hasAt && !hasInvalidFormat && matchedRole === null && config.domainRestrictionEnabled;
  const canContinue =
    isValidEmailFormat(email) && (!config.domainRestrictionEnabled || matchedRole !== null);
  const isAlreadyRegistered =
    flow.error?.code === 'CONFLICT' ||
    (errorMessage?.toLowerCase().includes('already registered') ?? false) ||
    (errorMessage?.toLowerCase().includes('already exists') ?? false);
  const domainWarning = `Only ${config.studentDomain ?? 'student domain'} (students) and ${
    config.supervisorDomain ?? 'supervisor domain'
  } (supervisors) may register.`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void flow.submitEmail(email);
      }}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-1">
        <label htmlFor="registration-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="registration-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            flow.clearError();
          }}
          onFocus={flow.clearError}
          placeholder="you@example.com"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {hasAt && hasInvalidFormat && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Enter a valid email address.
        </p>
      )}

      {!hasInvalidFormat && matchedRole === 'STUDENT' && (
        <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Student account
        </div>
      )}

      {!hasInvalidFormat && matchedRole === 'SUPERVISOR' && (
        <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
          Supervisor account
        </div>
      )}

      {showDomainWarning && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {domainWarning}
        </p>
      )}

      {flow.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {isAlreadyRegistered ? (
            <div className="space-y-1">
              <p>This email is already registered.</p>
              <Link to="/login" className="font-medium text-red-700 underline underline-offset-2">
                Sign in →
              </Link>
            </div>
          ) : (
            <p>{errorMessage}</p>
          )}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={flow.isLoading || !canContinue}
      >
        {flow.isLoading ? 'Sending code…' : 'Continue'}
      </Button>
    </form>
  );
}
