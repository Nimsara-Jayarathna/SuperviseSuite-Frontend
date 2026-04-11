import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';
import type { useRegistrationFlow } from '../../hooks/useRegistrationFlow';

type RegistrationFlow = ReturnType<typeof useRegistrationFlow>;

type Step1EmailInputProps = {
  flow: RegistrationFlow;
};

export function Step1EmailInput({ flow }: Step1EmailInputProps) {
  const [email, setEmail] = useState(flow.email ?? '');
  const errorMessage = flow.error?.message ?? null;
  const isAlreadyRegistered =
    flow.error?.code === 'CONFLICT' ||
    (errorMessage?.toLowerCase().includes('already registered') ?? false) ||
    (errorMessage?.toLowerCase().includes('already exists') ?? false);

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
          onChange={(e) => setEmail(e.target.value)}
          onFocus={flow.clearError}
          placeholder="you@example.com"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

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

      <Button type="submit" variant="primary" size="lg" fullWidth disabled={flow.isLoading}>
        {flow.isLoading ? 'Sending code…' : 'Continue'}
      </Button>
    </form>
  );
}
