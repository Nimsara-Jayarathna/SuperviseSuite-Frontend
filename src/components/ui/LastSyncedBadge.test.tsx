import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LastSyncedBadge } from './LastSyncedBadge';

describe('LastSyncedBadge', () => {
  it('renders synced state with icon and tooltip', () => {
    render(<LastSyncedBadge lastSyncedAt="2026-04-14T11:35:00Z" />);

    expect(screen.getByText(/^Synced /)).toBeInTheDocument();
    const badge = screen.getByTitle(/2026/);
    expect(badge).toHaveAttribute('title');
    expect(badge.getAttribute('title')).toContain('2026');
  });

  it('renders fallback when timestamp is missing', () => {
    render(<LastSyncedBadge lastSyncedAt={null} fallbackText="Workspace connected" />);
    expect(screen.getByText('Workspace connected')).toBeInTheDocument();
  });

  it('keeps default icon size and tone classes', () => {
    const { container } = render(<LastSyncedBadge lastSyncedAt="2026-04-14T11:35:00Z" />);
    const icon = container.querySelector('svg');
    expect(icon?.className.baseVal ?? '').toContain('h-3.5');
    expect(icon?.className.baseVal ?? '').toContain('w-3.5');
    expect(icon?.className.baseVal ?? '').toContain('text-emerald-500');
  });
});
