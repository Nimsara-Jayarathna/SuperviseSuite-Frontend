import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
};

/** Validates fields client-side. Returns an error map — empty means valid. */
function validate(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  confirmPassword: string,
  role: UserRole | '',
): FieldErrors {
  const errors: FieldErrors = {};
  if (!firstName.trim()) errors.firstName = 'First name is required.';
  if (!lastName.trim()) errors.lastName = 'Last name is required.';
  if (!email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email.';
  if (!password) errors.password = 'Password is required.';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  if (!role) errors.role = 'Please select a role.';
  return errors;
}

type RegisterFormProps = {
  initialRole?: UserRole;
  onSuccess?: () => void;
};

export function RegisterForm({ initialRole, onSuccess }: RegisterFormProps) {
  const { register, isLoading, error, clearError } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole | ''>(initialRole ?? '');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Map backend field-level errors from ApiError.details
  const backendFieldErrors = error?.details.reduce<FieldErrors>((acc, d) => {
    const key = d.field as keyof FieldErrors;
    acc[key] = d.issue;
    return acc;
  }, {});

  // General error — conflict (duplicate email) or any non-validation error
  const generalError =
    error && error.code !== 'VALIDATION_ERROR'
      ? error.code === 'CONFLICT'
        ? 'An account with this email already exists.'
        : error.message
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();

    const errors = validate(firstName, lastName, email, password, confirmPassword, role);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    await register({ firstName, lastName, email, password, role: role as UserRole });
    onSuccess?.();
  }

  const inputClass =
    'rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* General error banner */}
      {generalError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{generalError}</p>
      )}

      {/* First name + Last name side by side */}
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="reg-first-name" className="text-sm font-medium text-foreground">
            First Name
          </label>
          <Input
            id="reg-first-name"
            type="text"
            autoComplete="given-name"
            placeholder="Jane"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
          {(fieldErrors.firstName ?? backendFieldErrors?.firstName) && (
            <p className="text-xs text-red-500">
              {fieldErrors.firstName ?? backendFieldErrors?.firstName}
            </p>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="reg-last-name" className="text-sm font-medium text-foreground">
            Last Name
          </label>
          <Input
            id="reg-last-name"
            type="text"
            autoComplete="family-name"
            placeholder="Smith"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
          {(fieldErrors.lastName ?? backendFieldErrors?.lastName) && (
            <p className="text-xs text-red-500">
              {fieldErrors.lastName ?? backendFieldErrors?.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1">
        <label htmlFor="reg-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="reg-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        {(fieldErrors.email ?? backendFieldErrors?.email) && (
          <p className="text-xs text-red-500">{fieldErrors.email ?? backendFieldErrors?.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1">
        <label htmlFor="reg-password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <Input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        {(fieldErrors.password ?? backendFieldErrors?.password) && (
          <p className="text-xs text-red-500">
            {fieldErrors.password ?? backendFieldErrors?.password}
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1">
        <label htmlFor="reg-confirm-password" className="text-sm font-medium text-foreground">
          Confirm Password
        </label>
        <Input
          id="reg-confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {/* Role selector */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">I am a…</span>
        <div className="flex gap-3">
          {(['STUDENT', 'SUPERVISOR'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                'flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                role === r
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {r === 'STUDENT' ? 'Student' : 'Supervisor'}
            </button>
          ))}
        </div>
        {fieldErrors.role && <p className="text-xs text-red-500">{fieldErrors.role}</p>}
      </div>

      <Button type="submit" variant="hero" size="lg" disabled={isLoading} className="mt-1 w-full">
        {isLoading ? 'Creating account…' : 'Create Account'}
      </Button>
    </form>
  );
}
