import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { useRegistrationFlow } from '../../hooks/useRegistrationFlow';
import { validateOtp } from '../../utils/registrationFlowValidation';

type RegistrationFlow = ReturnType<typeof useRegistrationFlow>;

type Step2OTPVerifyProps = {
  flow: RegistrationFlow;
};

const OTP_LENGTH = 6;

export function Step2OTPVerify({ flow }: Step2OTPVerifyProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(60);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const [otpAction, setOtpAction] = useState<'verify' | 'resend' | null>(null);
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
      setOtpAction('verify');
      void flow.submitOtp(otp);
    }, 100);
    return () => {
      if (submitTimerRef.current) {
        window.clearTimeout(submitTimerRef.current);
      }
    };
  }, [otp, flow]);

  useEffect(() => {
    if (!flow.isLoading && !flow.error && otpAction === 'resend') {
      setOtpAction(null);
    }
  }, [flow.isLoading, flow.error, otpAction]);

  async function handleResend() {
    setOtpAction('resend');
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
    setOtpAction(null);
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
    setOtpAction(null);
  }

  const otpModalOpen = flow.isLoading || (Boolean(flow.error) && otpAction !== null);
  const otpModalTitle = flow.isLoading
    ? otpAction === 'resend'
      ? 'Resending verification code'
      : 'Verifying code'
    : otpAction === 'resend'
      ? 'Could not resend code'
      : 'Verification failed';
  const otpModalMessage = flow.isLoading
    ? otpAction === 'resend'
      ? 'Sending a new OTP to your email...'
      : 'Checking your 6-digit code...'
    : otpAction === 'verify'
      ? (otpError ?? flow.error?.message ?? 'Invalid or expired OTP. Please try again.')
      : (flow.error?.message ?? 'Something went wrong. Please try again.');

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2 text-center">
        <h3 className="text-xl font-semibold text-foreground">Check your email</h3>
        <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to your email.</p>
        <button
          type="button"
          onClick={flow.goBack}
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline underline-offset-2"
        >
          <span aria-hidden="true">←</span>
          <span>Change {flow.email}</span>
        </button>
      </div>

      <div
        className={`flex justify-center gap-1.5 transition-opacity ${flow.isLoading ? 'opacity-60' : ''}`}
      >
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
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            aria-label={`OTP digit ${index + 1}`}
            className={cn(
              'h-11 w-11 rounded-xl border text-center text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30',
              digit ? 'bg-slate-100 border-slate-300' : 'bg-background border-border',
              focusedIndex === index && 'border-primary ring-2 ring-primary/20',
            )}
          />
        ))}
      </div>

      <div className="text-center text-sm">
        {countdown > 0 ? (
          <span className="text-slate-700">
            Resend code in 0:{String(countdown).padStart(2, '0')}
          </span>
        ) : (
          <Button
            variant="link"
            size="sm"
            onClick={() => void handleResend()}
            disabled={flow.isLoading}
            className="font-semibold text-sky-700 hover:text-sky-800"
          >
            Resend code
          </Button>
        )}
      </div>

      <RequestStateModal
        isOpen={otpModalOpen}
        status={flow.isLoading ? 'loading' : 'error'}
        title={otpModalTitle}
        message={otpModalMessage}
        onClose={
          flow.isLoading
            ? undefined
            : () => {
                if (otpAction === 'verify') {
                  setDigits(Array(OTP_LENGTH).fill(''));
                  inputsRef.current[0]?.focus();
                  submittedOtpRef.current = '';
                }
                flow.clearError();
                setOtpAction(null);
              }
        }
        autoCloseOnSuccess={false}
      />
    </div>
  );
}
