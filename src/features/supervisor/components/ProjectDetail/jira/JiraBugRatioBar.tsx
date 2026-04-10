import { AlertTriangle } from 'lucide-react';

type JiraBugRatioBarProps = {
  bugRatio: number; // 0–100
};

// Risk zone boundaries (% values)
const WATCH_THRESHOLD = 20;
const CRITICAL_THRESHOLD = 35;

type RiskLevel = 'healthy' | 'watch' | 'critical';

function getRiskLevel(ratio: number): RiskLevel {
  if (ratio > CRITICAL_THRESHOLD) return 'critical';
  if (ratio >= WATCH_THRESHOLD) return 'watch';
  return 'healthy';
}

const RISK_CONFIG = {
  healthy: {
    label: 'Healthy',
    zeroLabel: 'No open bugs',
    barColor: '#10B981',
    barGlow: '#10B98133',
    textClass: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    headerBg: 'from-emerald-50/70',
    iconBg: 'bg-emerald-500',
    needleColor: '#10B981',
  },
  watch: {
    label: 'At Risk',
    zeroLabel: 'No open bugs',
    barColor: '#F59E0B',
    barGlow: '#F59E0B33',
    textClass: 'text-amber-600',
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-700',
    headerBg: 'from-amber-50/70',
    iconBg: 'bg-amber-500',
    needleColor: '#F59E0B',
  },
  critical: {
    label: 'Critical',
    zeroLabel: 'No open bugs',
    barColor: '#EF4444',
    barGlow: '#EF444433',
    textClass: 'text-red-600',
    badgeBg: 'bg-red-50 border-red-200 text-red-700',
    headerBg: 'from-red-50/60',
    iconBg: 'bg-red-500',
    needleColor: '#EF4444',
  },
};

export function JiraBugRatioBar({ bugRatio }: JiraBugRatioBarProps) {
  const clamped = Math.min(100, Math.max(0, bugRatio));
  const risk = getRiskLevel(clamped);
  const cfg = RISK_CONFIG[risk];
  const isZero = clamped === 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-lg">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r ${cfg.headerBg} via-transparent to-transparent px-5 py-3.5`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg} text-white shadow-sm`}
        >
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-wide text-slate-800">Bug Ratio</p>
          <p className="text-[11px] text-slate-400">Open bugs as a share of open issues</p>
        </div>

        {/* Hero metric */}
        <div className="ml-auto flex items-center gap-2.5">
          <span className={`text-2xl font-extrabold tabular-nums leading-none ${cfg.textClass}`}>
            {clamped.toFixed(1)}%
          </span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.badgeBg}`}
          >
            {isZero ? 'No open bugs' : cfg.label}
          </span>
        </div>
      </div>

      {/* ── Risk gauge ──────────────────────────────────────────────────── */}
      <div className="px-5 py-4">
        {/* Zone labels */}
        <div className="mb-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          <span>Low risk</span>
          <span>Watch</span>
          <span>Critical</span>
        </div>

        {/* Bar track */}
        <div className="relative h-4 w-full overflow-visible rounded-full">
          {/* Gradient risk zones */}
          <div className="absolute inset-0 flex overflow-hidden rounded-full">
            <div
              className="h-full"
              style={{
                width: `${WATCH_THRESHOLD}%`,
                background: 'linear-gradient(90deg, #D1FAE5, #A7F3D0)',
              }}
            />
            <div
              className="h-full"
              style={{
                width: `${CRITICAL_THRESHOLD - WATCH_THRESHOLD}%`,
                background: 'linear-gradient(90deg, #FEF3C7, #FDE68A)',
              }}
            />
            <div
              className="h-full flex-1"
              style={{ background: 'linear-gradient(90deg, #FEE2E2, #FECACA)' }}
            />
          </div>

          {/* Zone dividers */}
          <div
            className="absolute inset-y-0 w-px bg-white/80"
            style={{ left: `${WATCH_THRESHOLD}%` }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-y-0 w-px bg-white/80"
            style={{ left: `${CRITICAL_THRESHOLD}%` }}
            aria-hidden="true"
          />

          {/* Active fill bar */}
          {clamped > 0 && (
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${clamped}%`,
                backgroundColor: cfg.barColor,
                opacity: 0.85,
                boxShadow: `0 0 8px 2px ${cfg.barGlow}`,
              }}
            />
          )}

          {/* Needle marker */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
            style={{ left: `${Math.max(clamped, 1)}%` }}
          >
            <div
              className="h-5 w-5 rounded-full border-2 border-white shadow-md"
              style={{ backgroundColor: isZero ? '#94A3B8' : cfg.barColor }}
            />
          </div>
        </div>

        {/* Zone percentage hints */}
        <div className="mt-1 flex justify-between text-[10px] tabular-nums text-slate-400">
          <span>0%</span>
          <span>{WATCH_THRESHOLD}%</span>
          <span>{CRITICAL_THRESHOLD}%</span>
          <span>100%</span>
        </div>

        {/* Policy note */}
        <p className="mt-3 text-[11px] text-slate-400">
          Risk bands reflect the current quality policy.
        </p>
      </div>
    </div>
  );
}
