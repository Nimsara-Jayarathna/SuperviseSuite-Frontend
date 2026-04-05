import type { ApiError } from '@/types';
import { getGeneralError, mapBackendFieldErrors, validateRegisterForm } from './registerValidation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a minimal valid field set. Override individual fields per test. */
function validFields(overrides: Record<string, string> = {}) {
  return {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    password: 'Secure@123',
    confirmPassword: 'Secure@123',
    registrationNumber: 'IT24100400',
    ...overrides,
  };
}

/** Builds a minimal ApiError. Override fields as needed. */
function apiError(overrides: Partial<ApiError> = {}): ApiError {
  return {
    timestamp: '2026-03-04T00:00:00Z',
    status: 400,
    error: 'Bad Request',
    code: 'VALIDATION_ERROR',
    message: 'Validation failed.',
    path: '/api/auth/register',
    traceId: null,
    details: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// validateRegisterForm
// ---------------------------------------------------------------------------

describe('validateRegisterForm', () => {
  describe('valid input', () => {
    it('returns empty error map when all fields are valid', () => {
      expect(validateRegisterForm(validFields())).toEqual({});
    });
  });

  describe('firstName', () => {
    it('requires firstName', () => {
      const { firstName } = validateRegisterForm(validFields({ firstName: '' }));
      expect(firstName).toBe('First name is required.');
    });

    it('treats whitespace-only firstName as blank', () => {
      const { firstName } = validateRegisterForm(validFields({ firstName: '   ' }));
      expect(firstName).toBe('First name is required.');
    });
  });

  describe('lastName', () => {
    it('requires lastName', () => {
      const { lastName } = validateRegisterForm(validFields({ lastName: '' }));
      expect(lastName).toBe('Last name is required.');
    });

    it('treats whitespace-only lastName as blank', () => {
      const { lastName } = validateRegisterForm(validFields({ lastName: '  ' }));
      expect(lastName).toBe('Last name is required.');
    });
  });

  describe('email', () => {
    it('requires email', () => {
      const { email } = validateRegisterForm(validFields({ email: '' }));
      expect(email).toBe('Email is required.');
    });

    it('rejects email without @', () => {
      const { email } = validateRegisterForm(validFields({ email: 'notanemail' }));
      expect(email).toBe('Enter a valid email.');
    });

    it('rejects email without domain part', () => {
      const { email } = validateRegisterForm(validFields({ email: 'user@' }));
      expect(email).toBe('Enter a valid email.');
    });

    it('accepts a well-formed email', () => {
      const { email } = validateRegisterForm(validFields({ email: 'user@university.ac.lk' }));
      expect(email).toBeUndefined();
    });

    it('accepts @sliit.lk emails for supervisor mode', () => {
      const { email } = validateRegisterForm({
        ...validFields({ email: 'Jane.Doe@SLIIT.LK' }),
        requireRegistrationNumber: false,
        requireSliitEmail: true,
      });
      expect(email).toBeUndefined();
    });

    it('rejects @my.sliit.lk emails for supervisor mode', () => {
      const { email } = validateRegisterForm({
        ...validFields({ email: 'student@my.sliit.lk' }),
        requireRegistrationNumber: false,
        requireSliitEmail: true,
      });
      expect(email).toBe('Email must be a valid SLIIT institutional email (@sliit.lk).');
    });

    it('rejects non-sliit domains for supervisor mode', () => {
      const { email } = validateRegisterForm({
        ...validFields({ email: 'user@gmail.com' }),
        requireRegistrationNumber: false,
        requireSliitEmail: true,
      });
      expect(email).toBe('Email must be a valid SLIIT institutional email (@sliit.lk).');
    });
  });

  describe('password', () => {
    it('requires password', () => {
      const { password } = validateRegisterForm(validFields({ password: '', confirmPassword: '' }));
      expect(password).toBe('Password is required.');
    });

    it('rejects password shorter than 8 characters', () => {
      const { password } = validateRegisterForm(
        validFields({ password: 'Ab1@', confirmPassword: 'Ab1@' }),
      );
      expect(password).toBe('Password must be at least 8 characters.');
    });

    it('rejects password with no uppercase letter', () => {
      const { password } = validateRegisterForm(
        validFields({ password: 'secure@123', confirmPassword: 'secure@123' }),
      );
      expect(password).toBe('Password must contain an uppercase letter.');
    });

    it('rejects password with no lowercase letter', () => {
      const { password } = validateRegisterForm(
        validFields({ password: 'SECURE@123', confirmPassword: 'SECURE@123' }),
      );
      expect(password).toBe('Password must contain a lowercase letter.');
    });

    it('rejects password with no digit', () => {
      const { password } = validateRegisterForm(
        validFields({ password: 'Secure@abc', confirmPassword: 'Secure@abc' }),
      );
      expect(password).toBe('Password must contain a digit.');
    });

    it('rejects password with no special character', () => {
      const { password } = validateRegisterForm(
        validFields({ password: 'Secure1234', confirmPassword: 'Secure1234' }),
      );
      expect(password).toBe('Password must contain a special character.');
    });

    it('accepts a password that satisfies all rules', () => {
      const { password } = validateRegisterForm(validFields());
      expect(password).toBeUndefined();
    });
  });

  describe('confirmPassword', () => {
    it('requires confirmPassword', () => {
      const { confirmPassword } = validateRegisterForm(validFields({ confirmPassword: '' }));
      expect(confirmPassword).toBe('Please confirm your password.');
    });

    it('rejects when confirmPassword does not match password', () => {
      const { confirmPassword } = validateRegisterForm(
        validFields({ confirmPassword: 'Different@1' }),
      );
      expect(confirmPassword).toBe('Passwords do not match.');
    });
  });

  describe('registrationNumber', () => {
    it('requires registrationNumber', () => {
      const { registrationNumber } = validateRegisterForm(validFields({ registrationNumber: '' }));
      expect(registrationNumber).toBe('Registration number is required.');
    });

    it('treats whitespace-only registrationNumber as blank', () => {
      const { registrationNumber } = validateRegisterForm(
        validFields({ registrationNumber: '   ' }),
      );
      expect(registrationNumber).toBe('Registration number is required.');
    });

    it('does not require registrationNumber for supervisor mode', () => {
      const { registrationNumber } = validateRegisterForm({
        ...validFields({ registrationNumber: '' }),
        requireRegistrationNumber: false,
      });
      expect(registrationNumber).toBeUndefined();
    });
  });

  describe('multiple errors', () => {
    it('reports errors for all blank fields simultaneously', () => {
      const errors = validateRegisterForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        registrationNumber: '',
      });
      expect(errors.firstName).toBeDefined();
      expect(errors.lastName).toBeDefined();
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
      expect(errors.confirmPassword).toBeDefined();
      expect(errors.registrationNumber).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// mapBackendFieldErrors
// ---------------------------------------------------------------------------

describe('mapBackendFieldErrors', () => {
  it('returns empty object for null', () => {
    expect(mapBackendFieldErrors(null)).toEqual({});
  });

  it('returns empty object for undefined', () => {
    expect(mapBackendFieldErrors(undefined)).toEqual({});
  });

  it('returns empty object when details array is empty', () => {
    expect(mapBackendFieldErrors(apiError({ details: [] }))).toEqual({});
  });

  it('maps a detail using the message field', () => {
    const error = apiError({
      details: [{ field: 'email', message: 'Enter a valid email.' }],
    });
    expect(mapBackendFieldErrors(error)).toEqual({ email: 'Enter a valid email.' });
  });

  it('falls back to issue when message is absent', () => {
    const error = apiError({
      details: [{ field: 'password', issue: 'Password is too weak.' }],
    });
    expect(mapBackendFieldErrors(error)).toEqual({ password: 'Password is too weak.' });
  });

  it('prefers message over issue when both are present', () => {
    const error = apiError({
      details: [{ field: 'email', message: 'From message.', issue: 'From issue.' }],
    });
    expect(mapBackendFieldErrors(error)).toEqual({ email: 'From message.' });
  });

  it('maps multiple fields in a single pass', () => {
    const error = apiError({
      details: [
        { field: 'firstName', message: 'First name is required.' },
        { field: 'email', message: 'Enter a valid email.' },
        { field: 'password', message: 'Password is too weak.' },
      ],
    });
    expect(mapBackendFieldErrors(error)).toEqual({
      firstName: 'First name is required.',
      email: 'Enter a valid email.',
      password: 'Password is too weak.',
    });
  });
});

// ---------------------------------------------------------------------------
// getGeneralError
// ---------------------------------------------------------------------------

describe('getGeneralError', () => {
  it('returns null for null error', () => {
    expect(getGeneralError(null)).toBeNull();
  });

  it('returns null for undefined error', () => {
    expect(getGeneralError(undefined)).toBeNull();
  });

  it('returns null when error code is VALIDATION_ERROR (field-level — no banner)', () => {
    expect(getGeneralError(apiError({ code: 'VALIDATION_ERROR' }))).toBeNull();
  });

  it('returns the message for CONFLICT errors', () => {
    const error = apiError({
      code: 'CONFLICT',
      status: 409,
      message: 'An account with this email already exists.',
    });
    expect(getGeneralError(error)).toBe('An account with this email already exists.');
  });

  it('returns the message for INTERNAL_ERROR', () => {
    const error = apiError({
      code: 'INTERNAL_ERROR',
      status: 500,
      message: 'Something went wrong. Please try again.',
    });
    expect(getGeneralError(error)).toBe('Something went wrong. Please try again.');
  });

  it('returns the message for SERVICE_UNAVAILABLE', () => {
    const error = apiError({
      code: 'SERVICE_UNAVAILABLE',
      status: 503,
      message: 'Unable to reach the server.',
    });
    expect(getGeneralError(error)).toBe('Unable to reach the server.');
  });
});
