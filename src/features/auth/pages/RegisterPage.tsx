import { Link, useSearchParams } from 'react-router-dom';
import type { UserRole } from '../types';
import { RegisterForm } from '../components/RegisterForm';

const VALID_ROLES: UserRole[] = ['STUDENT', 'SUPERVISOR'];

export function RegisterPage() {
  const [searchParams] = useSearchParams();

  // Pre-select role when navigating from CTA buttons (e.g. /register?role=STUDENT)
  const roleParam = searchParams.get('role')?.toUpperCase() as UserRole | undefined;
  const initialRole = roleParam && VALID_ROLES.includes(roleParam) ? roleParam : undefined;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 py-12">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-pink-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md">
            <span className="text-sm font-bold text-primary-foreground">SS</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Get started today!</h1>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-border">
          <RegisterForm initialRole={initialRole} />
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
