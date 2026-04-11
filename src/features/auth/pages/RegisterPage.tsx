import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { RegistrationPanel } from '../components/registration/RegistrationPanel';
import type { RegisterConfig } from '../types';

export function RegisterPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<RegisterConfig | null>(null);

  useEffect(() => {
    let mounted = true;
    void authApi.getRegisterConfig().then((value) => {
      if (!mounted) return;
      setConfig(value);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 py-12">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-pink-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      {config ? (
        <RegistrationPanel config={config} onClose={() => navigate('/')} />
      ) : (
        <div className="relative z-10 text-sm text-muted-foreground">Preparing registration…</div>
      )}
    </div>
  );
}
