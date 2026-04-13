import { render, screen } from '@testing-library/react';
import { RoleBadge } from './RoleBadge';

describe('RoleBadge', () => {
  it('renders supervisor label and styles', () => {
    render(<RoleBadge role="SUPERVISOR" />);

    expect(screen.getByText('Supervisor')).toBeInTheDocument();
    const badge = screen.getByText('Supervisor').parentElement;
    expect(badge).toHaveClass('bg-indigo-100', 'text-indigo-700');
    expect(badge?.querySelector('svg')).toBeInTheDocument();
  });

  it('renders student label and styles', () => {
    render(<RoleBadge role="STUDENT" />);

    expect(screen.getByText('Student')).toBeInTheDocument();
    const badge = screen.getByText('Student').parentElement;
    expect(badge).toHaveClass('bg-slate-100', 'text-slate-700');
    expect(badge?.querySelector('svg')).toBeInTheDocument();
  });

  it('normalizes lowercase role input', () => {
    render(<RoleBadge role="supervisor" />);

    expect(screen.getByText('Supervisor')).toBeInTheDocument();
  });

  it('renders uppercase label when uppercase is true', () => {
    render(<RoleBadge role="student" uppercase />);

    expect(screen.getByText('STUDENT')).toBeInTheDocument();
  });
});
