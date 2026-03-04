import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/brand/Logo';
import { Link } from 'react-router-dom';

type LandingNavProps = {
  onLogin: () => void;
  onRegister: () => void;
};

export function LandingNav({ onLogin, onRegister }: LandingNavProps) {
  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center" aria-label="Go to SuperviseSuite home">
          <Logo size={36} showWordmark />
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="nav"
            size="md"
            className="rounded-2xl px-4 py-2 text-sm font-medium"
            onClick={onLogin}
          >
            Login
          </Button>
          <Button
            variant="nav-primary"
            size="md"
            className="rounded-2xl px-4 py-2 text-sm font-medium"
            onClick={onRegister}
          >
            Register
          </Button>
        </div>
      </div>
    </nav>
  );
}
