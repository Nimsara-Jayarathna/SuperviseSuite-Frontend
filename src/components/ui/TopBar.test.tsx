import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TopBar } from './TopBar';

const { useIsMobileLayoutMock } = vi.hoisted(() => ({
  useIsMobileLayoutMock: vi.fn(() => false),
}));

vi.mock('@/components/ui/useIsMobileLayout', () => ({
  useIsMobileLayout: useIsMobileLayoutMock,
}));

describe('TopBar', () => {
  it('keeps desktop private layout contract and account action', () => {
    useIsMobileLayoutMock.mockReturnValue(false);
    const onOpenAccount = vi.fn();

    const { container } = render(
      <MemoryRouter>
        <TopBar
          role="student"
          homePath="/student/projects"
          userName="Jane Student"
          onOpenAccount={onOpenAccount}
          navItems={[
            { label: 'Projects', to: '/student/projects', active: true },
            { label: 'Archive', to: '/student/archive', active: false },
          ]}
        />
      </MemoryRouter>,
    );

    const shell = container.querySelector('header > div');
    expect(shell?.className).toContain('px-4');
    expect(shell?.className).toContain('lg:flex-row');
    expect(screen.getByAltText('SuperviseSuite')).toHaveAttribute('height', '38');

    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Archive' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Open account menu' }).className).toContain(
      'sm:self-auto',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open account menu' }));
    expect(onOpenAccount).toHaveBeenCalledTimes(1);
  });

  it('toggles mobile navigation without affecting desktop branch classes', () => {
    useIsMobileLayoutMock.mockReturnValue(true);
    const onOpenAccount = vi.fn();
    const { container } = render(
      <MemoryRouter>
        <TopBar
          role="student"
          homePath="/student/projects"
          userName="Jane Student"
          onOpenAccount={onOpenAccount}
          navItems={[{ label: 'Projects', to: '/student/projects', active: true }]}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open account menu' }));
    expect(onOpenAccount).toHaveBeenCalledTimes(1);

    const mobileToggle = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');

    const navWrapper = mobileToggle.closest('div')?.nextElementSibling as HTMLElement;
    expect(navWrapper.className).toContain('hidden');

    fireEvent.click(mobileToggle);

    expect(screen.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(navWrapper.className).toContain('block');

    const shell = container.querySelector('header > div');
    expect(shell?.className).toContain('px-3');
  });

  it('renders public action buttons', () => {
    useIsMobileLayoutMock.mockReturnValue(false);
    const onLogin = vi.fn();
    const onRegister = vi.fn();

    render(
      <MemoryRouter>
        <TopBar
          mode="public"
          homePath="/"
          actions={[
            { label: 'Log in', variant: 'ghost', onClick: onLogin },
            { label: 'Register', variant: 'primary', onClick: onRegister },
          ]}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onRegister).toHaveBeenCalledTimes(1);
  });
});
