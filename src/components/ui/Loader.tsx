type LoaderProps = {
  label?: string;
};

export function Loader({ label = 'Loading...' }: LoaderProps) {
  return (
    <div className="inline-flex items-center gap-3 text-sm text-muted-foreground" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
      <span>{label}</span>
    </div>
  );
}
