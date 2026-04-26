import { AlertCircle, CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DropdownSurface } from '@/components/ui/DropdownSurface';
import { PillDropdownTrigger } from '@/components/ui/PillDropdownTrigger';
import { useAnchoredMenu } from '@/components/ui/useAnchoredMenu';
import { computePillDropdownWidthPx } from '@/components/ui/pillDropdownSizing';
import { measureLongestLabelPx } from '@/lib/textMeasure';
import { MILESTONE_STATUS_OPTIONS } from '../../projectDetails.shared';
import type { MilestoneStatus } from '../../projectDetails.shared';

function statusLabel(status: MilestoneStatus) {
  return status.replace('_', ' ');
}

function getStatusIcon(status: MilestoneStatus, className?: string) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className={className} />;
    case 'IN_PROGRESS':
      return <Clock className={className} />;
    case 'PLANNED':
      return <Circle className={className} />;
    case 'MISSED':
      return <AlertCircle className={className} />;
    case 'CANCELLED':
      return <XCircle className={className} />;
    default:
      return <Circle className={className} />;
  }
}

type MilestoneStatusDropdownProps = {
  value: MilestoneStatus;
  disabled?: boolean;
  visibleOptions: MilestoneStatus[];
  isOpen: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  onSelect: (nextValue: MilestoneStatus) => void;
};

export function MilestoneStatusDropdown({
  value,
  disabled,
  visibleOptions,
  isOpen,
  onOpenChange,
  onSelect,
}: MilestoneStatusDropdownProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [widthPx, setWidthPx] = useState<number>(160);

  const allStatusLabels = useMemo(() => MILESTONE_STATUS_OPTIONS.map(statusLabel), []);
  const visibleLabels = useMemo(() => visibleOptions.map(statusLabel), [visibleOptions]);

  useLayoutEffect(() => {
    const fontSourceEl = measureRef.current ?? triggerRef.current ?? undefined;
    if (!fontSourceEl) return;
    const labelPx = measureLongestLabelPx({ labels: allStatusLabels, fontSourceEl });
    const nextWidth = computePillDropdownWidthPx({ labelPx, minWidthPx: 160, maxWidthPx: 240 });
    setWidthPx(nextWidth);
  }, [allStatusLabels]);

  const {
    isOpen: menuIsOpen,
    open,
    close,
    menuRef,
    menuStyle,
  } = useAnchoredMenu({
    anchorRef: triggerRef,
    labels: visibleLabels,
    align: 'auto',
    offset: 6,
    matchTriggerWidth: true,
    getFontSourceEl: () => measureRef.current ?? triggerRef.current,
    onRequestClose: () => onOpenChange(false),
  });

  // Sync controlled open state -> anchored menu internal state.
  useLayoutEffect(() => {
    if (isOpen) open();
    else close();
  }, [close, isOpen, open]);

  return (
    <>
      {/* Hidden span purely to provide correct font measurement context */}
      <span
        ref={measureRef}
        className="pointer-events-none absolute opacity-0 text-[10px] font-black uppercase tracking-wider"
      />
      <PillDropdownTrigger
        ref={triggerRef}
        aria-label="Change milestone status"
        title={
          disabled
            ? 'No alternative status available for this milestone.'
            : 'Change milestone status'
        }
        disabled={disabled}
        isOpen={isOpen}
        widthPx={widthPx}
        icon={getStatusIcon(value, 'h-3.5 w-3.5')}
        label={
          <span className="inline-flex items-center leading-none text-[10px] font-black uppercase tracking-wider text-slate-700">
            {statusLabel(value)}
          </span>
        }
        onClick={() => {
          if (disabled) return;
          onOpenChange(!isOpen);
        }}
      />

      {menuIsOpen &&
        menuStyle &&
        createPortal(
          <DropdownSurface ref={menuRef} role="listbox" style={menuStyle}>
            {visibleOptions.map((status) => {
              const selected = status === value;
              return (
                <li key={status}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                      selected
                        ? 'bg-slate-50 font-semibold text-foreground'
                        : 'text-foreground hover:bg-slate-50'
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onOpenChange(false);
                      onSelect(status);
                    }}
                  >
                    <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap pr-3">
                      {statusLabel(status)}
                    </span>
                    <span className="shrink-0">
                      <span className={selected ? 'text-amber-600' : 'text-transparent'}>✓</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </DropdownSurface>,
          document.body,
        )}
    </>
  );
}
