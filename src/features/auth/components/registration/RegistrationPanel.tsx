import { Button } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RegisterConfig } from '../../types';
import { Step1EmailInput } from './Step1EmailInput';
import { Step2OTPVerify } from './Step2OTPVerify';
import { Step3RoleSelect } from './Step3RoleSelect';
import { Step4ProfileDetails } from './Step4ProfileDetails';
import { useRegistrationFlow } from '../../hooks/useRegistrationFlow';
import { getBlockingErrorTitle, isBlockingError } from '@/utils/errorSeverity';
import { ModalShell } from '@/components/ui/ModalShell';
import { AuthDialogCard } from '../shell/AuthDialogCard';

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

const STEP_TITLE: Record<'email' | 'otp' | 'role' | 'profile', string> = {
  email: 'Enter your email',
  otp: 'Verify your email',
  role: 'Select your role',
  profile: 'Enter your details',
};

export function RegistrationPanel({
  config,
  inModal = false,
  onClose,
  onSwitchToLogin,
}: RegistrationPanelProps) {
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
  const stepTitle = STEP_TITLE[flow.step];
  const lastStepRef = useRef(currentStep);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const progressed =
    flow.step !== 'email' ||
    Boolean(flow.registrationToken) ||
    Boolean(flow.inferredRole) ||
    Boolean(flow.selectedRole);
  const effectiveConfig: RegisterConfig = useMemo(
    () =>
      config ?? {
        domainRestrictionEnabled: false,
        studentDomain: null,
        supervisorDomain: null,
        studentEmailPrefixRestrictionEnabled: false,
        studentEmailPrefixRegex: null,
      },
    [config],
  );
  const showProfileStateModal =
    flow.step === 'profile' && (flow.isLoading || !!flow.error || flow.isSuccess);
  const blockingError = isBlockingError(flow.error) ? flow.error : null;
  const showBlockingStateModal = flow.step !== 'profile' && !!blockingError;

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
    switch (flow.step) {
      case 'email':
        return <Step1EmailInput flow={flow} config={effectiveConfig} />;
      case 'otp':
        return <Step2OTPVerify flow={flow} />;
      case 'role':
        return <Step3RoleSelect flow={flow} />;
      case 'profile':
        return <Step4ProfileDetails flow={flow} config={effectiveConfig} />;
      default:
        return null;
    }
  }, [flow, effectiveConfig]);

  const panelContent = (
    <>
      {!inModal ? (
        <ModalShell
          isOpen
          containerClassName="fixed inset-0 z-50 flex items-center justify-center p-4"
          backdropClassName="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          onBackdropClick={handleDismissRequest}
          closeOnEscape
        >
          <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-pink-200/50 blur-3xl" />
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <AuthDialogCard
            headerVariant="modal"
            title={flow.isSuccess ? undefined : stepTitle}
            onClose={flow.isSuccess ? undefined : handleDismissRequest}
          >
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
          </AuthDialogCard>
        </ModalShell>
      ) : (
        <AuthDialogCard
          headerVariant="modal"
          title={flow.isSuccess ? undefined : stepTitle}
          onClose={flow.isSuccess ? undefined : handleDismissRequest}
        >
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
        </AuthDialogCard>
      )}

      <RequestStateModal
        isOpen={showCloseConfirm}
        status="warning"
        title="Close registration?"
        message="If you close this, you'll need to restart email verification."
        onClose={() => setShowCloseConfirm(false)}
        autoCloseOnSuccess={false}
        footer={
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setShowCloseConfirm(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="danger" size="md" onClick={closeHard}>
              Close anyway
            </Button>
          </div>
        }
      />

      <RequestStateModal
        isOpen={showBlockingStateModal}
        status="error"
        title={getBlockingErrorTitle(blockingError)}
        message={blockingError?.message ?? 'Please try again later.'}
        onClose={flow.clearError}
      />

      <RequestStateModal
        isOpen={showProfileStateModal}
        status={flow.isLoading ? 'loading' : flow.isSuccess ? 'success' : 'error'}
        title={
          flow.isLoading
            ? 'Creating your account'
            : flow.isSuccess
              ? 'Account created'
              : 'Registration failed'
        }
        message={
          flow.isLoading
            ? 'Please wait while we create your account.'
            : flow.isSuccess
              ? 'Your account is ready. Redirecting to sign in...'
              : (flow.error?.message ?? 'Something went wrong. Please try again.')
        }
        onClose={flow.isSuccess ? switchToLogin : flow.clearError}
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

  return panelContent;
}
