import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { MeetingChannel, MeetingRecord, MeetingRecordUpsertPayload } from '../types';

type MeetingRecordFormModalProps = {
  isOpen: boolean;
  mode: 'add' | 'edit';
  initialRecord: MeetingRecord | null;
  channels: MeetingChannel[];
  onClose: () => void;
  onSubmit: (payload: MeetingRecordUpsertPayload) => void;
  maxSummaryLength?: number;
  maxDetailsLength?: number;
};

const DEFAULT_MAX_SUMMARY_LENGTH = 1024;
const DEFAULT_MAX_DETAILS_LENGTH = 5000;

function toLocalIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function MeetingRecordFormModal({
  isOpen,
  mode,
  initialRecord,
  channels,
  onClose,
  onSubmit,
  maxSummaryLength = DEFAULT_MAX_SUMMARY_LENGTH,
  maxDetailsLength = DEFAULT_MAX_DETAILS_LENGTH,
}: MeetingRecordFormModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [discussionSummary, setDiscussionSummary] = useState('');
  const [discussionDetails, setDiscussionDetails] = useState('');
  const [channelId, setChannelId] = useState('');

  const title = mode === 'add' ? 'Add record' : 'Edit record';

  useEffect(() => {
    if (!isOpen) {
      setIsMounted(false);
      return;
    }

    const rafId = window.requestAnimationFrame(() => setIsMounted(true));
    return () => window.cancelAnimationFrame(rafId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === 'edit' && initialRecord) {
      setMeetingDate(initialRecord.meetingDate);
      setDurationMinutes(String(initialRecord.durationMinutes));
      setDiscussionSummary(initialRecord.discussionSummary);
      setDiscussionDetails(initialRecord.discussionDetails ?? '');
      setChannelId(initialRecord.channelId ?? '');
      return;
    }

    setMeetingDate(toLocalIsoDate(new Date()));
    setDurationMinutes('');
    setDiscussionSummary('');
    setDiscussionDetails('');
    setChannelId('');
  }, [initialRecord, isOpen, mode]);

  const parsedDuration = useMemo(() => {
    const value = Number(durationMinutes);
    if (!Number.isFinite(value)) return null;
    return value;
  }, [durationMinutes]);

  const canSubmit = useMemo(() => {
    return (
      meetingDate.trim().length > 0 &&
      parsedDuration !== null &&
      parsedDuration > 0 &&
      discussionSummary.trim().length > 0
    );
  }, [discussionSummary, meetingDate, parsedDuration]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit() {
    const payload: MeetingRecordUpsertPayload = {
      meetingDate: meetingDate.trim(),
      durationMinutes: parsedDuration ?? 0,
      discussionSummary: discussionSummary.trim(),
      discussionDetails: discussionDetails.trim().length ? discussionDetails.trim() : null,
      channelId: channelId.trim().length ? channelId : null,
    };
    onSubmit(payload);
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
      aria-label={title}
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
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
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
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Meeting date
              </label>
              <Input
                type="date"
                value={meetingDate}
                onChange={(event) => setMeetingDate(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Duration (minutes)
              </label>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                placeholder="45"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Channel (optional)
            </label>
            <Select
              value={channelId}
              onChange={(event) => setChannelId(event.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              aria-label="Select channel"
            >
              <option value="">No channel</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.channelName}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Discussion summary
            </label>
            <textarea
              value={discussionSummary}
              onChange={(event) => setDiscussionSummary(event.target.value)}
              maxLength={maxSummaryLength}
              rows={3}
              placeholder="What was discussed?"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
            {discussionSummary.length >= maxSummaryLength ? (
              <p className="text-[11px] font-semibold text-amber-600">{`Max ${maxSummaryLength} characters reached`}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Discussion details (optional)
            </label>
            <textarea
              value={discussionDetails}
              onChange={(event) => setDiscussionDetails(event.target.value)}
              maxLength={maxDetailsLength}
              rows={5}
              placeholder="Optional detailed notes..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
            {discussionDetails.length >= maxDetailsLength ? (
              <p className="text-[11px] font-semibold text-amber-600">{`Max ${maxDetailsLength} characters reached`}</p>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            {mode === 'add' ? 'Add record' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modal;
  }

  return createPortal(modal, document.body);
}
