import { Button } from '@/components/ui/Button';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { useRegistrationFlow } from '../../hooks/useRegistrationFlow';
import { validateOtp } from '../../utils/registrationFlowValidation';

type RegistrationFlow = ReturnType<typeof useRegistrationFlow>;

type Step2OTPVerifyProps = {
  flow: RegistrationFlow;
};

const OTP_LENGTH = 6;

function maskEmail(email: string) {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  return `${localPart.charAt(0)}***@${domain}`;
}

export function Step2OTPVerify({ flow }: Step2OTPVerifyProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(60);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const submitTimerRef = useRef<number | null>(null);
  const submittedOtpRef = useRef<string>('');

  const otp = useMemo(() => digits.join(''), [digits]);
  const otpError = flow.error?.message ?? validateOtp(otp);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const isComplete = /^\d{6}$/.test(otp);
    if (!isComplete || flow.isLoading || otp === submittedOtpRef.current) {
      return;
    }
    if (submitTimerRef.current) {
      window.clearTimeout(submitTimerRef.current);
    }
    submitTimerRef.current = window.setTimeout(() => {
      submittedOtpRef.current = otp;
      void flow.submitOtp(otp);
    }, 100);
    return () => {
      if (submitTimerRef.current) {
        window.clearTimeout(submitTimerRef.current);
      }
    };
  }, [otp, flow]);

  useEffect(() => {
    if (flow.error) {
      submittedOtpRef.current = '';
    }
  }, [flow.error]);

  async function handleResend() {
    await flow.resendOtp();
    setCountdown(60);
    setDigits(Array(OTP_LENGTH).fill(''));
    inputsRef.current[0]?.focus();
    submittedOtpRef.current = '';
  }

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    flow.clearError();
    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleBackspace(index: number, key: string) {
    if (key !== 'Backspace') return;
    if (digits[index]) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }
    if (index > 0) {
      inputsRef.current[index - 1]?.focus();
      setDigits((prev) => {
        const next = [...prev];
        next[index - 1] = '';
        return next;
      });
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((char, idx) => {
      next[idx] = char;
    });
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
    flow.clearError();
  }

  return (
    <div className="space-y-4">
      <div className="text-center text-sm text-muted-foreground">
        Sent to{' '}
        <button
          type="button"
          onClick={flow.goBack}
          className="font-medium text-foreground underline underline-offset-2"
        >
          {maskEmail(flow.email)}
        </button>
      </div>

      <div className={`flex justify-center gap-2 transition-opacity ${flow.isLoading ? 'opacity-60' : ''}`}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            value={digit}
            maxLength={1}
            inputMode="numeric"
            pattern="\d*"
            onPaste={index === 0 ? handlePaste : undefined}
            onChange={(e) => updateDigit(index, e.target.value)}
            onKeyDown={(e) => handleBackspace(index, e.key)}
            className="h-12 w-12 rounded-xl border border-border bg-background text-center text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        ))}
      </div>

      {flow.isLoading && <p className="text-center text-xs text-muted-foreground">Verifying code…</p>}
      {flow.error && <p className="text-center text-sm text-red-600">{otpError}</p>}

      <div className="text-center text-sm">
        {countdown > 0 ? (
          <span className="text-muted-foreground">
            Resend code in 0:{String(countdown).padStart(2, '0')}
          </span>
        ) : (
          <Button variant="link" size="sm" onClick={() => void handleResend()} disabled={flow.isLoading}>
            Resend code
          </Button>
        )}
      </div>
    </div>
  );
}
