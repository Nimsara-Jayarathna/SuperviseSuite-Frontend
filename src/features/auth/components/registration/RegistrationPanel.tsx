import { Button } from '@/components/ui/Button';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { RegisterConfig } from '../../types';
import { Step1EmailInput } from './Step1EmailInput';
import { Step2OTPVerify } from './Step2OTPVerify';
import { Step3RoleSelect } from './Step3RoleSelect';
import { Step4ProfileDetails } from './Step4ProfileDetails';
import { useRegistrationFlow } from '../../hooks/useRegistrationFlow';

type RegistrationPanelProps = {
  config?: RegisterConfig;
  inModal?: boolean;
  onClose: () => void;
};

const STEP_NUMBER: Record<'email' | 'otp' | 'role' | 'profile', number> = {
  email: 1,
  otp: 2,
  role: 3,
  profile: 4,
};

function SuccessCard({ onClose }: { onClose: () => void }) {
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      onClose();
    }
  }, [countdown, onClose]);

  return (
    <div className="space-y-3 py-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-foreground">Account created!</h3>
      <p className="text-sm text-muted-foreground">Redirecting to sign in in {countdown}s…</p>
    </div>
  );
}

export function RegistrationPanel({ config, inModal = false, onClose }: RegistrationPanelProps) {
  const flow = useRegistrationFlow();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const currentStep = STEP_NUMBER[flow.step];
  const lastStepRef = useRef(currentStep);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const progressed =
    flow.step !== 'email' || Boolean(flow.registrationToken) || Boolean(flow.inferredRole) || Boolean(flow.selectedRole);
  const effectiveConfig: RegisterConfig = config ?? {
    domainRestrictionEnabled: false,
    studentDomain: null,
    supervisorDomain: null,
  };

  useEffect(() => {
    if (currentStep > lastStepRef.current) {
      setDirection('right');
    } else if (currentStep < lastStepRef.current) {
      setDirection('left');
    }
    lastStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    if (inModal) return;
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handleDismissRequest();
      }
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  });

  function closeHard() {
    flow.dismiss();
    onClose();
  }

  function handleDismissRequest() {
    if (flow.step === 'email' && !progressed) {
      closeHard();
      return;
    }
    setShowCloseConfirm(true);
  }

  const stepContent = useMemo(() => {
    if (flow.isSuccess) {
      return <SuccessCard onClose={onClose} />;
    }
    switch (flow.step) {
      case 'email':
        return <Step1EmailInput flow={flow} config={effectiveConfig} />;
      case 'otp':
        return <Step2OTPVerify flow={flow} />;
      case 'role':
        return <Step3RoleSelect flow={flow} />;
      case 'profile':
        return <Step4ProfileDetails flow={flow} />;
      default:
        return null;
    }
  }, [flow, onClose, effectiveConfig]);

  return (
    <>
      {!inModal && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
          onClick={handleDismissRequest}
          aria-hidden="true"
        />
      )}

      <div className={`${inModal ? '' : 'fixed inset-0 z-50 flex items-center justify-center p-4'}`}>
        <div className="relative mx-auto w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl">
          {!flow.isSuccess && (
            <Button
              type="button"
              onClick={handleDismissRequest}
              aria-label="Close"
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4 h-7 w-7 rounded-full p-0"
            >
              ✕
            </Button>
          )}

          <div
            key={flow.step}
            className={
              flow.isSuccess
                ? ''
                : direction === 'right'
                  ? 'motion-safe:animate-[slideInFromRight_220ms_ease-out]'
                  : 'motion-safe:animate-[slideInFromLeft_220ms_ease-out]'
            }
          >
            {stepContent}
          </div>

          {showCloseConfirm && (
            <div className="absolute inset-6 z-20 flex items-center justify-center rounded-xl bg-background/95 p-4 shadow-lg">
              <div className="w-full rounded-xl border border-border bg-background p-4">
                <p className="text-sm text-foreground">
                  If you close this, you&apos;ll need to restart email verification.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" size="sm" fullWidth onClick={() => setShowCloseConfirm(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" fullWidth onClick={closeHard}>
                    Close anyway
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
