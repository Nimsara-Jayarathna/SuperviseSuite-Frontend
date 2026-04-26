import { cn } from '@/lib/cn';
import { formatLifecycleLabel, getLifecycleDotClass, getLifecycleTone } from './lifecycleConstants';

type LifecycleChipProps = {
  value: string;
};

const TONE_CHIP_CLASSES: Record<ReturnType<typeof getLifecycleTone>, string> = {
  student: 'border-sky-200 bg-sky-50 text-sky-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
};

export function LifecycleChip({ value }: LifecycleChipProps) {
  const tone = getLifecycleTone(value);
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black uppercase tracking-wide',
        TONE_CHIP_CLASSES[tone],
      )}
    >
      <span className={cn('h-2.5 w-2.5 rounded-full', getLifecycleDotClass(value))} />
      <span>{formatLifecycleLabel(value)}</span>
    </div>
  );
}
