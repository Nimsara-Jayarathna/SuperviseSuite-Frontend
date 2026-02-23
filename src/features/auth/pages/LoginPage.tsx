import { Link } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 py-12">
      {/* Background gradient orbs — matches the soft pink/blue corner glow */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-pink-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md">
            <span className="text-sm font-bold text-primary-foreground">SS</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-border">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">Need help? Contact support.</p>
      </div>
    </div>
  );
}
