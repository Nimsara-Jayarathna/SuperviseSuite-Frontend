import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MeetingChannel } from '../types';
import { MeetingChannelsTable } from './MeetingChannelsTable';

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
    status: 'PENDING',
    approvedBy: null,
    approvedByName: null,
    approvedAt: null,
    createdAt: '2026-04-16T00:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

describe('MeetingChannelsTable', () => {
  it('truncates channel name by character limit and preserves hover title', () => {
    const longName = 'This is a very long channel name that should be truncated';

    render(
      <MeetingChannelsTable channels={[channel({ channelName: longName })]} canManage={false} />,
    );

    const nameNode = screen.getByLabelText(longName);
    expect(nameNode).toHaveAttribute('title', longName);
    expect(nameNode.textContent).toMatch(/\.\.\.$/);
  });

  it('shows a copied tick state for ~1s after successful copy', async () => {
    vi.useFakeTimers();
    try {
      const onCopy = vi.fn().mockResolvedValue(true);

      render(<MeetingChannelsTable channels={[channel()]} canManage={false} onCopy={onCopy} />);

      const copyButton = screen.getByRole('button', { name: 'Copy value' });
      expect(copyButton.className).not.toContain('border-emerald-200');

      fireEvent.click(copyButton);
      await act(async () => {
        // Flush async click handler: await onCopy(...) -> setState(...)
        await Promise.resolve();
      });
      expect(onCopy).toHaveBeenCalledTimes(1);

      // Copied style applies immediately after successful copy.
      expect(copyButton.className).toContain('border-emerald-200');

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(copyButton.className).not.toContain('border-emerald-200');
    } finally {
      vi.useRealTimers();
    }
  });
});
