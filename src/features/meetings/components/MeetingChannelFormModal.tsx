import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  MEETING_CHANNEL_PLATFORMS,
  type MeetingChannel,
  type MeetingChannelUpsertPayload,
} from '../types';

type MeetingChannelFormModalProps = {
  isOpen: boolean;
  mode: 'add' | 'edit';
  initialChannel: MeetingChannel | null;
  onClose: () => void;
  onSubmit: (payload: MeetingChannelUpsertPayload) => void;
  maxNameLength?: number;
  maxLinkLength?: number;
};

function toPlatformLabel(value: string) {
  return value.replace('_', ' ');
}

function isValidHttpLink(value: string) {
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return false;
  }

  try {
    // eslint-disable-next-line no-new
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

export function MeetingChannelFormModal({
  isOpen,
  mode,
  initialChannel,
  onClose,
  onSubmit,
  maxNameLength = 120,
  maxLinkLength = 1024,
}: MeetingChannelFormModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [platform, setPlatform] = useState<MeetingChannelUpsertPayload['platform']>('GOOGLE_MEET');
  const [channelName, setChannelName] = useState('');
  const [linkOrIdentifier, setLinkOrIdentifier] = useState('');

  const title = mode === 'add' ? 'Add channel' : 'Edit channel';

  useEffect(() => {
    if (!isOpen) {
      setIsMounted(false);
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === 'edit' && initialChannel) {
      setPlatform(initialChannel.platform);
      setChannelName(initialChannel.channelName);
      setLinkOrIdentifier(initialChannel.linkOrIdentifier);
      return;
    }

    setPlatform('GOOGLE_MEET');
    setChannelName('');
    setLinkOrIdentifier('');
  }, [initialChannel, isOpen, mode]);

  const canSubmit = useMemo(() => {
    return (
      platform.trim().length > 0 &&
      channelName.trim().length > 0 &&
      isValidHttpLink(linkOrIdentifier)
    );
  }, [channelName, linkOrIdentifier, platform]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit() {
    onSubmit({
      platform,
      channelName: channelName.trim(),
      linkOrIdentifier: linkOrIdentifier.trim(),
    });
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
          'w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-white shadow-[0_24px_56px_rgba(15,23,42,0.24)] transition-all duration-200',
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
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Platform
            </label>
            <Select
              value={platform}
              onChange={(event) =>
                setPlatform(event.target.value as MeetingChannelUpsertPayload['platform'])
              }
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              aria-label="Select platform"
            >
              {MEETING_CHANNEL_PLATFORMS.map((value) => (
                <option key={value} value={value}>
                  {toPlatformLabel(value)}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Channel name
            </label>
            <Input
              value={channelName}
              onChange={(event) => setChannelName(event.target.value)}
              maxLength={maxNameLength}
              placeholder="Weekly supervision call"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
            {channelName.length >= maxNameLength ? (
              <p className="text-[11px] font-semibold text-amber-600">{`Max ${maxNameLength} characters reached`}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Link or identifier
            </label>
            <Input
              value={linkOrIdentifier}
              onChange={(event) => setLinkOrIdentifier(event.target.value)}
              maxLength={maxLinkLength}
              placeholder="https://meet.google.com/..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
            {!isValidHttpLink(linkOrIdentifier) && linkOrIdentifier.trim().length > 0 ? (
              <p className="text-[11px] font-semibold text-amber-600">
                Enter a valid link starting with http:// or https://
              </p>
            ) : null}
            {linkOrIdentifier.length >= maxLinkLength ? (
              <p className="text-[11px] font-semibold text-amber-600">{`Max ${maxLinkLength} characters reached`}</p>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            {mode === 'add' ? 'Add channel' : 'Save changes'}
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
