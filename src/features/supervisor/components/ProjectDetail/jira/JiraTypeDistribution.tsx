import { useState } from 'react';
import { Layers } from 'lucide-react';
import type { JiraHealth } from '@/features/supervisor/types';

type JiraTypeDistributionProps = {
  health: JiraHealth;
};

// Color palette — each type gets a slot
const PALETTE = [
  { bar: '#6366F1', track: '#E0E7FF', badge: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { bar: '#06B6D4', track: '#CFFAFE', badge: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { bar: '#8B5CF6', track: '#EDE9FE', badge: 'bg-violet-50 border-violet-200 text-violet-700' },
  { bar: '#F59E0B', track: '#FEF3C7', badge: 'bg-amber-50 border-amber-200 text-amber-700' },
  { bar: '#10B981', track: '#D1FAE5', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { bar: '#F43F5E', track: '#FFE4E6', badge: 'bg-rose-50 border-rose-200 text-rose-700' },
];

function truncate(s: string, max = 18): string {
  return s.length > max ? `${s.slice(0, max)}\u2026` : s;
}

export function JiraTypeDistribution({ health }: JiraTypeDistributionProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sort descending, cap at 6
  const items = [...health.typeDistribution].sort((a, b) => b.count - a.count).slice(0, 6);

  const total = items.reduce((sum, item) => sum + item.count, 0);

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-lg">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-transparent to-transparent px-5 py-3.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm">
            <Layers className="h-4 w-4" />
          </span>
          <p className="text-sm font-bold tracking-wide text-slate-800">Issue Types</p>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-slate-400">No issue type data</p>
        </div>
      </div>
    );
  }

  // ── Main card ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-lg">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-transparent to-transparent px-5 py-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm">
          <Layers className="h-4 w-4" />
        </span>
        <p className="text-sm font-bold tracking-wide text-slate-800">Issue Types</p>
        <span className="ml-auto rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-500 shadow-sm">
          {total} issues
        </span>
      </div>

      {/* ── Rows ───────────────────────────────────────────────────────────── */}
      <ul
        className="flex flex-1 flex-col gap-0 divide-y divide-slate-50 p-3"
        aria-label="Issue type distribution"
      >
        {items.map((item, index) => {
          const palette = PALETTE[index % PALETTE.length];
          const sharePct = total > 0 ? (item.count / total) * 100 : 0;
          const isHovered = hoveredIndex === index;

          return (
            <li
              key={`${item.type}-${index}`}
              className={`group cursor-default rounded-xl px-3 py-2.5 transition-all duration-200 ${
                isHovered ? 'bg-slate-50 shadow-sm' : 'hover:bg-slate-50/60'
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Top row: label + count + % badge */}
              <div className="flex items-center gap-2">
                {/* Color dot */}
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: palette.bar }}
                />

                {/* Type label */}
                <span
                  className={`flex-1 truncate text-sm font-medium transition-colors duration-200 ${
                    isHovered ? 'text-slate-900' : 'text-slate-700'
                  }`}
                  title={item.type}
                >
                  {truncate(item.type)}
                </span>

                {/* Count */}
                <span className="shrink-0 text-sm font-bold tabular-nums text-slate-800">
                  {item.count}
                </span>

                {/* % badge */}
                <span
                  className={`ml-0.5 shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${palette.badge}`}
                >
                  {Math.round(sharePct)}%
                </span>
              </div>

              {/* Progress bar */}
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full transition-all duration-200"
                style={{ backgroundColor: palette.track }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${sharePct}%`,
                    backgroundColor: palette.bar,
                    opacity: hoveredIndex === null || isHovered ? 1 : 0.5,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
