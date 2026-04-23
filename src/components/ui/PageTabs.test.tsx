import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PageTabs } from './PageTabs';

describe('PageTabs', () => {
  it('calls onChange for clicked tab', () => {
    const onChange = vi.fn();

    render(
      <PageTabs
        value="overview"
        onChange={onChange}
        items={[
          { value: 'overview', label: 'Overview' },
          { value: 'team', label: 'Team' },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Team' }));
    expect(onChange).toHaveBeenCalledWith('team');
  });

  it('keeps tab labels non-wrapping for horizontal scroll behavior', () => {
    render(
      <PageTabs
        value="overview"
        onChange={() => {}}
        items={[
          { value: 'overview', label: 'Overview' },
          { value: 'long-tab', label: 'Very long tab label' },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Very long tab label' }).className).toContain(
      'whitespace-nowrap',
    );
  });
});
