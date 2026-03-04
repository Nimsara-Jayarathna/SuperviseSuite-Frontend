import type { ApiError } from '@/types';

/**
 * Subset of form fields that can carry a validation error message.
 * Kept here so both the validation function and the form component
 * share a single definition (Single Responsibility).
 */
export type RegisterFieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  registrationNumber?: string;
};

/**
 * Pure client-side validation for the registration form.
 *
 * Rules mirror the backend {@code @StrongPassword} and {@code @NotBlank} constraints
 * so the user gets immediate feedback before the request is sent.
 *
 * @returns An error map — empty object means all fields are valid.
 */
export function validateRegisterForm(fields: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  registrationNumber: string;
}): RegisterFieldErrors {
  const { firstName, lastName, email, password, confirmPassword, registrationNumber } = fields;
  const errors: RegisterFieldErrors = {};

  if (!firstName.trim()) errors.firstName = 'First name is required.';
  if (!lastName.trim()) errors.lastName = 'Last name is required.';

  if (!email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email.';

  if (!password) errors.password = 'Password is required.';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (!/[A-Z]/.test(password)) errors.password = 'Password must contain an uppercase letter.';
  else if (!/[a-z]/.test(password)) errors.password = 'Password must contain a lowercase letter.';
  else if (!/[0-9]/.test(password)) errors.password = 'Password must contain a digit.';
  else if (!/[^A-Za-z0-9]/.test(password))
    errors.password = 'Password must contain a special character.';

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';

  if (!registrationNumber.trim()) errors.registrationNumber = 'Registration number is required.';

  return errors;
}

/**
 * Maps a backend {@link ApiError} details array onto {@link RegisterFieldErrors}.
 *
 * The backend uses {@code message}; {@code issue} is kept as a fallback for
 * compatibility with existing mocks.
 *
 * @returns A field-keyed error map, or an empty object when there are no details.
 */
export function mapBackendFieldErrors(error: ApiError | null | undefined): RegisterFieldErrors {
  if (!error?.details?.length) return {};
  return error.details.reduce<RegisterFieldErrors>((acc, d) => {
    const key = d.field as keyof RegisterFieldErrors;
    acc[key] = (d.message ?? d.issue) as string;
    return acc;
  }, {});
}

/**
 * Returns the general (non-field) error message to show in the form banner,
 * or {@code null} when the error is field-level only (VALIDATION_ERROR).
 */
export function getGeneralError(error: ApiError | null | undefined): string | null {
  return error && error.code !== 'VALIDATION_ERROR' ? error.message : null;
}
