import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JiraBugRatioBar } from './JiraBugRatioBar';

describe('JiraBugRatioBar', () => {
  it('shows an explicit no-open-bugs label when ratio is zero', () => {
    render(<JiraBugRatioBar bugRatio={0} />);

    expect(screen.queryAllByText('No open bugs').length).toBeGreaterThan(0);
  });

  it('does not show no-open-bugs label when ratio is above zero', () => {
    render(<JiraBugRatioBar bugRatio={12.5} />);

    expect(screen.queryByText('No open bugs')).toBeNull();
    expect(screen.queryByText('12.5%')).not.toBeNull();
  });
});
