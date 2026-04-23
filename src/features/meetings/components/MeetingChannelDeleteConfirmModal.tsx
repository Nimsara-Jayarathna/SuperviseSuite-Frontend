import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { MeetingChannel } from '../types';

type MeetingChannelDeleteConfirmModalProps = {
  isOpen: boolean;
  channel: MeetingChannel | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function MeetingChannelDeleteConfirmModal({
  isOpen,
  channel,
  onCancel,
  onConfirm,
}: MeetingChannelDeleteConfirmModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Delete channel?"
      description={
        <p>
          This will permanently remove{' '}
          <span className="font-semibold">{channel?.channelName ?? 'this channel'}</span> from the
          project.
        </p>
      }
      confirmLabel="Delete"
      confirmVariant="danger"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
