import { Button } from '@/components/ui/Button';

export function LandingNav() {
  return (
    <nav className="flex items-center justify-between px-8 py-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500 text-xs font-bold text-white">
          SS
        </div>
        <span className="text-sm font-semibold text-gray-900">SuperviseSuite</span>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-sm text-gray-600 hover:text-gray-900">Login</button>
        <Button className="rounded-md bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-600">
          Register
        </Button>
      </div>
    </nav>
  );
}
