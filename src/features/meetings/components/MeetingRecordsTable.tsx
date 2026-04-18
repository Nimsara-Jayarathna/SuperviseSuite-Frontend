import { RoleBadge } from '@/components/ui/RoleBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/cn';
import { CheckCircle2, Eye, Pencil, Trash2 } from 'lucide-react';
import type { MeetingChannel, MeetingRecord } from '../types';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
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

function statusTone(status: MeetingRecord['status']) {
  if (status === 'APPROVED') return 'success';
  return 'warning';
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  return new Date(year, month - 1, day);
}

function buildStatusTitle(record: MeetingRecord) {
  return [
    `Added by ${record.addedByName} (${record.addedByRole})`,
    dateTimeFormatter.format(new Date(record.createdAt)),
    ...(record.status === 'APPROVED' && record.approvedByName && record.approvedAt
      ? [`Approved by ${record.approvedByName}`, dateTimeFormatter.format(new Date(record.approvedAt))]
      : []),
  ].join(' • ');
}

type MeetingRecordsTableProps = {
  records: MeetingRecord[];
  channelsById: Record<string, MeetingChannel>;
  canManage: boolean;
  onView: (record: MeetingRecord) => void;
  onApprove?: (record: MeetingRecord) => void;
  onEdit?: (record: MeetingRecord) => void;
  onDelete?: (record: MeetingRecord) => void;
};

export function MeetingRecordsTable({
  records,
  channelsById,
  canManage,
  onView,
  onApprove,
  onEdit,
  onDelete,
}: MeetingRecordsTableProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
        <p className="text-sm font-semibold text-slate-500">No meeting records added yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed">
          <colgroup>
            <col className="w-[130px]" />
            <col className="w-[120px]" />
            <col className="w-[520px]" />
            <col className="w-[220px]" />
            <col className="w-[220px]" />
            <col className="w-[140px]" />
            {canManage ? <col className="w-[170px]" /> : <col className="w-[90px]" />}
          </colgroup>
          <thead className="bg-slate-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 align-middle text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Date
              </th>
              <th className="whitespace-nowrap px-4 py-3 align-middle text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Duration
              </th>
              <th className="px-4 py-3 align-middle text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Discussion Summary
              </th>
              <th className="px-4 py-3 align-middle text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Channel
              </th>
              <th className="whitespace-nowrap px-4 py-3 align-middle text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Added By
              </th>
              <th className="whitespace-nowrap px-4 py-3 align-middle text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Status
              </th>
              <th className="whitespace-nowrap px-4 py-3 align-middle text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const linkedChannel =
                record.channelId && channelsById[record.channelId]
                  ? channelsById[record.channelId]
                  : null;

              return (
                <tr
                  key={record.id}
                  className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3 whitespace-nowrap align-middle text-sm font-semibold text-slate-900">
                    {dateFormatter.format(parseIsoDate(record.meetingDate))}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap align-middle text-sm font-semibold text-slate-700">
                    {record.durationMinutes} min
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span
                      className="block text-sm font-semibold text-slate-900 line-clamp-2 cursor-help"
                      title={record.discussionSummary}
                      aria-label={record.discussionSummary}
                    >
                      {record.discussionSummary}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    {linkedChannel ? (
                      <span
                        className="inline-flex max-w-full truncate rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                        title={linkedChannel.channelName}
                      >
                        {linkedChannel.channelName}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">—</span>
                    )}
                  </td>
                  <td className="max-w-0 px-4 py-3 w-[220px] whitespace-nowrap align-middle text-center text-xs text-slate-500">
                    <div className="flex justify-center cursor-help" title={record.addedByName}>
                      <RoleBadge
                        role={record.addedByRole}
                        className="min-w-[110px] justify-center px-2 py-0.5 text-[10px]"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap align-middle text-center">
                    <div
                      className="flex justify-center cursor-help"
                      title={buildStatusTitle(record)}
                    >
                      <StatusBadge tone={statusTone(record.status)}>{record.status}</StatusBadge>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap align-middle text-center">
                    <div className="flex items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => onView(record)}
                        title="View record"
                        aria-label="View record"
                        className={cn(
                          'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
                          'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800',
                        )}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {canManage ? (
                        <>
                          {record.status === 'PENDING' ? (
                            <button
                              type="button"
                              onClick={() => onApprove?.(record)}
                              title="Approve record"
                              aria-label="Approve record"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => onEdit?.(record)}
                            title="Edit record"
                            aria-label="Edit record"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDelete?.(record)}
                            title="Delete record"
                            aria-label="Delete record"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
