import { RoleBadge } from '@/components/ui/RoleBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/cn';
import { Check, CheckCircle2, Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MeetingChannel } from '../types';

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

type MeetingChannelsTableProps = {
  channels: MeetingChannel[];
  canManage: boolean;
  onApprove?: (channel: MeetingChannel) => void;
  onEdit?: (channel: MeetingChannel) => void;
  onDelete?: (channel: MeetingChannel) => void;
  onCopy?: (value: string) => Promise<boolean>;
};

function statusTone(status: MeetingChannel['status']) {
  if (status === 'APPROVED') return 'success';
  return 'warning';
}

function buildStatusTitle(channel: MeetingChannel) {
  const parts = [
    `Added by ${channel.addedByName} (${channel.addedByRole})`,
    dateTimeFormatter.format(new Date(channel.createdAt)),
  ];

  if (channel.status === 'APPROVED' && channel.approvedByName && channel.approvedAt) {
    parts.push(`Approved by ${channel.approvedByName}`);
    parts.push(dateTimeFormatter.format(new Date(channel.approvedAt)));
  }

  return parts.join(' • ');
}

export function MeetingChannelsTable({
  channels,
  canManage,
  onApprove,
  onEdit,
  onDelete,
  onCopy,
}: MeetingChannelsTableProps) {
  const [copiedChannelId, setCopiedChannelId] = useState<string | null>(null);
  const copiedResetTimeoutRef = useRef<number | null>(null);

  const resetCopiedTimer = () => {
    if (copiedResetTimeoutRef.current !== null) {
      window.clearTimeout(copiedResetTimeoutRef.current);
      copiedResetTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      resetCopiedTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (channels.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
        <p className="text-sm font-semibold text-slate-500">No meeting channels added yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed">
          <colgroup>
            <col className="w-[140px]" />
            <col className="w-[240px]" />
            <col className="w-[320px]" />
            <col className="w-[260px]" />
            <col className="w-[140px]" />
            {canManage ? <col className="w-[140px]" /> : null}
          </colgroup>
          <thead className="bg-slate-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 align-middle text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Platform
              </th>
              <th className="whitespace-nowrap px-4 py-3 align-middle text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Channel Name
              </th>
              <th className="whitespace-nowrap px-4 py-3 align-middle text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Link / Identifier
              </th>
              <th className="whitespace-nowrap px-4 py-3 align-middle text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Added By
              </th>
              <th className="whitespace-nowrap px-4 py-3 align-middle text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Status
              </th>
              {canManage ? (
                <th className="whitespace-nowrap py-3 pl-4 pr-6 align-middle text-right text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => {
              const isCopied = copiedChannelId === channel.id;

              return (
                <tr key={channel.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 whitespace-nowrap align-middle">
                    <StatusBadge tone="neutral">{channel.platform.split('_').join(' ')}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap align-middle">
                    <span
                      className="block truncate text-sm font-semibold text-slate-900"
                      title={channel.channelName}
                    >
                      {channel.channelName}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap align-middle">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <a
                          href={channel.linkOrIdentifier}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-sm font-semibold text-sky-700 hover:underline"
                          title={channel.linkOrIdentifier}
                        >
                          {channel.linkOrIdentifier}
                        </a>
                      </div>

                      <div className="flex shrink-0 items-center gap-2.5">
                        <ExternalLink className="h-3.5 w-3.5 text-slate-300" />

                        <button
                          type="button"
                          className={cn(
                            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors',
                            isCopied
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                          )}
                          aria-label="Copy value"
                          title="Copy"
                          onClick={async () => {
                            const ok = (await onCopy?.(channel.linkOrIdentifier)) ?? false;
                            if (!ok) return;

                            resetCopiedTimer();
                            setCopiedChannelId(channel.id);
                            copiedResetTimeoutRef.current = window.setTimeout(() => {
                              setCopiedChannelId(null);
                              copiedResetTimeoutRef.current = null;
                            }, 1000);
                          }}
                        >
                          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-0 px-4 py-3 w-[260px] whitespace-nowrap align-middle text-xs text-slate-500">
                    <div className="inline-flex cursor-help" title={channel.addedByName}>
                      <RoleBadge
                        role={channel.addedByRole}
                        className="min-w-[110px] justify-center px-2 py-0.5 text-[10px]"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap align-middle">
                    <div className="inline-flex cursor-help" title={buildStatusTitle(channel)}>
                      <StatusBadge tone={statusTone(channel.status)}>{channel.status}</StatusBadge>
                    </div>
                  </td>
                  {canManage ? (
                    <td className="py-3 pl-4 pr-6 whitespace-nowrap align-middle">
                      <div className="flex items-center justify-end gap-2.5">
                        {channel.status === 'PENDING' ? (
                          <button
                            type="button"
                            onClick={() => onApprove?.(channel)}
                            title="Approve channel"
                            aria-label="Approve channel"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onEdit?.(channel)}
                          title="Edit channel"
                          aria-label="Edit channel"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete?.(channel)}
                          title="Delete channel"
                          aria-label="Delete channel"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
