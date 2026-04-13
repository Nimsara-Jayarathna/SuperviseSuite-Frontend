import { Input } from '@/components/ui/Input';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useId } from 'react';
import { PASSWORD_INPUT_CLASS, PASSWORD_LABEL_CLASS } from './passwordFieldStyles';

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  mismatch?: boolean;
  showMismatch?: boolean;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  isVisible,
  onToggleVisibility,
  mismatch = false,
  showMismatch = false,
  maxLength,
  onFocus,
  onBlur,
}: PasswordFieldProps) {
  const tooltipId = useId();
  const showTooltip = Boolean(showMismatch && mismatch);
  const isAtMax = typeof maxLength === 'number' && value.length >= maxLength;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className={PASSWORD_LABEL_CLASS}>
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className={PASSWORD_INPUT_CLASS}
          aria-describedby={showTooltip ? tooltipId : undefined}
        />

        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
          {showMismatch ? (
            <span className="group relative inline-flex" tabIndex={0}>
              <AlertCircle
                className={`h-4 w-4 ${mismatch ? 'text-rose-600' : 'text-emerald-600'}`}
              />
              {showTooltip ? (
                <span
                  id={tooltipId}
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block group-focus-visible:block"
                >
                  Passwords do not match.
                </span>
              ) : null}
            </span>
          ) : null}

          <button
            type="button"
            onClick={onToggleVisibility}
            className="inline-flex h-6 w-6 items-center justify-center text-slate-500 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            aria-label={isVisible ? 'Hide password' : 'Show password'}
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {isAtMax ? (
        <p className="text-xs text-amber-600">Maximum {maxLength} characters reached.</p>
      ) : null}
    </div>
  );
}
