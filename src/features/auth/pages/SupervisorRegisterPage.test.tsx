import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SupervisorRegisterPage } from './SupervisorRegisterPage';

vi.mock('../hooks/useSupervisorRegister', () => ({
  useSupervisorRegister: () => ({
    register: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
    isSuccess: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

describe('SupervisorRegisterPage', () => {
  it('renders supervisor heading and sign-in link', () => {
    render(
      <MemoryRouter>
        <SupervisorRegisterPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Create supervisor account' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });

  it('renders registration form in supervisor mode without registration number field', () => {
    render(
      <MemoryRouter>
        <SupervisorRegisterPage />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText('Registration Number')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });
});
