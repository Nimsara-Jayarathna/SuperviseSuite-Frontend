import type { JiraHealth } from '@/features/supervisor/types';

type JiraTypeDistributionProps = {
  health: JiraHealth;
};

// Coordinate space for the SVG bar chart
const SVG_WIDTH = 280;
const ROW_HEIGHT = 32;
const LABEL_X = 0;
const BAR_X = 82; // left edge of bars
const BAR_MAX_WIDTH = 158; // max bar width in SVG units
const BAR_HEIGHT = 13;
const COUNT_X = SVG_WIDTH; // count label right-aligned

// Bar colours — cycled for each type
const BAR_COLORS = [
  '#6366F1', // indigo-500
  '#06B6D4', // cyan-500
  '#8B5CF6', // violet-500
  '#F59E0B', // amber-400
  '#10B981', // emerald-500
  '#F43F5E', // rose-500
];

function truncate(s: string, max = 11): string {
  return s.length > max ? `${s.slice(0, max)}\u2026` : s;
}

export function JiraTypeDistribution({ health }: JiraTypeDistributionProps) {
  // Show up to 6 types, sorted descending by count
  const items = [...health.typeDistribution]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Issue types
        </p>
        <p className="mt-4 text-center text-xs text-slate-400">No issue type data</p>
      </div>
    );
  }

  const maxCount = Math.max(...items.map((i) => i.count), 1);
  const svgHeight = items.length * ROW_HEIGHT;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        Issue types
      </p>

      <div className="mt-4">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
          width="100%"
          height={svgHeight}
          aria-label="Issue type distribution bar chart"
          role="img"
        >
          {items.map((item, index) => {
            const cy = index * ROW_HEIGHT + ROW_HEIGHT / 2;
            const barWidth = (item.count / maxCount) * BAR_MAX_WIDTH;
            const color = BAR_COLORS[index % BAR_COLORS.length];

            return (
              <g key={`${item.type}-${index}`}>
                {/* Type label */}
                <text
                  x={LABEL_X}
                  y={cy + 4}
                  fontSize={10}
                  fontWeight={500}
                  fill="#94A3B8"
                  fontFamily="inherit"
                >
                  {truncate(item.type)}
                </text>

                {/* Background track */}
                <rect
                  x={BAR_X}
                  y={cy - BAR_HEIGHT / 2}
                  width={BAR_MAX_WIDTH}
                  height={BAR_HEIGHT}
                  rx={4}
                  fill="#F1F5F9"
                />

                {/* Filled bar */}
                {barWidth > 0 && (
                  <rect
                    x={BAR_X}
                    y={cy - BAR_HEIGHT / 2}
                    width={barWidth}
                    height={BAR_HEIGHT}
                    rx={4}
                    fill={color}
                  />
                )}

                {/* Count label */}
                <text
                  x={COUNT_X}
                  y={cy + 4}
                  fontSize={10}
                  fontWeight={600}
                  fill="#475569"
                  textAnchor="end"
                  fontFamily="inherit"
                >
                  {item.count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
