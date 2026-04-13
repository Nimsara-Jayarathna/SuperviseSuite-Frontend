import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import type { RegisterConfig } from '../types';
import { ForgotPasswordForm } from './ForgotPasswordForm';

function baseConfig(): RegisterConfig {
  return {
    domainRestrictionEnabled: true,
    studentDomain: '@my.sliit.lk',
    supervisorDomain: '@sliit.lk',
    studentEmailPrefixRestrictionEnabled: true,
    studentEmailPrefixRegex: '^IT(1[5-9]|[2-4][0-9]|50)\\d{6}$',
  };
}

describe('ForgotPasswordForm', () => {
  it('shows domain warning without role labels and blocks submit for invalid domain', async () => {
    render(
      <ForgotPasswordForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
        onClearError={vi.fn()}
        startCooldownKey={0}
        config={baseConfig()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'abc@gmail.com' } });

    expect(screen.getByText('Allowed domains: @my.sliit.lk · @sliit.lk.')).toBeInTheDocument();
    expect(screen.queryByText(/\(student\)|\(supervisor\)/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeDisabled();
  });

  it('shows prefix warning for invalid student registration format', async () => {
    render(
      <ForgotPasswordForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
        onClearError={vi.fn()}
        startCooldownKey={0}
        config={baseConfig()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'xx24123456@my.sliit.lk' },
    });

    expect(screen.getByText('Invalid IT number format. Use ITXXXXXXXX.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeDisabled();
  });
});
