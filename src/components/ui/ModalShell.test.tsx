import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ModalShell } from './ModalShell';

describe('ModalShell', () => {
  it('renders nothing when closed', () => {
    render(
      <ModalShell isOpen={false} containerClassName="fixed" onBackdropClick={() => {}}>
        <div>Content</div>
      </ModalShell>,
    );

    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('closes on Escape when enabled', () => {
    const onClose = vi.fn();

    render(
      <ModalShell isOpen containerClassName="fixed" onBackdropClick={onClose}>
        <div>Content</div>
      </ModalShell>,
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on Escape when disabled', () => {
    const onClose = vi.fn();

    render(
      <ModalShell isOpen containerClassName="fixed" onBackdropClick={onClose} closeOnEscape={false}>
        <div>Content</div>
      </ModalShell>,
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).toHaveBeenCalledTimes(0);
  });

  it('locks body scroll and restores it on close', () => {
    document.body.style.overflow = 'scroll';

    const { unmount } = render(
      <ModalShell isOpen containerClassName="fixed" lockBodyScroll onBackdropClick={() => {}}>
        <div>Content</div>
      </ModalShell>,
    );

    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('scroll');
  });
});
