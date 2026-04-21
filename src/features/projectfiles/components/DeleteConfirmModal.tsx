import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type DeleteConfirmModalProps = {
  isOpen: boolean;
  fileName: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmModal({
  isOpen,
  fileName,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Delete file?"
      description={
        <p>
          This will permanently remove{' '}
          <span className="font-semibold">{fileName ?? 'this file'}</span> from project storage.
        </p>
      }
      confirmLabel="Delete"
      confirmVariant="danger"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
