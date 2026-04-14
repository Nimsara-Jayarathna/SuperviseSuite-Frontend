import type { RegisterConfig } from '../types';
import {
  hasDomainRestrictionViolation,
  hasStudentPrefixViolation,
  isValidEmailFormat,
  matchDomain,
} from './emailRestrictionValidation';

export type ForgotPasswordFieldErrors = {
  email?: string;
};

export function validateForgotPasswordForm(
  email: string,
  config: RegisterConfig | null,
): ForgotPasswordFieldErrors {
  const errors: ForgotPasswordFieldErrors = {};

  if (!email) errors.email = 'Email is required.';
  else if (!isValidEmailFormat(email)) errors.email = 'Enter a valid email.';
  else if (config && hasDomainRestrictionViolation(email, config)) {
    errors.email = 'Your email domain is not permitted.';
  } else if (config && hasStudentPrefixViolation(email, config)) {
    errors.email = 'Invalid IT number format. Use ITXXXXXXXX.';
  }

  return errors;
}

export function getForgotPasswordValidationState(email: string, config: RegisterConfig | null) {
  if (!config) {
    return {
      hasAt: email.includes('@'),
      hasInvalidFormat: email.includes('@') && !isValidEmailFormat(email),
      matchedRole: null,
      hasDomainViolation: false,
      hasPrefixViolation: false,
    };
  }

  const hasAt = email.includes('@');
  const hasInvalidFormat = hasAt && !isValidEmailFormat(email);
  const matchedRole = matchDomain(email, config);
  const hasDomainViolation =
    hasAt && !hasInvalidFormat && hasDomainRestrictionViolation(email, config);
  const hasPrefixViolation = hasAt && !hasInvalidFormat && hasStudentPrefixViolation(email, config);

  return {
    hasAt,
    hasInvalidFormat,
    matchedRole,
    hasDomainViolation,
    hasPrefixViolation,
  };
}
