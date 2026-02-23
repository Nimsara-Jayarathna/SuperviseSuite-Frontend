import { Button } from '@/components/ui/Button';

export function HeroSection() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="flex max-w-2xl flex-col items-center text-center">
        <span className="mb-6 rounded-full border border-gray-300 bg-white px-4 py-1 text-xs text-gray-500">
          Now in Public Beta
        </span>

        <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-900">
          Streamline Your <span className="text-indigo-500">Research Supervision.</span>
        </h1>

        <p className="mt-6 max-w-md text-base leading-relaxed text-gray-500">
          The all-in-one dashboard connecting Supervisors and Students. Track GitHub commits, manage
          meeting minutes, and sync directly with Jira.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Button className="rounded-md bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600">
            Student Portal
          </Button>
          <Button className="rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">
            Supervisor Access
          </Button>
        </div>
      </div>
    </div>
  );
}
