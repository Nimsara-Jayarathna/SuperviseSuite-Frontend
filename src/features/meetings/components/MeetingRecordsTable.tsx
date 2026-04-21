import { RoleBadge } from '@/components/ui/RoleBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useIsMobileLayout } from '@/components/ui/useIsMobileLayout';
import { cn } from '@/lib/cn';
import { CheckCircle2, Eye, Pencil, Trash2 } from 'lucide-react';
import type { MeetingChannel, MeetingRecord } from '../types';
import { getMeetingPlatformDisplay } from '../lib/platformDisplay';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { DataTable } from '@/components/ui/DataTable';

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

const MAX_DISCUSSION_SUMMARY_CHARS = 25;
const MAX_CHANNEL_NAME_CHARS = 26;

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
      ? [
          `Approved by ${record.approvedByName}`,
          dateTimeFormatter.format(new Date(record.approvedAt)),
        ]
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
  const isMobileLayout = useIsMobileLayout();

  if (records.length === 0) {
    return <EmptyStateCard message="No meeting records added yet." />;
  }

  if (isMobileLayout) {
    return (
      <div className="space-y-3">
        {records.map((record) => {
          const linkedChannel =
            record.channelId && channelsById[record.channelId]
              ? channelsById[record.channelId]
              : null;
          const fullSummary = record.discussionSummary;
          const displaySummary =
            fullSummary.length > MAX_DISCUSSION_SUMMARY_CHARS
              ? `${fullSummary.slice(0, MAX_DISCUSSION_SUMMARY_CHARS - 3).trimEnd()}...`
              : fullSummary;

          return (
            <article
              key={record.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {dateFormatter.format(parseIsoDate(record.meetingDate))}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{record.durationMinutes} min</p>
                </div>
                <div className="cursor-help" title={buildStatusTitle(record)}>
                  <StatusBadge tone={statusTone(record.status)}>{record.status}</StatusBadge>
                </div>
              </div>

              <p
                className="mt-2 text-sm font-semibold text-slate-800"
                title={fullSummary}
                aria-label={fullSummary}
              >
                {displaySummary}
              </p>

              {linkedChannel ? (
                (() => {
                  const display = getMeetingPlatformDisplay(linkedChannel.platform);
                  const displayName =
                    linkedChannel.channelName.length > MAX_CHANNEL_NAME_CHARS
                      ? `${linkedChannel.channelName.slice(0, MAX_CHANNEL_NAME_CHARS - 3).trimEnd()}...`
                      : linkedChannel.channelName;

                  return (
                    <span
                      className="mt-3 inline-flex max-w-full items-center gap-2 truncate rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                      title={linkedChannel.channelName}
                    >
                      <span
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50/60"
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
                      <span className="min-w-0 truncate">{displayName}</span>
                    </span>
                  );
                })()
              ) : (
                <span className="mt-3 inline-flex text-xs font-semibold text-slate-400">—</span>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <RoleBadge
                  role={record.addedByRole}
                  className="min-w-[110px] justify-center px-2 py-0.5 text-[10px]"
                />
                <div className="flex items-center gap-2.5">
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
          <col className="w-[130px]" />
          <col className="w-[120px]" />
          <col className="w-[520px]" />
          <col className="w-[220px]" />
          <col className="w-[220px]" />
          <col className="w-[140px]" />
          {canManage ? <col className="w-[170px]" /> : <col className="w-[90px]" />}
        </colgroup>
      }
      columns={[
        { key: 'date', header: 'Date', className: 'whitespace-nowrap' },
        { key: 'duration', header: 'Duration', className: 'whitespace-nowrap' },
        { key: 'summary', header: 'Discussion Summary' },
        { key: 'channel', header: 'Channel' },
        { key: 'addedBy', header: 'Added By', align: 'center', className: 'whitespace-nowrap' },
        { key: 'status', header: 'Status', align: 'center', className: 'whitespace-nowrap' },
        { key: 'actions', header: 'Actions', align: 'center', className: 'whitespace-nowrap' },
      ]}
    >
      {records.map((record) => {
        const linkedChannel =
          record.channelId && channelsById[record.channelId]
            ? channelsById[record.channelId]
            : null;
        const fullSummary = record.discussionSummary;
        const displaySummary =
          fullSummary.length > MAX_DISCUSSION_SUMMARY_CHARS
            ? `${fullSummary.slice(0, MAX_DISCUSSION_SUMMARY_CHARS - 3).trimEnd()}...`
            : fullSummary;

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
                className="block truncate whitespace-nowrap text-sm font-semibold text-slate-900 cursor-help"
                title={fullSummary}
                aria-label={fullSummary}
              >
                {displaySummary}
              </span>
            </td>
            <td className="px-4 py-3 align-middle">
              {linkedChannel ? (
                (() => {
                  const display = getMeetingPlatformDisplay(linkedChannel.platform);
                  const displayName =
                    linkedChannel.channelName.length > MAX_CHANNEL_NAME_CHARS
                      ? `${linkedChannel.channelName.slice(0, MAX_CHANNEL_NAME_CHARS - 3).trimEnd()}...`
                      : linkedChannel.channelName;

                  return (
                    <span
                      className="inline-flex max-w-full items-center gap-2 truncate rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                      title={linkedChannel.channelName}
                    >
                      <span
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50/60"
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
                      <span className="min-w-0 truncate">{displayName}</span>
                    </span>
                  );
                })()
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
              <div className="flex justify-center cursor-help" title={buildStatusTitle(record)}>
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
    </DataTable>
  );
}
