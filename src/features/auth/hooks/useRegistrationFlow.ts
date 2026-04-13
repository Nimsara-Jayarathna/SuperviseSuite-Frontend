import { useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { authApi } from '../api/authApi';
import type { RegistrationStep } from '../types';
import { validateEmail } from '../utils/registrationFlowValidation';

type RegistrationFlowState = {
  step: RegistrationStep;
  email: string;
  registrationToken: string;
  inferredRole: string | null;
  selectedRole: string | null;
  isLoading: boolean;
  error: ApiError | null;
  isSuccess: boolean;
};

function createUnexpectedError(): ApiError {
  return {
    code: 'INTERNAL_ERROR',
    message: 'Something went wrong. Please try again.',
    details: [],
    timestamp: new Date().toISOString(),
    status: 0,
    error: 'Unexpected Error',
    path: '',
    traceId: null,
  };
}

function makeValidationError(message: string): ApiError {
  return {
    code: 'VALIDATION_ERROR',
    message,
    details: [],
    timestamp: new Date().toISOString(),
    status: 400,
    error: 'Bad Request',
    path: '/api/auth/register/init',
    traceId: null,
  };
}

type UseRegistrationFlowOptions = {
  onSuccess?: () => void;
};

export function useRegistrationFlow(options: UseRegistrationFlowOptions = {}) {
  const isSliitStudent = (email: string) => email.toLowerCase().endsWith('@my.sliit.lk');
  const isSliitSupervisor = (email: string) =>
    email.toLowerCase().endsWith('@sliit.lk') && !email.toLowerCase().endsWith('@my.sliit.lk');
  const shouldSkipRoleStep = (email: string) => isSliitStudent(email) || isSliitSupervisor(email);

  const [state, setState] = useState<RegistrationFlowState>({
    step: 'email',
    email: '',
    registrationToken: '',
    inferredRole: null,
    selectedRole: null,
    isLoading: false,
    error: null,
    isSuccess: false,
  });

  const setLoading = () => setState((s) => ({ ...s, isLoading: true, error: null }));
  const setError = (error: ApiError) => setState((s) => ({ ...s, isLoading: false, error }));
  const setUnexpectedError = () => setError(createUnexpectedError());
  const clearError = () => setState((s) => ({ ...s, error: null }));

  async function submitEmail(email: string) {
    const err = validateEmail(email);
    if (err) {
      setError(makeValidationError(err));
      return;
    }
    setLoading();
    try {
      await authApi.registerInit({ email });
      setState((s) => ({ ...s, email, isLoading: false, step: 'otp' }));
    } catch (e) {
      if (isApiException(e)) setError(e.apiError);
      else setUnexpectedError();
    }
  }

  async function submitOtp(otp: string) {
    setLoading();
    try {
      const response = await authApi.registerVerify({ email: state.email, otp });
      const { registrationToken, requiresRoleSelection, role } = response;
      setState((s) => ({
        ...s,
        registrationToken,
        inferredRole: role,
        isLoading: false,
        step: requiresRoleSelection ? 'role' : 'profile',
      }));
    } catch (e) {
      if (isApiException(e)) setError(e.apiError);
      else setUnexpectedError();
    }
  }

  function selectRole(role: string) {
    setState((s) => ({ ...s, selectedRole: role, step: 'profile' }));
  }

  async function submitProfile(data: {
    firstName: string;
    lastName: string;
    password: string;
    registrationNumber?: string;
  }) {
    setLoading();
    try {
      await authApi.registerComplete({
        registrationToken: state.registrationToken,
        fname: data.firstName,
        lname: data.lastName,
        password: data.password,
        name: data.registrationNumber || undefined,
        role: state.inferredRole ? undefined : (state.selectedRole ?? undefined),
      });
      setState((s) => ({ ...s, isLoading: false, isSuccess: true }));
      options.onSuccess?.();
    } catch (e) {
      if (isApiException(e)) setError(e.apiError);
      else setUnexpectedError();
    }
  }

  async function resendOtp() {
    setLoading();
    try {
      await authApi.registerInit({ email: state.email });
      setState((s) => ({ ...s, isLoading: false, error: null }));
    } catch (e) {
      if (isApiException(e)) setError(e.apiError);
      else setUnexpectedError();
    }
  }

  function goBack() {
    setState((s) => {
      const prev: Record<RegistrationStep, RegistrationStep> = {
        otp: 'email',
        role: 'otp',
        profile: shouldSkipRoleStep(s.email) ? 'otp' : 'role',
        email: 'email',
      };
      return { ...s, step: prev[s.step], error: null };
    });
  }

  function dismiss() {
    setState({
      step: 'email',
      email: '',
      registrationToken: '',
      inferredRole: null,
      selectedRole: null,
      isLoading: false,
      error: null,
      isSuccess: false,
    });
  }

  const effectiveRole = state.inferredRole ?? state.selectedRole;

  return {
    ...state,
    effectiveRole,
    isSliitEmail: isSliitStudent(state.email) || isSliitSupervisor(state.email),
    shouldSkipRoleStep: shouldSkipRoleStep(state.email),
    clearError,
    submitEmail,
    submitOtp,
    selectRole,
    submitProfile,
    resendOtp,
    goBack,
    dismiss,
  };
}
