import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { isApiException } from '@/services/apiClient';
import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

type RequestStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

type ChangePasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
};

export function ChangePasswordModal({ isOpen, onClose, onSubmit }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>({ kind: 'idle' });
  const normalizedNewPassword = newPassword ?? '';
  const passwordChecks = {
    minLength: normalizedNewPassword.length >= 8,
    uppercase: /[A-Z]/.test(normalizedNewPassword),
    lowercase: /[a-z]/.test(normalizedNewPassword),
    digit: /[0-9]/.test(normalizedNewPassword),
    special: /[^A-Za-z0-9]/.test(normalizedNewPassword),
  };
  const isCurrentPasswordFilled = currentPassword.trim().length > 0;
  const isConfirmPasswordFilled = confirmPassword.trim().length > 0;
  const isConfirmMatched = isConfirmPasswordFilled && normalizedNewPassword === confirmPassword;
  const isPasswordPolicyPassed = Object.values(passwordChecks).every(Boolean);
  const canSubmit = isCurrentPasswordFilled && isPasswordPolicyPassed && isConfirmMatched;

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

    if (!isPasswordPolicyPassed) {
      setValidationError('New password does not satisfy password requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('Confirm password must match new password.');
      return;
    }

    setRequestStatus({ kind: 'loading' });

    try {
      await onSubmit({ currentPassword, newPassword, confirmPassword });
      setRequestStatus({ kind: 'success', message: 'Your password has been updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to update password right now. Please try again.';
      setRequestStatus({ kind: 'error', message });
    }
  }

  function handleClose() {
    setValidationError(null);
    setRequestStatus({ kind: 'idle' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
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

  return (
    <>
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
        <div
          className="absolute inset-0"
          onClick={handleClose}
          aria-hidden="true"
        />
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
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Current password</span>
              <Input
                id="current-password"
                type="password"
                className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">New password</span>
              <Input
                id="new-password"
                type="password"
                className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <ul className="mt-2 space-y-1 text-xs">
                <li className={passwordChecks.minLength ? 'text-emerald-700' : 'text-slate-500'}>
                  At least 8 characters
                </li>
                <li className={passwordChecks.uppercase ? 'text-emerald-700' : 'text-slate-500'}>
                  One uppercase letter
                </li>
                <li className={passwordChecks.lowercase ? 'text-emerald-700' : 'text-slate-500'}>
                  One lowercase letter
                </li>
                <li className={passwordChecks.digit ? 'text-emerald-700' : 'text-slate-500'}>
                  One digit
                </li>
                <li className={passwordChecks.special ? 'text-emerald-700' : 'text-slate-500'}>
                  One special character
                </li>
              </ul>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm new password</span>
              <Input
                id="confirm-password"
                type="password"
                className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              {confirmPassword ? (
                <p className={`mt-1 text-xs ${isConfirmMatched ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isConfirmMatched ? 'Passwords match.' : 'Passwords do not match.'}
                </p>
              ) : null}
            </label>
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
            <Button type="submit" variant="primary" size="md" disabled={!canSubmit || requestStatus.kind === 'loading'}>
              Save password
            </Button>
          </div>
        </form>
      </div>

      <RequestStateModal
        isOpen={requestStatus.kind !== 'idle'}
        status={
          requestStatus.kind === 'loading'
            ? 'loading'
            : requestStatus.kind === 'success'
              ? 'success'
              : 'error'
        }
        title={
          requestStatus.kind === 'loading'
            ? 'Updating password'
            : requestStatus.kind === 'success'
              ? 'Password updated'
              : 'Unable to update password'
        }
        message={
          requestStatus.kind === 'loading'
            ? 'Please wait while we secure your account.'
            : requestStatus.kind === 'success'
              ? requestStatus.message
              : requestStatus.kind === 'error'
                ? requestStatus.message
                : ''
        }
        onClose={requestStatus.kind === 'loading' ? undefined : closeRequestState}
        onRetry={requestStatus.kind === 'error' ? retrySubmit : undefined}
        autoCloseOnSuccess
      />
    </>
  );
}
