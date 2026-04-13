import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PasswordRequirementsPanel } from './PasswordRequirementsPanel';
import {
  type ResetPasswordFieldErrors,
  validateResetPasswordForm,
} from '../utils/resetPasswordValidation';

export type ResetPasswordFormProps = {
  onSubmit: (newPassword: string) => Promise<void>;
  isLoading: boolean;
  onClearError: () => void;
};

export function ResetPasswordForm({ onSubmit, isLoading, onClearError }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFieldErrors>({});
  const isConfirmPasswordFilled = confirmNewPassword.trim().length > 0;
  const isConfirmMatched = isConfirmPasswordFilled && newPassword === confirmNewPassword;

  const isValid = useMemo(
    () =>
      Object.keys(
        validateResetPasswordForm({
          newPassword,
          confirmNewPassword,
        }),
      ).length === 0,
    [newPassword, confirmNewPassword],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onClearError();

    const errors = validateResetPasswordForm({ newPassword, confirmNewPassword });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    await onSubmit(newPassword);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <PasswordRequirementsPanel password={newPassword} />

      <div className="space-y-1">
        <label htmlFor="reset-password-new" className="text-sm font-semibold text-slate-700">
          New Password
        </label>
        <Input
          id="reset-password-new"
          type="password"
          autoComplete="new-password"
          placeholder="Enter your new password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="h-11 w-full rounded-2xl border border-slate-200 px-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
        />
        {fieldErrors.newPassword && <p className="text-xs text-rose-600">{fieldErrors.newPassword}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="reset-password-confirm" className="text-sm font-semibold text-slate-700">
          Confirm New Password
        </label>
        <div className="relative">
          <Input
            id="reset-password-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter new password"
            value={confirmNewPassword}
            onChange={(event) => setConfirmNewPassword(event.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 px-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />
          {isConfirmPasswordFilled ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              {isConfirmMatched ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600" />
              )}
            </span>
          ) : null}
        </div>
        {fieldErrors.confirmNewPassword && (
          <p className="text-xs text-rose-600">{fieldErrors.confirmNewPassword}</p>
        )}
      </div>

      <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading || !isValid}>
        Update password
      </Button>
    </form>
  );
}
