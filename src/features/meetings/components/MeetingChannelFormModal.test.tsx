import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MeetingChannelFormModal } from './MeetingChannelFormModal';

describe('MeetingChannelFormModal', () => {
  it('disables submit until a valid http/https link is entered', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <MeetingChannelFormModal
        isOpen
        mode="add"
        initialChannel={null}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const submit = screen.getByRole('button', { name: 'Add channel' });
    expect(submit).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Weekly supervision call'), 'Weekly sync');
    await user.type(
      screen.getByPlaceholderText('https://meet.google.com/...'),
      'meet.google.com/abc',
    );
    expect(
      screen.getByText('Enter a valid link starting with http:// or https://'),
    ).toBeInTheDocument();
    expect(submit).toBeDisabled();

    await user.clear(screen.getByPlaceholderText('https://meet.google.com/...'));
    await user.type(
      screen.getByPlaceholderText('https://meet.google.com/...'),
      'https://meet.google.com/abc-defg-hij',
    );
    expect(
      screen.queryByText('Enter a valid link starting with http:// or https://'),
    ).not.toBeInTheDocument();
    expect(submit).toBeEnabled();
  });

  it('submits trimmed values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <MeetingChannelFormModal
        isOpen
        mode="add"
        initialChannel={null}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByPlaceholderText('Weekly supervision call'), '  Weekly sync  ');
    await user.type(
      screen.getByPlaceholderText('https://meet.google.com/...'),
      '  https://example.com  ',
    );

    await user.click(screen.getByRole('button', { name: 'Add channel' }));

    expect(onSubmit).toHaveBeenCalledWith({
      platform: 'GOOGLE_MEET',
      channelName: 'Weekly sync',
      linkOrIdentifier: 'https://example.com',
    });
  });
});
