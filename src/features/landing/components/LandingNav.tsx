import { Button } from '@/components/ui/Button';
import { LogoMark } from '@/components/brand/Logo';
import { Link } from 'react-router-dom';

type LandingNavProps = {
  onLogin: () => void;
  onRegister: () => void;
};

export function LandingNav({ onLogin, onRegister }: LandingNavProps) {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 h-[var(--nav-height)] border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="Go to SuperviseSuite home">
          <LogoMark size={28} />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            SuperviseSuite
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="nav" size="sm" onClick={onLogin}>
            Login
          </Button>
          <Button variant="nav-primary" size="sm" onClick={onRegister}>
            Register
          </Button>
        </div>
      </div>
    </nav>
  );
}
