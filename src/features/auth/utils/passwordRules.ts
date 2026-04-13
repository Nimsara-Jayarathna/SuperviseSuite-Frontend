export type PasswordChecks = {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  digit: boolean;
  special: boolean;
};

export type PasswordStrength = 'weak' | 'fair' | 'strong';
export const PASSWORD_MAX_LENGTH = 128;

export function getPasswordChecks(password: string): PasswordChecks {
  const normalized = password ?? '';
  return {
    minLength: normalized.length >= 8,
    uppercase: /[A-Z]/.test(normalized),
    lowercase: /[a-z]/.test(normalized),
    digit: /[0-9]/.test(normalized),
    special: /[^A-Za-z0-9]/.test(normalized),
  };
}

export function getPassedRuleCount(checks: PasswordChecks): number {
  return Object.values(checks).filter(Boolean).length;
}

export function getPasswordStrengthFromChecks(checks: PasswordChecks): PasswordStrength {
  const passed = getPassedRuleCount(checks);
  if (passed <= 2) return 'weak';
  if (passed <= 4) return 'fair';
  return 'strong';
}

export function isPasswordPolicyPassed(checks: PasswordChecks): boolean {
  return Object.values(checks).every(Boolean);
}

export function getPasswordStrength(password: string): PasswordStrength {
  return getPasswordStrengthFromChecks(getPasswordChecks(password));
}
