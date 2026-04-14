import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { ApiError } from '@/types';
import type { LoginRequest } from '../types';
import { Link } from 'react-router-dom';
import {
  getLoginGeneralError,
  mapBackendLoginFieldErrors,
  type LoginFieldErrors,
  validateLoginForm,
} from '../utils/loginValidation';

/**
 * Props follow the Dependency Inversion Principle:
 * LoginForm depends on abstractions (callbacks + data), not on a concrete
 * hook implementation. This makes the component independently testable and
 * reusable in any context that can provide these props.
 */
export type LoginFormProps = {
  /** Called with the validated payload — caller decides what to do with it. */
  onSubmit: (data: LoginRequest) => Promise<void>;
  isLoading: boolean;
  error: ApiError | null;
  onClearError: () => void;
  onSuccess?: () => void;
  feedbackMode?: 'inline' | 'modal';
  onForgotPassword?: () => void;
};

export function LoginForm({
  onSubmit,
  isLoading,
  error,
  onClearError,
  onSuccess,
  feedbackMode = 'inline',
  onForgotPassword,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

  const showInlineBackendFeedback = feedbackMode === 'inline';
  // Derived from the ApiError using pure utility functions (Single Responsibility).
  const backendFieldErrors = showInlineBackendFeedback ? mapBackendLoginFieldErrors(error) : {};
  const generalError = showInlineBackendFeedback ? getLoginGeneralError(error) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onClearError();

    const errors = validateLoginForm(email, password);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      await onSubmit({ email, password });
      onSuccess?.();
    } catch {
      // errors are handled by the caller (useAuth) — do not re-throw
    }
  }

  const emailError = fieldErrors.email ?? backendFieldErrors?.email;
  const passwordError = fieldErrors.password ?? backendFieldErrors?.password;
  const isValid = Object.keys(validateLoginForm(email, password)).length === 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* General error banner */}
      {generalError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{generalError}</p>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1">
        <label htmlFor="login-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {emailError && <p className="text-xs text-red-500">{emailError}</p>}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1">
        <label htmlFor="login-password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isLoading || !isValid}
        fullWidth
        className="mt-1"
      >
        Sign In
      </Button>

      {onForgotPassword ? (
        <button
          type="button"
          className="mx-auto text-sm text-primary hover:underline"
          onClick={onForgotPassword}
        >
          Forgot your password?
        </button>
      ) : (
        <Link to="/forgot-password" className="mx-auto text-sm text-primary hover:underline">
          Forgot your password?
        </Link>
      )}
    </form>
  );
}
