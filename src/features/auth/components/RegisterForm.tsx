import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { ApiError } from '@/types';
import type { RegisterRequest, SupervisorRegisterRequest } from '../types';
import {
  getGeneralError,
  mapBackendFieldErrors,
  type RegisterFieldErrors,
  validateRegisterForm,
} from '../utils/registerValidation';

/**
 * Props follow the Dependency Inversion Principle:
 * RegisterForm depends on abstractions (callbacks + data), not on a concrete
 * hook implementation. This makes the component independently testable and
 * reusable in any context that can provide these props.
 */
type RegisterFormCommonProps = {
  isLoading: boolean;
  error: ApiError | null;
  onClearError: () => void;
  onSuccess?: () => void;
  feedbackMode?: 'inline' | 'modal';
};

type StudentRegisterFormProps = RegisterFormCommonProps & {
  role?: 'student';
  onSubmit: (data: RegisterRequest) => Promise<void>;
};

type SupervisorRegisterFormProps = RegisterFormCommonProps & {
  role: 'supervisor';
  onSubmit: (data: SupervisorRegisterRequest) => Promise<void>;
};

export type RegisterFormProps = StudentRegisterFormProps | SupervisorRegisterFormProps;

export function RegisterForm(props: RegisterFormProps) {
  const { isLoading, error, onClearError, onSuccess, feedbackMode = 'inline' } = props;
  const role = props.role ?? 'student';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});

  const showInlineBackendFeedback = feedbackMode === 'inline';
  // Derived from the ApiError using pure utility functions (Single Responsibility).
  const backendFieldErrors = showInlineBackendFeedback ? mapBackendFieldErrors(error) : {};
  const generalError = showInlineBackendFeedback ? getGeneralError(error) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onClearError();

    const errors = validateRegisterForm({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      registrationNumber,
      requireRegistrationNumber: role === 'student',
      requireSliitEmail: role === 'supervisor',
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    // Role is assigned server-side — the backend always sets STUDENT for public registration.
    try {
      if (props.role === 'supervisor') {
        await props.onSubmit({ firstName, lastName, email, password });
      } else {
        await props.onSubmit({
          firstName,
          lastName,
          email,
          password,
          registrationNumber,
        });
      }
      onSuccess?.();
    } catch {
      // errors are handled by the caller (useRegister) — do not re-throw
    }
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
          {(fieldErrors.firstName ?? backendFieldErrors.firstName) && (
            <p className="text-xs text-red-500">
              {fieldErrors.firstName ?? backendFieldErrors.firstName}
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
          {(fieldErrors.lastName ?? backendFieldErrors.lastName) && (
            <p className="text-xs text-red-500">
              {fieldErrors.lastName ?? backendFieldErrors.lastName}
            </p>
          )}
        </div>
      </div>

      {role === 'student' && (
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
          {(fieldErrors.registrationNumber ?? backendFieldErrors.registrationNumber) && (
            <p className="text-xs text-red-500">
              {fieldErrors.registrationNumber ?? backendFieldErrors.registrationNumber}
            </p>
          )}
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1">
        <label htmlFor="reg-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="reg-email"
          type="email"
          autoComplete="email"
          placeholder={role === 'supervisor' ? 'name@sliit.lk' : 'you@example.com'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        {(fieldErrors.email ?? backendFieldErrors.email) && (
          <p className="text-xs text-red-500">{fieldErrors.email ?? backendFieldErrors.email}</p>
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
        {(fieldErrors.password ?? backendFieldErrors.password) && (
          <p className="text-xs text-red-500">
            {fieldErrors.password ?? backendFieldErrors.password}
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
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isLoading}
        fullWidth
        className="mt-1"
      >
        {isLoading && feedbackMode === 'inline' ? 'Creating account…' : 'Create Account'}
      </Button>
    </form>
  );
}
