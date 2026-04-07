type JiraBugRatioBarProps = {
  bugRatio: number; // 0–100
};

function ratioColor(ratio: number): {
  bar: string;
  label: string;
  badge: string;
  badgeTone: string;
} {
  if (ratio > 35) {
    return {
      bar: 'bg-red-500',
      label: 'text-red-600',
      badge: 'Critical',
      badgeTone: 'bg-red-100 text-red-700',
    };
  }
  if (ratio >= 20) {
    return {
      bar: 'bg-amber-500',
      label: 'text-amber-600',
      badge: 'At risk',
      badgeTone: 'bg-amber-100 text-amber-700',
    };
  }
  return {
    bar: 'bg-emerald-500',
    label: 'text-emerald-600',
    badge: 'Healthy',
    badgeTone: 'bg-emerald-100 text-emerald-700',
  };
}

export function JiraBugRatioBar({ bugRatio }: JiraBugRatioBarProps) {
  const clamped = Math.min(100, Math.max(0, bugRatio));
  const { bar, label, badge, badgeTone } = ratioColor(clamped);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
            Bug ratio
          </p>
          <p className="mt-1 text-sm text-slate-600">Open bugs as a share of open issues</p>
        </div>
        <div className="text-right">
          <p className={`text-base font-semibold tabular-nums ${label}`}>{clamped.toFixed(1)}%</p>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${badgeTone}`}>
            {badge}
          </span>
        </div>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        <div className="absolute inset-0 flex">
          <div className="h-full" style={{ width: '20%', backgroundColor: '#DCFCE7' }} />
          <div className="h-full" style={{ width: '15%', backgroundColor: '#FEF3C7' }} />
          <div className="h-full" style={{ width: '65%', backgroundColor: '#FEE2E2' }} />
        </div>

        <div
          className="absolute inset-y-0 border-l border-slate-300/70"
          style={{ left: '20%' }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-y-0 border-l border-slate-300/70"
          style={{ left: '35%' }}
          aria-hidden="true"
        />

        <div
          className={`relative h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-xs tabular-nums text-slate-600">
        <span>0%</span>
        <span>20%</span>
        <span>35%</span>
        <span>100%</span>
      </div>

      <p className="mt-1.5 text-xs text-slate-600">
        Healthy {'<'}20% | At risk 20-35% | Critical {'>'}35%
      </p>
    </div>
  );
}
