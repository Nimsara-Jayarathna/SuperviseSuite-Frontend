import type { ReactNode } from 'react';
import { buttonStyles } from '@/components/ui/Button';

type IconActionButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: ReactNode;
  title?: string;
};

export function IconActionButton({
  label,
  onClick,
  disabled = false,
  icon,
  title,
}: IconActionButtonProps) {
  return (
    <button
      type="button"
      className={buttonStyles({ variant: 'secondary', size: 'sm' })}
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
