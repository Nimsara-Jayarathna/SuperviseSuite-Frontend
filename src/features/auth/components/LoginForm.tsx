import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '../hooks/useAuth';

type FieldErrors = { email?: string; password?: string };

/** Client-side validation — returns an error map; empty object means valid. */
function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email.';
  if (!password) errors.password = 'Password is required.';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  return errors;
}

type LoginFormProps = {
  onSuccess?: () => void;
};

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Map backend field-level errors onto individual fields.
  const backendFieldErrors = error?.details.reduce<FieldErrors>((acc, d) => {
    if (d.field === 'email' || d.field === 'password') acc[d.field] = d.issue;
    return acc;
  }, {});

  // Show a general banner only for non-field-level errors.
  const generalError = error && error.code !== 'VALIDATION_ERROR' ? error.message : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();

    const errors = validate(email, password);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    await login({ email, password });
    onSuccess?.();
  }

  const emailError = fieldErrors.email ?? backendFieldErrors?.email;
  const passwordError = fieldErrors.password ?? backendFieldErrors?.password;

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

      <Button type="submit" variant="hero" size="lg" disabled={isLoading} className="mt-1 w-full">
        {isLoading ? 'Signing in…' : 'Sign In'}
      </Button>
    </form>
  );
}
