import { RoleBadge } from '@/components/ui/RoleBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useIsMobileLayout } from '@/components/ui/useIsMobileLayout';
import { cn } from '@/lib/cn';
import { Check, CheckCircle2, Copy, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MeetingChannel } from '../types';
import { getMeetingPlatformDisplay } from '../lib/platformDisplay';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { DataTable } from '@/components/ui/DataTable';

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

const MAX_CHANNEL_NAME_CHARS = 28;

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
  const isMobileLayout = useIsMobileLayout();
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
    return <EmptyStateCard message="No meeting channels added yet." />;
  }

  if (isMobileLayout) {
    return (
      <div className="space-y-3">
        {channels.map((channel) => {
          const isCopied = copiedChannelId === channel.id;
          const display = getMeetingPlatformDisplay(channel.platform);
          const displayChannelName =
            channel.channelName.length > MAX_CHANNEL_NAME_CHARS
              ? `${channel.channelName.slice(0, MAX_CHANNEL_NAME_CHARS - 3).trimEnd()}...`
              : channel.channelName;

          return (
            <article
              key={channel.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white"
                      title={display.label}
                      aria-label={display.label}
                    >
                      {display.kind === 'simple-icon' ? (
                        <svg
                          aria-hidden
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          style={{ color: `#${display.hex}` }}
                        >
                          <path d={display.path} fill="currentColor" />
                        </svg>
                      ) : (
                        <display.Icon
                          aria-hidden
                          className="h-3.5 w-3.5 text-slate-700"
                          style={display.hex ? { color: `#${display.hex}` } : undefined}
                          strokeWidth={2.25}
                        />
                      )}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{display.label}</span>
                  </div>
                  <p
                    className="mt-2 truncate text-sm font-semibold text-slate-900"
                    title={channel.channelName}
                    aria-label={channel.channelName}
                  >
                    {displayChannelName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
                  {canManage ? (
                    <>
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
                    </>
                  ) : null}
                </div>
              </div>

              <a
                href={channel.linkOrIdentifier}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:underline"
                title={channel.linkOrIdentifier}
              >
                {channel.linkOrIdentifier}
              </a>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <RoleBadge
                  role={channel.addedByRole}
                  className="min-w-[110px] justify-center px-2 py-0.5 text-[10px]"
                />
                <div className="cursor-help" title={buildStatusTitle(channel)}>
                  <StatusBadge tone={statusTone(channel.status)}>{channel.status}</StatusBadge>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <DataTable
      colGroup={
        <colgroup>
          <col className="w-[140px]" />
          <col className="w-[200px]" />
          <col className="w-[420px]" />
          <col className="w-[220px]" />
          <col className="w-[140px]" />
          {canManage ? <col className="w-[140px]" /> : null}
        </colgroup>
      }
      columns={[
        { key: 'platform', header: 'Platform', className: 'whitespace-nowrap' },
        { key: 'channelName', header: 'Channel Name', className: 'whitespace-nowrap' },
        { key: 'link', header: 'Link / Identifier', className: 'whitespace-nowrap' },
        { key: 'addedBy', header: 'Added By', align: 'center', className: 'whitespace-nowrap' },
        { key: 'status', header: 'Status', align: 'center', className: 'whitespace-nowrap' },
        ...(canManage
          ? ([
              {
                key: 'actions',
                header: 'Actions',
                align: 'center' as const,
                className: 'whitespace-nowrap',
              },
            ] as const)
          : []),
      ]}
    >
      {channels.map((channel) => {
        const isCopied = copiedChannelId === channel.id;
        const displayChannelName =
          channel.channelName.length > MAX_CHANNEL_NAME_CHARS
            ? `${channel.channelName.slice(0, MAX_CHANNEL_NAME_CHARS - 3).trimEnd()}...`
            : channel.channelName;

        return (
          <tr
            key={channel.id}
            className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
          >
            <td className="px-4 py-3 whitespace-nowrap align-middle">
              {(() => {
                const display = getMeetingPlatformDisplay(channel.platform);

                return (
                  <span
                    className="inline-flex h-8 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50/60"
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
                    <span className="sr-only">{display.label}</span>
                  </span>
                );
              })()}
            </td>
            <td className="px-4 py-3 whitespace-nowrap align-middle">
              <span
                className="block truncate text-sm font-semibold text-slate-900 cursor-help transition-colors hover:text-slate-950 hover:underline"
                title={channel.channelName}
                aria-label={channel.channelName}
              >
                {displayChannelName}
              </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap align-middle">
              <div className="flex min-w-0 items-center gap-2">
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
            </td>
            <td className="max-w-0 px-4 py-3 w-[220px] whitespace-nowrap align-middle text-center text-xs text-slate-500">
              <div className="flex justify-center cursor-help" title={channel.addedByName}>
                <RoleBadge
                  role={channel.addedByRole}
                  className="min-w-[110px] justify-center px-2 py-0.5 text-[10px]"
                />
              </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap align-middle text-center">
              <div className="flex justify-center cursor-help" title={buildStatusTitle(channel)}>
                <StatusBadge tone={statusTone(channel.status)}>{channel.status}</StatusBadge>
              </div>
            </td>
            {canManage ? (
              <td className="px-4 py-3 whitespace-nowrap align-middle text-center">
                <div className="flex items-center justify-center gap-2.5">
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
    </DataTable>
  );
}
