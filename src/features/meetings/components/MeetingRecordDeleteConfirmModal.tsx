import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { MeetingRecord } from '../types';

type MeetingRecordDeleteConfirmModalProps = {
  isOpen: boolean;
  record: MeetingRecord | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function MeetingRecordDeleteConfirmModal({
  isOpen,
  record,
  onCancel,
  onConfirm,
}: MeetingRecordDeleteConfirmModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Delete record?"
      description={
        <p>
          This will permanently remove{' '}
          <span className="font-semibold">{record ? 'this meeting record' : 'the record'}</span>{' '}
          from the project.
        </p>
      }
      confirmLabel="Delete"
      confirmVariant="danger"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
