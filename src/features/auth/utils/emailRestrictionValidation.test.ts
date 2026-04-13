import type { RegisterConfig } from '../types';
import {
  hasDomainRestrictionViolation,
  hasStudentPrefixViolation,
  isValidEmailFormat,
  matchDomain,
} from './emailRestrictionValidation';

function baseConfig(): RegisterConfig {
  return {
    domainRestrictionEnabled: true,
    studentDomain: '@my.sliit.lk',
    supervisorDomain: '@sliit.lk',
    studentEmailPrefixRestrictionEnabled: true,
    studentEmailPrefixRegex: '^IT(1[5-9]|[2-4][0-9]|50)\\d{6}$',
  };
}

describe('emailRestrictionValidation', () => {
  it('validates email format', () => {
    expect(isValidEmailFormat('test@example.com')).toBe(true);
    expect(isValidEmailFormat('bad-email')).toBe(false);
  });

  it('matches known configured domains', () => {
    const config = baseConfig();
    expect(matchDomain('it24123456@my.sliit.lk', config)).toBe('STUDENT');
    expect(matchDomain('jane@sliit.lk', config)).toBe('SUPERVISOR');
    expect(matchDomain('abc@gmail.com', config)).toBe(null);
  });

  it('checks domain restriction only when enabled', () => {
    const config = baseConfig();
    expect(hasDomainRestrictionViolation('abc@gmail.com', config)).toBe(true);
    expect(
      hasDomainRestrictionViolation('abc@gmail.com', {
        ...config,
        domainRestrictionEnabled: false,
      }),
    ).toBe(false);
  });

  it('checks student prefix restriction and tolerates malformed regex', () => {
    const config = baseConfig();
    expect(hasStudentPrefixViolation('xx24123456@my.sliit.lk', config)).toBe(true);
    expect(hasStudentPrefixViolation('it24123456@my.sliit.lk', config)).toBe(false);
    expect(hasStudentPrefixViolation('jane@sliit.lk', config)).toBe(false);
    expect(
      hasStudentPrefixViolation('it24123456@my.sliit.lk', {
        ...config,
        studentEmailPrefixRegex: '[',
      }),
    ).toBe(false);
  });
});
