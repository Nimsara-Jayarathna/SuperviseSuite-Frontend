type JiraBugRatioBarProps = {
  bugRatio: number; // 0–100
};

function ratioColor(ratio: number): { bar: string; label: string } {
  if (ratio > 35) return { bar: 'bg-red-500', label: 'text-red-600' };
  if (ratio >= 20) return { bar: 'bg-amber-400', label: 'text-amber-600' };
  return { bar: 'bg-emerald-500', label: 'text-emerald-600' };
}

export function JiraBugRatioBar({ bugRatio }: JiraBugRatioBarProps) {
  const clamped = Math.min(100, Math.max(0, bugRatio));
  const { bar, label } = ratioColor(clamped);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Bug ratio
        </p>
        <p className={`text-sm font-semibold tabular-nums ${label}`}>
          {clamped.toFixed(1)}%
        </p>
      </div>

      {/* Track */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        {/* Fill */}
        <div
          className={`h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
        <span>0%</span>
        <span>35%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
