import { getPasswordChecks } from './passwordRules';
import { PASSWORD_MIN_LENGTH } from './passwordRules';
import type { ApiError } from '@/types';

export type ResetPasswordFieldErrors = {
  newPassword?: string;
  confirmNewPassword?: string;
};

export function validateResetPasswordForm(fields: {
  newPassword: string;
  confirmNewPassword: string;
}): ResetPasswordFieldErrors {
  const { newPassword, confirmNewPassword } = fields;
  const errors: ResetPasswordFieldErrors = {};
  const checks = getPasswordChecks(newPassword);

  if (!newPassword) errors.newPassword = 'Password is required.';
  else if (!checks.minLength)
    errors.newPassword = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;

  if (!confirmNewPassword) errors.confirmNewPassword = 'Please confirm your password.';
  else if (newPassword !== confirmNewPassword)
    errors.confirmNewPassword = 'Passwords do not match.';

  return errors;
}

export function mapBackendResetPasswordFieldErrors(
  error: ApiError | null | undefined,
): ResetPasswordFieldErrors {
  if (!error?.details?.length) return {};

  return error.details.reduce<ResetPasswordFieldErrors>((acc, detail) => {
    if (detail.field === 'newPassword') {
      acc.newPassword = (detail.message ?? detail.issue) as string;
    }
    if (detail.field === 'confirmNewPassword') {
      acc.confirmNewPassword = (detail.message ?? detail.issue) as string;
    }
    return acc;
  }, {});
}
