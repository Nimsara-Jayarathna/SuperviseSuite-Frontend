import type { ReactNode, RefObject } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

type ModalShellProps = {
  isOpen: boolean;
  children: ReactNode;

  containerClassName: string;
  dialogClassName?: string;

  showBackdrop?: boolean;
  backdropClassName?: string;
  onBackdropClick?: () => void;

  role?: 'dialog' | 'alertdialog';
  ariaModal?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;

  closeOnEscape?: boolean;
  lockBodyScroll?: boolean;
  autoFocus?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;

  portal?: boolean;
};

export function ModalShell({
  isOpen,
  children,
  containerClassName,
  dialogClassName,
  showBackdrop = true,
  backdropClassName,
  onBackdropClick,
  role = 'dialog',
  ariaModal = true,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  closeOnEscape = true,
  lockBodyScroll = false,
  autoFocus = false,
  initialFocusRef,
  portal = true,
}: ModalShellProps) {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    if (typeof document === 'undefined') return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onBackdropClick?.();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onBackdropClick]);

  useEffect(() => {
    if (!isOpen || !lockBodyScroll) return;
    if (typeof document === 'undefined') return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, lockBodyScroll]);

  useEffect(() => {
    if (!isOpen || !autoFocus) return;
    initialFocusRef?.current?.focus();
  }, [isOpen, autoFocus, initialFocusRef]);

  if (!isOpen) {
    return null;
  }

  if (portal && typeof document === 'undefined') {
    return null;
  }

  const content = (
    <div className={containerClassName}>
      {showBackdrop ? (
        <div className={backdropClassName} onClick={onBackdropClick} aria-hidden="true" />
      ) : null}
      <div
        className={cn('flex w-full justify-center', dialogClassName)}
        role={role}
        aria-modal={ariaModal ? 'true' : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
      >
        {children}
      </div>
    </div>
  );

  if (!portal) {
    return content;
  }

  return createPortal(content, document.body);
}
