import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';

type RepositoryRenameModalProps = {
  isOpen: boolean;
  draftName: string;
  error: string | null;
  isSaving: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export function RepositoryRenameModal({
  isOpen,
  draftName,
  error,
  isSaving,
  onChange,
  onSave,
  onClose,
}: RepositoryRenameModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Trap focus inside the modal
  useEffect(() => {
    if (!isOpen) return;
    const rafId = window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label="Edit display name"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-sm rounded-3xl border border-border bg-white p-6 shadow-[0_24px_56px_rgba(15,23,42,0.24)] focus:outline-none"
      >
        {/* Close button */}
        <Button
          type="button"
          onClick={onClose}
          aria-label="Close"
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4 h-7 w-7 rounded-full p-0 flex items-center justify-center text-muted-foreground hover:bg-slate-100 hover:text-foreground"
        >
          ✕
        </Button>

        <h3 className="mb-5 text-lg font-semibold text-foreground">Edit display name</h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-[0.08em] text-muted-foreground">
              Display name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-foreground focus:border-slate-400 focus:outline-none"
                value={draftName}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSaving) {
                    e.preventDefault();
                    onSave();
                  }
                }}
                placeholder="Custom display name"
                maxLength={255}
                disabled={isSaving}
              />
              <Button
                type="button"
                variant="primary"
                className="h-10 px-4 shrink-0"
                onClick={onSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
            {error ? <p className="mt-1.5 text-xs text-rose-700">{error}</p> : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
