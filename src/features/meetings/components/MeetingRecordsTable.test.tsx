import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MeetingChannel, MeetingRecord } from '../types';
import { MeetingRecordsTable } from './MeetingRecordsTable';
import { getMeetingPlatformDisplay } from '../lib/platformDisplay';

function channel(overrides: Partial<MeetingChannel> = {}): MeetingChannel {
  return {
    id: 'c-1',
    projectId: 'p-1',
    platform: 'GOOGLE_MEET',
    channelName: 'Weekly sync',
    linkOrIdentifier: 'https://example.com',
    addedBy: 'u-1',
    addedByName: 'Student',
    addedByRole: 'STUDENT',
    status: 'APPROVED',
    approvedBy: 'u-2',
    approvedByName: 'Supervisor',
    approvedAt: '2026-04-17T00:00:00.000Z',
    createdAt: '2026-04-16T00:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

function record(overrides: Partial<MeetingRecord> = {}): MeetingRecord {
  return {
    id: 'r-1',
    projectId: 'p-1',
    meetingDate: '2026-04-18',
    durationMinutes: 45,
    discussionSummary: 'Discussed progress and blockers',
    discussionDetails: null,
    channelId: null,
    addedBy: 'u-1',
    addedByName: 'Student',
    addedByRole: 'STUDENT',
    status: 'PENDING',
    approvedBy: null,
    approvedByName: null,
    approvedAt: null,
    createdAt: '2026-04-18T00:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

describe('MeetingRecordsTable', () => {
  it('truncates summary by character limit and preserves hover title', () => {
    const summary = 'This is a longer discussion summary that should be clamped in the table cell.';
    render(
      <MeetingRecordsTable
        records={[record({ discussionSummary: summary })]}
        channelsById={{}}
        canManage={false}
        onView={() => {}}
      />,
    );

    const summaryNode = screen.getByLabelText(summary);
    expect(summaryNode).toHaveAttribute('title', summary);
    expect(summaryNode.textContent).toMatch(/\.\.\.$/);
  });

  it('shows only view action for students', () => {
    render(
      <MeetingRecordsTable
        records={[record()]}
        channelsById={{}}
        canManage={false}
        onView={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'View record' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve record' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit record' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete record' })).toBeNull();
  });

  it('renders manage actions for supervisors and wires view', () => {
    const onView = vi.fn();
    const onApprove = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <MeetingRecordsTable
        records={[record({ status: 'PENDING' })]}
        channelsById={{}}
        canManage
        onView={onView}
        onApprove={onApprove}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'View record' }));
    expect(onView).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('button', { name: 'Approve record' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit record' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete record' })).toBeInTheDocument();
  });

  it('renders linked channel label when channelId is present', () => {
    const linked = channel({ id: 'c-linked', channelName: 'Zoom room' });
    render(
      <MeetingRecordsTable
        records={[record({ channelId: linked.id })]}
        channelsById={{ [linked.id]: linked }}
        canManage={false}
        onView={() => {}}
      />,
    );

    expect(screen.getByText('Zoom room')).toBeInTheDocument();
    expect(
      screen.getByLabelText(getMeetingPlatformDisplay(linked.platform).label),
    ).toBeInTheDocument();
  });
});
