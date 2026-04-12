import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMemo, useState } from 'react';
import type { useRegistrationFlow } from '../../hooks/useRegistrationFlow';
import {
  getPasswordStrength,
  type ProfileFieldErrors,
  validateProfile,
} from '../../utils/registrationFlowValidation';

type RegistrationFlow = ReturnType<typeof useRegistrationFlow>;

type Step4ProfileDetailsProps = {
  flow: RegistrationFlow;
};

const strengthStyle: Record<'weak' | 'fair' | 'strong', { width: string; color: string; label: string }> = {
  weak: { width: '33%', color: 'bg-red-500', label: 'Weak' },
  fair: { width: '66%', color: 'bg-amber-500', label: 'Fair' },
  strong: { width: '100%', color: 'bg-emerald-500', label: 'Strong' },
};

export function Step4ProfileDetails({ flow }: Step4ProfileDetailsProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});

  const requireRegistrationNumber = flow.effectiveRole === 'STUDENT';
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const liveErrors = useMemo(
    () =>
      validateProfile({
        firstName,
        lastName,
        password,
        confirmPassword,
        registrationNumber,
        requireRegistrationNumber,
      }),
    [firstName, lastName, password, confirmPassword, registrationNumber, requireRegistrationNumber],
  );
  const canSubmit = Object.keys(liveErrors).length === 0;

  function runValidation(currentRegistrationNumber = registrationNumber) {
    return validateProfile({
      firstName,
      lastName,
      password,
      confirmPassword,
      registrationNumber: currentRegistrationNumber,
      requireRegistrationNumber,
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const errors = runValidation();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    await flow.submitProfile({
      firstName,
      lastName,
      password,
      registrationNumber: requireRegistrationNumber ? registrationNumber : undefined,
    });
  }

  function onRegistrationBlur() {
    const errors = runValidation();
    setFieldErrors((prev) => ({ ...prev, registrationNumber: errors.registrationNumber }));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <label htmlFor="reg-first-name" className="text-sm font-medium text-foreground">
            First name
          </label>
          <Input
            id="reg-first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {fieldErrors.firstName && <p className="text-xs text-red-600">{fieldErrors.firstName}</p>}
        </div>
        <div className="flex-1 space-y-1">
          <label htmlFor="reg-last-name" className="text-sm font-medium text-foreground">
            Last name
          </label>
          <Input
            id="reg-last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {fieldErrors.lastName && <p className="text-xs text-red-600">{fieldErrors.lastName}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="reg-password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <Input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all ${strengthStyle[strength].color}`}
              style={{ width: strengthStyle[strength].width }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{strengthStyle[strength].label}</span>
        </div>
        {fieldErrors.password && <p className="text-xs text-red-600">{fieldErrors.password}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="reg-confirm-password" className="text-sm font-medium text-foreground">
          Confirm password
        </label>
        <Input
          id="reg-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-red-600">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {requireRegistrationNumber && (
        <div className="space-y-1">
          <label htmlFor="reg-number" className="text-sm font-medium text-foreground">
            Registration Number
          </label>
          <Input
            id="reg-number"
            value={registrationNumber}
            onChange={(e) => {
              const next = e.target.value;
              setRegistrationNumber(next);
              const errors = runValidation(next);
              setFieldErrors((prev) => ({ ...prev, registrationNumber: errors.registrationNumber }));
            }}
            onBlur={onRegistrationBlur}
            placeholder="e.g. IT24100487"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {fieldErrors.registrationNumber && (
            <p className="text-xs text-red-600">{fieldErrors.registrationNumber}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Button type="submit" variant="primary" size="lg" fullWidth disabled={flow.isLoading || !canSubmit}>
          Create account
        </Button>
      </div>
    </form>
  );
}
