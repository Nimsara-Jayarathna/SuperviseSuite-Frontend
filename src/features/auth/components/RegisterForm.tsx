import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '../hooks/useAuth';

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  registrationNumber?: string;
};

/** Client-side validation — returns an error map; empty object means valid. */
function validate(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  confirmPassword: string,
  registrationNumber: string,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!firstName.trim()) errors.firstName = 'First name is required.';
  if (!lastName.trim()) errors.lastName = 'Last name is required.';
  if (!email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email.';
  if (!password) errors.password = 'Password is required.';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (!/[A-Z]/.test(password)) errors.password = 'Password must contain an uppercase letter.';
  else if (!/[a-z]/.test(password)) errors.password = 'Password must contain a lowercase letter.';
  else if (!/[0-9]/.test(password)) errors.password = 'Password must contain a digit.';
  else if (!/[^A-Za-z0-9]/.test(password))
    errors.password = 'Password must contain a special character.';
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  if (!registrationNumber.trim()) errors.registrationNumber = 'Registration number is required.';
  return errors;
}

type RegisterFormProps = {
  onSuccess?: () => void;
};

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register, isLoading, error, clearError } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Map backend field-level errors onto individual fields.
  const backendFieldErrors = error?.details.reduce<FieldErrors>((acc, d) => {
    const key = d.field as keyof FieldErrors;
    acc[key] = d.issue;
    return acc;
  }, {});

  // Show a general banner for conflict (duplicate email) or any non-field error.
  const generalError =
    error && error.code !== 'VALIDATION_ERROR'
      ? error.code === 'CONFLICT'
        ? 'An account with this email already exists.'
        : error.message
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();

    const errors = validate(
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      registrationNumber,
    );
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    // Role is assigned server-side — the backend always sets STUDENT for public registration.
    await register({ firstName, lastName, email, password, registrationNumber });
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

      {/* Registration Number */}
      <div className="flex flex-col gap-1">
        <label htmlFor="reg-number" className="text-sm font-medium text-foreground">
          Registration Number
        </label>
        <Input
          id="reg-number"
          type="text"
          autoComplete="off"
          placeholder="e.g. IT24100487"
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
          className={inputClass}
        />
        {(fieldErrors.registrationNumber ?? backendFieldErrors?.registrationNumber) && (
          <p className="text-xs text-red-500">
            {fieldErrors.registrationNumber ?? backendFieldErrors?.registrationNumber}
          </p>
        )}
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

      <Button type="submit" variant="hero" size="lg" disabled={isLoading} className="mt-1 w-full">
        {isLoading ? 'Creating account…' : 'Create Account'}
      </Button>
    </form>
  );
}
