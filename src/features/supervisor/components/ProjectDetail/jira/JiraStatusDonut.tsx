import type { JiraHealth } from '@/features/supervisor/types';

type JiraStatusDonutProps = {
  health: JiraHealth;
};

const CX = 80;
const CY = 80;
const R = 54;
const STROKE_WIDTH = 22;
const CIRCUMFERENCE = 2 * Math.PI * R; // ≈ 339.3

const SEGMENTS = [
  { key: 'toDo', label: 'To Do', color: '#CBD5E1' },       // slate-300
  { key: 'inProgress', label: 'In Progress', color: '#60A5FA' }, // blue-400
  { key: 'done', label: 'Done', color: '#10B981' },          // emerald-500
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
    const length = total > 0 ? (count / total) * CIRCUMFERENCE : 0;
    // dashOffset makes this segment begin exactly where the previous one ended.
    // Formula: CIRCUMFERENCE - cumulativeLength (positive offset shifts the
    // dash-pattern backward, so the solid stroke appears after the gap.)
    const dashOffset = CIRCUMFERENCE - cumulativeLength;
    cumulativeLength += length;
    return { ...seg, count, length, dashOffset };
  });
}

export function JiraStatusDonut({ health }: JiraStatusDonutProps) {
  const arcs = buildArcs(health.statusBreakdown);
  const total = health.statusBreakdown.toDo + health.statusBreakdown.inProgress + health.statusBreakdown.done;
  const completionLabel = `${Math.round(health.completionPercent)}%`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        Status breakdown
      </p>

      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        {/* SVG donut */}
        <svg
          viewBox="0 0 160 160"
          className="w-full max-w-[140px] shrink-0"
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
                    strokeLinecap="butt"
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
            fontSize={20}
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
            fontSize={9}
            fontWeight={600}
            fill="#94A3B8"
            fontFamily="inherit"
            letterSpacing="0.12em"
          >
            DONE
          </text>
        </svg>

        {/* Legend */}
        <ul className="w-full space-y-2.5 pt-1" aria-label="Status legend">
          {arcs.map((arc) => (
            <li key={arc.key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: arc.color }}
                />
                <span className="truncate text-xs text-slate-600">{arc.label}</span>
              </div>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-800">
                {arc.count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
