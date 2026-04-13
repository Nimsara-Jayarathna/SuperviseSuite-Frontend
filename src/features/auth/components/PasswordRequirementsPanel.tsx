import { CheckCircle2, Circle } from 'lucide-react';
import { getPassedRuleCount, getPasswordChecks, getPasswordStrengthFromChecks } from '../utils/passwordRules';

const STRENGTH_STYLES = {
  weak: { label: 'Weak', colorClass: 'bg-rose-500' },
  fair: { label: 'Fair', colorClass: 'bg-amber-500' },
  strong: { label: 'Strong', colorClass: 'bg-emerald-500' },
} as const;

type PasswordRequirementsPanelProps = {
  password: string;
  compact?: boolean;
};

export function PasswordRequirementsPanel({ password, compact = false }: PasswordRequirementsPanelProps) {
  const checks = getPasswordChecks(password);
  const passedCount = getPassedRuleCount(checks);
  const strength = getPasswordStrengthFromChecks(checks);
  const strengthWidth = `${(passedCount / 5) * 100}%`;

  const listClass = compact ? 'mt-2 space-y-1 text-xs' : 'mt-3 space-y-1.5 text-xs';

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Password requirements</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all ${STRENGTH_STYLES[strength].colorClass}`}
            style={{ width: strengthWidth }}
          />
        </div>
        <span className="text-xs font-medium text-slate-500">{STRENGTH_STYLES[strength].label}</span>
      </div>
      <ul className={listClass}>
        <RuleItem ok={checks.minLength} label="At least 8 characters" />
        <RuleItem ok={checks.uppercase} label="One uppercase letter" />
        <RuleItem ok={checks.lowercase} label="One lowercase letter" />
        <RuleItem ok={checks.digit} label="One digit" />
        <RuleItem ok={checks.special} label="One special character" />
      </ul>
    </div>
  );
}

function RuleItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-2 ${ok ? 'text-emerald-700' : 'text-slate-500'}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
      <span>{label}</span>
    </li>
  );
}

