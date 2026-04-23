import PasswordStrengthBar from 'react-password-strength-bar';
import { useMemo, useState } from 'react';
import {
  getPasswordChecks,
  isPasswordPolicyPassed,
  PASSWORD_MIN_LENGTH,
} from '../utils/passwordRules';

type PasswordRequirementsPanelProps = {
  password: string;
  compact?: boolean;
  isNewPasswordFocused?: boolean;
};

export function PasswordRequirementsPanel({
  password,
  compact = false,
  isNewPasswordFocused = false,
}: PasswordRequirementsPanelProps) {
  const [strengthScore, setStrengthScore] = useState(0);
  const remainingCharacters = Math.max(0, PASSWORD_MIN_LENGTH - (password?.length ?? 0));
  const spacingClass = compact ? 'space-y-2' : 'space-y-3';
  const passwordChecks = getPasswordChecks(password);
  const isPolicyPassed = isPasswordPolicyPassed(passwordChecks);
  const isStrong = strengthScore >= 4 && isPolicyPassed;

  const mode = useMemo<'hidden' | 'full' | 'compactSuccess'>(() => {
    if (!isNewPasswordFocused && password.length === 0) return 'hidden';
    if (isNewPasswordFocused) return 'full';
    if (isStrong) return 'compactSuccess';
    return 'full';
  }, [isNewPasswordFocused, isStrong, password.length]);

  const revealClass =
    mode === 'hidden'
      ? 'pointer-events-none max-h-0 -translate-y-1 opacity-0'
      : mode === 'compactSuccess'
        ? 'max-h-14 translate-y-0 opacity-100'
        : 'max-h-72 translate-y-0 opacity-100';

  return (
    <div
      aria-hidden={mode === 'hidden'}
      className={`overflow-hidden transition-all duration-200 ease-out ${revealClass}`}
    >
      {mode === 'compactSuccess' ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          ✓ Strong password
        </div>
      ) : (
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
            onChangeScore={(score) => setStrengthScore(score)}
          />
        </div>
      )}
    </div>
  );
}
