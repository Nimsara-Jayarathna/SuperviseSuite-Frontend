import { Search } from 'lucide-react';

type DashboardSearchInputProps = {
  query: string;
  onChange: (next: string) => void;
};

export function DashboardSearchInput({ query, onChange }: DashboardSearchInputProps) {
  return (
    <label className="relative block w-full min-w-0 max-w-md">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search project"
        className="w-full rounded-2xl border border-border bg-white py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-amber-300"
      />
    </label>
  );
}
