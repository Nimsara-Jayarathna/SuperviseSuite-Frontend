import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useEffect, useMemo, useState } from 'react';
import type { RegisterConfig } from '../types';
import {
  getForgotPasswordValidationState,
  validateForgotPasswordForm,
} from '../utils/forgotPasswordValidation';

export type ForgotPasswordFormProps = {
  onSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
  onClearError: () => void;
  startCooldownKey: number;
  config: RegisterConfig;
};

const COOLDOWN_SECONDS = 60;

export function ForgotPasswordForm({
  onSubmit,
  isLoading,
  onClearError,
  startCooldownKey,
  config,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (startCooldownKey === 0) {
      return;
    }
    setCooldown(COOLDOWN_SECONDS);
  }, [startCooldownKey]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const intervalId = window.setInterval(() => {
      setCooldown((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [cooldown]);

  const validationState = useMemo(
    () => getForgotPasswordValidationState(email, config),
    [email, config],
  );
  const isValid = useMemo(
    () => Object.keys(validateForgotPasswordForm(email, config)).length === 0,
    [email, config],
  );
  const isDisabled = isLoading || cooldown > 0 || !isValid;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onClearError();

    const errors = validateForgotPasswordForm(email, config);
    if (Object.keys(errors).length > 0) {
      return;
    }
    await onSubmit(email);
  }

  const allowedDomains = [config.studentDomain, config.supervisorDomain].filter(
    (domain): domain is string => Boolean(domain),
  );
  const domainWarning =
    allowedDomains.length > 0
      ? `Allowed domains: ${allowedDomains.join(' · ')}.`
      : 'Your email domain is not permitted.';

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="forgot-password-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="forgot-password-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {validationState.hasAt && validationState.hasInvalidFormat && (
        <p className="text-xs text-red-600">Enter a valid email address.</p>
      )}

      {validationState.hasDomainViolation && (
        <p className="rounded-md border border-red-200 bg-red-50/85 px-3 py-2 text-xs leading-5 text-red-700">
          {domainWarning}
        </p>
      )}

      {validationState.hasPrefixViolation && (
        <p className="rounded-md border border-red-200 bg-red-50/85 px-3 py-2 text-xs leading-5 text-red-700">
          Invalid IT number format. Use ITXXXXXXXX.
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" fullWidth disabled={isDisabled}>
        {cooldown > 0 ? `Resend in ${cooldown}s...` : 'Send reset link'}
      </Button>
    </form>
  );
}
