import type { RegisterConfig } from '../types';

export type MatchedEmailRole = 'STUDENT' | 'SUPERVISOR' | null;

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function matchDomain(email: string, config: RegisterConfig): MatchedEmailRole {
  const normalizedEmail = email.toLowerCase();
  if (config.studentDomain && normalizedEmail.endsWith(config.studentDomain)) return 'STUDENT';
  if (config.supervisorDomain && normalizedEmail.endsWith(config.supervisorDomain))
    return 'SUPERVISOR';
  return null;
}

export function hasStudentPrefixViolation(email: string, config: RegisterConfig): boolean {
  if (!config.domainRestrictionEnabled) return false;
  if (!config.studentEmailPrefixRestrictionEnabled || !config.studentEmailPrefixRegex) return false;
  if (matchDomain(email, config) !== 'STUDENT') return false;

  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return true;

  const localPart = email.slice(0, atIndex).trim();
  try {
    return !new RegExp(config.studentEmailPrefixRegex, 'i').test(localPart);
  } catch {
    return false;
  }
}

export function hasDomainRestrictionViolation(email: string, config: RegisterConfig): boolean {
  if (!config.domainRestrictionEnabled) return false;
  if (!isValidEmailFormat(email)) return false;
  return matchDomain(email, config) === null;
}
