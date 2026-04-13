import { getPasswordChecks } from './passwordRules';

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
  else if (!checks.minLength) errors.newPassword = 'Password must be at least 8 characters.';
  else if (!checks.uppercase) errors.newPassword = 'Password must contain an uppercase letter.';
  else if (!checks.lowercase) errors.newPassword = 'Password must contain a lowercase letter.';
  else if (!checks.digit) errors.newPassword = 'Password must contain a digit.';
  else if (!checks.special)
    errors.newPassword = 'Password must contain a special character.';

  if (!confirmNewPassword) errors.confirmNewPassword = 'Please confirm your password.';
  else if (newPassword !== confirmNewPassword) errors.confirmNewPassword = 'Passwords do not match.';

  return errors;
}
