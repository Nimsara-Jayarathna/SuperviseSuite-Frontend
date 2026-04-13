import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useEffect, useMemo, useState } from 'react';
import type { useRegistrationFlow } from '../../hooks/useRegistrationFlow';
import type { RegisterConfig } from '../../types';
import { PasswordRequirementsPanel } from '../PasswordRequirementsPanel';
import { PasswordField } from '../PasswordField';
import { PASSWORD_MAX_LENGTH } from '../../utils/passwordRules';
import { type ProfileFieldErrors, validateProfile } from '../../utils/registrationFlowValidation';

type RegistrationFlow = ReturnType<typeof useRegistrationFlow>;

type Step4ProfileDetailsProps = {
  flow: RegistrationFlow;
  config: RegisterConfig;
};

export function Step4ProfileDetails({ flow, config }: Step4ProfileDetailsProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});

  const requireRegistrationNumber = flow.effectiveRole === 'STUDENT';
  const shouldLockRegistrationNumber =
    requireRegistrationNumber &&
    config.domainRestrictionEnabled &&
    config.studentEmailPrefixRestrictionEnabled;
  const autoFilledRegistrationNumber = useMemo(() => {
    if (!shouldLockRegistrationNumber) return null;
    const atIndex = flow.email.indexOf('@');
    if (atIndex <= 0) return null;
    return flow.email.slice(0, atIndex).trim().toUpperCase();
  }, [shouldLockRegistrationNumber, flow.email]);

  useEffect(() => {
    if (autoFilledRegistrationNumber) {
      setRegistrationNumber(autoFilledRegistrationNumber);
    }
  }, [autoFilledRegistrationNumber]);

  const isConfirmPasswordFilled = confirmPassword.trim().length > 0;
  const isConfirmMatched = isConfirmPasswordFilled && password === confirmPassword;
  const isMismatch = isConfirmPasswordFilled && !isConfirmMatched;
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

      <PasswordField
        id="reg-password"
        label="Password"
        value={password}
        onChange={setPassword}
        maxLength={PASSWORD_MAX_LENGTH}
        autoComplete="new-password"
        isVisible={showPassword}
        onToggleVisibility={() => setShowPassword((value) => !value)}
        onFocus={() => setIsNewPasswordFocused(true)}
        onBlur={() => setIsNewPasswordFocused(false)}
      />
      <PasswordRequirementsPanel
        password={password}
        compact
        isNewPasswordFocused={isNewPasswordFocused}
      />
      {fieldErrors.password && <p className="text-xs text-red-600">{fieldErrors.password}</p>}

      <PasswordField
        id="reg-confirm-password"
        label="Confirm password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        maxLength={PASSWORD_MAX_LENGTH}
        autoComplete="new-password"
        isVisible={showConfirmPassword}
        onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
        showMismatch={isConfirmPasswordFilled}
        mismatch={isMismatch}
      />
      {fieldErrors.confirmPassword && (
        <p className="text-xs text-red-600">{fieldErrors.confirmPassword}</p>
      )}

      {requireRegistrationNumber && (
        <div className="space-y-1">
          <label htmlFor="reg-number" className="text-sm font-medium text-foreground">
            Registration Number
          </label>
          <Input
            id="reg-number"
            disabled={shouldLockRegistrationNumber}
            value={registrationNumber}
            onChange={(e) => {
              if (shouldLockRegistrationNumber) {
                return;
              }
              const next = e.target.value;
              setRegistrationNumber(next);
              const errors = runValidation(next);
              setFieldErrors((prev) => ({
                ...prev,
                registrationNumber: errors.registrationNumber,
              }));
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
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={flow.isLoading || !canSubmit}
        >
          Create account
        </Button>
      </div>
    </form>
  );
}
