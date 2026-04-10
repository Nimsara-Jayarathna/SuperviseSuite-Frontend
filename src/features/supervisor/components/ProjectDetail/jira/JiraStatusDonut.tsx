import { useState, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';
import type { JiraHealth } from '@/features/supervisor/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type JiraStatusDonutProps = {
  health: JiraHealth;
};

type ActiveShapeProps = PieSectorDataItem & {
  color: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────
const SEGMENTS = [
  {
    key: 'done' as const,
    label: 'Done',
    color: '#10B981',
    trackColor: '#D1FAE5',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    badgeText: 'text-emerald-700',
    dotGlow: '#10B98144',
  },
  {
    key: 'inProgress' as const,
    label: 'In Progress',
    color: '#6366F1',
    trackColor: '#E0E7FF',
    badgeBg: 'bg-indigo-50',
    badgeBorder: 'border-indigo-200',
    badgeText: 'text-indigo-700',
    dotGlow: '#6366F144',
  },
  {
    key: 'toDo' as const,
    label: 'To Do',
    color: '#94A3B8',
    trackColor: '#F1F5F9',
    badgeBg: 'bg-slate-50',
    badgeBorder: 'border-slate-200',
    badgeText: 'text-slate-600',
    dotGlow: '#94A3B844',
  },
] as const;

// ─── Active (hovered) slice shape ─────────────────────────────────────────────
function ActiveShape(props: ActiveShapeProps) {
  const { cx = 0, cy = 0, innerRadius = 0, outerRadius = 0, startAngle, endAngle, color } = props;

  // Draw a slightly expanded arc via SVG path using recharts internals.
  // We leverage the sector geometry that recharts already computed for us.
  const expandedOuter = (outerRadius as number) + 6;
  const shrunkInner = (innerRadius as number) - 2;

  return (
    <g>
      {/* Glow ring */}
      <circle
        cx={cx}
        cy={cy}
        r={(outerRadius as number) + 10}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.18}
      />
      {/* Active sector — recharts renders via the path calculated below */}
      <path
        d={describeArc(
          cx as number,
          cy as number,
          expandedOuter,
          shrunkInner,
          startAngle as number,
          endAngle as number,
        )}
        fill={color}
        opacity={0.95}
        strokeWidth={0}
      />
    </g>
  );
}

// ─── Tiny custom tooltip ───────────────────────────────────────────────────────
interface CustomTooltipPayloadItem {
  payload?: {
    label: string;
    value: number;
    percent: number;
    color: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  if (!entry) return null;
  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-xl"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: entry.color }}
      />
      <span className="text-xs font-semibold text-slate-800">{entry.label}</span>
      <span className="text-xs font-bold tabular-nums text-slate-900">{entry.value}</span>
      <span className="text-[10px] font-medium text-slate-400">
        {Math.round(entry.percent * 100)}%
      </span>
    </div>
  );
}

// ─── SVG arc math helper ───────────────────────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const s = polarToCartesian(cx, cy, outerR, endAngle);
  const e = polarToCartesian(cx, cy, outerR, startAngle);
  const si = polarToCartesian(cx, cy, innerR, endAngle);
  const ei = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    `M ${s.x} ${s.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${e.x} ${e.y}`,
    `L ${ei.x} ${ei.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${si.x} ${si.y}`,
    'Z',
  ].join(' ');
}

// ─── Main component ────────────────────────────────────────────────────────────
export function JiraStatusDonut({ health }: JiraStatusDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total =
    health.statusBreakdown.done + health.statusBreakdown.inProgress + health.statusBreakdown.toDo;

  const completionPct = Math.round(health.completionPercent);

  // Build recharts data array in SEGMENTS order
  const data = SEGMENTS.map((seg) => ({
    label: seg.label,
    value: health.statusBreakdown[seg.key],
    color: seg.color,
    percent: total > 0 ? health.statusBreakdown[seg.key] / total : 0,
  }));

  const onEnter = useCallback((_: unknown, index: number) => setActiveIndex(index), []);
  const onLeave = useCallback(() => setActiveIndex(null), []);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-lg">
      {/* ── Tinted header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-transparent to-transparent px-5 py-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <p className="text-sm font-bold tracking-wide text-slate-800">Status Breakdown</p>
        <span className="ml-auto rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-500 shadow-sm">
          {total} issues
        </span>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        {/* Donut via Recharts */}
        <div className="relative mx-auto flex w-full min-w-0 max-w-[188px] shrink-0 flex-col items-center">
          <ResponsiveContainer
            width="100%"
            aspect={1}
            initialDimension={{ width: 188, height: 188 }}
          >
            <PieChart>
              <defs>
                {SEGMENTS.map((seg) => (
                  <radialGradient key={seg.key} id={`grad-${seg.key}`} r="50%" cx="50%" cy="50%">
                    <stop offset="0%" stopColor={seg.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={seg.color} stopOpacity={0.8} />
                  </radialGradient>
                ))}
              </defs>

              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="78%"
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
                isAnimationActive
                animationBegin={0}
                animationDuration={900}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
                activeShape={(props: PieSectorDataItem) =>
                  (
                    <ActiveShape
                      {...props}
                      color={
                        activeIndex !== null
                          ? (SEGMENTS[activeIndex]?.color ?? '#10B981')
                          : '#10B981'
                      }
                    />
                  ) as React.ReactElement
                }
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#grad-${SEGMENTS[index].key})`}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                    style={{ cursor: 'pointer', transition: 'opacity 200ms ease' }}
                  />
                ))}
              </Pie>

              <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center overlay — positioned absolutely over the SVG */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[26px] font-extrabold leading-none tracking-tight text-slate-900">
              {completionPct}%
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {health.statusBreakdown.done}/{total} done
            </span>
          </div>
        </div>

        {/* ── Legend ───────────────────────────────────────────────────────── */}
        <ul className="w-full space-y-2" aria-label="Status legend">
          {SEGMENTS.map((seg, i) => {
            const count = health.statusBreakdown[seg.key];
            const pct = total > 0 ? (count / total) * 100 : 0;
            const isActive = activeIndex === i;

            return (
              <li
                key={seg.key}
                className={`cursor-default rounded-xl border px-3 py-2.5 transition-all duration-200 ${
                  isActive
                    ? 'border-slate-200 bg-slate-50 shadow-sm'
                    : 'border-transparent hover:border-slate-100 hover:bg-slate-50/70'
                }`}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {/* Row: dot + label + count + badge */}
                <div className="flex items-center gap-2">
                  {/* Animated dot */}
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: seg.color,
                      boxShadow: isActive ? `0 0 0 4px ${seg.dotGlow}` : 'none',
                      transform: isActive ? 'scale(1.25)' : 'scale(1)',
                    }}
                  />

                  <span
                    className={`flex-1 truncate text-sm font-medium transition-colors duration-200 ${
                      isActive ? 'text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    {seg.label}
                  </span>

                  {/* Count */}
                  <span
                    className={`text-sm font-bold tabular-nums transition-colors duration-200 ${
                      isActive ? 'text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {count}
                  </span>

                  {/* Percent badge */}
                  <span
                    className={`ml-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${seg.badgeBg} ${seg.badgeBorder} ${seg.badgeText}`}
                  >
                    {Math.round(pct)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: seg.trackColor }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: seg.color }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
