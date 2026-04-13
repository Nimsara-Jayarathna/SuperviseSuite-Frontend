import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { useRegistrationFlow } from '../../hooks/useRegistrationFlow';
import type { RegisterConfig } from '../../types';
import { isBlockingError } from '@/utils/errorSeverity';
import {
  hasStudentPrefixViolation,
  isValidEmailFormat,
  matchDomain,
} from '../../utils/emailRestrictionValidation';

type RegistrationFlow = ReturnType<typeof useRegistrationFlow>;

type Step1EmailInputProps = {
  flow: RegistrationFlow;
  config: RegisterConfig;
};

export function Step1EmailInput({ flow, config }: Step1EmailInputProps) {
  const [email, setEmail] = useState(flow.email ?? '');
  const blockingError = isBlockingError(flow.error);
  const errorMessage = flow.error?.message ?? null;
  const hasAt = email.includes('@');
  const matchedRole = matchDomain(email, config);
  const hasInvalidFormat = hasAt && !isValidEmailFormat(email);
  const hasPrefixRestrictionViolation =
    hasAt && !hasInvalidFormat && hasStudentPrefixViolation(email, config);
  const hasDomainRestrictionViolation =
    hasAt && !hasInvalidFormat && matchedRole === null && config.domainRestrictionEnabled;
  const canContinue =
    isValidEmailFormat(email) &&
    (!config.domainRestrictionEnabled || matchedRole !== null) &&
    !hasPrefixRestrictionViolation;
  const isAlreadyRegistered =
    flow.error?.code === 'CONFLICT' ||
    (errorMessage?.toLowerCase().includes('already registered') ?? false) ||
    (errorMessage?.toLowerCase().includes('already exists') ?? false);
  const parts: string[] = [];
  if (config.studentDomain) parts.push(`${config.studentDomain} (student)`);
  if (config.supervisorDomain) parts.push(`${config.supervisorDomain} (supervisor)`);
  const domainWarning =
    parts.length > 0
      ? `Allowed domains: ${parts.join(' · ')}.`
      : 'Your email domain is not permitted to register.';
  const placeholder =
    config.domainRestrictionEnabled && config.studentDomain && config.supervisorDomain
      ? `your${config.studentDomain} or your${config.supervisorDomain}`
      : config.domainRestrictionEnabled && (config.studentDomain ?? config.supervisorDomain)
        ? `your${config.studentDomain ?? config.supervisorDomain}`
        : 'you@example.com';
  const inputStateClass = hasDomainRestrictionViolation
    ? 'border-red-500 focus:ring-red-200'
    : matchedRole === 'STUDENT'
      ? 'border-emerald-500 focus:ring-emerald-200'
      : matchedRole === 'SUPERVISOR'
        ? 'border-sky-500 focus:ring-sky-200'
        : 'border-border focus:ring-primary/40';
  const buttonAccentClass =
    matchedRole === 'STUDENT'
      ? 'bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800'
      : matchedRole === 'SUPERVISOR'
        ? 'bg-sky-700 hover:bg-sky-600 active:bg-sky-800'
        : undefined;

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
        <div className="relative">
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
            placeholder={placeholder}
            className={cn(
              'w-full rounded-md border bg-background px-3 py-2 pr-28 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2',
              inputStateClass,
            )}
          />
          <span
            className={cn(
              'pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-all duration-200',
              matchedRole === 'STUDENT'
                ? 'bg-emerald-100 text-emerald-700 opacity-100'
                : matchedRole === 'SUPERVISOR'
                  ? 'bg-sky-100 text-sky-700 opacity-100'
                  : 'opacity-0',
            )}
          >
            {matchedRole === 'STUDENT'
              ? 'Student'
              : matchedRole === 'SUPERVISOR'
                ? 'Supervisor'
                : ''}
          </span>
        </div>
      </div>

      {hasAt && hasInvalidFormat && (
        <p className="text-xs text-red-600">Enter a valid email address.</p>
      )}

      {hasDomainRestrictionViolation && (
        <p className="rounded-md border border-red-200 bg-red-50/85 px-3 py-2 text-xs leading-5 text-red-700">
          {domainWarning}
        </p>
      )}

      {hasPrefixRestrictionViolation && (
        <p className="rounded-md border border-red-200 bg-red-50/85 px-3 py-2 text-xs leading-5 text-red-700">
          Invalid IT number format. Use ITXXXXXXXX.
        </p>
      )}

      {flow.error && !blockingError && !isAlreadyRegistered && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{errorMessage}</p>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        className={buttonAccentClass}
        disabled={flow.isLoading || !canContinue}
      >
        Continue
      </Button>

      <RequestStateModal
        isOpen={flow.isLoading}
        status="loading"
        title="Sending verification code"
        message="Checking your email and sending OTP..."
        autoCloseOnSuccess={false}
      />

      <RequestStateModal
        isOpen={Boolean(flow.error && !blockingError && isAlreadyRegistered)}
        status="warning"
        title="Email already registered"
        message="This email is already registered."
        onClose={flow.clearError}
        autoCloseOnSuccess={false}
        footer={
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => {
                flow.clearError();
                window.location.assign('/login');
              }}
            >
              Sign in
            </Button>
          </div>
        }
      />
    </form>
  );
}
