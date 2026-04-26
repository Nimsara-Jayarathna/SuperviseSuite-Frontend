import { cn } from '@/lib/cn';
import {
  formatLifecycleLabel,
  getLifecycleDotClass,
  type LifecycleValue,
  type LifecycleTone,
} from './lifecycleConstants';
import { getLifecycleTone } from './lifecycleConstants';

type LifecycleTilesProps = {
  value: LifecycleValue;
  disabled?: boolean;
  options: readonly LifecycleValue[];
  onChange: (next: LifecycleValue) => void;
};

const TONE_TILE_SELECTED: Record<LifecycleTone, string> = {
  student: 'border-sky-200 bg-sky-50 text-sky-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
};

export function LifecycleTiles({ value, disabled, options, onChange }: LifecycleTilesProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Select lifecycle status"
      className={cn(
        'flex flex-wrap justify-end gap-2',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      {options.map((option) => {
        const selected = option === value;
        const tone = getLifecycleTone(option);
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Set lifecycle to ${formatLifecycleLabel(option)}`}
            onClick={() => {
              if (!selected) onChange(option);
            }}
            className={cn(
              'inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all',
              selected
                ? TONE_TILE_SELECTED[tone]
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/60',
            )}
            disabled={disabled}
          >
            <span className={cn('h-2.5 w-2.5 rounded-full', getLifecycleDotClass(option))} />
            <span>{formatLifecycleLabel(option)}</span>
          </button>
        );
      })}
    </div>
  );
}
