import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SupervisorRegisterPage } from './SupervisorRegisterPage';

describe('SupervisorRegisterPage', () => {
  it('renders the registration panel email step', () => {
    render(
      <MemoryRouter>
        <SupervisorRegisterPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('does not render profile-only fields before OTP verification', () => {
    render(
      <MemoryRouter>
        <SupervisorRegisterPage />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText('Registration Number')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Confirm password')).not.toBeInTheDocument();
  });
});
