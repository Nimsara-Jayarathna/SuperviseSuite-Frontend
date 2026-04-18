import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { MeetingChannel, MeetingRecord } from '../types';
import { StatusBadge } from '@/components/ui/StatusBadge';

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
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={statusTone(record.status)}>{record.status}</StatusBadge>
            <span className="text-xs font-semibold text-slate-500">
              Duration: {record.durationMinutes} minutes
            </span>
            {linkedChannel ? (
              <span
                className="inline-flex max-w-full truncate rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                title={linkedChannel.channelName}
              >
                {linkedChannel.channelName}
              </span>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Added by
              </p>
              <p className="text-sm font-semibold text-slate-800">{record.addedByName}</p>
              <p className="text-xs font-semibold text-slate-400">{record.addedByRole}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Created at
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {dateTimeFormatter.format(new Date(record.createdAt))}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Discussion summary
            </p>
            <p className="text-sm font-semibold text-slate-800">{record.discussionSummary}</p>
          </div>

          {record.discussionDetails ? (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Discussion details
              </p>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {record.discussionDetails}
              </p>
            </div>
          ) : null}

          {record.status === 'APPROVED' && record.approvedByName && record.approvedAt ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Approved by
                </p>
                <p className="text-sm font-semibold text-slate-800">{record.approvedByName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Approved at
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {dateTimeFormatter.format(new Date(record.approvedAt))}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modal;
  }

  return createPortal(modal, document.body);
}

