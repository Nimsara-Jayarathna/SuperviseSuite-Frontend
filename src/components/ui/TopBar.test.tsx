import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('keeps desktop private layout contract and account action', () => {
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

    const desktopHeader = container.querySelector('header.hidden.md\\:block') as HTMLElement | null;
    expect(desktopHeader).not.toBeNull();

    const shell = desktopHeader?.querySelector(':scope > div');
    expect(shell?.className).toContain('px-4');
    expect(shell?.className).toContain('lg:flex-row');
    expect(within(desktopHeader as HTMLElement).getByAltText('SuperviseSuite')).toHaveAttribute(
      'height',
      '38',
    );

    expect(
      within(desktopHeader as HTMLElement).getByRole('link', { name: 'Projects' }),
    ).toBeInTheDocument();
    expect(
      within(desktopHeader as HTMLElement).getByRole('link', { name: 'Archive' }),
    ).toBeInTheDocument();

    expect(
      within(desktopHeader as HTMLElement).getByRole('button', { name: 'Open account menu' })
        .className,
    ).toContain('sm:self-auto');

    fireEvent.click(
      within(desktopHeader as HTMLElement).getByRole('button', { name: 'Open account menu' }),
    );
    expect(onOpenAccount).toHaveBeenCalledTimes(1);
  });

  it('toggles mobile navigation without affecting desktop branch classes', () => {
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

    const mobileHeader = container.querySelector('header.md\\:hidden') as HTMLElement | null;
    expect(mobileHeader).not.toBeNull();

    fireEvent.click(
      within(mobileHeader as HTMLElement).getByRole('button', { name: 'Open account menu' }),
    );
    expect(onOpenAccount).toHaveBeenCalledTimes(1);

    const mobileToggle = within(mobileHeader as HTMLElement).getByRole('button', {
      name: 'Open navigation menu',
    });
    expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');

    const projectsLink = within(mobileHeader as HTMLElement).getByRole('link', {
      name: 'Projects',
    });
    const navWrapper = projectsLink.closest('nav')?.parentElement as HTMLElement;
    expect(navWrapper.className).toContain('hidden');

    fireEvent.click(mobileToggle);

    expect(screen.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(navWrapper.className).toContain('block');

    const shell = mobileHeader?.querySelector(':scope > div');
    expect(shell?.className).toContain('px-3');
  });

  it('renders public action buttons', () => {
    const onLogin = vi.fn();
    const onRegister = vi.fn();

    const { container } = render(
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

    const desktopHeader = container.querySelector('header.hidden.md\\:block') as HTMLElement | null;
    expect(desktopHeader).not.toBeNull();

    fireEvent.click(within(desktopHeader as HTMLElement).getByRole('button', { name: 'Log in' }));
    fireEvent.click(within(desktopHeader as HTMLElement).getByRole('button', { name: 'Register' }));
    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onRegister).toHaveBeenCalledTimes(1);
  });
});
