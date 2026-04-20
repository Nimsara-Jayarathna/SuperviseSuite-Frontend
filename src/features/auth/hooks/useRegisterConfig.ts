import { useCallback, useEffect, useRef, useState } from 'react';
import { authApi } from '../api/authApi';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import type { RegisterConfig } from '../types';

type UseRegisterConfigOptions = {
  autoLoad?: boolean;
  fallbackMessage: string;
};

type UseRegisterConfigResult = {
  config: RegisterConfig | null;
  isLoading: boolean;
  error: ApiError | null;
  clearError: () => void;
  reload: () => Promise<RegisterConfig | null>;
};

function toRegisterConfigError(error: unknown, fallbackMessage: string): ApiError {
  if (isApiException(error)) {
    return error.apiError;
  }

  return {
    code: 'SERVICE_UNAVAILABLE',
    message: fallbackMessage,
    details: [],
    timestamp: new Date().toISOString(),
    status: 503,
    error: 'Service Unavailable',
    path: '/api/auth/register/config',
    traceId: null,
  };
}

export function useRegisterConfig({
  autoLoad = true,
  fallbackMessage,
}: UseRegisterConfigOptions): UseRegisterConfigResult {
  const [config, setConfig] = useState<RegisterConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const activeRequestIdRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++activeRequestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const loadedConfig = await authApi.getRegisterConfig();
      if (activeRequestIdRef.current !== requestId) {
        return null;
      }
      setConfig(loadedConfig);
      return loadedConfig;
    } catch (unknownError) {
      if (activeRequestIdRef.current !== requestId) {
        return null;
      }
      setError(toRegisterConfigError(unknownError, fallbackMessage));
      return null;
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [fallbackMessage]);

  useEffect(() => {
    if (!autoLoad) return;
    void reload();
  }, [autoLoad, reload]);

  return { config, isLoading, error, clearError: () => setError(null), reload };
}
