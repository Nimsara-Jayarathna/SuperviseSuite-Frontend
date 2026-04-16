import { vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ApiError } from '@/types';
import { RegisterForm, type RegisterFormProps } from './RegisterForm';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeApiError(overrides: Partial<ApiError> = {}): ApiError {
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

/** Renders the form with sensible defaults. Pass any prop to override. */
function renderForm(props: Partial<RegisterFormProps> = {}) {
  const defaults: RegisterFormProps = {
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
    error: null,
    onClearError: vi.fn(),
  };
  return render(<RegisterForm {...defaults} {...props} />);
}

/** Types valid values into every form field using the provided userEvent instance. */
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('First Name'), 'Jane');
  await user.type(screen.getByLabelText('Last Name'), 'Smith');
  await user.type(screen.getByLabelText('Registration Number'), 'IT24100400');
  await user.type(screen.getByLabelText('Email'), 'jane@example.com');
  await user.type(screen.getByLabelText('Password'), 'Secure@123');
  await user.type(screen.getByLabelText('Confirm Password'), 'Secure@123');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RegisterForm', () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe('rendering', () => {
    it('renders all six form fields', () => {
      renderForm();
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Registration Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });

    it('renders the submit button with "Create Account" label', () => {
      renderForm();
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    });

    it('submit button is enabled when not loading', () => {
      renderForm({ isLoading: false });
      expect(screen.getByRole('button', { name: 'Create Account' })).not.toBeDisabled();
    });

    it('does not show a general error banner when error is null', () => {
      renderForm({ error: null });
      expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  describe('loading state', () => {
    it('disables the submit button when isLoading is true', () => {
      renderForm({ isLoading: true });
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows "Creating account…" on the button when isLoading is true', () => {
      renderForm({ isLoading: true });
      expect(screen.getByRole('button', { name: 'Creating account…' })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Client-side validation (no onSubmit call when invalid)
  // -------------------------------------------------------------------------

  describe('client-side validation', () => {
    it('shows required errors for all blank fields on submit', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      renderForm({ onSubmit });

      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(screen.getByText('First name is required.')).toBeInTheDocument();
      expect(screen.getByText('Last name is required.')).toBeInTheDocument();
      expect(screen.getByText('Email is required.')).toBeInTheDocument();
      expect(screen.getByText('Password is required.')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password.')).toBeInTheDocument();
      expect(screen.getByText('Registration number is required.')).toBeInTheDocument();
    });

    it('does not call onSubmit when validation fails', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      renderForm({ onSubmit });

      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows an error for an invalid email format', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByLabelText('First Name'), 'Jane');
      await user.type(screen.getByLabelText('Last Name'), 'Smith');
      await user.type(screen.getByLabelText('Registration Number'), 'IT24100400');
      await user.type(screen.getByLabelText('Email'), 'notanemail');
      await user.type(screen.getByLabelText('Password'), 'Secure@123');
      await user.type(screen.getByLabelText('Confirm Password'), 'Secure@123');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(screen.getByText('Enter a valid email.')).toBeInTheDocument();
    });

    it('shows an error when password is too short', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByLabelText('First Name'), 'Jane');
      await user.type(screen.getByLabelText('Last Name'), 'Smith');
      await user.type(screen.getByLabelText('Registration Number'), 'IT24100400');
      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await user.type(screen.getByLabelText('Password'), 'Ab1@');
      await user.type(screen.getByLabelText('Confirm Password'), 'Ab1@');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
    });

    it('shows an error when password has no uppercase letter', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByLabelText('First Name'), 'Jane');
      await user.type(screen.getByLabelText('Last Name'), 'Smith');
      await user.type(screen.getByLabelText('Registration Number'), 'IT24100400');
      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await user.type(screen.getByLabelText('Password'), 'secure@123');
      await user.type(screen.getByLabelText('Confirm Password'), 'secure@123');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(screen.getByText('Password must contain an uppercase letter.')).toBeInTheDocument();
    });

    it('shows an error when password has no digit', async () => {
      const user = userEvent.setup();
      renderForm();

      fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Jane' } });
      fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Smith' } });
      fireEvent.change(screen.getByLabelText('Registration Number'), {
        target: { value: 'IT24100400' },
      });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Secure@abc' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), {
        target: { value: 'Secure@abc' },
      });
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(screen.getByText('Password must contain a digit.')).toBeInTheDocument();
    });

    it('shows an error when password has no special character', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByLabelText('First Name'), 'Jane');
      await user.type(screen.getByLabelText('Last Name'), 'Smith');
      await user.type(screen.getByLabelText('Registration Number'), 'IT24100400');
      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await user.type(screen.getByLabelText('Password'), 'Secure1234');
      await user.type(screen.getByLabelText('Confirm Password'), 'Secure1234');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(screen.getByText('Password must contain a special character.')).toBeInTheDocument();
    });

    it('shows an error when confirm password does not match', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByLabelText('First Name'), 'Jane');
      await user.type(screen.getByLabelText('Last Name'), 'Smith');
      await user.type(screen.getByLabelText('Registration Number'), 'IT24100400');
      await user.type(screen.getByLabelText('Email'), 'jane@example.com');
      await user.type(screen.getByLabelText('Password'), 'Secure@123');
      await user.type(screen.getByLabelText('Confirm Password'), 'Different@1');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Successful submission
  // -------------------------------------------------------------------------

  describe('successful submission', () => {
    it('calls onSubmit with the correct payload when all fields are valid', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit });

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(onSubmit).toHaveBeenCalledOnce();
      expect(onSubmit).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'Secure@123',
        registrationNumber: 'IT24100400',
      });
    });

    it('does not include a role field in the submitted payload', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit });

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('role');
    });

    it('calls onClearError at the start of submit', async () => {
      const user = userEvent.setup();
      const onClearError = vi.fn();
      renderForm({ onClearError });

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(onClearError).toHaveBeenCalledOnce();
    });

    it('calls onSuccess after onSubmit resolves', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      renderForm({ onSubmit: vi.fn().mockResolvedValue(undefined), onSuccess });

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // Backend error display
  // -------------------------------------------------------------------------

  describe('backend error display', () => {
    it('shows a field-level email error from VALIDATION_ERROR details', () => {
      const error = makeApiError({
        code: 'VALIDATION_ERROR',
        details: [{ field: 'email', message: 'Enter a valid email.' }],
      });
      renderForm({ error });

      expect(screen.getByText('Enter a valid email.')).toBeInTheDocument();
    });

    it('shows a field-level password error from VALIDATION_ERROR details', () => {
      const error = makeApiError({
        code: 'VALIDATION_ERROR',
        details: [{ field: 'password', message: 'Password must be at least 8 characters.' }],
      });
      renderForm({ error });

      expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
    });

    it('does not show a general banner for VALIDATION_ERROR', () => {
      const error = makeApiError({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed.',
        details: [{ field: 'email', message: 'Enter a valid email.' }],
      });
      renderForm({ error });

      // The message is a field error, not a banner
      expect(screen.queryByText('Validation failed.')).not.toBeInTheDocument();
    });

    it('shows the backend message in the general banner for CONFLICT errors', () => {
      const error = makeApiError({
        code: 'CONFLICT',
        status: 409,
        message: 'An account with this email already exists.',
        details: [],
      });
      renderForm({ error });

      expect(screen.getByText('An account with this email already exists.')).toBeInTheDocument();
    });

    it('shows the correct message for duplicate registration number conflict', () => {
      const error = makeApiError({
        code: 'CONFLICT',
        status: 409,
        message: 'An account with this registration number already exists.',
        details: [],
      });
      renderForm({ error });

      expect(
        screen.getByText('An account with this registration number already exists.'),
      ).toBeInTheDocument();
    });

    it('shows the backend message in the general banner for INTERNAL_ERROR', () => {
      const error = makeApiError({
        code: 'INTERNAL_ERROR',
        status: 500,
        message: 'Something went wrong. Please try again.',
        details: [],
      });
      renderForm({ error });

      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });

    it('shows the backend message in the general banner for SERVICE_UNAVAILABLE', () => {
      const error = makeApiError({
        code: 'SERVICE_UNAVAILABLE',
        status: 503,
        message: 'Unable to reach the server. Please check your connection and try again.',
        details: [],
      });
      renderForm({ error });

      expect(
        screen.getByText('Unable to reach the server. Please check your connection and try again.'),
      ).toBeInTheDocument();
    });

    it('does not show a general banner when error is null', () => {
      renderForm({ error: null });

      // None of the known error messages should be present
      expect(screen.queryByText(/already exists/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/went wrong/i)).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Supervisor mode
  // -------------------------------------------------------------------------

  describe('supervisor mode', () => {
    function renderSupervisorForm(props: Partial<RegisterFormProps> = {}) {
      const defaults: RegisterFormProps = {
        role: 'supervisor',
        onSubmit: vi.fn().mockResolvedValue(undefined),
        isLoading: false,
        error: null,
        onClearError: vi.fn(),
      };
      return render(<RegisterForm {...defaults} {...props} />);
    }

    async function fillValidSupervisorForm(user: ReturnType<typeof userEvent.setup>) {
      await user.type(screen.getByLabelText('First Name'), 'Jane');
      await user.type(screen.getByLabelText('Last Name'), 'Doe');
      await user.type(screen.getByLabelText('Email'), 'jane.doe@sliit.lk');
      await user.type(screen.getByLabelText('Password'), 'Test@1234');
      await user.type(screen.getByLabelText('Confirm Password'), 'Test@1234');
    }

    it('hides registration number field', () => {
      renderSupervisorForm();
      expect(screen.queryByLabelText('Registration Number')).not.toBeInTheDocument();
    });

    it('rejects @my.sliit.lk email', async () => {
      const user = userEvent.setup();
      renderSupervisorForm();

      await user.type(screen.getByLabelText('First Name'), 'Jane');
      await user.type(screen.getByLabelText('Last Name'), 'Doe');
      await user.type(screen.getByLabelText('Email'), 'student@my.sliit.lk');
      await user.type(screen.getByLabelText('Password'), 'Test@1234');
      await user.type(screen.getByLabelText('Confirm Password'), 'Test@1234');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(
        screen.getByText('Email must be a valid SLIIT institutional email (@sliit.lk).'),
      ).toBeInTheDocument();
    });

    it('rejects non-sliit email domain', async () => {
      const user = userEvent.setup();
      renderSupervisorForm();

      await user.type(screen.getByLabelText('First Name'), 'Jane');
      await user.type(screen.getByLabelText('Last Name'), 'Doe');
      await user.type(screen.getByLabelText('Email'), 'user@gmail.com');
      await user.type(screen.getByLabelText('Password'), 'Test@1234');
      await user.type(screen.getByLabelText('Confirm Password'), 'Test@1234');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(
        screen.getByText('Email must be a valid SLIIT institutional email (@sliit.lk).'),
      ).toBeInTheDocument();
    });

    it('submits successfully with valid @sliit.lk email and no registration number', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      renderSupervisorForm({ onSubmit });

      await fillValidSupervisorForm(user);
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(onSubmit).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@sliit.lk',
        password: 'Test@1234',
      });
      expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('registrationNumber');
    });
  });
});
