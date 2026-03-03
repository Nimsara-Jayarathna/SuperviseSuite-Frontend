import { cn } from '@/lib/cn';

type LogoMarkProps = {
  /** Height in px — width scales proportionally (aspect ratio 1024:890) */
  size?: number;
  className?: string;
};

type LogoProps = LogoMarkProps & {
  /** Show wordmark "SuperviseSuite" beside the mark */
  showWordmark?: boolean;
};

/**
 * LogoMark — renders the SuperviseSuite logo mark at the given height.
 * Width auto-scales using the SVG's native 1024:890 aspect ratio.
 */
export function LogoMark({ size = 40, className }: LogoMarkProps) {
  const width = Math.round(size * (1024 / 890));
  return (
    <img
      src="/logo.svg"
      alt="SuperviseSuite"
      width={width}
      height={size}
      className={cn('inline-block flex-shrink-0', className)}
      draggable={false}
    />
  );
}

/**
 * Logo — renders the logo mark with an optional "SuperviseSuite" wordmark.
 */
export function Logo({ size = 40, showWordmark = false, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span
          className="font-semibold tracking-tight text-foreground"
          style={{ fontSize: size * 0.45 }}
        >
          SuperviseSuite
        </span>
      )}
    </span>
  );
}
