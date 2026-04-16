import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/cn';
import { Copy, ExternalLink, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import type { MeetingChannel } from '../types';
import { isProbablyUrl } from '../lib/linkOrIdentifier';

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
  onCopy?: (value: string) => void;
};

function statusTone(status: MeetingChannel['status']) {
  if (status === 'APPROVED') return 'success';
  return 'warning';
}

function roleTone(role: MeetingChannel['addedByRole']) {
  return role === 'SUPERVISOR' ? 'supervisor' : 'student';
}

export function MeetingChannelsTable({
  channels,
  canManage,
  onApprove,
  onEdit,
  onDelete,
  onCopy,
}: MeetingChannelsTableProps) {
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
            <col className="w-[150px]" />
            <col className="w-[240px]" />
            <col className="w-[340px]" />
            <col className="w-[220px]" />
            <col className="w-[220px]" />
            <col className={cn('w-[160px]', canManage ? '' : 'w-[120px]')} />
            {canManage ? <col className="w-[220px]" /> : null}
          </colgroup>
          <thead className="bg-slate-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Platform
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Channel Name
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Link / Identifier
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Added By
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Status
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Added At
              </th>
              {canManage ? (
                <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => {
              const isUrl = isProbablyUrl(channel.linkOrIdentifier);
              const approvedDetails =
                channel.status === 'APPROVED' && channel.approvedByName && channel.approvedAt
                  ? `Approved by ${channel.approvedByName} • ${dateTimeFormatter.format(
                      new Date(channel.approvedAt),
                    )}`
                  : null;

              return (
                <tr key={channel.id} className="border-t border-slate-100">
                  <td className="px-4 py-4">
                    <StatusBadge tone="neutral">{channel.platform.replace('_', ' ')}</StatusBadge>
                  </td>
                  <td className="px-4 py-4">
                    <p className="truncate text-sm font-semibold text-slate-900" title={channel.channelName}>
                      {channel.channelName}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {isUrl ? (
                        <a
                          href={channel.linkOrIdentifier}
                          target="_blank"
                          rel="noreferrer"
                          className="min-w-0 truncate text-sm font-semibold text-sky-700 hover:underline"
                          title={channel.linkOrIdentifier}
                        >
                          {channel.linkOrIdentifier}
                        </a>
                      ) : (
                        <span className="min-w-0 truncate text-sm font-semibold text-slate-700" title={channel.linkOrIdentifier}>
                          {channel.linkOrIdentifier}
                        </span>
                      )}

                      {isUrl ? <ExternalLink className="h-3.5 w-3.5 text-slate-300" /> : null}

                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                        aria-label="Copy value"
                        title="Copy"
                        onClick={() => onCopy?.(channel.linkOrIdentifier)}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="truncate text-sm font-semibold text-slate-900" title={channel.addedByName}>
                        {channel.addedByName}
                      </p>
                      <StatusBadge tone={roleTone(channel.addedByRole)}>{channel.addedByRole}</StatusBadge>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <StatusBadge tone={statusTone(channel.status)}>{channel.status}</StatusBadge>
                      {approvedDetails ? (
                        <p className="text-[11px] text-slate-400" title={approvedDetails}>
                          {approvedDetails}
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-slate-600">
                      {dateTimeFormatter.format(new Date(channel.createdAt))}
                    </p>
                  </td>
                  {canManage ? (
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {channel.status === 'PENDING' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onApprove?.(channel)}
                            leftIcon={<CheckCircle2 className="h-4 w-4" />}
                          >
                            Approve
                          </Button>
                        ) : null}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onEdit?.(channel)}
                          leftIcon={<Pencil className="h-4 w-4" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onDelete?.(channel)}
                          leftIcon={<Trash2 className="h-4 w-4" />}
                        >
                          Delete
                        </Button>
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

