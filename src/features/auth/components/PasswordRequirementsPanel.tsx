import PasswordStrengthBar from 'react-password-strength-bar';
import { PASSWORD_MIN_LENGTH } from '../utils/passwordRules';

type PasswordRequirementsPanelProps = {
  password: string;
  compact?: boolean;
  visible?: boolean;
};

export function PasswordRequirementsPanel({
  password,
  compact = false,
  visible = true,
}: PasswordRequirementsPanelProps) {
  const remainingCharacters = Math.max(0, PASSWORD_MIN_LENGTH - (password?.length ?? 0));
  const spacingClass = compact ? 'space-y-2' : 'space-y-3';
  const revealClass = visible
    ? 'max-h-72 translate-y-0 opacity-100'
    : 'pointer-events-none max-h-0 -translate-y-1 opacity-0';

  return (
    <div
      aria-hidden={!visible}
      className={`overflow-hidden transition-all duration-200 ease-out ${revealClass}`}
    >
      <div className={`rounded-2xl border border-slate-200 bg-slate-50/70 p-3 ${spacingClass}`}>
        <div className="text-sm text-slate-700">
          <p className="font-semibold">Requirement: At least {PASSWORD_MIN_LENGTH} characters.</p>
          <p className="mt-1 text-sky-700">
            Tip: The strongest passwords are long phrases. We recommend using a memorable sentence
            or combining 3 to 4 unrelated words.
          </p>
        </div>
        {password.length > 0 && remainingCharacters > 0 ? (
          <p className="text-xs text-rose-600">Needs {remainingCharacters} more characters...</p>
        ) : null}
        <PasswordStrengthBar
          password={password}
          minLength={PASSWORD_MIN_LENGTH}
          scoreWords={['Very Weak', 'Weak', 'Okay', 'Good', 'Strong!']}
          shortScoreWord="Too short"
        />
      </div>
    </div>
  );
}
