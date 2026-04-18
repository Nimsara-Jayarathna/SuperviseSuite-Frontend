import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { MeetingChannel, MeetingRecord } from '../types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getMeetingPlatformDisplay } from '../lib/platformDisplay';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  return new Date(year, month - 1, day);
}

function statusTone(status: MeetingRecord['status']) {
  if (status === 'APPROVED') return 'success';
  return 'warning';
}

type MetadataItem = {
  label: string;
  value: React.ReactNode;
};

type MeetingRecordDetailsModalProps = {
  isOpen: boolean;
  record: MeetingRecord | null;
  channelsById: Record<string, MeetingChannel>;
  onClose: () => void;
};

export function MeetingRecordDetailsModal({
  isOpen,
  record,
  channelsById,
  onClose,
}: MeetingRecordDetailsModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsMounted(false);
      return;
    }

    const rafId = window.requestAnimationFrame(() => setIsMounted(true));
    return () => window.cancelAnimationFrame(rafId);
  }, [isOpen]);

  const linkedChannel = useMemo(() => {
    if (!record?.channelId) return null;
    return channelsById[record.channelId] ?? null;
  }, [channelsById, record?.channelId]);

  if (!isOpen || !record) {
    return null;
  }

  const modal = (
    <div
      className={cn(
        'fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm transition-opacity duration-200',
        isMounted ? 'opacity-100' : 'opacity-0',
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Meeting record details"
    >
      <div
        className={cn(
          'w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-white shadow-[0_24px_56px_rgba(15,23,42,0.24)] transition-all duration-200',
          isMounted
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-1 scale-[0.99] opacity-0',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Meeting record</h3>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              {dateFormatter.format(parseIsoDate(record.meetingDate))}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone={statusTone(record.status)}>{record.status}</StatusBadge>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-7 px-6 py-6">
          <div className="space-y-6">
            <section className="space-y-2.5">
              <h4 className="text-sm font-bold tracking-tight text-slate-900">
                Discussion summary
              </h4>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold leading-relaxed text-slate-800">
                  {record.discussionSummary}
                </p>
              </div>
            </section>

            {record.discussionDetails ? (
              <section className="space-y-2.5">
                <h4 className="text-sm font-bold tracking-tight text-slate-900">
                  Discussion details
                </h4>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {record.discussionDetails}
                  </p>
                </div>
              </section>
            ) : null}
          </div>

          {(() => {
            const metadata: MetadataItem[] = [
              { label: 'Duration', value: `${record.durationMinutes} minutes` },
              ...(linkedChannel
                ? [
                    {
                      label: 'Linked channel',
                      value: (() => {
                        const display = getMeetingPlatformDisplay(linkedChannel.platform);
                        return (
                          <span
                            className="inline-flex max-w-full items-center gap-2"
                            title={linkedChannel.channelName}
                          >
                            <span
                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white"
                              title={display.label}
                              aria-label={display.label}
                            >
                              {display.kind === 'simple-icon' ? (
                                <svg
                                  aria-hidden
                                  viewBox="0 0 24 24"
                                  className="h-4 w-4"
                                  style={{ color: `#${display.hex}` }}
                                >
                                  <path d={display.path} fill="currentColor" />
                                </svg>
                              ) : (
                                <display.Icon
                                  aria-hidden
                                  className="h-4 w-4 text-slate-700"
                                  style={display.hex ? { color: `#${display.hex}` } : undefined}
                                  strokeWidth={2.25}
                                />
                              )}
                            </span>
                            <span className="min-w-0 truncate text-sm font-semibold text-slate-800">
                              {linkedChannel.channelName}
                            </span>
                          </span>
                        );
                      })(),
                    },
                  ]
                : []),
              { label: 'Added by', value: `${record.addedByName} (${record.addedByRole})` },
              { label: 'Created at', value: dateTimeFormatter.format(new Date(record.createdAt)) },
              ...(record.status === 'APPROVED' && record.approvedByName && record.approvedAt
                ? [
                    { label: 'Approved by', value: record.approvedByName },
                    {
                      label: 'Approved at',
                      value: dateTimeFormatter.format(new Date(record.approvedAt)),
                    },
                  ]
                : []),
            ];

            return (
              <section className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Record metadata
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {metadata.map((item) => (
                    <div key={item.label} className="space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        {item.label}
                      </p>
                      <div className="text-sm font-semibold text-slate-800">{item.value}</div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modal;
  }

  return createPortal(modal, document.body);
}
