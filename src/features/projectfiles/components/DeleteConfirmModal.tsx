import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';

type DeleteConfirmModalProps = {
  isOpen: boolean;
  fileName: string | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmModal({
  isOpen,
  fileName,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/25 bg-white p-6 shadow-[0_28px_72px_rgba(15,23,42,0.24)]">
        <h3 className="text-lg font-bold text-slate-900">Delete file?</h3>
        <p className="mt-2 text-sm text-slate-600">
          This will permanently remove <span className="font-semibold">{fileName ?? 'this file'}</span>{' '}
          from project storage.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
