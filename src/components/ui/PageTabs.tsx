import { cn } from '@/lib/cn';

type PageTabItem = {
  value: string;
  label: string;
};

type PageTabsProps = {
  items: PageTabItem[];
  value: string;
  onChange: (value: string) => void;
  tone?: 'student' | 'supervisor' | 'neutral';
  className?: string;
};

const ACTIVE_TONE_CLASSES = {
  student: 'bg-sky-600 text-white',
  supervisor: 'bg-slate-900 text-white',
  neutral: 'bg-slate-900 text-white',
} as const;

export function PageTabs({ items, value, onChange, tone = 'neutral', className }: PageTabsProps) {
  return (
    <section className={cn('rounded-3xl border border-border bg-white p-3 shadow-sm', className)}>
      <div className="-mx-1 overflow-x-auto px-1">
        <div className="inline-flex min-w-full gap-2 sm:flex sm:flex-wrap">
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition-colors',
                value === item.value
                  ? ACTIVE_TONE_CLASSES[tone]
                  : 'bg-transparent text-muted-foreground hover:bg-slate-100 hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
