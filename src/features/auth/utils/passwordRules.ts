export type PasswordChecks = {
  minLength: boolean;
};

export type PasswordStrength = 'weak' | 'fair' | 'strong';
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_MIN_LENGTH = 12;

export function getPasswordChecks(password: string): PasswordChecks {
  const normalized = password ?? '';
  return {
    minLength: normalized.length >= PASSWORD_MIN_LENGTH,
  };
}

export function getPassedRuleCount(checks: PasswordChecks): number {
  return Object.values(checks).filter(Boolean).length;
}

export function getPasswordStrengthFromChecks(checks: PasswordChecks): PasswordStrength {
  return checks.minLength ? 'strong' : 'weak';
}

export function isPasswordPolicyPassed(checks: PasswordChecks): boolean {
  return Object.values(checks).every(Boolean);
}

export function getPasswordStrength(password: string): PasswordStrength {
  return getPasswordStrengthFromChecks(getPasswordChecks(password));
}
