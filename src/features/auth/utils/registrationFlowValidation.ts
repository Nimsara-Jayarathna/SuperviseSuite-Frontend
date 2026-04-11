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
  if (!fields.firstName.trim()) errors.firstName = 'First name is required.';
  if (!fields.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!fields.password) errors.password = 'Password is required.';
  else if (fields.password.length < 8) errors.password = 'Must be at least 8 characters.';
  else if (!/[A-Z]/.test(fields.password)) errors.password = 'Must contain an uppercase letter.';
  else if (!/[a-z]/.test(fields.password)) errors.password = 'Must contain a lowercase letter.';
  else if (!/[0-9]/.test(fields.password)) errors.password = 'Must contain a digit.';
  else if (!/[^A-Za-z0-9]/.test(fields.password))
    errors.password = 'Must contain a special character.';
  if (!fields.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (fields.password !== fields.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
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
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return 'weak';
  if (score <= 4) return 'fair';
  return 'strong';
}
