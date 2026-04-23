import { Button } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { ModalShell } from '@/components/ui/ModalShell';
import { isApiException } from '@/services/apiClient';
import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PasswordRequirementsPanel } from './PasswordRequirementsPanel';
import { getPasswordChecks, isPasswordPolicyPassed } from '../utils/passwordRules';
import { PasswordField } from './PasswordField';
import { PASSWORD_MAX_LENGTH } from '../utils/passwordRules';
import { toRequestStateModalView } from '../utils/requestStateModalView';

type RequestStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

type ChangePasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { currentPassword: string; newPassword: string }) => Promise<void>;
};

export function ChangePasswordModal({ isOpen, onClose, onSubmit }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>({ kind: 'idle' });
  const passwordChecks = getPasswordChecks(newPassword);
  const isCurrentPasswordFilled = currentPassword.trim().length > 0;
  const isConfirmPasswordFilled = confirmPassword.trim().length > 0;
  const isConfirmMatched = isConfirmPasswordFilled && newPassword === confirmPassword;
  const isMismatch = isConfirmPasswordFilled && !isConfirmMatched;
  const passwordPolicyPassed = isPasswordPolicyPassed(passwordChecks);
  const canSubmit = isCurrentPasswordFilled && passwordPolicyPassed && isConfirmMatched;

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setValidationError('All password fields are required.');
      return;
    }

    if (!passwordPolicyPassed) {
      setValidationError('New password does not satisfy password requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('Confirm password must match new password.');
      return;
    }

    setRequestStatus({ kind: 'loading' });

    try {
      await onSubmit({ currentPassword, newPassword });
      setRequestStatus({ kind: 'success', message: 'Your password has been updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      let message = 'Unable to update password right now. Please try again.';
      if (isApiException(error)) {
        const newPasswordDetail = error.apiError.details.find(
          (detail) => detail.field === 'newPassword',
        );
        const currentPasswordDetail = error.apiError.details.find(
          (detail) => detail.field === 'currentPassword',
        );
        message =
          (newPasswordDetail?.message ?? newPasswordDetail?.issue) ||
          (currentPasswordDetail?.message ?? currentPasswordDetail?.issue) ||
          error.apiError.message;
      }
      setRequestStatus({ kind: 'error', message });
    }
  }

  function handleClose() {
    setValidationError(null);
    setRequestStatus({ kind: 'idle' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsNewPasswordFocused(false);
    onClose();
  }

  function closeRequestState() {
    if (requestStatus.kind === 'success') {
      handleClose();
      return;
    }
    setRequestStatus({ kind: 'idle' });
  }

  function retrySubmit() {
    setRequestStatus({ kind: 'idle' });
  }

  const requestStateModal = toRequestStateModalView({
    kind: requestStatus.kind,
    copy: {
      loading: {
        title: 'Updating password',
        message: 'Please wait while we secure your account.',
      },
      success: {
        title: 'Password updated',
        message: requestStatus.kind === 'success' ? requestStatus.message : '',
      },
      error: {
        title: 'Unable to update password',
        message: requestStatus.kind === 'error' ? requestStatus.message : '',
      },
    },
    onClose: closeRequestState,
    onRetry: retrySubmit,
    autoCloseOnSuccess: true,
  });

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        containerClassName="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
        backdropClassName="absolute inset-0"
        onBackdropClick={handleClose}
        closeOnEscape={false}
        lockBodyScroll={false}
        autoFocus={false}
      >
        <form
          className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close change password modal"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="pr-8 text-xl font-bold text-slate-900">Change Password</h2>
          <p className="mt-1 text-sm text-slate-500">Update your account password securely.</p>

          <div className="mt-5 space-y-3">
            <PasswordField
              id="current-password"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              maxLength={PASSWORD_MAX_LENGTH}
              isVisible={showCurrentPassword}
              onToggleVisibility={() => setShowCurrentPassword((value) => !value)}
            />
            <PasswordField
              id="new-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              maxLength={PASSWORD_MAX_LENGTH}
              isVisible={showNewPassword}
              onToggleVisibility={() => setShowNewPassword((value) => !value)}
              onFocus={() => setIsNewPasswordFocused(true)}
              onBlur={() => setIsNewPasswordFocused(false)}
            />
            <PasswordRequirementsPanel
              password={newPassword}
              isNewPasswordFocused={isNewPasswordFocused}
            />
            <PasswordField
              id="confirm-password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              maxLength={PASSWORD_MAX_LENGTH}
              isVisible={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
              showMismatch={isConfirmPasswordFilled}
              mismatch={isMismatch}
            />
          </div>

          {validationError ? (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {validationError}
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="md" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!canSubmit || requestStatus.kind === 'loading'}
            >
              Save password
            </Button>
          </div>
        </form>
      </ModalShell>

      <RequestStateModal
        isOpen={requestStateModal.isOpen}
        status={requestStateModal.status}
        title={requestStateModal.title}
        message={requestStateModal.message}
        onClose={requestStateModal.onClose}
        onRetry={requestStateModal.onRetry}
        autoCloseOnSuccess={requestStateModal.autoCloseOnSuccess}
      />
    </>
  );
}
