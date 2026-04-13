import { Button } from '@/components/ui/Button';
import { useMemo, useState } from 'react';
import { PasswordRequirementsPanel } from './PasswordRequirementsPanel';
import { PasswordField } from './PasswordField';
import { PASSWORD_MAX_LENGTH } from '../utils/passwordRules';
import {
  type ResetPasswordFieldErrors,
  validateResetPasswordForm,
} from '../utils/resetPasswordValidation';

export type ResetPasswordFormProps = {
  onSubmit: (newPassword: string) => Promise<ResetPasswordFieldErrors | void>;
  isLoading: boolean;
  onClearError: () => void;
  backendFieldErrors?: ResetPasswordFieldErrors;
};

export function ResetPasswordForm({
  onSubmit,
  isLoading,
  onClearError,
  backendFieldErrors,
}: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFieldErrors>({});
  const isConfirmPasswordFilled = confirmNewPassword.trim().length > 0;
  const isConfirmMatched = isConfirmPasswordFilled && newPassword === confirmNewPassword;
  const isMismatch = isConfirmPasswordFilled && !isConfirmMatched;

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
    const submitResult = await onSubmit(newPassword);
    if (submitResult && Object.keys(submitResult).length > 0) {
      setFieldErrors(submitResult);
    }
  }

  const mergedFieldErrors: ResetPasswordFieldErrors = {
    ...backendFieldErrors,
    ...fieldErrors,
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <PasswordField
        id="reset-password-new"
        label="New Password"
        autoComplete="new-password"
        placeholder="Enter your new password"
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
      {mergedFieldErrors.newPassword && (
        <p className="text-xs text-rose-600">{mergedFieldErrors.newPassword}</p>
      )}

      <PasswordField
        id="reset-password-confirm"
        label="Confirm New Password"
        autoComplete="new-password"
        placeholder="Re-enter new password"
        value={confirmNewPassword}
        onChange={setConfirmNewPassword}
        maxLength={PASSWORD_MAX_LENGTH}
        isVisible={showConfirmPassword}
        onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
        showMismatch={isConfirmPasswordFilled}
        mismatch={isMismatch}
      />
      {mergedFieldErrors.confirmNewPassword && (
        <p className="text-xs text-rose-600">{mergedFieldErrors.confirmNewPassword}</p>
      )}

      <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading || !isValid}>
        Update password
      </Button>
    </form>
  );
}
