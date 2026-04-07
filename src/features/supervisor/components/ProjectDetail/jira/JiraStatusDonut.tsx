import type { JiraHealth } from '@/features/supervisor/types';

type JiraStatusDonutProps = {
  health: JiraHealth;
};

const CX = 80;
const CY = 80;
const R = 54;
const STROKE_WIDTH = 22;
const CIRCUMFERENCE = 2 * Math.PI * R; // ≈ 339.3
const ARC_GAP = 4;

const SEGMENTS = [
  { key: 'done', label: 'Done', color: '#10B981' },          // emerald-500
  { key: 'inProgress', label: 'In Progress', color: '#60A5FA' }, // blue-400
  { key: 'toDo', label: 'To Do', color: '#CBD5E1' },       // slate-300
] as const;

function buildArcs(statusBreakdown: JiraHealth['statusBreakdown']) {
  const counts = {
    toDo: statusBreakdown.toDo,
    inProgress: statusBreakdown.inProgress,
    done: statusBreakdown.done,
  };
  const total = counts.toDo + counts.inProgress + counts.done;

  let cumulativeLength = 0;

  return SEGMENTS.map((seg) => {
    const count = counts[seg.key];
    const rawLength = total > 0 ? (count / total) * CIRCUMFERENCE : 0;
    const length = rawLength <= 0 ? 0 : Math.max(rawLength - ARC_GAP, 2);
    // dashOffset makes this segment begin exactly where the previous one ended.
    // Formula: CIRCUMFERENCE - cumulativeLength (positive offset shifts the
    // dash-pattern backward, so the solid stroke appears after the gap.)
    const dashOffset = CIRCUMFERENCE - cumulativeLength;
    cumulativeLength += rawLength;
    const percent = total > 0 ? (count / total) * 100 : 0;
    return { ...seg, count, length, dashOffset, percent };
  });
}

export function JiraStatusDonut({ health }: JiraStatusDonutProps) {
  const arcs = buildArcs(health.statusBreakdown);
  const total = health.statusBreakdown.toDo + health.statusBreakdown.inProgress + health.statusBreakdown.done;
  const completionLabel = `${Math.round(health.completionPercent)}%`;

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
        Status breakdown
      </p>

      <div className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,188px)_minmax(0,1fr)] sm:items-center">
        {/* SVG donut */}
        <svg
          viewBox="0 0 160 160"
          className="mx-auto w-full max-w-[188px] shrink-0"
          aria-label="Status breakdown donut chart"
          role="img"
        >
          {/* Background track */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={STROKE_WIDTH}
          />

          {total > 0 &&
            arcs.map(
              (arc) =>
                arc.length > 0 && (
                  <circle
                    key={arc.key}
                    cx={CX}
                    cy={CY}
                    r={R}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={STROKE_WIDTH}
                    strokeLinecap="round"
                    strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
                    strokeDashoffset={arc.dashOffset}
                    // Rotate so arc starts at the 12-o'clock position
                    transform={`rotate(-90 ${CX} ${CY})`}
                  />
                ),
            )}

          {/* Center label */}
          <text
            x={CX}
            y={CY - 7}
            textAnchor="middle"
            fontSize={22}
            fontWeight={700}
            fill="#1E293B"
            fontFamily="inherit"
          >
            {completionLabel}
          </text>
          <text
            x={CX}
            y={CY + 9}
            textAnchor="middle"
            fontSize={9.5}
            fontWeight={600}
            fill="#94A3B8"
            fontFamily="inherit"
            letterSpacing="0.12em"
          >
            {`${health.statusBreakdown.done}/${total || 0} DONE`}
          </text>
        </svg>

        {/* Legend */}
        <ul className="w-full space-y-3 pt-1" aria-label="Status legend">
          {arcs.map((arc) => (
            <li key={arc.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: arc.color }}
                />
                <span className="truncate text-sm text-slate-700">{arc.label}</span>
              </div>
              <div className="shrink-0 text-right leading-tight">
                <p className="text-sm font-semibold tabular-nums text-slate-900">{arc.count}</p>
                <p className="text-xs text-slate-600">{`${Math.round(arc.percent)}%`}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
