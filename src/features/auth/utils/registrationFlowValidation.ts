import {
  getPasswordChecks,
  getPasswordStrength as sharedGetPasswordStrength,
} from './passwordRules';
import { PASSWORD_MIN_LENGTH } from './passwordRules';

export type ProfileFieldErrors = {
  firstName?: string;
  lastName?: string;
  password?: string;
  confirmPassword?: string;
  registrationNumber?: string;
};

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
  return null;
}

export function validateOtp(otp: string): string | null {
  if (!otp || otp.length !== 6) return 'Enter the 6-digit code.';
  if (!/^\d{6}$/.test(otp)) return 'Code must be 6 digits.';
  return null;
}

export function validateProfile(fields: {
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  registrationNumber?: string;
  requireRegistrationNumber?: boolean;
}): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  const checks = getPasswordChecks(fields.password);

  if (!fields.firstName.trim()) errors.firstName = 'First name is required.';
  if (!fields.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!fields.password) errors.password = 'Password is required.';
  else if (!checks.minLength)
    errors.password = `Must be at least ${PASSWORD_MIN_LENGTH} characters.`;

  if (!fields.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (fields.password !== fields.confirmPassword)
    errors.confirmPassword = 'Passwords do not match.';

  if (fields.requireRegistrationNumber) {
    if (!fields.registrationNumber?.trim()) {
      errors.registrationNumber = 'Registration number is required.';
    } else if (!/^[A-Za-z]{2}\d{8}$/.test(fields.registrationNumber.trim())) {
      errors.registrationNumber = 'Invalid format. Example: IT24100487';
    }
  }
  return errors;
}

export function getPasswordStrength(password: string): 'weak' | 'fair' | 'strong' {
  return sharedGetPasswordStrength(password);
}
