import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LifecycleTiles } from './LifecycleTiles';
import { LIFECYCLE_VALUES } from './lifecycleConstants';

describe('LifecycleTiles', () => {
  it('renders all lifecycle options', () => {
    render(<LifecycleTiles value="ACTIVE" options={LIFECYCLE_VALUES} onChange={() => {}} />);

    expect(screen.getByRole('radiogroup', { name: 'Select lifecycle status' })).toBeInTheDocument();
    for (const value of LIFECYCLE_VALUES) {
      expect(
        screen.getByRole('radio', { name: new RegExp(String(value).replace(/_/g, ' ')) }),
      ).toBeInTheDocument();
    }
  });

  it('calls onChange when selecting a different option', () => {
    const onChange = vi.fn();
    render(<LifecycleTiles value="ACTIVE" options={LIFECYCLE_VALUES} onChange={onChange} />);

    fireEvent.click(screen.getByRole('radio', { name: /AT RISK/i }));
    expect(onChange).toHaveBeenCalledWith('AT_RISK');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(
      <LifecycleTiles value="ACTIVE" disabled options={LIFECYCLE_VALUES} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole('radio', { name: /BEHIND/i }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
