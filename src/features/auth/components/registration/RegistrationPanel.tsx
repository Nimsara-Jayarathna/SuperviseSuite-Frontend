import { Button } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
  onSwitchToLogin?: () => void;
};

const STEP_NUMBER: Record<'email' | 'otp' | 'role' | 'profile', number> = {
  email: 1,
  otp: 2,
  role: 3,
  profile: 4,
};

function SuccessCard({ onDone }: { onDone: () => void }) {
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      onDone();
    }
  }, [countdown, onDone]);

  return (
    <div className="space-y-3 py-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-foreground">Account created!</h3>
      <p className="text-sm text-muted-foreground">Taking you to sign in in {countdown}s…</p>
    </div>
  );
}

export function RegistrationPanel({ config, inModal = false, onClose, onSwitchToLogin }: RegistrationPanelProps) {
  const navigate = useNavigate();
  const hasSwitchedToLoginRef = useRef(false);
  const switchToLogin = () => {
    if (hasSwitchedToLoginRef.current) return;
    hasSwitchedToLoginRef.current = true;
    if (onSwitchToLogin) {
      onSwitchToLogin();
      return;
    }
    navigate('/login');
  };
  const flow = useRegistrationFlow({ onSuccess: onSwitchToLogin ? switchToLogin : undefined });
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
  const handleSuccessDone = () => switchToLogin();

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
      return <SuccessCard onDone={handleSuccessDone} />;
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
  }, [flow, effectiveConfig, handleSuccessDone]);

  const panelContent = (
    <>
      {!inModal && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
          onClick={handleDismissRequest}
          aria-hidden="true"
        />
      )}

      <div className={`${inModal ? '' : 'fixed inset-0 z-50 flex items-center justify-center p-4'}`}>
        {!inModal && (
          <>
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-pink-200/50 blur-3xl" />
            <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          </>
        )}
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
        </div>
      </div>

      <RequestStateModal
        isOpen={showCloseConfirm}
        status="warning"
        title="Close registration?"
        message="If you close this, you'll need to restart email verification."
        onClose={() => setShowCloseConfirm(false)}
        autoCloseOnSuccess={false}
        footer={
          <div className="flex flex-wrap justify-center gap-3">
            <Button type="button" variant="secondary" size="md" onClick={() => setShowCloseConfirm(false)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" size="md" onClick={closeHard}>
              Close anyway
            </Button>
          </div>
        }
      />

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

  if (!inModal && typeof document !== 'undefined') {
    return createPortal(panelContent, document.body);
  }

  return panelContent;
}
